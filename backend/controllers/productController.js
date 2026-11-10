const { pool } = require('../config/db');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { search } = req.query;

    let query = `
      SELECT p.*, 
             COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
             (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low_stock
      FROM products p
      JOIN organizations o ON p.organization_id = o.organization_id
      WHERE p.organization_id = ?
    `;
    const params = [orgId];

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const productId = req.params.id;

    const query = `
      SELECT p.*, 
             COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
             (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low_stock
      FROM products p
      JOIN organizations o ON p.organization_id = o.organization_id
      WHERE p.product_id = ? AND p.organization_id = ?
    `;

    const [rows] = await pool.query(query, [productId, orgId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    return res.status(200).json({
      success: true,
      product: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.user_id;
    const {
      name,
      sku,
      description,
      quantity = 0,
      cost_price,
      selling_price,
      low_stock_threshold
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.'
      });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'SKU is required.'
      });
    }

    const trimmedName = name.trim();
    const trimmedSku = sku.trim().toUpperCase();
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative integer.'
      });
    }

    let parsedCostPrice = null;
    if (cost_price !== undefined && cost_price !== null && cost_price !== '') {
      parsedCostPrice = parseFloat(cost_price);
      if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price must be a non-negative number.'
        });
      }
    }

    let parsedSellingPrice = null;
    if (selling_price !== undefined && selling_price !== null && selling_price !== '') {
      parsedSellingPrice = parseFloat(selling_price);
      if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be a non-negative number.'
        });
      }
    }

    let parsedThreshold = null;
    if (low_stock_threshold !== undefined && low_stock_threshold !== null && low_stock_threshold !== '') {
      parsedThreshold = parseInt(low_stock_threshold, 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Low stock threshold must be a non-negative integer.'
        });
      }
    }

    // Check SKU uniqueness within organization
    const [existingSku] = await pool.query(
      'SELECT product_id FROM products WHERE organization_id = ? AND sku = ?',
      [orgId, trimmedSku]
    );

    if (existingSku.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A product with SKU "${trimmedSku}" already exists in your organization.`
      });
    }

    const insertQuery = `
      INSERT INTO products (
        organization_id, name, sku, description, quantity, 
        cost_price, selling_price, low_stock_threshold, last_updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      orgId,
      trimmedName,
      trimmedSku,
      description ? description.trim() : null,
      parsedQuantity,
      parsedCostPrice,
      parsedSellingPrice,
      parsedThreshold,
      userId
    ]);

    // Fetch the inserted product
    const [newProduct] = await pool.query(
      `SELECT p.*, 
              COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
              (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low_stock
       FROM products p
       JOIN organizations o ON p.organization_id = o.organization_id
       WHERE p.product_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: newProduct[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.user_id;
    const productId = req.params.id;
    const {
      name,
      sku,
      description,
      quantity,
      cost_price,
      selling_price,
      low_stock_threshold
    } = req.body;

    // Check if product exists in this organization
    const [existingProduct] = await pool.query(
      'SELECT product_id FROM products WHERE product_id = ? AND organization_id = ?',
      [productId, orgId]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.'
      });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'SKU is required.'
      });
    }

    const trimmedName = name.trim();
    const trimmedSku = sku.trim().toUpperCase();

    // Check if new SKU is already in use by another product in this organization
    const [duplicateSku] = await pool.query(
      'SELECT product_id FROM products WHERE organization_id = ? AND sku = ? AND product_id != ?',
      [orgId, trimmedSku, productId]
    );

    if (duplicateSku.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Another product with SKU "${trimmedSku}" already exists in your organization.`
      });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative integer.'
      });
    }

    let parsedCostPrice = null;
    if (cost_price !== undefined && cost_price !== null && cost_price !== '') {
      parsedCostPrice = parseFloat(cost_price);
      if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price must be a non-negative number.'
        });
      }
    }

    let parsedSellingPrice = null;
    if (selling_price !== undefined && selling_price !== null && selling_price !== '') {
      parsedSellingPrice = parseFloat(selling_price);
      if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be a non-negative number.'
        });
      }
    }

    let parsedThreshold = null;
    if (low_stock_threshold !== undefined && low_stock_threshold !== null && low_stock_threshold !== '') {
      parsedThreshold = parseInt(low_stock_threshold, 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Low stock threshold must be a non-negative integer.'
        });
      }
    }

    const updateQuery = `
      UPDATE products 
      SET name = ?, sku = ?, description = ?, quantity = ?, 
          cost_price = ?, selling_price = ?, low_stock_threshold = ?, 
          last_updated_by = ?
      WHERE product_id = ? AND organization_id = ?
    `;

    await pool.query(updateQuery, [
      trimmedName,
      trimmedSku,
      description !== undefined ? (description ? description.trim() : null) : null,
      parsedQuantity,
      parsedCostPrice,
      parsedSellingPrice,
      parsedThreshold,
      userId,
      productId,
      orgId
    ]);

    const [updatedProduct] = await pool.query(
      `SELECT p.*, 
              COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
              (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low_stock
       FROM products p
       JOIN organizations o ON p.organization_id = o.organization_id
       WHERE p.product_id = ?`,
      [productId]
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updatedProduct[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const productId = req.params.id;

    const [result] = await pool.query(
      'DELETE FROM products WHERE product_id = ? AND organization_id = ?',
      [productId, orgId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/adjust-stock
const adjustStock = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const userId = req.user.user_id;
    const productId = req.params.id;
    const { adjustment, note } = req.body;

    const adjustmentAmount = parseInt(adjustment, 10);
    if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment amount must be a non-zero integer.'
      });
    }

    // Get current product
    const [rows] = await pool.query(
      'SELECT product_id, name, sku, quantity FROM products WHERE product_id = ? AND organization_id = ?',
      [productId, orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const currentProduct = rows[0];
    const previousQuantity = currentProduct.quantity;
    const newQuantity = previousQuantity + adjustmentAmount;

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: `Adjustment rejected. Stock quantity cannot become negative. Current stock is ${previousQuantity}, requested adjustment is ${adjustmentAmount}.`
      });
    }

    await pool.query(
      'UPDATE products SET quantity = ?, last_updated_by = ? WHERE product_id = ? AND organization_id = ?',
      [newQuantity, userId, productId, orgId]
    );

    const [updatedProduct] = await pool.query(
      `SELECT p.*, 
              COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
              (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low_stock
       FROM products p
       JOIN organizations o ON p.organization_id = o.organization_id
       WHERE p.product_id = ?`,
      [productId]
    );

    return res.status(200).json({
      success: true,
      message: `Stock adjusted successfully from ${previousQuantity} to ${newQuantity}.`,
      adjustment: {
        product_id: currentProduct.product_id,
        name: currentProduct.name,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        adjustment_amount: adjustmentAmount,
        note: note ? note.trim() : null
      },
      product: updatedProduct[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};

