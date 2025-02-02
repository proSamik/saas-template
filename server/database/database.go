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
	// Check if user already exists
	exists, err := db.UserExists(email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("user with email %s already exists", email)
	}

	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO users (id, email, password, name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, email, password, name, created_at, updated_at`

	var user models.User
	err = db.QueryRow(
		query,
		id,
		email,
		password,
		name,
		now,
		now,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
		&user.CreatedAt,
		&user.UpdatedAt,
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
		SELECT id, email, password, name, created_at, updated_at
		FROM users
		WHERE email = $1`

	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// InvalidateSession invalidates a specific session token
func (db *DB) InvalidateSession(token string) error {
	query := `
		UPDATE sessions
		SET is_valid = false
		WHERE token = $1`

	result, err := db.Exec(query, token)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// InvalidateRefreshTokensForUser invalidates all refresh tokens for a specific user
func (db *DB) InvalidateRefreshTokensForUser(userID string) error {
	query := `
		UPDATE refresh_tokens
		SET is_valid = false
		WHERE user_id = $1`

	_, err := db.Exec(query, userID)
	return err
}

// GetUserByID retrieves a user by their unique identifier
func (db *DB) GetUserByID(id string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, email, password, name, created_at, updated_at
		FROM users
		WHERE id = $1`

	err := db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
		&user.CreatedAt,
		&user.UpdatedAt,
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

// UpdateUserFields updates the provider fields for a user
func (db *DB) UpdateUserFields(id string, emailVerified bool, provider string) error {
	// Since email_verified is not in our schema, we'll ignore it
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	// We'll only update the timestamp since we don't have provider column either
	query := `
		UPDATE users
		SET updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	result, err := db.Exec(query, parsedID)
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
	query := `
		UPDATE sessions
		SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
		AND status = 'active'
		AND expires_at > CURRENT_TIMESTAMP`

	result, err := db.Exec(query, token, userID)
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

// GetRefreshToken retrieves a valid refresh token and returns the associated user ID
func (db *DB) GetRefreshToken(token string) (string, error) {
	var userID string
	query := `
		SELECT user_id
		FROM sessions
		WHERE refresh_token = $1
		AND status = 'active'
		AND expires_at > CURRENT_TIMESTAMP`

	err := db.QueryRow(query, token).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", ErrNotFound
		}
		return "", err
	}
	return userID, nil
}

// DeleteRefreshToken removes a refresh token from the database
func (db *DB) DeleteRefreshToken(token string) error {
	query := `
		UPDATE sessions
		SET refresh_token = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE refresh_token = $1
		AND status = 'active'`

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

// CreateSession creates a new session record
func (db *DB) CreateSession(userID string, token string, expiresAt time.Time, deviceInfo string) error {
	query := `
		INSERT INTO sessions (id, user_id, access_token, refresh_token, status, last_activity, expires_at, device_info)
		VALUES ($1, $2, $3, NULL, $4, CURRENT_TIMESTAMP, $5, $6)`

	_, err := db.Exec(query, uuid.New().String(), userID, token, "active", expiresAt, deviceInfo)
	return err
}

// InvalidateAllUserSessions invalidates all sessions for a user
func (db *DB) InvalidateAllUserSessions(userID string) error {
	// Get all active sessions for the user
	query := `
		SELECT access_token, expires_at
		FROM sessions
		WHERE user_id = $1
		AND expires_at > CURRENT_TIMESTAMP
		AND status = 'active'`

	rows, err := db.Query(query, userID)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Invalidate each session
	for rows.Next() {
		var token string
		var expiresAt time.Time
		if err := rows.Scan(&token, &expiresAt); err != nil {
			return err
		}
		if err := db.BlacklistToken(token, expiresAt); err != nil {
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
// BlacklistToken marks a session as invalid using the sessions table
func (db *DB) BlacklistToken(token string, expiresAt time.Time) error {
	query := `
		UPDATE sessions
		SET status = 'invalid', updated_at = CURRENT_TIMESTAMP
		WHERE access_token = $1 AND expires_at = $2`

	_, err := db.Exec(query, token, expiresAt)
	return err
}

// IsSessionValid checks if a session is valid and not expired
func (db *DB) IsSessionValid(token string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM sessions
			WHERE access_token = $1
			AND status = 'active'
			AND expires_at > CURRENT_TIMESTAMP
		)`

	var valid bool
	err := db.QueryRow(query, token).Scan(&valid)
	if err != nil {
		return false, err
	}
	return valid, nil
}

// IsTokenBlacklisted checks if a token has been invalidated
func (db *DB) IsTokenBlacklisted(token string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM sessions
			WHERE access_token = $1
			AND status = 'invalid'
			AND expires_at > CURRENT_TIMESTAMP
		)`

	var blacklisted bool
	err := db.QueryRow(query, token).Scan(&blacklisted)
	if err != nil {
		return false, err
	}
	return blacklisted, nil
}

// UpdateSessionActivity updates the last activity timestamp for a session
func (db *DB) UpdateSessionActivity(token string) error {
	query := `
		UPDATE sessions
		SET last_activity = CURRENT_TIMESTAMP
		WHERE access_token = $1`

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
