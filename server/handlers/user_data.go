package handlers

import (
	"encoding/json"
	"net/http"
	"saas-server/database"
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

	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get orders from database
	orders, err := h.DB.GetUserOrders(userID)
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// GetUserSubscription handles GET /api/user/subscription
func (h *UserDataHandler) GetUserSubscription(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get subscription from database
	subscription, err := h.DB.GetSubscriptionByUserID(userID)
	if err != nil {
		// If no subscription found, return empty response with 200 status
		if err.Error() == "sql: no rows in result set" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("null"))
			return
		}
		http.Error(w, "Failed to fetch subscription", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(subscription)
}
