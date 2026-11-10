const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'stockflow_super_secret_jwt_key_2026_mvp_secure',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
const signup = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { organization_name, email, password, confirm_password } = req.body;

    if (!organization_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Organization name, email, and password are required.'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOrgName = organization_name.trim();

    // Check if user email already exists
    const [existingUsers] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Database transaction
    await connection.beginTransaction();

    // Create organization
    const [orgResult] = await connection.query(
      'INSERT INTO organizations (organization_name, default_low_stock) VALUES (?, 5)',
      [trimmedOrgName]
    );
    const organization_id = orgResult.insertId;

    // Create user linked to organization
    const [userResult] = await connection.query(
      'INSERT INTO users (organization_id, email, password) VALUES (?, ?, ?)',
      [organization_id, trimmedEmail, hashedPassword]
    );
    const user_id = userResult.insertId;

    await connection.commit();

    // Generate JWT
    const token = generateToken({
      user_id,
      organization_id,
      email: trimmedEmail
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        user_id,
        email: trimmedEmail,
        organization_id,
        organization_name: trimmedOrgName,
        default_low_stock: 5
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user with organization details
    const [rows] = await pool.query(
      `SELECT u.user_id, u.organization_id, u.email, u.password, 
              o.organization_name, o.default_low_stock 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.organization_id 
       WHERE u.email = ?`,
      [trimmedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = generateToken({
      user_id: user.user_id,
      organization_id: user.organization_id,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        organization_id: user.organization_id,
        organization_name: user.organization_name,
        default_low_stock: user.default_low_stock
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.organization_id, u.email, u.created_at, 
              o.organization_name, o.default_low_stock 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.organization_id 
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe
};

