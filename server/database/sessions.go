package database

import (
	"time"

	"github.com/google/uuid"
)

// Session represents an active user session
type Session struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	Token        string
	LastActivity time.Time
	ExpiresAt    time.Time
	DeviceInfo   string
}

// CreateSession creates a new session record
func (db *DB) CreateSession(userID uuid.UUID, token string, expiresAt time.Time, deviceInfo string) error {
	query := `
		INSERT INTO sessions (id, user_id, token, last_activity, expires_at, device_info)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)`

	_, err := db.Exec(query, uuid.New(), userID, token, expiresAt, deviceInfo)
	return err
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

	_, err := db.Exec(query, token)
	return err
}

// GetActiveSessions retrieves all active sessions for a user
func (db *DB) GetActiveSessions(userID uuid.UUID) ([]Session, error) {
	query := `
		SELECT id, user_id, token, last_activity, expires_at, device_info
		FROM sessions
		WHERE user_id = $1
		AND expires_at > CURRENT_TIMESTAMP`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.UserID, &s.Token, &s.LastActivity, &s.ExpiresAt, &s.DeviceInfo)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}

	return sessions, rows.Err()
}

// InvalidateUserSessions invalidates all active sessions for a user
func (db *DB) InvalidateUserSessions(userID uuid.UUID) error {
	// Get all active sessions for the user
	sessions, err := db.GetActiveSessions(userID)
	if err != nil {
		return err
	}

	// Start a transaction
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	// Blacklist all active tokens
	for _, session := range sessions {
		_, err = tx.Exec(`
			INSERT INTO token_blacklist (token, invalidated_at)
			VALUES ($1, CURRENT_TIMESTAMP)`,
			session.Token)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Delete all sessions for the user
	_, err = tx.Exec(`
		DELETE FROM sessions
		WHERE user_id = $1`,
		userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

// CleanupExpiredSessions removes expired sessions and blacklisted tokens
func (db *DB) CleanupExpiredSessions() error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	// Delete expired sessions
	_, err = tx.Exec(`
		DELETE FROM sessions
		WHERE expires_at < CURRENT_TIMESTAMP`)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Delete old blacklisted tokens (older than 24 hours)
	_, err = tx.Exec(`
		DELETE FROM token_blacklist
		WHERE invalidated_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'`)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}