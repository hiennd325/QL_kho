document.addEventListener('DOMContentLoaded', async () => {
    const warehouseGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    const totalWarehousesEl = document.getElementById('total-warehouses');
    const totalCapacityEl = document.getElementById('total-capacity');
    const currentUsageEl = document.getElementById('current-usage');
    const usageRateEl = document.getElementById('usage-rate');

    // Modal elements
    const warehouseModal = document.getElementById('warehouseModal');
    const warehouseDetailModal = document.getElementById('warehouseDetailModal');
    const warehouseForm = document.getElementById('warehouseForm');
    const modalTitle = document.getElementById('modalTitle');

    // Buttons
    const addWarehouseBtn = document.getElementById('addWarehouseBtn');
    const closeWarehouseModalBtn = document.getElementById('closeWarehouseModal');
    const cancelWarehouseBtn = document.getElementById('cancelWarehouseBtn');
    const closeWarehouseDetailModalBtn = document.getElementById('closeWarehouseDetailModal');

    // Tab elements
    const tabs = document.querySelectorAll('.flex.px-6 button');
    let currentTab = 'Danh sách kho';
    let currentWarehouseId = null;

    const renderWarehouses = (warehouses) => {
        warehouseGrid.innerHTML = '';
        if (warehouses.length === 0) {
            warehouseGrid.innerHTML = `<p class="text-center col-span-3">Không có kho nào</p>`;
            return;
        }

        warehouses.forEach(warehouse => {
            const card = document.createElement('div');
            card.className = 'warehouse-card bg-white rounded-lg shadow-md overflow-hidden';
            card.dataset.id = warehouse.custom_id;
            card.innerHTML = `
                <div class="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                    <div class="absolute top-4 right-4">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Hoạt động
                        </span>
                    </div>
                    <div class="absolute bottom-4 left-4">
                        <h3 class="text-white text-xl font-semibold">${warehouse.name}</h3>
                        <p class="text-white text-sm mt-1">Mã: ${warehouse.custom_id}</p>
                    </div>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-sm text-gray-500">Sức chứa</p>
                            <p class="font-semibold">${warehouse.capacity} SP</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Đang sử dụng</p>
                            <p class="font-semibold text-green-600">${warehouse.current_usage} SP</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-500">Tỷ lệ</p>
                            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${Math.round((warehouse.current_usage / warehouse.capacity) * 100)}%"></div>
                            </div>
                            <p class="font-semibold text-right mt-1">${Math.round((warehouse.current_usage / warehouse.capacity) * 100)}%</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700" data-action="view">
                            <i data-feather="eye" class="h-4 w-4 inline mr-1"></i> Xem
                        </button>
                        <button class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200" data-action="edit">
                            <i data-feather="edit" class="h-4 w-4 inline mr-1"></i> Sửa
                        </button>
                        <button class="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-600" data-action="delete">
                            <i data-feather="trash-2" class="h-4 w-4 inline mr-1"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
            warehouseGrid.appendChild(card);
        });
        feather.replace();
    };

    const updateWarehouseStats = (warehouses) => {
        const totalWarehouses = warehouses.length;
        const totalCapacity = warehouses.reduce((sum, warehouse) => sum + warehouse.capacity, 0);
        const currentUsage = warehouses.reduce((sum, warehouse) => sum + warehouse.current_usage, 0);
        const usageRate = totalCapacity > 0 ? Math.round((currentUsage / totalCapacity) * 100) : 0;

        totalWarehousesEl.textContent = totalWarehouses;
        totalCapacityEl.textContent = totalCapacity.toLocaleString('vi-VN');
        currentUsageEl.textContent = currentUsage.toLocaleString('vi-VN');
        usageRateEl.textContent = `${usageRate}%`;
    };

    async function loadWarehouses() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses`, { headers });
            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const warehouses = await response.json();
            renderWarehouses(warehouses);
            updateWarehouseStats(warehouses);

        } catch (error) {
            console.error('Error loading warehouses:', error);
            warehouseGrid.innerHTML = `<p class="text-center col-span-3">Lỗi tải dữ liệu</p>`;
        }
    }

    async function loadRecentTransfers() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/transfers?limit=5`, { headers });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Please log in again');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const transfers = await response.json();
            renderRecentTransfers(transfers);
        } catch (error) {
            console.error('Error loading recent transfers:', error);
            // Show error message to user
            renderRecentTransfersError(error.message);
        }
    }

    function renderRecentTransfers(transfers) {
        const tbody = document.getElementById('transfers-tbody');

        if (!tbody) return;

        if (transfers.length === 0) {
            tbody.innerHTML = `
                <tr class="table-row hover:bg-gray-50">
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        Chưa có dữ liệu điều chuyển
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transfers.map(transfer => `
            <tr class="table-row hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${transfer.code}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.from_warehouse}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.to_warehouse}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium ${getStatusClass(transfer.status)} rounded-full">
                        ${getStatusText(transfer.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">
                            <i data-feather="eye" class="h-4 w-4"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800">
                            <i data-feather="download" class="h-4 w-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        feather.replace();
    }

    function renderRecentTransfersError(errorMessage) {
        const tbody = document.getElementById('transfers-tbody');

        if (!tbody) return;

        tbody.innerHTML = `
            <tr class="table-row hover:bg-gray-50">
                <td colspan="7" class="px-6 py-4 text-center text-red-500">
                    Lỗi tải dữ liệu: ${errorMessage}
                </td>
            </tr>
        `;
    }

    function getStatusClass(status) {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'completed':
                return 'Hoàn thành';
            case 'in_progress':
                return 'Đang xử lý';
            case 'pending':
                return 'Chờ xử lý';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    }

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            currentTab = tab.textContent.trim();
            loadTabContent();
        });
    });

    // Transfer tab
    const transferTab = document.getElementById('transfer-tab');
    const transferSection = document.getElementById('transfer-section');
    if (transferTab) {
        transferTab.addEventListener('click', () => {
            // Hide warehouse grid and show transfer section
            warehouseGrid.classList.add('hidden');
            if (transferSection) {
                transferSection.classList.remove('hidden');
            }
            
            // Load transfer data
            loadTransferData();
        });
    }

    // Modal functions
    function openWarehouseModal(warehouseId = null) {
        currentWarehouseId = warehouseId;
        if (warehouseId) {
            modalTitle.textContent = 'Chỉnh sửa kho';
            loadWarehouseData(warehouseId);
        } else {
            modalTitle.textContent = 'Thêm kho mới';
            resetWarehouseForm();
        }
        warehouseModal.classList.remove('hidden');
    }

    function closeWarehouseModal() {
        warehouseModal.classList.add('hidden');
        resetWarehouseForm();
        currentWarehouseId = null;
    }

    function openWarehouseDetailModal(warehouseId) {
        loadWarehouseDetail(warehouseId);
        warehouseDetailModal.classList.remove('hidden');
    }

    function closeWarehouseDetailModal() {
        warehouseDetailModal.classList.add('hidden');
    }

    function resetWarehouseForm() {
        document.getElementById('warehouseCustomId').value = '';
        document.getElementById('warehouseName').value = '';
        document.getElementById('warehouseCapacity').value = '';
        // Re-enable custom_id field
        document.getElementById('warehouseCustomId').disabled = false;
    }

        async function loadWarehouseData(warehouseCustomId) {
            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/warehouses/${warehouseCustomId}`, { headers });

                if (!response.ok) throw new Error('Failed to fetch warehouse data');

                const warehouse = await response.json();
                document.getElementById('warehouseCustomId').value = warehouse.custom_id || '';
                document.getElementById('warehouseName').value = warehouse.name;
                document.getElementById('warehouseCapacity').value = warehouse.capacity;
                
                // Disable custom_id field when editing
                document.getElementById('warehouseCustomId').disabled = true;
            } catch (error) {
                console.error('Error loading warehouse data:', error);
                alert('Lỗi tải dữ liệu kho');
            }
        }    async function loadWarehouseDetail(warehouseCustomId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses/${warehouseCustomId}`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouse detail');

            const warehouse = await response.json();
            const detailContent = document.getElementById('warehouseDetailContent');

            detailContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Thông tin kho</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Mã kho</label>
                                <p class="text-gray-900">${warehouse.custom_id || 'Chưa có'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Tên kho</label>
                                <p class="text-gray-900">${warehouse.name}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Sức chứa</label>
                                <p class="text-gray-900">${warehouse.capacity} sản phẩm</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Đang sử dụng</label>
                                <p class="text-gray-900">${warehouse.current_usage} sản phẩm</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Sản phẩm trong kho</h4>
                        <div id="warehouse-products" class="space-y-2">
                            <!-- Products will be loaded here -->
                        </div>
                    </div>
                </div>
            `;

            // Load products in this warehouse
            loadWarehouseProducts(warehouseCustomId);
        } catch (error) {
            console.error('Error loading warehouse detail:', error);
            alert('Lỗi tải chi tiết kho');
        }
    }

    async function loadWarehouseProducts(warehouseCustomId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses/${warehouseCustomId}/products`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouse products');

            const products = await response.json();
            const productsContainer = document.getElementById('warehouse-products');

            if (products.length === 0) {
                productsContainer.innerHTML = '<p class="text-gray-500">Không có sản phẩm nào trong kho</p>';
                return;
            }

            productsContainer.innerHTML = products.map(product => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">${product.name}</p>
                        <p class="text-sm text-gray-500">Mã: ${product.code}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium">${product.quantity}</p>
                        <p class="text-sm text-gray-500">sản phẩm</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading warehouse products:', error);
            document.getElementById('warehouse-products').innerHTML = '<p class="text-red-500">Lỗi tải sản phẩm</p>';
        }
    }

    function loadTabContent() {
        // Show warehouse grid by default
        warehouseGrid.classList.remove('hidden');
        
        // Hide transfer section by default
        if (transferSection) {
            transferSection.classList.add('hidden');
        }

        switch(currentTab) {
            case 'Danh sách kho':
                loadWarehouses();
                break;
            case 'Điều chuyển hàng':
                // Hide warehouse grid and show transfer section
                warehouseGrid.classList.add('hidden');
                if (transferSection) {
                    transferSection.classList.remove('hidden');
                }
                loadTransferData();
                break;
        }
    }

    async function loadTransferData() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Load transfers
            const response = await fetch(`${baseUrl}/transfers?limit=20`, { headers });
            if (!response.ok) throw new Error('Failed to fetch transfers');
            
            const transfers = await response.json();
            renderTransfersInManagement(transfers);
        } catch (error) {
            console.error('Error loading transfer data:', error);
        }
    }

    function renderTransfersInManagement(transfers) {
        const tableBody = document.querySelector('#transfersTable tbody');
        if (!tableBody) return;

        if (transfers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        Chưa có dữ liệu điều chuyển
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = transfers.map(transfer => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${transfer.code}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.from_warehouse}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.to_warehouse}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium ${getStatusClass(transfer.status)} rounded-full">
                        ${getStatusText(transfer.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="updateTransferStatus(${transfer.id}, 'completed')" class="text-green-600 hover:text-green-900 mr-2" title="Hoàn thành">
                        <i data-feather="check-circle"></i>
                    </button>
                    <button onclick="updateTransferStatus(${transfer.id}, 'cancelled')" class="text-red-600 hover:text-red-900" title="Hủy bỏ">
                        <i data-feather="x-circle"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        feather.replace();
    }

    // Make function available globally
    window.updateTransferStatus = async function(transferId, status) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } : { 'Content-Type': 'application/json' };

            const response = await fetch(`${baseUrl}/transfers/${transferId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update transfer status');

            alert('Cập nhật trạng thái thành công!');
            loadTransferData(); // Refresh transfers list
        } catch (error) {
            console.error('Error updating transfer status:', error);
            alert('Lỗi khi cập nhật trạng thái: ' + error.message);
        }
    };

    // Event listeners
    if (addWarehouseBtn) {
        addWarehouseBtn.addEventListener('click', () => openWarehouseModal());
    }

    if (closeWarehouseModalBtn) {
        closeWarehouseModalBtn.addEventListener('click', closeWarehouseModal);
    }

    if (cancelWarehouseBtn) {
        cancelWarehouseBtn.addEventListener('click', closeWarehouseModal);
    }

    if (closeWarehouseDetailModalBtn) {
        closeWarehouseDetailModalBtn.addEventListener('click', closeWarehouseDetailModal);
    }

    // Close modals when clicking outside
    [warehouseModal, warehouseDetailModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });

    // Form submission
    if (warehouseForm) {
        warehouseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const customId = document.getElementById('warehouseCustomId').value;
            if (!customId) {
                alert('Vui lòng nhập mã kho');
                return;
            }

            const formData = {
                custom_id: customId,
                name: document.getElementById('warehouseName').value,
                location: '', // Giữ nguyên giá trị mặc định
                capacity: parseInt(document.getElementById('warehouseCapacity').value)
            };

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                const url = currentWarehouseId ? `${baseUrl}/warehouses/${currentWarehouseId}` : `${baseUrl}/warehouses`;
                const method = currentWarehouseId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers,
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save warehouse');
                }

                closeWarehouseModal();
                loadWarehouses();
                alert(currentWarehouseId ? 'Cập nhật kho thành công' : 'Thêm kho thành công');

            } catch (error) {
                console.error('Error saving warehouse:', error);
                if (error.message === 'Mã kho đã tồn tại') {
                    alert('Lỗi: Mã kho đã tồn tại. Vui lòng chọn mã khác.');
                } else {
                    alert('Lỗi lưu kho: ' + error.message);
                }
            }
        });
    }

    // Handle warehouse card actions
    warehouseGrid.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const warehouseCard = button.closest('.warehouse-card');
        const warehouseCustomId = warehouseCard ? warehouseCard.dataset.id : null;

        if (action === 'view') {
            e.preventDefault();
            if (warehouseCustomId) {
                openWarehouseDetailModal(warehouseCustomId);
            }
        }

        if (action === 'edit') {
            e.preventDefault();
            if (warehouseCustomId) {
                openWarehouseModal(warehouseCustomId);
            }
        }

        if (action === 'delete') {
            e.preventDefault();
            if (warehouseCustomId) {
                deleteWarehouse(warehouseCustomId);
            }
        }
    });

    async function deleteWarehouse(warehouseCustomId) {
        if (!confirm('Bạn có chắc chắn muốn xóa kho này không? Kho sẽ bị xóa vĩnh viễn và không thể khôi phục.')) {
            return;
        }

        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/warehouses/${warehouseCustomId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to delete warehouse');
            }

            alert('Xóa kho thành công');
            loadWarehouses();

        } catch (error) {
            console.error('Error deleting warehouse:', error);
            alert('Lỗi khi xóa kho: ' + error.message);
        }
    }

    // Add event listeners for search and filter inputs
    const searchInput = document.querySelector('input[placeholder*="Tìm theo khu vực"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterWarehouses(query);
        });
    }

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
                    case 'map':
                        // Show warehouse map/layout
                        setActiveTab('Sơ đồ kho');
                        break;
                    case 'printer':
                        // Print warehouses list
                        printWarehousesList();
                        break;
                }
            }
        });
    });

    // Filter warehouses by search query
    function filterWarehouses(query) {
        const cards = document.querySelectorAll('.warehouse-card');
        cards.forEach(card => {
            const warehouseName = card.querySelector('h3').textContent.toLowerCase();

            if (warehouseName.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Print warehouses list
    function printWarehousesList() {
        const printWindow = window.open('', '_blank');
        const warehousesHTML = Array.from(document.querySelectorAll('.warehouse-card')).map(card => {
            const name = card.querySelector('h3').textContent;
            const capacityEl = card.querySelector('p.font-semibold');
            const capacity = capacityEl ? capacityEl.textContent : '';
            return `<div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
                <h3>${name}</h3>
                <p>Sức chứa: ${capacity}</p>
            </div>`;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Danh sách kho bãi</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Danh sách kho bãi</h1>
                    ${warehousesHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    loadWarehouses();
    loadRecentTransfers();
});
