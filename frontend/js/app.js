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

    document.body.classList.add('modal-active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.classList.add('pointer-events-none');
    modal.classList.remove('modal-open');

    // Hide after transition
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);

    document.body.classList.remove('modal-active');
}

// Global App Configuration
const App = {
    config: {
        apiBaseUrl: 'http://localhost:3000',
        animationDuration: 300,
        debounceDelay: 300
    },

    // Utility functions
    utils: {
        // Debounce function for search inputs
        debounce: (func, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(null, args), delay);
            };
        },



        // Show notification
        showNotification: (message, type = 'info', duration = 3000) => {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white notification ${type}`;
            notification.innerHTML = `
                <div class="flex items-center">
                    <i data-feather="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="mr-2"></i>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(notification);
            feather.replace();

            setTimeout(() => {
                notification.remove();
            }, duration);
        },

        // Format currency
        formatCurrency: (amount, currency = 'VNĐ') => {
            return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
        },

        // Format date
        formatDate: (date, options = {}) => {
            const defaultOptions = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            return new Date(date).toLocaleDateString('vi-VN', { ...defaultOptions, ...options });
        },

        // Get API headers with auth token
        getApiHeaders: () => {
            const token = localStorage.getItem('token');
            return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        }
    },

    // Navigation functions
    navigation: {
        // Update active sidebar link
        updateActiveLink: () => {
            const currentPage = window.location.pathname.split('/').pop();
            const sidebarLinks = document.querySelectorAll('.sidebar a');

            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                const linkHref = link.getAttribute('href');
                if (linkHref && linkHref.includes(currentPage)) {
                    link.classList.add('active');
                }
            });
        },

        // Smooth scroll to element
        scrollToElement: (elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        // Handle browser back/forward buttons
        handleHistoryNavigation: () => {
            window.addEventListener('popstate', () => {
                App.navigation.updateActiveLink();
            });
        }
    },

    // UI enhancements
    ui: {
        // Initialize responsive sidebar
        initResponsiveSidebar: () => {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.flex-1');

            if (window.innerWidth <= 768) {
                // Mobile: sidebar is hidden by default
                if (sidebar) sidebar.style.transform = 'translateX(-100%)';
            }

            // Toggle sidebar on mobile
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = '<i data-feather="menu"></i>';
            toggleBtn.className = 'fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg md:hidden';
            toggleBtn.addEventListener('click', () => {
                if (sidebar) {
                    const isHidden = sidebar.style.transform === 'translateX(-100%)';
                    sidebar.style.transform = isHidden ? 'translateX(0)' : 'translateX(-100%)';
                }
            });

            document.body.appendChild(toggleBtn);
            feather.replace();
        },



        // Initialize search functionality
        initGlobalSearch: () => {
            const searchInputs = document.querySelectorAll('input[placeholder*="tìm kiếm" i], input[placeholder*="search" i]');

            searchInputs.forEach(input => {
                input.addEventListener('input', App.utils.debounce((e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    // Add visual feedback for search
                    if (searchTerm.length > 0) {
                        input.classList.add('ring-2', 'ring-blue-300');
                    } else {
                        input.classList.remove('ring-2', 'ring-blue-300');
                    }
                }, App.config.debounceDelay));
            });
        },

        initLogoutModal: () => {
            const logoutModal = document.getElementById('logoutModal');
            if (!logoutModal) return;

            const cancelLogout = document.getElementById('cancelLogout');
            const confirmLogout = document.getElementById('confirmLogout');
            const logoutButtons = document.querySelectorAll('#logoutButton, #logoutBtn');

            function showLogoutModal() {
                logoutModal.classList.remove('hidden');
            }

            function hideLogoutModal() {
                logoutModal.classList.add('hidden');
            }

            logoutButtons.forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        showLogoutModal();
                    });
                }
            });

            if (cancelLogout) {
                cancelLogout.addEventListener('click', hideLogoutModal);
            }

            if (confirmLogout) {
                confirmLogout.addEventListener('click', () => {
                    hideLogoutModal();
                    Auth.logout();
                });
            }

            logoutModal.addEventListener('click', (e) => {
                if (e.target === logoutModal) {
                    hideLogoutModal();
                }
            });
        },

        updateUserInfo: () => {
            const user = Auth.getUserInfo();
            console.log('User info:', user); // Thêm log để debug
            if (user) {
                const userNameEl = document.getElementById('user-name');
                const userRoleEl = document.getElementById('user-role');
                if (userNameEl) {
                    userNameEl.textContent = user.username || 'N/A';
                }
                if (userRoleEl) {
                    // Dịch vai trò sang tiếng Việt
                    const roleText = {
                        'admin': 'Quản trị viên',
                        'manager': 'Quản lý',
                        'staff': 'Nhân viên'
                    };
                    userRoleEl.textContent = roleText[user.role] || user.role || 'N/A';
                }
            }
        }
    },

    // Initialize app
    init: () => {
        // Initialize Feather Icons
        feather.replace();

        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: App.config.animationDuration,
                easing: 'ease-in-out',
                once: true
            });
        }

        // Tab functionality
        const tabs = document.querySelectorAll('.flex.px-6 button, .bg-white.border-b button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => {
                    t.classList.remove('tab-active', 'text-blue-600');
                    t.classList.add('text-gray-600', 'hover:text-blue-600');
                });

                // Add active class to clicked tab
                tab.classList.add('tab-active', 'text-blue-600');
                tab.classList.remove('text-gray-600', 'hover:text-blue-600');
            });
        });

        // Initialize navigation
        App.navigation.updateActiveLink();
        App.navigation.handleHistoryNavigation();

        // Initialize UI enhancements
        App.ui.initResponsiveSidebar();
        App.ui.initGlobalSearch();
        App.ui.initLogoutModal();
        App.ui.updateUserInfo();

        // Removed loading states to forms as per user request

        // Global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            App.utils.showNotification('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        });

        // Logout button event listener
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                Auth.logout();
            });
        }

        // Service worker registration for PWA support
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        console.log('Smart Stock App initialized successfully');
    }
};



// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

// Export for global access
window.App = App;
