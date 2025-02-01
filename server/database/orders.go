package database

import (
	"saas-server/models"
)

// CreateOrder creates a new order record in the database
func (db *DB) CreateOrder(userID string, orderID int, customerID int, productID int, variantID int, userEmail string, status string) error {
	query := `
		INSERT INTO orders (user_id, order_id, customer_id, product_id, variant_id, user_email, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := db.Exec(query, userID, orderID, customerID, productID, variantID, userEmail, status)
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
