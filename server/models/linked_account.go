package models

import (
	"time"
)

// LinkedAccount represents a connection between a user's different authentication methods
type LinkedAccount struct {
	ID        string    `json:"id" db:"id"`                 // Unique identifier for the linked account
	UserID    string    `json:"user_id" db:"user_id"`       // ID of the main user account
	Provider  string    `json:"provider" db:"provider"`     // Auth provider (google, email, etc)
	Email     string    `json:"email" db:"email"`           // Email associated with this provider
	CreatedAt time.Time `json:"created_at" db:"created_at"` // When the link was created
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"` // When the link was last updated
}

// LinkedAccountResponse represents the linked account data that is safe to send to the client
type LinkedAccountResponse struct {
	ID       string `json:"id"`       // Linked account ID
	Provider string `json:"provider"` // Authentication provider
	Email    string `json:"email"`    // Email associated with this provider
}
