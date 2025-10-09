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
    const addWarehouseBtn = document.querySelector('button.bg-blue-600');
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
            card.dataset.id = warehouse.id;
            card.innerHTML = `
                <div class="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                    <div class="absolute top-4 right-4">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Hoạt động
                        </span>
                    </div>
                    <div class="absolute bottom-4 left-4">
                        <h3 class="text-white text-xl font-semibold">${warehouse.name}</h3>
                        <p class="text-blue-100">${warehouse.location}</p>
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
                            <p class="text-sm text-gray-500">Khu vực</p>
                            <p class="font-semibold">1 khu</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Tỷ lệ</p>
                            <p class="font-semibold">${Math.round((warehouse.current_usage / warehouse.capacity) * 100)}%</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700">
                            <i data-feather="eye" class="h-4 w-4 inline mr-1"></i> Xem
                        </button>
                        <button class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200">
                            <i data-feather="edit" class="h-4 w-4 inline mr-1"></i> Sửa
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
        document.getElementById('warehouseName').value = '';
        document.getElementById('warehouseLocation').value = '';
        document.getElementById('warehouseCapacity').value = '';
        document.getElementById('warehouseType').value = '';
    }

    async function loadWarehouseData(warehouseId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses/${warehouseId}`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouse data');

            const warehouse = await response.json();
            document.getElementById('warehouseName').value = warehouse.name;
            document.getElementById('warehouseLocation').value = warehouse.location;
            document.getElementById('warehouseCapacity').value = warehouse.capacity;
            document.getElementById('warehouseType').value = warehouse.type || 'normal';
        } catch (error) {
            console.error('Error loading warehouse data:', error);
            alert('Lỗi tải dữ liệu kho');
        }
    }

    async function loadWarehouseDetail(warehouseId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses/${warehouseId}`, { headers });

            if (!response.ok) throw new Error('Failed to fetch warehouse detail');

            const warehouse = await response.json();
            const detailContent = document.getElementById('warehouseDetailContent');

            detailContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Thông tin kho</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Tên kho</label>
                                <p class="text-gray-900">${warehouse.name}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Địa chỉ</label>
                                <p class="text-gray-900">${warehouse.location}</p>
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
            loadWarehouseProducts(warehouseId);
        } catch (error) {
            console.error('Error loading warehouse detail:', error);
            alert('Lỗi tải chi tiết kho');
        }
    }

    async function loadWarehouseProducts(warehouseId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/warehouses/${warehouseId}/products`, { headers });

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
        switch(currentTab) {
            case 'Danh sách kho':
                loadWarehouses();
                break;
            case 'Sơ đồ kho':
                loadWarehouseLayout();
                break;
            case 'Vị trí lưu trữ':
                loadStorageLocations();
                break;
            case 'Điều chuyển hàng':
                loadTransferRequests();
                break;
        }
    }

    async function loadWarehouseLayout() {
        // Placeholder for warehouse layout visualization
        warehouseGrid.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <i data-feather="grid" class="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Sơ đồ kho</h3>
                    <p class="text-gray-500">Tính năng sơ đồ kho đang được phát triển</p>
                </div>
            </div>
        `;
        feather.replace();
    }

    async function loadStorageLocations() {
        // Placeholder for storage locations
        warehouseGrid.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <i data-feather="map-pin" class="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Vị trí lưu trữ</h3>
                    <p class="text-gray-500">Tính năng quản lý vị trí lưu trữ đang được phát triển</p>
                </div>
            </div>
        `;
        feather.replace();
    }

    async function loadTransferRequests() {
        // Placeholder for transfer requests
        warehouseGrid.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <i data-feather="truck" class="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Điều chuyển hàng</h3>
                    <p class="text-gray-500">Tính năng điều chuyển hàng đang được phát triển</p>
                </div>
            </div>
        `;
        feather.replace();
    }

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

            const formData = {
                name: document.getElementById('warehouseName').value,
                location: document.getElementById('warehouseLocation').value,
                capacity: parseInt(document.getElementById('warehouseCapacity').value),
                type: document.getElementById('warehouseType').value
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

                if (!response.ok) throw new Error('Failed to save warehouse');

                closeWarehouseModal();
                loadWarehouses();
                alert(currentWarehouseId ? 'Cập nhật kho thành công' : 'Thêm kho thành công');

            } catch (error) {
                console.error('Error saving warehouse:', error);
                alert('Lỗi lưu kho: ' + error.message);
            }
        });
    }

    // Handle warehouse card actions
    warehouseGrid.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('button.bg-blue-600');
        const editBtn = e.target.closest('button.bg-gray-100');

        if (viewBtn) {
            e.preventDefault();
            const warehouseId = viewBtn.closest('.warehouse-card').dataset.id;
            if (warehouseId) {
                openWarehouseDetailModal(warehouseId);
            }
        }

        if (editBtn) {
            e.preventDefault();
            const warehouseId = editBtn.closest('.warehouse-card').dataset.id;
            if (warehouseId) {
                openWarehouseModal(warehouseId);
            }
        }
    });

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
            const location = card.querySelector('p').textContent.toLowerCase();

            if (warehouseName.includes(query) || location.includes(query)) {
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
            const location = card.querySelector('p').textContent;
            const capacity = card.querySelector('p.font-semibold').textContent;
            return `<div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
                <h3>${name}</h3>
                <p>Địa chỉ: ${location}</p>
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
