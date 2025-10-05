document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const orderModal = document.getElementById('orderModal');
    const closeModal = document.getElementById('closeModal');
    const cancelOrder = document.getElementById('cancelOrder');
    const orderForm = document.getElementById('orderForm');
    const customerName = document.getElementById('customerName');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');
    const address = document.getElementById('address');
    const supplierSelect = document.getElementById('supplier');
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const addProductBtn = document.getElementById('addProduct');
    const cartItemsContainer = document.getElementById('cartItems');
    const formStatus = document.getElementById('formStatus');
    
    // Error elements
    const customerNameError = document.getElementById('customerNameError');
    const phoneError = document.getElementById('phoneError');
    const emailError = document.getElementById('emailError');
    const addressError = document.getElementById('addressError');
    const supplierError = document.getElementById('supplierError');
    const productError = document.getElementById('productError');
    const quantityError = document.getElementById('quantityError');

    // Open order modal
    function openOrderModal() {
        fetchProducts();
        fetchSuppliers();
        orderModal.classList.remove('hidden');
    }

    // Close order modal
    function closeOrderModal() {
        orderModal.classList.add('hidden');
        resetForm();
    }

    // Fetch products from backend
    async function fetchProducts() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            const response = await fetch(`${baseUrl}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách sản phẩm');
            }
            
            const products = await response.json();
            productSelect.innerHTML = '<option value="">Chọn sản phẩm</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - ${product.price.toLocaleString('vi-VN')} ₫`;
                productSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            showFormStatus('Lỗi kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        }
    }

    // Fetch suppliers from backend
    async function fetchSuppliers() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            const response = await fetch(`${baseUrl}/suppliers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách nhà cung cấp');
            }
            
            const suppliers = await response.json();
            supplierSelect.innerHTML = '<option value="">Chọn nhà cung cấp</option>';
            
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                supplierSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Lỗi khi tải nhà cung cấp:', error);
            showFormStatus('Lỗi kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        }
    }
// Load suppliers for filter
async function loadSuppliersForFilter() {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        const response = await fetch(`${baseUrl}/suppliers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách nhà cung cấp');
        }
        
        const suppliers = await response.json();
        const supplierFilter = document.getElementById('supplierFilter');
        if (supplierFilter) {
            supplierFilter.innerHTML = '<option value="all">Tất cả NCC</option>';
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                supplierFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải nhà cung cấp cho filter:', error);
    }
}

    // Reset form fields
    function resetForm() {
        customerName.value = '';
        phone.value = '';
        email.value = '';
        address.value = '';
        supplierSelect.value = '';
        productSelect.value = '';
        quantityInput.value = '';
        cartItemsContainer.innerHTML = '';
        hideAllErrors();
    }

    // Hide all error messages
    function hideAllErrors() {
        customerNameError.classList.add('hidden');
        phoneError.classList.add('hidden');
        emailError.classList.add('hidden');
        addressError.classList.add('hidden');
        supplierError.classList.add('hidden');
        productError.classList.add('hidden');
        quantityError.classList.add('hidden');
    }

    // Show form status message
    function showFormStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = 'mt-4 p-3 rounded-md';
        if (type === 'success') {
            formStatus.classList.add('bg-green-100', 'text-green-700');
        } else {
            formStatus.classList.add('bg-red-100', 'text-red-700');
        }
        formStatus.classList.remove('hidden');
    }

    // Hide form status
    function hideFormStatus() {
        formStatus.classList.add('hidden');
    }

    // Validate customer name (optional)
    function validateCustomerName() {
        const value = customerName.value.trim();
        if (value && !value) { // Only validate if filled
            customerNameError.textContent = 'Vui lòng nhập tên khách hàng';
            customerNameError.classList.remove('hidden');
            return false;
        }
        customerNameError.classList.add('hidden');
        return true;
    }

    // Validate phone number
    function validatePhone() {
        const value = phone.value.trim();
        const phoneRegex = /^0[3-9]\d{8}$/;
        if (!value) {
            phoneError.textContent = 'Vui lòng nhập số điện thoại';
            phoneError.classList.remove('hidden');
            return false;
        }
        if (!phoneRegex.test(value)) {
            phoneError.textContent = 'Số điện thoại không hợp lệ (ví dụ: 0912345678)';
            phoneError.classList.remove('hidden');
            return false;
        }
        phoneError.classList.add('hidden');
        return true;
    }

    // Validate email
    function validateEmail() {
        const value = email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            emailError.textContent = 'Vui lòng nhập email';
            emailError.classList.remove('hidden');
            return false;
        }
        if (!emailRegex.test(value)) {
            emailError.textContent = 'Email không hợp lệ';
            emailError.classList.remove('hidden');
            return false;
        }
        emailError.classList.add('hidden');
        return true;
    }

    // Validate address
    function validateAddress() {
        const value = address.value.trim();
        if (!value) {
            addressError.textContent = 'Vui lòng nhập địa chỉ';
            addressError.classList.remove('hidden');
            return false;
        }
        addressError.classList.add('hidden');
        return true;
    }

    // Validate supplier
    function validateSupplier() {
        if (supplierSelect.value === '') {
            supplierError.textContent = 'Vui lòng chọn nhà cung cấp';
            supplierError.classList.remove('hidden');
            return false;
        }
        supplierError.classList.add('hidden');
        return true;
    }

    // Validate product selection
    function validateProduct() {
        if (productSelect.value === '') {
            productError.textContent = 'Vui lòng chọn sản phẩm';
            productError.classList.remove('hidden');
            return false;
        }
        productError.classList.add('hidden');
        return true;
    }

    // Validate quantity
    function validateQuantity() {
        const value = quantityInput.value.trim();
        if (!value || isNaN(value) || parseInt(value) < 1) {
            quantityError.textContent = 'Số lượng phải là số nguyên lớn hơn 0';
            quantityError.classList.remove('hidden');
            return false;
        }
        quantityError.classList.add('hidden');
        return true;
    }

    // Add product to cart
    function addToCart() {
        if (!validateProduct() || !validateQuantity()) {
            return;
        }
        
        const productId = productSelect.value;
        const productOption = productSelect.options[productSelect.selectedIndex];
        const productName = productOption.textContent.split(' - ')[0];
        const quantity = parseInt(quantityInput.value);
        
        // Create cart item element
        const cartItem = document.createElement('div');
        cartItem.className = 'flex justify-between items-center p-2 bg-gray-50 rounded-md';
        cartItem.dataset.productId = productId; // Store product ID
        
        const productNameSpan = document.createElement('span');
        productNameSpan.textContent = `${productName} x ${quantity}`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'text-red-500 hover:text-red-700';
        removeButton.innerHTML = '<i data-feather="x" class="h-4 w-4"></i>';
        removeButton.addEventListener('click', () => {
            cartItem.remove();
        });
        
        cartItem.appendChild(productNameSpan);
        cartItem.appendChild(removeButton);
        cartItemsContainer.appendChild(cartItem);
        
        feather.replace();
        quantityInput.value = '';
        productSelect.value = '';
    }

    // Load orders from backend
    async function loadOrders() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            const response = await fetch(`${baseUrl}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng');
            }
            
            const orders = await response.json();
            const tbody = document.getElementById('orders-table-body');
            tbody.innerHTML = '';
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.created_by || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.supplier_name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total_amount.toLocaleString('vi-VN')} ₫</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2">Xem</button>
                        <button class="text-indigo-600 hover:text-indigo-900">Sửa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            updateStats(orders);
        } catch (error) {
            console.error('Lỗi khi tải đơn hàng:', error);
        }
    }

    // Get status class
    function getStatusClass(status) {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'shipping': return 'bg-purple-100 text-purple-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Get status text
    function getStatusText(status) {
        const texts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            shipping: 'Đang giao',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return texts[status] || status;
    }

    // Update stats
    function updateStats(orders) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyOrdersList = orders.filter(o => new Date(o.created_at) >= monthStart);
        
        document.getElementById('monthlyOrders').textContent = monthlyOrdersList.length;
        
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        document.getElementById('pendingCount').textContent = pendingCount;
        
        const monthlyTotal = monthlyOrdersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        document.getElementById('totalValue').textContent = (monthlyTotal / 1000000000).toFixed(1) + 'B ₫';
        
        fetchSuppliersCount();
    }

    // Fetch suppliers count
    async function fetchSuppliersCount() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/suppliers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const suppliers = await response.json();
            document.getElementById('suppliersCount').textContent = suppliers.length;
        } catch (error) {
            console.error('Error fetching suppliers count:', error);
            document.getElementById('suppliersCount').textContent = '0';
        }
    }

    // Load top suppliers
    async function loadTopSuppliers() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/suppliers/top`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const suppliers = await response.json();
            const grid = document.getElementById('topSuppliersGrid');
            grid.innerHTML = '';
            
            suppliers.forEach(supplier => {
                const card = document.createElement('div');
                card.className = 'supplier-card border rounded-lg p-4 hover:shadow-md transition-shadow';
                card.innerHTML = `
                    <div class="flex items-center mb-3">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <i data-feather="building" class="text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold">${supplier.name}</h4>
                            <p class="text-sm text-gray-500">${supplier.contact_person || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-500">Đơn hàng</p>
                            <p class="font-semibold">${supplier.order_count}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Tổng giá trị</p>
                            <p class="font-semibold">${(supplier.total_value / 1000000).toFixed(0)}M ₫</p>
                        </div>
                    </div>
                    <div class="mt-3 pt-3 border-t">
                        <div class="flex items-center justify-between">
                            <span class="status-badge bg-green-100 text-green-800">Tin cậy</span>
                            <div class="flex space-x-2">
                                <button class="text-blue-600 hover:text-blue-800">
                                    <i data-feather="phone" class="h-4 w-4"></i>
                                </button>
                                <button class="text-green-600 hover:text-green-800">
                                    <i data-feather="mail" class="h-4 w-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            feather.replace();
        } catch (error) {
            console.error('Error loading top suppliers:', error);
        }
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        hideFormStatus();
        hideAllErrors();
        
        // Validate required fields (supplier and cart)
        const isValid = validateSupplier() && cartItemsContainer.children.length > 0;
        
        if (!isValid) {
            return;
        }
        
        // Prepare cart items data
        const cartItems = [];
        cartItemsContainer.querySelectorAll('div[data-product-id]').forEach(item => {
            const text = item.querySelector('span').textContent;
            const [_, qty] = text.split(' x ');
            const productId = item.dataset.productId;
            cartItems.push({ productId, quantity: parseInt(qty) });
        });
        
        // Get token
        const token = localStorage.getItem('token');
        const supplierId = supplierSelect.value;
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        // Show loading state
        submitOrder.disabled = true;
        submitOrder.innerHTML = '<span class="flex items-center"><i data-feather="loader" class="h-4 w-4 mr-2"></i> Đang tạo đơn hàng...</span>';
        
        try {
            const baseUrl = `http://localhost:3000`;
            const response = await fetch(`${baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ supplierId, items: cartItems })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Tạo đơn hàng thất bại');
            }
            
            showFormStatus('Tạo đơn hàng thành công!', 'success');
            resetForm();
            closeOrderModal();
            loadOrders(); // Reload orders after creation
        } catch (error) {
            console.error('Lỗi khi tạo đơn hàng:', error);
            showFormStatus(error.message, 'error');
        } finally {
            submitOrder.disabled = false;
            submitOrder.innerHTML = 'Tạo đơn hàng';
            feather.replace();
        }
    }

    // Event listeners
    document.querySelector('.bg-blue-600.text-white.px-4.py-2.rounded-lg.hover\\:bg-blue-700.flex.items-center').addEventListener('click', openOrderModal);
    closeModal.addEventListener('click', closeOrderModal);
    cancelOrder.addEventListener('click', closeOrderModal);
    addProductBtn.addEventListener('click', addToCart);
    orderForm.addEventListener('submit', handleFormSubmit);
    
    // Load initial data
    loadSuppliersForFilter();
    loadOrders();
    loadTopSuppliers();
    
    // Initialize feather icons
    feather.replace();
});
