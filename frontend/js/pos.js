// Orders Data (loaded from API)
let allOrders = [];

// Cart array
let cart = [];
let currentCategory = 'all';

let currentOrderFilter = 'all';
let currentPage = 1;
let pageSize = 10;
let totalOrdersCount = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Auth guard
    try {
        if (!window.api || !window.api.getAuthToken() || !window.api.getAuthToken().length) {
            window.location.href = '../login.html';
            return;
        }
    } catch (_) {}
    
    await loadOrderManagement();
    
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

// Load Order Management from API
async function loadOrderManagement(filter = 'all', page = currentPage) {
    try {
        if (window.api) {
            const response = await window.api.apiRequest('/api/orders', { auth: true });
            if (response && response.orders) {
                // Map backend orders to frontend format
                allOrders = response.orders.map(order => {
                    const items = order.items.map(item => {
                        const name = item.menuItem?.name || item.name || 'Unknown Item';
                        return name;
                    }).join(', ');
                    
                    const customerName = order.user?.email || order.user?.username || 'Unknown Customer';
                    
                    const statusMap = {
                        'pending': 'pending',
                        'confirmed': 'pending',
                        'preparing': 'processing',
                        'ready': 'processing',
                        'out-for-delivery': 'processing',
                        'delivered': 'completed',
                        'cancelled': 'cancelled',
                    };
                    
                    return {
                        id: order._id || order.id,
                        displayId: order.orderCode || (order._id || order.id),
                        date: order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString(),
                        customer: customerName,
                        items: items,
                        total: '₱' + (order.totalAmount || order.total || 0).toFixed(2),
                        status: statusMap[order.status] || 'pending',
                        orderData: order,
                    };
                });
            }
        }
    } catch (err) {
        console.error('Failed to load orders from API:', err);
        allOrders = [];
    }
    
    const tableBody = document.getElementById('orderManagementTable');
    tableBody.innerHTML = '';
    
    let ordersToShow = [...allOrders];
    
    // Apply filter
    if (filter !== 'all') {
        ordersToShow = ordersToShow.filter(order => order.status === filter);
    }
    
    totalOrdersCount = ordersToShow.length;
    const totalPages = Math.max(1, Math.ceil(totalOrdersCount / pageSize));
    currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageItems = ordersToShow.slice(start, start + pageSize);
    if (pageItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
        renderOrdersPagination(0, 0, 0);
        return;
    }
    
    pageItems.forEach(order => {
        const row = document.createElement('tr');
        const statusBadge = getStatusBadge(order.status);
        
        row.innerHTML = `
            <td>${order.displayId ? order.displayId : ('#' + order.id.substring(0, 8))}</td>
            <td>${order.date}</td>
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
    renderOrdersPagination(totalOrdersCount, currentPage, totalPages);
}

// Filter orders - Open modal
function filterOrders() {
    const myModal = new bootstrap.Modal(document.getElementById('filterModal'));
    myModal.show();
}

// Apply filter
function applyFilter(status) {
    currentOrderFilter = status;
    loadOrderManagement(status, 1);
    
    // Close modal
    const myModal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    myModal.hide();
}

// Refresh orders
async function refreshOrders() {
    await loadOrderManagement(currentOrderFilter, currentPage);
}

function renderOrdersPagination(total, page, totalPages) {
    const pag = document.getElementById('ordersPagination');
    const summary = document.getElementById('ordersSummary');
    if (!pag || !summary) return;
    pag.innerHTML = '';
    if (total === 0) { summary.textContent = 'No orders'; return; }
    const startIdx = (page - 1) * pageSize + 1;
    const endIdx = Math.min(page * pageSize, total);
    summary.textContent = `Showing ${startIdx}-${endIdx} of ${total}`;
    const createItem = (label, disabled, targetPage, isActive=false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = label;
        a.onclick = (e) => { e.preventDefault(); if (!disabled) loadOrderManagement(currentOrderFilter, targetPage); };
        li.appendChild(a);
        return li;
    };
    pag.appendChild(createItem('Prev', page <= 1, page - 1));
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    for (let p = startPage; p <= endPage; p++) {
        pag.appendChild(createItem(String(p), false, p, p === page));
    }
    pag.appendChild(createItem('Next', page >= totalPages, page + 1));
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-pending">Pending</span>',
        'preparing': '<span class="badge badge-processing">Preparing</span>',
        'completed': '<span class="badge badge-completed">Completed</span>',
        'cancelled': '<span class="badge badge-cancelled">Cancelled</span>'
    };
    if (status === 'processing') return '<span class="badge badge-processing">Preparing</span>';
    return badges[status] || '';
}

let currentOrderId = '';

// View order details
async function viewOrderDetails(orderId) {
    currentOrderId = orderId;
    
    // Try to fetch latest order from API
    let order = allOrders.find(o => o.id === orderId);
    
    if (!order && window.api) {
        try {
            const response = await window.api.apiRequest(`/api/orders/${orderId}`, { auth: true });
            if (response && response.order) {
                const orderData = response.order;
                const items = orderData.items.map(item => {
                    const name = item.menuItem?.name || item.name || 'Unknown Item';
                    return name;
                }).join(', ');
                
                const customerName = orderData.user?.email || orderData.user?.username || 'Unknown Customer';
                
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
                    customer: customerName,
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
    
    const orderData = order.orderData || order;
    
    // Populate modal with order details
    const displayId = (order && order.orderData && order.orderData.orderCode) ? order.orderData.orderCode : ('#' + orderId.substring(0, 8));
    document.getElementById('modal-order-id').textContent = displayId;
    document.getElementById('modal-order-id-info').textContent = displayId;
    document.getElementById('modal-order-date').textContent = order.date;
    const user = (order.orderData && order.orderData.user) ? order.orderData.user : {};
    const customerName = user.name || user.username || user.email || order.customer || 'Customer';
    document.getElementById('modal-customer-name').textContent = customerName;
    document.getElementById('modal-customer-phone').textContent = (order.orderData && order.orderData.phone) ? order.orderData.phone : (user.phone || 'N/A');
    document.getElementById('modal-customer-email').textContent = user.email || 'N/A';
    document.getElementById('modal-customer-address').textContent = (order.orderData && order.orderData.deliveryAddress) ? order.orderData.deliveryAddress : 'N/A';
    document.getElementById('modal-status-badge').innerHTML = getStatusBadge(order.status);
    // Prefer backend status if available, else map from displayed status
    let currentBackendStatus = (order.orderData && order.orderData.status) ? order.orderData.status : undefined;
    if (!currentBackendStatus) {
        if (order.status === 'processing') currentBackendStatus = 'preparing';
        else if (order.status === 'completed') currentBackendStatus = 'delivered';
        else currentBackendStatus = order.status;
    }
    document.getElementById('modal-status-badge').setAttribute('data-current-status', currentBackendStatus);

    // Configure single advance button label based on current status
    const s = currentBackendStatus;
    const advanceBtn = document.getElementById('btnAdvance');
    if (advanceBtn) {
        let label = 'Next';
        let variantClass = 'btn-primary';
        if (s === 'pending') { label = 'Prepare Order'; variantClass = 'btn-warning'; }
        else if (s === 'preparing') { label = 'Deliver Order'; variantClass = 'btn-primary'; }
        else if (s === 'out-for-delivery') { label = 'Complete'; variantClass = 'btn-success'; }
        else if (s === 'delivered' || s === 'cancelled') { label = 'No further action'; variantClass = 'btn-secondary'; }
        advanceBtn.textContent = label;
        advanceBtn.className = `btn btn-sm ${variantClass}`;
        advanceBtn.disabled = (s === 'delivered' || s === 'cancelled');
    }
    
    // Display items from order data
    const itemsTable = document.getElementById('modal-items-table');
    itemsTable.innerHTML = '';
    
    if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
        const row = document.createElement('tr');
            const name = item.menuItem?.name || item.name || 'Unknown Item';
            const qty = item.quantity || 1;
            const price = item.price || 0;
        row.innerHTML = `
                <td><small>${name}</small></td>
                <td><small>${qty}</small></td>
                <td><small>$${price.toFixed(2)}</small></td>
                <td><small>$${(qty * price).toFixed(2)}</small></td>
        `;
        itemsTable.appendChild(row);
    });
    }
    
    document.getElementById('modal-total').textContent = order.total;
    
    // Show modal
    const myModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    myModal.show();
}

// Change order status
async function changeOrderStatus() {
    const currentStatus = document.getElementById('modal-status-badge').getAttribute('data-current-status');
    const newStatus = prompt(`Current status: ${currentStatus}\n\nEnter new status:\n- pending\n- preparing\n- out-for-delivery\n- completed\n- failed/cancelled`);
    
    if (!newStatus) return;
    
    // Map entered status to backend status
    const statusMap = {
        'pending': 'pending',
        'preparing': 'preparing',
        'out-for-delivery': 'out-for-delivery',
        'completed': 'delivered',
        'failed': 'cancelled',
        'failed/cancelled': 'cancelled',
        'cancelled': 'cancelled',
    };
    
    const backendStatus = statusMap[newStatus.toLowerCase()] || newStatus.toLowerCase();
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(backendStatus)) {
        alert(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
        return;
    }
    
    try {
        if (window.api) {
            await window.api.apiRequest(`/api/orders/${currentOrderId}/status`, {
                method: 'PUT',
                body: { status: backendStatus },
                auth: true,
            });
            
            // Update modal display
            const frontendStatus = Object.entries(statusMap).find(([k, v]) => v === backendStatus)?.[0] || backendStatus;
            document.getElementById('modal-status-badge').innerHTML = getStatusBadge(frontendStatus);
            document.getElementById('modal-status-badge').setAttribute('data-current-status', frontendStatus);
            
            // Reload the table
            await loadOrderManagement(currentOrderFilter);
            
            // Close modal
            const myModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
            myModal.hide();
        }
    } catch (err) {
        console.error('Failed to update order status:', err);
        alert('Failed to update order status: ' + (err.message || 'Unknown error'));
    }
}

// Set order status via buttons
async function setOrderStatus(targetStatus) {
    try {
        if (!window.api) return;
        const labels = {
            'pending': 'Pending',
            'preparing': 'Preparing',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Completed',
            'cancelled': 'Cancelled',
        };
        const display = labels[targetStatus] || targetStatus;
        const result = await Swal.fire({
            title: 'Confirm status change',
            text: `Change order status to "${display}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, change it',
            cancelButtonText: 'No',
        });
        if (!result.isConfirmed) return;

        const backendStatus = targetStatus; // already mapped to backend values from button
        await window.api.apiRequest(`/api/orders/${currentOrderId}/status`, {
            method: 'PUT',
            body: { status: backendStatus },
            auth: true,
        });
        await loadOrderManagement(currentOrderFilter);
        const myModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        if (myModal) myModal.hide();
        await Swal.fire({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false });
    } catch (err) {
        console.error('Failed to set order status:', err);
        Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || 'Unknown error' });
    }
}

async function advanceOrderStatus() {
    try {
        const s = document.getElementById('modal-status-badge').getAttribute('data-current-status');
        let next;
        let display;
        if (s === 'pending') { next = 'preparing'; display = 'Prepare Order'; }
        else if (s === 'preparing') { next = 'out-for-delivery'; display = 'Deliver Order'; }
        else if (s === 'out-for-delivery') { next = 'delivered'; display = 'Complete'; }
        else return; // delivered or cancelled - no further action

        // confirm with SweetAlert
        const result = await Swal.fire({
            title: 'Confirm status change',
            text: `Change order status to "${display}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
        });
        if (!result.isConfirmed) return;

        // call API
        await window.api.apiRequest(`/api/orders/${currentOrderId}/status`, {
            method: 'PUT',
            body: { status: next },
            auth: true,
        });
        await loadOrderManagement(currentOrderFilter);
        const myModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        if (myModal) myModal.hide();
        await Swal.fire({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false });
    } catch (err) {
        console.error('Failed to advance status:', err);
        Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || 'Unknown error' });
    }
}

async function openStatusPicker() {
    try {
        const labels = {
            'pending': 'Pending',
            'preparing': 'Preparing',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Completed',
            'cancelled': 'Cancelled',
        };
        const inputOptions = {
            'pending': labels['pending'],
            'preparing': labels['preparing'],
            'out-for-delivery': labels['out-for-delivery'],
            'delivered': labels['delivered'],
            'cancelled': labels['cancelled'],
        };
        const current = document.getElementById('modal-status-badge').getAttribute('data-current-status');
        const { value: status } = await Swal.fire({
            title: 'Update Order Status',
            input: 'select',
            inputOptions,
            inputValue: current,
            inputPlaceholder: 'Select status',
            showCancelButton: true,
            confirmButtonText: 'Update',
        });
        if (!status) return;
        await setOrderStatus(status);
    } catch (err) {
        console.error('Status picker error:', err);
    }
}

// Print order receipt
function printOrder() {
    window.print();
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

