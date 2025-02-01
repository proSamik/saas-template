package database

import (
	"fmt"
	"saas-server/models"
	"time"
)

// CreateOrder creates a new order record in the database
func (db *DB) CreateOrder(userID string, orderID int, customerID int, productID int, variantID int, userEmail string, status string) error {
	query := `
		INSERT INTO orders (
			user_id, order_id, customer_id, product_id, variant_id, 
			user_email, status, api_url, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

	apiURL := fmt.Sprintf("https://api.lemonsqueezy.com/v1/orders/%d", orderID)
	_, err := db.Exec(query, userID, orderID, customerID, productID, variantID, userEmail, status, apiURL)
	return err
}

// UpdateOrderStatus updates the status and refund information of an order
func (db *DB) UpdateOrderStatus(orderID int, status string, refunded bool, refundedAt *time.Time) error {
	query := `
		UPDATE orders 
		SET status = $1, refunded_at = $2, updated_at = NOW()
		WHERE order_id = $3`

	_, err := db.Exec(query, status, refundedAt, orderID)
	return err
}

// UpdateOrderRefund updates the order's refund status and timestamp
func (db *DB) UpdateOrderRefund(orderID int, refundedAt *time.Time) error {
	query := `
		UPDATE orders
		SET status = 'refunded', refunded_at = $1, updated_at = NOW()
		WHERE order_id = $2`

	_, err := db.Exec(query, refundedAt, orderID)
	return err
}

// GetUserOrders retrieves all orders for a given user
func (db *DB) GetUserOrders(userID string) ([]models.Orders, error) {
	query := `
		SELECT id, user_id, order_id, customer_id, product_id, variant_id, user_email, status, created_at, updated_at, refunded_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Orders
	for rows.Next() {
		var order models.Orders
		err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.OrderID,
			&order.CustomerID,
			&order.ProductID,
			&order.VariantID,
			&order.UserEmail,
			&order.Status,
			&order.CreatedAt,
			&order.UpdatedAt,
			&order.RefundedAt,
		)
		if err != nil {
			return nil, err
		}
		orders = append(orders, order)
	}

	return orders, rows.Err()
}
