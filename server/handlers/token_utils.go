package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
)

// generateTokenFingerprint creates a unique fingerprint for token binding
// using client-specific attributes like User-Agent and IP address
func generateTokenFingerprint(r *http.Request) string {
	// Get client IP, checking for proxy headers first
	clientIP := r.Header.Get("X-Forwarded-For")
	if clientIP == "" {
		clientIP = r.Header.Get("X-Real-IP")
	}
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}
	// Remove port number if present
	if i := strings.LastIndex(clientIP, ":"); i != -1 {
		clientIP = clientIP[:i]
	}

	// Get User-Agent
	userAgent := r.UserAgent()

	// Combine values and hash
	data := clientIP + "|" + userAgent
	hash := sha256.Sum256([]byte(data))

	// Return hex-encoded hash
	return hex.EncodeToString(hash[:])
}