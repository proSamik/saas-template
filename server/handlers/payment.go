package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"saas-server/database"

	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	DB Database
}

// Using SubscriptionStatus from database package
type SubscriptionStatus = database.SubscriptionStatus

type subscriptionRequest struct {
	UserID string `json:"userId"`
}

type subscriptionResponse struct {
	Message string `json:"message"`
}

type lemonSqueezyRequest struct {
	Data struct {
		Type       string `json:"type"`
		ID         string `json:"id"`
		Attributes struct {
			Cancelled bool `json:"cancelled"`
		} `json:"attributes"`
	} `json:"data"`
}

// CancelSubscription handles the cancellation of a user's subscription
func (h *PaymentHandler) CancelSubscription(c *gin.Context) {
	var req subscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, subscriptionResponse{Message: "Invalid request"})
		return
	}

	// Get user subscription status
	status, err := h.DB.GetUserSubscriptionStatus(req.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, subscriptionResponse{Message: "User not found"})
		return
	}

	if !status.IsActive {
		c.JSON(http.StatusPaymentRequired, subscriptionResponse{Message: "You are not subscribed"})
		return
	}

	// Update local subscription status
	if err := h.DB.UpdateSubscriptionStatus(status.SubscriptionID, true); err != nil {
		c.JSON(http.StatusInternalServerError, subscriptionResponse{Message: "Failed to update subscription status"})
		return
	}

	// Prepare request to Lemon Squeezy
	lsReq := lemonSqueezyRequest{
		Data: struct {
			Type       string `json:"type"`
			ID         string `json:"id"`
			Attributes struct {
				Cancelled bool `json:"cancelled"`
			} `json:"attributes"`
		}{
			Type: "subscriptions",
			ID:   status.SubscriptionID,
			Attributes: struct {
				Cancelled bool `json:"cancelled"`
			}{
				Cancelled: true,
			},
		},
	}

	// Send request to Lemon Squeezy
	client := &http.Client{}
	reqBody, _ := json.Marshal(lsReq)
	request, _ := http.NewRequest("PATCH",
		fmt.Sprintf("https://api.lemonsqueezy.com/v1/subscriptions/%s", status.SubscriptionID),
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
		c.JSON(http.StatusInternalServerError, subscriptionResponse{Message: "Failed to cancel subscription"})
		return
	}

	endsAt := status.CurrentPeriodEnd.Format("2006-01-02 15:04:05")
	c.JSON(http.StatusOK, subscriptionResponse{
		Message: fmt.Sprintf("Your subscription has been cancelled. You will still have access to our product until '%s'", endsAt),
	})
}

// ResumeSubscription handles the resumption of a cancelled subscription
func (h *PaymentHandler) ResumeSubscription(c *gin.Context) {
	var req subscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, subscriptionResponse{Message: "Invalid request"})
		return
	}

	// Get user subscription status
	status, err := h.DB.GetUserSubscriptionStatus(req.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, subscriptionResponse{Message: "User not found"})
		return
	}

	if !status.IsActive {
		c.JSON(http.StatusPaymentRequired, subscriptionResponse{Message: "You are not subscribed"})
		return
	}

	// Prepare request to Lemon Squeezy
	lsReq := lemonSqueezyRequest{
		Data: struct {
			Type       string `json:"type"`
			ID         string `json:"id"`
			Attributes struct {
				Cancelled bool `json:"cancelled"`
			} `json:"attributes"`
		}{
			Type: "subscriptions",
			ID:   status.SubscriptionID,
			Attributes: struct {
				Cancelled bool `json:"cancelled"`
			}{
				Cancelled: false,
			},
		},
	}

	// Send request to Lemon Squeezy
	client := &http.Client{}
	reqBody, _ := json.Marshal(lsReq)
	request, _ := http.NewRequest("PATCH",
		fmt.Sprintf("https://api.lemonsqueezy.com/v1/subscriptions/%s", status.SubscriptionID),
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
		c.JSON(http.StatusInternalServerError, subscriptionResponse{Message: "Failed to resume subscription"})
		return
	}

	c.JSON(http.StatusOK, subscriptionResponse{
		Message: "Your subscription has been resumed successfully.",
	})
}
