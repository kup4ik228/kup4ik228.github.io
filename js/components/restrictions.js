/* ========================================
   RESTRICTIONS.JS - Модуль ограничений подачи тепла
   Используется на главной, тарифах и в админке
   Зависимости: database.js, core.js
   ======================================== */

// ===== КОНСТАНТЫ =====
const REASON_TEXTS = {
    repair: '🔧 Плановый ремонт',
    emergency: '🚨 Аварийные работы',
    maintenance: '🛠️ Техническое обслуживание',
    upgrade: '⚡ Модернизация сетей',
    other: '📋 Другое'
};

const REASON_ICONS = {
    repair: '🔧',
    emergency: '🚨',
    maintenance: '🛠️',
    upgrade: '⚡',
    other: '📋'
};

// ===== ПОЛУЧЕНИЕ ДАННЫХ =====

async function getActiveRestrictions() {
    if (typeof DB !== 'undefined' && DB.getActiveRestrictions) {
        return await DB.getActiveRestrictions();
    }

    const restrictions = getFromStorage('teplolux_restrictions', []);
    const now = new Date();

    return restrictions.filter(r => {
        if (r.status !== 'active') return false;
        const dateTo = new Date(r.date_to + 'T' + (r.time_to || '23:59'));
        return dateTo >= now;
    }).sort((a, b) => new Date(a.date_from) - new Date(b.date_from));
}

async function getAllRestrictions(filter = 'all') {
    if (typeof DB !== 'undefined' && DB.getAllRestrictions) {
        return await DB.getAllRestrictions(filter);
    }

    const restrictions = getFromStorage('teplolux_restrictions', []);

    if (filter === 'all') {
        return restrictions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return restrictions
        .filter(r => r.status === filter)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getReasonText(reason) {
    return REASON_TEXTS[reason] || reason || 'Не указана';
}

function getReasonIcon(reason) {
    return REASON_ICONS[reason] || '📋';
}

// ===== ДОБАВЛЕНИЕ ОГРАНИЧЕНИЯ =====

async function addRestriction(data) {
    if (typeof DB !== 'undefined' && DB.addRestriction) {
        return await DB.addRestriction(data);
    }

    if (!data.streets || !data.streets.length) {
        showError('Добавьте хотя бы одну улицу');
        return null;
    }

    if (!data.dateFrom || !data.dateTo) {
        showError('Укажите даты начала и окончания');
        return null;
    }

    const restrictions = getFromStorage('teplolux_restrictions', []);

    const newRestriction = {
        id: generateId('rest'),
        streets: data.streets,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        timeFrom: data.timeFrom || '09:00',
        timeTo: data.timeTo || '17:00',
        reason: data.reason || 'other',
        description: data.description || '',
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    restrictions.push(newRestriction);
    setToStorage('teplolux_restrictions', restrictions);

    Logger.success('Добавлено ограничение:', newRestriction.id);
    return newRestriction;
}

// ===== ОБНОВЛЕНИЕ СТАТУСА =====

async function updateRestrictionStatus(id, status) {
    if (typeof DB !== 'undefined' && DB.updateRestrictionStatus) {
        return await DB.updateRestrictionStatus(id, status);
    }

    const restrictions = getFromStorage('teplolux_restrictions', []);
    const index = restrictions.findIndex(r => r.id === id);

    if (index !== -1) {
        restrictions[index].status = status;
        if (status === 'completed') {
            restrictions[index].completedAt = new Date().toISOString();
        }
        setToStorage('teplolux_restrictions', restrictions);
        return restrictions[index];
    }

    return null;
}

async function completeRestriction(id) {
    if (confirm('Отметить ограничение как завершённое?')) {
        const result = await updateRestrictionStatus(id, 'completed');
        if (result) {
            showSuccess('Ограничение завершено');
            if (typeof loadRestrictionsAdmin === 'function') {
                await loadRestrictionsAdmin();
            }
            if (typeof updateBadges === 'function') {
                updateBadges();
            }
        }
    }
}

// ===== УДАЛЕНИЕ =====

async function deleteRestriction(id) {
    if (!confirm('Удалить ограничение? Это действие нельзя отменить.')) {
        return false;
    }

    if (typeof DB !== 'undefined' && DB.deleteRestriction) {
        const result = await DB.deleteRestriction(id);
        if (result) {
            showSuccess('Ограничение удалено');
            if (typeof loadRestrictionsAdmin === 'function') {
                await loadRestrictionsAdmin();
            }
            if (typeof updateBadges === 'function') {
                updateBadges();
            }
        }
        return result;
    }

    const restrictions = getFromStorage('teplolux_restrictions', []);
    const filtered = restrictions.filter(r => r.id !== id);
    setToStorage('teplolux_restrictions', filtered);

    showSuccess('Ограничение удалено');
    return true;
}

// ===== СТАТИСТИКА =====

function getRestrictionsStats() {
    const restrictions = getFromStorage('teplolux_restrictions', []);

    return {
        total: restrictions.length,
        active: restrictions.filter(r => r.status === 'active').length,
        completed: restrictions.filter(r => r.status === 'completed').length
    };
}

// ===== ПРОВЕРКА АДРЕСА =====

function checkAddressRestrictions(street, house) {
    if (!street) return [];

    const restrictions = getFromStorage('teplolux_restrictions', []);
    const now = new Date();

    const activeRestrictions = restrictions.filter(r => {
        if (r.status !== 'active') return false;
        const dateTo = new Date(r.date_to + 'T' + (r.time_to || '23:59'));
        return dateTo >= now;
    });

    const streetLower = street.toLowerCase().trim();

    return activeRestrictions.filter(r =>
        r.streets.some(s => streetLower.includes(s.toLowerCase()))
    );
}

function checkRestrictions(street, house, email) {
    if (!street || !house) {
        showError('Пожалуйста, укажите улицу и номер дома');
        return;
    }

    const affected = checkAddressRestrictions(street, house);

    if (affected.length > 0) {
        let message = `⚠️ По адресу ${street}, ${house} есть ограничения:\n\n`;

        affected.forEach(r => {
            const dateFrom = new Date(r.date_from + 'T' + (r.time_from || '09:00'));
            const dateTo = new Date(r.date_to + 'T' + (r.time_to || '17:00'));

            message += `📅 Период: ${formatDate(dateFrom, 'full')} — ${formatDate(dateTo, 'full')}\n`;
            message += `📋 Причина: ${getReasonText(r.reason)}\n`;
            if (r.description) {
                message += `📝 Описание: ${r.description}\n`;
            }
            message += `🏠 Улицы: ${r.streets.join(', ')}\n\n`;
        });

        alert(message);

        if (email && isValidEmail(email)) {
            Logger.info('Информация отправлена на email:', email);
            showSuccess(`Информация отправлена на ${email}`);
        }
    } else {
        alert(`✅ По адресу ${street}, ${house} ограничений нет`);
        showSuccess('Ограничений не найдено');
    }
}

// ===== РЕНДЕРИНГ (ДЛЯ ГЛАВНОЙ) =====

async function loadRestrictionsOnMain(containerId = 'activeRestrictions') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const restrictions = await getActiveRestrictions();

    if (restrictions.length === 0) {
        container.innerHTML = `
            <div class="no-restrictions animate-slideDown">
                <span style="font-size: 24px;">✅</span>
                <h3 style="margin-top: 10px;">На данный момент ограничений нет</h3>
                <p>Теплоснабжение осуществляется в штатном режиме</p>
            </div>
        `;
        return;
    }

    let html = '';

    restrictions.forEach(r => {
        const dateFrom = new Date(r.date_from + 'T' + (r.time_from || '09:00'));
        const dateTo = new Date(r.date_to + 'T' + (r.time_to || '17:00'));

        html += `
            <div class="restriction-alert animate-slideDown">
                <h3>
                    <span>🚧</span>
                    Внимание! Ограничение подачи тепла
                </h3>

                <div class="restriction-streets">
                    ${r.streets.map(s => `<span class="restriction-street">${escapeHtml(s)}</span>`).join('')}
                </div>

                <div class="restriction-time">
                    ⏰ С ${formatDate(dateFrom, 'full')} до ${formatDate(dateTo, 'full')}
                </div>

                <div class="restriction-reason">
                    <strong>Причина:</strong> ${getReasonText(r.reason)}
                    ${r.description ? `<br>${escapeHtml(r.description)}` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ===== РЕНДЕРИНГ (ДЛЯ АДМИНКИ) =====

async function loadRestrictionsAdmin(filter = 'all', search = '') {
    let restrictions = await getAllRestrictions(filter);

    if (search) {
        const searchLower = search.toLowerCase();
        restrictions = restrictions.filter(r =>
            r.streets.some(s => s.toLowerCase().includes(searchLower))
        );
    }

    const listContainer = document.getElementById('restrictionsList');
    if (!listContainer) return;

    if (restrictions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🚧</div>
                <h3>Нет ограничений</h3>
                <p>${filter === 'active' ? 'Нет активных ограничений' : 'Добавьте первое ограничение'}</p>
            </div>
        `;
        return;
    }

    let html = '';

    restrictions.forEach(r => {
        const statusClass = r.status === 'active' ? 'status-active' : 'status-completed';
        const statusText = r.status === 'active' ? '🟢 Активно' : '⚪ Завершено';

        html += `
            <div class="restriction-card ${r.status === 'completed' ? 'completed' : ''}">
                <div class="restriction-header">
                    <span class="restriction-status ${statusClass}">${statusText}</span>
                    <span>${formatDate(r.created_at, 'short')}</span>
                </div>

                <div class="street-tags">
                    ${r.streets.map(s => `<span class="street-tag">${escapeHtml(s)}</span>`).join('')}
                </div>

                <div class="restriction-info">
                    <div>
                        <strong>С:</strong> 
                        ${formatDate(new Date(r.date_from + 'T' + (r.time_from || '09:00')), 'full')}
                    </div>
                    <div>
                        <strong>До:</strong> 
                        ${formatDate(new Date(r.date_to + 'T' + (r.time_to || '17:00')), 'full')}
                    </div>
                </div>

                <p><strong>Причина:</strong> ${getReasonText(r.reason)}</p>
                ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ''}

                <div class="restriction-actions">
                    ${r.status === 'active' ? 
                        `<button class="complete-btn" onclick="completeRestriction('${r.id}')">
                            ✅ Завершить
                        </button>` : 
                        ''}
                    <button class="delete-btn" onclick="deleteRestriction('${r.id}')">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// ===== ФОРМА ДОБАВЛЕНИЯ (ДЛЯ АДМИНКИ) =====

let tempStreets = [];

function showAddRestrictionModal() {
    tempStreets = [];

    const modal = document.getElementById('restrictionModal');
    if (!modal) return;

    modal.style.display = 'flex';

    const form = document.getElementById('restrictionForm');
    if (form) form.reset();

    const streetsList = document.getElementById('streetsList');
    if (streetsList) streetsList.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    if (dateFromInput) dateFromInput.value = today;
    if (dateToInput) dateToInput.value = today;
}

function closeRestrictionModal() {
    const modal = document.getElementById('restrictionModal');
    if (modal) modal.style.display = 'none';
    tempStreets = [];
}

function addStreetToList() {
    const input = document.getElementById('streetInput');
    if (!input) return;

    const street = input.value.trim();

    if (!street) return;

    if (tempStreets.includes(street)) {
        showError('Эта улица уже добавлена');
        return;
    }

    tempStreets.push(street);
    updateStreetsList();
    input.value = '';
    input.focus();
}

function removeStreetFromList(street) {
    tempStreets = tempStreets.filter(s => s !== street);
    updateStreetsList();
}

function updateStreetsList() {
    const list = document.getElementById('streetsList');
    if (!list) return;

    list.innerHTML = tempStreets.map(s => `
        <div class="street-item">
            <span>${escapeHtml(s)}</span>
            <button type="button" class="remove-street" onclick="removeStreetFromList('${escapeHtml(s)}')">
                ×
            </button>
        </div>
    `).join('');
}

// ===== ОБРАБОТЧИК ФОРМЫ =====

function initRestrictionForm() {
    const form = document.getElementById('restrictionForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (tempStreets.length === 0) {
            showError('Добавьте хотя бы одну улицу');
            return;
        }

        const data = {
            streets: [...tempStreets],
            dateFrom: document.getElementById('dateFrom')?.value || '',
            dateTo: document.getElementById('dateTo')?.value || '',
            timeFrom: document.getElementById('timeFrom')?.value || '09:00',
            timeTo: document.getElementById('timeTo')?.value || '17:00',
            reason: document.getElementById('reason')?.value || 'other',
            description: document.getElementById('description')?.value || ''
        };

        const result = await addRestriction(data);

        if (result) {
            closeRestrictionModal();
            await loadRestrictionsAdmin();

            if (typeof updateBadges === 'function') {
                updateBadges();
            }

            showSuccess('Ограничение добавлено');
        }
    });

    const streetInput = document.getElementById('streetInput');
    if (streetInput) {
        streetInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addStreetToList();
            }
        });
    }

    const modal = document.getElementById('restrictionModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeRestrictionModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeRestrictionModal();
        }
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('activeRestrictions')) {
        await loadRestrictionsOnMain();
    }

    if (document.getElementById('restrictionsList')) {
        await loadRestrictionsAdmin();
        initRestrictionForm();
    }

    const checkForm = document.getElementById('restrictionsCheckForm');
    if (checkForm) {
        checkForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const street = document.getElementById('checkStreet')?.value || '';
            const house = document.getElementById('checkHouse')?.value || '';
            const email = document.getElementById('checkEmail')?.value || '';

            checkRestrictions(street, house, email);
        });
    }
});

Logger.info('Модуль ограничений загружен');