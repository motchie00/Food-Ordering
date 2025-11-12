const { store, createId, updateById, removeById } = require('../storage/localStore');

const listMenu = async (req, res) => {
  try {
    const items = store.menuItems.filter((item) => item.isAvailable !== false);
    res.json({ items, count: items.length });
  } catch (error) {
    console.error('List menu error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuItem = async (req, res) => {
  try {
    const item = store.menuItems.find((menu) => menu._id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ item });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable, restaurant, quantity } = req.body || {};
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ message: 'name and numeric price are required' });
    }
    
    const quantityValue =
      typeof quantity === 'number'
        ? quantity
        : Number.isFinite(Number(quantity))
        ? Number(quantity)
        : 0;
    const normalizedQuantity = quantityValue >= 0 ? quantityValue : 0;

    const timestamp = new Date().toISOString();
    const menuItem = {
      _id: createId(),
      restaurant: restaurant || 'default-restaurant',
      name,
      description: description || '',
      price,
      category: (category || '').trim(),
      image: image || 'https://via.placeholder.com/200',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
      quantity: normalizedQuantity,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    store.menuItems.push(menuItem);
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
    if (category) updateData.category = String(category).trim();
    if (quantity !== undefined) {
      const quantityValue =
        typeof quantity === 'number'
          ? quantity
          : Number.isFinite(Number(quantity))
          ? Number(quantity)
          : 0;
      updateData.quantity = quantityValue >= 0 ? quantityValue : 0;
    }
    
    const item = updateById('menuItems', req.params.id, (current) => ({
      ...current,
      ...updateData,
      updatedAt: new Date().toISOString(),
    }));

    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item updated', item });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = removeById('menuItems', req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted', item });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuByRestaurant = async (req, res) => {
  try {
    const items = store.menuItems.filter(
      (item) =>
        item.restaurant === req.params.restaurantId && item.isAvailable !== false
    );
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


