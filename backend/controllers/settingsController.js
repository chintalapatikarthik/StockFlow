const { pool } = require('../config/db');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;

    const [rows] = await pool.query(
      'SELECT organization_id, organization_name, default_low_stock, created_at FROM organizations WHERE organization_id = ?',
      [orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization settings not found.'
      });
    }

    return res.status(200).json({
      success: true,
      settings: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { default_low_stock, organization_name } = req.body;

    const parsedThreshold = parseInt(default_low_stock, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Default low stock threshold must be a non-negative integer.'
      });
    }

    let updateQuery = 'UPDATE organizations SET default_low_stock = ?';
    const params = [parsedThreshold];

    if (organization_name && organization_name.trim()) {
      updateQuery += ', organization_name = ?';
      params.push(organization_name.trim());
    }

    updateQuery += ' WHERE organization_id = ?';
    params.push(orgId);

    await pool.query(updateQuery, params);

    const [updatedRows] = await pool.query(
      'SELECT organization_id, organization_name, default_low_stock, created_at FROM organizations WHERE organization_id = ?',
      [orgId]
    );

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      settings: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};

