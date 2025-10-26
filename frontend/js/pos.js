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

// Orders Data
const allOrders = [
    { id: '#1234', date: '2024-01-15 14:30', customer: 'John Doe', items: 'Pizza, Salad', total: '$21.98', status: 'completed' },
    { id: '#1235', date: '2024-01-15 15:00', customer: 'Jane Smith', items: 'Burger, Fries', total: '$14.99', status: 'completed' },
    { id: '#1236', date: '2024-01-15 15:30', customer: 'Bob Johnson', items: 'Chicken Sandwich, Pepsi', total: '$16.50', status: 'processing' },
    { id: '#1237', date: '2024-01-15 16:00', customer: 'Alice Williams', items: 'Pasta, Garlic Bread', total: '$28.50', status: 'pending' },
    { id: '#1238', date: '2024-01-15 16:15', customer: 'Charlie Brown', items: 'Fish and Chips, Cola', total: '$22.99', status: 'pending' },
];

const pendingOrders = [
    { id: '#1237', time: '16:00', customer: 'Alice Williams', items: 'Pasta, Garlic Bread', total: '$28.50', priority: 'High' },
    { id: '#1238', time: '16:15', customer: 'Charlie Brown', items: 'Fish and Chips, Cola', total: '$22.99', priority: 'Normal' },
    { id: '#1239', time: '16:30', customer: 'David Lee', items: 'Pizza, Salad', total: '$25.50', priority: 'High' },
    { id: '#1240', time: '16:45', customer: 'Emma Wilson', items: 'Burger, Fries', total: '$18.99', priority: 'Normal' },
];

// Cart array
let cart = [];
let currentCategory = 'all';

let currentOrderFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderManagement();
    
    // Search functionality
    document.getElementById('searchOrdersInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterOrdersBySearch(searchTerm);
    });
});

// Filter orders by search term
function filterOrdersBySearch(searchTerm) {
    const tableBody = document.getElementById('orderManagementTable');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Load Order Management
function loadOrderManagement(filter = 'all') {
    const tableBody = document.getElementById('orderManagementTable');
    tableBody.innerHTML = '';
    
    let ordersToShow = [...allOrders, ...pendingOrders];
    
    // Apply filter
    if (filter !== 'all') {
        ordersToShow = ordersToShow.filter(order => order.status === filter);
    }
    
    ordersToShow.forEach(order => {
        const row = document.createElement('tr');
        const statusBadge = getStatusBadge(order.status);
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.date || order.time}</td>
            <td>${order.customer}</td>
            <td>${order.items}</td>
            <td>${order.total}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewOrderDetails('${order.id}')">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Filter orders - Open modal
function filterOrders() {
    const myModal = new bootstrap.Modal(document.getElementById('filterModal'));
    myModal.show();
}

// Apply filter
function applyFilter(status) {
    currentOrderFilter = status;
    loadOrderManagement(status);
    
    // Close modal
    const myModal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    myModal.hide();
}

// Refresh orders
function refreshOrders() {
    loadOrderManagement(currentOrderFilter);
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-pending">Pending</span>',
        'processing': '<span class="badge badge-processing">Processing</span>',
        'completed': '<span class="badge badge-completed">Completed</span>',
        'cancelled': '<span class="badge badge-cancelled">Cancelled</span>'
    };
    return badges[status] || '';
}

let currentOrderId = '';

// View order details
function viewOrderDetails(orderId) {
    // Store current order ID for later use
    currentOrderId = orderId;
    
    // Find the order from all orders
    const order = [...allOrders, ...pendingOrders].find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Populate modal with order details
    document.getElementById('modal-order-id').textContent = orderId;
    document.getElementById('modal-order-id-info').textContent = orderId;
    document.getElementById('modal-order-date').textContent = order.date || order.time;
    document.getElementById('modal-customer-name').textContent = order.customer;
    document.getElementById('modal-status-badge').innerHTML = getStatusBadge(order.status);
    document.getElementById('modal-status-badge').setAttribute('data-current-status', order.status);
    
    // Parse items for display
    const items = order.items.split(', ');
    const itemsTable = document.getElementById('modal-items-table');
    itemsTable.innerHTML = '';
    
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><small>${item.trim()}</small></td>
            <td><small>1</small></td>
            <td><small>$10.00</small></td>
            <td><small>$10.00</small></td>
        `;
        itemsTable.appendChild(row);
    });
    
    document.getElementById('modal-total').textContent = order.total;
    
    // Show modal
    const myModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    myModal.show();
}

// Change order status
function changeOrderStatus() {
    const currentStatus = document.getElementById('modal-status-badge').getAttribute('data-current-status');
    const newStatus = prompt(`Current status: ${currentStatus}\n\nEnter new status (pending/processing/completed/cancelled):`);
    
    if (newStatus && (newStatus === 'pending' || newStatus === 'processing' || newStatus === 'completed' || newStatus === 'cancelled')) {
        // Find and update the order
        const allOrdersCombined = [...allOrders, ...pendingOrders];
        const order = allOrdersCombined.find(o => o.id === currentOrderId);
        
        if (order) {
            order.status = newStatus;
            alert(`Order ${currentOrderId} status updated to ${newStatus}.\n(This is a demo - integrate with backend for real update.)`);
            
            // Update modal display
            document.getElementById('modal-status-badge').innerHTML = getStatusBadge(newStatus);
            document.getElementById('modal-status-badge').setAttribute('data-current-status', newStatus);
            
            // Reload the table
            loadOrderManagement(currentOrderFilter);
            
            // Close modal
            const myModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
            myModal.hide();
        }
    } else if (newStatus) {
        alert('Invalid status. Please enter: pending, processing, completed, or cancelled');
    }
}

// Print order receipt
function printOrder() {
    window.print();
}


