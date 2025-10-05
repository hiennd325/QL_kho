let pollInterval;

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const addProductButton = document.querySelector('.add-product-btn');
    const searchInput = document.getElementById('search-input');

    let currentProducts = [];
    
    const renderProducts = (products) => {
        // Check if products have actually changed
        if (JSON.stringify(products) === JSON.stringify(currentProducts)) {
            return; // No changes, no need to re-render
        }
        
        // Update current products
        currentProducts = products;
        
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Không tìm thấy sản phẩm nào</td></tr>`;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'table-row hover:bg-gray-50';
            // Format date to DD/MM/YYYY
            const createdDate = new Date(product.created_at);
            const formattedDate = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}/${createdDate.getFullYear()}`;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.description || 'Chưa có mô tả'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Intl.NumberFormat('vi-VN').format(product.price)} ₫</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.quantity || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 edit-btn" data-id="${product.id}" data-name="${product.name}" data-description="${product.description || ''}" data-price="${product.price}">
                            <i data-feather="edit" class="h-4 w-4"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800 view-btn" data-id="${product.id}">
                            <i data-feather="eye" class="h-4 w-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 delete-btn" data-id="${product.id}">
                            <i data-feather="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        feather.replace();
    };

    let currentPage = 1;
    const limit = 10;

    const renderPagination = (totalPages) => {
        const paginationContainer = document.querySelector('.flex.space-x-2');
        paginationContainer.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        prevButton.textContent = 'Trước';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadProducts(searchInput.value.trim(), currentPage);
            }
        });
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
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
                loadProducts(searchInput.value.trim(), currentPage);
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.className = 'px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50';
        nextButton.textContent = 'Sau';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadProducts(searchInput.value.trim(), currentPage);
            }
        });
        paginationContainer.appendChild(nextButton);
    };

    async function loadProducts(searchTerm = '', page = 1) {
        try {
            // Get filter values
            const categoryFilter = document.getElementById('category-filter')?.value || '';
            const brandFilter = document.getElementById('brand-filter')?.value || '';
            const supplierFilter = document.getElementById('supplier-filter')?.value || '';
            
            // Build query parameters
            const queryParams = new URLSearchParams({
                search: searchTerm,
                page: page,
                limit: limit
            });
            
            // Add filter parameters if they have values
            if (categoryFilter && categoryFilter !== 'all') {
                queryParams.append('category', categoryFilter);
            }
            
            if (brandFilter && brandFilter !== 'all') {
                queryParams.append('brand', brandFilter);
            }
            
            if (supplierFilter && supplierFilter !== 'all') {
                queryParams.append('supplier', supplierFilter);
            }
            
            // Use absolute URL with port 3000 for backend API
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${baseUrl}/products?${queryParams.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const { products, totalPages, totalCount = 0 } = await response.json();
            renderProducts(products);
            renderPagination(totalPages);
    
            // Update quick stats
            const totalProductsStat = document.querySelector('main .grid .bg-white p.text-2xl.font-bold.text-gray-900');
            if (totalProductsStat) {
                totalProductsStat.textContent = totalCount;
            }
    
            // Update pagination info
            const infoDiv = document.querySelector('.bg-white.px-6.py-4.border-t .text-sm.text-gray-700');
            if (infoDiv && totalCount > 0) {
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, totalCount);
                infoDiv.innerHTML = `Hiển thị <span class="font-medium">${start}</span> đến <span class="font-medium">${end}</span> của <span class="font-medium">${totalCount}</span> kết quả`;
            }
    
            // For low stock, set to 0 for now
            const lowStockStat = document.querySelector('main .grid .bg-white:nth-child(2) p.text-2xl.font-bold');
            if (lowStockStat) lowStockStat.textContent = '0';
    
        } catch (error) {
            console.error('Error loading products:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
        }
    }
    
    // Start polling for real-time updates
    function startPolling() {
        pollInterval = setInterval(() => {
            const searchTerm = searchInput.value.trim();
            loadProducts(searchTerm);
        }, 10000); // Poll every 10 seconds to reduce server load
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
    
    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        const editBtn = e.target.closest('.edit-btn');
        
        if (deleteBtn) {
            const productId = deleteBtn.getAttribute('data-id');
            if (confirm('Xác nhận xóa sản phẩm này?')) {
                try {
                    const baseUrl = `http://localhost:3000`;
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${baseUrl}/products/${productId}`, {
                        method: 'DELETE',
                        headers
                    });
                    if (response.ok) {
                        loadProducts();
                    } else {
                        throw new Error('Xóa thất bại');
                    }
                } catch (error) {
                    alert(error.message);
                }
            }
        }
        
        if (editBtn) {
            const productId = editBtn.getAttribute('data-id');
            const productName = editBtn.getAttribute('data-name');
            const productDescription = editBtn.getAttribute('data-description');
            const productPrice = editBtn.getAttribute('data-price');
            
            showEditModal(productId, productName, productDescription, productPrice);
        }
    });
    
    const showEditModal = (id, name, description, price) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">Chỉnh sửa sản phẩm</h3>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                    <input type="text" id="editProductName" class="w-full border rounded px-3 py-2" value="${name}">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea id="editProductDescription" class="w-full border rounded px-3 py-2" rows="3">${description}</textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                    <input type="number" id="editProductPrice" class="w-full border rounded px-3 py-2" value="${price}">
                </div>
                <div class="flex justify-end space-x-2">
                    <button class="bg-gray-300 px-4 py-2 rounded" id="cancelEditBtn">Hủy</button>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded" id="saveEditBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const updatedName = document.getElementById('editProductName').value;
            const updatedDescription = document.getElementById('editProductDescription').value;
            const updatedPrice = parseFloat(document.getElementById('editProductPrice').value);
            
            if (!updatedName || !updatedPrice) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }
            
            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({
                        name: updatedName,
                        description: updatedDescription,
                        price: updatedPrice
                    })
                });
                
                if (response.ok) {
                    loadProducts();
                    document.body.removeChild(modal);
                } else {
                    throw new Error('Cập nhật sản phẩm thất bại');
                }
            } catch (error) {
                alert(error.message);
            }
        });
        
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    };
    
    addProductButton.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">Thêm sản phẩm mới</h3>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                    <input type="text" id="productName" class="w-full border rounded px-3 py-2">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea id="productDescription" class="w-full border rounded px-3 py-2" rows="3"></textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                    <input type="number" id="productPrice" class="w-full border rounded px-3 py-2">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                    <input type="number" id="productQuantity" class="w-full border rounded px-3 py-2" min="0">
                </div>
                <div class="flex justify-end space-x-2">
                    <button class="bg-gray-300 px-4 py-2 rounded" id="cancelBtn">Hủy</button>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded" id="saveBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('saveBtn').addEventListener('click', async () => {
            const name = document.getElementById('productName').value;
            const description = document.getElementById('productDescription').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const quantity = parseInt(document.getElementById('productQuantity').value) || 0;

            if (!name || !price) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({ name, description, price, quantity })
                });

                if (response.ok) {
                    loadProducts();
                    document.body.removeChild(modal);
                } else {
                    throw new Error('Thêm sản phẩm thất bại');
                }
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    });
    
    // Debounce function to limit API calls
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    };
    
    // Improved search with debounce
    const debouncedSearch = debounce((query) => {
        loadProducts(query);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        debouncedSearch(query);
    });
    
    // Add event listeners for filter selects
    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            // Reset to first page when filters change
            currentPage = 1;
            loadProducts(searchInput.value.trim(), currentPage);
        });
    });
    
    loadProducts();
// Load suppliers for filter
async function loadSuppliersForFilter() {
    try {
        const baseUrl = `http://localhost:3000`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${baseUrl}/suppliers`, { headers });
        if (!response.ok) {
            throw new Error('Không thể tải danh sách nhà cung cấp');
        }
        
        const suppliers = await response.json();
        const supplierFilter = document.getElementById('supplier-filter');
        if (supplierFilter) {
            supplierFilter.innerHTML = '<option value="all">Tất cả NCC</option>';
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                supplierFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải nhà cung cấp cho filter:', error);
    }
}

loadSuppliersForFilter();
loadProducts();
});
