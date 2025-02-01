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
			status, cancelled, renews_at, ends_at, trial_ends_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`
	_, err := db.Exec(query,
		subscription.SubscriptionID, subscription.UserID, subscription.OrderID,
		subscription.CustomerID, subscription.ProductID, subscription.VariantID,
		subscription.Status, subscription.Cancelled, subscription.RenewsAt,
		subscription.EndsAt, subscription.TrialEndsAt,
	)
	return err
}

func (db *DB) UpdateUserSubscription(userID string, subscriptionID string, customerID int, variantID int, renewsAt *time.Time) error {
	query := `
		UPDATE users 
		SET subscription_id = $1, customer_id = $2, variant_id = $3, current_period_end = $4, status = 'active'
		WHERE id = $5
	`
	_, err := db.Exec(query, subscriptionID, customerID, variantID, renewsAt, userID)
	return err
}

func (db *DB) UpdateSubscriptionDetails(subscriptionID string, variantID int, status string, cancelled bool, renewsAt *time.Time, endsAt *time.Time) error {
	query := `
		UPDATE users 
		SET variant_id = $1,
		    status = $2,
		    cancelled = $3,
		    current_period_end = $4,
		    ends_at = $5
		WHERE subscription_id = $6
	`
	_, err := db.Exec(query, variantID, status, cancelled, renewsAt, endsAt, subscriptionID)
	return err
}

func (db *DB) UpdateSubscriptionStatus(subscriptionID string, status string, cancelled bool, pauseMode string, resumesAt *time.Time, endsAt *time.Time) error {
	query := `
		UPDATE users
		SET status = $1,
		    cancelled = $2,
		    pause_mode = $3,
		    resumes_at = $4,
		    ends_at = $5
		WHERE subscription_id = $6
	`
	_, err := db.Exec(query, status, cancelled, pauseMode, resumesAt, endsAt, subscriptionID)
	return err
}

func (db *DB) UpdateSubscriptionPayment(subscriptionID string, status string, renewsAt *time.Time) error {
	query := `
		UPDATE users
		SET status = $1,
		    current_period_end = COALESCE($2, current_period_end)
		WHERE subscription_id = $3
	`
	_, err := db.Exec(query, status, renewsAt, subscriptionID)
	return err
}

// GetSubscriptionByUserID retrieves a subscription for a given user ID
func (db *DB) GetSubscriptionByUserID(userID string) (*models.Subscription, error) {
	query := `
		SELECT subscription_id, user_id, order_id, customer_id, product_id, variant_id,
		       status, cancelled, renews_at, ends_at, trial_ends_at, created_at, updated_at
		FROM subscriptions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var subscription models.Subscription
	err := db.QueryRow(query, userID).Scan(
		&subscription.SubscriptionID,
		&subscription.UserID,
		&subscription.OrderID,
		&subscription.CustomerID,
		&subscription.ProductID,
		&subscription.VariantID,
		&subscription.Status,
		&subscription.Cancelled,
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
