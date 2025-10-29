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

        // Show loading spinner
        showLoading: (element) => {
            if (element) {
                element.innerHTML = '<div class="flex justify-center items-center py-8"><div class="spinner"></div></div>';
            }
        },

        // Hide loading spinner
        hideLoading: (element) => {
            if (element && element.querySelector('.spinner')) {
                element.innerHTML = '';
            }
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

        // Add loading states to forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', () => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="spinner mr-2"></div> Đang xử lý...';
                }
            });
        });

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
