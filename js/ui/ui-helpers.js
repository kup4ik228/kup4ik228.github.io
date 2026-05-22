/* ========================================
   UI-HELPERS.JS - Вспомогательные UI-функции
   Содержит: модальные окна, маски ввода,
   загрузка файлов, валидация, анимации
   ======================================== */

// ===== МОДАЛЬНЫЕ ОКНА =====

/**
 * Показать модальное окно
 * @param {string} modalId - ID модального окна
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        Logger.warn('Модальное окно не найдено:', modalId);
        return;
    }
    
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // Блокируем скролл body
    document.body.style.overflow = 'hidden';
    
    // Фокус на модалку для доступности
    modal.setAttribute('aria-hidden', 'false');
    
    // Фокус на первый интерактивный элемент
    setTimeout(() => {
        const firstFocusable = modal.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) firstFocusable.focus();
    }, 100);
    
    // Анимация появления
    modal.style.animation = 'fadeIn 0.3s ease';
    
    Logger.debug('Открыто модальное окно:', modalId);
}

/**
 * Скрыть модальное окно
 * @param {string} modalId - ID модального окна
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Анимация скрытия
    modal.style.animation = 'fadeIn 0.3s ease reverse';
    
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.animation = '';
        document.body.style.overflow = '';
        modal.setAttribute('aria-hidden', 'true');
    }, 280);
    
    Logger.debug('Закрыто модальное окно:', modalId);
}

/**
 * Закрыть все открытые модальные окна
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
        hideModal(modal.id);
    });
}

/**
 * Инициализировать закрытие модалок по Escape и клику вне
 */
function initModalListeners() {
    // Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Клик вне модалки
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal') && 
            e.target.classList.contains('active')) {
            hideModal(e.target.id);
        }
    });
}

// ===== МАСКИ ВВОДА =====

/**
 * Маска для телефона (российский формат)
 * @param {HTMLInputElement} input - Поле ввода
 */
function applyPhoneMask(input) {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        let formatted = '';
        
        if (value.length > 0) {
            if (value.length <= 1) {
                formatted = '+7 (' + value;
            } else if (value.length <= 4) {
                formatted = '+7 (' + value.slice(1, 4);
            } else if (value.length <= 7) {
                formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7);
            } else if (value.length <= 9) {
                formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 9);
            } else {
                formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 9) + '-' + value.slice(9, 11);
            }
        }
        
        e.target.value = formatted;
    });
    
    // При потере фокуса — если пусто, то убираем всё
    input.addEventListener('blur', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length < 11 && value.length > 0) {
            e.target.classList.add('error');
        } else {
            e.target.classList.remove('error');
        }
    });
}

/**
 * Инициализировать все маски телефонов на странице
 */
function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-mask="phone"]');
    phoneInputs.forEach(input => applyPhoneMask(input));
}

/**
 * Маска для даты (ДД.ММ.ГГГГ)
 * @param {HTMLInputElement} input - Поле ввода
 */
function applyDateMask(input) {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 2) {
            value = value.slice(0, 2) + '.' + value.slice(2);
        }
        if (value.length > 5) {
            value = value.slice(0, 5) + '.' + value.slice(5, 9);
        }
        
        e.target.value = value;
    });
}

// ===== ЗАГРУЗКА ФАЙЛОВ =====

/**
 * Инициализировать drag & drop для загрузки файлов
 * @param {string} dropZoneId - ID зоны для перетаскивания
 * @param {string} fileInputId - ID скрытого input[type=file]
 * @param {Function} onFilesSelected - Колбэк с массивом File
 */
function initFileDropZone(dropZoneId, fileInputId, onFilesSelected) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    
    if (!dropZone || !fileInput) return;
    
    // Предотвращаем стандартное поведение
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Подсветка при наведении
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, function() {
            dropZone.classList.add('highlight');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, function() {
            dropZone.classList.remove('highlight');
        });
    });
    
    // Обработка дропа
    dropZone.addEventListener('drop', function(e) {
        const files = Array.from(e.dataTransfer.files);
        fileInput.files = e.dataTransfer.files;
        
        if (typeof onFilesSelected === 'function') {
            onFilesSelected(files);
        }
        
        // Триггерим событие change
        fileInput.dispatchEvent(new Event('change'));
    });
    
    // Обработка выбора через input
    fileInput.addEventListener('change', function() {
        const files = Array.from(fileInput.files);
        
        if (typeof onFilesSelected === 'function') {
            onFilesSelected(files);
        }
    });
    
    // Клик по зоне открывает выбор файла
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });
}

/**
 * Форматировать размер файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 байт';
    
    const units = ['байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    return `${size} ${units[i]}`;
}

/**
 * Создать элемент списка файлов
 * @param {File} file - Файл
 * @param {Function} onRemove - Колбэк при удалении
 * @returns {HTMLElement}
 */
function createFileListItem(file, onRemove) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const fileSize = formatFileSize(file.size);
    
    item.innerHTML = `
        <div class="file-name">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>${escapeHtml(file.name)}</span>
            <span class="file-size">(${fileSize})</span>
        </div>
        <button type="button" class="file-remove" title="Удалить файл">×</button>
    `;
    
    // Обработчик удаления
    const removeBtn = item.querySelector('.file-remove');
    if (removeBtn && typeof onRemove === 'function') {
        removeBtn.addEventListener('click', function() {
            item.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                item.remove();
                onRemove(file);
            }, 280);
        });
    }
    
    return item;
}

// ===== ВАЛИДАЦИЯ ФОРМ =====

/**
 * Показать ошибку валидации для поля
 * @param {HTMLInputElement} input - Поле ввода
 * @param {string} message - Текст ошибки
 */
function showFieldError(input, message) {
    if (!input) return;
    
    // Добавляем класс ошибки
    input.classList.add('error');
    
    // Ищем или создаём элемент с ошибкой
    let errorEl = input.parentElement.querySelector('.field-error');
    
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.style.cssText = `
            color: var(--color-accent-dark, #ff4444);
            font-size: 13px;
            margin-top: 5px;
            display: block;
        `;
        input.parentElement.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    
    // Анимация тряски
    input.style.animation = 'shake 0.3s ease';
    setTimeout(() => {
        input.style.animation = '';
    }, 300);
}

/**
 * Очистить ошибку валидации для поля
 * @param {HTMLInputElement} input - Поле ввода
 */
function clearFieldError(input) {
    if (!input) return;
    
    input.classList.remove('error');
    
    const errorEl = input.parentElement.querySelector('.field-error');
    if (errorEl) {
        errorEl.remove();
    }
}

/**
 * Валидировать форму
 * @param {HTMLFormElement} form - Форма
 * @param {Object} rules - Правила валидации
 * @returns {boolean} Валидна ли форма
 */
function validateForm(form, rules = {}) {
    if (!form) return false;
    
    let isValid = true;
    
    // Очищаем все предыдущие ошибки
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    // Проверяем обязательные поля
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Это поле обязательно для заполнения');
            isValid = false;
        }
    });
    
    // Проверяем email поля
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            showFieldError(field, 'Введите корректный email');
            isValid = false;
        }
    });
    
    // Проверяем телефонные поля
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        const digits = field.value.replace(/\D/g, '');
        if (field.value && digits.length < 11) {
            showFieldError(field, 'Введите полный номер телефона');
            isValid = false;
        }
    });
    
    // Дополнительные правила
    Object.entries(rules).forEach(([fieldName, rule]) => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field && typeof rule === 'function') {
            const result = rule(field.value);
            if (result !== true) {
                showFieldError(field, result);
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// ===== ЗАГРУЗКА ИЗОБРАЖЕНИЙ =====

/**
 * Ленивая загрузка изображений
 */
function initLazyImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Фолбэк для старых браузеров
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// ===== АНИМАЦИИ =====

/**
 * Анимировать появление элемента
 * @param {HTMLElement} element - Элемент
 * @param {string} animation - Название анимации
 * @param {number} duration - Длительность
 */
function animateElement(element, animation = 'fadeIn', duration = 500) {
    if (!element) return;
    
    element.style.animation = `${animation} ${duration}ms ease`;
    
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

/**
 * Анимировать числовое значение
 * @param {HTMLElement} element - Элемент для отображения
 * @param {number} start - Начальное значение
 * @param {number} end - Конечное значение
 * @param {number} duration - Длительность анимации
 */
function animateNumber(element, start, end, duration = 1000) {
    if (!element) return;
    
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing функция
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        const current = start + (end - start) * easedProgress;
        element.textContent = Math.round(current).toLocaleString('ru-RU');
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== ПОДТВЕРЖДЕНИЯ =====

/**
 * Показать диалог подтверждения
 * @param {string} message - Сообщение
 * @param {Function} onConfirm - Колбэк при подтверждении
 * @param {Function} onCancel - Колбэк при отмене
 */
function showConfirm(message, onConfirm, onCancel) {
    // Можно заменить на кастомное модальное окно
    const result = confirm(message);
    
    if (result && typeof onConfirm === 'function') {
        onConfirm();
    } else if (!result && typeof onCancel === 'function') {
        onCancel();
    }
}

// ===== КОПИРОВАНИЕ В БУФЕР =====

/**
 * Скопировать текст в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showSuccess('Скопировано!');
            return true;
        } else {
            // Фолбэк для старых браузеров
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showSuccess('Скопировано!');
            return true;
        }
    } catch (err) {
        Logger.error('Ошибка копирования:', err);
        showError('Не удалось скопировать');
        return false;
    }
}

// ===== ОБРАБОТКА ОШИБОК ИЗОБРАЖЕНИЙ =====

/**
 * Установить заглушку для битых изображений
 * @param {string} placeholderSrc - URL заглушки
 */
function initImageFallback(placeholderSrc = 'img/placeholder.png') {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            if (!this.dataset.fallbackSet) {
                this.src = placeholderSrc;
                this.dataset.fallbackSet = 'true';
                this.style.opacity = '0.5';
            }
        });
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем маски телефонов
    initPhoneMasks();
    
    // Инициализируем слушатели модальных окон
    initModalListeners();
    
    // Ленивая загрузка изображений
    initLazyImages();
    
    // Заглушки для изображений
    initImageFallback();
    
    Logger.info('UI-хелперы загружены');
});

// Экспорт API
window.UIHelpers = {
    showModal,
    hideModal,
    closeAllModals,
    applyPhoneMask,
    initPhoneMasks,
    applyDateMask,
    initFileDropZone,
    formatFileSize,
    createFileListItem,
    showFieldError,
    clearFieldError,
    validateForm,
    animateElement,
    animateNumber,
    showConfirm,
    copyToClipboard
};
