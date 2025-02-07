// Package handlers provides helper functions for authentication and token management
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"saas-server/middleware"
)

// UpdateProfileRequest represents the request body for profile update endpoint
type UpdateProfileRequest struct {
	Name  string `json:"name"`  // New display name
	Email string `json:"email"` // New email address
}

// RefreshToken handles token refresh endpoint (POST /auth/refresh)
// It validates the refresh token and issues new access and refresh tokens
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// Apply stricter rate limiting for refresh token endpoint - 3 attempts per 5 minutes
	refreshLimiter := middleware.NewRateLimiter(5*time.Minute, 3)
	handler := refreshLimiter.Limit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log request details
		log.Printf("[Auth] Refresh token request received from IP: %s", r.RemoteAddr)

		// Get old access token from cookie
		accessCookie, err := r.Cookie("access_token")
		if err == nil && accessCookie.Value != "" {
			// Parse and validate the old access token
			if oldToken, err := jwt.Parse(accessCookie.Value, func(token *jwt.Token) (interface{}, error) {
				return h.jwtSecret, nil
			}); err == nil && oldToken.Valid {
				if claims, ok := oldToken.Claims.(jwt.MapClaims); ok {
					if jti, ok := claims["jti"].(string); ok {
						userID := claims["sub"].(string)
						exp := int64(claims["exp"].(float64))
						// Add old token to blacklist
						log.Printf("[Auth] Attempting to blacklist old access token - JTI: %s, UserID: %s", jti, userID)
						if err := h.db.AddToBlacklist(jti, userID, time.Unix(exp, 0)); err != nil {
							log.Printf("[Auth] Error blacklisting old access token: %v", err)
						} else {
							log.Printf("[Auth] Successfully blacklisted old access token - JTI: %s", jti)
						}
					}
				}
			}
		}

		if r.Method != http.MethodPost {
			log.Printf("[Auth] Invalid method: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract refresh token from HTTP-only cookie
		cookie, err := r.Cookie("refresh_token")
		if err != nil {
			log.Printf("[Auth] Refresh token cookie not found: %v", err)
			http.Error(w, "Refresh token not found", http.StatusUnauthorized)
			return
		}
		log.Printf("[Auth] Refresh token cookie found: %s", cookie.Value)

		// Verify CSRF token
		csrfToken := r.Header.Get("X-CSRF-Token")
		csrfCookie, err := r.Cookie("csrf_token")
		if err != nil || csrfToken == "" || csrfToken != csrfCookie.Value {
			log.Printf("[Auth] CSRF validation failed - Token: %s, Cookie: %v, Error: %v",
				csrfToken, csrfCookie, err)
			http.Error(w, "Invalid CSRF token", http.StatusUnauthorized)
			return
		}

		// Get device info and IP address
		deviceInfo := r.Header.Get("User-Agent")
		ipAddress := r.RemoteAddr
		if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
			ipAddress = forwardedFor
		}

		// Parse and validate the refresh token
		refreshToken, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return h.jwtRefreshSecret, nil
		})

		if err != nil {
			log.Printf("[Auth] Error parsing refresh token: %v", err)
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		// Validate claims
		claims, ok := refreshToken.Claims.(jwt.MapClaims)
		if !ok || !refreshToken.Valid {
			log.Printf("[Auth] Invalid refresh token claims")
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		// Extract JTI and verify token in database
		jti, ok := claims["jti"].(string)
		if !ok {
			log.Printf("[Auth] Missing JTI claim in refresh token")
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		// Verify refresh token in database using the JTI
		storedToken, err := h.db.GetRefreshToken(jti)
		if err != nil {
			log.Printf("[Auth] Error verifying refresh token in database: %v", err)
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		if storedToken == nil {
			log.Printf("[Auth] Refresh token not found in database")
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		userID := storedToken.UserID

		// Generate new tokens with enhanced security
		accessExp := time.Now().Add(5 * time.Minute)

		// Generate JTI for token tracking
		jti = uuid.New().String()

		// Create new access token with minimal claims
		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":  userID,
			"exp":  accessExp.Unix(),
			"jti":  jti,
			"type": "access",
		})

		accessTokenString, err := accessToken.SignedString(h.jwtSecret)
		if err != nil {
			http.Error(w, "Error generating access token", http.StatusInternalServerError)
			return
		}

		// Generate new refresh token with device binding
		refreshExp := time.Now().Add(7 * 24 * time.Hour)
		refreshJti := uuid.New().String()
		refreshToken = jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":  userID,
			"exp":  refreshExp.Unix(),
			"jti":  refreshJti,
			"type": "refresh",
		})

		refreshTokenString, err := refreshToken.SignedString(h.jwtRefreshSecret)
		if err != nil {
			log.Printf("[Auth] Error generating refresh token: %v", err)
			http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
			return
		}

		// Store refresh token in database with device info
		log.Printf("[Auth] Storing refresh token in database - UserID: %s, JTI: %s, Device: %s, IP: %s, Expires: %v",
			userID, refreshJti, deviceInfo, ipAddress, refreshExp)
		if err := h.db.CreateRefreshToken(userID, refreshJti, deviceInfo, ipAddress, refreshExp); err != nil {
			http.Error(w, "Error storing refresh token", http.StatusInternalServerError)
			return
		}

		// Set access token in HTTP-only cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    accessTokenString,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Expires:  refreshExp,
		})

		// Set new refresh token in HTTP-only cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshTokenString,
			Path:     "/auth/refresh",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Expires:  refreshExp,
		})

		// Generate new CSRF token
		newCSRFToken := uuid.New().String()
		http.SetCookie(w, &http.Cookie{
			Name:     "csrf_token",
			Value:    newCSRFToken,
			Path:     "/",
			HttpOnly: false,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Expires:  refreshExp,
		})

		// Get user details for response
		user, err := h.db.GetUserByID(userID)
		if err != nil {
			http.Error(w, "Error fetching user details", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AuthResponse{
			ID:    userID,
			Name:  user.Name,
			Email: user.Email,
		})
	}))
	handler.ServeHTTP(w, r)
}

// UpdateProfile handles user profile update endpoint (PUT /user/profile)
// It requires authentication and updates the user's profile information
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		log.Printf("[Auth] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		log.Printf("[Auth] Unauthorized request to update profile")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body for profile update: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Updating profile for user: %s", userID)
	if err := h.db.UpdateUser(userID, req.Name, req.Email); err != nil {
		log.Printf("[Auth] Failed to update profile: %v", err)
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	user, err := h.db.GetUserByID(userID)
	if err != nil {
		log.Printf("[Auth] Failed to get updated user: %v", err)
		http.Error(w, "Failed to get updated user", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Profile updated successfully for user: %s", userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
	})
}

// validateToken validates a JWT token and returns the parsed token if valid
func (h *AuthHandler) validateToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return h.jwtSecret, nil
	})

	if err != nil {
		log.Printf("[Auth] Token validation error: %v", err)
		return nil, err
	}

	// Check if token is valid and has required claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Extract token ID and user ID
		jti, ok1 := claims["jti"].(string)
		_, ok2 := claims["sub"].(string)

		if !ok1 || !ok2 {
			log.Printf("[Auth] Token missing required claims")
			return nil, fmt.Errorf("token missing required claims")
		}

		// Check if token is blacklisted
		blacklisted, err := h.db.IsTokenBlacklisted(jti)
		if err != nil {
			log.Printf("[Auth] Error checking token blacklist: %v", err)
			return nil, fmt.Errorf("error checking token blacklist")
		}

		if blacklisted {
			log.Printf("[Auth] Token is blacklisted: %s", jti)
			return nil, fmt.Errorf("token is blacklisted")
		}
	}

	return token, nil
}

// validatePassword checks if a password meets security requirements
func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}
	if !regexp.MustCompile(`[A-Z]`).MatchString(password) {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !regexp.MustCompile(`[a-z]`).MatchString(password) {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !regexp.MustCompile(`[0-9]`).MatchString(password) {
		return fmt.Errorf("password must contain at least one number")
	}
	if !regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(password) {
		return fmt.Errorf("password must contain at least one special character")
	}
	return nil
}
