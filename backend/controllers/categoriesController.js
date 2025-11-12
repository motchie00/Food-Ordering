const { store, createId, removeById } = require('../storage/localStore');

function toSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const listCategories = async (req, res) => {
  try {
    const categories = store.categories
      .filter((category) => category.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ categories, count: categories.length });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'name is required' });
    }
    const slug = toSlug(name);
    const existing = store.categories.find(
      (category) =>
        category.name.toLowerCase() === name.trim().toLowerCase() ||
        category.slug === slug
    );
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const timestamp = new Date().toISOString();
    const category = {
      _id: createId(),
      name: name.trim(),
      slug,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.categories.push(category);
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = removeById('categories', req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted', category });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { listCategories, createCategory, deleteCategory };


