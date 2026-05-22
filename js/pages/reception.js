/* ========================================
   RECEPTION.JS - Логика виртуальной приёмной
   Содержит: форма обращений, капча,
   загрузка файлов, проверка статуса
   ======================================== */

const RECEPTION_SELECTORS = {
    receptionForm: '#receptionForm',
    appealType: '#appealType',
    fullname: '#fullname',
    phone: '#phone',
    email: '#email',
    address: '#address',
    subject: '#subject',
    message: '#message',
    files: '#files',
    fileList: '#fileList',
    fileUpload: '.file-upload',
    captcha: '#captcha',
    captchaCode: '#captchaCode',
    captchaRefresh: '#refreshCaptcha',
    successModal: '#successModal',
    appealNumberDisplay: '#appealNumberDisplay',
    checkStatusInput: '#appealNumber',
    checkStatusBtn: '.check-btn',
    statusResult: '#statusResult',
    faqItems: '.faq-item',
    faqQuestion: '.faq-question'
};

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// ===== КАПЧА =====

function generateCaptcha() {
    const captchaCode = document.querySelector(RECEPTION_SELECTORS.captchaCode);
    if (!captchaCode) return;

    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }

    captchaCode.textContent = code;
    captchaCode.dataset.code = code;

    captchaCode.style.transform = 'scale(1.1)';
    setTimeout(() => {
        captchaCode.style.transform = 'scale(1)';
    }, 200);
}

function refreshCaptcha() {
    const captchaImage = document.querySelector('.captcha-image');
    const refreshBtn = document.querySelector(RECEPTION_SELECTORS.captchaRefresh);

    generateCaptcha();

    if (captchaImage) {
        captchaImage.style.animation = 'spin 0.4s ease';
        setTimeout(() => {
            captchaImage.style.animation = '';
        }, 400);
    }

    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 300);
    }
}

function validateCaptcha() {
    const captchaInput = document.querySelector(RECEPTION_SELECTORS.captcha);
    const captchaCode = document.querySelector(RECEPTION_SELECTORS.captchaCode);

    if (!captchaInput || !captchaCode) return true;

    const userInput = captchaInput.value.trim();
    const code = captchaCode.dataset.code || captchaCode.textContent;

    if (!userInput) {
        showFieldError(captchaInput, 'Введите код с картинки');
        return false;
    }

    if (userInput.toLowerCase() !== code.toLowerCase()) {
        showFieldError(captchaInput, 'Неверный код');
        refreshCaptcha();
        captchaInput.value = '';
        return false;
    }

    clearFieldError(captchaInput);
    return true;
}

// ===== ЗАГРУЗКА ФАЙЛОВ =====

function initFileUpload() {
    const fileInput = document.querySelector(RECEPTION_SELECTORS.files);
    if (!fileInput) return;

    fileInput.addEventListener('change', function() {
        const files = Array.from(this.files);
        displaySelectedFiles(files);
    });

    const fileUploadZone = document.querySelector(RECEPTION_SELECTORS.fileUpload);
    if (fileUploadZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadZone.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadZone.addEventListener(eventName, () => {
                fileUploadZone.classList.add('highlight');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadZone.addEventListener(eventName, () => {
                fileUploadZone.classList.remove('highlight');
            });
        });

        fileUploadZone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            if (dt && dt.files) {
                fileInput.files = dt.files;
                displaySelectedFiles(Array.from(dt.files));
            }
        });
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function displaySelectedFiles(files) {
    const fileList = document.querySelector(RECEPTION_SELECTORS.fileList);
    if (!fileList) return;

    fileList.innerHTML = '';

    if (files.length === 0) {
        fileList.innerHTML = '<div class="no-files">Файлы не выбраны</div>';
        return;
    }

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.style.animation = `slideIn 0.3s ease ${index * 0.05}s both`;

        const fileSize = formatFileSize(file.size);

        fileItem.innerHTML = `
            <div class="file-name">
                <span>📎</span>
                <span>${escapeHtml(file.name)}</span>
                <span class="file-size">(${fileSize})</span>
            </div>
            <button type="button" class="file-remove" title="Удалить файл" data-index="${index}">×</button>
        `;

        const removeBtn = fileItem.querySelector('.file-remove');
        removeBtn.addEventListener('click', function() {
            removeFile(index);
        });

        fileList.appendChild(fileItem);
    });

    fileList.dataset.files = JSON.stringify(files.map(f => f.name));
}

function removeFile(index) {
    const fileInput = document.querySelector(RECEPTION_SELECTORS.files);
    if (!fileInput || !fileInput.files) return;

    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);

    files.splice(index, 1);
    files.forEach(f => dt.items.add(f));

    fileInput.files = dt.files;
    displaySelectedFiles(files);
}

// ===== ОТПРАВКА ФОРМЫ =====

function initReceptionForm() {
    const form = document.querySelector(RECEPTION_SELECTORS.receptionForm);
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateCaptcha()) return;

        const formData = {
            type: document.querySelector(RECEPTION_SELECTORS.appealType)?.value || '',
            fullname: document.querySelector(RECEPTION_SELECTORS.fullname)?.value || '',
            phone: document.querySelector(RECEPTION_SELECTORS.phone)?.value || '',
            email: document.querySelector(RECEPTION_SELECTORS.email)?.value || '',
            address: document.querySelector(RECEPTION_SELECTORS.address)?.value || '',
            subject: document.querySelector(RECEPTION_SELECTORS.subject)?.value || '',
            message: document.querySelector(RECEPTION_SELECTORS.message)?.value || '',
            files: getFileList()
        };

        if (!formData.fullname.trim()) {
            showError('Пожалуйста, укажите ФИО');
            return;
        }

        if (!formData.phone.trim()) {
            showError('Пожалуйста, укажите телефон');
            return;
        }

        if (!formData.subject.trim()) {
            showError('Пожалуйста, укажите тему обращения');
            return;
        }

        if (!formData.message.trim()) {
            showError('Пожалуйста, напишите текст обращения');
            return;
        }

        if (!formData.type) {
            showError('Пожалуйста, выберите тип обращения');
            return;
        }

        let appeal = null;

        if (typeof DB !== 'undefined' && DB.addReception) {
            appeal = await DB.addReception(formData);
        } else {
            appeal = {
                id: generateId('rec'),
                ...formData,
                date: new Date().toISOString(),
                status: 'new'
            };
        }

        Logger.info('Новое обращение:', appeal);
        showSuccessModal(appeal.id);

        form.reset();

        const fileList = document.querySelector(RECEPTION_SELECTORS.fileList);
        if (fileList) {
            fileList.innerHTML = '<div class="no-files">Файлы не выбраны</div>';
            fileList.dataset.files = '';
        }

        generateCaptcha();

        setTimeout(() => {
            const modal = document.querySelector(RECEPTION_SELECTORS.successModal);
            if (modal) {
                modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
    });
}

function getFileList() {
    const fileList = document.querySelector(RECEPTION_SELECTORS.fileList);
    if (!fileList) return [];

    try {
        const files = fileList.dataset.files;
        return files ? JSON.parse(files) : [];
    } catch (e) {
        return [];
    }
}

// ===== МОДАЛЬНОЕ ОКНО УСПЕХА =====

function showSuccessModal(appealId) {
    const modal = document.querySelector(RECEPTION_SELECTORS.successModal);
    const appealDisplay = document.querySelector(RECEPTION_SELECTORS.appealNumberDisplay);

    if (!modal) return;

    if (appealDisplay) {
        appealDisplay.textContent = appealId;
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.style.animation = 'fadeIn 0.3s ease';

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeSuccessModal();
        }
    });

    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            closeSuccessModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function closeSuccessModal() {
    const modal = document.querySelector(RECEPTION_SELECTORS.successModal);
    if (!modal) return;

    modal.style.animation = 'fadeIn 0.3s ease reverse';

    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.animation = '';
        document.body.style.overflow = '';
    }, 280);

    const appealDisplay = document.querySelector(RECEPTION_SELECTORS.appealNumberDisplay);
    if (appealDisplay && appealDisplay.textContent) {
        showNotification(
            `Номер обращения сохранён: ${appealDisplay.textContent}. Запишите его для проверки статуса.`,
            'success',
            5000
        );
    }
}

// ===== ПРОВЕРКА СТАТУСА =====

async function checkAppealStatus() {
    const input = document.querySelector(RECEPTION_SELECTORS.checkStatusInput);
    if (!input) return;

    const appealNumber = input.value.trim();
    if (!appealNumber) { showError('Введите номер обращения'); return; }

    const resultContainer = document.querySelector(RECEPTION_SELECTORS.statusResult);
    if (!resultContainer) return;

    console.log('🔍 Ищу обращение:', appealNumber);

    if (typeof DB !== 'undefined' && DB.getReceptions) {
        const receptions = await DB.getReceptions();
        console.log('📋 Всего обращений:', receptions.length);
        
        // Ищем по id (числовое сравнение)
        const appeal = receptions.find(r => r.id == appealNumber);

        if (appeal) {
            console.log('✅ Найдено:', appeal);
            const statuses = { 
                new: '🆕 Новое (ожидает рассмотрения)', 
                viewed: '👁️ Просмотрено (в обработке)', 
                answered: '✅ Отвечено', 
                closed: '📦 Закрыто' 
            };
            resultContainer.innerHTML = `
                <div class="status-result-card">
                    <h4>Обращение #${appeal.id}</h4>
                    <p><strong>Тема:</strong> ${escapeHtml(appeal.subject)}</p>
                    <p><strong>Статус:</strong> ${statuses[appeal.status] || appeal.status}</p>
                    <p><strong>Дата:</strong> ${formatDate(appeal.created_at || appeal.date, 'full')}</p>
                </div>
            `;
        } else {
            console.log('❌ Не найдено');
            resultContainer.innerHTML = `
                <div class="status-result-card" style="background:#ffebee;">
                    <p style="color:#c62828;">❌ Обращение не найдено. Проверьте номер.</p>
                </div>
            `;
        }
    } else {
        console.log('🔴 DB не доступен');
        showError('Сервис временно недоступен');
    }
}

function showStatusResult(appeal) {
    const resultContainer = document.querySelector(RECEPTION_SELECTORS.statusResult);
    if (!resultContainer) return;

    if (appeal) {
        const statusColors = {
            new: '#ff4444',
            viewed: '#ff9f43',
            answered: '#4CAF50',
            closed: '#999999'
        };

        const statusIcons = {
            new: '🆕',
            viewed: '📝',
            answered: '✅',
            closed: '📦'
        };

        resultContainer.innerHTML = `
            <div class="status-result-card animate-slideDown" style="
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                margin-top: 15px;
            ">
                <h4 style="color: #333; margin-bottom: 15px;">
                    ${statusIcons[appeal.status] || '📋'} Обращение #${escapeHtml(appeal.id).slice(-8)}
                </h4>
                <p><strong>Тема:</strong> ${escapeHtml(appeal.subject)}</p>
                <p><strong>Дата:</strong> ${appeal.date}</p>
                <p>
                    <strong>Статус:</strong>
                    <span style="color: ${statusColors[appeal.status] || '#333'}; font-weight: 600;">
                        ${appeal.statusText}
                    </span>
                </p>
            </div>
        `;
    } else {
        resultContainer.innerHTML = `
            <div class="status-result-card animate-slideDown" style="
                background: #ffebee;
                border-radius: 12px;
                padding: 20px;
                margin-top: 15px;
                text-align: center;
            ">
                <p style="color: #c62828;">
                    ❌ Обращение не найдено. Проверьте номер и попробуйте снова.
                </p>
            </div>
        `;
    }

    setTimeout(() => {
        if (resultContainer.querySelector('.status-result-card')) {
            resultContainer.innerHTML = '';
        }
    }, 10000);
}

function getAppealStatusText(status) {
    const statuses = {
        'new': 'Новое (ожидает рассмотрения)',
        'viewed': 'Просмотрено (в обработке)',
        'answered': 'Отвечено',
        'closed': 'Закрыто'
    };
    return statuses[status] || status || 'Неизвестно';
}

// ===== FAQ =====

function initReceptionFaq() {
    const faqItems = document.querySelectorAll(RECEPTION_SELECTORS.faqItems);
    if (faqItems.length === 0) return;

    faqItems.forEach(item => {
        const question = item.querySelector(RECEPTION_SELECTORS.faqQuestion);
        if (!question) return;

        question.addEventListener('click', function() {
            item.classList.toggle('active');
        });
    });
}

// ===== ПАРАМЕТРЫ URL =====

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const service = params.get('service');
    const plan = params.get('plan');
    const name = params.get('name');

    if (service) {
        const typeSelect = document.querySelector(RECEPTION_SELECTORS.appealType);
        if (typeSelect) {
            const serviceTypeMap = {
                'installation': 'connection',
                'repair': 'connection',
                'design': 'connection',
                'connection': 'connection',
                'meters': 'connection',
                'business': 'connection',
                'tariff': 'payment'
            };

            const mappedType = serviceTypeMap[service] || 'question';
            typeSelect.value = mappedType;
        }
    }

    if (name) {
        const subjectInput = document.querySelector(RECEPTION_SELECTORS.subject);
        if (subjectInput && !subjectInput.value) {
            subjectInput.value = decodeURIComponent(name);
        }
    }

    if (plan) {
        const subjectInput = document.querySelector(RECEPTION_SELECTORS.subject);
        if (subjectInput && !subjectInput.value) {
            subjectInput.value = `Заявка на тариф: ${decodeURIComponent(plan)}`;
        }
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    Logger.info('Инициализация виртуальной приёмной...');

    const isReceptionPage = document.querySelector(RECEPTION_SELECTORS.receptionForm) !== null ||
                            document.querySelector('.reception-hero') !== null;

    if (!isReceptionPage) {
        Logger.debug('Не страница приёмной, пропускаем');
        return;
    }

    generateCaptcha();

    const refreshBtn = document.querySelector(RECEPTION_SELECTORS.captchaRefresh);
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCaptcha);
    }

    initReceptionForm();
    initFileUpload();

    const checkBtn = document.querySelector(RECEPTION_SELECTORS.checkStatusBtn);
    if (checkBtn) {
        checkBtn.addEventListener('click', checkAppealStatus);
    }

    const checkInput = document.querySelector(RECEPTION_SELECTORS.checkStatusInput);
    if (checkInput) {
        checkInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAppealStatus();
            }
        });
    }

    initReceptionFaq();

    if (typeof initPhoneMasks === 'function') {
        initPhoneMasks();
    }

    checkUrlParams();

    Logger.success('Виртуальная приёмная инициализирована');
});

window.ReceptionPage = {
    generateCaptcha,
    refreshCaptcha,
    checkAppealStatus,
    closeSuccessModal
};