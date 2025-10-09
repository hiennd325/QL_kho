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
    const closeInventoryCountModal = document.getElementById('closeInventoryCountModal');
    const cancelInventoryCountBtn = document.getElementById('cancelInventoryCountBtn');

    // Button
    const createInventoryCountBtn = document.querySelector('.bg-blue-600.text-white.px-4.py-2.rounded-lg.hover\\:bg-blue-700.flex.items-center');

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

    async function loadAudits() {
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
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (warehouseFilter && warehouseFilter !== 'Tất cả kho') {
                queryParams.append('warehouse', warehouseFilter);
            }
            if (statusFilter && statusFilter !== 'Tất cả trạng thái') {
                const statusMap = {
                    'Đã cân bằng': 'balanced',
                    'Chờ xử lý': 'pending',
                    'Đã hủy': 'cancelled'
                };
                queryParams.append('status', statusMap[statusFilter]);
            }

            const response = await fetch(`${baseUrl}/reports/audits?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch audits');
            const audits = await response.json();

            const tableBody = document.querySelector('#kiem-ke-tab tbody');
            tableBody.innerHTML = '';
            audits.forEach(audit => {
                const row = document.createElement('tr');
                row.className = 'table-row hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${audit.code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(audit.date).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${audit.warehouse}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${audit.createdBy}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-${audit.discrepancy >= 0 ? 'green' : 'red'}-600">
                        ${audit.discrepancy >= 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN').format(Math.abs(audit.discrepancy))} ₫
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium bg-${audit.status === 'completed' ? 'green' : 'yellow'}-100 text-${audit.status === 'completed' ? 'green' : 'yellow'}-800 rounded-full">
                            ${audit.status === 'completed' ? 'Đã cân bằng' : 'Chờ xử lý'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800"><i data-feather="eye" class="h-4 w-4"></i></button>
                            <button class="text-green-600 hover:text-green-800"><i data-feather="download" class="h-4 w-4"></i></button>
                            <button class="text-red-600 hover:text-red-800"><i data-feather="trash-2" class="h-4 w-4"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            feather.replace();
        } catch (error) {
            console.error('Error loading audits:', error);
        }
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
                row.className = 'table-row hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading inventory report:', error);
        }
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

    if (closeInventoryCountModal) {
        closeInventoryCountModal.addEventListener('click', closeInventoryCountModal);
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

    if (inventoryCountForm) {
        inventoryCountForm.addEventListener('submit', handleInventoryCountFormSubmit);
    }

    // Add event listeners for filter inputs and buttons
    const filterInputs = document.querySelectorAll('input[type="date"], select');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            loadAudits(); // Reload audits with filters
            loadInventoryReport();
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
                        // Export reports to CSV
                        exportReportsToCSV();
                        break;
                    case 'printer':
                        // Print current tab content
                        printCurrentTab();
                        break;
                }
            }
        });
    });

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
});
