/* ========================================
   TARIFFS.JS - Логика страницы тарифов
   Содержит: калькулятор стоимости, 
   тарифные планы, поиск улиц
   ======================================== */

// ===== КОНСТАНТЫ =====
const TARIFFS_SELECTORS = {
    calculator: '.calculator-form',
    areaInput: '#area',
    typeSelect: '#type',
    consumptionSelect: '#consumption',
    calculateBtn: '.calculate-btn',
    resultDisplay: '#result',
    resultDetails: '#result-details',
    tariffRate: '#tariff-rate',
    consumptionValue: '#consumption-value',
    tariffCards: '.tariff-card',
    tariffButtons: '.tariff-btn',
    streetFilter: '#streetFilter',
    scheduleSection: '.schedule-section',
    plansGrid: '#tariffPlans'
};

// ===== ТАРИФЫ =====
const TARIFF_RATES = {
    residential: 3312.74,   // Жилые помещения
    commercial: 3850.50,    // Коммерческие
    industrial: 2980.30     // Производственные
};

const TARIFF_LABELS = {
    residential: 'Жилое помещение',
    commercial: 'Коммерческое помещение',
    industrial: 'Производственное помещение'
};

// ===== ТАРИФНЫЕ ПЛАНЫ =====

/**
 * Создать карточку тарифного плана
 * @param {Object} plan - Данные плана
 * @returns {HTMLElement}
 */
function createTariffCard(plan) {
    const card = document.createElement('div');
    card.className = `tariff-card ${plan.type || ''}`;
    
    card.innerHTML = `
        <div class="tariff-badge">${plan.badge || 'Тариф'}</div>
        <h3>${escapeHtml(plan.title)}</h3>
        <div class="tariff-price">
            <span>${formatCurrency(plan.price)}</span>
            <small>${plan.unit || 'за Гкал'}</small>
        </div>
        <ul class="tariff-list">
            ${plan.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
        <button class="tariff-btn" data-plan="${plan.id || ''}">Выбрать тариф</button>
    `;
    
    return card;
}

/**
 * Загрузить тарифные планы
 */
function loadTariffPlans() {
    const container = document.querySelector(TARIFFS_SELECTORS.plansGrid);
    if (!container) return;
    
    // Можно загружать из DB или API
    const plans = [
        {
            id: 'basic',
            type: '',
            badge: 'Базовый',
            title: 'Стандартное теплоснабжение',
            price: 3312.74,
            unit: 'за Гкал',
            features: [
                '🏠 Для жилых домов',
                '📅 Круглогодичное действие',
                '📝 Ежемесячная отчетность',
                '🔧 Техподдержка в рабочее время'
            ]
        },
        {
            id: 'economy',
            type: 'eco',
            badge: 'Эконом',
            title: 'Экономное отопление',
            price: 2980.30,
            unit: 'за Гкал',
            features: [
                '🏠 Для жилых домов',
                '💡 Сниженный норматив',
                '📊 Приборы учёта включены',
                '📅 Сезонное отключение'
            ]
        },
        {
            id: 'business',
            type: 'business',
            badge: 'Бизнес',
            title: 'Для юридических лиц',
            price: 3850.50,
            unit: 'за Гкал',
            features: [
                '🏢 Коммерческие помещения',
                '📋 Договорная основа',
                '📊 Индивидуальный расчёт',
                '🔧 Приоритетная поддержка'
            ]
        }
    ];
    
    container.innerHTML = '';
    
    plans.forEach(plan => {
        const card = createTariffCard(plan);
        container.appendChild(card);
    });
    
    // Инициализируем кнопки
    initTariffButtons();
    
    Logger.info('Тарифные планы загружены');
}

/**
 * Инициализировать кнопки тарифов
 */
function initTariffButtons() {
    const buttons = document.querySelectorAll(TARIFFS_SELECTORS.tariffButtons);
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.tariff-card');
            if (!card) return;
            
            const title = card.querySelector('h3')?.textContent || '';
            const price = card.querySelector('.tariff-price span')?.textContent || '';
            
            // Показываем уведомление
            showSuccess(`Выбран тариф: ${title}`);
            
            // Можно перенаправить на форму подключения
            setTimeout(() => {
                window.location.href = `reception.html?service=tariff&plan=${encodeURIComponent(title)}`;
            }, 1000);
        });
    });
}

// ===== КАЛЬКУЛЯТОР =====

/**
 * Рассчитать стоимость отопления
 */
function calculateHeatingCost() {
    const areaInput = document.querySelector(TARIFFS_SELECTORS.areaInput);
    const typeSelect = document.querySelector(TARIFFS_SELECTORS.typeSelect);
    const consumptionSelect = document.querySelector(TARIFFS_SELECTORS.consumptionSelect);
    
    if (!areaInput || !typeSelect || !consumptionSelect) {
        Logger.warn('Элементы калькулятора не найдены');
        return;
    }
    
    // Получаем значения
    const area = parseFloat(areaInput.value);
    const type = typeSelect.value;
    const consumptionRate = parseFloat(consumptionSelect.value);
    
    // Валидация
    if (!area || area < 20) {
        showError('Пожалуйста, введите корректную площадь (минимум 20 м²)');
        highlightInvalidField(areaInput);
        return;
    }
    
    if (area > 10000) {
        showError('Площадь не может превышать 10 000 м². Для больших объектов свяжитесь с нами.');
        highlightInvalidField(areaInput);
        return;
    }
    
    // Получаем тариф
    const tariff = TARIFF_RATES[type] || TARIFF_RATES.residential;
    
    // Рассчитываем
    const consumption = area * consumptionRate;
    const totalCost = consumption * tariff;
    
    // Отображаем результат
    displayCalculationResult(totalCost, consumption, tariff);
    
    // Анимируем результат
    animateResult();
    
    // Сохраняем в историю
    saveCalculationToHistory(area, type, totalCost);
    
    // Уведомление
    showSuccess('Расчёт выполнен успешно!');
    
    Logger.info('Расчёт отопления:', { area, type, consumptionRate, totalCost });
}

/**
 * Отобразить результат расчёта
 * @param {number} cost - Стоимость
 * @param {number} consumption - Потребление
 * @param {number} tariff - Тариф
 */
function displayCalculationResult(cost, consumption, tariff) {
    const resultDisplay = document.querySelector(TARIFFS_SELECTORS.resultDisplay);
    const tariffRate = document.querySelector(TARIFFS_SELECTORS.tariffRate);
    const consumptionValue = document.querySelector(TARIFFS_SELECTORS.consumptionValue);
    
    if (resultDisplay) {
        resultDisplay.textContent = `${formatCurrency(cost)} ₽`;
    }
    
    if (tariffRate) {
        tariffRate.textContent = formatCurrency(tariff);
    }
    
    if (consumptionValue) {
        consumptionValue.textContent = consumption.toFixed(3);
    }
    
    // Показываем блок с результатами, если скрыт
    const resultCard = document.querySelector('.result-card');
    if (resultCard && resultCard.style.display === 'none') {
        resultCard.style.display = 'block';
        resultCard.style.animation = 'slideDown 0.5s ease';
    }
}

/**
 * Анимировать результат расчёта
 */
function animateResult() {
    const resultDisplay = document.querySelector(TARIFFS_SELECTORS.resultDisplay);
    if (!resultDisplay) return;
    
    // Сбрасываем анимацию
    resultDisplay.style.animation = 'none';
    resultDisplay.offsetHeight; // reflow
    
    // Запускаем анимацию
    resultDisplay.style.animation = 'pulse 0.5s ease';
    
    setTimeout(() => {
        resultDisplay.style.animation = '';
    }, 500);
}

/**
 * Подсветить невалидное поле
 * @param {HTMLElement} field - Поле ввода
 */
function highlightInvalidField(field) {
    if (!field) return;
    
    field.style.borderColor = '#ff4444';
    field.style.animation = 'shake 0.3s ease';
    
    setTimeout(() => {
        field.style.borderColor = '';
        field.style.animation = '';
    }, 3000);
}

/**
 * Сохранить расчёт в историю
 * @param {number} area - Площадь
 * @param {string} type - Тип помещения
 * @param {number} cost - Стоимость
 */
function saveCalculationToHistory(area, type, cost) {
    const history = getFromStorage('calcHistory', []);
    
    history.push({
        area: area,
        type: type,
        typeLabel: TARIFF_LABELS[type] || type,
        cost: cost,
        date: new Date().toISOString()
    });
    
    // Храним последние 10 расчётов
    if (history.length > 10) {
        history.shift();
    }
    
    setToStorage('calcHistory', history);
}

/**
 * Инициализировать калькулятор
 */
function initCalculator() {
    const calculator = document.querySelector(TARIFFS_SELECTORS.calculator);
    if (!calculator) return;
    
    // Кнопка расчёта
    const calculateBtn = document.querySelector(TARIFFS_SELECTORS.calculateBtn);
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            calculateHeatingCost();
        });
    }
    
    // Расчёт по Enter
    const inputs = calculator.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateHeatingCost();
            }
        });
    });
    
    // Валидация площади при вводе
    const areaInput = document.querySelector(TARIFFS_SELECTORS.areaInput);
    if (areaInput) {
        areaInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            
            if (this.value && (isNaN(value) || value < 20)) {
                this.style.borderColor = '#ff4444';
            } else if (this.value && value >= 20) {
                this.style.borderColor = '#4CAF50';
            } else {
                this.style.borderColor = '';
            }
        });
        
        // Предотвращаем ввод отрицательных чисел
        areaInput.addEventListener('keydown', function(e) {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        });
    }
    
    Logger.info('Калькулятор инициализирован');
}

// ===== ПОИСК ПО УЛИЦАМ =====

/**
 * Инициализировать поиск улиц в графике отключений
 */
function initStreetFilter() {
    const filterInput = document.querySelector(TARIFFS_SELECTORS.streetFilter);
    if (!filterInput) return;
    
    filterInput.addEventListener('input', debounce(function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterStreetsTable(searchTerm);
    }, 300));
    
    // Очистка по Escape
    filterInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            filterStreetsTable('');
        }
    });
    
    Logger.info('Фильтр улиц инициализирован');
}

/**
 * Фильтровать таблицу улиц
 * @param {string} searchTerm - Поисковый запрос
 */
function filterStreetsTable(searchTerm) {
    // Если есть активные ограничения — фильтруем их
    const restrictionItems = document.querySelectorAll('.restriction-alert, .restriction-card');
    
    if (restrictionItems.length > 0) {
        restrictionItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (!searchTerm || text.includes(searchTerm)) {
                item.style.display = '';
                item.style.animation = 'fadeIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Если есть таблица — фильтруем строки
    const tableRows = document.querySelectorAll('.schedule-table tbody tr');
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (!searchTerm || text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Обновляем счётчик найденных
    updateSearchCounter(searchTerm);
}

/**
 * Обновить счётчик найденных результатов
 * @param {string} searchTerm - Поисковый запрос
 */
function updateSearchCounter(searchTerm) {
    let counter = document.querySelector('.search-counter');
    
    if (!counter && searchTerm) {
        counter = document.createElement('div');
        counter.className = 'search-counter';
        counter.style.cssText = `
            text-align: center;
            margin-top: 15px;
            color: var(--color-text-muted);
            font-size: 14px;
        `;
        
        const filterInput = document.querySelector(TARIFFS_SELECTORS.streetFilter);
        if (filterInput && filterInput.parentElement) {
            filterInput.parentElement.appendChild(counter);
        }
    }
    
    if (counter) {
        if (searchTerm) {
            const visibleCount = document.querySelectorAll(
                '.restriction-alert[style*="display:"]:not([style*="display: none"]), ' +
                '.restriction-alert:not([style*="display"])'
            ).length;
            
            const totalCount = document.querySelectorAll('.restriction-alert').length;
            
            counter.textContent = `Найдено: ${visibleCount} из ${totalCount}`;
            counter.style.display = '';
        } else {
            counter.style.display = 'none';
        }
    }
}

// ===== АНИМАЦИИ =====

/**
 * Инициализировать анимации для страницы тарифов
 */
function initTariffAnimations() {
    // Анимация карточек тарифов
    const cards = document.querySelectorAll(TARIFFS_SELECTORS.tariffCards);
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 150);
    });
    
    // Анимация калькулятора
    const calculator = document.querySelector('.calculator-container');
    if (calculator) {
        calculator.style.opacity = '0';
        calculator.style.transform = 'translateY(30px)';
        calculator.style.transition = 'all 0.6s ease 0.3s';
        
        setTimeout(() => {
            calculator.style.opacity = '1';
            calculator.style.transform = 'translateY(0)';
        }, 500);
    }
}

// ===== ИСТОРИЯ РАСЧЁТОВ =====

/**
 * Показать историю расчётов (если есть)
 */
function showCalculationHistory() {
    const history = getFromStorage('calcHistory', []);
    
    if (history.length === 0) {
        showNotification('История расчётов пуста', 'info');
        return;
    }
    
    let message = '📊 Последние расчёты:\n\n';
    
    history.reverse().forEach((calc, index) => {
        message += `${index + 1}. ${calc.typeLabel}\n`;
        message += `   Площадь: ${calc.area} м²\n`;
        message += `   Стоимость: ${formatCurrency(calc.cost)}\n`;
        message += `   Дата: ${formatDate(calc.date, 'short')}\n\n`;
    });
    
    alert(message);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    Logger.info('Инициализация страницы тарифов...');
    
    // Проверяем, что мы на странице тарифов
    const isTariffsPage = document.querySelector('.tariffs-hero') !== null ||
                          document.querySelector(TARIFFS_SELECTORS.calculator) !== null;
    
    if (!isTariffsPage) {
        Logger.debug('Не страница тарифов, пропускаем');
        return;
    }
    
    // Загружаем тарифные планы
    loadTariffPlans();
    
    // Инициализируем калькулятор
    initCalculator();
    
    // Инициализируем поиск улиц
    initStreetFilter();
    
    // Анимации
    initTariffAnimations();
    
    // Загружаем ограничения, если есть контейнер
    if (typeof loadRestrictionsOnMain === 'function') {
        loadRestrictionsOnMain();
    }
    
    Logger.success('Страница тарифов инициализирована');
});

// Экспорт API
window.TariffsPage = {
    calculate: calculateHeatingCost,
    showHistory: showCalculationHistory,
    loadPlans: loadTariffPlans,
    TARIFF_RATES
};