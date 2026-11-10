const { pool } = require('../config/db');

// GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;

    // Total Products and Total Stock
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_products,
         COALESCE(SUM(quantity), 0) AS total_stock,
         COALESCE(SUM(quantity * COALESCE(cost_price, 0)), 0) AS total_inventory_value
       FROM products 
       WHERE organization_id = ?`,
      [orgId]
    );

    // Low stock count based on effective threshold
    const [lowStockRows] = await pool.query(
      `SELECT COUNT(*) AS low_stock_count
       FROM products p
       JOIN organizations o ON p.organization_id = o.organization_id
       WHERE p.organization_id = ?
         AND p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)`,
      [orgId]
    );

    const stats = {
      totalProducts: parseInt(summaryRows[0].total_products, 10),
      totalStock: parseInt(summaryRows[0].total_stock, 10),
      totalInventoryValue: parseFloat(summaryRows[0].total_inventory_value || 0).toFixed(2),
      lowStockCount: parseInt(lowStockRows[0].low_stock_count, 10)
    };

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;

    const query = `
      SELECT p.product_id, p.name, p.sku, p.quantity, 
             p.low_stock_threshold,
             o.default_low_stock,
             COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
             p.cost_price, p.selling_price
      FROM products p
      JOIN organizations o ON p.organization_id = o.organization_id
      WHERE p.organization_id = ?
        AND p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)
      ORDER BY p.quantity ASC, p.name ASC
    `;

    const [lowStockProducts] = await pool.query(query, [orgId]);

    return res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getLowStockProducts
};

