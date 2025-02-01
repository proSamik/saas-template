package lemonsqueezy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

const (
	baseURL = "https://api.lemonsqueezy.com/v1"
)

// Client represents a Lemon Squeezy API client
type Client struct {
	apiKey string
	client *http.Client
}

// NewClient creates a new Lemon Squeezy API client
func NewClient() *Client {
	return &Client{
		apiKey: os.Getenv("LEMON_SQUEEZY_API_KEY"),
		client: &http.Client{},
	}
}

// doRequest performs an HTTP request to the Lemon Squeezy API
func (c *Client) doRequest(method, path string, body interface{}) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", baseURL, path)

	var req *http.Request
	var err error

	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		req, err = http.NewRequest(method, url, bytes.NewBuffer(jsonBody))
	} else {
		req, err = http.NewRequest(method, url, nil)
	}

	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	return c.client.Do(req)
}

// GetProducts retrieves all products for a store
func (c *Client) GetProducts(storeID string) (*ProductResponse, error) {
	if storeID == "" {
		storeID = os.Getenv("LEMON_SQUEEZY_STORE_ID")
	}
	if storeID == "" {
		return nil, fmt.Errorf("store ID is required")
	}

	resp, err := c.doRequest(http.MethodGet, fmt.Sprintf("/products?filter[store_id]=%s", storeID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch products: %d", resp.StatusCode)
	}

	var result ProductResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetProduct retrieves a specific product
func (c *Client) GetProduct(productID string) (*ProductResponse, error) {
	resp, err := c.doRequest(http.MethodGet, fmt.Sprintf("/products/%s", productID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result ProductResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetVariants retrieves all variants for a product
func (c *Client) GetVariants(productID string) (*VariantResponse, error) {
	resp, err := c.doRequest(http.MethodGet, fmt.Sprintf("/variants?filter[product_id]=%s", productID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result VariantResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateCheckout creates a new checkout
func (c *Client) CreateCheckout(storeID string, variantID string, email string, customData map[string]interface{}) (map[string]interface{}, error) {
	body := map[string]interface{}{
		"data": map[string]interface{}{
			"type": "checkouts",
			"attributes": map[string]interface{}{
				"store_id":    storeID,
				"variant_id":  variantID,
				"custom_data": customData,
			},
		},
	}

	if email != "" {
		body["data"].(map[string]interface{})["attributes"].(map[string]interface{})["email"] = email
	}

	resp, err := c.doRequest(http.MethodPost, "/checkouts", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}
