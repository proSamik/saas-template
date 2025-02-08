package database

import (
	"time"

	"saas-server/pkg/analytics"

	"github.com/google/uuid"
)

// TrackPageView stores a page view event in the database
func (db *DB) TrackPageView(view *analytics.PageView) error {
	query := `
		INSERT INTO page_views (user_id, visitor_id, path, referrer, user_agent, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := db.Exec(query,
		view.UserID, view.VisitorID, view.Path,
		view.Referrer, view.UserAgent, view.IPAddress,
		view.CreatedAt,
	)
	return err
}

// GetUserJourney retrieves the page view history for a specific user within a time range
func (db *DB) GetUserJourney(userID uuid.UUID, startTime, endTime time.Time) ([]analytics.PageView, error) {
	query := `
		SELECT id, user_id, visitor_id, path, referrer, user_agent, ip_address, created_at
		FROM page_views
		WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
		ORDER BY created_at ASC
	`

	rows, err := db.Query(query, userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pageViews []analytics.PageView
	for rows.Next() {
		var view analytics.PageView
		err := rows.Scan(
			&view.ID, &view.UserID, &view.VisitorID,
			&view.Path, &view.Referrer, &view.UserAgent,
			&view.IPAddress, &view.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		pageViews = append(pageViews, view)
	}

	return pageViews, nil
}

// GetVisitorJourney retrieves the page view history for a specific visitor within a time range
func (db *DB) GetVisitorJourney(visitorID string, startTime, endTime time.Time) ([]analytics.PageView, error) {
	query := `
		SELECT id, user_id, visitor_id, path, referrer, user_agent, ip_address, created_at
		FROM page_views
		WHERE visitor_id = $1 AND created_at BETWEEN $2 AND $3
		ORDER BY created_at ASC
	`

	rows, err := db.Query(query, visitorID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pageViews []analytics.PageView
	for rows.Next() {
		var view analytics.PageView
		err := rows.Scan(
			&view.ID, &view.UserID, &view.VisitorID,
			&view.Path, &view.Referrer, &view.UserAgent,
			&view.IPAddress, &view.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		pageViews = append(pageViews, view)
	}

	return pageViews, nil
}
