package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

type WebhookPayload struct {
	Data struct {
		ID         string `json:"id"`
		Attributes struct {
			ProductID  int       `json:"product_id"`
			CustomerID int       `json:"customer_id"`
			VariantID  int       `json:"variant_id"`
			RenewsAt   time.Time `json:"renews_at"`
			Cancelled  bool      `json:"cancelled"`
			OrderID    int       `json:"order_id"`
			TotalPrice int       `json:"total_price"`
			Status     string    `json:"status"`
		} `json:"attributes"`
	} `json:"data"`
	Meta struct {
		EventName  string            `json:"event_name"`
		CustomData map[string]string `json:"custom_data"`
	} `json:"meta"`
}

func validateWebhookSignature(payload []byte, signature string, secret string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// Handler handles HTTP requests
// Database interface defines methods for database operations
type Database interface {
	CreateOrder(userID string, orderID int, customerID int, productID int, totalPrice int, status string) error
	GetUserSubscriptionStatus(userID string) (*SubscriptionStatus, error)
	UpdateUserSubscription(userID string, subscriptionID string, customerID int, variantID int, renewsAt time.Time) error
	UpdateSubscriptionDetails(subscriptionID string, variantID int, renewsAt time.Time) error
	UpdateSubscriptionStatus(subscriptionID string, cancelled bool) error
}

type Handler struct {
	DB Database
}

func (h *Handler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Webhook] Received new webhook request from %s", r.RemoteAddr)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[Webhook] Error reading request body: %v", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Log raw webhook payload for debugging
	log.Printf("[Webhook] Raw payload: %s", string(body))

	// Get the signature from header
	signature := r.Header.Get("x-signature")
	if signature == "" {
		log.Printf("[Webhook] Missing signature in request headers")
		http.Error(w, "Missing signature", http.StatusBadRequest)
		return
	}

	// Validate signature
	if !validateWebhookSignature(body, signature, os.Getenv("LEMON_SQUEEZY_SIGNING_SECRET")) {
		log.Printf("[Webhook] Invalid signature received")
		http.Error(w, "Invalid signature", http.StatusForbidden)
		return
	}

	log.Printf("[Webhook] Signature validation successful")

	// Parse the payload
	var payload WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[Webhook] Failed to parse payload: %v", err)
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	log.Printf("[Webhook] Event: %s, Product ID: %d", payload.Meta.EventName, payload.Data.Attributes.ProductID)

	// Handle different webhook events
	switch payload.Meta.EventName {
	case "subscription_created":
		log.Printf("[Webhook] Processing subscription creation")
		// Check if CustomData is available
		if len(payload.Meta.CustomData) == 0 {
			log.Printf("[Webhook] Error: No user ID provided in CustomData")
			http.Error(w, "Missing user ID in CustomData", http.StatusBadRequest)
			return
		}
		// Update user with subscription details
		err = h.DB.UpdateUserSubscription(
			payload.Meta.CustomData["user_id"], // userID
			payload.Data.ID,
			payload.Data.Attributes.CustomerID,
			payload.Data.Attributes.VariantID,
			payload.Data.Attributes.RenewsAt,
		)

	case "subscription_payment_success":
		log.Printf("[Webhook] Processing subscription payment")
		// Check if CustomData is available
		if len(payload.Meta.CustomData) == 0 {
			log.Printf("[Webhook] Error: No user ID provided in CustomData")
			http.Error(w, "Missing user ID in CustomData", http.StatusBadRequest)
			return
		}
		// Create order record
		err = h.DB.CreateOrder(
			payload.Meta.CustomData["user_id"],
			payload.Data.Attributes.OrderID,
			payload.Data.Attributes.CustomerID,
			payload.Data.Attributes.ProductID,
			payload.Data.Attributes.TotalPrice,
			payload.Data.Attributes.Status,
		)
		// Update subscription details if needed
		if err == nil {
			err = h.DB.UpdateSubscriptionDetails(
				payload.Data.ID,
				payload.Data.Attributes.VariantID,
				payload.Data.Attributes.RenewsAt,
			)
		}

	case "subscription_updated":
		log.Printf("[Webhook] Processing subscription update")
		// Update subscription details
		err = h.DB.UpdateSubscriptionDetails(
			payload.Data.ID,
			payload.Data.Attributes.VariantID,
			payload.Data.Attributes.RenewsAt,
		)
		if err == nil && payload.Data.Attributes.Cancelled {
			err = h.DB.UpdateSubscriptionStatus(payload.Data.ID, true)
		}

	case "subscription_cancelled":
		log.Printf("[Webhook] Processing subscription cancellation")
		// Update subscription status
		err = h.DB.UpdateSubscriptionStatus(payload.Data.ID, true)

	default:
		log.Printf("[Webhook] Unhandled event type: %s", payload.Meta.EventName)
		w.WriteHeader(http.StatusOK)
		return
	}

	if err != nil {
		log.Printf("[Webhook] Error processing webhook: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
