// Global modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal element with ID "${modalId}" not found.`);
        return;
    }
    modal.style.display = 'flex';
    modal.classList.remove('opacity-0');
    modal.classList.remove('pointer-events-none');
    modal.classList.add('modal-open');

    // Show modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('scale-100');
    }

    document.body.classList.add('modal-active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.classList.add('pointer-events-none');
    modal.classList.remove('modal-open');

    // Hide modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-100');
    }

    // Hide after transition
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);

    document.body.classList.remove('modal-active');
}

// User Management System - Advanced Version
class UserManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentUserId = null;
        this.viewMode = 'table'; // 'table' or 'grid'
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUsers();
        this.initializeRoleDescriptions();
    }

    setupEventListeners() {
        // Add user button
        document.getElementById('btn-add-user').addEventListener('click', () => this.openModal(null));

        // Save user button
        document.getElementById('saveUserBtn').addEventListener('click', (e) => this.handleSaveUser(e));

        // Search and filter
        document.getElementById('search-input').addEventListener('input', () => this.applyFilters());
        document.getElementById('header-search-input').addEventListener('input', () => this.applyFilters());
        document.getElementById('role-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('status-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('btn-reset-filter').addEventListener('click', () => this.resetFilters());

        // View mode toggle
        document.getElementById('view-table-btn').addEventListener('click', () => this.switchView('table'));
        document.getElementById('view-grid-btn').addEventListener('click', () => this.switchView('grid'));

        // Role change listener for description
        document.getElementById('role').addEventListener('change', (e) => this.updateRoleDescription(e.target.value));
    }

    initializeRoleDescriptions() {
        this.roleDescriptions = {
            'admin': '✓ Toàn bộ quyền hạn\n✓ Quản lý người dùng\n✓ Xem báo cáo\n✓ Cấu hình hệ thống',
            'staff': '✓ Quản lý tồn kho\n✓ Nhập xuất hàng\n✓ Xem báo cáo cơ bản\n✗ Quản lý người dùng'
        };
    }

    updateRoleDescription(role) {
        const descDiv = document.getElementById('role-description');
        const descText = document.getElementById('role-desc-text');
        
        if (role && this.roleDescriptions[role]) {
            descText.textContent = this.roleDescriptions[role];
            descDiv.classList.remove('hidden');
        } else {
            descDiv.classList.add('hidden');
        }
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${this.baseUrl}/users`, { headers });
            if (!response.ok) throw new Error('Failed to fetch users');
            
            this.users = await response.json();
            this.filteredUsers = [...this.users];
            this.updateStatistics();
            this.render();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Lỗi tải dữ liệu người dùng', 'error');
        }
    }

    updateStatistics() {
        const totalUsers = this.users.length;
        const adminCount = this.users.filter(u => u.role === 'admin').length;
        const staffCount = this.users.filter(u => u.role === 'staff').length;
        const activeCount = this.users.filter(u => u.status === 'active').length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('admin-count').textContent = adminCount;
        document.getElementById('staff-count').textContent = staffCount;
        document.getElementById('active-count').textContent = activeCount;
    }

    applyFilters() {
        const searchTerm = (document.getElementById('header-search-input').value || document.getElementById('search-input').value).toLowerCase();
        const roleFilter = document.getElementById('role-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredUsers = this.users.filter(user => {
            const matchSearch = !searchTerm ||
                user.username.toLowerCase().includes(searchTerm);

            const matchRole = !roleFilter || user.role === roleFilter;
            const matchStatus = !statusFilter || user.status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });

        this.currentPage = 1;
        this.render();
    }

    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('header-search-input').value = '';
        document.getElementById('role-filter').value = '';
        document.getElementById('status-filter').value = '';
        this.filteredUsers = [...this.users];
        this.currentPage = 1;
        this.render();
    }

    switchView(mode) {
        this.viewMode = mode;
        const tableBtn = document.getElementById('view-table-btn');
        const gridBtn = document.getElementById('view-grid-btn');
        const tableView = document.getElementById('table-view');
        const gridView = document.getElementById('grid-view');

        if (mode === 'table') {
            tableBtn.classList.add('bg-blue-600', 'text-white');
            tableBtn.classList.remove('border', 'border-gray-300', 'text-gray-700');
            gridBtn.classList.remove('bg-blue-600', 'text-white');
            gridBtn.classList.add('border', 'border-gray-300', 'text-gray-700');
            tableView.classList.remove('hidden');
            gridView.classList.add('hidden');
        } else {
            gridBtn.classList.add('bg-blue-600', 'text-white');
            gridBtn.classList.remove('border', 'border-gray-300', 'text-gray-700');
            tableBtn.classList.remove('bg-blue-600', 'text-white');
            tableBtn.classList.add('border', 'border-gray-300', 'text-gray-700');
            gridView.classList.remove('hidden');
            tableView.classList.add('hidden');
        }

        this.render();
    }

    render() {
        if (this.viewMode === 'table') {
            this.renderTableView();
        } else {
            this.renderGridView();
        }
        this.renderPagination();
    }

    renderTableView() {
        const tableBody = document.getElementById('users-table-body');
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedUsers = this.filteredUsers.slice(start, end);

        tableBody.innerHTML = '';

        if (paginatedUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i data-feather="inbox" class="inline mr-2"></i>
                        Không có người dùng nào
                    </td>
                </tr>
            `;
            feather.replace();
            return;
        }

        paginatedUsers.forEach(user => {
            const row = document.createElement('tr');
            const dateStr = new Date(user.created_at).toLocaleDateString('vi-VN');
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${user.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span class="text-blue-600 font-semibold">${user.username[0].toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-900">${user.username}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge badge-${user.role}">
                        ${this.getRoleName(user.role)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge badge-${user.status}">
                        ${user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dateStr}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3 edit-btn" data-id="${user.id}">
                        <i data-feather="edit-2" class="h-4 w-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${user.id}">
                        <i data-feather="trash-2" class="h-4 w-4"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Attach event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openModal(parseInt(e.currentTarget.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteUser(parseInt(e.currentTarget.dataset.id)));
        });

        feather.replace();
    }

    renderGridView() {
        const gridView = document.getElementById('grid-view');
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedUsers = this.filteredUsers.slice(start, end);

        gridView.innerHTML = '';

        if (paginatedUsers.length === 0) {
            gridView.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i data-feather="inbox" class="inline mr-2"></i>
                    Không có người dùng nào
                </div>
            `;
            feather.replace();
            return;
        }

        paginatedUsers.forEach(user => {
            const card = document.createElement('div');
            const dateStr = new Date(user.created_at).toLocaleDateString('vi-VN');
            
            card.className = 'user-card bg-white rounded-lg shadow-md p-6';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-lg">${user.username[0].toUpperCase()}</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-blue-600 hover:text-blue-900 edit-btn" data-id="${user.id}">
                            <i data-feather="edit-2" class="h-4 w-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${user.id}">
                            <i data-feather="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">${user.username}</h3>
                <div class="mt-4 flex gap-2">
                    <span class="badge badge-${user.role}">
                        ${this.getRoleName(user.role)}
                    </span>
                    <span class="badge badge-${user.status}">
                        ${user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                </div>
                <p class="text-xs text-gray-400 mt-4">Tạo ngày: ${dateStr}</p>
            `;
            gridView.appendChild(card);
        });

        // Attach event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openModal(parseInt(e.currentTarget.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteUser(parseInt(e.currentTarget.dataset.id)));
        });

        feather.replace();
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
        
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = `px-3 py-1 border rounded ${this.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`;
        prevBtn.textContent = '← Trước';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pagination.appendChild(prevBtn);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `px-3 py-1 border rounded ${
                i === this.currentPage 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pagination.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = `px-3 py-1 border rounded ${this.currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`;
        nextBtn.textContent = 'Sau →';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pagination.appendChild(nextBtn);
    }

    getRoleName(role) {
        const roleMap = {
            'admin': 'Quản trị viên',
            'staff': 'Nhân viên kho'
        };
        return roleMap[role] || role;
    }

    async openModal(userId = null) {
        this.currentUserId = userId;
        const modal = document.getElementById('user-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalSubtitle = document.getElementById('modal-subtitle');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const passwordHint = document.getElementById('password-hint');

        // Reset form
        document.getElementById('userForm').reset();
        this.updateRoleDescription('');

        if (userId) {
            // Edit mode
            modalTitle.textContent = 'Chỉnh sửa người dùng';
            modalSubtitle.textContent = 'Cập nhật thông tin người dùng';
            passwordInput.removeAttribute('required');
            confirmPasswordInput.removeAttribute('required');
            passwordHint.textContent = 'Để trống nếu không đổi mật khẩu';

            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${this.baseUrl}/users/${userId}`, { headers });
                
                if (!response.ok) throw new Error('Failed to fetch user');
                
                const user = await response.json();
                document.getElementById('username').value = user.username;
                document.getElementById('role').value = user.role;
                this.updateRoleDescription(user.role);
                document.getElementById('status').value = user.status;
            } catch (error) {
                console.error('Error loading user:', error);
                this.showNotification('Lỗi tải thông tin người dùng', 'error');
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Thêm người dùng mới';
            modalSubtitle.textContent = 'Nhập thông tin chi tiết của người dùng';
            passwordInput.setAttribute('required', '');
            confirmPasswordInput.setAttribute('required', '');
            passwordHint.textContent = 'Tối thiểu 6 ký tự';
        }

        openModal('user-modal');
    }

    async handleSaveUser(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const role = document.getElementById('role').value;
        const status = document.getElementById('status').value;

        // Validation
        if (!username) {
            this.showNotification('Vui lòng nhập tên đăng nhập', 'error');
            return;
        }

        if (!role) {
            this.showNotification('Vui lòng chọn vai trò', 'error');
            return;
        }

        if (!this.currentUserId && !password) {
            this.showNotification('Vui lòng nhập mật khẩu', 'error');
            return;
        }

        if (password && password.length < 6) {
            this.showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        if (password && password !== confirmPassword) {
            this.showNotification('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            };

            const formData = {
                username,
                role,
                status
            };

            if (password) {
                formData.password = password;
            }

            const url = this.currentUserId ? `${this.baseUrl}/users/${this.currentUserId}` : `${this.baseUrl}/users`;
            const method = this.currentUserId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi lưu người dùng');
            }

            closeModal('user-modal');
            this.loadUsers();
            this.showNotification(
                this.currentUserId ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công',
                'success'
            );
        } catch (error) {
            console.error('Error saving user:', error);
            this.showNotification(`Lỗi: ${error.message}`, 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${this.baseUrl}/users/${userId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) throw new Error('Failed to delete user');

            this.loadUsers();
            this.showNotification('Xóa người dùng thành công', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Lỗi xóa người dùng', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-feather="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        feather.replace();

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UserManager();
});
