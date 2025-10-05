// Chờ DOM load xong trước khi thực thi code
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các element cần thiết từ DOM
    const loginForm = document.querySelector('form'); // Form đăng nhập
    const usernameInput = document.getElementById('username'); // Input tên đăng nhập
    const passwordInput = document.getElementById('password'); // Input mật khẩu
    const rememberCheckbox = document.getElementById('remember'); // Checkbox ghi nhớ
    const togglePasswordBtn = document.getElementById('togglePassword'); // Nút hiện/ẩn mật khẩu
    const usernameError = document.getElementById('usernameError'); // Thông báo lỗi username
    const passwordError = document.getElementById('passwordError'); // Thông báo lỗi password
    const mainError = document.getElementById('mainError'); // Thông báo lỗi chính
    const submitBtn = loginForm.querySelector('button[type="submit"]'); // Nút submit

    // Tính năng "Remember Me": Khôi phục username đã lưu nếu có
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    // Xử lý sự kiện thay đổi checkbox "Remember Me"
    rememberCheckbox.addEventListener('change', () => {
        if (rememberCheckbox.checked) {
            // Lưu username vào localStorage
            localStorage.setItem('rememberedUsername', usernameInput.value);
        } else {
            // Xóa username khỏi localStorage
            localStorage.removeItem('rememberedUsername');
        }
    });

    // Validation cho username: chỉ kiểm tra không được để trống
    usernameInput.addEventListener('input', () => {
        const username = usernameInput.value.trim();
        if (!username) {
            usernameError.textContent = 'Tên đăng nhập không được để trống';
            usernameError.classList.remove('hidden'); // Hiển thị lỗi
        } else {
            usernameError.classList.add('hidden'); // Ẩn lỗi
        }
    });

    // Validation cho password: tắt hoàn toàn (không validate)
    passwordInput.addEventListener('input', () => {
        passwordError.classList.add('hidden');
    });

    // Chức năng hiện/ẩn mật khẩu
    togglePasswordBtn.addEventListener('click', () => {
        // Chuyển đổi giữa 'password' và 'text'
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;

        // Cập nhật icon tương ứng
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.setAttribute('data-feather', 'eye-off'); // Icon mắt đóng
        } else {
            icon.setAttribute('data-feather', 'eye'); // Icon mắt mở
        }
        feather.replace(icon); // Cập nhật icon
    });

    // Xử lý sự kiện submit form đăng nhập
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn form submit mặc định

        // Ẩn tất cả thông báo lỗi
        mainError.classList.add('hidden');
        usernameError.classList.add('hidden');
        passwordError.classList.add('hidden');

        // Validate chỉ username (password không validate)
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            usernameError.textContent = 'Tên đăng nhập không được để trống';
            usernameError.classList.remove('hidden');
            return; // Dừng nếu username trống
        }

        // Hiển thị trạng thái loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center justify-center"><i data-feather="loader" class="h-5 w-5 mr-2"></i> Đang đăng nhập...</span>';
        feather.replace(); // Cập nhật icon

        try {
            // Gửi request đăng nhập đến backend
            const baseUrl = `http://localhost:3000`;
            const response = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Đăng nhập thất bại');
            }

            // Lưu token vào localStorage
            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Chuyển hướng đến trang chính sau khi đăng nhập thành công
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            mainError.textContent = error.message;
            mainError.classList.remove('hidden');
        } finally {
            // Khôi phục trạng thái button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Đăng nhập';
            feather.replace();
        }
    });
});
