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

type AuthHandler struct {
	db                 database.DBInterface
	jwtSecret          []byte
	jwtRefreshSecret   []byte
	authLimiter        *middleware.RateLimiter
	googleClientID     string
	googleClientSecret string
	googleRedirectURL  string
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

// AuthHandler handles authentication-related HTTP requests and manages user sessions
// GoogleAuthRequest represents the request body for Google OAuth authentication
type GoogleAuthRequest struct {
	Code string `json:"code"` // Authorization code from Google OAuth
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
	Token       string `json:"token"`    // Password reset token
	NewPassword string `json:"password"` // New password to set
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
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	if req.Password == "" {
		http.Error(w, "Password is required", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	// Validate password strength
	if err := validatePassword(req.Password); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if user already exists
	existingUser, err := h.db.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[Auth] Error hashing password: %v", err)
		http.Error(w, "Error processing registration", http.StatusInternalServerError)
		return
	}

	// Create new user
	user, err := h.db.CreateUser(req.Email, string(hashedPassword), req.Name)
	if err != nil {
		log.Printf("[Auth] Error creating user: %v", err)
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// Update additional user fields (email not verified, provider is local)
	if err := h.db.UpdateUserFields(user.ID, false, "local"); err != nil {
		log.Printf("[Auth] Error updating user fields: %v", err)
	}

	// Send success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User registered successfully",
		"id":      user.ID,
	})
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
