/* ========================================
   DATABASE.JS - OpenServer MySQL Backend
   ======================================== */

const API_URL = 'http://localhost/api/database.php';

const DB = {
    async request(action, data = null) {
        let url = `${API_URL}?action=${action}`;
        let options = {
            method: data ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (e) {
            console.error('Ошибка запроса:', e);
            return null;
        }
    },

    async login(username, password) {
        return await this.request('login', { username, password: btoa(password) });
    },

    async addReception(data) {
        return await this.request('addReception', data);
    },

    async getReceptions(filter = 'all') {
        let url = `${API_URL}?action=getReceptions`;
        if (filter !== 'all') url += `&status=${filter}`;
        const response = await fetch(url);
        return await response.json();
    },

    async updateReceptionStatus(id, status) {
        return await this.request('updateReceptionStatus', { id, status });
    },

    async addRestriction(data) {
        return await this.request('addRestriction', data);
    },

    async getActiveRestrictions() {
        const response = await fetch(`${API_URL}?action=getActiveRestrictions`);
        return await response.json();
    },

    async getAllRestrictions(filter = 'all') {
        let url = `${API_URL}?action=getAllRestrictions`;
        if (filter !== 'all') url += `&status=${filter}`;
        const response = await fetch(url);
        return await response.json();
    },

    async updateRestrictionStatus(id, status) {
        return await this.request('updateRestrictionStatus', { id, status });
    },

    async deleteRestriction(id) {
        return await this.request('deleteRestriction', { id });
    },

    async getStats() {
        const response = await fetch(`${API_URL}?action=getStats`);
        return await response.json();
    },

    async addJobApplication(data) {
        return await this.addReception({
            type: 'job_application',
            fullname: data.fullname,
            phone: data.phone,
            email: data.email || '',
            address: '',
            subject: 'Заявка на трудоустройство',
            message: `Специализация: ${data.specialization || 'не указана'}`
        });
    }
};

console.log('🗄️ База данных подключена к OpenServer MySQL');