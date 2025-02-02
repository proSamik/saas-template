package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"saas-server/database"
	"saas-server/middleware"
	"saas-server/models"
)

type UserDataHandler struct {
	DB database.DBInterface
}

func NewUserDataHandler(db database.DBInterface) *UserDataHandler {
	return &UserDataHandler{DB: db}
}

// GetUserOrders handles GET /api/user/orders
func (h *UserDataHandler) GetUserOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context using the middleware's GetUserID helper
	userID := middleware.GetUserID(r.Context())
	log.Printf("[UserData] Raw user ID from context: %+v (type: %T)", userID, userID)
	if userID == "" {
		log.Printf("[UserData] Failed to get valid user ID from context")
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}
	log.Printf("[UserData] Validated user ID: %s", userID)

	// Verify user exists
	_, err := h.DB.GetUserByID(userID)
	if err != nil {
		log.Printf("[UserData] User not found in database: %v", err)
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	// Set content type header early
	w.Header().Set("Content-Type", "application/json")

	// Get orders from database
	orders, err := h.DB.GetUserOrders(userID)
	if err != nil {
		// Return empty array for any database error (no rows, table doesn't exist, or other errors)
		json.NewEncoder(w).Encode([]models.Orders{})
		return
	}

	json.NewEncoder(w).Encode(orders)
}

// GetUserSubscription handles GET /api/user/subscription
func (h *UserDataHandler) GetUserSubscription(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context using the middleware's GetUserID helper
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	// Verify user exists
	_, err := h.DB.GetUserByID(userID)
	if err != nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	// Set content type header early
	w.Header().Set("Content-Type", "application/json")

	// Get subscription from database
	subscription, err := h.DB.GetSubscriptionByUserID(userID)
	if err != nil {
		// Return empty array for any database error (no rows, table doesn't exist, or other errors)
		json.NewEncoder(w).Encode([]models.Subscription{})
		return
	}

	json.NewEncoder(w).Encode([]models.Subscription{*subscription})
}
