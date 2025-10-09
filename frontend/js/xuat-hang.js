document.addEventListener('DOMContentLoaded', () => {
    const salesOrderModal = document.getElementById('salesOrderModal');
    const closeModal = document.getElementById('closeModal');
    const cancelOrder = document.getElementById('cancelOrder');
    const salesOrderForm = document.getElementById('salesOrderForm');
    const customerName = document.getElementById('customerName');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');
    const address = document.getElementById('address');
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const addProductBtn = document.getElementById('addProduct');
    const cartItemsContainer = document.getElementById('cartItems');
    const salesOrderIdInput = document.getElementById('salesOrderId');
    const submitOrder = document.getElementById('submitOrder');

    // Error elements (add to HTML if needed)
    let customerNameError, phoneError, emailError, addressError, productError, quantityError;

    function openSalesOrderModal(order = null) {
        fetchProducts();
        if (order) {
            salesOrderIdInput.value = order.id;
            customerName.value = order.customer_name;
            phone.value = order.phone;
            email.value = order.email;
            address.value = order.address;

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

            submitOrder.textContent = 'Cập nhật đơn hàng';
        } else {
            salesOrderIdInput.value = '';
            submitOrder.textContent = 'Tạo đơn hàng';
        }
        salesOrderModal.classList.remove('hidden');
    }

    function closeSalesOrderModal() {
        salesOrderModal.classList.add('hidden');
        resetForm();
    }

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
        }
    }

    function resetForm() {
        salesOrderForm.reset();
        cartItemsContainer.innerHTML = '';
    }

    // Validation functions
    function validateCustomerName() {
        const value = customerName.value.trim();
        if (!value) {
            if (customerNameError) customerNameError.textContent = 'Vui lòng nhập tên khách hàng';
            if (customerNameError) customerNameError.classList.remove('hidden');
            return false;
        }
        if (customerNameError) customerNameError.classList.add('hidden');
        return true;
    }

    function validatePhone() {
        const value = phone.value.trim();
        const phoneRegex = /^0[3-9]\d{8}$/;
        if (!value) {
            if (phoneError) phoneError.textContent = 'Vui lòng nhập số điện thoại';
            if (phoneError) phoneError.classList.remove('hidden');
            return false;
        }
        if (!phoneRegex.test(value)) {
            if (phoneError) phoneError.textContent = 'Số điện thoại không hợp lệ (ví dụ: 0912345678)';
            if (phoneError) phoneError.classList.remove('hidden');
            return false;
        }
        if (phoneError) phoneError.classList.add('hidden');
        return true;
    }

    function validateEmail() {
        const value = email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            if (emailError) emailError.textContent = 'Vui lòng nhập email';
            if (emailError) emailError.classList.remove('hidden');
            return false;
        }
        if (!emailRegex.test(value)) {
            if (emailError) emailError.textContent = 'Email không hợp lệ';
            if (emailError) emailError.classList.remove('hidden');
            return false;
        }
        if (emailError) emailError.classList.add('hidden');
        return true;
    }

    function validateAddress() {
        const value = address.value.trim();
        if (!value) {
            if (addressError) addressError.textContent = 'Vui lòng nhập địa chỉ';
            if (addressError) addressError.classList.remove('hidden');
            return false;
        }
        if (addressError) addressError.classList.add('hidden');
        return true;
    }

    function validateProduct() {
        if (productSelect.value === '') {
            if (productError) productError.textContent = 'Vui lòng chọn sản phẩm';
            if (productError) productError.classList.remove('hidden');
            return false;
        }
        if (productError) productError.classList.add('hidden');
        return true;
    }

    function validateQuantity() {
        const value = quantityInput.value.trim();
        if (!value || isNaN(value) || parseInt(value) < 1) {
            if (quantityError) quantityError.textContent = 'Số lượng phải là số nguyên lớn hơn 0';
            if (quantityError) quantityError.classList.remove('hidden');
            return false;
        }
        if (quantityError) quantityError.classList.add('hidden');
        return true;
    }

    function addToCart() {
        if (!validateProduct() || !validateQuantity()) {
            return;
        }

        const productId = productSelect.value;
        const productOption = productSelect.options[productSelect.selectedIndex];
        const productName = productOption.textContent.split(' - ')[0];
        const quantity = parseInt(quantityInput.value);

        const cartItem = document.createElement('div');
        cartItem.className = 'flex justify-between items-center p-2 bg-gray-50 rounded-md';
        cartItem.dataset.productId = productId;

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

    async function loadSalesOrders() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            // Get filter values
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            const statusFilter = document.getElementById('statusFilter').value;

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (statusFilter && statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            const response = await fetch(`${baseUrl}/sales-orders?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn xuất hàng');
            }

            const orders = await response.json();
            const tbody = document.getElementById('sales-orders-table-body');
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
                        <button class="text-indigo-600 hover:text-indigo-900 mr-2 view-order-btn" data-id="${order.id}">Xem</button>
                        <button class="text-indigo-600 hover:text-indigo-900 edit-order-btn" data-id="${order.id}">Sửa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            updateSalesStats(orders);
        } catch (error) {
            console.error('Lỗi khi tải đơn xuất hàng:', error);
        }
    }

    function updateSalesStats(orders) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyOrders = orders.filter(o => new Date(o.created_at) >= monthStart);

        document.getElementById('monthlySalesOrders').textContent = monthlyOrders.length;

        const pendingCount = orders.filter(o => o.status === 'pending').length;
        document.getElementById('pendingSalesCount').textContent = pendingCount;

        const monthlyTotal = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        document.getElementById('totalSalesValue').textContent = (monthlyTotal / 1000000000).toFixed(1) + 'B ₫';

        fetchCustomersCount();
    }

    async function fetchCustomersCount() {
        // For now, count unique customers from orders
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/sales-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const orders = await response.json();
            const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
            document.getElementById('customersCount').textContent = uniqueCustomers;
        } catch (error) {
            console.error('Error fetching customers count:', error);
            document.getElementById('customersCount').textContent = '0';
        }
    }

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

    async function handleFormSubmit(event) {
        event.preventDefault();

        // Validate required fields
        const isValid = validateCustomerName() && validatePhone() && validateEmail() && validateAddress() && cartItemsContainer.children.length > 0;

        if (!isValid) {
            return;
        }

        const cartItems = [];
        cartItemsContainer.querySelectorAll('div[data-product-id]').forEach(item => {
            const text = item.querySelector('span').textContent;
            const [_, qty] = text.split(' x ');
            const productId = item.dataset.productId;
            cartItems.push({ productId, quantity: parseInt(qty) });
        });

        const token = localStorage.getItem('token');
        const salesOrderId = salesOrderIdInput.value;

        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        submitOrder.disabled = true;
        submitOrder.innerHTML = '<span class="flex items-center"><i data-feather="loader" class="h-4 w-4 mr-2"></i> Đang xử lý...</span>';

        try {
            const baseUrl = `http://localhost:3000`;
            const url = salesOrderId ? `${baseUrl}/sales-orders/${salesOrderId}` : `${baseUrl}/sales-orders`;
            const method = salesOrderId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerName: customerName.value,
                    phone: phone.value,
                    email: email.value,
                    address: address.value,
                    items: cartItems
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Thao tác thất bại');
            }

            closeSalesOrderModal();
            loadSalesOrders();
        } catch (error) {
            console.error('Lỗi khi xử lý đơn hàng:', error);
            alert(error.message);
        } finally {
            submitOrder.disabled = false;
            submitOrder.innerHTML = salesOrderId ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng';
            feather.replace();
        }
    }

    const openModalBtn = document.getElementById('openModalBtn');
    const filterBtn = document.getElementById('filterBtn');
    const exportBtn = document.getElementById('exportBtn');
    const printBtn = document.getElementById('printBtn');

    openModalBtn.addEventListener('click', () => openSalesOrderModal());
    closeModal.addEventListener('click', closeSalesOrderModal);
    cancelOrder.addEventListener('click', closeSalesOrderModal);
    addProductBtn.addEventListener('click', addToCart);
    salesOrderForm.addEventListener('submit', handleFormSubmit);

    // Filter event listeners
    const filterInputs = document.querySelectorAll('#startDate, #endDate, #statusFilter');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            loadSalesOrders();
        });
    });

    // Action buttons
    filterBtn.addEventListener('click', () => {
        // Toggle advanced filters if needed
        alert('Bộ lọc nâng cao đang được phát triển');
    });

    exportBtn.addEventListener('click', () => {
        exportSalesOrdersToCSV();
    });

    printBtn.addEventListener('click', () => {
        printSalesOrdersTable();
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.dataset.id;
            viewOrderDetails(orderId);
        } else if (e.target.classList.contains('edit-order-btn')) {
            const orderId = e.target.dataset.id;
            editOrder(orderId);
        }
    });

    async function editOrder(orderId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/sales-orders/${orderId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch order details');

            const order = await response.json();

            openSalesOrderModal(order);
        } catch (error) {
            console.error('Error editing order:', error);
            alert('Lỗi tải đơn hàng để chỉnh sửa');
        }
    }

    async function viewOrderDetails(orderId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/sales-orders/${orderId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch order details');

            const order = await response.json();

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="border-b px-6 py-4 flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Chi tiết đơn hàng #${order.id}</h3>
                        <button id="closeDetailModal" class="text-gray-500 hover:text-gray-700">
                            <i data-feather="x"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 class="font-semibold mb-3">Thông tin đơn hàng</h4>
                                <div class="space-y-2">
                                    <p><span class="font-medium">Mã đơn:</span> ${order.id}</p>
                                    <p><span class="font-medium">Khách hàng:</span> ${order.customer_name}</p>
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

            modal.querySelector('#closeDetailModal').addEventListener('click', () => {
                modal.remove();
            });

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

    // Export sales orders to CSV
    async function exportSalesOrdersToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/sales-orders/export`, { headers });
            if (!response.ok) throw new Error('Failed to export sales orders');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sales-orders.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất dữ liệu đơn xuất hàng thành công');
        } catch (error) {
            console.error('Error exporting sales orders:', error);
            alert('Lỗi xuất dữ liệu đơn xuất hàng');
        }
    }

    // Print sales orders table
    function printSalesOrdersTable() {
        const printWindow = window.open('', '_blank');
        const tableHTML = document.querySelector('table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Danh sách đơn xuất hàng</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Danh sách đơn xuất hàng</h1>
                    ${tableHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    loadSalesOrders();

    feather.replace();
});