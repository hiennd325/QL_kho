document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const orderModal = document.getElementById('orderModal');
    const closeModal = document.getElementById('closeModal');
    const cancelOrder = document.getElementById('cancelOrder');
    const orderForm = document.getElementById('orderForm');
    const supplierSelect = document.getElementById('supplier');
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const addProductBtn = document.getElementById('addProduct');
    const cartItemsContainer = document.getElementById('cartItems');
    const formStatus = document.getElementById('formStatus');
    
    // Error elements
    const supplierError = document.getElementById('supplierError');
    const productError = document.getElementById('productError');
    const quantityError = document.getElementById('quantityError');

    const orderIdInput = document.getElementById('orderId');

    // Open order modal
    function openOrderModal(order = null) {
        fetchProducts();
        fetchSuppliers();
        if (order) {
            orderIdInput.value = order.id;
            supplierSelect.value = order.supplier_id;

            cartItemsContainer.innerHTML = '';
            order.items.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'flex justify-between items-center p-2 bg-gray-50 rounded-md';
                cartItem.dataset.productId = item.product_id;
                
                const productNameSpan = document.createElement('span');
                productNameSpan.textContent = `${item.product_name} x ${item.quantity}`;
                
                const removeButton = document.createElement('button');
                removeButton.className = 'text-red-500 hover:text-red-700';
                removeButton.innerHTML = '<i data-feather="x" class="h-4 w-4"></i>';
                removeButton.addEventListener('click', () => {
                    cartItem.remove();
                });
                
                cartItem.appendChild(productNameSpan);
                cartItem.appendChild(removeButton);
                cartItemsContainer.appendChild(cartItem);
            });
            feather.replace();

            document.getElementById('submitOrder').textContent = 'Cập nhật đơn hàng';
        } else {
            orderIdInput.value = '';
            document.getElementById('submitOrder').textContent = 'Tạo đơn hàng';
        }
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
        supplierSelect.value = '';
        productSelect.value = '';
        quantityInput.value = '';
        cartItemsContainer.innerHTML = '';
        hideAllErrors();
    }

    // Hide all error messages
    function hideAllErrors() {
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

    // Load orders from backend with filters
    async function loadOrders() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            // Get filter values
            const startDate = document.querySelector('input[type="date"]:first-of-type')?.value;
            const endDate = document.querySelector('input[type="date"]:nth-of-type(2)')?.value;
            const statusFilter = document.getElementById('statusFilter').value;
            const supplierFilter = document.getElementById('supplierFilter')?.value;

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (statusFilter && statusFilter !== 'Tất cả trạng thái') {
                const statusMap = {
                    'Chờ xác nhận': 'pending',
                    'Đã xác nhận': 'confirmed',
                    'Đang giao': 'shipping',
                    'Hoàn thành': 'completed',
                    'Đã hủy': 'cancelled'
                };
                queryParams.append('status', statusMap[statusFilter]);
            }
            if (supplierFilter && supplierFilter !== 'all') {
                queryParams.append('supplierId', supplierFilter);
            }

            const response = await fetch(`${baseUrl}/orders?${queryParams.toString()}`, {
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
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 view-order-btn" data-id="${order.id}">Xem</button>
                        <button class="text-indigo-600 hover:text-indigo-900 edit-order-btn" data-id="${order.id}">Sửa</button>
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
        const orderId = orderIdInput.value;
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        // Show loading state
        submitOrder.disabled = true;
        submitOrder.innerHTML = '<span class="flex items-center"><i data-feather="loader" class="h-4 w-4 mr-2"></i> Đang xử lý...</span>';
        
        try {
            const baseUrl = `http://localhost:3000`;
            const url = orderId ? `${baseUrl}/orders/${orderId}` : `${baseUrl}/orders`;
            const method = orderId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ supplierId, items: cartItems })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Thao tác thất bại');
            }
            
            showFormStatus(orderId ? 'Cập nhật đơn hàng thành công!' : 'Tạo đơn hàng thành công!', 'success');
            resetForm();
            closeOrderModal();
            loadOrders(); // Reload orders after creation/update
        } catch (error) {
            console.error('Lỗi khi xử lý đơn hàng:', error);
            showFormStatus(error.message, 'error');
        } finally {
            submitOrder.disabled = false;
            submitOrder.innerHTML = orderId ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng';
            feather.replace();
        }
    }

    // Event listeners
    const openModalBtn = document.getElementById('openModalBtn');

    openModalBtn.addEventListener('click', openOrderModal);
    closeModal.addEventListener('click', closeOrderModal);
    cancelOrder.addEventListener('click', closeOrderModal);
    addProductBtn.addEventListener('click', addToCart);
    orderForm.addEventListener('submit', handleFormSubmit);

    // Event listeners for table action buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.dataset.id;
            viewOrderDetails(orderId);
        } else if (e.target.classList.contains('edit-order-btn')) {
            const orderId = e.target.dataset.id;
            editOrder(orderId);
        }
    });
    
    // Add event listeners for filter inputs and buttons
    const filterInputs = document.querySelectorAll('input[type="date"], select');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            loadOrders(); // Reload orders with filters
        });
    });

    // Add event listeners for action buttons
    const actionButtons = document.querySelectorAll('.p-2.border.rounded-lg.hover\\:bg-gray-50');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const icon = button.querySelector('i');
            if (icon) {
                const iconName = icon.getAttribute('data-feather');
                switch(iconName) {
                    case 'filter':
                        // Toggle advanced filters
                        const filterSection = document.querySelector('.flex.flex-wrap.items-center.gap-4');
                        if (filterSection) {
                            filterSection.classList.toggle('hidden');
                        }
                        break;
                    case 'download':
                        // Export orders to CSV
                        exportOrdersToCSV();
                        break;
                    case 'printer':
                        // Print orders table
                        printOrdersTable();
                        break;
                }
            }
        });
    });

    // Export orders to CSV
    async function exportOrdersToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/orders/export`, { headers });
            if (!response.ok) throw new Error('Failed to export orders');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất dữ liệu đơn hàng thành công');
        } catch (error) {
            console.error('Error exporting orders:', error);
            alert('Lỗi xuất dữ liệu đơn hàng');
        }
    }

    // Print orders table
    function printOrdersTable() {
        const printWindow = window.open('', '_blank');
        const tableHTML = document.querySelector('table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Danh sách đơn hàng</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Danh sách đơn hàng</h1>
                    ${tableHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    // Load initial data
    loadSuppliersForFilter();
    loadOrders();
    loadTopSuppliers();

    // View order details
    async function viewOrderDetails(orderId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/orders/${orderId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch order details');

            const order = await response.json();

            // Create detail modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="border-b px-6 py-4 flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Chi tiết đơn hàng #${order.id}</h3>
                        <div>
                            ${order.status === 'pending' ? '<button id="receiveOrderBtn" class="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg mr-2">Nhận hàng</button>' : ''}
                            <button id="closeDetailModal" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 class="font-semibold mb-3">Thông tin đơn hàng</h4>
                                <div class="space-y-2">
                                    <p><span class="font-medium">Mã đơn:</span> ${order.id}</p>
                                    <p><span class="font-medium">Nhà cung cấp:</span> ${order.supplier_name || 'N/A'}</p>
                                    <p><span class="font-medium">Trạng thái:</span> <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                                    <p><span class="font-medium">Ngày tạo:</span> ${new Date(order.created_at).toLocaleString('vi-VN')}</p>
                                    <p><span class="font-medium">Tổng tiền:</span> ${order.total_amount?.toLocaleString('vi-VN')} ₫</p>
                                </div>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-3">Sản phẩm</h4>
                                <div id="orderProducts" class="space-y-2">
                                    ${order.items.map(product => `
                                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p class="font-medium">${product.product_name}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="font-medium">${product.quantity}</p>
                                                <p class="text-sm text-gray-500">${product.price?.toLocaleString('vi-VN')} ₫</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            feather.replace();

            // Close modal
            modal.querySelector('#closeDetailModal').addEventListener('click', () => {
                modal.remove();
            });

            if (order.status === 'pending') {
                modal.querySelector('#receiveOrderBtn').addEventListener('click', () => {
                    receiveOrder(orderId, modal);
                });
            }

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });

        } catch (error) {
            console.error('Error viewing order details:', error);
            alert('Lỗi tải chi tiết đơn hàng');
        }
    }

    // Edit order
    async function editOrder(orderId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/orders/${orderId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch order details');

            const order = await response.json();

            openOrderModal(order);
        } catch (error) {
            console.error('Error editing order:', error);
            alert('Lỗi tải đơn hàng để chỉnh sửa');
        }
    }

    async function receiveOrder(orderId, modal) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/orders/${orderId}/receive`, { 
                method: 'PUT',
                headers 
            });
            if (!response.ok) throw new Error('Failed to receive order');

            modal.remove();
            loadOrders();
            alert('Đã nhận hàng thành công');
        } catch (error) {
            console.error('Error receiving order:', error);
            alert('Lỗi nhận hàng');
        }
    }

    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-active, .text-gray-600.hover\\:text-blue-600');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('text-gray-600', 'hover:text-blue-600');
            });
            // Add active class to clicked tab
            tab.classList.add('tab-active');
            tab.classList.remove('text-gray-600', 'hover:text-blue-600');

            // Switch content based on tab
            const tabText = tab.textContent.trim();
            switch(tabText) {
                case 'Đơn hàng mua':
                    showPurchaseOrders();
                    break;
                case 'Đơn hàng bán':
                    showSalesOrders();
                    break;
                case 'Nhà cung cấp':
                    showSuppliers();
                    break;
                case 'Khách hàng':
                    showCustomers();
                    break;
            }
        });
    });

    function showPurchaseOrders() {
        // Show purchase orders content
        document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4.gap-6.mb-8').style.display = 'grid';
        document.querySelector('.bg-white.rounded-lg.shadow-md.overflow-hidden.mb-6').style.display = 'block';
        document.getElementById('topSuppliersGrid').parentElement.style.display = 'block';
        // Hide other content if any
    }

    function showSalesOrders() {
        // Similar to purchase orders but for sales
        loadSalesOrdersForTab();
    }

    function showSuppliers() {
        // Show suppliers management
        loadSuppliersManagement();
    }

    function showCustomers() {
        // Show customers management
        loadCustomersManagement();
    }

    async function loadSalesOrdersForTab() {
        // Load sales orders similar to loadOrders but for sales
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(`${baseUrl}/sales-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn bán hàng');
            }

            const orders = await response.json();
            const tbody = document.getElementById('orders-table-body');
            tbody.innerHTML = '';

            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total_amount.toLocaleString('vi-VN')} ₫</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 view-sales-order-btn" data-id="${order.id}">Xem</button>
                        <button class="text-indigo-600 hover:text-indigo-900 edit-sales-order-btn" data-id="${order.id}">Sửa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Lỗi khi tải đơn bán hàng:', error);
        }
    }

    async function loadSuppliersManagement() {
        // Load suppliers list for management
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/suppliers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const suppliers = await response.json();

            const tbody = document.getElementById('orders-table-body');
            tbody.innerHTML = '';

            suppliers.forEach(supplier => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${supplier.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.contact_person || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.email || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 edit-supplier-btn" data-id="${supplier.id}">Sửa</button>
                        <button class="text-red-600 hover:text-red-900 delete-supplier-btn" data-id="${supplier.id}">Xóa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    }

    async function loadCustomersManagement() {
        // For now, show a message as customers might be managed elsewhere
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Chức năng quản lý khách hàng đang được phát triển</td></tr>';
    }

    // Initialize feather icons
    feather.replace();
});
