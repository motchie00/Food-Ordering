const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  const { password, __v, _id, ...rest } = user;
  return { id: _id?.toString() || user.id, ...rest };
};

const formatOrder = (orderDoc) => {
  if (!orderDoc) return null;
  const order = orderDoc.toObject ? orderDoc.toObject({ virtuals: false }) : orderDoc;
  const { __v, _id, user, items, ...rest } = order;
  const formatted = {
    id: _id?.toString() || order.id,
    ...rest,
    items: (items || []).map((item) => ({
      ...item,
      menuItem: item.menuItem ? item.menuItem.toString?.() || item.menuItem : undefined,
    })),
  };

  if (user) {
    formatted.user = sanitizeUser(user);
  }

  return formatted;
};

const createOrder = async (req, res) => {
  try {
    const { items, total, deliveryAddress, phone, paymentMethod, restaurant } = req.body || {};

    if (!Array.isArray(items) || items.length === 0 || typeof total !== 'number') {
      return res.status(400).json({ message: 'items (non-empty array) and numeric total are required' });
    }

    const usageMap = new Map();
    const orderItems = [];

    for (const rawItem of items) {
      const menuItemId = rawItem.id || rawItem.menuItem || rawItem._id;
      const menuItem = menuItemId ? await MenuItem.findById(menuItemId) : null;

      if (!menuItem) {
        return res.status(400).json({ message: 'One or more menu items are unavailable' });
      }

      const requestedQuantity = Math.max(
        1,
        Number.isFinite(Number(rawItem.quantity))
          ? Math.floor(Number(rawItem.quantity))
          : 1,
      );

      const alreadyRequested = usageMap.get(menuItem.id) || 0;
      const availableQuantity = typeof menuItem.quantity === 'number' ? menuItem.quantity : null;

      if (availableQuantity !== null) {
        const newTotal = alreadyRequested + requestedQuantity;
        if (newTotal > availableQuantity) {
          const remaining = availableQuantity - alreadyRequested;
          if (remaining <= 0) {
            return res.status(400).json({ message: `${menuItem.name} is currently out of stock` });
          }
          return res.status(400).json({ message: `Only ${remaining} ${menuItem.name} available` });
        }
        usageMap.set(menuItem.id, newTotal);
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: requestedQuantity,
        price:
          typeof rawItem.price === 'number'
            ? rawItem.price
            : menuItem.price || 0,
      });
    }

    const order = await Order.create({
      user: req.user.userId,
      restaurant: restaurant || 'default-restaurant',
      items: orderItems,
      totalAmount: total,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      status: 'pending',
      paymentStatus: paymentMethod === 'gcash' || paymentMethod === 'maya' ? 'paid' : 'pending',
      paymentMethod: paymentMethod || 'cash',
    });

    const prefix = order._id.toString().slice(-3);
    const counter = await Counter.findOneAndUpdate(
      { key: `order:${prefix}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    order.orderCode = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    await order.save();

    for (const [menuItemId, requestedTotal] of usageMap.entries()) {
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) continue;
      if (typeof menuItem.quantity === 'number') {
        const remaining = Math.max(0, menuItem.quantity - requestedTotal);
        menuItem.quantity = remaining;
        if (remaining === 0) {
          menuItem.isAvailable = false;
        }
        menuItem.updatedAt = new Date();
        await menuItem.save();
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user')
      .populate('items.menuItem');

    res.status(201).json({ message: 'Order created', order: formatOrder(populatedOrder) });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'customer' ? { user: req.user.userId } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('user')
      .populate('items.menuItem');

    res.json({ orders: orders.map(formatOrder), count: orders.length });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('items.menuItem');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'customer' && order.user && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order: formatOrder(order) });
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
      { status, updatedAt: new Date() },
      { new: true },
    )
      .populate('user')
      .populate('items.menuItem');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order: formatOrder(order) });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };


