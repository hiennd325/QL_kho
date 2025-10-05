document.addEventListener('DOMContentLoaded', async () => {
    const warehouseGrid = document.querySelector('.grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3');
    const totalWarehousesEl = document.getElementById('total-warehouses');
    const totalCapacityEl = document.getElementById('total-capacity');
    const currentUsageEl = document.getElementById('current-usage');
    const usageRateEl = document.getElementById('usage-rate');

    const renderWarehouses = (warehouses) => {
        warehouseGrid.innerHTML = '';
        if (warehouses.length === 0) {
            warehouseGrid.innerHTML = `<p class="text-center col-span-3">Không có kho nào</p>`;
            return;
        }

        warehouses.forEach(warehouse => {
            const card = document.createElement('div');
            card.className = 'warehouse-card bg-white rounded-lg shadow-md overflow-hidden';
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

    loadWarehouses();
});
