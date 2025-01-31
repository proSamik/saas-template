// Package middleware provides HTTP middleware functions for the application
package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"strings"
	"time"

	"saas-server/database"

	"github.com/golang-jwt/jwt/v5"
)

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

// UserIDKey is the context key for storing the user ID
const UserIDKey contextKey = "userID"

// AuthMiddleware handles JWT authentication for protected routes
type AuthMiddleware struct {
	db        *database.DB // Database connection for user operations
	jwtSecret []byte       // Secret key for JWT signing and validation
}

// NewAuthMiddleware creates a new AuthMiddleware instance
func NewAuthMiddleware(db *database.DB, jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		db:        db,
		jwtSecret: []byte(jwtSecret),
	}
}

// RequireAuth is a middleware that checks for a valid JWT token in the Authorization header
// If the token is valid, it adds the user ID to the request context
func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Check if token is blacklisted
		blacklisted, err := m.db.IsTokenBlacklisted(tokenString)
		if err != nil {
			http.Error(w, "Error validating token", http.StatusInternalServerError)
			return
		}
		if blacklisted {
			http.Error(w, "Token has been revoked", http.StatusUnauthorized)
			return
		}

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return m.jwtSecret, nil
		})

		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Extract claims and add user ID to context
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Explicit expiration check
			if exp, ok := claims["exp"].(float64); !ok || time.Now().Unix() > int64(exp) {
				http.Error(w, "Token has expired", http.StatusUnauthorized)
				return
			}

			// Validate token fingerprint
			expectedFingerprint := generateTokenFingerprint(r)
			tokenFingerprint, ok := claims["fgp"].(string)
			if !ok || tokenFingerprint != expectedFingerprint {
				// Suspicious activity detected - rotate token
				if err := m.db.InvalidateSession(tokenString); err != nil {
					log.Printf("Error invalidating suspicious session: %v", err)
				}
				http.Error(w, "Invalid token binding - please reauthenticate", http.StatusUnauthorized)
				return
			}

			// Validate JTI claim
			jti, ok := claims["jti"].(string)
			if !ok || jti == "" {
				http.Error(w, "Invalid token ID", http.StatusUnauthorized)
				return
			}

			// Update session activity
			if err := m.db.UpdateSessionActivity(tokenString); err != nil {
				log.Printf("Error updating session activity: %v", err)
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims["sub"])
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		}
	})
}

// GetUserID retrieves the user ID from the context
// Returns an empty string if the user ID is not found in the context
func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(UserIDKey).(string); ok {
		return userID
	}
	return ""
}

// generateTokenFingerprint creates a unique fingerprint for token binding
// using client-specific attributes like User-Agent and IP address
func generateTokenFingerprint(r *http.Request) string {
	// Get client IP, checking for proxy headers first
	clientIP := r.Header.Get("X-Forwarded-For")
	if clientIP == "" {
		clientIP = r.Header.Get("X-Real-IP")
	}
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}
	// Remove port number if present
	if i := strings.LastIndex(clientIP, ":"); i != -1 {
		clientIP = clientIP[:i]
	}

	// Get User-Agent
	userAgent := r.UserAgent()

	// Combine values and hash
	data := clientIP + "|" + userAgent
	hash := sha256.Sum256([]byte(data))

	// Return hex-encoded hash
	return hex.EncodeToString(hash[:])
}
