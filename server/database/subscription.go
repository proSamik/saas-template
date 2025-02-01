package database

import (
	"saas-server/models"
	"time"
)

// CreateSubscription creates a new subscription record in the database
func (db *DB) CreateSubscription(subscription *models.Subscription) error {
	query := `
		INSERT INTO subscriptions (
			subscription_id, user_id, order_id, customer_id, product_id, variant_id,
			status, cancelled, api_url, renews_at, ends_at, trial_ends_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`
	_, err := db.Exec(query,
		subscription.SubscriptionID, subscription.UserID, subscription.OrderID,
		subscription.CustomerID, subscription.ProductID, subscription.VariantID,
		subscription.Status, subscription.Cancelled, subscription.APIURL,
		subscription.RenewsAt, subscription.EndsAt, subscription.TrialEndsAt,
	)
	return err
}

// UpdateSubscription updates an existing subscription record
func (db *DB) UpdateSubscription(subscriptionID string, status string, cancelled bool, variantID int, renewsAt *time.Time, endsAt *time.Time, trialEndsAt *time.Time) error {
	query := `
		UPDATE subscriptions 
		SET status = $1,
		    cancelled = $2,
		    variant_id = $3,
		    renews_at = $4,
		    ends_at = $5,
		    trial_ends_at = $6,
		    updated_at = CURRENT_TIMESTAMP
		WHERE subscription_id = $7
	`
	_, err := db.Exec(query, status, cancelled, variantID, renewsAt, endsAt, trialEndsAt, subscriptionID)
	return err
}

// GetSubscriptionByUserID retrieves a subscription by user ID
func (db *DB) GetSubscriptionByUserID(userID string) (*models.Subscription, error) {
	var subscription models.Subscription
	query := `
		SELECT id, subscription_id, user_id, order_id, customer_id, product_id, variant_id,
		       status, cancelled, api_url, renews_at, ends_at, trial_ends_at, created_at, updated_at
		FROM subscriptions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := db.QueryRow(query, userID).Scan(
		&subscription.ID, &subscription.SubscriptionID, &subscription.UserID,
		&subscription.OrderID, &subscription.CustomerID, &subscription.ProductID,
		&subscription.VariantID, &subscription.Status, &subscription.Cancelled,
		&subscription.APIURL, &subscription.RenewsAt, &subscription.EndsAt,
		&subscription.TrialEndsAt, &subscription.CreatedAt, &subscription.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &subscription, nil
}
