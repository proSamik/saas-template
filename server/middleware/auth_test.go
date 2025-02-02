package middleware

import (
	"net/http"
	"net/http/httptest"
	"saas-server/database"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockDB is a mock implementation of the database interface
type MockDB struct {
	mock.Mock
}

func (m *MockDB) IsTokenBlacklisted(token string) (bool, error) {
	args := m.Called(token)
	return args.Bool(0), args.Error(1)
}

func (m *MockDB) InvalidateSession(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockDB) UpdateSessionActivity(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func TestRequireAuth(t *testing.T) {
	tests := []struct {
		name           string
		setupAuth      func(r *http.Request)
		setupMock      func(m *MockDB)
		expectedStatus int
		expectedError  string
		expectedUserID string
	}{
		{
			name: "database error checking blacklist",
			setupAuth: func(r *http.Request) {
				userID := uuid.New().String()
				token := createTestToken(t, userID, time.Now().Add(15*time.Minute), "test-secret")
				r.Header.Set("Authorization", "Bearer "+token)
			},
			setupMock: func(m *MockDB) {
				m.On("IsTokenBlacklisted", mock.Anything).Return(false, assert.AnError)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "Internal server error",
		},
		{
			name: "malformed token",
			setupAuth: func(r *http.Request) {
				r.Header.Set("Authorization", "Bearer invalid.token.format")
			},
			setupMock:      func(m *MockDB) {},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid token format",
		},
		{
			name: "valid token",
			setupAuth: func(r *http.Request) {
				userID := uuid.New().String()
				token := createTestToken(t, userID, time.Now().Add(15*time.Minute), "test-secret")
				r.Header.Set("Authorization", "Bearer "+token)
				r.Header.Set("User-Agent", "test-agent")
				r.RemoteAddr = "127.0.0.1"
			},
			setupMock: func(m *MockDB) {
				m.On("IsTokenBlacklisted", mock.Anything).Return(false, nil)
				m.On("UpdateSessionActivity", mock.Anything).Return(nil)
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing auth header",
			setupAuth:      func(r *http.Request) {},
			setupMock:      func(m *MockDB) {},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Authorization header required",
		},
		{
			name: "blacklisted token",
			setupAuth: func(r *http.Request) {
				userID := uuid.New().String()
				token := createTestToken(t, userID, time.Now().Add(15*time.Minute), "test-secret")
				r.Header.Set("Authorization", "Bearer "+token)
			},
			setupMock: func(m *MockDB) {
				m.On("IsTokenBlacklisted", mock.Anything).Return(true, nil)
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Token has been revoked",
		},
		{
			name: "expired token",
			setupAuth: func(r *http.Request) {
				userID := uuid.New().String()
				token := createTestToken(t, userID, time.Now().Add(-15*time.Minute), "test-secret")
				r.Header.Set("Authorization", "Bearer "+token)
			},
			setupMock: func(m *MockDB) {
				m.On("IsTokenBlacklisted", mock.Anything).Return(false, nil)
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Token has expired",
		},
		{
			name: "invalid token fingerprint",
			setupAuth: func(r *http.Request) {
				userID := uuid.New().String()
				token := createTestToken(t, userID, time.Now().Add(15*time.Minute), "test-secret")
				r.Header.Set("Authorization", "Bearer "+token)
				// Set different User-Agent to cause fingerprint mismatch
				r.Header.Set("User-Agent", "different-agent")
			},
			setupMock: func(m *MockDB) {
				m.On("IsTokenBlacklisted", mock.Anything).Return(false, nil)
				m.On("InvalidateSession", mock.Anything).Return(nil)
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid token binding",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock DB
			mockDB := new(MockDB)
			tc.setupMock(mockDB)

			// Create middleware
			middleware := &AuthMiddleware{
				db:        &database.DB{},
				jwtSecret: []byte("test-secret"),
			}

			// Create test handler
			nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				userID := GetUserID(r.Context())
				if userID != "" {
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(userID))
				}
			})

			// Create request
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			tc.setupAuth(req)

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call middleware
			middleware.RequireAuth(nextHandler).ServeHTTP(rr, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, rr.Code)
			if tc.expectedError != "" {
				assert.Contains(t, rr.Body.String(), tc.expectedError)
			}

			// Verify mocks
			mockDB.AssertExpectations(t)
		})
	}
}

// Helper function to create test JWT tokens
func createTestToken(t *testing.T, userID string, expiry time.Time, secret string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": expiry.Unix(),
		"jti": uuid.New().String(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("Error creating test token: %v", err)
	}

	return tokenString
}
