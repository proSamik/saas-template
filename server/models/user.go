// Package models contains the data models for the application
package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID            string    `json:"id" db:"id"`              // Unique identifier for the user
	Name          string    `json:"name" db:"name"`          // User's full name
	Email         string    `json:"email" db:"email"`        // User's email address
	Password      string    `json:"-" db:"password"`         // Hashed password (not exposed in JSON)
	EmailVerified bool      `json:"email_verified" db:"email_verified"` // Whether the email has been verified
	Provider      string    `json:"provider" db:"provider"`   // Authentication provider (email, google, etc.)
	CreatedAt     time.Time `json:"created_at" db:"created_at"` // When the user was created
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"` // When the user was last updated
}

// HashPassword hashes the user's password using bcrypt
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// ComparePassword checks if the provided password matches the hashed password
func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// UserResponse represents the user data that is safe to send to the client
type UserResponse struct {
	ID            string    `json:"id"`             // User's ID
	Name          string    `json:"name"`           // User's name
	Email         string    `json:"email"`          // User's email
	EmailVerified bool      `json:"email_verified"` // Email verification status
	Provider      string    `json:"provider"`       // Authentication provider
	CreatedAt     time.Time `json:"created_at"`     // Account creation timestamp
} 