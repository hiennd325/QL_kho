document.addEventListener('DOMContentLoaded', async () => {
    const tabs = document.querySelectorAll('.flex.px-6 button');
    const tabContents = {
        'Phiếu kiểm kê': document.getElementById('kiem-ke-tab'),
        'Báo cáo tồn kho': document.getElementById('bao-cao-ton-kho-tab'),
        'Báo cáo nhập/xuất': document.getElementById('bao-cao-nhap-xuat-tab'),
    };

    let currentTab = 'Phiếu kiểm kê';

    // Modal elements
    const inventoryCountModal = document.getElementById('inventoryCountModal');
    const inventoryCountForm = document.getElementById('inventoryCountForm');
    const closeInventoryCountModalEl = document.getElementById('closeInventoryCountModal');
    const cancelInventoryCountBtn = document.getElementById('cancelInventoryCountBtn');
    
    // Add Audit Item Modal
    const addAuditItemModal = document.getElementById('addAuditItemModal');
    const addAuditItemBtn = document.getElementById('addAuditItemBtn');
    const addAuditItemForm = document.getElementById('addAuditItemForm');
    const closeAddAuditItemModal = document.getElementById('closeAddAuditItemModal');
    const cancelAddAuditItemBtn = document.getElementById('cancelAddAuditItemBtn');
    
    // Audit items tracking
    let auditItems = [];
    let currentWarehouseId = '';
    let allInventory = {};

    // Button
    const createInventoryCountBtn = document.getElementById('createInventoryCountBtn');

    const setActiveTab = (tabName) => {
        currentTab = tabName;
        tabs.forEach(tab => {
            if (tab.textContent === tabName) {
                tab.classList.add('tab-active');
            } else {
                tab.classList.remove('tab-active');
            }
        });

        for (const content in tabContents) {
            if (content === tabName) {
                tabContents[content].classList.remove('hidden');
            } else {
                tabContents[content].classList.add('hidden');
            }
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.textContent);
        });
    });

    let currentPage = 1;

    async function loadAudits(page = 1) {
        currentPage = page;
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get filter values
            const startDate = document.querySelector('input[type="date"]:first-of-type')?.value;
            const endDate = document.querySelector('input[type="date"]:nth-of-type(2)')?.value;
            const warehouseFilter = document.getElementById('warehouseFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            // Build query parameters
            const queryParams = new URLSearchParams({ page, limit: 10 });
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (warehouseFilter) {
                queryParams.append('warehouse', warehouseFilter);
            }
            if (statusFilter) {
                queryParams.append('status', statusFilter);
            }

            const response = await fetch(`${baseUrl}/reports/audits?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch audits');
            const { audits, totalPages } = await response.json();

            const tableBody = document.querySelector('#kiem-ke-tab tbody');
            tableBody.innerHTML = '';
            audits.forEach(audit => {
                const row = document.createElement('tr');
                row.className = 'table-row hover:bg-gray-50';
                row.setAttribute('data-id', audit.id);

                const statusMap = {
                    pending: { text: 'Chờ xử lý', color: 'yellow' },
                    completed: { text: 'Đã cân bằng', color: 'green' },
                    cancelled: { text: 'Đã hủy', color: 'red' }
                };
                const statusInfo = statusMap[audit.status] || { text: audit.status, color: 'gray' };

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${audit.code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(audit.date).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${audit.warehouse_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${audit.created_by_username}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-${audit.discrepancy >= 0 ? 'green' : 'red'}-600">
                        ${audit.discrepancy >= 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN').format(Math.abs(audit.discrepancy))} ₫
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full">
                            ${statusInfo.text}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800 view-audit" title="Xem chi tiết"><i data-feather="eye" class="h-4 w-4"></i></button>
                            <button class="text-green-600 hover:text-green-800 download-audit" title="Tải xuống PDF"><i data-feather="download" class="h-4 w-4"></i></button>
                            <button class="text-red-600 hover:text-red-800 delete-audit" title="Xóa phiếu"><i data-feather="trash-2" class="h-4 w-4"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            feather.replace();
            renderPagination(totalPages, currentPage);
        } catch (error) {
            console.error('Error loading audits:', error);
        }
    }

    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = 'Trước';
        prevButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        if (currentPage === 1) {
            prevButton.disabled = true;
            prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        prevButton.addEventListener('click', () => loadAudits(currentPage - 1));
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerHTML = i;
            pageButton.className = 'px-3 py-1 border rounded-md text-sm font-medium';
            if (i === currentPage) {
                pageButton.classList.add('text-white', 'bg-blue-600', 'hover:bg-blue-700');
            } else {
                pageButton.classList.add('text-gray-700', 'bg-white', 'hover:bg-gray-50');
            }
            pageButton.addEventListener('click', () => loadAudits(i));
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Sau';
        nextButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        if (currentPage === totalPages) {
            nextButton.disabled = true;
            nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        nextButton.addEventListener('click', () => loadAudits(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }

    async function loadInventoryReport() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get filter values for inventory report
            const warehouseFilter = document.getElementById('warehouseFilter').value;
            const queryParams = new URLSearchParams();
            if (warehouseFilter && warehouseFilter !== 'Tất cả kho') {
                queryParams.append('warehouse', warehouseFilter);
            }

            const response = await fetch(`${baseUrl}/reports/inventory?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch inventory report');
            const inventory = await response.json();

            const tableBody = document.querySelector('#bao-cao-ton-kho-tab tbody');
            tableBody.innerHTML = '';
            inventory.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'table-row hover:bg-gray-100 cursor-pointer view-product';
                row.setAttribute('data-product-id', item.product_id);
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Intl.NumberFormat('vi-VN').format(item.price)} ₫</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Intl.NumberFormat('vi-VN').format(item.quantity * item.price)} ₫</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading inventory report:', error);
        }
    }

    // View Product Modal
    const viewProductModal = document.getElementById('viewProductModal');
    const closeViewProductModal = document.getElementById('closeViewProductModal');
    const closeViewProductModalBtn = document.getElementById('closeViewProductModalBtn');
    const inventoryReportTableBody = document.querySelector('#bao-cao-ton-kho-tab tbody');

    async function openViewProductModal(productId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/products/${productId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch product details');
            
            const product = await response.json();

            const modalBody = document.getElementById('viewProductModalBody');
            modalBody.innerHTML = `
                <p><strong>Tên sản phẩm:</strong> ${product.name}</p>
                <p><strong>Mã SP:</strong> ${product.id}</p>
                <p><strong>Mô tả:</strong> ${product.description || ''}</p>
                <p><strong>Giá:</strong> ${new Intl.NumberFormat('vi-VN').format(product.price)} ₫</p>
                <p><strong>Danh mục:</strong> ${product.category || ''}</p>
                <p><strong>Thương hiệu:</strong> ${product.brand || ''}</p>
                <p><strong>Nhà cung cấp:</strong> ${product.supplier_name || ''}</p>
                <p><strong>Tồn kho:</strong> ${product.quantity || 0}</p>
            `;

            viewProductModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading product details:', error);
            alert('Lỗi tải chi tiết sản phẩm: ' + error.message);
        }
    }

    if (viewProductModal) {
        inventoryReportTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('.view-product');
            if (row) {
                const productId = row.getAttribute('data-product-id');
                openViewProductModal(productId);
            }
        });

        const closeModal = () => viewProductModal.classList.add('hidden');
        closeViewProductModal.addEventListener('click', closeModal);
        closeViewProductModalBtn.addEventListener('click', closeModal);
        viewProductModal.addEventListener('click', (e) => {
            if (e.target === viewProductModal) {
                closeModal();
            }
        });
    }

    async function loadImportExportChart() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/inventory/transactions?page=1&limit=100`, { headers });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            const transactions = data.transactions || data;

            const monthlyData = transactions.reduce((acc, t) => {
                const month = new Date(t.transaction_date).getMonth();
                acc[month] = acc[month] || { imports: 0, exports: 0 };
                if (t.type === 'nhap') {
                    acc[month].imports += t.quantity;
                } else {
                    acc[month].exports += t.quantity;
                }
                return acc;
            }, {});

            const labels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
            const importData = Array.from({ length: 12 }, (_, i) => monthlyData[i]?.imports || 0);
            const exportData = Array.from({ length: 12 }, (_, i) => monthlyData[i]?.exports || 0);

            const ctx = document.getElementById('nhap-xuat-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Nhập', data: importData, backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 },
                        { label: 'Xuất', data: exportData, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 },
                    ]
                }
            });
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    // Audit Items Management
    function renderAuditItems() {
        const tableBody = document.getElementById('auditItemsTableBody');
        const emptyMessage = document.getElementById('emptyAuditItemsMessage');
        
        if (auditItems.length === 0) {
            tableBody.innerHTML = '';
            emptyMessage.classList.remove('hidden');
        } else {
            emptyMessage.classList.add('hidden');
            tableBody.innerHTML = auditItems.map((item, index) => `
                <tr class="border-t hover:bg-gray-50">
                    <td class="px-4 py-2 text-sm">${item.product_id}</td>
                    <td class="px-4 py-2 text-sm">${item.product_name}</td>
                    <td class="px-4 py-2 text-center text-sm">${item.system_quantity}</td>
                    <td class="px-4 py-2 text-center">
                        <input type="number" value="${item.actual_quantity}" min="0" class="w-20 px-2 py-1 border rounded text-center text-sm" onchange="updateAuditItemActualQuantity(${index}, this.value)">
                    </td>
                    <td class="px-4 py-2 text-center text-sm font-medium text-${item.discrepancy >= 0 ? 'green' : 'red'}-600">
                        ${item.discrepancy >= 0 ? '+' : ''}${item.discrepancy}
                    </td>
                    <td class="px-4 py-2 text-center">
                        <button type="button" onclick="removeAuditItem(${index})" class="text-red-600 hover:text-red-800">
                            <i data-feather="trash-2" class="h-4 w-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            feather.replace();
        }
    }

    window.updateAuditItemActualQuantity = (index, value) => {
        const actual = parseInt(value) || 0;
        auditItems[index].actual_quantity = actual;
        auditItems[index].discrepancy = auditItems[index].system_quantity - actual;
        renderAuditItems();
    };

    window.removeAuditItem = (index) => {
        auditItems.splice(index, 1);
        renderAuditItems();
    };

    // Modal functions
    function openInventoryCountModal() {
        auditItems = [];
        resetInventoryCountForm();
        renderAuditItems();
        loadWarehousesForSelect();
        generateInventoryCode();
        inventoryCountModal.classList.remove('hidden');
    }

    function closeInventoryCountModal() {
        inventoryCountModal.classList.add('hidden');
        resetInventoryCountForm();
        auditItems = [];
    }

    function resetInventoryCountForm() {
        document.getElementById('inventoryCode').value = '';
        document.getElementById('inventoryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('inventoryWarehouse').value = '';
        document.getElementById('inventoryChecker').value = '';
        document.getElementById('inventoryNotes').value = '';
    }

    function generateInventoryCode() {
        const date = new Date();
        const code = `KK${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        document.getElementById('inventoryCode').value = code;
    }

    async function loadWarehousesForSelect() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const warehouses = await response.json();
            const select = document.getElementById('inventoryWarehouse');
            select.innerHTML = '<option value="">Chọn kho</option>';

            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }

    async function loadWarehouseFilterOptions() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const warehouses = await response.json();
            const select = document.getElementById('warehouseFilter');
            
            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading warehouse filter options:', error);
        }
    }

    // Add Audit Item Logic
    async function loadProductsForSelect() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${baseUrl}/products`, { headers });
            if (!response.ok) throw new Error('Failed to fetch products');
            const products = await response.json();

            const select = document.getElementById('selectProduct');
            select.innerHTML = '<option value="">Chọn sản phẩm</option>';

            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.custom_id;
                option.textContent = `${product.custom_id} - ${product.name}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async function loadInventoryForWarehouse(warehouseId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${baseUrl}/inventory?warehouse=${warehouseId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const inventory = await response.json();

            allInventory = {};
            inventory.forEach(item => {
                allInventory[item.product_id] = {
                    quantity: item.quantity,
                    name: item.product_name
                };
            });
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    function openAddAuditItemModal() {
        currentWarehouseId = document.getElementById('inventoryWarehouse').value;
        if (!currentWarehouseId) {
            alert('Vui lòng chọn kho trước');
            return;
        }
        loadInventoryForWarehouse(currentWarehouseId);
        loadProductsForSelect();
        addAuditItemModal.classList.remove('hidden');
        resetAddAuditItemForm();
    }

    function closeAddAuditItemModal() {
        addAuditItemModal.classList.add('hidden');
        resetAddAuditItemForm();
    }

    function resetAddAuditItemForm() {
        document.getElementById('selectProduct').value = '';
        document.getElementById('systemQuantityInput').value = '';
        document.getElementById('actualQuantityInput').value = '';
    }

    async function handleAddAuditItemFormSubmit(event) {
        event.preventDefault();

        const productId = document.getElementById('selectProduct').value;
        const actualQuantity = parseInt(document.getElementById('actualQuantityInput').value) || 0;

        if (!productId) {
            alert('Vui lòng chọn sản phẩm');
            return;
        }

        const systemQuantity = allInventory[productId]?.quantity || 0;
        const productName = allInventory[productId]?.name || productId;

        // Check if product already exists in audit items
        const existingIndex = auditItems.findIndex(item => item.product_id === productId);
        if (existingIndex >= 0) {
            auditItems[existingIndex].actual_quantity = actualQuantity;
            auditItems[existingIndex].discrepancy = auditItems[existingIndex].system_quantity - actualQuantity;
        } else {
            auditItems.push({
                product_id: productId,
                product_name: productName,
                system_quantity: systemQuantity,
                actual_quantity: actualQuantity,
                discrepancy: systemQuantity - actualQuantity
            });
        }

        renderAuditItems();
        closeAddAuditItemModal();
    }

    // Handle form submission
    async function handleInventoryCountFormSubmit(event) {
        event.preventDefault();

        const formData = {
            code: document.getElementById('inventoryCode').value,
            date: document.getElementById('inventoryDate').value,
            warehouse_id: document.getElementById('inventoryWarehouse').value,
            checker: document.getElementById('inventoryChecker').value,
            notes: document.getElementById('inventoryNotes').value,
            items: auditItems
        };

        // Validate required fields
        if (!formData.date || !formData.warehouse_id || !formData.checker) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (auditItems.length === 0) {
            alert('Vui lòng thêm ít nhất một sản phẩm để kiểm kê');
            return;
        }

        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

            const response = await fetch(`${baseUrl}/inventory/audits`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create inventory count');
            }

            closeInventoryCountModal();

            // Reset filters to ensure the new audit is visible
            const startDateInput = document.querySelector('input[type="date"]:first-of-type');
            if (startDateInput) startDateInput.value = '';
            const endDateInput = document.querySelector('input[type="date"]:nth-of-type(2)');
            if (endDateInput) endDateInput.value = '';
            const warehouseFilter = document.getElementById('warehouseFilter');
            if (warehouseFilter) warehouseFilter.value = 'Tất cả kho';
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = 'Tất cả trạng thái';

            loadAudits();
            alert('Tạo phiếu kiểm kê thành công');

        } catch (error) {
            console.error('Error creating inventory count:', error);
            alert('Lỗi tạo phiếu kiểm kê: ' + error.message);
        }
    }

    // Event listeners
    if (createInventoryCountBtn) {
        createInventoryCountBtn.addEventListener('click', openInventoryCountModal);
    }

    if (closeInventoryCountModalEl) {
        closeInventoryCountModalEl.addEventListener('click', closeInventoryCountModal);
    }

    if (cancelInventoryCountBtn) {
        cancelInventoryCountBtn.addEventListener('click', closeInventoryCountModal);
    }

    if (inventoryCountModal) {
        inventoryCountModal.addEventListener('click', (e) => {
            if (e.target === inventoryCountModal) {
                closeInventoryCountModal();
            }
        });
    }

    // Add Audit Item Modal Events
    if (addAuditItemBtn) {
        addAuditItemBtn.addEventListener('click', openAddAuditItemModal);
    }

    if (closeAddAuditItemModal) {
        closeAddAuditItemModal.addEventListener('click', closeAddAuditItemModal);
    }

    if (cancelAddAuditItemBtn) {
        cancelAddAuditItemBtn.addEventListener('click', closeAddAuditItemModal);
    }

    if (addAuditItemModal) {
        addAuditItemModal.addEventListener('click', (e) => {
            if (e.target === addAuditItemModal) {
                closeAddAuditItemModal();
            }
        });
    }

    if (addAuditItemForm) {
        addAuditItemForm.addEventListener('submit', handleAddAuditItemFormSubmit);
    }

    // Product selection change handler
    const selectProduct = document.getElementById('selectProduct');
    if (selectProduct) {
        selectProduct.addEventListener('change', () => {
            const productId = selectProduct.value;
            const systemQuantity = allInventory[productId]?.quantity || 0;
            document.getElementById('systemQuantityInput').value = systemQuantity;
            document.getElementById('actualQuantityInput').value = '';
        });
    }

    const tableBody = document.querySelector('#kiem-ke-tab tbody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-audit');
            if (deleteButton) {
                const row = deleteButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                if (confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) {
                    try {
                        const baseUrl = `http://localhost:3000`;
                        const token = localStorage.getItem('token');
                        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                        const response = await fetch(`${baseUrl}/inventory/audits/${auditId}`, {
                            method: 'DELETE',
                            headers
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to delete inventory count');
                        }

                        row.remove();
                        alert('Xóa phiếu kiểm kê thành công');
                    } catch (error) {
                        console.error('Error deleting inventory count:', error);
                        alert('Lỗi xóa phiếu kiểm kê: ' + error.message);
                    }
                }
            }
        });
    }

    // View Audit Modal
    const viewAuditModal = document.getElementById('viewAuditModal');
    const closeViewAuditModal = document.getElementById('closeViewAuditModal');
    const closeViewAuditModalBtn = document.getElementById('closeViewAuditModalBtn');

    async function openViewAuditModal(auditId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/inventory/audits/${auditId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch audit details');
            
            const audit = await response.json();

            const modalBody = document.getElementById('viewAuditModalBody');
            
            // Build items table
            let itemsTable = `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left font-medium">Mã SP</th>
                                <th class="px-3 py-2 text-left font-medium">Tên sản phẩm</th>
                                <th class="px-3 py-2 text-center font-medium">Số lượng hệ thống</th>
                                <th class="px-3 py-2 text-center font-medium">Số lượng thực tế</th>
                                <th class="px-3 py-2 text-center font-medium">Chênh lệch</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            audit.items.forEach(item => {
                const statusClass = item.discrepancy >= 0 ? 'text-green-600' : 'text-red-600';
                itemsTable += `
                    <tr class="border-t hover:bg-gray-50">
                        <td class="px-3 py-2">${item.product_id}</td>
                        <td class="px-3 py-2">${item.product_name || item.product_id}</td>
                        <td class="px-3 py-2 text-center">${item.system_quantity}</td>
                        <td class="px-3 py-2 text-center">${item.actual_quantity}</td>
                        <td class="px-3 py-2 text-center font-medium ${statusClass}">
                            ${item.discrepancy >= 0 ? '+' : ''}${item.discrepancy}
                        </td>
                    </tr>
                `;
            });

            itemsTable += `
                        </tbody>
                    </table>
                </div>
            `;

            modalBody.innerHTML = `
                <p><strong>Mã phiếu:</strong> ${audit.code}</p>
                <p><strong>Ngày kiểm:</strong> ${new Date(audit.date).toLocaleDateString('vi-VN')}</p>
                <p><strong>Kho:</strong> ${audit.warehouse_name}</p>
                <p><strong>Người tạo:</strong> ${audit.created_by_username}</p>
                <p><strong>Trạng thái:</strong> ${audit.status}</p>
                <p><strong>Ghi chú:</strong> ${audit.notes || ''}</p>
                <div><strong>Chi tiết kiểm kê:</strong></div>
                ${itemsTable}
            `;

            viewAuditModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading audit details:', error);
            alert('Lỗi tải chi tiết phiếu kiểm kê: ' + error.message);
        }
    }

    if (viewAuditModal) {
        tableBody.addEventListener('click', async (e) => {
            const viewButton = e.target.closest('.view-audit');
            const downloadButton = e.target.closest('.download-audit');

            if (viewButton) {
                const row = viewButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                openViewAuditModal(auditId);
            }

            if (downloadButton) {
                const row = downloadButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                try {
                    const baseUrl = `http://localhost:3000`;
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(`${baseUrl}/reports/audits/${auditId}/export`, { headers });
                    if (!response.ok) throw new Error('Failed to download audit report');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `phieu-kiem-ke-${auditId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                } catch (error) {
                    console.error('Error downloading audit report:', error);
                    alert('Lỗi tải báo cáo kiểm kê: ' + error.message);
                }
            }
        });

        const closeModal = () => viewAuditModal.classList.add('hidden');
        closeViewAuditModal.addEventListener('click', closeModal);
        closeViewAuditModalBtn.addEventListener('click', closeModal);
        viewAuditModal.addEventListener('click', (e) => {
            if (e.target === viewAuditModal) {
                closeModal();
            }
        });
    }

    if (inventoryCountForm) {
        inventoryCountForm.addEventListener('submit', handleInventoryCountFormSubmit);
    }

    // Add event listeners for filter and action buttons
    const filterBtn = document.getElementById('filterBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            loadAudits();
            loadInventoryReport();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            exportReportsToCSV();
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            printCurrentTab();
        });
    }

    // Export reports to CSV
    async function exportReportsToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            let endpoint = '/reports/audits/export';
            if (currentTab === 'Báo cáo tồn kho') {
                endpoint = '/reports/inventory/export';
            } else if (currentTab === 'Báo cáo nhập/xuất') {
                endpoint = '/reports/transactions/export';
            }

            const response = await fetch(`${baseUrl}${endpoint}`, { headers });
            if (!response.ok) throw new Error('Failed to export reports');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTab.toLowerCase().replace(/\s+/g, '_')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất báo cáo thành công');
        } catch (error) {
            console.error('Error exporting reports:', error);
            alert('Lỗi xuất báo cáo');
        }
    }

    // Print current tab content
    function printCurrentTab() {
        const printWindow = window.open('', '_blank');
        const tabContent = document.querySelector(`#${currentTab.replace(/\s+/g, '').toLowerCase()}-tab`);
        const contentHTML = tabContent ? tabContent.innerHTML : 'Không có nội dung';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${currentTab}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>${currentTab}</h1>
                    ${contentHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    loadAudits();
    loadInventoryReport();
    loadImportExportChart();
    loadWarehouseFilterOptions();
});

    const setActiveTab = (tabName) => {
        currentTab = tabName;
        tabs.forEach(tab => {
            if (tab.textContent === tabName) {
                tab.classList.add('tab-active');
            } else {
                tab.classList.remove('tab-active');
            }
        });

        for (const content in tabContents) {
            if (content === tabName) {
                tabContents[content].classList.remove('hidden');
            } else {
                tabContents[content].classList.add('hidden');
            }
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.textContent);
        });
    });

    let currentPage = 1;

    async function loadAudits(page = 1) {
        currentPage = page;
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get filter values
            const startDate = document.querySelector('input[type="date"]:first-of-type')?.value;
            const endDate = document.querySelector('input[type="date"]:nth-of-type(2)')?.value;
            const warehouseFilter = document.getElementById('warehouseFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            // Build query parameters
            const queryParams = new URLSearchParams({ page, limit: 10 });
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (warehouseFilter) {
                queryParams.append('warehouse', warehouseFilter);
            }
            if (statusFilter) {
                queryParams.append('status', statusFilter);
            }

            const response = await fetch(`${baseUrl}/reports/audits?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch audits');
            const { audits, totalPages } = await response.json();

            const tableBody = document.querySelector('#kiem-ke-tab tbody');
            tableBody.innerHTML = '';
            audits.forEach(audit => {
                const row = document.createElement('tr');
                row.className = 'table-row hover:bg-gray-50';
                row.setAttribute('data-id', audit.id);

                const statusMap = {
                    pending: { text: 'Chờ xử lý', color: 'yellow' },
                    completed: { text: 'Đã cân bằng', color: 'green' },
                    cancelled: { text: 'Đã hủy', color: 'red' }
                };
                const statusInfo = statusMap[audit.status] || { text: audit.status, color: 'gray' };

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${audit.code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(audit.date).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${audit.warehouse_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${audit.created_by_username}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-${audit.discrepancy >= 0 ? 'green' : 'red'}-600">
                        ${audit.discrepancy >= 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN').format(Math.abs(audit.discrepancy))} ₫
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full">
                            ${statusInfo.text}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800 view-audit" title="Xem chi tiết"><i data-feather="eye" class="h-4 w-4"></i></button>
                            <button class="text-green-600 hover:text-green-800 download-audit" title="Tải xuống PDF"><i data-feather="download" class="h-4 w-4"></i></button>
                            <button class="text-red-600 hover:text-red-800 delete-audit" title="Xóa phiếu"><i data-feather="trash-2" class="h-4 w-4"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            feather.replace();
            renderPagination(totalPages, currentPage);
        } catch (error) {
            console.error('Error loading audits:', error);
        }
    }

    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = 'Trước';
        prevButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        if (currentPage === 1) {
            prevButton.disabled = true;
            prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        prevButton.addEventListener('click', () => loadAudits(currentPage - 1));
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerHTML = i;
            pageButton.className = 'px-3 py-1 border rounded-md text-sm font-medium';
            if (i === currentPage) {
                pageButton.classList.add('text-white', 'bg-blue-600', 'hover:bg-blue-700');
            } else {
                pageButton.classList.add('text-gray-700', 'bg-white', 'hover:bg-gray-50');
            }
            pageButton.addEventListener('click', () => loadAudits(i));
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Sau';
        nextButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        if (currentPage === totalPages) {
            nextButton.disabled = true;
            nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        nextButton.addEventListener('click', () => loadAudits(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }

    async function loadInventoryReport() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get filter values for inventory report
            const warehouseFilter = document.getElementById('warehouseFilter').value;
            const queryParams = new URLSearchParams();
            if (warehouseFilter && warehouseFilter !== 'Tất cả kho') {
                queryParams.append('warehouse', warehouseFilter);
            }

            const response = await fetch(`${baseUrl}/reports/inventory?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch inventory report');
            const inventory = await response.json();

            const tableBody = document.querySelector('#bao-cao-ton-kho-tab tbody');
            tableBody.innerHTML = '';
            inventory.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'table-row hover:bg-gray-100 cursor-pointer view-product';
                row.setAttribute('data-product-id', item.product_id);
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Intl.NumberFormat('vi-VN').format(item.price)} ₫</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Intl.NumberFormat('vi-VN').format(item.quantity * item.price)} ₫</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading inventory report:', error);
        }
    }

    // View Product Modal
    const viewProductModal = document.getElementById('viewProductModal');
    const closeViewProductModal = document.getElementById('closeViewProductModal');
    const closeViewProductModalBtn = document.getElementById('closeViewProductModalBtn');
    const inventoryReportTableBody = document.querySelector('#bao-cao-ton-kho-tab tbody');

    async function openViewProductModal(productId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/products/${productId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch product details');
            
            const product = await response.json();

            const modalBody = document.getElementById('viewProductModalBody');
            modalBody.innerHTML = `
                <p><strong>Tên sản phẩm:</strong> ${product.name}</p>
                <p><strong>Mã SP:</strong> ${product.id}</p>
                <p><strong>Mô tả:</strong> ${product.description || ''}</p>
                <p><strong>Giá:</strong> ${new Intl.NumberFormat('vi-VN').format(product.price)} ₫</p>
                <p><strong>Danh mục:</strong> ${product.category || ''}</p>
                <p><strong>Thương hiệu:</strong> ${product.brand || ''}</p>
                <p><strong>Nhà cung cấp:</strong> ${product.supplier_name || ''}</p>
                <p><strong>Tồn kho:</strong> ${product.quantity || 0}</p>
            `;

            viewProductModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading product details:', error);
            alert('Lỗi tải chi tiết sản phẩm: ' + error.message);
        }
    }

    if (viewProductModal) {
        inventoryReportTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('.view-product');
            if (row) {
                const productId = row.getAttribute('data-product-id');
                openViewProductModal(productId);
            }
        });

        const closeModal = () => viewProductModal.classList.add('hidden');
        closeViewProductModal.addEventListener('click', closeModal);
        closeViewProductModalBtn.addEventListener('click', closeModal);
        viewProductModal.addEventListener('click', (e) => {
            if (e.target === viewProductModal) {
                closeModal();
            }
        });
    }

    async function loadImportExportChart() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/inventory/transactions?page=1&limit=100`, { headers });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            const transactions = data.transactions || data;

            const monthlyData = transactions.reduce((acc, t) => {
                const month = new Date(t.transaction_date).getMonth();
                acc[month] = acc[month] || { imports: 0, exports: 0 };
                if (t.type === 'nhap') {
                    acc[month].imports += t.quantity;
                } else {
                    acc[month].exports += t.quantity;
                }
                return acc;
            }, {});

            const labels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
            const importData = Array.from({ length: 12 }, (_, i) => monthlyData[i]?.imports || 0);
            const exportData = Array.from({ length: 12 }, (_, i) => monthlyData[i]?.exports || 0);

            const ctx = document.getElementById('nhap-xuat-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Nhập', data: importData, backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 },
                        { label: 'Xuất', data: exportData, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 },
                    ]
                }
            });
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    // Modal functions
    function openInventoryCountModal() {
        resetInventoryCountForm();
        loadWarehousesForSelect();
        generateInventoryCode();
        inventoryCountModal.classList.remove('hidden');
    }

    function closeInventoryCountModal() {
        inventoryCountModal.classList.add('hidden');
        resetInventoryCountForm();
    }

    function resetInventoryCountForm() {
        document.getElementById('inventoryCode').value = '';
        document.getElementById('inventoryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('inventoryWarehouse').value = '';
        document.getElementById('inventoryChecker').value = '';
        document.getElementById('inventoryNotes').value = '';
    }

    function generateInventoryCode() {
        const date = new Date();
        const code = `KK${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        document.getElementById('inventoryCode').value = code;
    }

    async function loadWarehousesForSelect() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const warehouses = await response.json();
            const select = document.getElementById('inventoryWarehouse');
            select.innerHTML = '<option value="">Chọn kho</option>';

            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }
    async function loadWarehouseFilterOptions() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const warehouses = await response.json();
            const select = document.getElementById('warehouseFilter');
            
            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading warehouse filter options:', error);
        }
    }
    // Handle form submission
    async function handleInventoryCountFormSubmit(event) {
        event.preventDefault();

        const formData = {
            code: document.getElementById('inventoryCode').value,
            date: document.getElementById('inventoryDate').value,
            warehouse_id: document.getElementById('inventoryWarehouse').value,
            checker: document.getElementById('inventoryChecker').value,
            notes: document.getElementById('inventoryNotes').value
        };

        // Validate required fields
        if (!formData.date || !formData.warehouse_id || !formData.checker) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

            const response = await fetch(`${baseUrl}/inventory/audits`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create inventory count');
            }

            closeInventoryCountModal();

            // Reset filters to ensure the new audit is visible
            const startDateInput = document.querySelector('input[type="date"]:first-of-type');
            if (startDateInput) startDateInput.value = '';
            const endDateInput = document.querySelector('input[type="date"]:nth-of-type(2)');
            if (endDateInput) endDateInput.value = '';
            const warehouseFilter = document.getElementById('warehouseFilter');
            if (warehouseFilter) warehouseFilter.value = 'Tất cả kho';
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = 'Tất cả trạng thái';

            loadAudits();
            alert('Tạo phiếu kiểm kê thành công');

        } catch (error) {
            console.error('Error creating inventory count:', error);
            alert('Lỗi tạo phiếu kiểm kê: ' + error.message);
        }
    }

    // Event listeners
    if (createInventoryCountBtn) {
        createInventoryCountBtn.addEventListener('click', openInventoryCountModal);
    }

        if (closeInventoryCountModalEl) {
        closeInventoryCountModalEl.addEventListener('click', closeInventoryCountModal);
    }

    if (cancelInventoryCountBtn) {
        cancelInventoryCountBtn.addEventListener('click', closeInventoryCountModal);
    }

    if (inventoryCountModal) {
        inventoryCountModal.addEventListener('click', (e) => {
            if (e.target === inventoryCountModal) {
                closeInventoryCountModal();
            }
        });
    }

    const tableBody = document.querySelector('#kiem-ke-tab tbody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-audit');
            if (deleteButton) {
                const row = deleteButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                if (confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) {
                    try {
                        const baseUrl = `http://localhost:3000`;
                        const token = localStorage.getItem('token');
                        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                        const response = await fetch(`${baseUrl}/inventory/audits/${auditId}`, {
                            method: 'DELETE',
                            headers
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to delete inventory count');
                        }

                        row.remove();
                        alert('Xóa phiếu kiểm kê thành công');
                    } catch (error) {
                        console.error('Error deleting inventory count:', error);
                        alert('Lỗi xóa phiếu kiểm kê: ' + error.message);
                    }
                }
            }
        });
    }

    // View Audit Modal
    const viewAuditModal = document.getElementById('viewAuditModal');
    const closeViewAuditModal = document.getElementById('closeViewAuditModal');
    const closeViewAuditModalBtn = document.getElementById('closeViewAuditModalBtn');

    async function openViewAuditModal(auditId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/inventory/audits/${auditId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch audit details');
            
            const audit = await response.json();

            const modalBody = document.getElementById('viewAuditModalBody');
            modalBody.innerHTML = `
                <p><strong>Mã phiếu:</strong> ${audit.code}</p>
                <p><strong>Ngày kiểm:</strong> ${new Date(audit.date).toLocaleDateString('vi-VN')}</p>
                <p><strong>Kho:</strong> ${audit.warehouse_name}</p>
                <p><strong>Người tạo:</strong> ${audit.created_by_username}</p>
                <p><strong>Trạng thái:</strong> ${audit.status}</p>
                <p><strong>Chênh lệch:</strong> ${audit.discrepancy}</p>
                <p><strong>Ghi chú:</strong> ${audit.notes || ''}</p>
            `;

            viewAuditModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading audit details:', error);
            alert('Lỗi tải chi tiết phiếu kiểm kê: ' + error.message);
        }
    }

    if (viewAuditModal) {
        tableBody.addEventListener('click', async (e) => {
            const viewButton = e.target.closest('.view-audit');
            const downloadButton = e.target.closest('.download-audit');

            if (viewButton) {
                const row = viewButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                openViewAuditModal(auditId);
            }

            if (downloadButton) {
                const row = downloadButton.closest('tr');
                const auditId = row.getAttribute('data-id');
                try {
                    const baseUrl = `http://localhost:3000`;
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(`${baseUrl}/reports/audits/${auditId}/export`, { headers });
                    if (!response.ok) throw new Error('Failed to download audit report');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `phieu-kiem-ke-${auditId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                } catch (error) {
                    console.error('Error downloading audit report:', error);
                    alert('Lỗi tải báo cáo kiểm kê: ' + error.message);
                }
            }
        });

        const closeModal = () => viewAuditModal.classList.add('hidden');
        closeViewAuditModal.addEventListener('click', closeModal);
        closeViewAuditModalBtn.addEventListener('click', closeModal);
        viewAuditModal.addEventListener('click', (e) => {
            if (e.target === viewAuditModal) {
                closeModal();
            }
        });
    }

    if (inventoryCountForm) {
        inventoryCountForm.addEventListener('submit', handleInventoryCountFormSubmit);
    }

    // Add event listeners for filter and action buttons
    const filterBtn = document.getElementById('filterBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            loadAudits();
            loadInventoryReport();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            exportReportsToCSV();
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            printCurrentTab();
        });
    }

    // Export reports to CSV
    async function exportReportsToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            let endpoint = '/reports/audits/export';
            if (currentTab === 'Báo cáo tồn kho') {
                endpoint = '/reports/inventory/export';
            } else if (currentTab === 'Báo cáo nhập/xuất') {
                endpoint = '/reports/transactions/export';
            }

            const response = await fetch(`${baseUrl}${endpoint}`, { headers });
            if (!response.ok) throw new Error('Failed to export reports');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTab.toLowerCase().replace(/\s+/g, '_')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất báo cáo thành công');
        } catch (error) {
            console.error('Error exporting reports:', error);
            alert('Lỗi xuất báo cáo');
        }
    }

    // Print current tab content
    function printCurrentTab() {
        const printWindow = window.open('', '_blank');
        const tabContent = document.querySelector(`#${currentTab.replace(/\s+/g, '').toLowerCase()}-tab`);
        const contentHTML = tabContent ? tabContent.innerHTML : 'Không có nội dung';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${currentTab}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>${currentTab}</h1>
                    ${contentHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    loadAudits();
    loadInventoryReport();
    loadImportExportChart();
    loadWarehouseFilterOptions();
});

