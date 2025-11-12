const { store, createId, updateById, nextCounter } = require('../storage/localStore');

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return { id: user._id, ...rest };
};

const sanitizeMenuItem = (item) => {
  if (!item) return null;
  return { ...item };
};

const formatOrder = (order) => {
  if (!order) return null;
  const user = store.users.find((u) => u._id === order.user);
  const formattedItems = order.items.map((item) => ({
    ...item,
    menuItem: item.menuItem ? sanitizeMenuItem(store.menuItems.find((menu) => menu._id === item.menuItem)) : null,
  }));
  return {
    ...order,
    user: sanitizeUser(user),
    items: formattedItems,
  };
};

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
    const usageMap = new Map();
    const orderItems = items.map((item) => {
      const menuItemId = item.id || item.menuItem || null;
      const menuItem = menuItemId
        ? store.menuItems.find((menu) => menu._id === menuItemId)
        : null;

      if (!menuItem) {
        throw { status: 400, message: 'One or more menu items are unavailable' };
      }

      const requestedQuantity = Math.max(
        1,
        Number.isFinite(Number(item.quantity))
          ? Math.floor(Number(item.quantity))
          : 1
      );

      const availableQuantity =
        typeof menuItem.quantity === 'number' ? menuItem.quantity : null;

      if (availableQuantity !== null) {
        const alreadyRequested = usageMap.get(menuItem._id) || 0;
        if (availableQuantity <= alreadyRequested) {
          throw {
            status: 400,
            message: `${menuItem.name} is currently out of stock`,
          };
        }
        const newTotal = alreadyRequested + requestedQuantity;
        if (newTotal > availableQuantity) {
          const remaining = availableQuantity - alreadyRequested;
          if (remaining <= 0) {
            throw {
              status: 400,
              message: `${menuItem.name} is currently out of stock`,
            };
          }
          throw {
            status: 400,
            message: `Only ${remaining} ${menuItem.name} available`,
          };
        }

        usageMap.set(menuItem._id, newTotal);
      }

      return {
        menuItem: menuItem._id,
        quantity: requestedQuantity,
        price:
          typeof item.price === 'number'
            ? item.price
            : menuItem.price || 0,
        name: item.name || menuItem.name || '',
      };
    });
    
    const timestamp = new Date().toISOString();
    const order = {
      _id: createId(),
      user: req.user.userId,
      restaurant: req.body?.restaurant || 'default-restaurant',
      items: orderItems,
      totalAmount: total,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      status: 'pending',
      paymentStatus:
        paymentMethod === 'gcash' || paymentMethod === 'maya' ? 'paid' : 'pending',
      paymentMethod: paymentMethod || 'cash',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    const prefix = order._id.slice(-3);
    const counter = nextCounter(`order:${prefix}`);
    order.orderCode = `${prefix}-${String(counter).padStart(4, '0')}`;
    
    store.orders.push(order);

    const updateTimestamp = new Date().toISOString();
    usageMap.forEach((requestedTotal, id) => {
      const currentItem = store.menuItems.find((menu) => menu._id === id);
      if (!currentItem || typeof currentItem.quantity !== 'number') {
        return;
      }
      const remaining = Math.max(0, currentItem.quantity - requestedTotal);
      updateById('menuItems', id, () => ({
        quantity: remaining,
        isAvailable: remaining > 0,
        updatedAt: updateTimestamp,
      }));
    });

    res.status(201).json({ message: 'Order created', order: formatOrder(order) });
  } catch (error) {
    if (error && error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message || 'Unknown error' });
  }
};

const listOrders = async (req, res) => {
  try {
    // Staff/admin see all orders, customers see only their own
    const orders = store.orders
      .filter((order) =>
        req.user.role === 'customer' ? order.user === req.user.userId : true
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(formatOrder);
    
    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = store.orders.find((o) => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'customer' && order.user !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!order) return res.status(404).json({ message: 'Order not found' });
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
    
    const order = updateById('orders', req.params.id, (current) => ({
      status,
      updatedAt: new Date().toISOString(),
    }));

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order: formatOrder(order) });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };


