package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"saas-server/models"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGoogleAuth(t *testing.T) {
	tests := []struct {
		name           string
		request        GoogleAuthRequest
		existingUser   *models.User
		newUser        *models.User
		mockError      error
		expectedStatus int
		expectedError  string
		orderCreated   bool
	}{
		{
			name: "missing tokens",
			request: GoogleAuthRequest{
				User: struct {
					Email string `json:"email"`
					Name  string `json:"name"`
					Image string `json:"image"`
				}{
					Email: "test@example.com",
					Name:  "Test User",
				},
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Both access_token and id_token are required",
		},
		{
			name: "missing user info",
			request: GoogleAuthRequest{
				AccessToken: "valid-access-token",
				IDToken:     "valid-id-token",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Missing user information",
		},
		{
			name: "database error checking existing user",
			request: GoogleAuthRequest{
				AccessToken: "valid-access-token",
				IDToken:     "valid-id-token",
				User: struct {
					Email string `json:"email"`
					Name  string `json:"name"`
					Image string `json:"image"`
				}{
					Email: "error@example.com",
					Name:  "Error User",
				},
			},
			mockError:      assert.AnError,
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "Failed to create user",
		},
		{
			name: "successful login with existing user",
			request: GoogleAuthRequest{
				AccessToken: "valid-access-token",
				IDToken:     "valid-id-token",
				User: struct {
					Email string `json:"email"`
					Name  string `json:"name"`
					Image string `json:"image"`
				}{
					Email: "existing@example.com",
					Name:  "Existing User",
					Image: "https://example.com/avatar.jpg",
				},
			},
			existingUser: &models.User{
				ID:    "existing-user-id",
				Email: "existing@example.com",
				Name:  "Existing User",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "successful registration of new user",
			request: GoogleAuthRequest{
				AccessToken: "valid-access-token",
				IDToken:     "valid-id-token",
				User: struct {
					Email string `json:"email"`
					Name  string `json:"name"`
					Image string `json:"image"`
				}{
					Email: "new@example.com",
					Name:  "New User",
					Image: "https://example.com/avatar.jpg",
				},
			},
			newUser: &models.User{
				ID:    "new-user-id",
				Email: "new@example.com",
				Name:  "New User",
			},
			expectedStatus: http.StatusOK,
			orderCreated:   true,
		},
		{
			name: "error creating new user",
			request: GoogleAuthRequest{
				AccessToken: "valid-access-token",
				IDToken:     "valid-id-token",
				User: struct {
					Email string `json:"email"`
					Name  string `json:"name"`
					Image string `json:"image"`
				}{
					Email: "error@example.com",
					Name:  "Error User",
				},
			},
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "Failed to create user",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock DB
			mockDB := new(MockDB)

			// Setup expectations
			if tc.request.User.Email != "" {
				if tc.existingUser != nil {
					mockDB.On("GetUserByEmail", tc.request.User.Email).Return(tc.existingUser, nil)
					mockDB.On("CreateSession", tc.existingUser.ID, mock.Anything, mock.Anything, mock.Anything).Return(nil)
					mockDB.On("CreateRefreshToken", tc.existingUser.ID, mock.Anything, mock.Anything).Return(nil)
					if tc.orderCreated {
						mockDB.On("CreateOrder", tc.existingUser.ID, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
					}
				} else if tc.newUser != nil {
					mockDB.On("GetUserByEmail", tc.request.User.Email).Return(nil, ErrUserNotFound)
					mockDB.On("CreateUser", tc.request.User.Email, "", tc.request.User.Name).Return(tc.newUser, nil)
					mockDB.On("CreateSession", tc.newUser.ID, mock.Anything, mock.Anything, mock.Anything).Return(nil)
					mockDB.On("CreateRefreshToken", tc.newUser.ID, mock.Anything, mock.Anything).Return(nil)
					if tc.orderCreated {
						mockDB.On("CreateOrder", tc.newUser.ID, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
					}
				} else if tc.expectedError == "Failed to create user" {
					mockDB.On("GetUserByEmail", tc.request.User.Email).Return(nil, ErrUserNotFound)
					mockDB.On("CreateUser", tc.request.User.Email, "", tc.request.User.Name).Return(nil, assert.AnError)
				} else if tc.expectedError == "Internal server error" {
					mockDB.On("GetUserByEmail", tc.request.User.Email).Return(nil, assert.AnError)
					mockDB.On("CreateUser", tc.request.User.Email, "", tc.request.User.Name).Return(nil, assert.AnError)
				}
			}

			// Create handler
			handler := &AuthHandler{
				db:        mockDB,
				jwtSecret: []byte("test-secret"),
			}

			// Create request
			body, _ := json.Marshal(tc.request)
			req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call handler
			handler.GoogleAuth(rr, req)

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
				if tc.existingUser != nil {
					assert.Equal(t, tc.existingUser.Email, response.Email)
					assert.Equal(t, tc.existingUser.Name, response.Name)
				} else if tc.newUser != nil {
					assert.Equal(t, tc.newUser.Email, response.Email)
					assert.Equal(t, tc.newUser.Name, response.Name)
				}
			}

			// Verify mocks
			mockDB.AssertExpectations(t)
		})
	}
}
