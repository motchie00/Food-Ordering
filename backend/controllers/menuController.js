const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

const listMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true });
    res.json({ items, count: items.length });
  } catch (error) {
    console.error('List menu error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ item });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable, restaurant } = req.body || {};
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ message: 'name and numeric price are required' });
    }
    
    // Use default restaurant ID if not provided (for single restaurant setup)
    const restaurantId = restaurant || new mongoose.Types.ObjectId();
    
    const menuItem = new MenuItem({
      restaurant: restaurantId,
      name,
      description: description || '',
      price,
      category: (category || '').trim(),
      image: image || 'https://via.placeholder.com/200',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
    });
    
    await menuItem.save();
    res.status(201).json({ message: 'Menu item created', item: menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { category, ...updateData } = req.body;
    if (category) updateData.category = String(category).trim();
    
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item updated', item });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted', item });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuByRestaurant = async (req, res) => {
  try {
    const items = await MenuItem.find({ 
      restaurant: req.params.restaurantId,
      isAvailable: true 
    });
    res.json({ items, count: items.length, restaurantId: req.params.restaurantId });
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


