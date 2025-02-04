// Package handlers provides HTTP request handlers for the SaaS platform's API endpoints.
// It includes authentication, user management, and other core functionality handlers.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	goauth "golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleauth "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"

	"saas-server/database"
	"saas-server/middleware"

	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests and manages user sessions
// GoogleAuthRequest represents the request body for Google OAuth authentication
type GoogleAuthRequest struct {
	Code string `json:"code"` // Authorization code from Google OAuth
}

type AuthHandler struct {
	db                 database.DBInterface
	jwtSecret          []byte
	jwtRefreshSecret   []byte
	authLimiter        *middleware.RateLimiter
	googleClientID     string
	googleClientSecret string
	googleRedirectURL  string
}

// RegisterRequest represents the request body for user registration endpoint
type RegisterRequest struct {
	Name     string `json:"name"`     // User's display name
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // User's chosen password
}

// LoginRequest represents the request body for user login endpoint
type LoginRequest struct {
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // User's password
}

// AuthResponse represents the response body for successful authentication operations
type AuthResponse struct {
	ID          string `json:"id"`           // User's unique identifier
	Token       string `json:"token"`        // JWT access token
	ExpiresAt   int64  `json:"expiresAt"`    // Access token expiration timestamp
	Name        string `json:"name"`         // User's display name
	Email       string `json:"email"`        // User's email address
	AccessToken string `json:"access_token"` // Google OAuth access token
	IDToken     string `json:"id_token"`     // Google OAuth ID token
	User        struct {
		Email string `json:"email"` // User's Google email
		Name  string `json:"name"`  // User's Google display name
		Image string `json:"image"` // User's Google profile image URL
	} `json:"user"`
}

// UpdateProfileRequest represents the request body for profile update endpoint
type UpdateProfileRequest struct {
	Name  string `json:"name"`  // New display name
	Email string `json:"email"` // New email address
}

// UpdatePasswordRequest represents the request body for password update endpoint
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"` // User's current password
	NewPassword     string `json:"newPassword"`     // User's new password
}

// AccountPasswordResetRequest represents the request body for account password reset endpoint
type AccountPasswordResetRequest struct {
	CurrentPassword string `json:"currentPassword"` // User's current password
	NewPassword     string `json:"newPassword"`     // User's new password
}

// RequestPasswordResetRequest represents the request body for password reset request
type RequestPasswordResetRequest struct {
	Email string `json:"email"` // User's email address
}

// ResetPasswordRequest represents the request body for password reset
type ResetPasswordRequest struct {
	Token       string `json:"token"`       // Password reset token
	NewPassword string `json:"password"` 	// New password to set
}

// NewAuthHandler creates a new AuthHandler instance with the given database connection and JWT secret
func NewAuthHandler(db database.DBInterface, jwtSecret string) *AuthHandler {
	// Create rate limiter for auth endpoints - 5 attempts per minute
	authLimiter := middleware.NewRateLimiter(time.Minute, 5)

	return &AuthHandler{
		db:                 db,
		jwtSecret:          []byte(jwtSecret),
		jwtRefreshSecret:   []byte(jwtSecret), // Using same secret for now, could be different in production
		authLimiter:        authLimiter,
		googleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		googleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		googleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	}
}

func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Initialize OAuth2 config
	config := &goauth.Config{
		ClientID:     h.googleClientID,
		ClientSecret: h.googleClientSecret,
		RedirectURL:  h.googleRedirectURL, // This matches the redirect URI in Google Console
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
	// Exchange authorization code for token
	token, err := config.Exchange(context.Background(), req.Code)
	log.Printf("[Auth] Exchanging code with redirect URI: %s, received code: %s", config.RedirectURL, req.Code)
	if err != nil {
		log.Printf("[Auth] Failed to exchange auth code: %v", err)
		http.Error(w, "Failed to authenticate with Google", http.StatusUnauthorized)
		return
	}

	// Get user info using oauth2 service
	oauth2Service, err := googleauth.NewService(context.Background(), option.WithTokenSource(config.TokenSource(context.Background(), token)))
	if err != nil {
		log.Printf("[Auth] Failed to create OAuth2 service: %v", err)
		http.Error(w, "Failed to verify Google credentials", http.StatusInternalServerError)
		return
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		log.Printf("[Auth] Failed to get user info: %v", err)
		http.Error(w, "Failed to get user information", http.StatusInternalServerError)
		return
	}

	// Verify the user exists or create a new one
	user, err := h.db.GetUserByEmail(userInfo.Email)
	if err != nil {
		if err == database.ErrNotFound || err.Error() == "sql: no rows in result set" {
			// Create new user with Google provider and verified email
			user, err = h.db.CreateUser(userInfo.Email, "", userInfo.Name)
			if err != nil {
				log.Printf("[Auth] Failed to create user: %v", err)
				http.Error(w, "Failed to create user", http.StatusInternalServerError)
				return
			}

			// Update additional user fields
			if err := h.db.UpdateUserFields(user.ID, true, "google"); err != nil {
				log.Printf("[Auth] Failed to update user fields: %v", err)
			}
		} else {
			log.Printf("[Auth] Database error while checking user: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	}

	// Generate JWT token
	accessExp := time.Now().Add(15 * time.Minute)
	jti := uuid.New().String()

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"exp":  accessExp.Unix(),
		"jti":  jti,
		"type": "access",
	})

	tokenString, err := jwtToken.SignedString(h.jwtSecret)
	if err != nil {
		log.Printf("[Auth] Error generating token: %v", err)
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Generate refresh token
	refreshExp := time.Now().Add(7 * 24 * time.Hour)
	refreshJti := uuid.New().String()
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
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

	// Store refresh token with device info
	userAgent := r.Header.Get("User-Agent")
	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	}

	if err := h.db.CreateRefreshToken(user.ID, refreshJti, userAgent, ipAddress, refreshExp); err != nil {
		log.Printf("[Auth] Error storing refresh token: %v", err)
		http.Error(w, "Error storing refresh token", http.StatusInternalServerError)
		return
	}

	// Set secure cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshTokenString,
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  refreshExp,
	})

	csrfToken := uuid.New().String()
	http.SetCookie(w, &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		HttpOnly: false,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  refreshExp,
	})

	// Send response
	response := AuthResponse{
		ID:        user.ID,
		Token:     tokenString,
		ExpiresAt: accessExp.Unix(),
		Name:      user.Name,
		Email:     user.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Register handles user registration endpoint (POST /auth/register)
// It validates the request, checks for existing users, and creates a new user account
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
}

// Login handles user authentication endpoint (POST /auth/login)
// It validates credentials and issues access and refresh tokens
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	if req.Password == "" {
		http.Error(w, "Password is required", http.StatusBadRequest)
		return
	}

	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate tokens with enhanced security
	accessExp := time.Now().Add(15 * time.Minute)

	// Generate JTI (JWT ID) for token tracking
	jti := uuid.New().String()

	// Create access token with minimal claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"exp":  accessExp.Unix(),
		"jti":  jti,
		"type": "access",
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Generate refresh token with JWT claims
	refreshExp := time.Now().Add(7 * 24 * time.Hour)
	refreshJti := uuid.New().String()
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
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

	// Get device info and IP address
	userAgent := r.Header.Get("User-Agent")
	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	}

	// Store refresh token in database with device info
	if err := h.db.CreateRefreshToken(user.ID, refreshJti, userAgent, ipAddress, refreshExp); err != nil {
		log.Printf("[Auth] Error storing refresh token: %v", err)
		http.Error(w, "Error storing refresh token", http.StatusInternalServerError)
		return
	}

	// Set refresh token in HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshTokenString,
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  refreshExp,
	})

	// Set CSRF token cookie (not HTTP-only so JS can read it)
	csrfToken := uuid.New().String()
	http.SetCookie(w, &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		HttpOnly: false,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	log.Printf("[Auth] Sending response for user: %s (email: %s)", user.ID, user.Email)
	response := AuthResponse{
		ID:        user.ID,
		Token:     tokenString,
		ExpiresAt: accessExp.Unix(),
		Name:      user.Name,
		Email:     user.Email,
	}

	log.Printf("[Auth] Login response: %+v", response)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RefreshToken handles token refresh endpoint (POST /auth/refresh)
// It validates the refresh token and issues new access and refresh tokens
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// Apply stricter rate limiting for refresh token endpoint - 3 attempts per 5 minutes
	refreshLimiter := middleware.NewRateLimiter(5*time.Minute, 3)
	handler := refreshLimiter.Limit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log request details
		log.Printf("[Auth] Refresh token request received from IP: %s", r.RemoteAddr)
		log.Printf("[Auth] Request cookies: %+v", r.Cookies())

		// Get old access token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			// Extract and blacklist the old access token
			oldTokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if oldToken, err := jwt.Parse(oldTokenString, func(token *jwt.Token) (interface{}, error) {
				return h.jwtSecret, nil
			}); err == nil && oldToken.Valid {
				if claims, ok := oldToken.Claims.(jwt.MapClaims); ok {
					if jti, ok := claims["jti"].(string); ok {
						userID := claims["sub"].(string)
						exp := int64(claims["exp"].(float64))
						// Add old token to blacklist
						if err := h.db.AddToBlacklist(jti, userID, time.Unix(exp, 0)); err != nil {
							log.Printf("[Auth] Error blacklisting old access token: %v", err)
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

		// Verify refresh token
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
			return h.jwtRefreshSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Generate new tokens with enhanced security
		accessExp := time.Now().Add(15 * time.Minute)

		// Generate JTI for token tracking
		jti := uuid.New().String()

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
		refreshTokenString := uuid.New().String()

		// Store refresh token in database with device info
		if err := h.db.CreateRefreshToken(userID, refreshTokenString, deviceInfo, ipAddress, refreshExp); err != nil {
			http.Error(w, "Error storing refresh token", http.StatusInternalServerError)
			return
		}

		// Set new refresh token in HTTP-only cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshTokenString,
			Path:     "/api/auth",
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
			ID:        userID,
			Token:     accessTokenString,
			ExpiresAt: accessExp.Unix(),
			Name:      user.Name,
			Email:     user.Email,
		})
	}))
	handler.ServeHTTP(w, r)
}

// Logout handles user logout by blacklisting the current token and invalidating refresh tokens
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Authorization header required", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	tokenString := authHeader[7:] // Skip "Bearer " prefix

	// Validate the token
	token, err := h.validateToken(tokenString)
	if err != nil {
		log.Printf("[Auth] Error validating token during logout: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Extract claims and blacklist token
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID := claims["sub"].(string)
		jti := claims["jti"].(string)
		exp := int64(claims["exp"].(float64))

		// Add token to blacklist
		if err := h.db.AddToBlacklist(jti, userID, time.Unix(exp, 0)); err != nil {
			log.Printf("[Auth] Error blacklisting token: %v", err)
			http.Error(w, "Error processing logout", http.StatusInternalServerError)
			return
		}

		// Invalidate all refresh tokens for the user
		if err := h.db.DeleteAllUserRefreshTokens(userID); err != nil {
			log.Printf("[Auth] Error invalidating refresh tokens: %v", err)
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Successfully logged out"})

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

// UpdatePassword handles password update endpoint (PUT /user/password)
// It requires authentication and verifies the current password before updating
func (h *AuthHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		log.Printf("[Auth] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		log.Printf("[Auth] Unauthorized request to update password")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body for password update: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate new password strength
	if err := validatePassword(req.NewPassword); err != nil {
		log.Printf("[Auth] Invalid new password: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Getting user for password update: %s", userID)
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		log.Printf("[Auth] User not found: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	log.Printf("[Auth] Verifying current password for user: %s", userID)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		log.Printf("[Auth] Current password is incorrect for user: %s", userID)
		http.Error(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	log.Printf("[Auth] Hashing new password for user: %s", userID)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[Auth] Failed to hash password: %v", err)
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Updating password for user: %s", userID)
	if err := h.db.UpdatePassword(userID, string(hashedPassword)); err != nil {
		log.Printf("[Auth] Failed to update password: %v", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	// Invalidate all refresh tokens for this user
	if err := h.db.DeleteAllUserRefreshTokens(userID); err != nil {
		log.Printf("[Auth] Error invalidating refresh tokens: %v", err)
		// Don't return error here as the password is already updated
	}

	log.Printf("[Auth] Password updated successfully for user: %s", userID)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password updated successfully. Please log in again with your new password.",
	})
}

// RequestPasswordReset handles password reset request endpoint (POST /auth/reset-password/request)
func (h *AuthHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RequestPasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user by email
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		// Don't reveal whether the email exists
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "If your email is registered, you will receive a password reset link",
		})
		return
	}

	// Generate reset token
	token := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour)

	// Save reset token
	if err := h.db.CreatePasswordResetToken(user.ID, token, expiresAt); err != nil {
		http.Error(w, "Error creating password reset token", http.StatusInternalServerError)
		return
	}

	// TODO: Send email with reset link
	resetLink := fmt.Sprintf("%s/auth/reset-password?token=%s", os.Getenv("FRONTEND_URL"), token)
	log.Printf("[Auth] ============================================")
	log.Printf("[Auth] Password reset link for %s:", user.Email)
	log.Printf("[Auth] %s", resetLink)
	log.Printf("[Auth] ============================================")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "If your email is registered, you will receive a password reset link",
	})
}

// ResetPassword handles password reset endpoint (POST /auth/reset-password)
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate password strength
	if err := validatePassword(req.NewPassword); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user ID from reset token
	userID, err := h.db.GetPasswordResetToken(req.Token)
	if err != nil {
		http.Error(w, "Invalid or expired reset token", http.StatusBadRequest)
		return
	}

	// Mark token as used
	if err := h.db.MarkPasswordResetTokenUsed(req.Token); err != nil {
		http.Error(w, "Token has already been used", http.StatusBadRequest)
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Update password
	if err := h.db.UpdatePassword(userID, string(hashedPassword)); err != nil {
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	// Invalidate all refresh tokens for this user
	if err := h.db.DeleteAllUserRefreshTokens(userID); err != nil {
		log.Printf("[Auth] Error invalidating refresh tokens: %v", err)
		// Don't return error here as the password is already updated
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password updated successfully. Please log in again with your new password.",
	})
}

// AccountPasswordReset handles password reset for authenticated users
func (h *AuthHandler) AccountPasswordReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("[Auth] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		log.Printf("[Auth] Unauthorized request to reset password")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req AccountPasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body for password reset: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate new password strength
	if err := validatePassword(req.NewPassword); err != nil {
		log.Printf("[Auth] Invalid new password: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user from database
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		log.Printf("[Auth] User not found: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		log.Printf("[Auth] Current password is incorrect for user: %s", userID)
		http.Error(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[Auth] Failed to hash password: %v", err)
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Update password in database
	if err := h.db.UpdatePassword(userID, string(hashedPassword)); err != nil {
		log.Printf("[Auth] Failed to update password: %v", err)
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	// Invalidate all refresh tokens for this user
	if err := h.db.DeleteAllUserRefreshTokens(userID); err != nil {
		log.Printf("[Auth] Error invalidating refresh tokens: %v", err)
		// Don't return error here as the password is already updated
	}

	log.Printf("[Auth] Password reset successful for user: %s", userID)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password updated successfully.",
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
