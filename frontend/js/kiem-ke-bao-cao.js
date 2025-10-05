document.addEventListener('DOMContentLoaded', async () => {
    const tabs = document.querySelectorAll('.flex.px-6 button');
    const tabContents = {
        'Phiếu kiểm kê': document.getElementById('kiem-ke-tab'),
        'Báo cáo tồn kho': document.getElementById('bao-cao-ton-kho-tab'),
        'Báo cáo nhập/xuất': document.getElementById('bao-cao-nhap-xuat-tab'),
    };

    const setActiveTab = (tabName) => {
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
            const response = await fetch(`${baseUrl}/reports/audits`, { headers });
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
            const response = await fetch(`${baseUrl}/reports/inventory`, { headers });
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
            const response = await fetch(`${baseUrl}/inventory/transactions`, { headers });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const transactions = await response.json();

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

    loadAudits();
    loadInventoryReport();
    loadImportExportChart();
});
