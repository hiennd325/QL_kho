document.addEventListener('DOMContentLoaded', async () => {
    try {
        const dashboardData = await fetchDashboardData();
        if (!dashboardData) return;
        updateAlerts(dashboardData.alerts);
        updateStats(dashboardData.stats);
        setupQuickActions(dashboardData.quickActions);
        updateRecentActivities(dashboardData.recentActivities);
        feather.replace();
        
        // Setup event listeners for quick action forms
        setupQuickActionForms();
        
        // Setup event listeners for quick actions modal
        setupQuickActionsModal();
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
            
            // Here you would typically send data to the backend
            console.log('Adding product:', { productName, productCode, quantity });
            alert(`Đã thêm sản phẩm: ${productName}`);
            
            // Reset form
            addProductForm.reset();
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
            
            // Here you would typically send data to the backend
            console.log('Importing stock:', { productCode, quantity, supplier });
            alert(`Đã nhập kho ${quantity} sản phẩm mã ${productCode}`);
            
            // Reset form
            importStockForm.reset();
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
            
            // Here you would typically send data to the backend
            console.log('Exporting stock:', { productCode, quantity, customer });
            alert(`Đã xuất kho ${quantity} sản phẩm mã ${productCode}`);
            
            // Reset form
            exportStockForm.reset();
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
            
            // Here you would typically send data to the backend
            console.log('Generating report:', { reportType, reportPeriod });
            alert(`Đã tạo báo cáo ${reportType} theo kỳ ${reportPeriod}`);
            
            // Reset form
            generateReportForm.reset();
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

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Use absolute URL with port 3000 for backend API
        const baseUrl = `http://localhost:3000`;
        
        const [alertsRes, statsRes, activitiesRes] = await Promise.all([
            fetch(`${baseUrl}/dashboard/alerts`, { headers }),
            fetch(`${baseUrl}/dashboard/stats`, { headers }),
            fetch(`${baseUrl}/dashboard/recent-activities`, { headers })
        ]);

        // Check for unauthorized responses (401)
        if (alertsRes.status === 401 || statsRes.status === 401 || activitiesRes.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        if (!alertsRes.ok || !statsRes.ok || !activitiesRes.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const alertsData = await alertsRes.json();
        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();
        return {
            alerts: alertsData,
            stats: statsData,
            recentActivities: activitiesData
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
    statsContainer.children[3].querySelector('.text-2xl').textContent = `${(stats.totalValue / 1000000000).toFixed(1)}B VNĐ`;
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
    const activityContainer = document.querySelector('.bg-white.rounded-lg.shadow-md .space-y-4');
    if (!activityContainer) return;

    activityContainer.innerHTML = '';

    activities.forEach(activity => {
        const activityElement = `
            <div class="flex items-start">
                <div class="p-2 rounded-full bg-${activity.color}-100 text-${activity.color}-600 mr-3">
                    <i data-feather="${activity.icon}" class="h-4 w-4"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium">${activity.title}</p>
                    <p class="text-sm text-gray-500">${activity.description}</p>
                </div>
            </div>
        `;
        activityContainer.insertAdjacentHTML('beforeend', activityElement);
    });

    feather.replace();
}



// Initialize Feather icons
feather.replace();
