package database

import (
	"saas-server/models"
	"time"
)

// CreateSubscription creates a new subscription record in the database
func (db *DB) CreateSubscription(userID string, subscriptionID int, orderID int, customerID int, productID int, variantID int, status string, apiURL string, renewsAt *time.Time, endsAt *time.Time, trialEndsAt *time.Time) error {
	query := `
		INSERT INTO subscriptions (
			subscription_id, user_id, order_id, customer_id, product_id, variant_id,
			status, api_url, renews_at, ends_at, trial_ends_at,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`
	_, err := db.Exec(query,
		subscriptionID, userID, orderID, customerID, productID, variantID,
		status, apiURL, renewsAt, endsAt, trialEndsAt,
	)
	return err
}

// UpdateSubscription updates an existing subscription record
func (db *DB) UpdateSubscription(subscriptionID int, status string, cancelled bool, renewsAt *time.Time, endsAt *time.Time, trialEndsAt *time.Time) error {
	query := `
		UPDATE subscriptions 
		SET status = $1,
		    cancelled = $2,
		    renews_at = $3,
		    ends_at = $4,
		    trial_ends_at = $5,
		    updated_at = CURRENT_TIMESTAMP
		WHERE subscription_id = $6
	`
	_, err := db.Exec(query, status, cancelled, renewsAt, endsAt, trialEndsAt, subscriptionID)
	return err
}

// GetSubscriptionByUserID retrieves a subscription by user ID
func (db *DB) GetSubscriptionByUserID(userID string) (*models.Subscription, error) {
	var subscription models.Subscription
	query := `
		SELECT id, subscription_id, user_id, customer_id, product_id, variant_id,
		       status, cancelled, api_url, renews_at, ends_at, trial_ends_at,
		       created_at, updated_at
		FROM subscriptions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := db.QueryRow(query, userID).Scan(
		&subscription.ID,
		&subscription.SubscriptionID,
		&subscription.UserID,
		&subscription.CustomerID,
		&subscription.ProductID,
		&subscription.VariantID,
		&subscription.Status,
		&subscription.Cancelled,
		&subscription.APIURL,
		&subscription.RenewsAt,
		&subscription.EndsAt,
		&subscription.TrialEndsAt,
		&subscription.CreatedAt,
		&subscription.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &subscription, nil
}
