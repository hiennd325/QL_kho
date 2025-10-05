document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const importStats = document.getElementById('import-value');
    const exportStats = document.getElementById('export-value');
    const inventoryStats = document.getElementById('inventory-value');
    const valueStats = document.getElementById('value-value');
    const tabs = document.querySelectorAll('.bg-white.border-b button');
    let allTransactions = [];
    let inventoryData = [];
    let alertData = [];
    let currentTab = 'Phiếu nhập kho'; // Default tab

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('tab-active', 'text-gray-600', 'hover:text-blue-600'));
            tabs.forEach(t => t.classList.add('text-gray-600', 'hover:text-blue-600'));
            tab.classList.remove('text-gray-600', 'hover:text-blue-600');
            tab.classList.add('tab-active');
            
            currentTab = tab.textContent.trim();
            filterAndRenderTransactions();
        });
    });

    const renderTransactions = (transactions) => {
        tableBody.innerHTML = '';
        if (transactions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Không có phiếu nào</td></tr>`;
            return;
        }

        transactions.forEach(t => {
            const row = document.createElement('tr');
            row.className = 'table-row hover:bg-gray-50';
            const formattedDate = new Date(t.transaction_date).toLocaleDateString('vi-VN');
            // Sử dụng tên kho và tên sản phẩm từ dữ liệu trả về
            const warehouseName = t.warehouse_name || 'Không xác định';
            const productName = t.product_name || 'Sản phẩm không xác định';
            
            // Determine type label and color
            let typeLabel = '';
            let typeClass = '';
            if (t.type === 'nhap') {
                typeLabel = 'Nhập kho';
                typeClass = 'bg-green-100 text-green-800';
            } else if (t.type === 'xuat') {
                typeLabel = 'Xuất kho';
                typeClass = 'bg-red-100 text-red-800';
            } else {
                typeLabel = t.type;
                typeClass = 'bg-gray-100 text-gray-800';
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">P${t.type.charAt(0).toUpperCase()}${t.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${productName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${t.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0 ₫</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${warehouseName}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${typeClass}">${typeLabel}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">
                            <i data-feather="eye" class="h-4 w-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800">
                            <i data-feather="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        feather.replace();
    };

    // Render inventory data for "Tồn kho thực tế" tab
    const renderInventory = (inventory) => {
        tableBody.innerHTML = '';
        if (inventory.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Không có dữ liệu tồn kho</td></tr>`;
            return;
        }

        inventory.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'table-row hover:bg-gray-50';
            const productName = item.name || 'Sản phẩm không xác định';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SP${item.product_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${productName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0 ₫</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge bg-blue-100 text-blue-800">Còn hàng</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">
                            <i data-feather="eye" class="h-4 w-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        feather.replace();
    };

    // Render alert data for "Cảnh báo tồn kho" tab
    const renderAlerts = (alerts) => {
        tableBody.innerHTML = '';
        if (alerts.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Không có cảnh báo tồn kho</td></tr>`;
            return;
        }

        alerts.forEach(alert => {
            const row = document.createElement('tr');
            row.className = 'table-row hover:bg-gray-50';
            const productName = alert.name || 'Sản phẩm không xác định';
            const warehouseName = alert.warehouse_name || 'Không xác định';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SP${alert.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${productName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${alert.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${warehouseName}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge bg-red-100 text-red-800">Sắp hết hàng</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">
                            <i data-feather="eye" class="h-4 w-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        feather.replace();
    };

    const updateStats = async () => {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/reports/quick-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch quick stats');
            }
            
            const stats = await response.json();
            
            importStats.textContent = stats.total_import || 0;
            exportStats.textContent = stats.total_export || 0;
            inventoryStats.textContent = stats.total_inventory || 0;
            valueStats.textContent = `${stats.total_value || 0} ₫`;
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    };

    const filterAndRenderTransactions = () => {
        switch(currentTab) {
            case 'Phiếu nhập kho':
                const importTransactions = allTransactions.filter(t => t.type === 'nhap');
                renderTransactions(importTransactions);
                break;
            case 'Phiếu xuất kho':
                const exportTransactions = allTransactions.filter(t => t.type === 'xuat');
                renderTransactions(exportTransactions);
                break;
            case 'Tồn kho thực tế':
                renderInventory(inventoryData);
                break;
            case 'Cảnh báo tồn kho':
                renderAlerts(alertData);
                break;
            default:
                renderTransactions(allTransactions);
        }
    };

    async function loadTransactions() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            
            // Load transactions
            const transactionsResponse = await fetch(`${baseUrl}/inventory/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!transactionsResponse.ok) {
                if (transactionsResponse.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error('Failed to fetch transactions');
            }
            allTransactions = await transactionsResponse.json();
            
            // Load inventory data
            const inventoryResponse = await fetch(`${baseUrl}/reports/inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (inventoryResponse.ok) {
                inventoryData = await inventoryResponse.json();
            }
            
            // Load alert data
            const alertResponse = await fetch(`${baseUrl}/reports/alerts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (alertResponse.ok) {
                alertData = await alertResponse.json();
            }
            
            filterAndRenderTransactions();
            updateStats();

        } catch (error) {
            console.error('Error loading data:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
        }
    }

    loadTransactions();
});
