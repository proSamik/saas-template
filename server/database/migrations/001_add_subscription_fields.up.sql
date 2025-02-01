ALTER TABLE users
ADD COLUMN subscription_id VARCHAR(255),
ADD COLUMN customer_id VARCHAR(255),
ADD COLUMN variant_id VARCHAR(255),
ADD COLUMN current_period_end TIMESTAMP;