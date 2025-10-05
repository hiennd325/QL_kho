document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const role = document.getElementById('role').value;
        
        if (!username || !password || !confirmPassword) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Mật khẩu và xác nhận mật khẩu không khớp');
            return;
        }
        
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Đăng ký thất bại');
            }
            
            alert('Đăng ký thành công! Vui lòng đăng nhập');
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            alert(error.message);
        }
    });
});