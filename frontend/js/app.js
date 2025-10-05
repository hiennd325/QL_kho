document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather Icons
    feather.replace();

    // Tab functionality
    const tabs = document.querySelectorAll('.flex.px-6 button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('tab-active', 'text-blue-600'));
            tabs.forEach(t => t.classList.add('text-gray-600', 'hover:text-blue-600'));
            tab.classList.add('tab-active', 'text-blue-600');
            tab.classList.remove('text-gray-600', 'hover:text-blue-600');
        });
    });

    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
});
