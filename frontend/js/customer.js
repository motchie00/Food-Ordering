// Menu Items Data
const menuItems = [
    { id: 1, name: "Pizza Margherita", description: "Fresh mozzarella, tomato sauce", price: 12.99, category: "Main Dish", image: "https://via.placeholder.com/200" },
    { id: 2, name: "Pasta Carbonara", description: "Creamy pasta with bacon", price: 14.99, category: "Main Dish", image: "https://via.placeholder.com/200" },
    { id: 3, name: "Caesar Salad", description: "Fresh romaine lettuce with parmesan", price: 8.99, category: "Salad", image: "https://via.placeholder.com/200" },
    { id: 4, name: "Garlic Bread", description: "Toasted bread with garlic butter", price: 5.99, category: "Appetizer", image: "https://via.placeholder.com/200" },
    { id: 5, name: "Cola", description: "Refreshing cola drink", price: 2.99, category: "Drinks", image: "https://via.placeholder.com/200" },
    { id: 6, name: "Chicken Burger", description: "Grilled chicken burger", price: 10.99, category: "Main Dish", image: "https://via.placeholder.com/200" },
    { id: 7, name: "French Fries", description: "Crispy golden fries", price: 4.99, category: "Appetizer", image: "https://via.placeholder.com/200" },
    { id: 8, name: "Orange Juice", description: "Freshly squeezed orange juice", price: 3.99, category: "Drinks", image: "https://via.placeholder.com/200" },
    { id: 9, name: "Greek Salad", description: "Fresh vegetables with feta cheese", price: 9.99, category: "Salad", image: "https://via.placeholder.com/200" },
    { id: 10, name: "Chocolate Cake", description: "Rich chocolate cake", price: 6.99, category: "Dessert", image: "https://via.placeholder.com/200" },
];

// Customer Orders Data
const customerOrders = [
    { id: '#1234', date: '2024-01-15 14:30', items: 'Pizza Margherita, Caesar Salad', total: '$21.98', status: 'completed' },
    { id: '#1235', date: '2024-01-15 15:00', items: 'Burger, Fries', total: '$14.99', status: 'processing' },
    { id: '#1236', date: '2024-01-15 16:00', items: 'Pasta Carbonara', total: '$14.99', status: 'pending' },
];

// Cart array
let cart = [];
let currentCategory = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    displayMenuItems();
    loadCustomerOrders();
    
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
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/200'">
            <div class="menu-item-card-body">
                <h5>${item.name}</h5>
                <p>${item.description}</p>
                <div class="price">$${item.price.toFixed(2)}</div>
                <button class="btn btn-custom btn-sm w-100" onclick="addToCart(${item.id})">
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

// Add to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existingItem = cart.find(c => c.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    updateCartCount();
    alert(`${item.name} added to cart!`);
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
                <div class="cart-item-header">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">$${itemTotal.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="btn quantity-btn" onclick="updateQuantity(${item.id}, -1)">
                        <i class="bi bi-dash"></i>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="btn quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                        <i class="bi bi-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-danger ms-auto" onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
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
    const item = cart.find(c => c.id === itemId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        updateCart();
        updateCartCount();
    }
}

// Remove from cart
function removeFromCart(itemId) {
    const item = cart.find(c => c.id === itemId);
    if (item && confirm(`Remove ${item.name} from cart?`)) {
        cart = cart.filter(item => item.id !== itemId);
        updateCart();
        updateCartCount();
    }
}

// Update totals
function updateTotals() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Place order
function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items to proceed.');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderDetails = {
        items: cart,
        total: total,
        timestamp: new Date().toISOString()
    };

    alert('Order placed successfully!\nTotal: $' + total.toFixed(2) + '\n(This is a demo - integrate with backend for real processing.)');
    
    // Add to customer orders
    const newOrder = {
        id: '#1237',
        date: new Date().toLocaleString(),
        items: cart.map(i => i.name).join(', '),
        total: '$' + total.toFixed(2),
        status: 'pending'
    };
    customerOrders.unshift(newOrder);
    
    // Clear cart
    cart = [];
    updateCart();
    updateCartCount();
    
    // Load orders
    loadCustomerOrders();
}

// Load customer orders
function loadCustomerOrders() {
    const tableBody = document.getElementById('ordersTable');
    tableBody.innerHTML = '';
    
    customerOrders.forEach(order => {
        const row = document.createElement('tr');
        const statusBadge = getStatusBadge(order.status);
        
        row.innerHTML = `
            <td>${order.id}</td>
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
        'processing': '<span class="badge badge-processing">Processing</span>',
        'completed': '<span class="badge badge-completed">Completed</span>'
    };
    return badges[status] || '';
}

let currentTrackingOrderId = '';

// Track order
function trackOrder(orderId) {
    currentTrackingOrderId = orderId;
    
    // Find the order
    const order = customerOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Populate modal with order details
    document.getElementById('track-order-id').textContent = orderId;
    document.getElementById('track-order-id-info').textContent = orderId;
    document.getElementById('track-order-date').textContent = order.date;
    document.getElementById('track-status-badge').innerHTML = getStatusBadge(order.status);
    document.getElementById('track-total').textContent = order.total;
    
    // Set estimated time based on status
    let estimatedTime = '30 minutes';
    if (order.status === 'processing') {
        estimatedTime = '20 minutes';
    } else if (order.status === 'completed') {
        estimatedTime = 'Delivered';
    }
    document.getElementById('track-estimated-time').textContent = estimatedTime;
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
function refreshTracking() {
    loadCustomerOrders();
    trackOrder(currentTrackingOrderId);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

