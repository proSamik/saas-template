package database

import (
	"time"
)

type Order struct {
	ID         int
	UserID     string
	OrderID    int
	CustomerID int
	ProductID  int
	TotalPrice int
	Status     string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (db *DB) CreateOrder(userID string, orderID int, customerID int, productID int, totalPrice int, status string) error {
	query := `
		INSERT INTO orders (user_id, order_id, customer_id, product_id, total_price, status)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := db.Exec(query, userID, orderID, customerID, productID, totalPrice, status)
	return err
}

func (db *DB) GetUserOrders(userID string) ([]Order, error) {
	query := `
		SELECT id, user_id, order_id, customer_id, product_id, total_price, status, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.OrderID,
			&order.CustomerID,
			&order.ProductID,
			&order.TotalPrice,
			&order.Status,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		orders = append(orders, order)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}
