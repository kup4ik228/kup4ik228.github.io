/* ========================================
   HEADER.JS - Управление шапкой и навигацией
   ======================================== */

const HEADER_SELECTORS = {
    header: '#header',
    burger: '#burgerMenu',
    mobileMenu: '#mobileMenu',
    overlay: '#menuOverlay',
    mobileLinks: '.mobile-nav-link',
    desktopLinks: '.nav-link'
};

const HEADER_CLASSES = {
    active: 'active',
    scrolled: 'scrolled',
    menuOpen: 'menu-open'
};

// ===== УПРАВЛЕНИЕ БУРГЕР-МЕНЮ =====

function openMobileMenu() {
    const mobileMenu = document.querySelector(HEADER_SELECTORS.mobileMenu);
    const overlay = document.querySelector(HEADER_SELECTORS.overlay);
    const burger = document.querySelector(HEADER_SELECTORS.burger);

    if (!mobileMenu || mobileMenu.classList.contains(HEADER_CLASSES.active)) return;

    mobileMenu.classList.add(HEADER_CLASSES.active);
    if (overlay) overlay.classList.add(HEADER_CLASSES.active);
    if (burger) {
        burger.classList.add(HEADER_CLASSES.active);
        burger.setAttribute('aria-expanded', 'true');
    }

    document.body.style.overflow = 'hidden';
    document.body.classList.add(HEADER_CLASSES.menuOpen);

    setTimeout(() => {
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
    }, 100);
}

function closeMobileMenu() {
    const mobileMenu = document.querySelector(HEADER_SELECTORS.mobileMenu);
    const overlay = document.querySelector(HEADER_SELECTORS.overlay);
    const burger = document.querySelector(HEADER_SELECTORS.burger);

    if (!mobileMenu || !mobileMenu.classList.contains(HEADER_CLASSES.active)) return;

    mobileMenu.classList.remove(HEADER_CLASSES.active);
    if (overlay) overlay.classList.remove(HEADER_CLASSES.active);
    if (burger) {
        burger.classList.remove(HEADER_CLASSES.active);
        burger.setAttribute('aria-expanded', 'false');
    }

    document.body.style.overflow = '';
    document.body.classList.remove(HEADER_CLASSES.menuOpen);

    if (burger) burger.focus();
}

function toggleMobileMenu() {
    const mobileMenu = document.querySelector(HEADER_SELECTORS.mobileMenu);
    if (!mobileMenu) return;

    if (mobileMenu.classList.contains(HEADER_CLASSES.active)) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// ===== ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ =====

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
}

function highlightActiveLink() {
    const currentPage = getCurrentPage();

    document.querySelectorAll(HEADER_SELECTORS.desktopLinks).forEach(link => {
        const href = link.getAttribute('href') || '';
        const linkPage = href.replace('.html', '');
        if (linkPage === currentPage || (currentPage === 'index' && linkPage === 'index')) {
            link.classList.add(HEADER_CLASSES.active);
        } else {
            link.classList.remove(HEADER_CLASSES.active);
        }
    });

    document.querySelectorAll(HEADER_SELECTORS.mobileLinks).forEach(link => {
        const href = link.getAttribute('href') || '';
        const linkPage = href.replace('.html', '');
        if (linkPage === currentPage || (currentPage === 'index' && linkPage === 'index')) {
            link.classList.add(HEADER_CLASSES.active);
        } else {
            link.classList.remove(HEADER_CLASSES.active);
        }
    });
}

// ===== СКРОЛЛ ШАПКИ =====

function initHeaderScrollEffect() {
    const header = document.querySelector(HEADER_SELECTORS.header);
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add(HEADER_CLASSES.scrolled);
        } else {
            header.classList.remove(HEADER_CLASSES.scrolled);
        }
    }, { passive: true });
}

// ===== ОБРАБОТЧИКИ КЛАВИАТУРЫ =====

function initMenuKeyboard() {
    document.addEventListener('keydown', function(e) {
        const mobileMenu = document.querySelector(HEADER_SELECTORS.mobileMenu);
        if (!mobileMenu || !mobileMenu.classList.contains(HEADER_CLASSES.active)) return;

        if (e.key === 'Escape') {
            closeMobileMenu();
            return;
        }

        if (e.key === 'Tab') {
            const focusable = mobileMenu.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled])'
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

// ===== ОБРАБОТКА КЛИКОВ ВНЕ МЕНЮ =====

function initOverlayClick() {
    const overlay = document.querySelector(HEADER_SELECTORS.overlay);
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    const mobileMenu = document.querySelector(HEADER_SELECTORS.mobileMenu);
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.closest('a')) {
                setTimeout(closeMobileMenu, 150);
            }
        });
    }
}

// ===== СБРОС СОСТОЯНИЯ ПРИ ИЗМЕНЕНИИ РАЗМЕРА =====

function initResizeHandler() {
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            closeMobileMenu();
        }
    });
}

// ===== БЫСТРЫЕ ДЕЙСТВИЯ =====

function callPhone(phone) {
    if (!phone) phone = AppConfig.company.phone;
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
}

function openMap() {
    const address = AppConfig.company.address;
    window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(address)}`, '_blank');
}

function goToReception() {
    window.location.href = 'reception.html';
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

function initHeader() {
    const burger = document.querySelector(HEADER_SELECTORS.burger);
    if (!burger) return;

    Logger.info('Инициализация шапки...');

    burger.addEventListener('click', toggleMobileMenu);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mobileMenu');
    burger.setAttribute('aria-label', 'Открыть меню');

    initOverlayClick();
    initMenuKeyboard();
    initHeaderScrollEffect();
    initResizeHandler();
    highlightActiveLink();

    Logger.success('Шапка инициализирована');
}

document.addEventListener('DOMContentLoaded', initHeader);

window.HeaderAPI = {
    open: openMobileMenu,
    close: closeMobileMenu,
    toggle: toggleMobileMenu,
    callPhone,
    openMap,
    goToReception
};

Logger.info('Модуль шапки загружен');