package database

import (
	"database/sql"
	"errors"
	"time"

	"saas-server/models"

	"github.com/google/uuid"
)

// ErrNotFound is returned when a requested resource is not found
var ErrNotFound = errors.New("resource not found")

// CreateLinkedAccount creates a new linked account for a user
func (db *DB) CreateLinkedAccount(userID string, provider, email string) (*models.LinkedAccount, error) {
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	account := &models.LinkedAccount{
		ID:        uuid.New(),
		UserID:    parsedUserID,
		Provider:  provider,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
		INSERT INTO linked_accounts (id, user_id, provider, email, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err = db.QueryRow(
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
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, user_id, provider, email, created_at, updated_at
		FROM linked_accounts
		WHERE user_id = $1`

	rows, err := db.Query(query, parsedUserID)
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

// DeleteLinkedAccount removes a linked account
func (db *DB) DeleteLinkedAccount(id string, userID string) error {
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	query := `
		DELETE FROM linked_accounts
		WHERE id = $1 AND user_id = $2`

	result, err := db.Exec(query, parsedID, parsedUserID)
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
