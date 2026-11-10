const { pool } = require('../config/db');

const migrate = async () => {
  console.log('Running database migrations...');
  try {
    // Organizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        organization_id INT AUTO_INCREMENT PRIMARY KEY,
        organization_name VARCHAR(100) NOT NULL,
        default_low_stock INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) 
            REFERENCES organizations (organization_id) ON DELETE CASCADE,
        CONSTRAINT unique_user_organization UNIQUE (organization_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        quantity INT NOT NULL DEFAULT 0,
        cost_price DECIMAL(10,2) DEFAULT NULL,
        selling_price DECIMAL(10,2) DEFAULT NULL,
        low_stock_threshold INT DEFAULT NULL,
        last_updated_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_products_organization FOREIGN KEY (organization_id) 
            REFERENCES organizations (organization_id) ON DELETE CASCADE,
        CONSTRAINT unique_org_sku UNIQUE (organization_id, sku),
        CONSTRAINT chk_product_quantity CHECK (quantity >= 0),
        INDEX idx_products_organization (organization_id),
        INDEX idx_products_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Database migrations completed successfully.');
    return true;
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
};

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrate;

