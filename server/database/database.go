// Package database provides database operations and management for the SaaS platform
package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// User represents a user in the system
type User struct {
	ID       uuid.UUID // Unique identifier for the user
	Email    string    // User's email address
	Password string    // Hashed password
	Name     string    // User's display name
}

// DB wraps the sql.DB connection and provides database operations
type DB struct {
	*sql.DB
}

// New creates a new database connection and verifies it with a ping
func New(dataSourceName string) (*DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return &DB{db}, nil
}

// CreateUser creates a new user in the database with the given details
func (db *DB) CreateUser(email, password, name string) (*User, error) {
	id := uuid.New()
	query := `
		INSERT INTO users (id, email, password, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password, name`

	user := &User{}
	err := db.QueryRow(query, id, email, password, name).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByEmail retrieves a user by their email address
func (db *DB) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, password, name
		FROM users
		WHERE email = $1`

	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// UserExists checks if a user with the given email already exists
func (db *DB) UserExists(email string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM users WHERE email = $1
		)`

	err := db.QueryRow(query, email).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// InitSchema creates the necessary database tables if they don't exist
func (db *DB) InitSchema() error {
	// Start a transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}
	defer tx.Rollback() // Rollback if we don't commit

	// Create users table if it doesn't exist
	usersTable := `
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255),
			name VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`
	if _, err := tx.Exec(usersTable); err != nil {
		return fmt.Errorf("error creating users table: %v", err)
	}

	// Create refresh_tokens table if it doesn't exist
	refreshTokensTable := `
		CREATE TABLE IF NOT EXISTS refresh_tokens (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`
	if _, err := tx.Exec(refreshTokensTable); err != nil {
		return fmt.Errorf("error creating refresh_tokens table: %v", err)
	}

	// Create linked_accounts table if it doesn't exist
	linkedAccountsTable := `
		CREATE TABLE IF NOT EXISTS linked_accounts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			provider VARCHAR(50) NOT NULL,
			email VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE(user_id, provider),
			UNIQUE(provider, email)
		)`
	if _, err := tx.Exec(linkedAccountsTable); err != nil {
		return fmt.Errorf("error creating linked_accounts table: %v", err)
	}

	// Create password_reset_tokens table if it doesn't exist
	passwordResetTokensTable := `
		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			used_at TIMESTAMP WITH TIME ZONE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`
	if _, err := tx.Exec(passwordResetTokensTable); err != nil {
		return fmt.Errorf("error creating password_reset_tokens table: %v", err)
	}

	// Create sessions table if it doesn't exist
	sessionsTable := `
		CREATE TABLE IF NOT EXISTS sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			token TEXT NOT NULL UNIQUE,
			last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
			device_info TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`
	if _, err := tx.Exec(sessionsTable); err != nil {
		return fmt.Errorf("error creating sessions table: %v", err)
	}

	// Create token blacklist table if it doesn't exist
	tokenBlacklistTable := `
		CREATE TABLE IF NOT EXISTS token_blacklist (
			token TEXT PRIMARY KEY,
			invalidated_at TIMESTAMP WITH TIME ZONE NOT NULL
		)`
	if _, err := tx.Exec(tokenBlacklistTable); err != nil {
		return fmt.Errorf("error creating token_blacklist table: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %v", err)
	}

	return nil
}

// GetUserByID retrieves a user by their unique identifier
func (db *DB) GetUserByID(id string) (*User, error) {
	user := &User{}
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, email, password, name
		FROM users
		WHERE id = $1`

	err = db.QueryRow(query, parsedID).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// UpdateUser updates a user's profile information in the database
func (db *DB) UpdateUser(id, name, email string) error {
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	query := `
		UPDATE users
		SET name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	result, err := db.Exec(query, parsedID, name, email)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// UpdatePassword updates a user's password in the database
func (db *DB) UpdatePassword(id, hashedPassword string) error {
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	query := `
		UPDATE users
		SET password = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	result, err := db.Exec(query, parsedID, hashedPassword)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// CreateRefreshToken creates a new refresh token for a user with an expiration time
func (db *DB) CreateRefreshToken(userID string, token string, expiresAt time.Time) error {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO refresh_tokens (id, user_id, token, expires_at)
		VALUES ($1, $2, $3, $4)`

	_, err = db.Exec(query, uuid.New(), parsedID, token, expiresAt)
	return err
}

// GetRefreshToken retrieves a valid refresh token and returns the associated user ID
func (db *DB) GetRefreshToken(token string) (string, error) {
	var userID uuid.UUID
	query := `
		SELECT user_id
		FROM refresh_tokens
		WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`

	err := db.QueryRow(query, token).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID.String(), nil
}

// DeleteRefreshToken removes a refresh token from the database
func (db *DB) DeleteRefreshToken(token string) error {
	query := `DELETE FROM refresh_tokens WHERE token = $1`
	_, err := db.Exec(query, token)
	return err
}
