document.addEventListener('DOMContentLoaded', async () => {
    const suppliersGrid = document.getElementById('suppliers-grid');
    const emptyState = document.getElementById('empty-state');
    const addSupplierButton = document.getElementById('addSupplierBtn');
    const searchInput = document.getElementById('searchInput');

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
                <div class="supplier-info flex items-center mb-4">
                    <div class="supplier-icon w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4 shadow-lg">
                        ${supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="supplier-details">
                        <h3 class="font-bold text-lg text-white mb-0.5">${supplier.name}</h3>
                        <p class="text-xs text-purple-300 font-medium">Mã: ${supplier.code}</p>
                    </div>
                </div>
                <div class="space-y-3 mt-6 border-t border-purple-500/10 pt-4">
                    <div class="flex items-center text-sm text-gray-400">
                        <i data-feather="map-pin" class="h-4 w-4 mr-3 text-purple-400"></i>
                        <span class="truncate">${supplier.address || 'Chưa có địa chỉ'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-400">
                        <i data-feather="phone" class="h-4 w-4 mr-3 text-purple-400"></i>
                        <span>${supplier.phone || 'Chưa có SĐT'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-400">
                        <i data-feather="mail" class="h-4 w-4 mr-3 text-purple-400"></i>
                        <span class="truncate">${supplier.email || 'Chưa có email'}</span>
                    </div>
                </div>
                <div class="supplier-actions flex items-center gap-2 mt-6 pt-4 border-t border-purple-500/10">
                    <button type="button" class="flex-1 edit-btn flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium" data-id="${supplier.id}">
                        <i data-feather="edit-2" class="h-4 w-4"></i>
                        Sửa
                    </button>
                    <button type="button" class="flex-1 delete-btn flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium" data-id="${supplier.id}">
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
            if (suppliersGrid) {
                suppliersGrid.innerHTML = `<div class="col-span-full py-12 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">Lỗi tải dữ liệu: ${error.message}</div>`;
            }
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
            <div class="bg-[#2c1250] rounded-2xl w-full max-w-md border border-purple-500/20 shadow-2xl overflow-hidden animate-scale-in">
                <div class="p-6 border-b border-purple-500/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <i data-feather="edit" class="text-white h-8 w-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Chỉnh sửa nhà cung cấp</h3>
                    <p class="text-purple-300/60 text-sm mt-1">Cập nhật thông tin chi tiết</p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Mã nhà cung cấp</label>
                        <input type="text" id="editSupplierCode" value="${supplierCode}" readonly class="w-full bg-black/30 border border-purple-500/20 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Tên nhà cung cấp</label>
                        <input type="text" id="editSupplierName" value="${supplierName}" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Địa chỉ</label>
                        <input type="text" id="editSupplierAddress" value="${supplierAddress}" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Số điện thoại</label>
                            <input type="text" id="editSupplierPhone" value="${supplierPhone}" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Email</label>
                            <input type="email" id="editSupplierEmail" value="${supplierEmail}" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                        </div>
                    </div>
                </div>
                <div class="p-6 bg-black/20 flex gap-3">
                    <button type="button" class="flex-1 py-3 px-4 rounded-xl border border-purple-500/20 text-gray-400 hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2" id="cancelEditBtn">
                        <i data-feather="x" class="h-4 w-4"></i> Hủy
                    </button>
                    <button type="button" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20" id="saveEditBtn">
                        <i data-feather="save" class="h-4 w-4"></i> Lưu thay đổi
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
                <div class="bg-[#2c1250] rounded-2xl w-full max-w-md border border-purple-500/20 shadow-2xl overflow-hidden animate-scale-in">
                    <div class="p-6 border-b border-purple-500/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                            <i data-feather="plus" class="text-white h-8 w-8"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white">Thêm nhà cung cấp mới</h3>
                        <p class="text-purple-300/60 text-sm mt-1">Điền thông tin để bắt đầu hợp tác</p>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Mã nhà cung cấp</label>
                            <input type="text" id="supplierCode" placeholder="Ví dụ: NCC001" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Tên nhà cung cấp</label>
                            <input type="text" id="supplierName" placeholder="Tên công ty hoặc cá nhân" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Địa chỉ</label>
                            <input type="text" id="supplierAddress" placeholder="Số nhà, tên đường, quận/huyện..." class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Số điện thoại</label>
                                <input type="text" id="supplierPhone" placeholder="0123 456 789" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Email</label>
                                <input type="email" id="supplierEmail" placeholder="ncc@example.com" class="w-full bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none">
                            </div>
                        </div>
                    </div>
                    <div class="p-6 bg-black/20 flex gap-3">
                        <button type="button" class="flex-1 py-3 px-4 rounded-xl border border-purple-500/20 text-gray-400 hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2" id="cancelBtn">
                            <i data-feather="x" class="h-4 w-4"></i> Hủy
                        </button>
                        <button type="button" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20" id="saveBtn">
                            <i data-feather="save" class="h-4 w-4"></i> Lưu nhà cung cấp
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
