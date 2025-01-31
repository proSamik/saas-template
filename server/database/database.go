package database

import (
	"database/sql"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type User struct {
	ID       string
	Email    string
	Password string
	Name     string
}

type DB struct {
	*sql.DB
}

func New(dataSourceName string) (*DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return &DB{db}, nil
}

func (db *DB) CreateUser(email, password, name string) (*User, error) {
	id := uuid.New().String()
	query := `
		INSERT INTO users (id, email, password, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password, name`
	
	user := &User{}
	err := db.QueryRow(query, id, email, password, name).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, password, name
		FROM users
		WHERE email = $1`
	
	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.Name,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (db *DB) UserExists(email string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM users WHERE email = $1
		)`
	
	err := db.QueryRow(query, email).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// InitSchema creates the necessary database tables
func (db *DB) InitSchema() error {
	query := `
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(36) PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255),
			name VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`
	
	_, err := db.Exec(query)
	return err
} 