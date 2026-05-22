/* ========================================
   HOME.JS - Логика главной страницы
   Содержит: герой, ограничения, форма
   трудоустройства, кнопки действий
   ======================================== */

const HOME_SELECTORS = {
    heroSection: '.hero',
    heroLogo: '.hero-logo',
    slogan: '.slogan',
    detailsBtn: '.details-btn',
    restrictionsSection: '#restrictionsSection',
    activeRestrictions: '#activeRestrictions',
    checkStreet: '#checkStreet',
    checkHouse: '#checkHouse',
    checkEmail: '#checkEmail',
    checkRestrictionsBtn: '.find-out-btn',
    safetyBtn: '.safety-btn',
    jobForm: '.application-form',
    servicesGrid: '.services-grid',
    serviceCards: '.service-card',
    cardButtons: '.card-btn'
};

// ===== АНИМАЦИЯ ГЕРОЯ =====

function initHeroAnimations() {
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroContent.style.transition = 'all 0.8s ease';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 200);
    }
    
    if (heroImage) {
        heroImage.style.opacity = '0';
        heroImage.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            heroImage.style.transition = 'all 0.8s ease 0.3s';
            heroImage.style.opacity = '1';
            heroImage.style.transform = 'translateX(0)';
        }, 400);
    }
    
    const sloganSpans = document.querySelectorAll('.slogan span');
    sloganSpans.forEach((span, index) => {
        span.style.opacity = '0';
        span.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            span.style.transition = 'all 0.6s ease';
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
        }, 400 + index * 200);
    });
}

// ===== КНОПКИ ДЕЙСТВИЙ =====

function initHomeButtons() {
    const detailsBtn = document.querySelector(HOME_SELECTORS.detailsBtn);
    if (detailsBtn) {
        detailsBtn.addEventListener('click', function() {
            const aboutSection = document.querySelector('.about-company');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    const safetyBtn = document.querySelector(HOME_SELECTORS.safetyBtn);
    if (safetyBtn) {
        safetyBtn.addEventListener('click', function() {
            showNotification('Раздел «Безопасность на теплосетях» находится в разработке', 'info');
        });
    }
    
    const cardButtons = document.querySelectorAll(HOME_SELECTORS.cardButtons);
    cardButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.service-card');
            if (!card) return;
            
            const title = card.querySelector('h3')?.textContent || '';
            
            if (this.textContent.includes('Подробнее')) {
                window.location.href = 'services.html';
            } else if (this.textContent.includes('Зарегистрироваться')) {
                window.location.href = 'reception.html?service=connection';
            }
        });
    });
}

// ===== ФОРМА ПРОВЕРКИ ОГРАНИЧЕНИЙ =====

function initRestrictionsCheck() {
    const checkBtn = document.querySelector(HOME_SELECTORS.checkRestrictionsBtn);
    if (!checkBtn) return;
    
    checkBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const street = document.querySelector(HOME_SELECTORS.checkStreet)?.value || '';
        const house = document.querySelector(HOME_SELECTORS.checkHouse)?.value || '';
        const email = document.querySelector(HOME_SELECTORS.checkEmail)?.value || '';
        
        if (typeof checkRestrictions === 'function') {
            checkRestrictions(street, house, email);
        } else {
            if (!street || !house) {
                showError('Пожалуйста, заполните улицу и номер дома');
                return;
            }
            showNotification('Информация отправлена на указанную почту', 'success');
            
            document.querySelector(HOME_SELECTORS.checkStreet).value = '';
            document.querySelector(HOME_SELECTORS.checkHouse).value = '';
            document.querySelector(HOME_SELECTORS.checkEmail).value = '';
        }
    });
    
    [document.querySelector(HOME_SELECTORS.checkStreet), 
     document.querySelector(HOME_SELECTORS.checkHouse)].forEach(input => {
        if (!input) return;
        
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#4CAF50';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
    });
}

// ===== ФОРМА ТРУДОУСТРОЙСТВА =====

function initJobForm() {
    const jobForm = document.querySelector(HOME_SELECTORS.jobForm);
    if (!jobForm) return;
    
    jobForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(jobForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        const fullname = data.fullname || data.fio || '';
        const phone = data.phone || '';
        const specialization = data.specialization || '';
        
        if (!fullname.trim()) {
            showError('Пожалуйста, укажите ФИО');
            return;
        }
        
        if (!phone.trim()) {
            showError('Пожалуйста, укажите телефон или email');
            return;
        }
        
        if (typeof DB !== 'undefined' && DB.addReception) {
            await DB.addReception({
                type: 'job_application',
                fullname: fullname,
                phone: phone,
                subject: 'Заявка на трудоустройство',
                message: `Специализация: ${specialization || 'не указана'}`,
                status: 'new'
            });
        }
        
        Logger.info('Заявка на трудоустройство:', data);
        showSuccess('Ваша заявка принята! Мы свяжемся с вами в ближайшее время.');
        jobForm.reset();
    });
}

// ===== АНИМАЦИЯ КАРТОЧЕК ПРИ СКРОЛЛЕ =====

function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;
    
    const animatedElements = document.querySelectorAll(
        '.service-card, .about-block, .advantage-item'
    );
    
    if (animatedElements.length === 0) return;
    
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
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

// ===== ПЛАВНЫЙ СКРОЛЛ =====

function initSmoothScroll() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
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
}

// ===== ЗАГРУЗКА ОГРАНИЧЕНИЙ =====

async function loadHomeRestrictions() {
    const container = document.querySelector(HOME_SELECTORS.activeRestrictions);
    if (!container) return;
    
    if (typeof loadRestrictionsOnMain === 'function') {
        await loadRestrictionsOnMain('activeRestrictions');
    }
}

// ===== ХОВЕР НА ПРЕИМУЩЕСТВАХ =====

function initAdvantagesHover() {
    const advantagesList = document.querySelectorAll('.advantages-list li');
    
    advantagesList.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', async function() {
    Logger.info('Инициализация главной страницы...');
    
    const isHomePage = document.querySelector('.hero') !== null;
    if (!isHomePage) {
        Logger.debug('Не главная страница, пропускаем');
        return;
    }
    
    initHeroAnimations();
    initScrollAnimations();
    initHomeButtons();
    initAdvantagesHover();
    initRestrictionsCheck();
    initJobForm();
    
    await loadHomeRestrictions();
    
    initSmoothScroll();
    
    Logger.success('Главная страница инициализирована');
});

window.HomePage = {
    loadRestrictions: loadHomeRestrictions,
    initAnimations: initHeroAnimations
};