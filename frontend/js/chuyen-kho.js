document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const transferModal = document.getElementById('transferModal');
    const transferForm = document.getElementById('transferForm');
    const closeModalBtn = document.getElementById('closeTransferModal');
    const cancelTransferBtn = document.getElementById('cancelTransferBtn');
    const transfersTableBody = document.querySelector('#transfersTable tbody');
    const submitTransferBtn = document.querySelector('#transferForm button[type="submit"]');

    const addProductRowBtn = document.getElementById('addProductRowBtn');
    const productRowsContainer = document.getElementById('productRowsContainer');
    let warehouseProducts = []; // Cache products for the selected from_warehouse

    // Load initial data
    await loadTransfers();

    // Event listeners
    document.getElementById('openTransferModal').addEventListener('click', openTransferModal);
    document.getElementById('openTransferModal2').addEventListener('click', openTransferModal);
    
    if (addProductRowBtn) {
        addProductRowBtn.addEventListener('click', () => addProductRow());
    }
    
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
            const fromSelect = document.getElementById('from_warehouse_id');
            const toSelect = document.getElementById('to_warehouse_id');

            // If already loaded, skip
            if (fromSelect.options.length > 1) return;

            const response = await fetch('http://localhost:3000/warehouses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load warehouses');

            const warehouses = await response.json();

            // Clear existing options
            fromSelect.innerHTML = '<option value="">Chọn kho nguồn</option>';
            toSelect.innerHTML = '<option value="">Chọn kho đích</option>';

            // Add warehouses to both selects
            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.custom_id;
                option.textContent = warehouse.name;
                fromSelect.appendChild(option.cloneNode(true));
                toSelect.appendChild(option.cloneNode(true));
            });
        } catch (error) {
            console.error('Error loading warehouses:', error);
            alert('Lỗi tải danh sách kho: ' + error.message);
        }
    }

    async function loadWarehouseProducts(warehouseId) {
        try {
            if (!warehouseId) {
                warehouseProducts = [];
                return;
            }

            const response = await fetch(`http://localhost:3000/warehouses/${warehouseId}/products`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load products');

            warehouseProducts = await response.json();
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Lỗi tải danh sách sản phẩm: ' + error.message);
            warehouseProducts = [];
        }
    }

    function addProductRow(productId = '', quantity = '') {
        const rowId = Date.now() + Math.random();
        const rowHtml = `
            <div class="product-row grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-slide-up" data-row-id="${rowId}">
                <div class="col-span-7 space-y-1">
                    <label class="block text-xs font-semibold text-gray-500">Sản phẩm</label>
                    <div class="relative">
                        <select name="product_id" class="product-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white text-sm" required>
                            <option value="">Chọn sản phẩm</option>
                            ${warehouseProducts.map(p => `<option value="${p.id}" ${p.id === productId ? 'selected' : ''}>${p.name} (Tồn: ${p.quantity})</option>`).join('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <i data-feather="chevron-down" class="h-4 w-4"></i>
                        </div>
                    </div>
                </div>
                <div class="col-span-3 space-y-1">
                    <label class="block text-xs font-semibold text-gray-500">Số lượng</label>
                    <input type="number" name="quantity" value="${quantity}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm" min="1" required placeholder="SL">
                </div>
                <div class="col-span-2">
                    <button type="button" class="remove-row-btn w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex justify-center items-center" title="Xóa dòng">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        productRowsContainer.insertAdjacentHTML('beforeend', rowHtml);
        
        // Initialize Feather icons for the new row
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // Add event listener to remove button
        const newRow = productRowsContainer.lastElementChild;
        newRow.querySelector('.remove-row-btn').addEventListener('click', () => {
            if (productRowsContainer.querySelectorAll('.product-row').length > 1) {
                newRow.remove();
            } else {
                alert('Phải có ít nhất một sản phẩm');
            }
        });
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
                <td class="px-6 py-4 text-sm max-w-xs overflow-hidden">
                    <div class="flex flex-col">
                        <span class="font-semibold text-blue-700">${transfer.item_count} sản phẩm</span>
                        <span class="text-xs text-gray-500 truncate" title="${transfer.product_names || ''}">${transfer.product_names || ''}</span>
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
                        ${transfer.status === 'pending' || transfer.status === 'in_progress' ? `
                            <button onclick="updateTransferStatus(${transfer.id}, 'completed')" class="text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-lg transition-all duration-200 border border-green-300 hover:border-green-600" title="Hoàn thành">
                                <i data-feather="check-circle" class="w-4 h-4"></i>
                            </button>
                            <button onclick="updateTransferStatus(${transfer.id}, 'cancelled')" class="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all duration-200 border border-red-300 hover:border-red-600" title="Hủy bỏ">
                                <i data-feather="x-circle" class="w-4 h-4"></i>
                            </button>
                        ` : `
                            <span class="text-gray-400 italic text-xs">Không khả dụng</span>
                        `}
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

    async function openTransferModal() {
        if (transferModal) {
            // Reset form
            if (transferForm) {
                transferForm.reset();
                productRowsContainer.innerHTML = ''; // Clear rows
            }

            // Disable submit button until data loads
            if (submitTransferBtn) {
                submitTransferBtn.disabled = true;
                submitTransferBtn.textContent = 'Đang tải...';
            }

            // Show modal
            transferModal.classList.remove('hidden');

            // Trigger animation
            const modalContent = transferModal.querySelector('.rounded-2xl');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }

            // Load warehouses
            await loadWarehouses();

            // Set up event listeners for warehouse changes
            const fromWarehouseSelect = document.getElementById('from_warehouse_id');
            const toWarehouseSelect = document.getElementById('to_warehouse_id');

            fromWarehouseSelect.onchange = async (e) => {
                const warehouseId = e.target.value;
                await loadWarehouseProducts(warehouseId);
                
                // Clear existing rows and add a fresh one with new product list
                productRowsContainer.innerHTML = '';
                if (warehouseId) {
                    addProductRow();
                }
            };

            toWarehouseSelect.onchange = (e) => {
                if (e.target.value && e.target.value === fromWarehouseSelect.value) {
                    alert('Kho nguồn và kho đích không thể giống nhau');
                    e.target.value = '';
                }
            };

            if (submitTransferBtn) {
                submitTransferBtn.disabled = false;
                submitTransferBtn.textContent = 'Tạo phiếu điều chuyển';
            }
        }
    }

    function closeTransferModal() {
        if (transferModal) {
            const modalContent = transferModal.querySelector('.rounded-2xl');
            if (modalContent) {
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
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
            const from_warehouse_id = formData.get('from_warehouse_id');
            const to_warehouse_id = formData.get('to_warehouse_id');
            const notes = formData.get('notes');

            // Collect items from rows
            const items = [];
            const rows = productRowsContainer.querySelectorAll('.product-row');
            
            rows.forEach(row => {
                const productId = row.querySelector('[name="product_id"]').value;
                const quantity = parseInt(row.querySelector('[name="quantity"]').value);
                
                if (productId && quantity > 0) {
                    items.push({ product_id: productId, quantity });
                }
            });

            // Validate
            if (!from_warehouse_id || !to_warehouse_id || items.length === 0) {
                alert('Vui lòng điền đầy đủ thông tin và ít nhất một sản phẩm');
                return;
            }

            // Check for duplicate products in items
            const productIds = items.map(i => i.product_id);
            if (new Set(productIds).size !== productIds.length) {
                alert('Có sản phẩm bị trùng lặp trong danh sách. Vui lòng gộp chung hoặc xóa bớt.');
                return;
            }

            // Check stock for each item
            for (const item of items) {
                const product = warehouseProducts.find(p => p.id === item.product_id);
                if (!product || product.quantity < item.quantity) {
                    alert(`Sản phẩm "${product ? product.name : item.product_id}" không đủ tồn kho (Hiện có: ${product ? product.quantity : 0})`);
                    return;
                }
            }

            const response = await fetch('http://localhost:3000/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    from_warehouse_id,
                    to_warehouse_id,
                    items,
                    notes
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create transfer');
            }

            alert('Tạo phiếu điều chuyển thành công!');
            closeTransferModal();
            loadTransfers();
            
        } catch (error) {
            console.error('Error submitting transfer:', error);
            alert('Lỗi: ' + error.message);
        }
    }

    window.updateTransferStatus = async function(transferId, status) {
        if (status === 'cancelled' && !confirm('Bạn có chắc chắn muốn hủy phiếu điều chuyển này?')) {
            return;
        }

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
                throw new Error(error.error || 'Failed to update status');
            }

            alert('Cập nhật trạng thái thành công!');
            loadTransfers();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Lỗi: ' + error.message);
        }
    };
});