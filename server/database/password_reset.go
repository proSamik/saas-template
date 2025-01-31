package database

import (
	"database/sql"
	"time"
)

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

// DeleteExpiredPasswordResetTokens removes expired password reset tokens
func (db *DB) DeleteExpiredPasswordResetTokens() error {
	query := `
		DELETE FROM password_reset_tokens
		WHERE expires_at < CURRENT_TIMESTAMP
		OR used_at IS NOT NULL`

	_, err := db.Exec(query)
	return err
}
