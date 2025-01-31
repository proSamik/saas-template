// Package handlers provides HTTP request handlers for the SaaS platform's API endpoints.
// It includes authentication, user management, and other core functionality handlers.
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"saas-server/database"
	"saas-server/middleware"
	"saas-server/models"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests and manages user sessions
type AuthHandler struct {
	db        *database.DB // Database connection for user operations
	jwtSecret string       // Secret key for JWT token signing
}

// NewAuthHandler creates a new AuthHandler instance with the given database connection and JWT secret
func NewAuthHandler(db *database.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
	}
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
	ID           string `json:"id"`           // User's unique identifier
	Token        string `json:"token"`        // JWT access token
	RefreshToken string `json:"refreshToken"` // Refresh token for obtaining new access tokens
	ExpiresAt    int64  `json:"expiresAt"`    // Access token expiration timestamp
	Name         string `json:"name"`         // User's display name
	Email        string `json:"email"`        // User's email address
}

// GoogleAuthRequest represents the request body for Google OAuth authentication
type GoogleAuthRequest struct {
	Token string `json:"token"` // Google OAuth token
	User  struct {
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

// RefreshTokenRequest represents the request body for token refresh endpoint
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"` // Current refresh token
}

// TokenResponse represents the response body for token refresh operations
type TokenResponse struct {
	AccessToken  string `json:"token"`        // New JWT access token
	RefreshToken string `json:"refreshToken"` // New refresh token
	ExpiresAt    int64  `json:"expiresAt"`    // New access token expiration timestamp
}

// LinkedAccountsResponse represents the response for getting linked accounts
type LinkedAccountsResponse struct {
	Accounts []models.LinkedAccountResponse `json:"accounts"`
}

// LinkAccountRequest represents the request for linking a new account
type LinkAccountRequest struct {
	Provider string `json:"provider"`
	Token    string `json:"token"`
	User     struct {
		Email string `json:"email"`
		Name  string `json:"name"`
		Image string `json:"image"`
	} `json:"user"`
}

// RequestPasswordResetRequest represents the request body for password reset request
type RequestPasswordResetRequest struct {
	Email string `json:"email"` // User's email address
}

// ResetPasswordRequest represents the request body for password reset
type ResetPasswordRequest struct {
	Token       string `json:"token"`       // Password reset token
	NewPassword string `json:"newPassword"` // New password to set
}

// Register handles user registration endpoint (POST /auth/register)
// It validates the request, checks for existing users, and creates a new user account
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Auth] Starting registration process")

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Checking if user exists: %s", req.Email)
	exists, err := h.db.UserExists(req.Email)
	if err != nil {
		log.Printf("[Auth] Error checking user existence: %v", err)
		http.Error(w, "Error checking user existence", http.StatusInternalServerError)
		return
	}
	if exists {
		log.Printf("[Auth] User already exists: %s", req.Email)
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	log.Printf("[Auth] Hashing password for user: %s", req.Email)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[Auth] Error hashing password: %v", err)
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Creating user: %s", req.Email)
	user, err := h.db.CreateUser(req.Email, string(hashedPassword), req.Name)
	if err != nil {
		log.Printf("[Auth] Error creating user: %v", err)
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Generating JWT for user: %s", user.ID)
	accessExp := time.Now().Add(15 * time.Minute)
	refreshExp := time.Now().Add(7 * 24 * time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": accessExp.Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		log.Printf("[Auth] Error generating token: %v", err)
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	refreshToken := uuid.New().String()
	if err := h.db.CreateRefreshToken(user.ID.String(), refreshToken, refreshExp); err != nil {
		log.Printf("[Auth] Error generating refresh token: %v", err)
		http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Registration successful for user: %s", user.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		ID:           user.ID.String(),
		Token:        tokenString,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Unix(),
		Name:         user.Name,
		Email:        user.Email,
	})
}

// Login handles user authentication endpoint (POST /auth/login)
// It validates credentials and issues access and refresh tokens
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Auth] Starting login process")

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Getting user by email: %s", req.Email)
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		log.Printf("[Auth] User not found: %s", req.Email)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	log.Printf("[Auth] Checking password for user: %s", user.ID)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("[Auth] Invalid password for user: %s", user.ID)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	log.Printf("[Auth] Generating JWT for user: %s", user.ID)
	accessExp := time.Now().Add(15 * time.Minute)
	refreshExp := time.Now().Add(7 * 24 * time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": accessExp.Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		log.Printf("[Auth] Error generating token: %v", err)
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	refreshToken := uuid.New().String()
	if err := h.db.CreateRefreshToken(user.ID.String(), refreshToken, refreshExp); err != nil {
		log.Printf("[Auth] Error generating refresh token: %v", err)
		http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Login successful for user: %s", user.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		ID:           user.ID.String(),
		Token:        tokenString,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Unix(),
		Name:         user.Name,
		Email:        user.Email,
	})
}

// GoogleAuth handles Google OAuth authentication endpoint (POST /auth/google)
// It processes Google OAuth tokens and creates or updates user accounts
func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Auth] Starting Google authentication process")

	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Checking if Google user exists: %s", req.User.Email)
	user, err := h.db.GetUserByEmail(req.User.Email)
	if err != nil {
		log.Printf("[Auth] Creating new Google user: %s", req.User.Email)
		user, err = h.db.CreateUser(req.User.Email, "", req.User.Name)
		if err != nil {
			log.Printf("[Auth] Error creating Google user: %v", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
	}

	log.Printf("[Auth] Generating JWT for Google user: %s", user.ID)
	accessExp := time.Now().Add(15 * time.Minute)
	refreshExp := time.Now().Add(7 * 24 * time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": accessExp.Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		log.Printf("[Auth] Error generating token: %v", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	refreshToken := uuid.New().String()
	if err := h.db.CreateRefreshToken(user.ID.String(), refreshToken, refreshExp); err != nil {
		log.Printf("[Auth] Error generating refresh token: %v", err)
		http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	log.Printf("[Auth] Google authentication successful for user: %s", user.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		ID:           user.ID.String(),
		Token:        tokenString,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Unix(),
		Name:         user.Name,
		Email:        user.Email,
	})
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

	log.Printf("[Auth] Password updated successfully for user: %s", userID)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password updated successfully",
	})
}

// RefreshToken handles token refresh endpoint (POST /auth/refresh)
// It validates the refresh token and issues new access and refresh tokens
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify refresh token
	userID, err := h.db.GetRefreshToken(req.RefreshToken)
	if err != nil {
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Delete the used refresh token
	if err := h.db.DeleteRefreshToken(req.RefreshToken); err != nil {
		log.Printf("[Auth] Error deleting refresh token: %v", err)
	}

	// Generate new tokens
	accessExp := time.Now().Add(15 * time.Minute)
	refreshExp := time.Now().Add(7 * 24 * time.Hour)

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": accessExp.Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		http.Error(w, "Error generating access token", http.StatusInternalServerError)
		return
	}

	refreshToken := uuid.New().String()
	if err := h.db.CreateRefreshToken(userID, refreshToken, refreshExp); err != nil {
		http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{
		AccessToken:  accessTokenString,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Unix(),
	})
}

// GetLinkedAccounts handles retrieving all linked accounts for a user (GET /auth/linked-accounts)
func (h *AuthHandler) GetLinkedAccounts(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	accounts, err := h.db.GetLinkedAccounts(userID)
	if err != nil {
		log.Printf("[Auth] Error getting linked accounts: %v", err)
		http.Error(w, "Error getting linked accounts", http.StatusInternalServerError)
		return
	}

	// Convert to response type
	response := LinkedAccountsResponse{
		Accounts: make([]models.LinkedAccountResponse, len(accounts)),
	}
	for i, account := range accounts {
		response.Accounts[i] = models.LinkedAccountResponse{
			ID:       account.ID.String(),
			Provider: account.Provider,
			Email:    account.Email,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LinkAccount handles linking a new authentication method to an existing account (POST /auth/link)
func (h *AuthHandler) LinkAccount(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var req LinkAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if this provider/email is already linked to another account
	existing, err := h.db.GetLinkedAccountByProviderEmail(req.Provider, req.User.Email)
	if err != nil && err != database.ErrNotFound {
		log.Printf("[Auth] Error checking existing linked account: %v", err)
		http.Error(w, "Error checking existing linked account", http.StatusInternalServerError)
		return
	}
	if existing != nil {
		log.Printf("[Auth] Account already linked to another user: %s", req.User.Email)
		http.Error(w, "Account already linked to another user", http.StatusConflict)
		return
	}

	// Create the linked account
	account, err := h.db.CreateLinkedAccount(userID, req.Provider, req.User.Email)
	if err != nil {
		log.Printf("[Auth] Error creating linked account: %v", err)
		http.Error(w, "Error creating linked account", http.StatusInternalServerError)
		return
	}

	// Return the new linked account
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.LinkedAccountResponse{
		ID:       account.ID.String(),
		Provider: account.Provider,
		Email:    account.Email,
	})
}

// UnlinkAccount handles removing a linked authentication method (DELETE /auth/link/{id})
func (h *AuthHandler) UnlinkAccount(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	accountID := chi.URLParam(r, "id")

	if err := h.db.DeleteLinkedAccount(accountID, userID); err != nil {
		if err == database.ErrNotFound {
			http.Error(w, "Linked account not found", http.StatusNotFound)
			return
		}
		log.Printf("[Auth] Error deleting linked account: %v", err)
		http.Error(w, "Error deleting linked account", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RequestPasswordReset handles password reset request endpoint (POST /auth/reset-password/request)
func (h *AuthHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Auth] Starting password reset request")
	if r.Method != http.MethodPost {
		log.Printf("[Auth] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RequestPasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Auth] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Auth] Processing reset request for email: %s", req.Email)

	// Get user by email
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		log.Printf("[Auth] User not found for email: %s", req.Email)
		// Don't reveal whether the email exists
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "If your email is registered, you will receive a password reset link",
		})
		return
	}

	log.Printf("[Auth] User found: %s", user.ID)

	// Generate reset token
	token := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour)

	// Save reset token
	if err := h.db.CreatePasswordResetToken(user.ID.String(), token, expiresAt); err != nil {
		log.Printf("[Auth] Error creating password reset token: %v", err)
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

	// Get user ID from reset token
	userID, err := h.db.GetPasswordResetToken(req.Token)
	if err != nil {
		if err == database.ErrNotFound {
			http.Error(w, "Invalid or expired reset token", http.StatusBadRequest)
			return
		}
		log.Printf("[Auth] Error getting reset token: %v", err)
		http.Error(w, "Error processing reset token", http.StatusInternalServerError)
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[Auth] Error hashing password: %v", err)
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Update password
	if err := h.db.UpdatePassword(userID, string(hashedPassword)); err != nil {
		log.Printf("[Auth] Error updating password: %v", err)
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	// Mark token as used
	if err := h.db.MarkPasswordResetTokenUsed(req.Token); err != nil {
		log.Printf("[Auth] Error marking reset token as used: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password has been reset successfully",
	})
}
