package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"github.com/NdoleStudio/lemonsqueezy-go"
)

type CheckoutHandler struct {
	client *lemonsqueezy.Client
}

type CheckoutRequest struct {
	ProductID string `json:"productId"`
	VariantID string `json:"variantId"`
	Email     string `json:"email"`
	UserID    string `json:"userId"`
}

func NewCheckoutHandler() *CheckoutHandler {
	apiKey := os.Getenv("LEMON_SQUEEZY_API_KEY")
	client := lemonsqueezy.New(lemonsqueezy.WithAPIKey(apiKey))
	return &CheckoutHandler{client: client}
}

// CreateCheckout handles POST /api/checkout
func (h *CheckoutHandler) CreateCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get and validate required environment variables
	storeIDStr := os.Getenv("LEMON_SQUEEZY_STORE_ID")
	signingSecret := os.Getenv("LEMON_SQUEEZY_SIGNING_SECRET")

	if storeIDStr == "" || signingSecret == "" {
		http.Error(w, "Missing required environment configuration", http.StatusInternalServerError)
		return
	}

	// Convert store ID to integer
	storeID, err := strconv.Atoi(storeIDStr)
	if err != nil {
		http.Error(w, "Invalid store ID configuration", http.StatusInternalServerError)
		return
	}

	variantID, err := strconv.Atoi(req.VariantID)
	if err != nil {
		http.Error(w, "Invalid variant ID", http.StatusBadRequest)
		return
	}

	checkout, _, err := h.client.Checkouts.Create(context.Background(), storeID, variantID, &lemonsqueezy.CheckoutCreateAttributes{
		CheckoutData: lemonsqueezy.CheckoutCreateData{
			Email: req.Email,
			Custom: map[string]any{
				"user_id": req.UserID,
			},
		},
	})

	if err != nil {
		http.Error(w, "Failed to create checkout", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"checkoutURL": checkout.Data.Attributes.URL,
	})
}
