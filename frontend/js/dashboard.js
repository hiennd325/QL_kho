document.addEventListener('DOMContentLoaded', async () => {
    try {
        const dashboardData = await fetchDashboardData();
        if (!dashboardData) return;
        updateAlerts(dashboardData.alerts);
        updateStats(dashboardData.stats);
        updateFunctionOverview(dashboardData.functionCounts);
        setupQuickActions(dashboardData.quickActions);
        updateRecentActivities(dashboardData.recentActivities);
        feather.replace();
        
        // Setup event listeners for quick action forms
        setupQuickActionForms();
        
        // Setup event listeners for quick actions modal
        setupQuickActionsModal();

        // Setup header button event listeners
        setupHeaderButtons();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.location.href = '/login.html';
    }
});

function setupQuickActionForms() {
    // Handle Add Product Form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productName = document.getElementById('productName').value;
            const productCode = document.getElementById('productCode').value;
            const quantity = document.getElementById('productQuantity').value;

            // Basic validation
            if (!productName || !productCode || !quantity) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                const response = await fetch(`${baseUrl}/products`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name: productName,
                        description: `Mã sản phẩm: ${productCode}`,
                        price: 0, // Default price, can be updated later
                        quantity: parseInt(quantity)
                    })
                });

                if (!response.ok) {
                    throw new Error('Thêm sản phẩm thất bại');
                }

                alert(`Đã thêm sản phẩm: ${productName}`);
                addProductForm.reset();

                // Refresh dashboard data
                const dashboardData = await fetchDashboardData();
                if (dashboardData) {
                    updateStats(dashboardData.stats);
                }

            } catch (error) {
                console.error('Error adding product:', error);
                alert('Lỗi khi thêm sản phẩm: ' + error.message);
            }
        });
    }
    
    // Handle Import Stock Form
    const importStockForm = document.getElementById('importStockForm');
    if (importStockForm) {
        importStockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productCode = document.getElementById('importProductCode').value;
            const quantity = document.getElementById('importQuantity').value;
            const supplier = document.getElementById('supplier').value;

            // Basic validation
            if (!productCode || !quantity || !supplier) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                // First, find the product by code (assuming productCode is the product name for now)
                const productsResponse = await fetch(`${baseUrl}/products?search=${encodeURIComponent(productCode)}`, { headers });
                if (!productsResponse.ok) {
                    throw new Error('Không tìm thấy sản phẩm');
                }

                const productsData = await productsResponse.json();
                if (!productsData.products || productsData.products.length === 0) {
                    throw new Error('Sản phẩm không tồn tại');
                }

                const product = productsData.products[0];

                // Create inventory transaction
                const transactionResponse = await fetch(`${baseUrl}/inventory/transactions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        product_id: product.id,
                        type: 'nhap',
                        quantity: parseInt(quantity),
                        supplier: supplier,
                        warehouse_id: 1 // Default warehouse
                    })
                });

                if (!transactionResponse.ok) {
                    throw new Error('Nhập kho thất bại');
                }

                alert(`Đã nhập kho ${quantity} sản phẩm: ${product.name}`);
                importStockForm.reset();

                // Refresh dashboard data
                const dashboardData = await fetchDashboardData();
                if (dashboardData) {
                    updateStats(dashboardData.stats);
                }

            } catch (error) {
                console.error('Error importing stock:', error);
                alert('Lỗi khi nhập kho: ' + error.message);
            }
        });
    }
    
    // Handle Export Stock Form
    const exportStockForm = document.getElementById('exportStockForm');
    if (exportStockForm) {
        exportStockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productCode = document.getElementById('exportProductCode').value;
            const quantity = document.getElementById('exportQuantity').value;
            const customer = document.getElementById('customer').value;

            // Basic validation
            if (!productCode || !quantity || !customer) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                // First, find the product by code (assuming productCode is the product name for now)
                const productsResponse = await fetch(`${baseUrl}/products?search=${encodeURIComponent(productCode)}`, { headers });
                if (!productsResponse.ok) {
                    throw new Error('Không tìm thấy sản phẩm');
                }

                const productsData = await productsResponse.json();
                if (!productsData.products || productsData.products.length === 0) {
                    throw new Error('Sản phẩm không tồn tại');
                }

                const product = productsData.products[0];

                // Check if there's enough stock
                if (product.quantity < parseInt(quantity)) {
                    throw new Error(`Không đủ hàng trong kho. Tồn kho hiện tại: ${product.quantity}`);
                }

                // Create inventory transaction
                const transactionResponse = await fetch(`${baseUrl}/inventory/transactions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        product_id: product.id,
                        type: 'xuat',
                        quantity: parseInt(quantity),
                        customer: customer,
                        warehouse_id: 1 // Default warehouse
                    })
                });

                if (!transactionResponse.ok) {
                    throw new Error('Xuất kho thất bại');
                }

                alert(`Đã xuất kho ${quantity} sản phẩm: ${product.name}`);
                exportStockForm.reset();

                // Refresh dashboard data
                const dashboardData = await fetchDashboardData();
                if (dashboardData) {
                    updateStats(dashboardData.stats);
                }

            } catch (error) {
                console.error('Error exporting stock:', error);
                alert('Lỗi khi xuất kho: ' + error.message);
            }
        });
    }
    
    // Handle Generate Report Form
    const generateReportForm = document.getElementById('generateReportForm');
    if (generateReportForm) {
        generateReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reportType = document.getElementById('reportType').value;
            const reportPeriod = document.getElementById('reportPeriod').value;

            // Basic validation
            if (!reportType || !reportPeriod) {
                alert('Vui lòng chọn loại báo cáo và thời gian');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                // Generate report based on type and period
                const reportResponse = await fetch(`${baseUrl}/reports/generate?type=${reportType}&period=${reportPeriod}`, {
                    method: 'GET',
                    headers
                });

                if (!reportResponse.ok) {
                    throw new Error('Tạo báo cáo thất bại');
                }

                const reportData = await reportResponse.json();

                // For now, just show a success message with basic info
                alert(`Đã tạo báo cáo ${reportType} theo kỳ ${reportPeriod}. Dữ liệu: ${JSON.stringify(reportData, null, 2)}`);

                generateReportForm.reset();

            } catch (error) {
                console.error('Error generating report:', error);
                alert('Lỗi khi tạo báo cáo: ' + error.message);
            }
        });
    }
}

function setupQuickActionsModal() {
    const quickActionsBtn = document.getElementById('quickActionsBtn');
    const quickActionsModal = document.getElementById('quickActionsModal');
    const closeQuickActionsModal = document.getElementById('closeQuickActionsModal');
    
    if (quickActionsBtn && quickActionsModal) {
        // Show modal when quick actions button is clicked
        quickActionsBtn.addEventListener('click', () => {
            quickActionsModal.classList.remove('hidden');
        });
        
        // Close modal when close button is clicked
        if (closeQuickActionsModal) {
            closeQuickActionsModal.addEventListener('click', () => {
                quickActionsModal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside the modal content
        quickActionsModal.addEventListener('click', (e) => {
            if (e.target === quickActionsModal) {
                quickActionsModal.classList.add('hidden');
            }
        });
    }
}

function setupHeaderButtons() {
    // Global search functionality
    const globalSearchInput = document.getElementById('globalSearch');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                // Perform global search across products, orders, etc.
                performGlobalSearch(query);
            }
        });
    }

    // Notifications button
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            showNotificationsPanel();
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showSettingsPanel();
        });
    }

    // Load notification count
    loadNotificationCount();
}

async function performGlobalSearch(query) {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [productsRes, ordersRes] = await Promise.all([
            fetch(`${baseUrl}/products?search=${encodeURIComponent(query)}&limit=5`, { headers }),
            fetch(`${baseUrl}/orders?search=${encodeURIComponent(query)}&limit=5`, { headers })
        ]);

        const results = {
            products: productsRes.ok ? await productsRes.json() : { products: [] },
            orders: ordersRes.ok ? await ordersRes.json() : []
        };

        showSearchResults(results, query);
    } catch (error) {
        console.error('Error performing global search:', error);
    }
}

function showSearchResults(results, query) {
    // Create search results dropdown
    const existingDropdown = document.getElementById('searchResultsDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'searchResultsDropdown';
    dropdown.className = 'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto';

    let html = `<div class="p-4 border-b"><h3 class="font-semibold">Kết quả tìm kiếm cho "${query}"</h3></div>`;

    // Products results
    if (results.products.products && results.products.products.length > 0) {
        html += `<div class="p-4 border-b"><h4 class="font-medium text-gray-700 mb-2">Sản phẩm</h4>`;
        results.products.products.forEach(product => {
            html += `
                <div class="flex items-center justify-between py-2 hover:bg-gray-50 cursor-pointer" onclick="window.location.href='quan-ly-hang-hoa.html'">
                    <div>
                        <p class="font-medium">${product.name}</p>
                        <p class="text-sm text-gray-500">Mã: ${product.id}</p>
                    </div>
                    <span class="text-sm text-gray-500">${product.quantity} tồn kho</span>
                </div>
            `;
        });
        html += '</div>';
    }

    // Orders results
    if (results.orders && results.orders.length > 0) {
        html += `<div class="p-4"><h4 class="font-medium text-gray-700 mb-2">Đơn hàng</h4>`;
        results.orders.forEach(order => {
            html += `
                <div class="flex items-center justify-between py-2 hover:bg-gray-50 cursor-pointer" onclick="window.location.href='don-hang.html'">
                    <div>
                        <p class="font-medium">Đơn hàng #${order.id}</p>
                        <p class="text-sm text-gray-500">${order.supplier_name || 'N/A'}</p>
                    </div>
                    <span class="text-sm text-gray-500">${order.total_amount?.toLocaleString('vi-VN')} ₫</span>
                </div>
            `;
        });
        html += '</div>';
    }

    if ((!results.products.products || results.products.products.length === 0) &&
        (!results.orders || results.orders.length === 0)) {
        html += '<div class="p-4 text-center text-gray-500">Không tìm thấy kết quả</div>';
    }

    dropdown.innerHTML = html;

    const searchInput = document.getElementById('globalSearch');
    const searchContainer = searchInput.parentElement;
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!searchContainer.contains(e.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function showNotificationsPanel() {
    // Create notifications panel
    const panel = document.createElement('div');
    panel.className = 'fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto';
    panel.id = 'notificationsPanel';

    panel.innerHTML = `
        <div class="p-4 border-b flex justify-between items-center">
            <h3 class="font-semibold">Thông báo</h3>
            <button class="text-sm text-blue-600 hover:text-blue-800 mark-all-read-btn">Đánh dấu tất cả đã đọc</button>
        </div>
        <div class="p-4 space-y-3" id="notificationsList">
            <div class="text-center text-gray-500 py-8">
                <i data-feather="bell" class="h-12 w-12 mx-auto mb-2"></i>
                <p>Không có thông báo mới</p>
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    feather.replace();

    // Load notifications
    loadNotifications();

    // Hide notification badge when panel is opened (assuming user has viewed notifications)
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.classList.add('hidden');
    }

    // Add event listener for mark all as read button
    const markAllReadBtn = panel.querySelector('.mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            await markAllNotificationsAsRead();
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', function closePanel(e) {
        if (!panel.contains(e.target) && !e.target.closest('#notificationsBtn')) {
            panel.remove();
            document.removeEventListener('click', closePanel);
        }
    });
}

function showSettingsPanel() {
    // Create settings panel
    const panel = document.createElement('div');
    panel.className = 'fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80';
    panel.id = 'settingsPanel';

    panel.innerHTML = `
        <div class="p-4 border-b">
            <h3 class="font-semibold">Cài đặt</h3>
        </div>
        <div class="p-4 space-y-3">
            <button class="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center" onclick="window.location.href='quan-ly-nguoi-dung.html'">
                <i data-feather="users" class="h-5 w-5 mr-3"></i>
                Quản lý người dùng
            </button>
            <button class="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center" onclick="showSystemSettings()">
                <i data-feather="settings" class="h-5 w-5 mr-3"></i>
                Cài đặt hệ thống
            </button>
            <button class="w-full text-left p-3 rounded-lg hover:bg-red-50 text-red-600 flex items-center" onclick="logout()">
                <i data-feather="log-out" class="h-5 w-5 mr-3"></i>
                Đăng xuất
            </button>
        </div>
    `;

    document.body.appendChild(panel);
    feather.replace();

    // Close panel when clicking outside
    document.addEventListener('click', function closePanel(e) {
        if (!panel.contains(e.target) && !e.target.closest('#settingsBtn')) {
            panel.remove();
            document.removeEventListener('click', closePanel);
        }
    });
}

function showSystemSettings() {
    alert('Tính năng cài đặt hệ thống đang được phát triển');
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

async function loadNotifications() {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${baseUrl}/notifications`, { headers });
        if (!response.ok) return;

        const notifications = await response.json();
        const notificationsList = document.getElementById('notificationsList');

        if (notifications.length > 0) {
            notificationsList.innerHTML = notifications.map(notification => `
                <div class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer notification-item ${notification.is_read ? 'opacity-60' : ''}" data-id="${notification.id}">
                    <div class="flex items-start">
                        <div class="p-2 rounded-full bg-${notification.type === 'warning' ? 'yellow' : notification.type === 'error' ? 'red' : 'blue'}-100 mr-3">
                            <i data-feather="${notification.icon || 'info'}" class="h-4 w-4"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-sm">${notification.title}</p>
                            <p class="text-xs text-gray-500 mt-1">${notification.message}</p>
                            <p class="text-xs text-gray-400 mt-1">${new Date(notification.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <div class="flex flex-col space-y-1">
                            ${!notification.is_read ? '<button class="text-xs text-blue-600 hover:text-blue-800 mark-read-btn" data-id="' + notification.id + '">Đánh dấu đã đọc</button>' : ''}
                            <button class="text-xs text-red-600 hover:text-red-800 delete-notification-btn" data-id="${notification.id}">
                                <i data-feather="x" class="h-3 w-3"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add event listeners for mark as read buttons
            document.querySelectorAll('.mark-read-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const notificationId = btn.getAttribute('data-id');
                    await markNotificationAsRead(notificationId);
                });
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-notification-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const notificationId = btn.getAttribute('data-id');
                    await deleteNotification(notificationId);
                });
            });

            // Replace feather icons for new elements
            feather.replace();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function loadNotificationCount() {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${baseUrl}/notifications/count`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        const badge = document.getElementById('notificationBadge');

        if (data.count > 0) {
            badge.textContent = data.count > 99 ? '99+' : data.count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Use absolute URL with port 3000 for backend API
        const baseUrl = `http://localhost:3000`;
        
        const [alertsRes, statsRes, activitiesRes, productsRes, warehousesRes, usersRes, suppliersRes] = await Promise.all([
            fetch(`${baseUrl}/dashboard/alerts`, { headers }),
            fetch(`${baseUrl}/dashboard/stats`, { headers }),
            fetch(`${baseUrl}/dashboard/recent-activities`, { headers }),
            fetch(`${baseUrl}/products/count`, { headers }),
            fetch(`${baseUrl}/warehouses/count`, { headers }),
            fetch(`${baseUrl}/users/count`, { headers }),
            fetch(`${baseUrl}/suppliers/count`, { headers })
        ]);

        // Check for unauthorized responses (401)
        if (alertsRes.status === 401 || statsRes.status === 401 || activitiesRes.status === 401 ||
            productsRes.status === 401 || warehousesRes.status === 401 || usersRes.status === 401 ||
            suppliersRes.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        if (!alertsRes.ok || !statsRes.ok || !activitiesRes.ok ||
            !productsRes.ok || !warehousesRes.ok || !usersRes.ok ||
            !suppliersRes.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const alertsData = await alertsRes.json();
        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();
        const productsCount = await productsRes.json();
        const warehousesCount = await warehousesRes.json();
        const usersCount = await usersRes.json();
        const suppliersCount = await suppliersRes.json();
        return {
            alerts: alertsData,
            stats: statsData,
            recentActivities: activitiesData,
            functionCounts: {
                products: productsCount.count || 0,
                warehouses: warehousesCount.count || 0,
                users: usersCount.count || 0,
                suppliers: suppliersCount.count || 0
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't redirect to login on fetch error, just show error
        return null;
    }
}

function updateAlerts(alerts) {
    const alertContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-2.gap-6.mb-8');
    if (!alertContainer) return;

    alertContainer.children[0].querySelector('p:last-child').textContent = `${alerts.newOrders || 0} đơn hàng mới cần xử lý`;
    alertContainer.children[1].querySelector('p:last-child').textContent = alerts.systemStatus || 'Hệ thống hoạt động ổn định';
}

function updateStats(stats) {
    const statsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4.gap-6.mb-8:nth-of-type(2)');
    if (!statsContainer) return;

    statsContainer.children[0].querySelector('.text-2xl').textContent = stats.totalProducts.toLocaleString('vi-VN');
    statsContainer.children[1].querySelector('.text-2xl').textContent = stats.monthlyImports.toLocaleString('vi-VN');
    statsContainer.children[2].querySelector('.text-2xl').textContent = stats.monthlyExports.toLocaleString('vi-VN');
    
    // Format total value with proper currency notation
    let totalValueText;
    if (stats.totalValue >= 1000000000) {
        totalValueText = `${(stats.totalValue / 1000000000).toFixed(1)}B VNĐ`;
    } else if (stats.totalValue >= 1000000) {
        totalValueText = `${(stats.totalValue / 1000000).toFixed(1)}M VNĐ`;
    } else if (stats.totalValue >= 1000) {
        totalValueText = `${(stats.totalValue / 1000).toFixed(1)}K VNĐ`;
    } else {
        totalValueText = `${stats.totalValue.toLocaleString('vi-VN')} VNĐ`;
    }
    statsContainer.children[3].querySelector('.text-2xl').textContent = totalValueText;
}

function updateFunctionOverview(counts) {
    // Update products count and growth
    const productsCountEl = document.getElementById('products-count');
    if (productsCountEl) {
        productsCountEl.textContent = counts.products.toLocaleString('vi-VN');
    }
    
    const productsGrowthEl = document.getElementById('products-growth');
    if (productsGrowthEl) {
        // Tạm thời hiển thị 0% cho đến khi có dữ liệu thực
        productsGrowthEl.textContent = '+0% so với tháng trước';
    }

    // Update warehouses count and status
    const warehousesCountEl = document.getElementById('warehouses-count');
    if (warehousesCountEl) {
        warehousesCountEl.textContent = counts.warehouses.toLocaleString('vi-VN');
    }
    
    const warehousesStatusEl = document.getElementById('warehouses-status');
    if (warehousesStatusEl) {
        warehousesStatusEl.textContent = counts.warehouses > 0 ? 'Tất cả hoạt động' : 'Chưa có dữ liệu';
    }

    // Update users count and new users
    const usersCountEl = document.getElementById('users-count');
    if (usersCountEl) {
        usersCountEl.textContent = counts.users.toLocaleString('vi-VN');
    }
    
    const usersNewEl = document.getElementById('users-new');
    if (usersNewEl) {
        usersNewEl.textContent = '0 người dùng mới';
    }

    // Update suppliers count and new suppliers
    const suppliersCountEl = document.getElementById('suppliers-count');
    if (suppliersCountEl) {
        suppliersCountEl.textContent = counts.suppliers.toLocaleString('vi-VN');
    }
    
    const suppliersNewEl = document.getElementById('suppliers-new');
    if (suppliersNewEl) {
        suppliersNewEl.textContent = '0 NCC mới';
    }

    // Update reports count and monthly reports
    const reportsCountEl = document.getElementById('reports-count');
    if (reportsCountEl) {
        reportsCountEl.textContent = '0';
    }
    
    const reportsMonthlyEl = document.getElementById('reports-monthly');
    if (reportsMonthlyEl) {
        reportsMonthlyEl.textContent = 'Chưa có báo cáo';
    }
}

function setupQuickActions(quickActions) {
    const actionsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4.gap-4');
    if (!actionsContainer) return;

    actionsContainer.children[0].addEventListener('click', () => window.location.href = '/quan-ly-hang-hoa.html');
    actionsContainer.children[1].addEventListener('click', () => window.location.href = '/nhap-xuat-ton.html?mode=import');
    actionsContainer.children[2].addEventListener('click', () => window.location.href = '/nhap-xuat-ton.html?mode=export');
    actionsContainer.children[3].addEventListener('click', () => window.location.href = '/kiem-ke-bao-cao.html');
}

function updateRecentActivities(activities) {
    const activityContainer = document.getElementById('recent-activities');
    if (!activityContainer) return;

    activityContainer.innerHTML = '';

    activities.forEach(activity => {
        const activityElement = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center">
                        <i data-feather="${activity.icon}" class="w-4 h-4 text-${activity.color}-600"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                    <p class="text-sm text-gray-500">${activity.description}</p>
                    <p class="text-xs text-gray-400">${activity.time}</p>
                </div>
            </div>
        `;
        activityContainer.insertAdjacentHTML('beforeend', activityElement);
    });

    feather.replace();
}



// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${baseUrl}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers
        });

        if (response.ok) {
            // Update UI to show notification as read
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.add('opacity-60');
                const markReadBtn = notificationItem.querySelector('.mark-read-btn');
                if (markReadBtn) {
                    markReadBtn.remove();
                }
            }
            // Update notification count
            loadNotificationCount();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${baseUrl}/notifications/read-all`, {
            method: 'PUT',
            headers
        });

        if (response.ok) {
            // Update UI to show all notifications as read
            document.querySelectorAll('.notification-item').forEach(item => {
                item.classList.add('opacity-60');
                const markReadBtn = item.querySelector('.mark-read-btn');
                if (markReadBtn) {
                    markReadBtn.remove();
                }
            });
            // Update notification count
            loadNotificationCount();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Delete notification (for demo purposes, just hide it)
async function deleteNotification(notificationId) {
    try {
        // For demo purposes, just hide the notification
        // In a real app, you'd call an API to delete it
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.remove();
        }
        // Update notification count
        loadNotificationCount();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Initialize Feather icons
feather.replace();
