const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');

// Map frontend status to model status
const statusMap = {
  'pending': 'pending',
  'processing': 'preparing',
  'completed': 'delivered',
  'cancelled': 'cancelled',
};

const createOrder = async (req, res) => {
  try {
    const { items, total, deliveryAddress, phone, paymentMethod, paymentRef } = req.body || {};
    
    if (!Array.isArray(items) || items.length === 0 || typeof total !== 'number') {
      return res.status(400).json({ message: 'items (non-empty array) and numeric total are required' });
    }
    // deliveryAddress and phone are optional for in-store or pickup
    
    // Transform frontend items to model format
    const orderItems = await Promise.all(
      items.map(async (item) => {
        // Try to find menu item by ID if provided
        let menuItemId = item.id || item.menuItem;
        if (!menuItemId && item.name) {
          // Try to find by name as fallback (not ideal, but for demo)
          const menuItem = await MenuItem.findOne({ name: item.name });
          if (menuItem) menuItemId = menuItem._id;
        }
        
        return {
          menuItem: menuItemId || null,
          quantity: item.quantity || 1,
          price: item.price || 0,
        };
      })
    );
    
    // Use default restaurant ID (single restaurant setup)
    const restaurantId = new mongoose.Types.ObjectId();
    
    const order = new Order({
      user: req.user.userId,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount: total,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      status: 'pending',
      paymentStatus: (paymentMethod === 'gcash' || paymentMethod === 'maya') ? 'paid' : 'pending',
      paymentMethod: paymentMethod || 'cash',
    });
    
    await order.save();

    // Generate sequential human-readable orderCode e.g., 65d-0001
    try {
      const oid = order._id.toString();
      const prefix = oid.slice(-3); // last 3 hex chars from ObjectId
      const counterKey = `order:${prefix}`;
      const counter = await Counter.findOneAndUpdate(
        { key: counterKey },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      const code = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
      order.orderCode = code;
      await order.save();
    } catch (codeErr) {
      console.error('Order code generation failed:', codeErr);
    }
    await order.populate('user', '-password');
    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    // Staff/admin see all orders, customers see only their own
    const filter = req.user.role === 'customer' 
      ? { user: req.user.userId }
      : {};
    
    const orders = await Order.find(filter)
      .populate('user', '-password')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    
    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Customers can only see their own orders
    if (req.user.role === 'customer') {
      filter.user = req.user.userId;
    }
    
    const order = await Order.findOne(filter)
      .populate('user', '-password')
      .populate('items.menuItem');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user', '-password')
      .populate('items.menuItem');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };


