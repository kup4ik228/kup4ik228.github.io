/* ========================================
   SERVICES.JS - Логика страницы услуг
   Содержит: FAQ аккордеон, заказ услуг,
   анимации, этапы работы
   ======================================== */

// ===== КОНСТАНТЫ =====
const SERVICES_SELECTORS = {
    faqSection: '.faq-section',
    faqGrid: '.faq-grid',
    faqItems: '.faq-item',
    faqQuestion: '.faq-question',
    faqAnswer: '.faq-answer',
    servicesGrid: '.services-cards',
    serviceCards: '.service-card-page',
    serviceButtons: '.service-btn',
    advantagesGrid: '.advantages-grid',
    stepsGrid: '.steps-grid',
    stepItems: '.step-item',
    heroSection: '.services-hero'
};

// Карта услуг для быстрого поиска
const SERVICES_MAP = {
    'монтаж': 'installation',
    'ремонт': 'repair',
    'проект': 'design',
    'подключение': 'connection',
    'счетчики': 'meters',
    'бизнес': 'business'
};

// ===== FAQ АККОРДЕОН =====

/**
 * Инициализировать FAQ аккордеон
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll(SERVICES_SELECTORS.faqItems);
    
    if (faqItems.length === 0) return;
    
    faqItems.forEach(item => {
        const question = item.querySelector(SERVICES_SELECTORS.faqQuestion);
        const answer = item.querySelector(SERVICES_SELECTORS.faqAnswer);
        
        if (!question) return;
        
        // Добавляем атрибуты доступности
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('tabindex', '0');
        
        if (answer) {
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-hidden', 'true');
        }
        
        // Обработчик клика
        question.addEventListener('click', function() {
            toggleFaqItem(item);
        });
        
        // Обработчик клавиатуры
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaqItem(item);
            }
        });
    });
    
    Logger.info('FAQ аккордеон инициализирован');
}

/**
 * Переключить элемент FAQ
 * @param {HTMLElement} item - Элемент FAQ
 */
function toggleFaqItem(item) {
    const question = item.querySelector(SERVICES_SELECTORS.faqQuestion);
    const answer = item.querySelector(SERVICES_SELECTORS.faqAnswer);
    
    // Закрываем другие элементы (опционально — можно убрать для мульти-открытия)
    const allItems = document.querySelectorAll(SERVICES_SELECTORS.faqItems);
    allItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
            closeFaqItem(otherItem);
        }
    });
    
    // Переключаем текущий
    if (item.classList.contains('active')) {
        closeFaqItem(item);
    } else {
        openFaqItem(item);
    }
}

/**
 * Открыть элемент FAQ
 * @param {HTMLElement} item - Элемент FAQ
 */
function openFaqItem(item) {
    const question = item.querySelector(SERVICES_SELECTORS.faqQuestion);
    const answer = item.querySelector(SERVICES_SELECTORS.faqAnswer);
    
    item.classList.add('active');
    
    if (question) {
        question.setAttribute('aria-expanded', 'true');
    }
    
    if (answer) {
        answer.setAttribute('aria-hidden', 'false');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }
}

/**
 * Закрыть элемент FAQ
 * @param {HTMLElement} item - Элемент FAQ
 */
function closeFaqItem(item) {
    const question = item.querySelector(SERVICES_SELECTORS.faqQuestion);
    const answer = item.querySelector(SERVICES_SELECTORS.faqAnswer);
    
    item.classList.remove('active');
    
    if (question) {
        question.setAttribute('aria-expanded', 'false');
    }
    
    if (answer) {
        answer.setAttribute('aria-hidden', 'true');
        answer.style.maxHeight = '0';
    }
}

// ===== ЗАКАЗ УСЛУГ =====

/**
 * Заказать услугу
 * @param {string} service - Название услуги
 */
function orderService(service) {
    const serviceCode = SERVICES_MAP[service] || service;
    
    // Показываем уведомление
    const serviceNames = {
        'монтаж': 'Монтаж отопления',
        'ремонт': 'Ремонт и обслуживание',
        'проект': 'Проектирование',
        'подключение': 'Подключение к сетям',
        'счетчики': 'Установка счетчиков',
        'бизнес': 'Для предприятий'
    };
    
    const serviceName = serviceNames[service] || service;
    
    showNotification(`Открываем форму заказа: «${serviceName}»`, 'info');
    
    // Переход на страницу приёмной с параметром
    setTimeout(() => {
        window.location.href = `reception.html?service=${serviceCode}&name=${encodeURIComponent(serviceName)}`;
    }, 800);
}

/**
 * Инициализировать кнопки услуг
 */
function initServiceButtons() {
    const buttons = document.querySelectorAll(SERVICES_SELECTORS.serviceButtons);
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest(SERVICES_SELECTORS.serviceCards);
            if (!card) return;
            
            const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
            
            // Определяем тип услуги по заголовку
            let service = 'другое';
            
            if (title.includes('монтаж')) service = 'монтаж';
            else if (title.includes('ремонт') || title.includes('обслуживание')) service = 'ремонт';
            else if (title.includes('проект')) service = 'проект';
            else if (title.includes('подключение')) service = 'подключение';
            else if (title.includes('счетчик') || title.includes('учёт')) service = 'счетчики';
            else if (title.includes('предприят') || title.includes('бизнес')) service = 'бизнес';
            
            orderService(service);
        });
    });
}

// ===== ПРЕДЗАПОЛНЕНИЕ ИЗ URL =====

/**
 * Проверить параметры URL для предзаполнения
 */
function checkServiceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    
    if (service) {
        Logger.info('Услуга из URL:', service);
        
        // Скроллим к карточке услуги
        setTimeout(() => {
            const cards = document.querySelectorAll(SERVICES_SELECTORS.serviceCards);
            
            cards.forEach(card => {
                const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
                
                let match = false;
                
                if (service === 'installation' && title.includes('монтаж')) match = true;
                if (service === 'repair' && (title.includes('ремонт') || title.includes('обслуживание'))) match = true;
                if (service === 'design' && title.includes('проект')) match = true;
                if (service === 'connection' && title.includes('подключение')) match = true;
                if (service === 'meters' && (title.includes('счетчик') || title.includes('учёт'))) match = true;
                if (service === 'business' && (title.includes('предприят') || title.includes('бизнес'))) match = true;
                
                if (match) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Подсветка карточки
                    card.style.boxShadow = '0 0 0 4px var(--color-primary), 0 20px 60px rgba(145, 49, 255, 0.4)';
                    card.style.transform = 'scale(1.02)';
                    
                    setTimeout(() => {
                        card.style.boxShadow = '';
                        card.style.transform = '';
                    }, 3000);
                }
            });
        }, 1000);
    }
}

// ===== АНИМАЦИИ =====

/**
 * Инициализировать анимации карточек услуг
 */
function initServicesAnimations() {
    // Анимация карточек
    const cards = document.querySelectorAll(SERVICES_SELECTORS.serviceCards);
    
    if (cards.length > 0) {
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 200 + index * 120);
        });
    }
    
    // Анимация преимуществ при скролле
    initAdvantagesScrollAnimation();
    
    // Анимация этапов работы
    initStepsAnimation();
}

/**
 * Анимация преимуществ при скролле
 */
function initAdvantagesScrollAnimation() {
    if (!('IntersectionObserver' in window)) return;
    
    const advantages = document.querySelectorAll('.advantage-item');
    if (advantages.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -30px 0px'
    });
    
    advantages.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px) scale(0.9)';
        item.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(item);
    });
}

/**
 * Анимация этапов работы
 */
function initStepsAnimation() {
    if (!('IntersectionObserver' in window)) return;
    
    const steps = document.querySelectorAll(SERVICES_SELECTORS.stepItems);
    if (steps.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });
    
    steps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateX(-30px)';
        step.style.transition = `all 0.5s ease ${index * 0.15}s`;
        observer.observe(step);
    });
}

// ===== ПОДСЧЁТ СТАТИСТИКИ (ДЕМО) =====

/**
 * Анимировать цифры статистики (если есть)
 */
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    if (statNumbers.length === 0) return;
    
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                
                if (typeof animateNumber === 'function') {
                    animateNumber(el, 0, target, 2000);
                } else {
                    el.textContent = target.toLocaleString('ru-RU');
                }
                
                observer.unobserve(el);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statNumbers.forEach(el => observer.observe(el));
}

// ===== БЫСТРЫЙ ПРОСМОТР УСЛУГИ =====

/**
 * Показать быстрое описание услуги
 * @param {HTMLElement} card - Карточка услуги
 */
function showServicePreview(card) {
    if (!card) return;
    
    // На мобильных не показываем превью
    if (window.innerWidth < 768) return;
    
    const title = card.querySelector('h3')?.textContent || '';
    const price = card.querySelector('.service-price')?.textContent || '';
    const features = card.querySelectorAll('.service-features li');
    
    let featuresText = '';
    features.forEach(f => {
        featuresText += `• ${f.textContent}\n`;
    });
    
    // Показываем тултип (можно заменить на кастомный)
    card.title = `${title}\nЦена: ${price}\n\n${featuresText}`;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    Logger.info('Инициализация страницы услуг...');
    
    // Проверяем, что мы на странице услуг
    const isServicesPage = document.querySelector(SERVICES_SELECTORS.heroSection) !== null ||
                           document.querySelector(SERVICES_SELECTORS.servicesGrid) !== null;
    
    if (!isServicesPage) {
        Logger.debug('Не страница услуг, пропускаем');
        return;
    }
    
    // FAQ аккордеон
    initFaqAccordion();
    
    // Кнопки заказа
    initServiceButtons();
    
    // Анимации
    initServicesAnimations();
    
    // Счётчики статистики
    initStatsCounter();
    
    // Проверка параметров URL
    checkServiceFromUrl();
    
    // Превью услуг на десктопе
    document.querySelectorAll(SERVICES_SELECTORS.serviceCards).forEach(card => {
        showServicePreview(card);
    });
    
    Logger.success('Страница услуг инициализирована');
});

// Экспорт API
window.ServicesPage = {
    orderService,
    toggleFaq: toggleFaqItem,
    SERVICES_MAP
};