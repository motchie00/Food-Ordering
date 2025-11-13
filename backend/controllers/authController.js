const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MIN_PASSWORD_LENGTH = 8;

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  const { password, __v, _id, ...rest } = user;
  return { id: _id?.toString() || user.id, ...rest };
};

const register = async (req, res) => {
  try {
    const { email, username, password, role, name } = req.body || {};
    const userRole = role || 'customer';

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    if (userRole === 'customer') {
      if (!name || !email) {
        return res.status(400).json({ message: 'Please provide name, email and password' });
      }

      const existing = await User.findOne({ email: email.toLowerCase() }).lean();
      if (existing) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    } else if (userRole === 'staff' || userRole === 'admin') {
      if (!username) {
        return res.status(400).json({ message: 'Please provide username and password' });
      }

      const existing = await User.findOne({ username: username.toLowerCase() }).lean();
      if (existing) {
        return res.status(400).json({ message: 'User already exists with this username' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      password: hashedPassword,
      role: userRole,
    };

    if (userRole === 'customer') {
      userData.name = name;
      userData.email = email.toLowerCase();
    } else {
      userData.username = username.toLowerCase();
    }

    const user = await User.create(userData);

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, username, password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: 'Please provide password' });
    }

    if (!email && !username) {
      return res.status(400).json({
        message: 'Please provide either email (for customer) or username (for staff/admin)',
      });
    }

    let query;
    if (email) {
      query = { email: email.toLowerCase() };
    } else {
      query = { username: username.toLowerCase() };
    }

    const user = await User.findOne(query).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
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

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().lean();
    res.json({ users: users.map(sanitizeUser), count: users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User deleted', id: req.params.id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createStaffAccount = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { username, password, role } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    const existing = await User.findOne({ username: username.toLowerCase() }).lean();
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this username' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const accountRole = role === 'admin' ? 'admin' : 'staff';

    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: accountRole,
    });

    res.status(201).json({
      message: `${accountRole === 'admin' ? 'Admin' : 'Staff'} account created` ,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this username' });
    }
    console.error('Create staff account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCustomerAccount = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
    });

    res.status(201).json({
      message: 'Customer account created',
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    console.error('Create customer account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const customers = await User.find({ role: 'customer' }).lean();
    res.json({ customers: customers.map(sanitizeUser), count: customers.length });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const customer = await User.findById(req.params.id).lean();
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ customer: sanitizeUser(customer) });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, email, password } = req.body || {};
    const customer = await User.findById(req.params.id);

    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (typeof name === 'string') {
      customer.name = name.trim();
    }

    if (typeof email === 'string') {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }

      const existing = await User.findOne({ email: trimmedEmail, _id: { $ne: customer._id } });
      if (existing) {
        return res.status(400).json({ message: 'Another user already uses this email' });
      }

      customer.email = trimmedEmail;
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        });
      }
      customer.password = await bcrypt.hash(password, 10);
    }

    await customer.save();

    res.json({
      message: 'Customer updated',
      customer: sanitizeUser(customer),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Another user already uses this email' });
    }
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

