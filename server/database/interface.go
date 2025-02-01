package database

import (
	"saas-server/models"
	"time"
)

// DBInterface defines the interface for database operations
type DBInterface interface {
	// User operations
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	CreateUser(email, password, name string) (*models.User, error)
	UpdateUser(id, name, email string) error
	UpdatePassword(id, hashedPassword string) error
	UserExists(email string) (bool, error)

	// Session operations
	CreateSession(userID string, token string, expiresAt time.Time, deviceInfo string) error
	IsTokenBlacklisted(token string) (bool, error)
	InvalidateSession(token string) error
	InvalidateAllUserSessions(userID string) error

	// Refresh token operations
	CreateRefreshToken(userID string, token string, expiresAt time.Time) error
	GetRefreshToken(token string) (string, error)
	DeleteRefreshToken(token string) error

	// Linked accounts operations
	GetLinkedAccounts(userID string) ([]models.LinkedAccount, error)
	GetLinkedAccountByProviderEmail(provider, email string) (*models.LinkedAccount, error)
	CreateLinkedAccount(userID, provider, email string) (*models.LinkedAccount, error)
	DeleteLinkedAccount(id, userID string) error

	// Password reset operations
	CreatePasswordResetToken(userID string, token string, expiresAt time.Time) error
	GetPasswordResetToken(token string) (string, error)
	MarkPasswordResetTokenUsed(token string) error

	// Order operations
	CreateOrder(userID string, orderID int, customerID int, productID int, variantID int, userEmail string, status string) error
	GetUserOrders(userID string) ([]models.Orders, error)

	// Subscription operations
	CreateSubscription(subscription *models.Subscription) error
	UpdateSubscription(subscriptionID string, status string, cancelled bool, variantID int, renewsAt *time.Time, endsAt *time.Time, trialEndsAt *time.Time) error
	GetSubscriptionByUserID(userID string) (*models.Subscription, error)
}
