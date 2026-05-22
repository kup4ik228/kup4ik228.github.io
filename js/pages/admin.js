/* ========================================
   ADMIN.JS - Административная панель
   Сессия сохраняется в cookies (adminSession)
   ======================================== */

const ADMIN_SELECTORS = {
    login: '#adminLogin',
    loginForm: '#loginForm',
    username: '#username',
    password: '#password',
    panel: '#adminPanel',
    navItems: '.admin-nav li',
    pageTitle: '#pageTitle',
    adminPages: '#adminPages',
    adminDateTime: '#adminDateTime',
    userInfo: '#adminUserInfo',
    badges: {
        receptions: '#receptionsBadge',
        restrictions: '#restrictionsBadge'
    }
};

const PAGE_TITLES = {
    dashboard: '📊 Дашборд',
    receptions: '📨 Виртуальная приёмная',
    restrictions: '🚧 Ограничения',
    applications: '💼 Заявки на работу',
    settings: '⚙️ Настройки'
};

let currentPage = 'dashboard';

// ===== АВТОРИЗАЦИЯ =====
function initAdminLogin() {
    const loginForm = document.querySelector(ADMIN_SELECTORS.loginForm);
    if (!loginForm) return;

    // Проверяем куку при загрузке
    const cookie = getCookie('adminSession');
    if (cookie) {
        try {
            const user = JSON.parse(cookie);
            AppState.currentAdmin = user;
            AppState.isAdmin = true;
            showAdminPanel();
            return;
        } catch (e) {
            deleteCookie('adminSession');
        }
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.querySelector(ADMIN_SELECTORS.username)?.value || '';
        const password = document.querySelector(ADMIN_SELECTORS.password)?.value || '';

        console.log('🔑 Попытка входа:', username);

        if (!username || !password) {
            showError('Введите логин и пароль');
            return;
        }

        // Локальная проверка
        if (username === 'admin' && password === 'admin123') {
            console.log('✅ Локальный вход');
            const user = { id: '1', username: 'admin', name: 'Администратор', role: 'admin' };
            AppState.currentAdmin = user;
            AppState.isAdmin = true;
            setCookie('adminSession', JSON.stringify(user), 7);
            showAdminPanel();
            showSuccess('Добро пожаловать, Администратор!');
            return;
        }

        // Проверка через БД
        if (typeof DB !== 'undefined' && DB.login) {
            const user = await DB.login(username, password);
            if (user) {
                console.log('✅ Вход через БД');
                AppState.currentAdmin = user;
                AppState.isAdmin = true;
                setCookie('adminSession', JSON.stringify(user), 7);
                showAdminPanel();
                showSuccess(`Добро пожаловать, ${user.name || 'Администратор'}!`);
                return;
            }
        }

        console.log('🔴 Неверный логин или пароль');
        showError('Неверный логин или пароль');
    });
}

function showAdminPanel() {
    const login = document.querySelector(ADMIN_SELECTORS.login);
    const panel = document.querySelector(ADMIN_SELECTORS.panel);

    if (login) login.style.display = 'none';
    if (panel) panel.style.display = 'flex';

    updateAdminUserInfo();
    showPage('dashboard');
    updateAdminDateTime();
    setInterval(updateAdminDateTime, 30000);
    updateBadges();
}

function updateAdminUserInfo() {
    const userInfo = document.querySelector(ADMIN_SELECTORS.userInfo);
    if (!userInfo) return;
    const user = AppState.currentAdmin;
    if (!user) return;

    userInfo.innerHTML = `
        <div class="admin-user-avatar">${(user.name?.charAt(0) || 'A').toUpperCase()}</div>
        <div class="admin-user-name">${escapeHtml(user.name || 'Администратор')}</div>
        <div class="admin-user-role">Администратор</div>
    `;
}

// ===== НАВИГАЦИЯ =====
async function showPage(page, navElement) {
    currentPage = page;

    const navItems = document.querySelectorAll(ADMIN_SELECTORS.navItems);
    navItems.forEach(item => item.classList.remove('active'));
    if (navElement) navElement.classList.add('active');

    const pageTitle = document.querySelector(ADMIN_SELECTORS.pageTitle);
    if (pageTitle) pageTitle.textContent = PAGE_TITLES[page] || 'Админ-панель';

    switch (page) {
        case 'dashboard': await loadDashboard(); break;
        case 'receptions': await loadReceptions(); break;
        case 'restrictions': await loadRestrictions(); break;
        case 'applications': loadApplications(); break;
        case 'settings': loadSettings(); break;
        default: await loadDashboard();
    }

    updateBadges();
}

// ===== ДАШБОРД =====
async function loadDashboard() {
    const container = document.querySelector(ADMIN_SELECTORS.adminPages);
    if (!container) return;

    let stats = { totalReceptions: 0, newReceptions: 0, viewedReceptions: 0, answeredReceptions: 0, closedReceptions: 0, activeRestrictions: 0 };
    let recentReceptions = [];

    if (typeof DB !== 'undefined') {
        if (DB.getStats) stats = await DB.getStats();
        if (DB.getReceptions) {
            recentReceptions = await DB.getReceptions();
            recentReceptions = recentReceptions.slice(0, 5);
        }
    }

    let html = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon">📨</div><div class="stat-info"><h3>Всего обращений</h3><div class="stat-number">${stats.totalReceptions}</div></div></div>
            <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-info"><h3>Новых</h3><div class="stat-number" style="color:#ff4444;">${stats.newReceptions}</div></div></div>
            <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-info"><h3>В обработке</h3><div class="stat-number" style="color:#ff9f43;">${stats.viewedReceptions}</div></div></div>
            <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-info"><h3>Отвечено</h3><div class="stat-number" style="color:#4CAF50;">${stats.answeredReceptions}</div></div></div>
            <div class="stat-card"><div class="stat-icon">🚧</div><div class="stat-info"><h3>Активных ограничений</h3><div class="stat-number" style="color:#ff6b6b;">${stats.activeRestrictions}</div></div></div>
        </div>
        <h2 style="margin:30px 0 20px;">📨 Последние обращения</h2>
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead><tr><th>Дата</th><th>Тип</th><th>ФИО</th><th>Тема</th><th>Статус</th><th>Действия</th></tr></thead>
                <tbody>
    `;

    if (recentReceptions.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">📭 Нет обращений</td></tr>';
    } else {
        recentReceptions.forEach(rec => {
            const date = rec.created_at || rec.date || '';
            const status = rec.status || 'new';
            html += `
                <tr>
                    <td>${formatDate(date, 'short')}</td>
                    <td>${getTypeLabel(rec.type)}</td>
                    <td>${escapeHtml(rec.fullname || '—')}</td>
                    <td>${escapeHtml((rec.subject || '—').substring(0, 50))}</td>
                    <td><span class="status-badge status-${status}">${getStatusLabel(status)}</span></td>
                    <td>
                        <button class="table-btn view-btn" onclick="viewReception('${rec.id}')">👁️</button>
                        ${status !== 'closed' ? `<button class="table-btn close-btn" onclick="closeReception('${rec.id}')">📦</button>` : ''}
                    </td>
                </tr>
            `;
        });
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ===== ОБРАЩЕНИЯ =====
async function loadReceptions() {
    const container = document.querySelector(ADMIN_SELECTORS.adminPages);
    if (!container) return;

    let receptions = [];
    if (typeof DB !== 'undefined' && DB.getReceptions) {
        receptions = await DB.getReceptions();
    }

    let html = `
        <div class="page-filters">
            <select class="filter-select" id="receptionFilter" onchange="filterReceptions()">
                <option value="all">Все обращения</option>
                <option value="new">🆕 Новые</option>
                <option value="viewed">📝 Просмотренные</option>
                <option value="answered">✅ Отвеченные</option>
                <option value="closed">📦 Закрытые</option>
            </select>
            <input type="text" id="receptionSearch" placeholder="🔍 Поиск..." oninput="filterReceptions()" class="filter-select" style="flex:2;">
        </div>
        <div class="receptions-grid" id="receptionsGrid">
    `;

    if (receptions.length === 0) {
        html += '<div class="empty-state"><div class="empty-icon">📭</div><h3>Нет обращений</h3><p>Обращения появятся после отправки</p></div>';
    } else {
        receptions.forEach(rec => {
            html += `
                <div class="reception-card" data-id="${rec.id}" data-status="${rec.status || 'new'}">
                    <div class="reception-card-header">
                        <span class="card-type-badge">${getTypeLabel(rec.type)}</span>
                        <span class="card-date">${formatDate(rec.created_at || rec.date, 'short')}</span>
                    </div>
                    <div class="reception-card-body">
                        <h4>${escapeHtml(rec.fullname || 'Без имени')}</h4>
                        <div class="card-contacts">
                            ${rec.phone ? `<span>📞 ${escapeHtml(rec.phone)}</span>` : ''}
                            ${rec.email ? `<span>✉️ ${escapeHtml(rec.email)}</span>` : ''}
                        </div>
                        <div class="card-subject"><strong>Тема:</strong> ${escapeHtml(rec.subject || '—')}</div>
                        <div class="card-message">${escapeHtml((rec.message || '—').substring(0, 200))}</div>
                    </div>
                    <div class="reception-card-footer">
                        <span class="status-badge status-${rec.status || 'new'}">${getStatusLabel(rec.status || 'new')}</span>
                        <div class="card-actions">
                            <button class="card-btn view" onclick="viewReception('${rec.id}')">👁️</button>
                            <button class="card-btn close" onclick="closeReception('${rec.id}')">📦</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

function filterReceptions() {
    const statusFilter = document.getElementById('receptionFilter')?.value || 'all';
    const search = (document.getElementById('receptionSearch')?.value || '').toLowerCase();
    const cards = document.querySelectorAll('.reception-card');

    cards.forEach(card => {
        let show = true;
        if (statusFilter !== 'all' && card.dataset.status !== statusFilter) show = false;
        if (search && !card.textContent.toLowerCase().includes(search)) show = false;
        card.style.display = show ? '' : 'none';
    });
}

async function viewReception(id) {
    let receptions = [];
    if (typeof DB !== 'undefined' && DB.getReceptions) {
        receptions = await DB.getReceptions();
    }
    const rec = receptions.find(r => r.id == id);

    if (!rec) { showError('Обращение не найдено'); return; }

    if (rec.status === 'new' && typeof DB !== 'undefined' && DB.updateReceptionStatus) {
        await DB.updateReceptionStatus(id, 'viewed');
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="modal-container" style="max-width:600px;">
            <div class="modal-header">
                <h3>📨 Обращение</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="view-row"><span class="view-label">Дата:</span><span>${formatDate(rec.created_at || rec.date, 'full')}</span></div>
                <div class="view-row"><span class="view-label">Тип:</span><span>${getTypeLabel(rec.type)}</span></div>
                <div class="view-row"><span class="view-label">ФИО:</span><span>${escapeHtml(rec.fullname)}</span></div>
                <div class="view-row"><span class="view-label">Телефон:</span><span><a href="tel:${rec.phone}">${escapeHtml(rec.phone || '—')}</a></span></div>
                <div class="view-row"><span class="view-label">Email:</span><span><a href="mailto:${rec.email}">${escapeHtml(rec.email || '—')}</a></span></div>
                ${rec.address ? `<div class="view-row"><span class="view-label">Адрес:</span><span>${escapeHtml(rec.address)}</span></div>` : ''}
                <div class="view-row"><span class="view-label">Тема:</span><span>${escapeHtml(rec.subject || '—')}</span></div>
                <div class="view-row"><span class="view-label">Статус:</span><span class="status-badge status-${rec.status || 'new'}">${getStatusLabel(rec.status || 'new')}</span></div>
                <div style="margin-top:15px;"><strong>Сообщение:</strong><div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-top:8px;white-space:pre-wrap;">${escapeHtml(rec.message || '—')}</div></div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn" onclick="this.closest('.modal-overlay').remove()">Закрыть</button>
                ${rec.status !== 'closed' ? `<button class="save-btn" onclick="closeReception('${rec.id}'); this.closest('.modal-overlay').remove();">📦 Закрыть</button>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function closeReception(id) {
    if (confirm('Закрыть обращение?')) {
        if (typeof DB !== 'undefined' && DB.updateReceptionStatus) {
            await DB.updateReceptionStatus(id, 'closed');
            updateBadges();
            showSuccess('Обращение закрыто');
            refreshCurrentPage();
        }
    }
}

// ===== ОГРАНИЧЕНИЯ =====
async function loadRestrictions() {
    const container = document.querySelector(ADMIN_SELECTORS.adminPages);
    if (!container) return;

    let html = `
        <div class="page-header"><h2>Управление ограничениями</h2><button class="add-btn" onclick="showAddRestrictionModal()"><span>➕</span> Добавить ограничение</button></div>
        <div class="restrictions-filters">
            <select id="restrictionFilter" onchange="loadRestrictionsFromFilter()"><option value="all">Все</option><option value="active">🟢 Активные</option><option value="completed">⚪ Завершённые</option></select>
            <input type="text" id="restrictionSearch" placeholder="Поиск по улицам..." oninput="loadRestrictionsFromFilter()">
            <button onclick="loadRestrictionsFromFilter()" class="filter-btn">🔍 Найти</button>
        </div>
        <div class="restrictions-list" id="restrictionsList"></div>
    `;

    container.innerHTML = html;

    if (typeof loadRestrictionsAdmin === 'function') await loadRestrictionsAdmin();
    if (typeof initRestrictionForm === 'function') initRestrictionForm();
}

async function loadRestrictionsFromFilter() {
    const filter = document.getElementById('restrictionFilter')?.value || 'all';
    const search = document.getElementById('restrictionSearch')?.value || '';
    if (typeof loadRestrictionsAdmin === 'function') await loadRestrictionsAdmin(filter, search);
}

// ===== ЗАЯВКИ / НАСТРОЙКИ =====
function loadApplications() {
    const container = document.querySelector(ADMIN_SELECTORS.adminPages);
    if (container) container.innerHTML = '<div class="page-placeholder"><div class="empty-icon">💼</div><h2>Заявки на трудоустройство</h2><p>Раздел в разработке</p></div>';
}

function loadSettings() {
    const container = document.querySelector(ADMIN_SELECTORS.adminPages);
    if (container) container.innerHTML = '<div class="page-placeholder"><div class="empty-icon">⚙️</div><h2>Настройки</h2><p>Раздел в разработке</p></div>';
}

// ===== ВСПОМОГАТЕЛЬНЫЕ =====
async function refreshCurrentPage() {
    switch (currentPage) {
        case 'dashboard': await loadDashboard(); break;
        case 'receptions': await loadReceptions(); break;
        case 'restrictions': await loadRestrictions(); break;
    }
}

async function updateBadges() {
    if (typeof DB !== 'undefined' && DB.getStats) {
        const stats = await DB.getStats();
        const rBadge = document.querySelector(ADMIN_SELECTORS.badges.receptions);
        const restrBadge = document.querySelector(ADMIN_SELECTORS.badges.restrictions);
        if (rBadge) rBadge.textContent = stats.newReceptions || 0;
        if (restrBadge) restrBadge.textContent = stats.activeRestrictions || 0;
    }
}

function updateAdminDateTime() {
    const el = document.querySelector(ADMIN_SELECTORS.adminDateTime);
    if (el) el.textContent = new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function refreshData() {
    await updateBadges();
    await refreshCurrentPage();
    updateAdminDateTime();
    showSuccess('Данные обновлены');
}

function logout() {
    deleteCookie('adminSession');
    AppState.currentAdmin = null;
    AppState.isAdmin = false;

    const login = document.querySelector(ADMIN_SELECTORS.login);
    const panel = document.querySelector(ADMIN_SELECTORS.panel);

    if (login) login.style.display = 'flex';
    if (panel) panel.style.display = 'none';

    showNotification('Вы вышли из системы', 'info');
}

function getTypeLabel(type) {
    const types = { question:'❓ Вопрос', complaint:'⚠️ Жалоба', suggestion:'💡 Предложение', accident:'🚨 Авария', connection:'🔌 Подключение', payment:'💰 Оплата', job_application:'💼 Трудоустройство', contact_form:'📬 Форма связи' };
    return types[type] || '📋 ' + (type || 'Другое');
}

function getStatusLabel(status) {
    const statuses = { new:'🆕 Новое', viewed:'👁️ Просмотрено', answered:'✅ Отвечено', closed:'📦 Закрыто' };
    return statuses[status] || status || '—';
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    initAdminLogin();
    window.showPage = showPage;
    window.viewReception = viewReception;
    window.closeReception = closeReception;
    window.filterReceptions = filterReceptions;
    window.loadRestrictionsFromFilter = loadRestrictionsFromFilter;
    window.refreshData = refreshData;
    window.logout = logout;
});

window.AdminPage = { showPage, loadDashboard, loadReceptions, loadRestrictions, updateBadges, refreshData, logout };