package database

import (
	"database/sql"
	"time"
)

type SubscriptionStatus struct {
	IsActive         bool
	SubscriptionID   string
	CustomerID       string
	VariantID        string
	CurrentPeriodEnd time.Time
}

func (db *DB) UpdateUserSubscription(userID string, subscriptionID string, customerID int, variantID int, renewsAt time.Time) error {
	query := `
		UPDATE users 
		SET subscription_id = $1, customer_id = $2, variant_id = $3, current_period_end = $4
		WHERE id = $5
	`
	_, err := db.Exec(query, subscriptionID, customerID, variantID, renewsAt, userID)
	return err
}

func (db *DB) UpdateSubscriptionDetails(subscriptionID string, variantID int, renewsAt time.Time) error {
	query := `
		UPDATE users 
		SET variant_id = $1, current_period_end = $2
		WHERE subscription_id = $3
	`
	_, err := db.Exec(query, variantID, renewsAt, subscriptionID)
	return err
}

func (db *DB) GetUserSubscriptionStatus(userID string) (*SubscriptionStatus, error) {
	query := `
		SELECT subscription_id, customer_id, variant_id, current_period_end
		FROM users
		WHERE id = $1
	`

	var status SubscriptionStatus
	var subscriptionID, customerID, variantID sql.NullString
	var currentPeriodEnd sql.NullTime

	err := db.QueryRow(query, userID).Scan(
		&subscriptionID,
		&customerID,
		&variantID,
		&currentPeriodEnd,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	status.SubscriptionID = subscriptionID.String
	status.CustomerID = customerID.String
	status.VariantID = variantID.String
	if currentPeriodEnd.Valid {
		status.CurrentPeriodEnd = currentPeriodEnd.Time
		// Add 24 hours (86400 seconds) to account for grace period
		status.IsActive = time.Now().Before(currentPeriodEnd.Time.Add(24 * time.Hour))
	}

	return &status, nil
}

func (db *DB) UpdateSubscriptionStatus(subscriptionID string, cancelled bool) error {
	query := `
		UPDATE users
		SET current_period_end = CASE
			WHEN $1 = true THEN NOW()
			ELSE current_period_end
		END
		WHERE subscription_id = $2
	`
	_, err := db.Exec(query, cancelled, subscriptionID)
	return err
}
