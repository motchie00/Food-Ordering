const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { store, createId, removeById, updateById } = require('../storage/localStore');

const MIN_PASSWORD_LENGTH = 8;

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, _id, ...rest } = user;
  return {
    id: _id,
    ...rest,
  };
};

const findUserByEmail = (email) =>
  store.users.find((user) => user.email && user.email.toLowerCase() === email.toLowerCase());

const findUserByUsername = (username) =>
  store.users.find(
    (user) => user.username && user.username.toLowerCase() === username.toLowerCase()
  );

const findUserById = (id) => store.users.find((user) => user._id === id);

// @desc    Register a new user
// @access  Public
const register = async (req, res) => {
  try {
    const { email, username, password, role, name } = req.body;

    // Validation based on role
    const userRole = role || 'customer';

    if (userRole === 'customer') {
      // Customer: requires name, email and password
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email and password' });
      }

      // Validate password length (minimum 8 characters)
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        });
      }

      // Check if user already exists
      const existingUser = email ? findUserByEmail(email) : null;
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    } else if (userRole === 'staff' || userRole === 'admin') {
      // Staff/Admin: requires username and password
      if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
      }

      // Validate password length (minimum 8 characters)
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        });
      }

      // Check if user already exists
      const existingUser = username ? findUserByUsername(username) : null;
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this username' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object based on role
    const userData = {
      password: hashedPassword,
      role: userRole,
    };

    if (userRole === 'customer') {
      userData.name = name;
      userData.email = email;
    } else {
      userData.username = username;
    }

    const timestamp = new Date().toISOString();
    const user = {
      _id: createId(),
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.users.push(user);

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @access  Public
const login = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({ message: 'Please provide password' });
    }

    if (!email && !username) {
      return res.status(400).json({ message: 'Please provide either email (for customer) or username (for staff/admin)' });
    }

    // Find user based on email or username
    let user;
    if (email) {
      user = findUserByEmail(email);
    } else if (username) {
      user = findUserByUsername(username);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = store.users.map(sanitizeUser);
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user (Admin only). Admin accounts cannot be deleted
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    removeById('users', req.params.id);
    res.json({ message: 'User deleted', id: req.params.id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create staff or admin account (Admin only)
// @access  Private (Admin)
const createStaffAccount = async (req, res) => {
  try {
    const { username, password, role } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    if (findUserByUsername(username)) {
      return res.status(400).json({ message: 'User already exists with this username' });
    }

    const accountRole = role === 'admin' ? 'admin' : 'staff';
    const timestamp = new Date().toISOString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      _id: createId(),
      username,
      password: hashedPassword,
      role: accountRole,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.users.push(user);

    res.status(201).json({
      message: `${accountRole === 'admin' ? 'Admin' : 'Staff'} account created`,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Create staff account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create customer account (Admin only)
// @access  Private (Admin)
const createCustomerAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const timestamp = new Date().toISOString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      _id: createId(),
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.users.push(user);

    res.status(201).json({
      message: 'Customer account created',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Create customer account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all customers (Admin only)
// @access  Private (Admin)
const getCustomers = async (req, res) => {
  try {
    const customers = store.users
      .filter((user) => user.role === 'customer')
      .map(sanitizeUser);

    res.json({ customers, count: customers.length });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single customer (Admin only)
// @access  Private (Admin)
const getCustomer = async (req, res) => {
  try {
    const customer = findUserById(req.params.id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ customer: sanitizeUser(customer) });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a customer (Admin only)
// @access  Private (Admin)
const updateCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const customer = findUserById(req.params.id);

    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updates = {};

    if (typeof name === 'string') {
      updates.name = name.trim();
    }

    if (typeof email === 'string') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }

      const existingEmailUser = findUserByEmail(trimmedEmail);
      if (existingEmailUser && existingEmailUser._id !== customer._id) {
        return res.status(400).json({ message: 'Another user already uses this email' });
      }

      updates.email = trimmedEmail;
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    updates.updatedAt = new Date().toISOString();

    const updatedCustomer = updateById('users', req.params.id, updates);

    res.json({
      message: 'Customer updated',
      customer: sanitizeUser(updatedCustomer),
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  deleteUser,
  createStaffAccount,
  createCustomerAccount,
  getCustomers,
  getCustomer,
  updateCustomer,
};

