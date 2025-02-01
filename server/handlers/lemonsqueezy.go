package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"saas-server/pkg/lemonsqueezy"
)

type LemonSqueezyHandler struct {
	client *lemonsqueezy.Client
}

func NewLemonSqueezyHandler() *LemonSqueezyHandler {
	return &LemonSqueezyHandler{
		client: lemonsqueezy.NewClient(),
	}
}

// GetProducts handles GET /api/products
func (h *LemonSqueezyHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	storeID := os.Getenv("LEMON_SQUEEZY_STORE_ID")
	products, err := h.client.GetProducts(storeID)
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GetProduct handles GET /api/products/{id}
func (h *LemonSqueezyHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract product ID from URL path
	productID := r.URL.Path[len("/api/products/"):]
	if productID == "" {
		http.Error(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	product, err := h.client.GetProduct(productID)
	if err != nil {
		http.Error(w, "Failed to fetch product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// CreateCheckout handles POST /api/checkout
func (h *LemonSqueezyHandler) CreateCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		VariantID  string                 `json:"variantId"`
		Email      string                 `json:"email"`
		CustomData map[string]interface{} `json:"customData"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	storeID := os.Getenv("LEMON_SQUEEZY_STORE_ID")
	checkout, err := h.client.CreateCheckout(storeID, req.VariantID, req.Email, req.CustomData)
	if err != nil {
		http.Error(w, "Failed to create checkout", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(checkout)
}
