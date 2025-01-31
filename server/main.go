// Package main is the entry point for the SaaS platform backend
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"saas-server/handlers"
	authMiddleware "saas-server/middleware"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize Google OAuth provider with credentials from environment
	goth.UseProviders(
		google.New(
			os.Getenv("GOOGLE_CLIENT_ID"),
			os.Getenv("GOOGLE_CLIENT_SECRET"),
			"http://localhost:8080/auth/google/callback",
		),
	)

	// Initialize handlers and middleware
	authHandler := handlers.NewAuthHandler(os.Getenv("JWT_SECRET"))
	auth := authMiddleware.NewAuthMiddleware(os.Getenv("JWT_SECRET"))

	// Create new Chi router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)          // Log API request calls
	r.Use(middleware.Recoverer)       // Recover from panics without crashing server
	r.Use(middleware.AllowContentType("application/json")) // Enforce JSON content type
	
	// Configure CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // Allow requests from frontend
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true, // Allow credentials for cross-origin requests
		MaxAge:           300,  // Maximum age (in seconds) of preflight request cache
	}))

	// Public routes (no authentication required)
	r.Group(func(r chi.Router) {
		// Health check endpoint
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"status": "ok"}`))
		})

		// Authentication endpoints
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Get("/auth/google", authHandler.GoogleAuth)
		r.Get("/auth/google/callback", authHandler.GoogleCallback)
	})

	// Protected routes (authentication required)
	r.Group(func(r chi.Router) {
		r.Use(auth.RequireAuth) // Apply authentication middleware

		// User information endpoint
		r.Get("/user", func(w http.ResponseWriter, r *http.Request) {
			userID := authMiddleware.GetUserID(r.Context())
			w.Write([]byte(`{"user_id": "` + userID + `"}`))
		})
	})

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the server
	log.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
} 