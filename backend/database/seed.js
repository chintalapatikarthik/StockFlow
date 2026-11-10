const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const migrate = require('./migrate');

const seed = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding demonstration data...');
    await migrate();

    const demoOrgName = 'ABC Supermarket';
    const demoEmail = 'demo@stockflow.com';
    const demoPassword = 'DemoPassword123!';

    await connection.beginTransaction();

    // Check if demo user already exists
    const [existingUsers] = await connection.query(
      'SELECT user_id, organization_id FROM users WHERE email = ?',
      [demoEmail]
    );

    let orgId;
    let userId;

    if (existingUsers.length > 0) {
      orgId = existingUsers[0].organization_id;
      userId = existingUsers[0].user_id;
      console.log(`Found existing demo organization id: ${orgId}, clearing existing products...`);

      // Clean existing products for this demo org to ensure exact seed state
      await connection.query('DELETE FROM products WHERE organization_id = ?', [orgId]);

      // Update organization name & default threshold
      await connection.query(
        'UPDATE organizations SET organization_name = ?, default_low_stock = 5 WHERE organization_id = ?',
        [demoOrgName, orgId]
      );
    } else {
      // Create Organization
      const [orgResult] = await connection.query(
        'INSERT INTO organizations (organization_name, default_low_stock) VALUES (?, 5)',
        [demoOrgName]
      );
      orgId = orgResult.insertId;

      // Create Demo User
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoPassword, salt);

      const [userResult] = await connection.query(
        'INSERT INTO users (organization_id, email, password) VALUES (?, ?, ?)',
        [orgId, demoEmail, hashedPassword]
      );
      userId = userResult.insertId;
    }

    // Insert 4 Sample Products as required by Section 16
    const sampleProducts = [
      {
        name: 'Rice',
        sku: 'RICE001',
        description: 'Premium Basmati Rice 5kg Bag',
        quantity: 50,
        cost_price: 40.00,
        selling_price: 50.00,
        low_stock_threshold: 5
      },
      {
        name: 'Sugar',
        sku: 'SUGAR001',
        description: 'Refined White Sugar 1kg Pack',
        quantity: 4,
        cost_price: 35.00,
        selling_price: 45.00,
        low_stock_threshold: 5
      },
      {
        name: 'Oil',
        sku: 'OIL001',
        description: 'Refined Sunflower Cooking Oil 1L',
        quantity: 2,
        cost_price: 100.00,
        selling_price: 120.00,
        low_stock_threshold: 5
      },
      {
        name: 'Biscuits',
        sku: 'BISC001',
        description: 'Crispy Wheat Butter Biscuits Box',
        quantity: 30,
        cost_price: 10.00,
        selling_price: 15.00,
        low_stock_threshold: 5
      }
    ];

    for (const prod of sampleProducts) {
      await connection.query(
        `INSERT INTO products (
          organization_id, name, sku, description, quantity, 
          cost_price, selling_price, low_stock_threshold, last_updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orgId,
          prod.name,
          prod.sku,
          prod.description,
          prod.quantity,
          prod.cost_price,
          prod.selling_price,
          prod.low_stock_threshold,
          userId
        ]
      );
    }

    await connection.commit();

    console.log('Demonstration data seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Account Credentials:');
    console.log(`Organization: ${demoOrgName}`);
    console.log(`Email:        ${demoEmail}`);
    console.log(`Password:     ${demoPassword}`);
    console.log('Expected Dashboard Verification:');
    console.log('Total Products: 4');
    console.log('Total Stock:    86');
    console.log('Low Stock:      2 (Sugar [qty 4 <= 5], Oil [qty 2 <= 5])');
    console.log('----------------------------------------------------');
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    connection.release();
  }
};

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
