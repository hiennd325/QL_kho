document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const addSupplierButton = document.querySelector('.add-supplier-btn');
    const searchInput = document.getElementById('search-input');

    const renderSuppliers = (suppliers) => {
        tableBody.innerHTML = '';
        if (suppliers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Không tìm thấy nhà cung cấp nào</td></tr>`;
            return;
        }

        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${supplier.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.address || 'Chưa có địa chỉ'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.phone || 'Chưa có SĐT'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.email || 'Chưa có email'}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div class="flex space-x-2">
                         <button type="button" class="text-blue-600 hover:text-blue-800 edit-btn" data-id="${supplier.id}" data-name="${supplier.name}" data-address="${supplier.address || ''}" data-phone="${supplier.phone || ''}" data-email="${supplier.email || ''}">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                 <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                 <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                             </svg>
                         </button>
                         <button type="button" class="text-red-600 hover:text-red-800 delete-btn" data-id="${supplier.id}">
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

    async function loadSuppliers(searchTerm = '') {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/suppliers?search=${searchTerm}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch suppliers');
            const suppliers = await response.json();
            renderSuppliers(suppliers);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
        }
    }

    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        const editBtn = e.target.closest('.edit-btn');

        if (deleteBtn) {
            const supplierId = deleteBtn.dataset.id;
            if (confirm('Xác nhận xóa nhà cung cấp này?')) {
                try {
                    const baseUrl = `http://localhost:3000`;
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${baseUrl}/suppliers/${supplierId}`, {
                        method: 'DELETE',
                        headers
                    });
                     if (response.ok) {
                         loadSuppliers();
                     } else {
                         throw new Error('Xóa thất bại');
                     }
                } catch (error) {
                    console.error('Lỗi khi xóa nhà cung cấp:', error);
                    alert('Lỗi khi xóa nhà cung cấp.');
                }
            }
        }

        if (editBtn) {
            const supplierId = editBtn.dataset.id;
            const supplierName = editBtn.dataset.name;
            const supplierAddress = editBtn.dataset.address;
            const supplierPhone = editBtn.dataset.phone;
            const supplierEmail = editBtn.dataset.email;
            showEditModal(supplierId, supplierName, supplierAddress, supplierPhone, supplierEmail);
        }
    });

    const showEditModal = (id, name, address, phone, email) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">Chỉnh sửa nhà cung cấp</h3>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp</label>
                    <input type="text" id="editSupplierName" class="w-full border rounded px-3 py-2" value="${name}">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input type="text" id="editSupplierAddress" class="w-full border rounded px-3 py-2" value="${address}">
                </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                     <input type="text" id="editSupplierPhone" class="w-full border rounded px-3 py-2" value="${phone}">
                 </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <input type="email" id="editSupplierEmail" class="w-full border rounded px-3 py-2" value="${email}">
                 </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="bg-gray-300 px-4 py-2 rounded" id="cancelEditBtn">Hủy</button>
                    <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded" id="saveEditBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const updatedName = document.getElementById('editSupplierName').value;
            const updatedAddress = document.getElementById('editSupplierAddress').value;
            const updatedPhone = document.getElementById('editSupplierPhone').value;
            const updatedEmail = document.getElementById('editSupplierEmail').value;

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/suppliers/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({ name: updatedName, address: updatedAddress, phone: updatedPhone, email: updatedEmail })
                });
                 if (response.ok) {
                     loadSuppliers();
                     document.body.removeChild(modal);
                 } else {
                     throw new Error('Cập nhật thất bại');
                 }
            } catch (error) {
                console.error('Lỗi khi cập nhật nhà cung cấp:', error);
                alert('Lỗi khi cập nhật nhà cung cấp.');
            }
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    };

    addSupplierButton.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-semibold mb-4">Thêm nhà cung cấp mới</h3>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp</label>
                    <input type="text" id="supplierName" class="w-full border rounded px-3 py-2">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input type="text" id="supplierAddress" class="w-full border rounded px-3 py-2">
                </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                     <input type="text" id="supplierPhone" class="w-full border rounded px-3 py-2">
                 </div>
                 <div class="mb-4">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <input type="email" id="supplierEmail" class="w-full border rounded px-3 py-2">
                 </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="bg-gray-300 px-4 py-2 rounded" id="cancelBtn">Hủy</button>
                    <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded" id="saveBtn">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('saveBtn').addEventListener('click', async () => {
            const name = document.getElementById('supplierName').value;
            const address = document.getElementById('supplierAddress').value;
            const phone = document.getElementById('supplierPhone').value;
            const email = document.getElementById('supplierEmail').value;
            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/suppliers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({ name, address, phone, email })
                });
                 if (response.ok) {
                     loadSuppliers();
                     document.body.removeChild(modal);
                 } else {
                     throw new Error('Thêm mới thất bại');
                 }
            } catch (error) {
                console.error('Lỗi khi thêm nhà cung cấp:', error);
                alert('Lỗi khi thêm nhà cung cấp.');
            }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        loadSuppliers(searchTerm);
    });

    loadSuppliers();
});
