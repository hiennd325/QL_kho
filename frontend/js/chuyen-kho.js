document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const transferModal = document.getElementById('transferModal');
    const transferForm = document.getElementById('transferForm');
    const closeModalBtn = document.getElementById('closeTransferModal');
    const cancelTransferBtn = document.getElementById('cancelTransferBtn');
    const transfersTableBody = document.querySelector('#transfersTable tbody');

    // Load initial data
    await loadWarehouses();
    await loadProducts();
    await loadTransfers();

    // Event listeners
    document.getElementById('openTransferModal').addEventListener('click', openTransferModal);
        document.getElementById('openTransferModal2').addEventListener('click', openTransferModal);
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTransferModal);
    }
    
    if (cancelTransferBtn) {
        cancelTransferBtn.addEventListener('click', closeTransferModal);
    }

    // Close modal when clicking outside
    if (transferModal) {
        transferModal.addEventListener('click', (e) => {
            if (e.target === transferModal) {
                closeTransferModal();
            }
        });
    }

    // Form submission
    if (transferForm) {
        transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitTransfer();
        });
    }

    // Helper functions
    async function loadWarehouses() {
        try {
            const response = await fetch('http://localhost:3000/warehouses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load warehouses');
            
            const warehouses = await response.json();
            const fromSelect = document.getElementById('from_warehouse_id');
            const toSelect = document.getElementById('to_warehouse_id');
            
            // Clear existing options
            fromSelect.innerHTML = '<option value="">Chọn kho nguồn</option>';
            toSelect.innerHTML = '<option value="">Chọn kho đích</option>';
            
            // Add warehouses to both selects
            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                fromSelect.appendChild(option.cloneNode(true));
                toSelect.appendChild(option.cloneNode(true));
            });
        } catch (error) {
            console.error('Error loading warehouses:', error);
            alert('Lỗi tải danh sách kho: ' + error.message);
        }
    }

    async function loadProducts() {
        try {
            const response = await fetch('http://localhost:3000/products', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load products');
            
            const data = await response.json();
            const products = data.products || data;
            const select = document.getElementById('product_id');
            
            // Clear existing options
            select.innerHTML = '<option value="">Chọn sản phẩm</option>';
            
            // Add products to select
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.quantity} tồn kho)`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Lỗi tải danh sách sản phẩm: ' + error.message);
        }
    }

    async function loadTransfers() {
        try {
            const response = await fetch('http://localhost:3000/transfers?limit=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load transfers');
            
            const transfers = await response.json();
            renderTransfers(transfers);
        } catch (error) {
            console.error('Error loading transfers:', error);
            renderTransfers([]); // Render empty state
        }
    }

    function renderTransfers(transfers) {
        if (!transfersTableBody) return;
        
        if (transfers.length === 0) {
            transfersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        Chưa có dữ liệu điều chuyển
                    </td>
                </tr>
            `;
            return;
        }
        
        transfersTableBody.innerHTML = transfers.map(transfer => `
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
                    <button onclick="updateTransferStatus(${transfer.id}, 'completed')" class="text-green-600 hover:text-green-900 mr-2">
                        <i data-feather="check-circle"></i>
                    </button>
                    <button onclick="updateTransferStatus(${transfer.id}, 'cancelled')" class="text-red-600 hover:text-red-900">
                        <i data-feather="x-circle"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
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

    function openTransferModal() {
        if (transferModal) {
            transferModal.classList.remove('hidden');
            // Reset form
            if (transferForm) {
                transferForm.reset();
            }
        }
    }

    function closeTransferModal() {
        if (transferModal) {
            transferModal.classList.add('hidden');
        }
    }

    async function submitTransfer() {
        try {
            const formData = new FormData(transferForm);
            const transferData = {
                from_warehouse_id: parseInt(formData.get('from_warehouse_id')),
                to_warehouse_id: parseInt(formData.get('to_warehouse_id')),
                product_id: parseInt(formData.get('product_id')),
                quantity: parseInt(formData.get('quantity')),
                notes: formData.get('notes')
            };

            // Validate data
            if (!transferData.from_warehouse_id || !transferData.to_warehouse_id || 
                !transferData.product_id || !transferData.quantity) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            if (transferData.from_warehouse_id === transferData.to_warehouse_id) {
                alert('Kho nguồn và kho đích không thể giống nhau');
                return;
            }

            if (transferData.quantity <= 0) {
                alert('Số lượng phải lớn hơn 0');
                return;
            }

            const response = await fetch('http://localhost:3000/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(transferData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create transfer');
            }

            const result = await response.json();
            alert('Tạo phiếu điều chuyển thành công!');
            closeTransferModal();
            loadTransfers(); // Refresh transfers list
            
        } catch (error) {
            console.error('Error submitting transfer:', error);
            alert('Lỗi khi tạo phiếu điều chuyển: ' + error.message);
        }
    }

    // Make functions available globally for inline event handlers
    window.updateTransferStatus = async function(transferId, status) {
        try {
            const response = await fetch(`http://localhost:3000/transfers/${transferId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update transfer status');
            }

            alert('Cập nhật trạng thái thành công!');
            loadTransfers(); // Refresh transfers list
            
        } catch (error) {
            console.error('Error updating transfer status:', error);
            alert('Lỗi khi cập nhật trạng thái: ' + error.message);
        }
    };
});