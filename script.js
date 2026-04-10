document.addEventListener('DOMContentLoaded', () => {

    // ÉLÉMENTS DU DOM
    const themeSwitch = document.getElementById('theme-switch');
    const burgerBtn = document.getElementById('burger-btn');
    const navLinks = document.getElementById('nav-links');
    const htmlElement = document.documentElement;

    // 1. THÈME SOMBRE / CLAIR
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // 2. GESTION DU MENU MOBILE (Nouveau)
    if (burgerBtn && navLinks) {
        burgerBtn.addEventListener('click', () => {
            // On bascule la classe pour afficher/cacher le menu
            navLinks.classList.toggle('mobile-visible');
        });

        // Optionnel : fermer le menu quand on clique sur un lien
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-visible');
            });
        });
    }
});