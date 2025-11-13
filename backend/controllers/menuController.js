const MenuItem = require('../models/MenuItem');

const listMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({ $or: [{ isAvailable: { $ne: false } }, { isAvailable: { $exists: false } }] }).lean();
    res.json({ items, count: items.length });
  } catch (error) {
    console.error('List menu error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ item });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      isAvailable,
      restaurant,
      quantity,
    } = req.body || {};

    if (!name || typeof price !== 'number') {
      return res.status(400).json({ message: 'name and numeric price are required' });
    }

    const quantityValue = Number.isFinite(Number(quantity)) ? Math.max(0, Number(quantity)) : 0;

    const menuItem = await MenuItem.create({
      restaurant: restaurant || 'default-restaurant',
      name,
      description: description || '',
      price,
      category: (category || '').trim(),
      image: image || 'https://via.placeholder.com/200',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
      quantity: quantityValue,
    });

    res.status(201).json({ message: 'Menu item created', item: menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { category, quantity, ...rest } = req.body || {};
    const updateData = { ...rest };
    if (category !== undefined) updateData.category = String(category).trim();
    if (quantity !== undefined) {
      const quantityValue = Number.isFinite(Number(quantity)) ? Math.max(0, Number(quantity)) : 0;
      updateData.quantity = quantityValue;
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true },
    ).lean();

    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item updated', item });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted', item });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuByRestaurant = async (req, res) => {
  try {
    const targetRestaurant = req.params.restaurantId || 'default-restaurant';
    const items = await MenuItem.find({
      restaurant: targetRestaurant,
      $or: [{ isAvailable: { $ne: false } }, { isAvailable: { $exists: false } }],
    }).lean();
    res.json({ items, count: items.length, restaurantId: targetRestaurant });
  } catch (error) {
    console.error('Get menu by restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuByRestaurant,
};


