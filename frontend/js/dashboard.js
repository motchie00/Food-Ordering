let currentMenuItemId = null;
let menuItems = [];
let categories = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Auth guard
    try {
        if (!window.api || !window.api.getAuthToken() || !window.api.getAuthToken().length) {
            window.location.href = '../login.html';
            return;
        }
    } catch (_) {}
    
    await Promise.all([
        loadCategories(),
        loadMenuItems(),
        loadUsers(),
    ]);
    setupFormHandlers();
});

// Load menu items from API
async function loadMenuItems() {
    try {
        if (window.api) {
            const response = await window.api.apiRequest('/api/menu', { auth: true });
            if (response && response.items) {
                menuItems = response.items;
                displayMenuItems(menuItems);
            }
        }
    } catch (err) {
        console.error('Failed to load menu items:', err);
        menuItems = [];
    }
}

// Display menu items in table
function displayMenuItems(items = menuItems) {
    const tbody = document.querySelector('#menuList table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No menu items found</td></tr>';
        return;
    }
    
    // Map backend categories to frontend categories
    const categoryMap = {
        'main': 'Main Dish',
        'appetizer': 'Appetizer',
        'beverage': 'Drinks',
        'dessert': 'Dessert',
        'other': 'Salad',
    };
    
    items.forEach(item => {
        const resolveImage = () => {
            if (!item.image) return '../assets/Logo.png';
            if (/^https?:\/\//i.test(item.image)) return item.image;
            return `${window.api.API_BASE_URL}/uploads/${item.image.replace(/^\/+/, '')}`;
        };
        const imgSrc = resolveImage();
        const row = document.createElement('tr');
        const category = categoryMap[item.category] || item.category;
        row.innerHTML = `
            <td><img src="${imgSrc}" alt="${item.name}" onerror="this.src='../assets/Logo.png'" style="border-radius: 5px; width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${item.name}</td>
            <td>${item.description || ''}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>${category}</td>
            <td>
                <button class="btn btn-sm btn-custom" onclick="showEditForm('${item._id || item.id}', '${item.name.replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}', '${item.price}', '${category}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItemById('${item._id || item.id}', '${item.name.replace(/'/g, "\\'")}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Setup form handlers
function setupFormHandlers() {
    // Add menu item form
    const addForm = document.querySelector('#addMenuItem form');
    if (addForm) {
        // Prevent native navigation
        addForm.setAttribute('action', 'javascript:void(0)');
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await createMenuItem();
            return false;
        });
    }
    
    // Edit menu item form
    const editForm = document.querySelector('#editMenuItem form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateMenuItemFromForm();
        });
    }
    
    // Search functionality
    const searchInput = document.querySelector('#menuList input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = menuItems.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))
            );
            displayMenuItems(filtered);
        });
    }
}

// Load categories from API and populate selects
async function loadCategories() {
    try {
        if (window.api) {
            const response = await window.api.apiRequest('/api/categories', { auth: true });
            if (response && response.categories) {
                categories = response.categories;
                populateCategorySelects();
            }
        }
    } catch (err) {
        console.error('Failed to load categories:', err);
        categories = [];
        populateCategorySelects();
    }
}

function populateCategorySelects() {
    const addSelect = document.querySelector('#addMenuItem select');
    const editSelect = document.getElementById('edit-menu-category');
    const buildOptions = () => {
        const fragment = document.createDocumentFragment();
        // Fallback categories if none exist yet
        const list = categories.length ? categories.map(c => c.name) : ['Main Dish','Appetizer','Salad','Drinks','Dessert'];
        list.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            fragment.appendChild(opt);
        });
        return fragment;
    };
    if (addSelect) {
        addSelect.innerHTML = '';
        addSelect.appendChild(buildOptions());
    }
    if (editSelect) {
        editSelect.innerHTML = '';
        editSelect.appendChild(buildOptions());
    }
}

// Add Category within Manage Categories modal
async function createCategoryInManage() {
    const input = document.getElementById('manage-new-category-name');
    const name = input?.value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    try {
        if (window.api) {
            await window.api.apiRequest('/api/categories', {
                method: 'POST',
                body: { name },
                auth: true,
            });
            input.value = '';
            await loadCategories();
            renderCategoriesList();
        }
    } catch (err) {
        console.error('Failed to create category:', err);
        alert('Failed to create category: ' + (err.message || 'Unknown error'));
    }
}

// Open Manage Categories modal and render
async function openManageCategories() {
    await loadCategories();
    renderCategoriesList();
    const modalEl = document.getElementById('manageCategoriesModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
}

function renderCategoriesList() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No categories found</td></tr>';
        return;
    }
    categories.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.name}</td>
            <td><small class="text-muted">${c.slug}</small></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteCategoryById('${c._id}', '${c.name.replace(/'/g, "\\'")}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Delete Category
async function deleteCategoryById(categoryId, name) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
        if (window.api) {
            await window.api.apiRequest(`/api/categories/${categoryId}`, {
                method: 'DELETE',
                auth: true,
            });
            await loadCategories();
            renderCategoriesList();
        }
    } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Failed to delete category: ' + (err.message || 'Unknown error'));
    }
}

// Create menu item
async function createMenuItem() {
    const name = document.querySelector('#addMenuItem input[type="text"]')?.value.trim();
    const description = document.querySelector('#addMenuItem textarea')?.value.trim();
    const price = parseFloat(document.querySelector('#addMenuItem input[type="number"]')?.value);
    const category = document.querySelector('#addMenuItem select')?.value;
    const imageInput = document.querySelector('#addMenuItem input[type="file"]');
    let image = '';
    
    if (!name || !price || isNaN(price)) {
        Swal.fire({ icon: 'info', title: 'Missing fields', text: 'Please fill in name and price' });
        return;
    }
    
    try {
        if (!window.api) throw new Error('API not available');

        // 1) Upload image if provided
        if (imageInput && imageInput.files && imageInput.files[0]) {
            try {
                const fd = new FormData();
                fd.append('image', imageInput.files[0]);
                const uploadRes = await window.api.apiRequest('/api/uploads/image', {
                    method: 'POST',
                    body: fd,
                    auth: true,
                });
                image = (uploadRes && uploadRes.filename) ? uploadRes.filename : '';
            } catch (uploadErr) {
                console.error('Image upload failed:', uploadErr);
                Swal.fire({ icon: 'error', title: 'Image upload failed', text: uploadErr.message || 'Unknown error' });
                return;
            }
        }

        // 2) Create menu item
        await window.api.apiRequest('/api/menu', {
            method: 'POST',
            body: { name, description, price, category, image },
            auth: true,
        });
        
        await Swal.fire({ icon: 'success', title: 'Menu item created', timer: 1200, showConfirmButton: false });
        await loadMenuItems();
        showContent('menuList');
        const addForm = document.querySelector('#addMenuItem form');
        if (addForm) addForm.reset();
    } catch (err) {
        console.error('Failed to create menu item:', err);
        const hint = (err && /403|Access denied/i.test(err.message)) ? '\nHint: login as staff/admin to create menu items.' : '';
        Swal.fire({ icon: 'error', title: 'Create failed', text: (err.message || 'Unknown error') + hint });
    }
}

// Show edit form
function showEditForm(itemId, itemName, description, price, category) {
    currentMenuItemId = itemId;
    
    document.getElementById('edit-menu-name').value = itemName || '';
    document.getElementById('edit-menu-description').value = description || '';
    document.getElementById('edit-menu-price').value = price || '';
    document.getElementById('edit-menu-category').value = category || 'Main Dish';
    
    showContent('editMenuItem');
}

// Update menu item
async function updateMenuItemFromForm() {
    if (!currentMenuItemId) {
        Swal.fire({ icon: 'info', title: 'No item selected' });
        return;
    }
    
    const itemName = document.getElementById('edit-menu-name').value.trim();
    const description = document.getElementById('edit-menu-description').value.trim();
    const price = parseFloat(document.getElementById('edit-menu-price').value);
    const category = document.getElementById('edit-menu-category').value;
    
    if (!itemName || !price || isNaN(price)) {
        Swal.fire({ icon: 'info', title: 'Missing fields', text: 'Please fill in name and price' });
        return;
    }
    
    try {
        if (window.api) {
            const confirmRes = await Swal.fire({
                icon: 'question',
                title: 'Update item?',
                text: itemName,
                showCancelButton: true,
                confirmButtonText: 'Update',
            });
            if (!confirmRes.isConfirmed) return;
            // Optional image upload if a new file is selected
            const imageInput = document.getElementById('edit-menu-image');
            let body = { name: itemName, description, price, category };
            if (imageInput && imageInput.files && imageInput.files[0]) {
                const fd = new FormData();
                fd.append('image', imageInput.files[0]);
                const uploadRes = await window.api.apiRequest('/api/uploads/image', {
                    method: 'POST',
                    body: fd,
                    auth: true,
                });
                if (uploadRes && uploadRes.filename) {
                    body.image = uploadRes.filename;
                }
            }
            await window.api.apiRequest(`/api/menu/${currentMenuItemId}`, {
                method: 'PUT',
                body,
                auth: true,
            });
            
            await Swal.fire({ icon: 'success', title: 'Menu item updated', timer: 1200, showConfirmButton: false });
            await loadMenuItems();
            showContent('menuList');
            currentMenuItemId = null;
        }
    } catch (err) {
        console.error('Failed to update menu item:', err);
        Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || 'Unknown error' });
    }
}

// Delete menu item
async function deleteMenuItemById(itemId, itemName) {
    const confirmRes = await Swal.fire({
        icon: 'warning',
        title: 'Delete item?',
        text: itemName,
        showCancelButton: true,
        confirmButtonText: 'Delete',
    });
    if (!confirmRes.isConfirmed) return;
    
    try {
        if (window.api) {
            await window.api.apiRequest(`/api/menu/${itemId}`, {
                method: 'DELETE',
                auth: true,
            });
            
            await Swal.fire({ icon: 'success', title: 'Deleted', text: `"${itemName}" removed`, timer: 1000, showConfirmButton: false });
            await loadMenuItems();
        }
    } catch (err) {
        console.error('Failed to delete menu item:', err);
        Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Unknown error' });
    }
}

// Legacy delete function for compatibility
function deleteMenuItem(itemName) {
    const item = menuItems.find(i => i.name === itemName);
    if (item) {
        deleteMenuItemById(item._id || item.id, itemName);
    }
}

// Legacy delete from edit
function deleteMenuItemFromEdit() {
    const itemName = document.getElementById('edit-menu-name').value;
    if (currentMenuItemId) {
        deleteMenuItemById(currentMenuItemId, itemName);
        showContent('menuList');
    }
}

function showContent(contentId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected content
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.add('active');
    }

    // Update active menu item
    if (event && event.target) {
        document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    submenu.classList.toggle('show');

    // Update menu item state
    if (event && event.target) {
    event.target.classList.toggle('active');
    }
}

function logout() {
    Swal.fire({
        icon: 'question',
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        showCancelButton: true,
        confirmButtonText: 'Logout',
    }).then(res => {
        if (res.isConfirmed) {
            try { localStorage.removeItem('authToken'); localStorage.removeItem('authUserRole'); } catch (_) {}
            window.location.href = '../login.html';
        }
    });
}

function showOrderDetails(orderId, customer, items, quantity, total, status, date) {
    // Populate modal with order details
    document.getElementById('modal-order-id-title').textContent = '#' + orderId;
    document.getElementById('modal-order-id').textContent = '#' + orderId;
    document.getElementById('modal-order-date').textContent = date;
    document.getElementById('modal-customer-name').textContent = customer;
    document.getElementById('modal-items').textContent = items;
    document.getElementById('modal-quantity').textContent = quantity;
    document.getElementById('modal-total').textContent = total;
    document.getElementById('modal-total-footer').textContent = total;
    document.getElementById('modal-status').textContent = status;
    
    // Set badge color based on status
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.className = 'badge bg-success';
    if (status === 'Pending') {
        statusBadge.className = 'badge bg-warning';
    }

    // Show modal
    const myModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    myModal.show();
}

// =====================
// User Management (Staff/Admin)
// =====================
async function loadUsers() {
    try {
        if (!window.api) return;
        const res = await window.api.apiRequest('/api/auth/users', { auth: true });
        let users = (res && res.users) ? res.users : [];
        // Only show staff and admin accounts
        users = users.filter(u => u.role === 'staff' || u.role === 'admin');
        renderUsersTable(users);
    } catch (err) {
        console.error('Failed to load users:', err);
        renderUsersTable([]);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!users.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" class="text-center text-muted">No users found or access denied</td>';
        tbody.appendChild(tr);
        return;
    }
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.username || ''}</td>
            <td>${u.role}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeUserPrompt('${u._id}', '${u.username || ''}')">Remove</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddUser() {
    const modalEl = document.getElementById('addUserModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    document.getElementById('addUserRole').value = 'staff';
    document.getElementById('addUserUsername').value = '';
    document.getElementById('addUserPassword').value = '';
    modal.show();
}

async function submitAddUser() {
    try {
        const role = document.getElementById('addUserRole').value;
        const username = document.getElementById('addUserUsername').value.trim();
        const password = document.getElementById('addUserPassword').value;
        if (!username || !password) {
            await Swal.fire({ icon: 'info', title: 'Missing fields', text: 'Provide username and password' });
            return;
        }
        await window.api.apiRequest('/api/auth/register', {
            method: 'POST',
            body: { username, password, role },
            auth: true,
        });
        await Swal.fire({ icon: 'success', title: 'User created', timer: 1200, showConfirmButton: false });
        const modalEl = document.getElementById('addUserModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        await loadUsers();
        showContent('userManagement');
    } catch (err) {
        console.error('Create user failed:', err);
        Swal.fire({ icon: 'error', title: 'Create failed', text: err.message || 'Unknown error' });
    }
}

async function removeUserPrompt(userId, label) {
    try {
        const res = await Swal.fire({
            icon: 'warning',
            title: 'Remove user?',
            text: label,
            showCancelButton: true,
            confirmButtonText: 'Remove',
        });
        if (!res.isConfirmed) return;
        await window.api.apiRequest(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            auth: true,
        });
        await Swal.fire({ icon: 'success', title: 'User removed', timer: 1000, showConfirmButton: false });
        await loadUsers();
    } catch (err) {
        console.error('Remove user failed:', err);
        Swal.fire({ icon: 'error', title: 'Remove failed', text: err.message || 'Unknown error' });
    }
}
