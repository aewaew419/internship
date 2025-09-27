package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	passwords := []string{"123456", "admin123", "demo123"}
	
	for _, password := range passwords {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Printf("Error hashing %s: %v\n", password, err)
			continue
		}
		fmt.Printf("Password: %s\nHash: %s\n\n", password, string(hash))
	}
}