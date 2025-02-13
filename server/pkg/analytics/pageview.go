package analytics

import (
	"time"

	"github.com/google/uuid"
)

// PageView represents a single page view event
type PageView struct {
	ID        int64
	UserID    *uuid.UUID
	VisitorID string
	Path      string
	Referrer  string
	UserAgent string
	IPAddress string
	CreatedAt time.Time
}

// PageViewService defines the interface for page view operations
type PageViewService interface {
	TrackPageView(view *PageView) error
	GetUserJourney(userID uuid.UUID, startTime, endTime time.Time) ([]PageView, error)
	GetVisitorJourneys(startTime, endTime time.Time) ([]PageView, error)
}

// NewPageView creates a new page view instance
func NewPageView(userID *uuid.UUID, visitorID, path, referrer, userAgent, ipAddress string) *PageView {
	return &PageView{
		UserID:    userID,
		VisitorID: visitorID,
		Path:      path,
		Referrer:  referrer,
		UserAgent: userAgent,
		IPAddress: ipAddress,
		CreatedAt: time.Now(),
	}
}
