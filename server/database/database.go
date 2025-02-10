// Package database provides database operations and management for the SaaS platform
package database

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
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

	// Configure connection pool
	db.SetMaxOpenConns(25)                 // Maximum number of open connections to the database
	db.SetMaxIdleConns(10)                 // Maximum number of connections in the idle connection pool
	db.SetConnMaxLifetime(5 * time.Minute) // Maximum amount of time a connection may be reused
	db.SetConnMaxIdleTime(1 * time.Minute) // Maximum amount of time a connection may be idle

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
		SELECT id, email, password, name, email_verified, created_at, updated_at
		FROM users
		WHERE email = $1`

	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
		&user.EmailVerified,
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

// GetUserByID retrieves all user details by their unique identifier
func (db *DB) GetUserByID(id string) (*models.User, error) {
	var user models.User
	var latestStatus sql.NullString
	var latestProductID sql.NullInt64
	var latestVariantID sql.NullInt64
	var latestRenewalDate sql.NullTime
	var latestEndDate sql.NullTime

	query := `
		SELECT id, email, password, name, email_verified,
			latest_status, latest_product_id, latest_variant_id,
			latest_renewal_date, latest_end_date,
			created_at, updated_at
		FROM users
		WHERE id = $1`

	err := db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
		&user.EmailVerified,
		&latestStatus,
		&latestProductID,
		&latestVariantID,
		&latestRenewalDate,
		&latestEndDate,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Convert NULL values to their appropriate types
	if latestStatus.Valid {
		user.LatestStatus = latestStatus.String
	}
	if latestProductID.Valid {
		user.LatestProductID = int(latestProductID.Int64)
	}
	if latestVariantID.Valid {
		user.LatestVariantID = int(latestVariantID.Int64)
	}
	if latestRenewalDate.Valid {
		t := latestRenewalDate.Time
		user.LatestRenewalDate = &t
	}
	if latestEndDate.Valid {
		t := latestEndDate.Time
		user.LatestEndDate = &t
	}

	return &user, nil
}

// GetUserSubscriptionStatus retrieves only the subscription-related fields
func (db *DB) GetUserSubscriptionStatus(id string) (*models.UserSubscriptionStatus, error) {
	var nullStatus sql.NullString
	var nullProductID sql.NullInt64
	var nullVariantID sql.NullInt64

	query := `
		SELECT latest_status, latest_product_id, latest_variant_id
		FROM users
		WHERE id = $1`

	err := db.QueryRow(query, id).Scan(
		&nullStatus,
		&nullProductID,
		&nullVariantID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Only create the status object if at least one field is not null
	if !nullStatus.Valid && !nullProductID.Valid && !nullVariantID.Valid {
		return nil, nil
	}

	status := &models.UserSubscriptionStatus{}

	if nullStatus.Valid {
		status.Status = &nullStatus.String
	}
	if nullProductID.Valid {
		productID := int(nullProductID.Int64)
		status.ProductID = &productID
	}
	if nullVariantID.Valid {
		variantID := int(nullVariantID.Int64)
		status.VariantID = &variantID
	}

	return status, nil
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

// UpdateSubscription updates a user's subscription in the database
func (db *DB) UpdateUserSubscription(userID string, subscriptionID int, status string, productID int, variantID int, renewalDate *time.Time, endDate *time.Time) error {

	parsedID, err := uuid.Parse(userID)
	if err != nil {
		log.Printf("[DB] Error parsing UUID: %v", err)
		return err
	}

	query := `
		UPDATE users
		SET latest_subscription_id = $2,
			latest_status = $3,
			latest_product_id = $4,
			latest_variant_id = $5,
			latest_renewal_date = $6,
			latest_end_date = $7,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	result, err := db.Exec(query, parsedID, subscriptionID, status, productID, variantID, renewalDate, endDate)
	if err != nil {
		log.Printf("[DB] Error executing update query: %v", err)
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		log.Printf("[DB] Error getting affected rows: %v", err)
		return err
	}

	if rows == 0 {
		log.Printf("[DB] No rows affected - user not found with ID: %s", userID)
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

// GetRefreshToken retrieves a refresh token from the database by its hash
func (db *DB) GetRefreshToken(tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	query := `
		SELECT id, user_id, token_hash, device_info, ip_address, expires_at, created_at, last_used_at, is_blocked
		FROM refresh_tokens
		WHERE token_hash = $1
		AND expires_at > CURRENT_TIMESTAMP
		AND is_blocked = false`

	err := db.QueryRow(query, tokenHash).Scan(
		&token.ID,
		&token.UserID,
		&token.TokenHash,
		&token.DeviceInfo,
		&token.IPAddress,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.LastUsedAt,
		&token.IsBlocked,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &token, nil
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

// StoreEmailVerificationToken stores a new email verification token
func (db *DB) StoreEmailVerificationToken(token, userID, email string, expiresAt time.Time) error {
	query := `
		INSERT INTO email_verification_tokens (token, user_id, email, expires_at)
		VALUES ($1, $2, $3, $4)
	`
	_, err := db.Exec(query, token, userID, email, expiresAt)
	return err
}

// VerifyEmail verifies the email using the token and updates the user's email_verified status
func (db *DB) VerifyEmail(token string) error {
	tx, err := db.Begin()
	if err != nil {
		log.Printf("[DB] Failed to begin transaction: %v", err)
		return err
	}
	defer tx.Rollback()

	// First, let's check if the token exists at all
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM email_verification_tokens WHERE token = $1)`
	err = tx.QueryRow(checkQuery, token).Scan(&exists)
	if err != nil {
		log.Printf("[DB] Error checking token existence: %v", err)
		return err
	}

	if !exists {
		log.Printf("[DB] Token does not exist: %s", token)
		return fmt.Errorf("invalid or expired token")
	}

	// Now check the token's status and get user info
	var userID string
	var expiresAt time.Time
	var usedAt sql.NullTime
	var emailVerified bool
	query := `
		SELECT evt.user_id, evt.expires_at, evt.used_at, u.email_verified
		FROM email_verification_tokens evt
		JOIN users u ON u.id = evt.user_id
		WHERE evt.token = $1
	`
	err = tx.QueryRow(query, token).Scan(&userID, &expiresAt, &usedAt, &emailVerified)
	if err != nil {
		log.Printf("[DB] Error querying token details: %v", err)
		if err == sql.ErrNoRows {
			return fmt.Errorf("invalid or expired token")
		}
		return err
	}

	log.Printf("[DB] Token found - UserID: %s, ExpiresAt: %v, UsedAt: %v, EmailVerified: %v", userID, expiresAt, usedAt, emailVerified)

	// If email is already verified, return success
	if emailVerified {
		log.Printf("[DB] Email already verified for user: %s", userID)
		return nil
	}

	if usedAt.Valid {
		log.Printf("[DB] Token already used at: %v", usedAt.Time)
		return fmt.Errorf("token already used")
	}

	if time.Now().After(expiresAt) {
		log.Printf("[DB] Token expired at: %v", expiresAt)
		return fmt.Errorf("token has expired")
	}

	// Mark token as used
	_, err = tx.Exec(`
		UPDATE email_verification_tokens
		SET used_at = CURRENT_TIMESTAMP
		WHERE token = $1
	`, token)
	if err != nil {
		log.Printf("[DB] Failed to mark token as used: %v", err)
		return err
	}

	// Update user's email_verified status
	result, err := tx.Exec(`
		UPDATE users
		SET email_verified = true
		WHERE id = $1
	`, userID)
	if err != nil {
		log.Printf("[DB] Failed to update user email_verified status: %v", err)
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		log.Printf("[DB] Error checking affected rows: %v", err)
		return err
	}
	if rows == 0 {
		log.Printf("[DB] No user found with ID: %s", userID)
		return fmt.Errorf("user not found")
	}

	log.Printf("[DB] Successfully verified email for user: %s", userID)
	return tx.Commit()
}
