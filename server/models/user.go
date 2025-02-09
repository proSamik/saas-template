// Package models contains the data models for the application
package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID                string     `json:"id"`
	Email             string     `json:"email"`
	Password          string     `json:"-"`
	Name              string     `json:"name"`
	LatestStatus      string     `json:"latest_status"`
	LatestProductID   int        `json:"latest_product_id"`
	LatestVariantID   int        `json:"latest_variant_id"`
	LatestRenewalDate *time.Time `json:"latest_renewal_date"`
	LatestEndDate     *time.Time `json:"latest_end_date"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// UserSubscriptionStatus represents the subscription status of a user
type UserSubscriptionStatus struct {
	Status    *string `json:"status"`
	ProductID *int    `json:"product_id"`
	VariantID *int    `json:"variant_id"`
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
	UserID        string    `json:"user_id"`        // Public user identifier
	Name          string    `json:"name"`           // User's name
	Email         string    `json:"email"`          // User's email
	EmailVerified bool      `json:"email_verified"` // Email verification status
	Provider      string    `json:"provider"`       // Authentication provider
	CreatedAt     time.Time `json:"created_at"`     // Account creation timestamp
}
