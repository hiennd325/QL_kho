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
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i data-feather="inbox" class="w-12 h-12 text-gray-300 mb-3"></i>
                            <p class="text-lg font-medium">Chưa có dữ liệu điều chuyển</p>
                            <p class="text-sm mt-1">Hãy tạo phiếu điều chuyển đầu tiên</p>
                        </div>
                    </td>
                </tr>
            `;
            // Initialize Feather icons
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
            return;
        }
        
        transfersTableBody.innerHTML = transfers.map((transfer, index) => `
            <tr class="hover:bg-blue-50 transition-all duration-150 border-b border-gray-100 animate-fade-in" style="animation-delay: ${index * 50}ms">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div class="flex items-center">
                        <div class="bg-blue-100 p-2 rounded-lg mr-3">
                            <i data-feather="tag" class="w-4 h-4 text-blue-600"></i>
                        </div>
                        ${transfer.code}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div class="flex items-center">
                        <i data-feather="calendar" class="w-4 h-4 text-gray-400 mr-2"></i>
                        ${transfer.date}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center">
                        <div class="bg-green-100 p-1 rounded mr-2">
                            <i data-feather="home" class="w-3 h-3 text-green-600"></i>
                        </div>
                        <span class="font-medium">${transfer.from_warehouse}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center">
                        <div class="bg-indigo-100 p-1 rounded mr-2">
                            <i data-feather="navigation" class="w-3 h-3 text-indigo-600"></i>
                        </div>
                        <span class="font-medium">${transfer.to_warehouse}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-1 rounded mr-2">
                            <i data-feather="package" class="w-3 h-3 text-yellow-600"></i>
                        </div>
                        <span class="font-semibold">${transfer.quantity}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 text-xs font-semibold ${getStatusClass(transfer.status)} rounded-full inline-flex items-center">
                        ${getStatusIcon(transfer.status)}
                        <span class="ml-1">${getStatusText(transfer.status)}</span>
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="updateTransferStatus(${transfer.id}, 'completed')" class="text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-lg transition-all duration-200 border border-green-300 hover:border-green-600">
                            <i data-feather="check-circle" class="w-4 h-4"></i>
                        </button>
                        <button onclick="updateTransferStatus(${transfer.id}, 'cancelled')" class="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all duration-200 border border-red-300 hover:border-red-600">
                            <i data-feather="x-circle" class="w-4 h-4"></i>
                        </button>
                    </div>
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

    function getStatusIcon(status) {
        switch (status) {
            case 'completed':
                return '<i data-feather="check-circle" class="w-3 h-3"></i>';
            case 'in_progress':
                return '<i data-feather="loader" class="w-3 h-3"></i>';
            case 'pending':
                return '<i data-feather="clock" class="w-3 h-3"></i>';
            case 'cancelled':
                return '<i data-feather="x-circle" class="w-3 h-3"></i>';
            default:
                return '<i data-feather="help-circle" class="w-3 h-3"></i>';
        }
    }

    function openTransferModal() {
        if (transferModal) {
            // Reset form
            if (transferForm) {
                transferForm.reset();
            }
            
            // Reset select options to show placeholder
            const selects = transferForm.querySelectorAll('select');
            selects.forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Show modal with enhanced animation
            transferModal.classList.remove('hidden');
            
            // Trigger animation
            const modalContent = transferModal.querySelector('.rounded-2xl');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
                modalContent.classList.add('opacity-100');
            }
            
            // Focus on first input
            setTimeout(() => {
                const firstSelect = document.getElementById('from_warehouse_id');
                if (firstSelect) firstSelect.focus();
            }, 300);
        }
    }

    function closeTransferModal() {
        if (transferModal) {
            // Add closing animation
            const modalContent = transferModal.querySelector('.rounded-2xl');
            if (modalContent) {
                modalContent.classList.remove('scale-100');
                modalContent.classList.remove('opacity-100');
                modalContent.classList.add('scale-95');
                modalContent.classList.add('opacity-0');
                
                // Hide modal after animation completes
                setTimeout(() => {
                    transferModal.classList.add('hidden');
                }, 300);
            } else {
                transferModal.classList.add('hidden');
            }
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