package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"saas-server/models"
	"time"

	"github.com/gin-gonic/gin"
)

type WebhookPayload struct {
	Data struct {
		Type       string `json:"type"`
		ID         string `json:"id"`
		Attributes struct {
			StoreID    int        `json:"store_id"`
			CustomerID int        `json:"customer_id"`
			OrderID    int        `json:"order_number"`
			Status     string     `json:"status"`
			UserName   string     `json:"user_name"`
			UserEmail  string     `json:"user_email"`
			Refunded   bool       `json:"refunded"`
			RefundedAt *time.Time `json:"refunded_at"`
			Cancelled  bool       `json:"cancelled"`
			ProductID  int        `json:"product_id"`
			Pause      *struct {
				Mode      string     `json:"mode"`
				ResumesAt *time.Time `json:"resumes_at"`
			} `json:"pause"`
			TrialEndsAt    *time.Time `json:"trial_ends_at"`
			RenewsAt       *time.Time `json:"renews_at"`
			EndsAt         *time.Time `json:"ends_at"`
			CreatedAt      time.Time  `json:"created_at"`
			UpdatedAt      time.Time  `json:"updated_at"`
			FirstOrderItem struct {
				ProductID int `json:"product_id"`
				VariantID int `json:"variant_id"`
			} `json:"first_order_item"`
		} `json:"attributes"`
		Links struct {
			Self string `json:"self"`
		} `json:"links"`
	} `json:"data"`
	Meta struct {
		EventName  string            `json:"event_name"`
		CustomData map[string]string `json:"custom_data"`
		TestMode   bool              `json:"test_mode"`
		WebhookID  string            `json:"webhook_id"`
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
	// Order operations
	CreateOrder(userID string, orderID int, customerID int, productID int, variantID int, userEmail string, status string) error
	UpdateOrderRefund(orderID int, refundedAt *time.Time) error

	// Subscription operations
	GetSubscriptionByUserID(userID string) (*models.Subscription, error)
	CreateSubscription(subscription *models.Subscription) error
	UpdateSubscriptionDetails(subscriptionID string, variantID int, status string, cancelled bool, renewsAt *time.Time, endsAt *time.Time) error
	UpdateSubscriptionStatus(subscriptionID string, status string, cancelled bool, pauseMode string, resumesAt *time.Time, endsAt *time.Time) error
	UpdateSubscriptionPayment(subscriptionID string, status string, renewsAt *time.Time) error
}

type WebhookHandler struct {
	DB Database
}

// CancelSubscription handles the cancellation of a user's subscription through webhook
func (h *WebhookHandler) CancelSubscription(c *gin.Context) {
	var req struct {
		UserID string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}

	// Get user subscription
	sub, err := h.DB.GetSubscriptionByUserID(req.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	if sub == nil || sub.Status != "active" {
		c.JSON(http.StatusPaymentRequired, gin.H{"message": "You are not subscribed"})
		return
	}

	// Send request to Lemon Squeezy
	client := &http.Client{}
	reqBody, _ := json.Marshal(map[string]interface{}{
		"data": map[string]interface{}{
			"type": "subscriptions",
			"id":   sub.SubscriptionID,
			"attributes": map[string]interface{}{
				"cancelled": true,
			},
		},
	})

	request, _ := http.NewRequest("PATCH",
		fmt.Sprintf("https://api.lemonsqueezy.com/v1/subscriptions/%s", sub.SubscriptionID),
		bytes.NewBuffer(reqBody))

	request.Header.Set("Accept", "application/vnd.api+json")
	request.Header.Set("Content-Type", "application/vnd.api+json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("LEMONSQUEEZY_API_KEY")))

	resp, err := client.Do(request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to cancel subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Your subscription has been cancelled. You will still have access to our product until '%s'", sub.RenewsAt.Format("2006-01-02 15:04:05")),
	})
}

// ResumeSubscription handles the resumption of a cancelled subscription through webhook
func (h *WebhookHandler) ResumeSubscription(c *gin.Context) {
	var req struct {
		UserID string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}

	// Get user subscription
	sub, err := h.DB.GetSubscriptionByUserID(req.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	if sub == nil || sub.Status != "active" {
		c.JSON(http.StatusPaymentRequired, gin.H{"message": "You are not subscribed"})
		return
	}

	// Send request to Lemon Squeezy
	client := &http.Client{}
	reqBody, _ := json.Marshal(map[string]interface{}{
		"data": map[string]interface{}{
			"type": "subscriptions",
			"id":   sub.SubscriptionID,
			"attributes": map[string]interface{}{
				"cancelled": false,
			},
		},
	})

	request, _ := http.NewRequest("PATCH",
		fmt.Sprintf("https://api.lemonsqueezy.com/v1/subscriptions/%s", sub.SubscriptionID),
		bytes.NewBuffer(reqBody))

	request.Header.Set("Accept", "application/vnd.api+json")
	request.Header.Set("Content-Type", "application/vnd.api+json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("LEMONSQUEEZY_API_KEY")))

	resp, err := client.Do(request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to resume subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Your subscription has been resumed successfully.",
	})
}

func (h *WebhookHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
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
	case "order_created":
		log.Printf("[Webhook] Processing order creation")
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
			payload.Data.Attributes.FirstOrderItem.ProductID,
			payload.Data.Attributes.FirstOrderItem.VariantID,
			payload.Data.Attributes.UserEmail,
			payload.Data.Attributes.Status,
		)

	case "subscription_created":
		log.Printf("[Webhook] Processing subscription creation")
		// Check if CustomData is available
		if len(payload.Meta.CustomData) == 0 {
			log.Printf("[Webhook] Error: No user ID provided in CustomData")
			http.Error(w, "Missing user ID in CustomData", http.StatusBadRequest)
			return
		}
		// Create subscription record
		subscription := &models.Subscription{
			SubscriptionID: payload.Data.ID,
			UserID:         payload.Meta.CustomData["user_id"],
			OrderID:        payload.Data.Attributes.OrderID,
			CustomerID:     payload.Data.Attributes.CustomerID,
			ProductID:      payload.Data.Attributes.FirstOrderItem.ProductID,
			VariantID:      payload.Data.Attributes.FirstOrderItem.VariantID,
			Status:         payload.Data.Attributes.Status,
			Cancelled:      payload.Data.Attributes.Cancelled,
			APIURL:         payload.Data.Links.Self,
			RenewsAt:       payload.Data.Attributes.RenewsAt,
			EndsAt:         payload.Data.Attributes.EndsAt,
			TrialEndsAt:    payload.Data.Attributes.TrialEndsAt,
			CreatedAt:      payload.Data.Attributes.CreatedAt,
			UpdatedAt:      payload.Data.Attributes.UpdatedAt,
		}
		err = h.DB.CreateSubscription(subscription)

	case "subscription_updated", "subscription_payment_success", "subscription_payment_recovered", "subscription_plan_changed":
		log.Printf("[Webhook] Processing subscription update/payment/plan change")
		// Update subscription details
		err = h.DB.UpdateSubscriptionDetails(
			payload.Data.ID,
			payload.Data.Attributes.FirstOrderItem.VariantID,
			payload.Data.Attributes.Status,
			payload.Data.Attributes.Cancelled,
			payload.Data.Attributes.RenewsAt,
			payload.Data.Attributes.EndsAt,
		)

		// Update payment status if it's a payment event
		if payload.Meta.EventName == "subscription_payment_success" ||
			payload.Meta.EventName == "subscription_payment_recovered" {
			err = h.DB.UpdateSubscriptionPayment(
				payload.Data.ID,
				payload.Data.Attributes.Status,
				payload.Data.Attributes.RenewsAt,
			)
		}

	case "subscription_cancelled", "subscription_expired":
		log.Printf("[Webhook] Processing subscription cancellation/expiration")
		// Update subscription status
		err = h.DB.UpdateSubscriptionStatus(
			payload.Data.ID,
			payload.Data.Attributes.Status,
			true,
			"",
			nil,
			payload.Data.Attributes.EndsAt,
		)

	case "subscription_paused":
		log.Printf("[Webhook] Processing subscription pause")
		// Update subscription status to paused only
		err = h.DB.UpdateSubscriptionStatus(
			payload.Data.ID,
			"paused",
			false,
			"",
			nil,
			nil,
		)

	case "subscription_unpaused", "subscription_resumed":
		log.Printf("[Webhook] Processing subscription unpause/resume")
		// Update subscription status
		err = h.DB.UpdateSubscriptionStatus(
			payload.Data.ID,
			"active",
			false,
			"",
			nil,
			nil,
		)

	case "subscription_payment_failed":
		log.Printf("[Webhook] Processing failed payment")
		// Update subscription payment status
		err = h.DB.UpdateSubscriptionPayment(
			payload.Data.ID,
			"failed",
			nil,
		)

	case "subscription_payment_refunded":
		log.Printf("[Webhook] Processing subscription payment refund")
		// Update subscription payment status and handle refund
		err = h.DB.UpdateSubscriptionPayment(
			payload.Data.ID,
			"refunded",
			nil,
		)

	case "order_refunded":
		log.Printf("[Webhook] Processing order refund")
		// Update order status and refund timestamp
		err = h.DB.UpdateOrderRefund(
			payload.Data.Attributes.OrderID,
			payload.Data.Attributes.RefundedAt,
		)

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
