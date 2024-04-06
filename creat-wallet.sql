
CREATE TABLE IF NOT EXISTS wallet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(255) NOT NULL,
  private_key VARCHAR(255) NOT NULL,
  user_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
