/**
 * Main JavaScript file for Smart Catalyst
 * Handles common functionality across all pages
 */

class SmartCatalystApp {
    constructor() {
        this.init();
    }

    init() {
        // Initialize common components
        this.setupNotifications();
        this.setupFormValidation();
        this.setupDatePickers();
        
        // Update date and time
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    }

    updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        
        const dateElement = document.getElementById('currentDate');
        const timeElement = document.getElementById('currentTime');
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('id-ID', dateOptions);
        }
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('id-ID', timeOptions);
        }
    }

    setupNotifications() {
        // Notification system is already in place via utils.js
        console.log('Notification system ready');
    }

    setupFormValidation() {
        // Add real-time validation to forms
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(element => {
            element.addEventListener('blur', function() {
                this.validateField();
            });
        });
    }

    setupDatePickers() {
        // Set min/max dates for date inputs
        const today = new Date().toISOString().split('T')[0];
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (!input.value) {
                input.value = today;
            }
            input.max = today; // Cannot select future dates
        });
    }

    // Common utility methods
    showLoading(button, text = 'Memproses...') {
        if (button) {
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.dataset.originalHTML = originalHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        }
    }

    hideLoading(button) {
        if (button && button.dataset.originalHTML) {
            button.innerHTML = button.dataset.originalHTML;
            button.disabled = false;
        }
    }

    async fetchData(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(endpoint, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Formatting helpers
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5); // Extract HH:MM
    }

    calculateDuration(start, end) {
        if (!start || !end) return '0 jam';
        
        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        const diffMs = endTime - startTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return `${diffHours.toFixed(1)} jam`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartCatalystApp = new SmartCatalystApp();
});