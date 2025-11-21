document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const importStats = document.getElementById('import-value');
    const exportStats = document.getElementById('export-value');
    const inventoryStats = document.getElementById('inventory-value');
    const valueStats = document.getElementById('value-value');
    const stockAlertsContainer = document.getElementById('stock-alerts-container');
    const tabs = document.querySelectorAll('.tab-button');
    let allTransactions = [];
    let inventoryData = [];
    let alertData = [];
    let currentTab = 'Phiếu nhập kho'; // Default tab
    let currentPage = 1;
    const limit = 10;
    let pollInterval;

    // Load warehouses from API
    const loadWarehouses = async () => {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/warehouses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch warehouses');
            }
            const warehouses = await response.json();
            return warehouses;
        } catch (error) {
            console.error('Error loading warehouses:', error);
            return [];
        }
    };

    // Load products from API
    const loadProducts = async () => {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const productsData = await response.json();
            return productsData.products || [];
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    };

    // Load suppliers from API
    const loadSuppliers = async () => {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/suppliers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch suppliers');
            }
            const suppliersData = await response.json();
            return suppliersData || [];
        } catch (error) {
            console.error('Error loading suppliers:', error);
            return [];
        }
    };

    // Populate warehouse filter select
    const populateWarehouseFilter = async () => {
        const warehouseFilter = document.getElementById('warehouseFilter');
        if (!warehouseFilter) return;

        const warehouses = await loadWarehouses();
        warehouseFilter.innerHTML = '<option value="">Tất cả kho</option>';

        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseFilter.appendChild(option);
        });
    };

    // Populate warehouse selects in modals
    const populateWarehouseSelects = async () => {
        const importWarehouse = document.getElementById('importWarehouse');
        const exportWarehouse = document.getElementById('exportWarehouse');

        const warehouses = await loadWarehouses();

        [importWarehouse, exportWarehouse].forEach(select => {
            if (select) {
                select.innerHTML = '';
                warehouses.forEach(warehouse => {
                    const option = document.createElement('option');
                    option.value = warehouse.id;
                    option.textContent = warehouse.name;
                    select.appendChild(option);
                });
            }
        });
    };

    // Populate product selects in modals
    const populateProductSelects = async () => {
        const importProductSelect = document.getElementById('importProductId');
        const exportProductSelect = document.getElementById('exportProductId');
        const importSupplierSelect = document.getElementById('importSupplier');

        const products = await loadProducts();
        const suppliers = await loadSuppliers();
        
        // Clear existing options
        if (importProductSelect) {
            importProductSelect.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
        }
        
        if (exportProductSelect) {
            exportProductSelect.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
        }

        // Add products to select dropdowns
        products.forEach(product => {
            if (importProductSelect) {
                const importOption = document.createElement('option');
                importOption.value = product.id;
                importOption.textContent = `${product.name} (${product.quantity} tồn kho)`;
                importProductSelect.appendChild(importOption);
            }

            if (exportProductSelect) {
                const exportOption = document.createElement('option');
                exportOption.value = product.id;
                exportOption.textContent = `${product.name} (${product.quantity} tồn kho)`;
                exportProductSelect.appendChild(exportOption);
            }
        });

        // Populate supplier dropdown
        if (importSupplierSelect) {
            importSupplierSelect.innerHTML = '<option value="">-- Chọn nhà cung cấp --</option>';
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                importSupplierSelect.appendChild(option);
            });
        }
    };

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('tab-active', 'text-gray-600', 'hover:text-blue-600'));
            tabs.forEach(t => t.classList.add('text-gray-600', 'hover:text-blue-600'));
            tab.classList.remove('text-gray-600', 'hover:text-blue-600');
            tab.classList.add('tab-active');
            
            currentTab = tab.dataset.tab;
            currentPage = 1; // Reset to first page when switching tabs
            loadTransactions();
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



    // Render alert data for "Cảnh báo tồn kho" tab
    const renderAlerts = (alerts) => {
        tableBody.innerHTML = '';
        if (alerts.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Không có cảnh báo tồn kho</td></tr>`;
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${alert.value ? new Intl.NumberFormat('vi-VN').format(alert.value) + ' ₫' : '-'}</td>
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

    const renderStockAlerts = (alerts) => {
        if (!stockAlertsContainer) return;

        stockAlertsContainer.innerHTML = '';

        if (!alerts || alerts.length === 0) {
            stockAlertsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Không có cảnh báo tồn kho</p>';
            return;
        }

        // Display only the first 4 alerts
        const displayedAlerts = alerts.slice(0, 4);

        displayedAlerts.forEach(alert => {
            const alertCard = document.createElement('div');
            alertCard.className = 'bg-red-50 border border-red-200 rounded-lg p-4';

            const productName = alert.product_name || alert.name || 'Sản phẩm không xác định';
            const quantity = alert.quantity || 0;
            const minQuantity = alert.min_quantity || 10;

            alertCard.innerHTML = `
                <div class="flex items-center mb-2">
                    <div class="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                        <i data-feather="alert-triangle" class="h-4 w-4"></i>
                    </div>
                    <div>
                        <p class="font-medium text-red-800">Sắp hết hàng</p>
                        <p class="text-sm text-red-600">${productName}</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600">Tồn kho: ${quantity} | Mức tối thiểu: ${minQuantity}</p>
            `;

            stockAlertsContainer.appendChild(alertCard);
        });

        feather.replace();
    };

    const renderPagination = (totalPages) => {
        const paginationContainer = document.querySelector('.flex.space-x-2');
        if (!paginationContainer) {
            console.error('Pagination container not found');
            return;
        }

        // Clear existing pagination buttons
        paginationContainer.innerHTML = '';

        // Only show pagination if there are multiple pages
        if (totalPages <= 1) {
            return;
        }

        const prevButton = document.createElement('button');
        prevButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
        prevButton.textContent = 'Trước';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTransactions();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Calculate page range to show (max 5 pages)
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add "..." if there are pages before startPage
        if (startPage > 1) {
            const firstButton = document.createElement('button');
            firstButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
            firstButton.textContent = '1';
            firstButton.addEventListener('click', () => {
                currentPage = 1;
                loadTransactions();
            });
            paginationContainer.appendChild(firstButton);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 py-1 text-sm text-gray-500';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'px-3 py-1 border rounded-md text-sm font-medium';
            if (i === currentPage) {
                pageButton.classList.add('text-white', 'bg-blue-600', 'hover:bg-blue-700');
            } else {
                pageButton.classList.add('text-gray-700', 'bg-white', 'hover:bg-gray-50');
            }
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                loadTransactions();
            });
            paginationContainer.appendChild(pageButton);
        }

        // Add "..." if there are pages after endPage
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 py-1 text-sm text-gray-500';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }

            const lastButton = document.createElement('button');
            lastButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
            lastButton.textContent = totalPages;
            lastButton.addEventListener('click', () => {
                currentPage = totalPages;
                loadTransactions();
            });
            paginationContainer.appendChild(lastButton);
        }

        const nextButton = document.createElement('button');
        nextButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
        nextButton.textContent = 'Sau';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTransactions();
            }
        });
        paginationContainer.appendChild(nextButton);
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

    const updateTableHeaders = () => {
        const thead = document.querySelector('thead');
        if (!thead) return;

        if (currentTab === 'Cảnh báo tồn kho') {
            // Headers without "Ngày giao dịch"
            thead.innerHTML = `
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá trị
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kho
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                    </th>
                </tr>
            `;
        } else {
            // Default headers with "Ngày giao dịch"
            thead.innerHTML = `
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày giao dịch
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá trị
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kho
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                    </th>
                </tr>
            `;
        }
    };

    const filterAndRenderTransactions = () => {
        updateTableHeaders();
        switch(currentTab) {
            case 'Phiếu nhập kho':
                const importTransactions = allTransactions.filter(t => t.type === 'nhap');
                renderTransactions(importTransactions);
                break;
            case 'Phiếu xuất kho':
                const exportTransactions = allTransactions.filter(t => t.type === 'xuat');
                renderTransactions(exportTransactions);
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

            // Get filter values
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            const warehouseFilter = document.getElementById('warehouseFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            
            // Get advanced filter values
            const typeFilter = document.getElementById('typeFilter')?.value;
            const productFilter = document.getElementById('productFilter')?.value;
            const userFilter = document.getElementById('userFilter')?.value;

            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: limit
            });
            
            // Add basic filters
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (warehouseFilter && warehouseFilter !== '') {
                queryParams.append('warehouseId', warehouseFilter);
            }
            if (statusFilter && statusFilter !== '') {
                queryParams.append('type', statusFilter);
            }
            
            // Add advanced filters
            if (typeFilter && typeFilter !== '') {
                queryParams.append('type', typeFilter);
            }
            if (productFilter && productFilter !== '') {
                queryParams.append('product', productFilter);
            }
            if (userFilter && userFilter !== '') {
                queryParams.append('user', userFilter);
            }

            // Load transactions with pagination
            const transactionsResponse = await fetch(`${baseUrl}/inventory/transactions?${queryParams.toString()}`, {
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
            const transactionsData = await transactionsResponse.json();
            allTransactions = transactionsData.transactions || [];
            const totalPages = transactionsData.totalPages || 1;

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
            const alertQueryParams = new URLSearchParams();
            if (warehouseFilter && warehouseFilter !== '') {
                alertQueryParams.append('warehouse', warehouseFilter);
            }
            const alertResponse = await fetch(`${baseUrl}/reports/alerts?${alertQueryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (alertResponse.ok) {
                alertData = await alertResponse.json();
            }

            filterAndRenderTransactions();
            renderPagination(totalPages);
            updateStats();
            renderStockAlerts(alertData);

            // Update pagination info
            const infoDiv = document.querySelector('.bg-white.px-6.py-4.border-t .text-sm.text-gray-700');
            if (infoDiv && transactionsData.totalCount > 0) {
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, transactionsData.totalCount);
                infoDiv.innerHTML = `Hiển thị <span class="font-medium">${start}</span> đến <span class="font-medium">${end}</span> của <span class="font-medium">${transactionsData.totalCount}</span> kết quả`;
            }

        } catch (error) {
            console.error('Error loading data:', error);
            const colspan = (currentTab === 'Cảnh báo tồn kho') ? 7 : 8;
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
            if (stockAlertsContainer) {
                stockAlertsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Lỗi tải dữ liệu</p>';
            }
        }
    }

    // Start polling for real-time updates
    function startPolling() {
        pollInterval = setInterval(() => {
            loadTransactions();
        }, 10000); // Poll every 10 seconds
    }

    // Stop polling
    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    }

    // Start polling when the page loads
    startPolling();

    // Stop polling when the page unloads
    window.addEventListener('beforeunload', stopPolling);

    // Import/Export Modal Functionality
    const createReceiptBtn = document.getElementById('createReceiptBtn');
    const createReceiptDropdown = document.getElementById('createReceiptDropdown');
    const createImportReceiptBtn = document.getElementById('createImportReceiptBtn');
    const createExportReceiptBtn = document.getElementById('createExportReceiptBtn');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importModal = document.getElementById('importModal');
    const exportModal = document.getElementById('exportModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const cancelExportBtn = document.getElementById('cancelExportBtn');
    const importForm = document.getElementById('importForm');
    const exportForm = document.getElementById('exportForm');

    // Toggle dropdown for create receipt button
    if (createReceiptBtn && createReceiptDropdown) {
        createReceiptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            createReceiptDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (createReceiptDropdown && !createReceiptBtn.contains(e.target) && !createReceiptDropdown.contains(e.target)) {
                createReceiptDropdown.classList.add('hidden');
            }
        });
    }

    // Show import modal for create import receipt
    if (createImportReceiptBtn && importModal) {
        createImportReceiptBtn.addEventListener('click', () => {
            createReceiptDropdown.classList.add('hidden');
            importModal.classList.remove('hidden');
            // Initialize Feather icons in the modal
            feather.replace();
        });
    }

    // Show export modal for create export receipt
    if (createExportReceiptBtn && exportModal) {
        createExportReceiptBtn.addEventListener('click', () => {
            createReceiptDropdown.classList.add('hidden');
            exportModal.classList.remove('hidden');
            // Initialize Feather icons in the modal
            feather.replace();
        });
    }

    // Show import modal
    if (importBtn && importModal) {
        importBtn.addEventListener('click', () => {
            importModal.classList.remove('hidden');
            // Initialize Feather icons in the modal
            feather.replace();
        });
    }

    // Show export modal
    if (exportBtn && exportModal) {
        exportBtn.addEventListener('click', () => {
            exportModal.classList.remove('hidden');
            // Initialize Feather icons in the modal
            feather.replace();
        });
    }

    // Close modals
    [closeImportModal, cancelImportBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                importModal.classList.add('hidden');
            });
        }
    });

    [closeExportModal, cancelExportBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                exportModal.classList.add('hidden');
            });
        }
    });

    // Close modals when clicking outside
    [importModal, exportModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });

    // Handle import form submission
    if (importForm) {
        importForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('importProductId').value;
            const quantity = document.getElementById('importQuantity').value;
            const supplierId = document.getElementById('importSupplier').value;
            const warehouseId = document.getElementById('importWarehouse').value;

            if (!productId || !quantity || !supplierId) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                // Load all products to find the matching one
                const products = await loadProducts();
                const product = products.find(p => p.id == productId);
                
                if (!product) {
                    throw new Error('Sản phẩm không tồn tại');
                }

                // Create inventory transaction
                const transactionResponse = await fetch(`${baseUrl}/inventory/transactions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        product_id: parseInt(productId),
                        type: 'nhap',
                        quantity: parseInt(quantity),
                        supplier_id: parseInt(supplierId),
                        warehouse_id: parseInt(warehouseId)
                    })
                });

                if (!transactionResponse.ok) {
                    throw new Error('Nhập kho thất bại');
                }

                alert(`Đã nhập kho ${quantity} sản phẩm: ${product.name}`);
                importForm.reset();
                importModal.classList.add('hidden');

                // Refresh data
                loadTransactions();
                // Refresh product list
                populateProductSelects();

            } catch (error) {
                console.error('Error importing stock:', error);
                alert('Lỗi khi nhập kho: ' + error.message);
            }
        });
    }

    // Handle export form submission
    if (exportForm) {
        exportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('exportProductId').value;
            const quantity = document.getElementById('exportQuantity').value;
            const customer = document.getElementById('exportCustomer').value;
            const warehouseId = document.getElementById('exportWarehouse').value;

            if (!productId || !quantity || !customer) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                // Load all products to find the matching one
                const products = await loadProducts();
                const product = products.find(p => p.id == productId);
                
                if (!product) {
                    throw new Error('Sản phẩm không tồn tại');
                }

                // Check if there's enough stock
                if (product.quantity < parseInt(quantity)) {
                    throw new Error(`Không đủ hàng trong kho. Tồn kho hiện tại: ${product.quantity}`);
                }

                // Create inventory transaction
                const transactionResponse = await fetch(`${baseUrl}/inventory/transactions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        product_id: parseInt(productId),
                        type: 'xuat',
                        quantity: parseInt(quantity),
                        customer_name: customer,
                        warehouse_id: parseInt(warehouseId)
                    })
                });

                if (!transactionResponse.ok) {
                    throw new Error('Xuất kho thất bại');
                }

                alert(`Đã xuất kho ${quantity} sản phẩm: ${product.name}`);
                exportForm.reset();
                exportModal.classList.add('hidden');

                // Refresh data
                loadTransactions();
                // Refresh product list
                populateProductSelects();

            } catch (error) {
                console.error('Error exporting stock:', error);
                alert('Lỗi khi xuất kho: ' + error.message);
            }
        });
    }

    // Add event listeners for basic filter inputs
    const filterInputs = document.querySelectorAll('#startDate, #endDate, #warehouseFilter, #statusFilter');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            currentPage = 1; // Reset to first page when filters change
            loadTransactions(); // Reload transactions with filters
        });
    });

    // Advanced filters toggle
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const advancedFilters = document.getElementById('advancedFilters');
    if (toggleFiltersBtn && advancedFilters) {
        toggleFiltersBtn.addEventListener('click', () => {
            advancedFilters.classList.toggle('hidden');
        });
    }

    // Apply advanced filters
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            currentPage = 1; // Reset to first page when filters change
            loadTransactions(); // Reload transactions with filters
        });
    }

    // Export to CSV
    const exportCSVBtn = document.getElementById('exportCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportTransactionsToCSV);
    }

    // Print table
    const printTableBtn = document.getElementById('printTable');
    if (printTableBtn) {
        printTableBtn.addEventListener('click', printTransactionsTable);
    }

    // Export transactions to CSV
    async function exportTransactionsToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/inventory/transactions/export`, { headers });
            if (!response.ok) throw new Error('Failed to export transactions');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất dữ liệu giao dịch thành công');
        } catch (error) {
            console.error('Error exporting transactions:', error);
            alert('Lỗi xuất dữ liệu giao dịch');
        }
    }

    // Print transactions table
    function printTransactionsTable() {
        const printWindow = window.open('', '_blank');
        const tableHTML = document.querySelector('table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Danh sách giao dịch</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Danh sách giao dịch nhập/xuất</h1>
                    ${tableHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    // Initialize warehouse filter and selects
    populateWarehouseFilter();
    populateWarehouseSelects();
    populateProductSelects();

    loadTransactions();
});
