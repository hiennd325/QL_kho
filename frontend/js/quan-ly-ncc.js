document.addEventListener('DOMContentLoaded', async () => {
    const suppliersGrid = document.getElementById('suppliers-grid');
    const emptyState = document.getElementById('empty-state');
    const addSupplierButton = document.querySelector('.add-supplier-btn');
    const searchInput = document.getElementById('search-input');

    const renderSuppliers = (suppliers) => {
        suppliersGrid.innerHTML = '';
        if (suppliers.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        suppliers.forEach((supplier, index) => {
            const card = document.createElement('div');
            card.className = 'supplier-card p-6 animate-fade-in';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="supplier-info">
                    <div class="supplier-icon">${supplier.name.charAt(0).toUpperCase()}</div>
                    <div class="supplier-details">
                        <h3 class="font-semibold text-lg text-gray-900">${supplier.name}</h3>
                        <p class="text-sm text-gray-600">Mã: ${supplier.code}</p>
                        <p class="text-sm text-gray-600">ID: ${supplier.id}</p>
                    </div>
                </div>
                <div class="supplier-details mt-4">
                    <p><i data-feather="map-pin" class="inline h-4 w-4 mr-2"></i>${supplier.address || 'Chưa có địa chỉ'}</p>
                    <p><i data-feather="phone" class="inline h-4 w-4 mr-2"></i>${supplier.phone || 'Chưa có SĐT'}</p>
                    <p><i data-feather="mail" class="inline h-4 w-4 mr-2"></i>${supplier.email || 'Chưa có email'}</p>
                </div>
                <div class="supplier-actions">
                    <button type="button" class="btn-edit edit-btn" data-id="${supplier.id}" data-name="${supplier.name}" data-address="${supplier.address || ''}" data-phone="${supplier.phone || ''}" data-email="${supplier.email || ''}">
                        <i data-feather="edit-2" class="h-4 w-4"></i>
                        Sửa
                    </button>
                    <button type="button" class="btn-delete delete-btn" data-id="${supplier.id}">
                        <i data-feather="trash-2" class="h-4 w-4"></i>
                        Xóa
                    </button>
                </div>
            `;
            suppliersGrid.appendChild(card);
        });

        // Re-initialize Feather icons for the new cards
        feather.replace();
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
            // Get supplier ID and fetch full details from API
            const supplierId = editBtn.dataset.id;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            fetch(`http://localhost:3000/suppliers/${supplierId}`, { headers })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(supplier => {
                    console.log('Supplier data:', supplier);
                    showEditModal(supplier);
                })
                .catch(error => {
                    console.error('Lỗi khi lấy thông tin nhà cung cấp:', error);
                    alert('Lỗi khi lấy thông tin nhà cung cấp: ' + error.message);
                });
        }
    });

    const showEditModal = (supplier) => {
        console.log('Opening edit modal with supplier:', supplier);
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const supplierName = supplier.name || supplier.contact_person || '';
        const supplierCode = supplier.code || '';
        const supplierAddress = supplier.address || '';
        const supplierPhone = supplier.phone || '';
        const supplierEmail = supplier.email || '';
        
        modal.innerHTML = `
            <div class="supplier-modal w-full max-w-md">
                <div class="supplier-modal-header">
                    <i data-feather="edit" class="mx-auto mb-2 h-8 w-8"></i>
                    <h3 class="text-xl font-bold">Chỉnh sửa nhà cung cấp</h3>
                </div>
                <div class="supplier-modal-body">
                    <div class="supplier-form-group">
                        <label>Mã nhà cung cấp</label>
                        <input type="text" id="editSupplierCode" value="${supplierCode}" readonly>
                    </div>
                    <div class="supplier-form-group">
                        <label>Tên nhà cung cấp</label>
                        <input type="text" id="editSupplierName" value="${supplierName}">
                    </div>
                    <div class="supplier-form-group">
                        <label>Địa chỉ</label>
                        <input type="text" id="editSupplierAddress" value="${supplierAddress}">
                    </div>
                    <div class="supplier-form-group">
                        <label>Số điện thoại</label>
                        <input type="text" id="editSupplierPhone" value="${supplierPhone}">
                    </div>
                    <div class="supplier-form-group">
                        <label>Email</label>
                        <input type="email" id="editSupplierEmail" value="${supplierEmail}">
                    </div>
                </div>
                <div class="supplier-modal-footer">
                    <button type="button" class="btn-cancel" id="cancelEditBtn">
                        <i data-feather="x" class="h-4 w-4 mr-2"></i>Hủy
                    </button>
                    <button type="button" class="btn-save" id="saveEditBtn">
                        <i data-feather="save" class="h-4 w-4 mr-2"></i>Lưu
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        feather.replace();

        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const updatedCode = document.getElementById('editSupplierCode').value;
            const updatedName = document.getElementById('editSupplierName').value;
            const updatedAddress = document.getElementById('editSupplierAddress').value;
            const updatedPhone = document.getElementById('editSupplierPhone').value;
            const updatedEmail = document.getElementById('editSupplierEmail').value;

            const phoneRegex = /^\d{10}$/;
            if (updatedPhone && !phoneRegex.test(updatedPhone)) {
                alert('Số điện thoại phải là 10 chữ số.');
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
            if (updatedEmail && !emailRegex.test(updatedEmail)) {
                alert('Email phải có định dạng example@company.com');
                return;
            }

            try {
                const baseUrl = `http://localhost:3000`;
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}/suppliers/${supplier.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({ 
                        code: updatedCode, 
                        name: updatedName, 
                        address: updatedAddress, 
                        phone: updatedPhone, 
                        email: updatedEmail 
                    })
                });
                
                if (response.ok) {
                    loadSuppliers();
                    document.body.removeChild(modal);
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Cập nhật thất bại');
                }
            } catch (error) {
                console.error('Lỗi khi cập nhật nhà cung cấp:', error);
                alert('Lỗi khi cập nhật nhà cung cấp: ' + error.message);
            }
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    };

        addSupplierButton.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="supplier-modal w-full max-w-md">
                    <div class="supplier-modal-header">
                        <i data-feather="plus" class="mx-auto mb-2 h-8 w-8"></i>
                        <h3 class="text-xl font-bold">Thêm nhà cung cấp mới</h3>
                    </div>
                    <div class="supplier-modal-body">
                        <div class="supplier-form-group">
                            <label>Mã nhà cung cấp</label>
                            <input type="text" id="supplierCode" placeholder="Nhập mã nhà cung cấp">
                        </div>
                        <div class="supplier-form-group">
                            <label>Tên nhà cung cấp</label>
                            <input type="text" id="supplierName" placeholder="Nhập tên nhà cung cấp">
                        </div>
                        <div class="supplier-form-group">
                            <label>Địa chỉ</label>
                            <input type="text" id="supplierAddress" placeholder="Nhập địa chỉ">
                        </div>
                        <div class="supplier-form-group">
                            <label>Số điện thoại</label>
                            <input type="text" id="supplierPhone" placeholder="Nhập số điện thoại">
                        </div>
                        <div class="supplier-form-group">
                            <label>Email</label>
                            <input type="email" id="supplierEmail" placeholder="Nhập email">
                        </div>
                    </div>
                    <div class="supplier-modal-footer">
                        <button type="button" class="btn-cancel" id="cancelBtn">
                            <i data-feather="x" class="h-4 w-4 mr-2"></i>Hủy
                        </button>
                        <button type="button" class="btn-save" id="saveBtn">
                            <i data-feather="save" class="h-4 w-4 mr-2"></i>Lưu
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            feather.replace();

            document.getElementById('saveBtn').addEventListener('click', async () => {
                const code = document.getElementById('supplierCode').value;
                const name = document.getElementById('supplierName').value;
                const address = document.getElementById('supplierAddress').value;
                const phone = document.getElementById('supplierPhone').value;
                const email = document.getElementById('supplierEmail').value;
                
                if (!code) {
                    alert('Vui lòng nhập mã nhà cung cấp');
                    return;
                }

                const phoneRegex = /^\d{10}$/;
                if (phone && !phoneRegex.test(phone)) {
                    alert('Số điện thoại phải là 10 chữ số.');
                    return;
                }

                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
                if (email && !emailRegex.test(email)) {
                    alert('Email phải có định dạng example@company.com');
                    return;
                }
                
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
                        body: JSON.stringify({ code, name, address, phone, email })
                    });
                    
                    if (response.ok) {
                        loadSuppliers();
                        document.body.removeChild(modal);
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Thêm mới thất bại');
                    }
                } catch (error) {
                    console.error('Lỗi khi thêm nhà cung cấp:', error);
                    alert('Lỗi khi thêm nhà cung cấp: ' + error.message);
                }
            });

            document.getElementById('cancelBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        loadSuppliers(searchTerm);
    });

    loadSuppliers();
});
