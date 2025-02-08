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
	UpdateUserFields(id string, emailVerified bool, provider string) error
	UserExists(email string) (bool, error)

	// Token management operations
	CreateRefreshToken(userID string, tokenHash string, deviceInfo string, ipAddress string, expiresAt time.Time) error
	GetRefreshToken(tokenHash string) (*models.RefreshToken, error)
	DeleteAllUserRefreshTokens(userID string) error

	// Token blacklist operations
	AddToBlacklist(jti string, userID string, expiresAt time.Time) error
	IsTokenBlacklisted(jti string) (bool, error)
	CleanupExpiredBlacklistedTokens() error

	// Password reset operations
	CreatePasswordResetToken(userID string, token string, expiresAt time.Time) error
	GetPasswordResetToken(token string) (string, error)
	MarkPasswordResetTokenUsed(token string) error

	// Order operations
	GetUserOrders(userID string) ([]models.Orders, error)

	// Subscription operations
	GetSubscriptionByUserID(userID string) (*models.Subscription, error)
}
