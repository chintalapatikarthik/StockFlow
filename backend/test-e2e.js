const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log('StockFlow Comprehensive E2E Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.database === 'connected', '1. System Health Check & MySQL connectivity');

    // 2. Login with valid demo credentials
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'demo@stockflow.com',
      password: 'DemoPassword123!'
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, '2. Login with valid credentials');
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Invalid password rejection
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'demo@stockflow.com',
        password: 'WrongPassword999!'
      });
      assert(false, '3. Invalid password rejection');
    } catch (err) {
      assert(err.response?.status === 401, '3. Invalid password rejection (401 Unauthorized)');
    }

    // 4. Duplicate email registration rejection
    try {
      await axios.post(`${BASE_URL}/auth/signup`, {
        organization_name: 'Another Store',
        email: 'demo@stockflow.com',
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      assert(false, '4. Duplicate email rejection');
    } catch (err) {
      assert(err.response?.status === 409, '4. Duplicate email rejection (409 Conflict)');
    }

    // 5. Auth /me endpoint
    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    assert(meRes.data.user.email === 'demo@stockflow.com', '5. Verified authentication context (GET /auth/me)');

    // 6. Initial Seed Dashboard verification
    const dash1 = await axios.get(`${BASE_URL}/dashboard`, authHeaders);
    assert(dash1.data.stats.totalProducts === 4, '6. Dashboard product count matches seed data (4)');
    assert(dash1.data.stats.totalStock === 86, '7. Dashboard total stock quantity matches seed data (86)');
    assert(dash1.data.stats.lowStockCount === 2, '8. Dashboard low stock count matches seed data (2: Sugar & Oil)');

    // 7. Initial Seed Low Stock items verification
    const lowStock1 = await axios.get(`${BASE_URL}/dashboard/low-stock`, authHeaders);
    const lowStockNames = lowStock1.data.products.map(p => p.name).sort();
    assert(JSON.stringify(lowStockNames) === JSON.stringify(['Oil', 'Sugar']), '9. Correct low stock items identified (Oil & Sugar)');

    // 8. Create a new product with custom threshold
    const newProdRes = await axios.post(`${BASE_URL}/products`, {
      name: 'Wheat Flour',
      sku: 'FLOUR001',
      description: 'Organic whole wheat 5kg pack',
      quantity: 12,
      cost_price: 18.00,
      selling_price: 24.00,
      low_stock_threshold: 4
    }, authHeaders);
    assert(newProdRes.status === 201 && newProdRes.data.product.sku === 'FLOUR001', '10. Product creation with custom threshold (FLOUR001)');
    const testProductId = newProdRes.data.product.product_id;

    // 9. Duplicate SKU rejection
    try {
      await axios.post(`${BASE_URL}/products`, {
        name: 'Wheat Flour Duplicate',
        sku: 'FLOUR001',
        quantity: 5
      }, authHeaders);
      assert(false, '11. Duplicate SKU rejection');
    } catch (err) {
      assert(err.response?.status === 409, '11. Duplicate SKU rejection per organization (409 Conflict)');
    }

    // 10. Negative quantity rejection during create
    try {
      await axios.post(`${BASE_URL}/products`, {
        name: 'Invalid Product',
        sku: 'INV001',
        quantity: -10
      }, authHeaders);
      assert(false, '12. Negative quantity rejection');
    } catch (err) {
      assert(err.response?.status === 400, '12. Negative quantity rejection during product creation (400 Bad Request)');
    }

    // 11. Product listing & Search
    const searchRes = await axios.get(`${BASE_URL}/products?search=FLOUR`, authHeaders);
    assert(searchRes.data.products.length === 1 && searchRes.data.products[0].sku === 'FLOUR001', '13. Product search by name/SKU');

    // 12. Product editing
    const updateRes = await axios.put(`${BASE_URL}/products/${testProductId}`, {
      name: 'Organic Wheat Flour',
      sku: 'FLOUR001',
      description: 'Updated description',
      quantity: 14,
      cost_price: 19.00,
      selling_price: 25.00,
      low_stock_threshold: 6
    }, authHeaders);
    assert(updateRes.data.product.name === 'Organic Wheat Flour' && updateRes.data.product.quantity === 14, '14. Product editing (fields & prices updated)');

    // 13. Stock adjustment: decrement
    const adjRes = await axios.patch(`${BASE_URL}/products/${testProductId}/adjust-stock`, {
      adjustment: -10,
      note: 'Sold 10 packs'
    }, authHeaders);
    assert(adjRes.data.product.quantity === 4, '15. Stock adjustment: decrement 14 - 10 = 4');

    // 14. Stock adjustment: negative quantity prevention
    try {
      await axios.patch(`${BASE_URL}/products/${testProductId}/adjust-stock`, {
        adjustment: -50,
        note: 'Attempt excess deduction'
      }, authHeaders);
      assert(false, '16. Negative stock adjustment prevention');
    } catch (err) {
      assert(err.response?.status === 400, '16. Negative stock adjustment prevention (400 Bad Request)');
    }

    // 15. Dynamic low stock detection
    const lowStock2 = await axios.get(`${BASE_URL}/dashboard/low-stock`, authHeaders);
    const hasFlourInLowStock = lowStock2.data.products.some(p => p.sku === 'FLOUR001');
    assert(hasFlourInLowStock, '17. Dynamic low stock detection triggered when quantity falls below threshold');

    // 16. Adjust stock back up (4 + 10 = 14) and verify it leaves low stock
    await axios.patch(`${BASE_URL}/products/${testProductId}/adjust-stock`, {
      adjustment: 10,
      note: 'Restocked 10 packs'
    }, authHeaders);
    const lowStock3 = await axios.get(`${BASE_URL}/dashboard/low-stock`, authHeaders);
    const flourStillInLowStock = lowStock3.data.products.some(p => p.sku === 'FLOUR001');
    assert(!flourStillInLowStock, '18. Item automatically leaves low stock alert when stock is restored');

    // 17. Delete test product
    const delRes = await axios.delete(`${BASE_URL}/products/${testProductId}`, authHeaders);
    assert(delRes.status === 200, '19. Product deletion (hard delete with confirmation)');

    // 18. Settings & Default Threshold inheritance test
    const settingsGet = await axios.get(`${BASE_URL}/settings`, authHeaders);
    assert(settingsGet.data.settings.default_low_stock === 5, '20. Retrieve organization default threshold (5)');

    // Create a product with NULL custom threshold (uses organization default)
    const nullThreshProd = await axios.post(`${BASE_URL}/products`, {
      name: 'Default Threshold Tea',
      sku: 'TEA001',
      quantity: 10,
      low_stock_threshold: null
    }, authHeaders);
    const teaId = nullThreshProd.data.product.product_id;

    // Check with default 5: quantity 10 > 5 => NOT low stock
    const lowStockBefore = await axios.get(`${BASE_URL}/dashboard/low-stock`, authHeaders);
    const teaInLowStockBefore = lowStockBefore.data.products.some(p => p.sku === 'TEA001');
    assert(!teaInLowStockBefore, '21. Product without custom threshold is healthy when qty (10) > org default (5)');

    // Update organization default threshold to 15
    const settingsUpdate = await axios.put(`${BASE_URL}/settings`, {
      default_low_stock: 15,
      organization_name: 'ABC Supermarket (Updated)'
    }, authHeaders);
    assert(settingsUpdate.data.settings.default_low_stock === 15, '22. Update organization default low stock threshold to 15');

    // Now quantity 10 <= org default 15 => TEA001 MUST be in low stock!
    const lowStockAfter = await axios.get(`${BASE_URL}/dashboard/low-stock`, authHeaders);
    const teaInLowStockAfter = lowStockAfter.data.products.some(p => p.sku === 'TEA001');
    assert(teaInLowStockAfter, '23. Product with NULL threshold inherits new org default (15) and triggers low-stock warning');

    // Clean up test product TEA001 & restore default to 5
    await axios.delete(`${BASE_URL}/products/${teaId}`, authHeaders);
    await axios.put(`${BASE_URL}/settings`, {
      default_low_stock: 5,
      organization_name: 'ABC Supermarket'
    }, authHeaders);

    // 19. Multi-Tenant Isolation Verification
    console.log('\n--- Multi-Tenant Isolation Testing ---');
    const tenant2Email = `tenant2_${Date.now()}@example.com`;
    const signupTenant2 = await axios.post(`${BASE_URL}/auth/signup`, {
      organization_name: 'Delta Mart',
      email: tenant2Email,
      password: 'Password123!',
      confirm_password: 'Password123!'
    });
    const tenant2Headers = { headers: { Authorization: `Bearer ${signupTenant2.data.token}` } };

    const tenant2Prods = await axios.get(`${BASE_URL}/products`, tenant2Headers);
    assert(tenant2Prods.data.products.length === 0, '24. Strict Tenancy Isolation: Tenant 2 starts with 0 products');

    const tenant2Dash = await axios.get(`${BASE_URL}/dashboard`, tenant2Headers);
    assert(tenant2Dash.data.stats.totalProducts === 0 && tenant2Dash.data.stats.totalStock === 0, '25. Strict Tenancy Isolation: Tenant 2 dashboard has 0 products & 0 stock');

    // Try cross-tenant access: Tenant 2 tries to access Product 1 (Rice, belonging to ABC Supermarket)
    try {
      await axios.get(`${BASE_URL}/products/1`, tenant2Headers);
      assert(false, '26. Cross-tenant product access prevention');
    } catch (err) {
      assert(err.response?.status === 404, '26. Cross-tenant product access strictly blocked (404 Not Found)');
    }

    // Try cross-tenant deletion: Tenant 2 tries to delete Product 1
    try {
      await axios.delete(`${BASE_URL}/products/1`, tenant2Headers);
      assert(false, '27. Cross-tenant product deletion prevention');
    } catch (err) {
      assert(err.response?.status === 404, '27. Cross-tenant product deletion strictly blocked (404 Not Found)');
    }

    console.log('\n====================================================');
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test run failed unexpectedly:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
};

runTests();
