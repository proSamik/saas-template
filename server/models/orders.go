package models

import (
	"time"
)

type Orders struct {
	ID         int        `json:"id"`
	OrderID    int        `json:"order_id"`
	UserID     string     `json:"user_id"`
	UserEmail  string     `json:"user_email"`
	CustomerID int        `json:"customer_id"`
	ProductID  int        `json:"product_id"`
	VariantID  int        `json:"variant_id"`
	Status     string     `json:"status"`
	APIURL     string     `json:"api_url"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	RefundedAt *time.Time `json:"refunded_at,omitempty"`
}
