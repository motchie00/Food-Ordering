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
    event.target.classList.toggle('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
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

function showEditForm(itemName, description, price, category) {
    // Populate edit form with item details
    document.getElementById('edit-menu-name').value = itemName;
    document.getElementById('edit-menu-description').value = description;
    document.getElementById('edit-menu-price').value = price;
    document.getElementById('edit-menu-category').value = category;

    // Show the edit content section
    showContent('editMenuItem');
}

function deleteMenuItem(itemName) {
    if (confirm('Are you sure you want to delete "' + itemName + '"?')) {
        alert('Item "' + itemName + '" has been deleted. (This is a demo - integrate with backend for real deletion.)');
        // Here you would add AJAX to delete from backend
        showContent('menuList');
    }
}

function deleteMenuItemFromEdit() {
    const itemName = document.getElementById('edit-menu-name').value;
    
    if (confirm('Are you sure you want to delete "' + itemName + '"?')) {
        alert('Item "' + itemName + '" has been deleted. (This is a demo - integrate with backend for real deletion.)');
        // Here you would add AJAX to delete from backend
        showContent('menuList');
    }
}

function updateMenuItemFromForm() {
    const itemName = document.getElementById('edit-menu-name').value;
    const description = document.getElementById('edit-menu-description').value;
    const price = document.getElementById('edit-menu-price').value;
    const category = document.getElementById('edit-menu-category').value;
    
    if (!itemName || !description || !price || !category) {
        alert('Please fill in all required fields.');
        return;
    }

    alert('Item "' + itemName + '" has been updated. (This is a demo - integrate with backend for real update.)');
    
    // Navigate back to menu list
    showContent('menuList');
    
    // Here you would add AJAX to update the item in backend
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Any initialization code here
});

