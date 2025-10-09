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
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Không tìm thấy sản phẩm nào</td></tr>`;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            // Format date to DD/MM/YYYY
            const createdDate = new Date(product.created_at);
            const formattedDate = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}/${createdDate.getFullYear()}`;

            // Create row HTML directly for better performance
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.description || 'Chưa có mô tả'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Intl.NumberFormat('vi-VN').format(product.price)} ₫</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.quantity || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.supplier_name || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button type="button" class="text-blue-600 hover:text-blue-800 edit-btn" data-id="${product.id}" data-name="${product.name}" data-description="${product.description || ''}" data-price="${product.price}" data-brand="${product.brand || ''}" data-supplier-id="${product.supplier_id || ''}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button type="button" class="text-green-600 hover:text-green-800 view-btn" data-id="${product.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button type="button" class="text-red-600 hover:text-red-800 delete-btn" data-id="${product.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });
    };

    let currentPage = 1;
    const limit = 10;

    const renderPagination = (totalPages) => {
        const paginationContainer = document.getElementById('pagination-buttons');
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
                loadProducts(searchInput.value.trim(), currentPage);
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
                loadProducts(searchInput.value.trim(), currentPage);
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
                loadProducts(searchInput.value.trim(), currentPage);
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
                loadProducts(searchInput.value.trim(), currentPage);
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
                loadProducts(searchInput.value.trim(), currentPage);
            }
        });
        paginationContainer.appendChild(nextButton);
    };

    async function loadProducts(searchTerm = '', page = 1) {
        try {
            const brandFilter = document.getElementById('brand-filter')?.value || '';
            const supplierFilter = document.getElementById('supplier-filter')?.value || '';

            // Build query parameters
            const queryParams = new URLSearchParams({
                search: searchTerm,
                page: page,
                limit: limit
            });

            // Add filter parameters if they have values
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
            const totalProductsStat = document.getElementById('total-products-count');
            if (totalProductsStat) {
                totalProductsStat.textContent = totalCount;
            }

            // Update pagination info
            const infoDiv = document.getElementById('pagination-info');
            if (infoDiv && totalCount > 0) {
                const start = (currentPage - 1) * limit + 1;
                const end = Math.min(currentPage * limit, totalCount);
                infoDiv.innerHTML = `Hiển thị <span class="font-medium">${start}</span> đến <span class="font-medium">${end}</span> của <span class="font-medium">${totalCount}</span> kết quả`;
            }

            // For low stock, set to 0 for now
            const lowStockStat = document.getElementById('low-stock-count');
            if (lowStockStat) lowStockStat.textContent = '0';
    
        } catch (error) {
            console.error('Error loading products:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
        }
    }
    
    // Start polling for real-time updates
    function startPolling() {
        pollInterval = setInterval(() => {
            const searchTerm = searchInput.value.trim();
            loadProducts(searchTerm, currentPage);
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
        const viewBtn = e.target.closest('.view-btn');

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
            const productBrand = editBtn.getAttribute('data-brand');
            const supplierId = editBtn.getAttribute('data-supplier-id');

            showEditModal(productId, productName, productDescription, productPrice, productBrand, supplierId);
        }

        if (viewBtn) {
            const productId = viewBtn.getAttribute('data-id');
            showViewModal(productId);
        }
    });
    
    const showViewModal = async (id) => {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/products/${id}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch product details');

            const product = await response.json();

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg w-full max-w-md">
                    <h3 class="text-xl font-semibold mb-4">Chi tiết sản phẩm</h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">ID</label>
                            <p class="text-sm text-gray-900">${product.id}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                            <p class="text-sm text-gray-900">${product.name}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Mô tả</label>
                            <p class="text-sm text-gray-900">${product.description || 'Chưa có mô tả'}</p>
                        </div>
                         <div>
                             <label class="block text-sm font-medium text-gray-700">Giá</label>
                             <p class="text-sm text-gray-900">${new Intl.NumberFormat('vi-VN').format(product.price)} ₫</p>
                         </div>
                         <div>
                             <label class="block text-sm font-medium text-gray-700">Nhãn hiệu</label>
                             <p class="text-sm text-gray-900">${product.brand || 'N/A'}</p>
                         </div>
                         <div>
                             <label class="block text-sm font-medium text-gray-700">Số lượng</label>
                             <p class="text-sm text-gray-900">${product.quantity || 0}</p>
                         </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                            <p class="text-sm text-gray-900">${product.supplier_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Ngày tạo</label>
                            <p class="text-sm text-gray-900">${new Date(product.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="button" class="bg-gray-300 px-4 py-2 rounded" id="closeViewBtn">Đóng</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('closeViewBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        } catch (error) {
            alert('Lỗi tải chi tiết sản phẩm: ' + error.message);
        }
    };

    const showEditModal = (id, name, description, price, brand, supplierId) => {
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
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Nhãn hiệu</label>
                     <input type="text" id="editProductBrand" class="w-full border rounded px-3 py-2" value="${brand}">
                 </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                     <select id="supplier-filter-modal" class="w-full border rounded px-3 py-2"></select>
                 </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="bg-gray-300 px-4 py-2 rounded" id="cancelEditBtn">Hủy</button>
                    <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded" id="saveEditBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const supplierFilterModal = document.getElementById('supplier-filter-modal');
        const supplierFilter = document.getElementById('supplier-filter');
        supplierFilterModal.innerHTML = supplierFilter.innerHTML;
        supplierFilterModal.value = supplierId || 'all';

        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const updatedName = document.getElementById('editProductName').value;
            const updatedDescription = document.getElementById('editProductDescription').value;
            const updatedPrice = parseFloat(document.getElementById('editProductPrice').value);
            const updatedBrand = document.getElementById('editProductBrand').value;
            const updatedSupplierId = supplierFilterModal.value;

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
                        price: updatedPrice,
                        brand: updatedBrand,
                        supplierId: updatedSupplierId
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
                     <label class="block text-sm font-medium text-gray-700 mb-1">Nhãn hiệu</label>
                     <input type="text" id="productBrand" class="w-full border rounded px-3 py-2" placeholder="Nhập nhãn hiệu sản phẩm">
                 </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                     <input type="number" id="productQuantity" class="w-full border rounded px-3 py-2" min="0">
                 </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <select id="supplier-filter-modal" class="w-full border rounded px-3 py-2"></select>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="bg-gray-300 px-4 py-2 rounded" id="cancelBtn">Hủy</button>
                    <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded" id="saveBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const supplierFilterModal = document.getElementById('supplier-filter-modal');
        const supplierFilter = document.getElementById('supplier-filter');
        supplierFilterModal.innerHTML = supplierFilter.innerHTML;

        document.getElementById('saveBtn').addEventListener('click', async () => {
            const name = document.getElementById('productName').value;
            const description = document.getElementById('productDescription').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const brand = document.getElementById('productBrand').value;
            const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
            const supplierId = supplierFilterModal.value;

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
                    body: JSON.stringify({ name, description, price, brand, quantity, supplierId })
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
                        // Export products to CSV
                        exportProductsToCSV();
                        break;
                    case 'printer':
                        // Print products table
                        printProductsTable();
                        break;
                }
            }
        });
    });

    // Export products to CSV
    async function exportProductsToCSV() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/products/export`, { headers });
            if (!response.ok) throw new Error('Failed to export products');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Xuất dữ liệu thành công');
        } catch (error) {
            console.error('Error exporting products:', error);
            alert('Lỗi xuất dữ liệu');
        }
    }

    // Print products table
    function printProductsTable() {
        const printWindow = window.open('', '_blank');
        const tableHTML = document.querySelector('table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Danh sách sản phẩm</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Danh sách sản phẩm</h1>
                    ${tableHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    // Load suppliers for filter dropdown
    async function loadSuppliersForFilter() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${baseUrl}/suppliers`, { headers });
            if (!response.ok) throw new Error('Failed to fetch suppliers');

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
            console.error('Error loading suppliers:', error);
        }
    }

    (async () => {
        await loadSuppliersForFilter();
        loadProducts();
    })();
});
