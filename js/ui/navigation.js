/* ========================================
   CALCULATOR.JS - Модуль калькулятора отопления
   Можно использовать на любой странице
   ======================================== */

// ===== КОНСТАНТЫ =====
const CALCULATOR_CONFIG = {
    tariffs: {
        residential: 3312.74,
        commercial: 3850.50,
        industrial: 2980.30
    },
    labels: {
        residential: 'Жилое помещение',
        commercial: 'Коммерческое помещение',
        industrial: 'Производственное помещение'
    },
    minArea: 20,
    maxArea: 10000,
    defaultConsumption: 0.025
};

// ===== РАСЧЁТ =====

/**
 * Рассчитать стоимость отопления
 * @param {Object} params - Параметры расчёта
 * @param {number} params.area - Площадь (м²)
 * @param {string} params.type - Тип помещения (residential/commercial/industrial)
 * @param {number} params.consumptionRate - Норматив потребления (Гкал/м²)
 * @returns {Object} Результат расчёта
 */
function calculateHeating(params) {
    const { area, type, consumptionRate } = params;

    // Валидация
    if (!area || area < CALCULATOR_CONFIG.minArea) {
        return {
            success: false,
            error: `Площадь должна быть не менее ${CALCULATOR_CONFIG.minArea} м²`
        };
    }

    if (area > CALCULATOR_CONFIG.maxArea) {
        return {
            success: false,
            error: `Площадь не может превышать ${CALCULATOR_CONFIG.maxArea.toLocaleString()} м²`
        };
    }

    const tariff = CALCULATOR_CONFIG.tariffs[type] || CALCULATOR_CONFIG.tariffs.residential;
    const rate = consumptionRate || CALCULATOR_CONFIG.defaultConsumption;
    const consumption = area * rate;
    const totalCost = consumption * tariff;

    return {
        success: true,
        area,
        type,
        typeLabel: CALCULATOR_CONFIG.labels[type] || type,
        tariff,
        consumptionRate: rate,
        consumption: +consumption.toFixed(3),
        totalCost: +totalCost.toFixed(2),
        formattedCost: formatCurrency(totalCost),
        formattedTariff: formatCurrency(tariff)
    };
}

/**
 * Рассчитать стоимость из HTML-формы
 * @param {HTMLFormElement} form - Форма калькулятора
 * @returns {Object} Результат
 */
function calculateFromForm(form) {
    const area = parseFloat(form.querySelector('[name="area"], #area')?.value);
    const type = form.querySelector('[name="type"], #type')?.value || 'residential';
    const consumptionRate = parseFloat(
        form.querySelector('[name="consumption"], #consumption')?.value || 
        CALCULATOR_CONFIG.defaultConsumption
    );

    return calculateHeating({ area, type, consumptionRate });
}

/**
 * Отобразить результат расчёта на странице
 * @param {Object} result - Результат из calculateHeating()
 * @param {Object} elements - Объект с DOM-элементами
 */
function displayCalculationResult(result, elements = {}) {
    const {
        resultEl = document.getElementById('result'),
        tariffEl = document.getElementById('tariff-rate'),
        consumptionEl = document.getElementById('consumption-value'),
        detailsEl = document.getElementById('result-details'),
        containerEl = document.querySelector('.result-card')
    } = elements;

    if (!result.success) {
        if (resultEl) resultEl.textContent = 'Ошибка';
        showError(result.error);
        return;
    }

    if (containerEl) {
        containerEl.style.display = 'block';
        containerEl.style.animation = 'slideDown 0.5s ease';
    }

    if (resultEl) {
        resultEl.textContent = `${result.formattedCost} ₽`;
        resultEl.style.animation = 'none';
        resultEl.offsetHeight;
        resultEl.style.animation = 'pulse 0.5s ease';
    }

    if (tariffEl) tariffEl.textContent = result.formattedTariff;
    if (consumptionEl) consumptionEl.textContent = result.consumption;

    if (detailsEl) {
        detailsEl.innerHTML = `
            <p>Тариф: <span>${result.formattedTariff} ₽/Гкал</span></p>
            <p>Потребление: <span>${result.consumption} Гкал</span></p>
        `;
    }
}

/**
 * Сохранить расчёт в историю
 * @param {Object} result - Результат расчёта
 */
function saveCalculationToHistory(result) {
    if (!result.success) return;

    const history = getFromStorage('calcHistory', []);

    history.push({
        area: result.area,
        type: result.type,
        typeLabel: result.typeLabel,
        cost: result.totalCost,
        consumption: result.consumption,
        date: new Date().toISOString()
    });

    if (history.length > 10) {
        history.shift();
    }

    setToStorage('calcHistory', history);
}

/**
 * Получить историю расчётов
 * @returns {Array}
 */
function getCalculationHistory() {
    return getFromStorage('calcHistory', []);
}

/**
 * Очистить историю расчётов
 */
function clearCalculationHistory() {
    setToStorage('calcHistory', []);
    showSuccess('История очищена');
}

/**
 * Инициализировать калькулятор на странице
 * @param {Object} options - Настройки
 */
function initCalculator(options = {}) {
    const {
        formSelector = '.calculator-form, [data-calculator]',
        onCalculate = null
    } = options;

    const forms = document.querySelectorAll(formSelector);
    if (forms.length === 0) return;

    forms.forEach(form => {
        // Кнопка расчёта
        const calculateBtn = form.querySelector('.calculate-btn, [data-action="calculate"]');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const result = calculateFromForm(form);

                if (result.success) {
                    saveCalculationToHistory(result);
                }

                if (typeof onCalculate === 'function') {
                    onCalculate(result);
                } else {
                    displayCalculationResult(result);
                }
            });
        }

        // Валидация площади
        const areaInput = form.querySelector('[name="area"], #area');
        if (areaInput) {
            areaInput.addEventListener('input', function() {
                const value = parseFloat(this.value);

                if (this.value && (isNaN(value) || value < CALCULATOR_CONFIG.minArea)) {
                    this.classList.add('error');
                } else if (this.value && value >= CALCULATOR_CONFIG.minArea) {
                    this.classList.remove('error');
                    this.classList.add('success');
                } else {
                    this.classList.remove('error', 'success');
                }
            });

            areaInput.addEventListener('keydown', function(e) {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                }
            });
        }

        // Расчёт по Enter
        form.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
                    e.preventDefault();
                    const result = calculateFromForm(form);

                    if (result.success) {
                        saveCalculationToHistory(result);
                    }

                    if (typeof onCalculate === 'function') {
                        onCalculate(result);
                    } else {
                        displayCalculationResult(result);
                    }
                }
            }
        });
    });

    Logger.info('Калькулятор инициализирован');
}

// ===== АВТОИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    const calculatorForms = document.querySelectorAll('.calculator-form, [data-calculator]');
    if (calculatorForms.length > 0) {
        initCalculator();
    }
});

// Экспорт API
window.Calculator = {
    calculate: calculateHeating,
    calculateFromForm,
    displayResult: displayCalculationResult,
    getHistory: getCalculationHistory,
    clearHistory: clearCalculationHistory,
    init: initCalculator,
    config: CALCULATOR_CONFIG
};