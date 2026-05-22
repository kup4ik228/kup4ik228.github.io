/* ========================================
   CONTACTS.JS - Логика страницы контактов
   Содержит: форма обратной связи, карта,
   проверка времени работы, аварийная служба
   ======================================== */

const CONTACTS_SELECTORS = {
    contactForm: '#contactForm',
    mapSection: '.map-section',
    mapContainer: '.map-container',
    mapBox: '.map-box',
    workTimeBadges: '.work-time',
    emergencyPhone: '.emergency-phone',
    infoCards: '.info-card-contact',
    detailsGrid: '.details-grid',
    heroSection: '.contacts-hero'
};

// ===== ФОРМА ОБРАТНОЙ СВЯЗИ =====

function initContactForm() {
    const contactForm = document.querySelector(CONTACTS_SELECTORS.contactForm);
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: contactForm.querySelector('input[type="text"]')?.value || '',
            phone: contactForm.querySelector('input[type="tel"]')?.value || '',
            email: contactForm.querySelector('input[type="email"]')?.value || '',
            topic: contactForm.querySelector('select')?.value || '',
            message: contactForm.querySelector('textarea')?.value || ''
        };
        
        if (!formData.name.trim()) {
            showError('Пожалуйста, укажите ваше имя');
            return;
        }
        
        if (!formData.phone.trim()) {
            showError('Пожалуйста, укажите телефон');
            return;
        }
        
        if (!formData.message.trim()) {
            showError('Пожалуйста, напишите сообщение');
            return;
        }
        
        if (typeof DB !== 'undefined' && DB.addReception) {
            await DB.addReception({
                type: 'contact_form',
                fullname: formData.name,
                phone: formData.phone,
                email: formData.email,
                subject: `Форма связи: ${formData.topic || 'Не указана'}`,
                message: formData.message,
                status: 'new'
            });
        }
        
        Logger.info('Сообщение из формы контактов:', formData);
        showSuccess('Спасибо за обращение! Мы свяжемся с вами в ближайшее время.');
        contactForm.reset();
        contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                clearFieldError(this);
            } else {
                showFieldError(this, 'Это поле обязательно');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError(this);
            }
        });
    });
}

// ===== АНИМАЦИЯ КАРТОЧЕК =====

function initContactCardsAnimation() {
    const cards = document.querySelectorAll(CONTACTS_SELECTORS.infoCards);
    if (cards.length === 0) return;
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });
}

// ===== АВАРИЙНАЯ СЛУЖБА =====

function initEmergencyHighlight() {
    const emergencyPhone = document.querySelector(CONTACTS_SELECTORS.emergencyPhone);
    if (!emergencyPhone) return;
    
    emergencyPhone.style.animation = 'pulse 2s infinite';
    
    emergencyPhone.addEventListener('click', function(e) {
        setTimeout(() => {
            const isWorking = isWorkingHours();
            if (!isWorking) {
                showNotification(
                    '🚨 Вы звоните в аварийную службу. Сейчас нерабочее время, но аварийная служба работает круглосуточно.',
                    'warning',
                    5000
                );
            }
        }, 500);
    });
}

// ===== КАРТА =====

function initMap() {
    const mapBox = document.querySelector(CONTACTS_SELECTORS.mapBox);
    if (!mapBox) return;
    
    const mapPlaceholder = mapBox.querySelector('.map-placeholder');
    if (!mapPlaceholder) return;
    
    mapPlaceholder.style.cursor = 'pointer';
    mapPlaceholder.addEventListener('click', function() {
        const address = AppConfig.company.address;
        const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
        window.open(mapUrl, '_blank');
        showNotification('Открываем карту в новой вкладке...', 'info');
    });
    
    const hint = document.createElement('div');
    hint.className = 'map-click-hint';
    hint.textContent = 'Нажмите, чтобы открыть карту';
    hint.style.cssText = `
        text-align: center;
        margin-top: 10px;
        color: var(--color-text-muted);
        font-size: 13px;
        font-style: italic;
    `;
    
    mapBox.parentElement.appendChild(hint);
}

// ===== КОПИРОВАНИЕ РЕКВИЗИТОВ =====

function initCopyDetails() {
    const detailsRows = document.querySelectorAll('.details-row');
    if (detailsRows.length === 0) return;
    
    detailsRows.forEach(row => {
        const valueCell = row.querySelector('.details-value');
        if (!valueCell || !valueCell.textContent.trim()) return;
        
        row.style.cursor = 'pointer';
        row.title = 'Нажмите, чтобы скопировать';
        
        row.addEventListener('click', function() {
            const value = valueCell.textContent.trim();
            if (value) {
                copyToClipboard(value);
            }
        });
        
        row.addEventListener('mouseenter', function() {
            this.style.background = 'var(--color-primary-bg)';
            this.style.transition = 'background 0.2s ease';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.background = '';
        });
    });
}

// ===== ТЕЛЕФОННЫЕ ССЫЛКИ =====

function initPhoneLinks() {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    
    phoneLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// ===== ВРЕМЯ РАБОТЫ =====

function updateContactWorkTime() {
    const badges = document.querySelectorAll(CONTACTS_SELECTORS.workTimeBadges);
    if (badges.length === 0) return;
    
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    
    let isWork = false;
    let workText = '';
    
    if (day === 0) {
        workText = 'Сегодня выходной';
    } else if (day === 6) {
        if (hours >= 9 && hours < 17) {
            isWork = true;
            workText = 'Сейчас работаем (до 17:00)';
        } else if (hours < 9) {
            workText = 'Откроемся в 9:00';
        } else {
            workText = 'Закрыто (откроемся в понедельник)';
        }
    } else {
        if (hours >= 8 && hours < 20) {
            isWork = true;
            workText = 'Сейчас работаем (до 20:00)';
        } else if (hours < 8) {
            workText = 'Откроемся в 8:00';
        } else {
            workText = 'Закрыто (откроемся завтра в 8:00)';
        }
    }
    
    badges.forEach(badge => {
        badge.textContent = workText;
        
        if (isWork) {
            badge.style.background = '#e8f5e9';
            badge.style.color = '#4CAF50';
            badge.classList.add('working');
            badge.classList.remove('closed');
        } else {
            badge.style.background = '#ffebee';
            badge.style.color = '#f44336';
            badge.classList.add('closed');
            badge.classList.remove('working');
        }
    });
}

// ===== СКРОЛЛ =====

function initContactScroll() {
    const internalLinks = document.querySelectorAll('a[href*="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            
            const targetId = href.split('#')[1];
            if (!targetId) return;
            
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('#header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== СКРОЛЛ-АНИМАЦИИ =====

function initContactScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    
    const elementsToReveal = document.querySelectorAll(
        '.contact-form, .info-card-contact, .details-grid'
    );
    
    if (elementsToReveal.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });
    
    elementsToReveal.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

// ===== ПРЯМОЙ ЗВОНОК =====

function initDirectCall() {
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    
    if (isMobile) {
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        phoneLinks.forEach(link => {
            if (link.classList.contains('emergency-phone') || link.closest('.emergency')) {
                link.addEventListener('click', function(e) {
                    const confirmed = confirm(
                        'Вы собираетесь позвонить в аварийную службу. Звоните только в экстренных случаях. Продолжить?'
                    );
                    if (!confirmed) {
                        e.preventDefault();
                    }
                });
            }
        });
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    Logger.info('Инициализация страницы контактов...');
    
    const isContactsPage = document.querySelector(CONTACTS_SELECTORS.contactForm) !== null ||
                           document.querySelector('.contacts-hero') !== null;
    
    if (!isContactsPage) {
        Logger.debug('Не страница контактов, пропускаем');
        return;
    }
    
    initContactForm();
    initContactCardsAnimation();
    initContactScrollReveal();
    initMap();
    
    updateContactWorkTime();
    setInterval(updateContactWorkTime, 60000);
    
    initEmergencyHighlight();
    initCopyDetails();
    initPhoneLinks();
    initDirectCall();
    initContactScroll();
    
    if (typeof initPhoneMasks === 'function') {
        initPhoneMasks();
    }
    
    Logger.success('Страница контактов инициализирована');
});

window.ContactsPage = {
    updateWorkTime: updateContactWorkTime,
    initForm: initContactForm,
    initMap: initMap
};