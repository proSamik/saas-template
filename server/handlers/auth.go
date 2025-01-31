// Package handlers provides HTTP request handlers for the application
package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/markbates/goth/gothic"
	"saas-server/models"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	jwtSecret []byte // Secret key for JWT signing
}

// NewAuthHandler creates a new AuthHandler instance
func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{
		jwtSecret: []byte(jwtSecret),
	}
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Name     string `json:"name"`     // User's full name
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // User's password (plain text)
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // User's password
}

// AuthResponse represents the response body for successful authentication
type AuthResponse struct {
	Token string      `json:"token"` // JWT token
	User  models.User `json:"user"`  // User information
}

// Register handles user registration
// POST /auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create user
	user := &models.User{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  req.Password,
		Provider:  "email",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Hash password
	if err := user.HashPassword(); err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// TODO: Save user to database

	// Generate JWT with 7-day expiration
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: tokenString,
		User:  *user,
	})
}

// Login handles user login with email and password
// POST /auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Get user from database by email
	// For now, return error
	http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}

// GoogleCallback handles the OAuth callback from Google
// GET /auth/google/callback
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// TODO: Create or update user in database
	// For now, just create a new user object
	authUser := &models.User{
		ID:        uuid.New().String(),
		Name:      user.Name,
		Email:     user.Email,
		Provider:  "google",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Generate JWT with 7-day expiration
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": authUser.ID,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Redirect to frontend with token
	http.Redirect(w, r, "http://localhost:3000/auth/callback?token="+tokenString, http.StatusTemporaryRedirect)
}

// GoogleAuth initiates Google OAuth flow
// GET /auth/google
func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
} 