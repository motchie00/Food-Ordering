// Menu Items Data (loaded from API)
let menuItems = [];

// Customer Orders Data (loaded from API)
let customerOrders = [];

// Cart array
let cart = [];
let currentCategory = 'all';
let availableCategories = [];
let addToCartContext = { itemId: null };

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Auth guard
        if (!window.api || !window.api.getAuthToken() || !window.api.getAuthToken().length) {
            // Not logged in; redirect to login page at project root
            window.location.href = '../login.html';
            return;
        }
    } catch (_) {
        // If localStorage fails, still allow page to render
    }

    await loadMenuFromAPI();
    await loadCategoriesFromAPI();
    renderCategoryButtons();
    await loadCustomerOrders();
    displayMenuItems();

    // Connectivity check
    try {
        if (window.api) {
            await window.api.apiRequest('/api/test');
            // Optionally indicate connectivity in console
            console.log('Backend API reachable at', window.api.API_BASE_URL);
        }
    } catch (err) {
        console.warn('Backend API not reachable:', err && err.message ? err.message : err);
    }
    
    // Search functionality
    document.getElementById('menuSearch').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = menuItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        displayMenuItems(filteredItems);
    });
});

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update cart display if switching to cart
    if (sectionId === 'cart') {
        updateCart();
    }
}

// Load menu from API
async function loadMenuFromAPI() {
    try {
        if (window.api) {
            const response = await window.api.apiRequest('/api/menu');
            if (response && response.items) {
                menuItems = response.items.map(item => {
                    const resolveImage = () => {
                        if (!item.image) return '../assets/Logo.png';
                        if (/^https?:\/\//i.test(item.image)) return item.image;
                        return `${window.api.API_BASE_URL}/uploads/${(item.image || '').replace(/^\/+/, '')}`;
                    };
                    return ({
                        id: item._id || item.id,
                        name: item.name,
                        description: item.description || '',
                        price: item.price,
                        category: item.category || 'Other',
                        image: resolveImage(),
                        isAvailable: item.isAvailable !== false,
                    });
                });
                return true;
            }
        }
    } catch (err) {
        console.error('Failed to load menu from API:', err);
    }
    return false;
}

// Display menu items
function displayMenuItems(items = menuItems) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    const filteredItems = currentCategory === 'all' 
        ? items 
        : items.filter(item => item.category === currentCategory);

    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/Logo.png'">
            <div class="menu-item-card-body">
                <h5>${item.name}</h5>
                <p>${item.description}</p>
                <div class="price">₱${item.price.toFixed(2)}</div>
                <button class="btn btn-custom btn-sm w-100" onclick="openAddToCartModal('${item.id}')">
                    <i class="bi bi-cart-plus me-2"></i>Add to Cart
                </button>
            </div>
        `;
        menuGrid.appendChild(itemCard);
    });
}

// Filter by category
function filterCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayMenuItems();
}

// Load categories and render filter buttons
async function loadCategoriesFromAPI() {
    try {
        if (window.api) {
            const res = await window.api.apiRequest('/api/categories');
            if (res && Array.isArray(res.categories)) {
                availableCategories = res.categories.map(c => c.name);
                return;
            }
        }
    } catch (err) {
        console.warn('Failed to load categories:', err && err.message ? err.message : err);
    }
    // Fallback list if API not available
    availableCategories = ['Main Dish','Appetizer','Salad','Drinks','Dessert'];
}

function renderCategoryButtons() {
    const container = document.querySelector('.category-filter');
    if (!container) return;
    container.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'btn category-btn active';
    allBtn.textContent = 'All';
    allBtn.onclick = function(e){ window.event = e; filterCategory('all'); };
    container.appendChild(allBtn);
    availableCategories.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'btn category-btn';
        btn.textContent = name;
        btn.onclick = function(e){ window.event = e; filterCategory(name); };
        container.appendChild(btn);
    });
}

// Add to cart
function addToCart(itemId, quantity = 1) {
    const item = menuItems.find(i => String(i.id) === String(itemId));
    if (!item) return;
    const existingItem = cart.find(c => String(c.id) === String(itemId));

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ ...item, quantity: qty });
    }

    updateCartCount();
}

function openAddToCartModal(itemId) {
    addToCartContext.itemId = itemId;
    const item = menuItems.find(i => String(i.id) === String(itemId));
    if (!item) return;
    document.getElementById('add-cart-name').textContent = item.name;
    document.getElementById('add-cart-desc').textContent = item.description || '';
    document.getElementById('add-cart-price').textContent = `₱${item.price.toFixed(2)}`;
    const img = document.getElementById('add-cart-image');
    img.src = item.image;
    img.onerror = function(){ this.src = '../assets/Logo.png'; };
    const qtyInput = document.getElementById('add-cart-qty');
    qtyInput.value = 1;
    const modal = new bootstrap.Modal(document.getElementById('addToCartModal'));
    modal.show();
}

function changeAddQty(delta) {
    const qtyInput = document.getElementById('add-cart-qty');
    const current = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = Math.max(1, current + delta);
}

function confirmAddToCart() {
    const qtyInput = document.getElementById('add-cart-qty');
    const qty = parseInt(qtyInput.value, 10) || 1;
    addToCart(addToCartContext.itemId, qty);
    const modalEl = document.getElementById('addToCartModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}

// Update cart count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

// Update cart display
function updateCart() {
    const cartBody = document.getElementById('cartBody');
    const cartSummary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart">
                <i class="bi bi-cart-x"></i>
                <p>Your cart is empty</p>
                <button class="btn btn-custom" onclick="showSection('menu')">Browse Menu</button>
            </div>
        `;
        cartSummary.style.display = 'none';
    } else {
        cartBody.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="d-flex align-items-start gap-2">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/Logo.png'" style="width:56px; height:56px; object-fit:cover; border-radius:6px;">
                    <div class="flex-grow-1">
                        <div class="cart-item-header">
                            <span class="cart-item-name">${item.name}</span>
                            <span class="cart-item-price">₱${itemTotal.toFixed(2)}</span>
                        </div>
                        <div class="cart-item-controls">
                            <button class="btn quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                                <i class="bi bi-dash"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" readonly>
                            <button class="btn quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                                <i class="bi bi-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-danger ms-auto" onclick="removeFromCart('${item.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartBody.appendChild(cartItem);
        });

        cartSummary.style.display = 'block';
        updateTotals();
    }
}

// Update quantity
function updateQuantity(itemId, change) {
    const item = cart.find(c => String(c.id) === String(itemId));
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        updateCart();
        updateCartCount();
    }
}

// Remove from cart
function removeFromCart(itemId) {
    const item = cart.find(c => String(c.id) === String(itemId));
    if (!item) return;
    Swal.fire({
        icon: 'warning',
        title: 'Remove item?',
        text: item.name,
        showCancelButton: true,
        confirmButtonText: 'Remove',
    }).then(res => {
        if (res.isConfirmed) {
            cart = cart.filter(ci => String(ci.id) !== String(itemId));
            updateCart();
            updateCartCount();
        }
    });
}

// Update totals
function updateTotals() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
}

function openOrderSummaryModal() {
    if (cart.length === 0) {
        Swal.fire({ icon: 'info', title: 'Cart is empty', text: 'Please add items to proceed.' });
        return;
    }
    // Build summary table
    const tbody = document.getElementById('summaryTableBody');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    tbody.innerHTML = '';
    cart.forEach(ci => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ci.name}</td>
            <td class="text-center">${ci.quantity}</td>
            <td class="text-end">₱${ci.price.toFixed(2)}</td>
            <td class="text-end">₱${(ci.price * ci.quantity).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('summaryTotal').textContent = `₱${total.toFixed(2)}`;
    // Reset form
    document.getElementById('summaryAddress').value = '';
    const phoneEl = document.getElementById('summaryPhone');
    if (phoneEl) phoneEl.value = '';
    document.getElementById('summary-cod').checked = true;
    const modal = new bootstrap.Modal(document.getElementById('orderSummaryModal'));
    modal.show();
}

async function confirmOrder() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const address = (document.getElementById('summaryAddress').value || '').trim();
    const phone = (document.getElementById('summaryPhone').value || '').trim();
    const methodEl = document.querySelector('input[name="summaryPayment"]:checked');
    const selected = methodEl ? methodEl.value : 'cod';
    const paymentMethod = selected === 'cod' ? 'cash' : 'gcash';
    
    try {
        if (window.api) {
            const orderPayload = {
                items: cart,
                total: total,
                deliveryAddress: address,
                phone,
                paymentMethod,
            };
            await window.api.apiRequest('/api/orders', {
                method: 'POST',
                body: orderPayload,
                auth: true,
            });
            await Swal.fire({ icon: 'success', title: 'Order placed', text: 'Total: ₱' + total.toFixed(2), timer: 1500, showConfirmButton: false });
        }
    } catch (err) {
        console.error('Failed to place order via API:', err && err.message ? err.message : err);
        Swal.fire({ icon: 'error', title: 'Failed to place order', text: err.message || 'Unknown error' });
        return;
    }
    
    const summaryModalEl = document.getElementById('orderSummaryModal');
    const summaryModal = bootstrap.Modal.getInstance(summaryModalEl);
    if (summaryModal) summaryModal.hide();
    
    cart = [];
    updateCart();
    updateCartCount();
    await loadCustomerOrders();
}

// Load customer orders from API
async function loadCustomerOrders() {
    try {
        if (window.api) {
            const response = await window.api.apiRequest('/api/orders', { auth: true });
            if (response && response.orders) {
                // Map backend orders to frontend format
                customerOrders = response.orders.map(order => {
                    const items = order.items.map(item => {
                        const name = item.menuItem?.name || item.name || 'Unknown Item';
                        return name;
                    }).join(', ');
                    
                    const statusMap = {
                        'pending': 'pending',
                        'confirmed': 'pending',
                        'preparing': 'preparing',
                        'ready': 'preparing',
                        'out-for-delivery': 'preparing',
                        'delivered': 'completed',
                        'cancelled': 'cancelled',
                    };
                    
                    return {
                        id: order._id || order.id,
                        displayId: order.orderCode || (order._id || order.id),
                        date: order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString(),
                        items: items,
                        total: '₱' + (order.totalAmount || order.total || 0).toFixed(2),
                        status: statusMap[order.status] || 'pending',
                        orderData: order, // Keep full order for tracking
                    };
                });
            }
        }
    } catch (err) {
        console.error('Failed to load orders from API:', err);
        customerOrders = [];
    }
    
    const tableBody = document.getElementById('ordersTable');
    tableBody.innerHTML = '';
    
    if (customerOrders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
        return;
    }
    
    customerOrders.forEach(order => {
        const row = document.createElement('tr');
        const statusBadge = getStatusBadge(order.status);
        
        row.innerHTML = `
            <td>${order.displayId ? order.displayId : ('#' + order.id.substring(0, 8))}</td>
            <td>${order.date}</td>
            <td>${order.items}</td>
            <td>${order.total}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="trackOrder('${order.id}')">
                    <i class="bi bi-eye"></i> Track
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-pending">Pending</span>',
        'preparing': '<span class="badge badge-processing">Preparing</span>',
        'completed': '<span class="badge badge-completed">Completed</span>'
    };
    // Backward compatibility: show Preparing for legacy 'processing'
    if (status === 'processing') return '<span class="badge badge-processing">Preparing</span>';
    return badges[status] || '';
}

let currentTrackingOrderId = '';

// Track order
async function trackOrder(orderId) {
    currentTrackingOrderId = orderId;
    
    // Try to fetch latest order from API
    let order = customerOrders.find(o => o.id === orderId);
    let orderData = order?.orderData;
    
    if (!order && window.api) {
        try {
            const response = await window.api.apiRequest(`/api/orders/${orderId}`, { auth: true });
            if (response && response.order) {
                orderData = response.order;
                const items = orderData.items.map(item => {
                    const name = item.menuItem?.name || item.name || 'Unknown Item';
                    return name;
                }).join(', ');
                
                const statusMap = {
                    'pending': 'pending',
                    'confirmed': 'pending',
                    'preparing': 'processing',
                    'ready': 'processing',
                    'out-for-delivery': 'processing',
                    'delivered': 'completed',
                    'cancelled': 'cancelled',
                };
                
                order = {
                    id: orderData._id || orderData.id,
                    date: orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : new Date().toLocaleString(),
                    items: items,
                    total: '$' + (orderData.totalAmount || orderData.total || 0).toFixed(2),
                    status: statusMap[orderData.status] || 'pending',
                    orderData: orderData,
                };
            }
        } catch (err) {
            console.error('Failed to fetch order:', err);
        }
    }
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Populate modal with order details
    const displayId = (order.orderData && order.orderData.orderCode) ? order.orderData.orderCode : ('#' + orderId.substring(0, 8));
    document.getElementById('track-order-id').textContent = displayId;
    document.getElementById('track-order-id-info').textContent = displayId;
    document.getElementById('track-order-date').textContent = order.date;
    document.getElementById('track-status-badge').innerHTML = getStatusBadge(order.status);
    document.getElementById('track-total').textContent = order.total;
    // Address and phone
    const od = order.orderData || {};
    document.getElementById('track-delivery-address').textContent = (od.deliveryAddress && od.deliveryAddress.trim()) ? od.deliveryAddress : 'N/A';
    document.getElementById('track-phone').textContent = (od.phone && od.phone.trim()) ? od.phone : 'N/A';
    
    document.getElementById('track-placed-time').textContent = order.date;
    
    // Parse and display items
    const items = order.items.split(', ');
    const itemsList = document.getElementById('track-items-list');
    itemsList.innerHTML = '<div class="list-group list-group-flush">';
    items.forEach(item => {
        itemsList.innerHTML += `
            <div class="list-group-item py-1 px-2 d-flex justify-content-between">
                <small>${item.trim()}</small>
            </div>
        `;
    });
    itemsList.innerHTML += '</div>';
    
    // Show modal
    const myModal = new bootstrap.Modal(document.getElementById('orderTrackingModal'));
    myModal.show();
}

// Refresh tracking
async function refreshTracking() {
    await loadCustomerOrders();
    await trackOrder(currentTrackingOrderId);
}

// Logout
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

