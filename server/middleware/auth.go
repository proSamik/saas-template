// Package middleware provides HTTP middleware functions for the application
package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

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
		// Log request details
		log.Printf("[Auth Middleware] Request received - Method: %s, Path: %s", r.Method, r.URL.Path)
		log.Printf("[Auth Middleware] Request headers: %+v", r.Header)

		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("[Auth Middleware] No Authorization header found")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.Printf("[Auth Middleware] Invalid token format - missing 'Bearer' prefix")
			http.Error(w, "Invalid token format", http.StatusUnauthorized)
			return
		}

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				log.Printf("[Auth Middleware] Invalid signing method: %v", token.Header["alg"])
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return m.jwtSecret, nil
		})

		if err != nil {
			log.Printf("[Auth Middleware] Token parsing error: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Validate token claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			log.Printf("[Auth Middleware] Invalid token claims")
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Check token type
		tokenType, ok := claims["type"].(string)
		if !ok || tokenType != "access" {
			log.Printf("[Auth Middleware] Invalid token type: %v", tokenType)
			http.Error(w, "Invalid token type", http.StatusUnauthorized)
			return
		}

		// Check if token is blacklisted
		if jti, ok := claims["jti"].(string); ok {
			blacklisted, err := m.db.IsTokenBlacklisted(jti)
			if err != nil {
				log.Printf("[Auth Middleware] Error checking token blacklist: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			if blacklisted {
				log.Printf("[Auth Middleware] Token is blacklisted: %s", jti)
				http.Error(w, "Token is invalid", http.StatusUnauthorized)
				return
			}
		}

		// Token is valid, proceed with request
		log.Printf("[Auth Middleware] Token validated successfully for user: %v", claims["sub"])
		next.ServeHTTP(w, r)
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
