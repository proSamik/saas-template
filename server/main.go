// Package main is the entry point for the SaaS platform backend.
// It initializes the database connection, sets up HTTP routes, and starts the server.
// The server provides RESTful APIs for user authentication, profile management,
// and other core functionalities of the SaaS platform.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"saas-server/database"
	"saas-server/handlers"
	"saas-server/middleware"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

// main initializes and starts the HTTP server with the following steps:
// 1. Loads environment variables from .env file
// 2. Establishes database connection and initializes schema
// 3. Sets up authentication handlers and middleware
// 4. Configures routes for both public and protected endpoints
// 5. Configures CORS settings for cross-origin requests
// 6. Starts the HTTP server on the specified port
func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Create database connection string
	dbURL := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	// Initialize database
	db, err := database.New(dbURL)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	// Initialize database schema
	if err := db.InitSchema(); err != nil {
		log.Fatal("Error initializing database schema:", err)
	}
	log.Println("Database schema initialized successfully")

	// Run database migrations
	migrationManager := database.NewMigrationManager(db)
	if err := migrationManager.RunMigrations(); err != nil {
		log.Fatal("Error running migrations:", err)
	}
	log.Println("Database migrations applied successfully")

	// Initialize handlers and middleware
	authHandler := handlers.NewAuthHandler(db, os.Getenv("JWT_SECRET"))
	authMiddleware := middleware.NewAuthMiddleware(db, os.Getenv("JWT_SECRET"))

	// Create router
	mux := http.NewServeMux()

	// Auth routes (public)
	mux.HandleFunc("/auth/register", authHandler.Register)
	mux.HandleFunc("/auth/login", authHandler.Login)
	mux.HandleFunc("/auth/google", authHandler.GoogleAuth)
	mux.HandleFunc("/auth/refresh", authHandler.RefreshToken)
	mux.HandleFunc("/auth/reset-password/request", authHandler.RequestPasswordReset)
	mux.HandleFunc("/auth/reset-password", authHandler.ResetPassword)

	// Account linking routes (protected)
	mux.Handle("/auth/linked-accounts", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.GetLinkedAccounts)))
	mux.Handle("/auth/link", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.LinkAccount)))
	mux.Handle("/auth/link/", authMiddleware.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			authHandler.UnlinkAccount(w, r)
			return
		}
		http.NotFound(w, r)
	})))

	// User routes (protected)
	mux.Handle("/user/profile", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.UpdateProfile)))
	mux.Handle("/user/password", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.UpdatePassword)))

	// Payment webhook routes - initialize handler once for better resource management
	webhookHandler := &handlers.Handler{DB: db}
	mux.HandleFunc("/payment/webhook", webhookHandler.HandleWebhook)

	// Configure CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("CORS_ORIGIN")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "x-signature"},
		AllowCredentials: true,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, corsHandler.Handler(mux)); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
