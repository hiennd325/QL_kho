document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('tbody');
    const addUserButton = document.querySelector('button[onclick="openModal(\'user-modal\')"]');

    const renderUsers = (users) => {
        tableBody.innerHTML = '';
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Không có người dùng nào</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.username}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.username}@example.com</td>
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

    loadUsers();
});
