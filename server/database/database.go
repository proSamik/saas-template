// Package database provides database operations and management for the SaaS platform
package database

import (
	"database/sql"
	"errors"
	"fmt"
	"saas-server/models"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// ErrNotFound is returned when a requested resource is not found
var ErrNotFound = errors.New("resource not found")

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
func (db *DB) CreateUser(email, password, name string) (*models.User, error) {
	id := uuid.New().String()
	userID := uuid.New().String()
	query := `
		INSERT INTO users (id, user_id, email, password, name)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, email, password, name`

	var user models.User
	err := db.QueryRow(query, id, userID, email, password, name).Scan(
		&user.ID,
		&user.UserID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by their email address
func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, user_id, email, password, name
		FROM users
		WHERE email = $1`

	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.UserID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by their unique identifier
func (db *DB) GetUserByID(id string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, user_id, email, password, name
		FROM users
		WHERE id = $1`

	err := db.QueryRow(query, id).Scan(
		&user.ID,
		&user.UserID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
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

// CreateSession creates a new session record
func (db *DB) CreateSession(userID string, token string, expiresAt time.Time, deviceInfo string) error {
	query := `
		INSERT INTO sessions (id, user_id, token, last_activity, expires_at, device_info)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)`

	_, err := db.Exec(query, uuid.New().String(), userID, token, expiresAt, deviceInfo)
	return err
}

// InvalidateAllUserSessions invalidates all sessions for a user
func (db *DB) InvalidateAllUserSessions(userID string) error {
	// Get all active sessions for the user
	query := `
		SELECT token
		FROM sessions
		WHERE user_id = $1
		AND expires_at > CURRENT_TIMESTAMP`

	rows, err := db.Query(query, userID)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Invalidate each session
	for rows.Next() {
		var token string
		if err := rows.Scan(&token); err != nil {
			return err
		}
		if err := db.InvalidateSession(token); err != nil {
			return err
		}
	}

	return rows.Err()
}

// CreateLinkedAccount creates a new linked account for a user
func (db *DB) CreateLinkedAccount(userID, provider, email string) (*models.LinkedAccount, error) {
	account := &models.LinkedAccount{
		ID:        uuid.New().String(),
		UserID:    userID,
		Provider:  provider,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
		INSERT INTO linked_accounts (id, user_id, provider, email, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err := db.QueryRow(
		query,
		account.ID,
		account.UserID,
		account.Provider,
		account.Email,
		account.CreatedAt,
		account.UpdatedAt,
	).Scan(&account.ID)

	if err != nil {
		return nil, err
	}

	return account, nil
}

// GetLinkedAccounts retrieves all linked accounts for a user
func (db *DB) GetLinkedAccounts(userID string) ([]models.LinkedAccount, error) {
	query := `
		SELECT id, user_id, provider, email, created_at, updated_at
		FROM linked_accounts
		WHERE user_id = $1`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []models.LinkedAccount
	for rows.Next() {
		var account models.LinkedAccount
		err := rows.Scan(
			&account.ID,
			&account.UserID,
			&account.Provider,
			&account.Email,
			&account.CreatedAt,
			&account.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}

	return accounts, nil
}

// GetLinkedAccountByProviderEmail finds a linked account by provider and email
func (db *DB) GetLinkedAccountByProviderEmail(provider, email string) (*models.LinkedAccount, error) {
	query := `
		SELECT id, user_id, provider, email, created_at, updated_at
		FROM linked_accounts
		WHERE provider = $1 AND email = $2`

	var account models.LinkedAccount
	err := db.QueryRow(query, provider, email).Scan(
		&account.ID,
		&account.UserID,
		&account.Provider,
		&account.Email,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &account, nil
}

// DeleteLinkedAccount removes a linked account
func (db *DB) DeleteLinkedAccount(id, userID string) error {
	query := `
		DELETE FROM linked_accounts
		WHERE id = $1 AND user_id = $2`

	result, err := db.Exec(query, id, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

// CreatePasswordResetToken creates a new password reset token for a user
func (db *DB) CreatePasswordResetToken(userID string, token string, expiresAt time.Time) error {
	query := `
		INSERT INTO password_reset_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)`

	_, err := db.Exec(query, userID, token, expiresAt)
	return err
}

// GetPasswordResetToken retrieves a valid password reset token
func (db *DB) GetPasswordResetToken(token string) (string, error) {
	var userID string
	query := `
		SELECT user_id
		FROM password_reset_tokens
		WHERE token = $1 
		AND expires_at > CURRENT_TIMESTAMP
		AND used_at IS NULL`

	err := db.QueryRow(query, token).Scan(&userID)
	if err == sql.ErrNoRows {
		return "", ErrNotFound
	}
	return userID, err
}

// MarkPasswordResetTokenUsed marks a password reset token as used
func (db *DB) MarkPasswordResetTokenUsed(token string) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = CURRENT_TIMESTAMP
		WHERE token = $1
		AND used_at IS NULL
		AND expires_at > CURRENT_TIMESTAMP`

	result, err := db.Exec(query, token)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

// InvalidateSession marks a session as invalid (blacklists the token)
func (db *DB) InvalidateSession(token string) error {
	query := `
		INSERT INTO token_blacklist (token, invalidated_at)
		VALUES ($1, CURRENT_TIMESTAMP)`

	_, err := db.Exec(query, token)
	return err
}

// IsTokenBlacklisted checks if a token has been invalidated
func (db *DB) IsTokenBlacklisted(token string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM token_blacklist
			WHERE token = $1
		)`

	err := db.QueryRow(query, token).Scan(&exists)
	return exists, err
}

// UpdateSessionActivity updates the last activity timestamp for a session
func (db *DB) UpdateSessionActivity(token string) error {
	query := `
		UPDATE sessions
		SET last_activity = CURRENT_TIMESTAMP
		WHERE token = $1`

	result, err := db.Exec(query, token)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}
