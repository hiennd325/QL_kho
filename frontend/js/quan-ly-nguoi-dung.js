document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const addUserButton = document.querySelector('button[onclick="openModal(\'user-modal\')"]');

    // Form elements
    const userForm = document.getElementById('userForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    const statusSelect = document.getElementById('status');
    const modalCloseBtn = document.querySelector('.modal-close');

    let currentUserId = null;

    const renderUsers = (users) => {
        tableBody.innerHTML = '';
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Không có người dùng nào</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.username}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" class="text-indigo-600 hover:text-indigo-900">Sửa</a>
                    <a href="#" class="text-red-600 hover:text-red-900 ml-4 delete-btn" data-id="${user.id}">Xóa</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    async function loadUsers() {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/users`, { headers });
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const users = await response.json();
            renderUsers(users);

        } catch (error) {
            console.error('Error loading users:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Lỗi tải dữ liệu</td></tr>`;
        }
    }

    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const userId = e.target.dataset.id;
            if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
                try {
                    const baseUrl = `http://localhost:3000`;
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${baseUrl}/users/${userId}`, { 
                        method: 'DELETE',
                        headers
                    });
                    if (!response.ok) throw new Error('Failed to delete user');
                    loadUsers();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    alert('Lỗi xóa người dùng');
                }
            }
        }
    });

    // Reset form
    function resetUserForm() {
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        roleSelect.value = 'user';
        statusSelect.value = 'Hoạt động';
        currentUserId = null;
        passwordInput.required = true;
        document.querySelector('label[for="password"]').innerHTML = 'Mật khẩu <span class="text-red-500">*</span>';
    }

    // Load user data for editing
    async function loadUserData(userId) {
        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${baseUrl}/users/${userId}`, { headers });

            if (!response.ok) throw new Error('Failed to fetch user data');

            const user = await response.json();
            usernameInput.value = user.username;
            emailInput.value = user.email || '';
            roleSelect.value = user.role || 'user';
            statusSelect.value = user.status === 'active' ? 'Hoạt động' : 'Tạm khóa';
            currentUserId = userId;
            passwordInput.required = false;
            document.querySelector('label[for="password"]').innerHTML = 'Mật khẩu (để trống nếu không đổi)';
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Lỗi tải dữ liệu người dùng');
        }
    }

    // Handle form submission
    async function handleUserFormSubmit(event) {
        event.preventDefault();

        const formData = {
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleSelect.value,
            status: statusSelect.value === 'Hoạt động' ? 'active' : 'inactive'
        };

        // Only include password if it's provided (for new users or password changes)
        if (passwordInput.value.trim()) {
            formData.password = passwordInput.value.trim();
        }

        // Validate required fields
        if (!formData.username) {
            alert('Vui lòng nhập tên đăng nhập');
            return;
        }

        if (!currentUserId && !formData.password) {
            alert('Vui lòng nhập mật khẩu');
            return;
        }

        try {
            const baseUrl = `http://localhost:3000`;
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

            const url = currentUserId ? `${baseUrl}/users/${currentUserId}` : `${baseUrl}/users`;
            const method = currentUserId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save user');
            }

            closeModal('user-modal');
            loadUsers();
            alert(currentUserId ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công');

        } catch (error) {
            console.error('Error saving user:', error);
            alert('Lỗi lưu người dùng: ' + error.message);
        }
    }

    // Event listeners
    if (addUserButton) {
        addUserButton.addEventListener('click', () => {
            resetUserForm();
            openModal('user-modal');
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', handleUserFormSubmit);
    }

    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }

    // Handle edit buttons in table
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('a[href="#"]');
        if (editBtn && !editBtn.classList.contains('delete-btn')) {
            e.preventDefault();
            const row = editBtn.closest('tr');
            const userId = row.querySelector('td').textContent.trim();
            loadUserData(userId);
            openModal('user-modal');
        }
    });

    loadUsers();
});
