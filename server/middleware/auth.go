// Package middleware provides HTTP middleware functions for the application
package middleware

import (
	"context"
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

// UserIDContextKey is the exported string version of UserIDKey for external use
const UserIDContextKey = "userID"

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
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"message":"Authorization header required"}`, http.StatusUnauthorized)
			return
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Check if session is valid and not expired
		sessionValid, err := m.db.IsSessionValid(tokenString)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"message":"Error validating session"}`, http.StatusInternalServerError)
			return
		}
		if !sessionValid {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"message":"Session has expired or been invalidated"}`, http.StatusUnauthorized)
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
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"message":"Invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Extract claims and add user ID to context
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Explicit expiration check
			if exp, ok := claims["exp"].(float64); !ok || time.Now().Unix() > int64(exp) {
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"message":"Token has expired"}`, http.StatusUnauthorized)
				return
			}

			// Validate JTI claim
			jti, ok := claims["jti"].(string)
			if !ok || jti == "" {
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"message":"Invalid token ID"}`, http.StatusUnauthorized)
				return
			}

			// Update session activity
			if err := m.db.UpdateSessionActivity(tokenString); err != nil {
				log.Printf("Error updating session activity: %v", err)
			}

			// Store user ID in context using both the typed and string keys for compatibility
			ctx := context.WithValue(r.Context(), UserIDKey, claims["sub"])
			ctx = context.WithValue(ctx, UserIDContextKey, claims["sub"])
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"message":"Invalid token claims"}`, http.StatusUnauthorized)
		}
	})
}

// GetUserID retrieves the user ID from the context
// Returns an empty string if the user ID is not found in the context
func GetUserID(ctx context.Context) string {
	// Try getting the value using the typed key first
	if userID, ok := ctx.Value(UserIDKey).(string); ok {
		return userID
	}
	// Fall back to string key if typed key fails
	if userID, ok := ctx.Value(UserIDContextKey).(string); ok {
		return userID
	}
	return ""
}
