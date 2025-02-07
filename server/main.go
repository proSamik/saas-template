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
	mux.HandleFunc("/auth/reset-password/request", authHandler.RequestPasswordReset)
	mux.HandleFunc("/auth/reset-password", authHandler.ResetPassword)
	mux.HandleFunc("/auth/refresh", authHandler.RefreshToken)

	// Auth Routes (protected)
	mux.Handle("/auth/logout", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.Logout)))
	mux.Handle("/auth/account-password/reset", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.AccountPasswordReset)))

	// User routes (protected)
	mux.Handle("/user/profile", authMiddleware.RequireAuth(http.HandlerFunc(authHandler.UpdateProfile)))

	// Payment webhook routes - initialize handler once for better resource management
	webhookHandler := &handlers.WebhookHandler{DB: db}
	mux.HandleFunc("/payment/webhook", webhookHandler.HandleWebhook)

	// Product routes
	productsHandler := handlers.NewProductsHandler()
	mux.HandleFunc("/api/products", productsHandler.GetProducts)
	mux.HandleFunc("/api/products/", productsHandler.GetProduct)
	mux.HandleFunc("/api/products/store/", productsHandler.GetProductsByStore)

	// Checkout routes
	checkoutHandler := handlers.NewCheckoutHandler()
	mux.HandleFunc("/api/checkout", checkoutHandler.CreateCheckout)

	// User data routes (protected)
	userDataHandler := handlers.NewUserDataHandler(db)
	mux.Handle("/api/user/orders", authMiddleware.RequireAuth(http.HandlerFunc(userDataHandler.GetUserOrders)))
	mux.Handle("/api/user/subscription", authMiddleware.RequireAuth(http.HandlerFunc(userDataHandler.GetUserSubscription)))
	mux.Handle("/api/user/subscription/billing", authMiddleware.RequireAuth(http.HandlerFunc(userDataHandler.GetBillingPortal)))

	// Configure CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:      []string{"http://localhost:3000", os.Getenv("FRONTEND_URL")}, // Add your frontend URL
		AllowedMethods:      []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:      []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Requested-With"},
		ExposedHeaders:      []string{"Link"},
		AllowCredentials:    true,
		MaxAge:              300, // Maximum value not ignored by any of major browsers
		AllowPrivateNetwork: true,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), corsHandler.Handler(mux)); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
