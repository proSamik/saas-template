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
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize Google OAuth
	goth.UseProviders(
		google.New(
			os.Getenv("GOOGLE_CLIENT_ID"),
			os.Getenv("GOOGLE_CLIENT_SECRET"),
			"http://localhost:8080/auth/google/callback",
		),
	)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(os.Getenv("JWT_SECRET"))
	auth := authMiddleware.NewAuthMiddleware(os.Getenv("JWT_SECRET"))

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.AllowContentType("application/json"))
	
	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	r.Group(func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"status": "ok"}`))
		})

		// Auth routes
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Get("/auth/google", authHandler.GoogleAuth)
		r.Get("/auth/google/callback", authHandler.GoogleCallback)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(auth.RequireAuth)

		// Add protected routes here
		r.Get("/user", func(w http.ResponseWriter, r *http.Request) {
			userID := authMiddleware.GetUserID(r.Context())
			w.Write([]byte(`{"user_id": "` + userID + `"}`))
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
} 