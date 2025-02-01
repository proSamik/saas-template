package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"saas-server/models"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// ErrUserNotFound is returned when a user is not found in the database
var ErrUserNotFound = errors.New("user not found")

// MockDB is a mock implementation of the database interface
type MockDB struct {
	mock.Mock
}

// Implement necessary mock methods
func (m *MockDB) GetUserByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockDB) CreateSession(userID string, token string, expiresAt time.Time, deviceInfo string) error {
	args := m.Called(userID, token, expiresAt, deviceInfo)
	return args.Error(0)
}

func (m *MockDB) IsTokenBlacklisted(token string) (bool, error) {
	args := m.Called(token)
	return args.Bool(0), args.Error(1)
}

func (m *MockDB) InvalidateSession(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockDB) CreateRefreshToken(userID string, token string, expiresAt time.Time) error {
	args := m.Called(userID, token, expiresAt)
	return args.Error(0)
}

func (m *MockDB) GetRefreshToken(token string) (string, error) {
	args := m.Called(token)
	return args.String(0), args.Error(1)
}

func (m *MockDB) DeleteRefreshToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockDB) GetUserByID(id string) (*models.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	user, ok := args.Get(0).(*models.User)
	if !ok {
		return nil, assert.AnError
	}
	return user, args.Error(1)
}

func (m *MockDB) UpdateUser(id, name, email string) error {
	args := m.Called(id, name, email)
	return args.Error(0)
}

func (m *MockDB) UpdatePassword(id, hashedPassword string) error {
	args := m.Called(id, hashedPassword)
	return args.Error(0)
}

func (m *MockDB) UserExists(email string) (bool, error) {
	args := m.Called(email)
	return args.Bool(0), args.Error(1)
}

func (m *MockDB) CreateUser(email, password, name string) (*models.User, error) {
	args := m.Called(email, password, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	user, ok := args.Get(0).(*models.User)
	if !ok {
		return nil, assert.AnError
	}
	return user, args.Error(1)
}

// Additional mock methods
func (m *MockDB) CreateOrder(userID string, orderID, customerID, productID, totalPrice int, status string, apiURL string) error {
	args := m.Called(userID, orderID, customerID, productID, totalPrice, status, apiURL)
	return args.Error(0)
}

func (m *MockDB) InvalidateAllUserSessions(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
}

func (m *MockDB) GetLinkedAccounts(userID string) ([]models.LinkedAccount, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.LinkedAccount), args.Error(1)
}

func (m *MockDB) GetLinkedAccountByProviderEmail(provider, email string) (*models.LinkedAccount, error) {
	args := m.Called(provider, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LinkedAccount), args.Error(1)
}

func (m *MockDB) CreateLinkedAccount(userID, provider, email string) (*models.LinkedAccount, error) {
	args := m.Called(userID, provider, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LinkedAccount), args.Error(1)
}

func (m *MockDB) DeleteLinkedAccount(id, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockDB) CreatePasswordResetToken(userID string, token string, expiresAt time.Time) error {
	args := m.Called(userID, token, expiresAt)
	return args.Error(0)
}

func (m *MockDB) GetPasswordResetToken(token string) (string, error) {
	args := m.Called(token)
	return args.String(0), args.Error(1)
}

func (m *MockDB) MarkPasswordResetTokenUsed(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockDB) GetUserOrders(userID string) ([]models.Orders, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Orders), args.Error(1)
}

func (m *MockDB) GetSubscriptionByUserID(userID string) (*models.Subscription, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Subscription), args.Error(1)
}

func TestLogin(t *testing.T) {
	tests := []struct {
		name           string
		email          string
		password       string
		mockUser       *models.User
		mockError      error
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "missing email",
			password:       "Password123!",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Email is required",
		},
		{
			name:           "missing password",
			email:          "test@example.com",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Password is required",
		},
		{
			name:           "invalid email",
			email:          "nonexistent@example.com",
			password:       "Password123!",
			mockError:      ErrUserNotFound,
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid credentials",
		},
		{
			name:     "invalid password",
			email:    "test@example.com",
			password: "WrongPassword123!",
			mockUser: &models.User{
				ID:       "test-user-id",
				Email:    "test@example.com",
				Password: mustHashPassword("Password123!"),
				Name:     "Test User",
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid credentials",
		},
		{
			name:     "successful login",
			email:    "test@example.com",
			password: "Password123!",
			mockUser: &models.User{
				ID:       "test-user-id",
				Email:    "test@example.com",
				Password: mustHashPassword("Password123!"),
				Name:     "Test User",
			},
			expectedStatus: http.StatusOK,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock DB
			mockDB := new(MockDB)
			if tc.email != "" && tc.password != "" {
				mockDB.On("GetUserByEmail", tc.email).Return(tc.mockUser, tc.mockError)
				if tc.mockUser != nil && tc.mockError == nil && tc.password == "Password123!" {
					mockDB.On("CreateSession", tc.mockUser.ID, mock.Anything, mock.Anything, mock.Anything).Return(nil)
					mockDB.On("CreateRefreshToken", tc.mockUser.ID, mock.Anything, mock.Anything).Return(nil)
				}
			}

			// Create handler with mock DB
			handler := &AuthHandler{
				db:        mockDB,
				jwtSecret: "test-secret",
			}

			// Create request
			reqBody := LoginRequest{
				Email:    tc.email,
				Password: tc.password,
			}
			body, _ := json.Marshal(reqBody)
			req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call handler
			handler.Login(rr, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, rr.Code)

			if tc.expectedError != "" {
				assert.Contains(t, rr.Body.String(), tc.expectedError)
			} else {
				var response AuthResponse
				err := json.NewDecoder(rr.Body).Decode(&response)
				assert.NoError(t, err)
				assert.NotEmpty(t, response.Token)
				assert.NotEmpty(t, response.RefreshToken)
				assert.Equal(t, tc.mockUser.Email, response.Email)
				assert.Equal(t, tc.mockUser.Name, response.Name)
			}

			// Verify mocks
			mockDB.AssertExpectations(t)
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name          string
		password      string
		expectedError string
	}{
		{
			name:          "valid password",
			password:      "Password123!",
			expectedError: "",
		},
		{
			name:          "too short",
			password:      "Pass1!",
			expectedError: "password must be at least 8 characters long",
		},
		{
			name:          "no uppercase",
			password:      "password123!",
			expectedError: "password must contain at least one uppercase letter",
		},
		{
			name:          "no lowercase",
			password:      "PASSWORD123!",
			expectedError: "password must contain at least one lowercase letter",
		},
		{
			name:          "no number",
			password:      "Password!",
			expectedError: "password must contain at least one number",
		},
		{
			name:          "no special char",
			password:      "Password123",
			expectedError: "password must contain at least one special character",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := validatePassword(tc.password)
			if tc.expectedError == "" {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, tc.expectedError)
			}
		})
	}
}

// Helper function to hash passwords for testing
func mustHashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(hash)
}

func (m *MockDB) CreateSubscription(subscription *models.Subscription) error {
	args := m.Called(subscription)
	return args.Error(0)
}

func (m *MockDB) UpdateSubscription(subscriptionID string, status string, cancelled bool, variantID int, renewsAt *time.Time, endsAt *time.Time, trialEndsAt *time.Time) error {
	args := m.Called(subscriptionID, status, cancelled, variantID, renewsAt, endsAt, trialEndsAt)
	return args.Error(0)
}
