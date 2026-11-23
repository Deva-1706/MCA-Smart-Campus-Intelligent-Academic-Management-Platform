// Light & Dark theme persistence with localStorage
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('mca_portal_theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = htmlElement.classList.toggle('dark');
            const theme = isDark ? 'dark' : 'light';
            localStorage.setItem('mca_portal_theme', theme);
            document.cookie = `theme=${theme}; path=/; max-age=31536000`;
        });
    }

    // Password visibility toggle on login page
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('id_password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
        });
    }
});
