/* ========================================
   CORE.JS - Ядро приложения ТеплоЛюкс
   Содержит: конфигурацию, инициализацию,
   глобальные утилиты, управление событиями
   ======================================== */

// ===== КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ =====
const AppConfig = {
    // Название компании
    company: {
        name: 'ТеплоЛюкс',
        fullName: 'Мишкинская теплоснабжающая компания',
        address: 'р.п. Мишкино, ул. Теплоснабжающая, д. 1',
        phone: '+7 (351) 234-56-78',
        emergencyPhone: '+7 (351) 234-56-79',
        email: 'info@teplolux.ru',
        supportEmail: 'support@teplolux.ru'
    },
    
    // Селекторы DOM-элементов (для единообразия)
    selectors: {
        header: '#header',
        burgerMenu: '#burgerMenu',
        mobileMenu: '#mobileMenu',
        menuOverlay: '#menuOverlay',
        closeMenu: '#closeMenu',
        scrollToTop: '#scrollToTop',
        workTimeBadge: '.work-time'
    },
    
    // Рабочее время
    workHours: {
        weekdays: { start: 8, end: 20 },  // Пн-Пт: 8:00 - 20:00
        saturday: { start: 9, end: 17 },  // Сб: 9:00 - 17:00
        sunday: null                       // Вс: выходной
    },
    
    // Настройки анимаций
    animation: {
        notificationDuration: 3000,  // мс
        scrollThreshold: 300         // пикселей до появления кнопки "наверх"
    },
    
    // Версия приложения
    version: '2.0.0',
    buildDate: '2024-01-01'
};

// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ =====
const AppState = {
    isMobileMenuOpen: false,
    isAdmin: false,
    currentAdmin: null,
    initialized: false
};

// ===== COOKIE-УТИЛИТЫ =====
function setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🚀 ${AppConfig.company.name} v${AppConfig.version} инициализируется...`);
    
    // Инициализируем общие компоненты
    initScrollToTop();
    initHeaderScroll();
    
    // Обновляем время работы (если есть бейдж на странице)
    updateWorkTimeBadge();
    setInterval(updateWorkTimeBadge, 60000);
    
    // Проверяем сессию админа (теперь из куки)
    checkAdminSession();
    
    AppState.initialized = true;
    console.log('✅ Приложение готово');
});

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Форматирование даты
 * @param {string|Date} dateInput - Дата для форматирования
 * @param {string} format - Формат ('full', 'short', 'time', 'relative')
 * @returns {string} Отформатированная дата
 */
function formatDate(dateInput, format = 'full') {
    if (!dateInput) return '—';
    
    try {
        const date = new Date(dateInput);
        
        // Проверяем валидность даты
        if (isNaN(date.getTime())) return dateInput;
        
        const now = new Date();
        const diff = now - date;
        
        switch (format) {
            case 'relative':
                if (diff < 60000) return 'только что';
                if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
                if (diff < 2592000000) return `${Math.floor(diff / 86400000)} дн. назад`;
                // fall through to full format
                
            case 'full':
                return date.toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
            case 'short':
                return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
            case 'time':
                return date.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
            case 'iso':
                return date.toISOString();
                
            default:
                return date.toLocaleString('ru-RU');
        }
    } catch (e) {
        console.warn('Ошибка форматирования даты:', e);
        return dateInput;
    }
}

/**
 * Форматирование валюты
 * @param {number} value - Сумма
 * @param {string} currency - Валюта (по умолчанию '₽')
 * @returns {string} Отформатированная сумма
 */
function formatCurrency(value, currency = '₽') {
    if (value === null || value === undefined || isNaN(value)) return `0 ${currency}`;
    
    return value.toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ` ${currency}`;
}

/**
 * Экранирование HTML
 * @param {string} text - Исходный текст
 * @returns {string} Безопасный HTML
 */
function escapeHtml(text) {
    if (!text) return text;
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Генерация уникального ID
 * @param {string} prefix - Префикс ID
 * @returns {string} Уникальный идентификатор
 */
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Дебаунс (задержка вызова функции)
 * @param {Function} func - Функция для вызова
 * @param {number} wait - Задержка в мс
 * @returns {Function} Обёрнутая функция
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Троттлинг (ограничение частоты вызова)
 * @param {Function} func - Функция
 * @param {number} limit - Минимальный интервал в мс
 * @returns {Function} Обёрнутая функция
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Получение значения из localStorage с проверкой
 * @param {string} key - Ключ
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} Распарсенные данные или defaultValue
 */
function getFromStorage(key, defaultValue = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
        console.error(`Ошибка чтения localStorage[${key}]:`, e);
        return defaultValue;
    }
}

/**
 * Сохранение в localStorage с проверкой
 * @param {string} key - Ключ
 * @param {*} value - Значение
 * @returns {boolean} Успешность операции
 */
function setToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Ошибка записи localStorage[${key}]:`, e);
        return false;
    }
}

/**
 * Удаление из localStorage
 * @param {string} key - Ключ
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Ошибка удаления localStorage[${key}]:`, e);
    }
}

// ===== ФУНКЦИИ УВЕДОМЛЕНИЙ =====

/**
 * Показать уведомление
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Длительность показа в мс
 */
function showNotification(message, type = 'info', duration = null) {
    const notificationDuration = duration || AppConfig.animation.notificationDuration;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Иконка в зависимости от типа
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || '📢'}</span>
        <span class="notification-text">${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления (класс уже задаёт slideInRight)
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, notificationDuration);
    
    // Клик для быстрого закрытия
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

/**
 * Показать уведомление об ошибке
 * @param {string} message - Текст ошибки
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * Показать уведомление об успехе
 * @param {string} message - Текст
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

// ===== ФУНКЦИИ ШАПКИ =====

/**
 * Скролл шапки (добавление тени при прокрутке)
 */
function initHeaderScroll() {
    const header = document.querySelector(AppConfig.selectors.header);
    if (!header) return;
    
    window.addEventListener('scroll', throttle(() => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100));
}

// ===== КНОПКА "НАВЕРХ" =====

/**
 * Инициализация кнопки скролла наверх
 */
function initScrollToTop() {
    const scrollBtn = document.querySelector(AppConfig.selectors.scrollToTop);
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', throttle(() => {
        if (window.scrollY > AppConfig.animation.scrollThreshold) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }, 100));
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== ПРОВЕРКА ВРЕМЕНИ РАБОТЫ =====

/**
 * Проверка, работает ли компания сейчас
 * @returns {boolean}
 */
function isWorkingHours() {
    const now = new Date();
    const day = now.getDay(); // 0-6 (0 = воскресенье)
    const hours = now.getHours();
    
    // Воскресенье - выходной
    if (day === 0) return false;
    
    // Суббота
    if (day === 6) {
        const sat = AppConfig.workHours.saturday;
        return hours >= sat.start && hours < sat.end;
    }
    
    // Будни
    const wd = AppConfig.workHours.weekdays;
    return hours >= wd.start && hours < wd.end;
}

/**
 * Обновление бейджа времени работы
 */
function updateWorkTimeBadge() {
    const badges = document.querySelectorAll(AppConfig.selectors.workTimeBadge);
    if (!badges.length) return;
    
    const isWorking = isWorkingHours();
    
    badges.forEach(badge => {
        badge.textContent = isWorking ? 'Сейчас работаем' : 'Сейчас закрыто';
        badge.style.background = isWorking ? '#e8f5e9' : '#ffebee';
        badge.style.color = isWorking ? '#4CAF50' : '#f44336';
    });
}

// ===== АДМИН-СЕССИЯ =====

/**
 * Проверка сохранённой сессии администратора (из куки)
 */
function checkAdminSession() {
    const cookie = getCookie('adminSession');
    if (cookie) {
        try {
            AppState.currentAdmin = JSON.parse(cookie);
            AppState.isAdmin = true;
        } catch (e) {
            deleteCookie('adminSession');
            AppState.isAdmin = false;
            AppState.currentAdmin = null;
        }
    }
}

// ===== РАБОТА С DOM =====

/**
 * Безопасное получение элемента по селектору
 * @param {string} selector - CSS-селектор
 * @param {Element} context - Родительский элемент
 * @returns {Element|null}
 */
function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Безопасное получение всех элементов по селектору
 * @param {string} selector - CSS-селектор
 * @param {Element} context - Родительский элемент
 * @returns {NodeList}
 */
function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Создание элемента с атрибутами и содержимым
 * @param {string} tag - HTML-тег
 * @param {Object} attrs - Атрибуты
 * @param {string|Node|Array} children - Содержимое
 * @returns {Element}
 */
function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    
    // Устанавливаем атрибуты
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Добавляем детей
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(c => element.appendChild(c));
        }
    });
    
    return element;
}

// ===== ВАЛИДАЦИЯ =====

/**
 * Валидация email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    if (!email) return true; // опциональное поле
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Валидация телефона (российский формат)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
}

/**
 * Очистка номера телефона (оставляет только цифры)
 * @param {string} phone
 * @returns {string}
 */
function cleanPhone(phone) {
    return phone.replace(/\D/g, '');
}

// ===== ЛОГГИРОВАНИЕ =====

const Logger = {
    info: (...args) => console.log('ℹ️', ...args),
    warn: (...args) => console.warn('⚠️', ...args),
    error: (...args) => console.error('❌', ...args),
    success: (...args) => console.log('✅', ...args),
    debug: (...args) => {
        if (AppConfig.debug) console.log('🐛', ...args);
    }
};

// ===== ЭКСПОРТ (для модульной системы, если понадобится) =====
// В браузере всё доступно глобально через window
window.AppConfig = AppConfig;
window.AppState = AppState;
window.Logger = Logger;