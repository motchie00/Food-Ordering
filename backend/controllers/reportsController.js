const Order = require('../models/Order');

const getSalesReport = async (req, res) => {
  try {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = now;

    const orders = await Order.find({
      createdAt: { $gte: from, $lte: to },
      paymentStatus: { $ne: 'failed' },
    }).populate('items.menuItem');

    const totals = {
      orders: orders.length,
      revenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
    totals.averageOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;

    const byStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = order.status;
      if (status === 'pending' || status === 'confirmed') {
        byStatus.pending++;
      } else if (status === 'preparing' || status === 'ready' || status === 'out-for-delivery') {
        byStatus.processing++;
      } else if (status === 'delivered') {
        byStatus.completed++;
      } else if (status === 'cancelled') {
        byStatus.cancelled++;
      }
    });

    const itemMap = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.name || item.menuItem?.name || 'Unknown Item';
        const qty = item.quantity || 0;
        const price = typeof item.price === 'number' ? item.price : item.menuItem?.price || 0;

        if (!itemMap[name]) {
          itemMap[name] = { name, quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += qty;
        itemMap[name].revenue += qty * price;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const report = {
      generatedAt: now.toISOString(),
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals,
      topItems,
      byStatus,
    };

    res.json(report);
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getSalesReport };


