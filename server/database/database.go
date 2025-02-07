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

// CreateRefreshToken creates a new refresh token in the database
func (db *DB) CreateRefreshToken(userID string, tokenHash string, deviceInfo string, ipAddress string, expiresAt time.Time) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token_hash, device_info, ip_address, expires_at, created_at, last_used_at, is_blocked)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)`

	id := uuid.New().String()
	// Use provided device info and IP address, or fallback to defaults
	if deviceInfo == "" {
		deviceInfo = "Unknown Device"
	}
	if ipAddress == "" {
		ipAddress = "0.0.0.0"
	}

	_, err := db.Exec(query, id, userID, tokenHash, deviceInfo, ipAddress, expiresAt)
	return err
}

// DeleteAllUserRefreshTokens removes all refresh tokens for a user
func (db *DB) DeleteAllUserRefreshTokens(userID string) error {
	query := `
		UPDATE refresh_tokens
		SET is_blocked = true
		WHERE user_id = $1`

	_, err := db.Exec(query, userID)
	return err
}

// AddToBlacklist adds a token to the blacklist
func (db *DB) AddToBlacklist(jti string, userID string, expiresAt time.Time) error {
	query := `
		INSERT INTO token_blacklist (jti, user_id, expires_at)
		VALUES ($1, $2, $3)`

	_, err := db.Exec(query, jti, userID, expiresAt)
	return err
}

// IsTokenBlacklisted checks if a token is blacklisted
func (db *DB) IsTokenBlacklisted(jti string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM token_blacklist
			WHERE jti = $1 AND expires_at > CURRENT_TIMESTAMP
		)`

	err := db.QueryRow(query, jti).Scan(&exists)
	return exists, err
}

// CleanupExpiredBlacklistedTokens removes expired tokens from the blacklist
func (db *DB) CleanupExpiredBlacklistedTokens() error {
	query := `DELETE FROM token_blacklist WHERE expires_at <= CURRENT_TIMESTAMP`
	_, err := db.Exec(query)
	return err
}
