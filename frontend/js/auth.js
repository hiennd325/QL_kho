// Frontend authentication utility
class Auth {
    static getToken() {
        return localStorage.getItem('token');
    }

    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            // JWT tokens are base64 encoded, not JSON
            const payload = JSON.parse(atob(token.split('.')[1]));
            // No expiration check for indefinite access
            return true;
        } catch (e) {
            console.error('Error parsing token:', e);
            return false;
        }
    }

    static redirectIfNotAuthenticated() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }

    static logout() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }

    static getUserInfo() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.id,
                role: payload.role
            };
        } catch (e) {
            console.error('Error getting user info:', e);
            return null;
        }
    }
}

// Check authentication on page load for protected pages
document.addEventListener('DOMContentLoaded', () => {
    // List of pages that require authentication
    const protectedPages = [
        'index.html',
        'don-hang.html',
        'kiem-ke-bao-cao.html',
        'nhap-xuat-ton.html',
        'quan-ly-hang-hoa.html',
        'quan-ly-kho-bai.html',
        'quan-ly-nguoi-dung.html'
    ];

    // Get current page name
    const currentPage = window.location.pathname.split('/').pop();

    // Check if current page requires authentication
    if (protectedPages.includes(currentPage)) {
        Auth.redirectIfNotAuthenticated();
    }
});