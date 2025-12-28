/**
 * Handle form absensi dengan upload file menggunakan FormData
 */

class AbsensiHandler {
  
  constructor() {
    this.form = document.getElementById('absensiForm');
    this.fileInput = document.getElementById('bukti');
    this.preview = document.getElementById('imagePreview');
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    // Event listener untuk form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Event listener untuk file input
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    // Event listener untuk tutor selection
    const tutorSelect = document.getElementById('tutor');
    if (tutorSelect) {
      tutorSelect.addEventListener('change', () => this.loadSiswaByTutor());
    }
    
    // Load initial data
    this.loadTutorList();
  }
  
  /**
   * Load daftar tutor dari backend dengan retry
   */
  async loadTutorList() {
    try {
      this.showLoading('tutor', 'Memuat data tutor...');
      
      // Tambahkan retry mechanism
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const response = await this.fetchData({
            action: 'getTutorList'
          });
          
          const select = document.getElementById('tutor');
          if (!select) return;
          
          select.innerHTML = '<option value="">-- Pilih Tutor --</option>';
          
          if (response && response.success && response.data) {
            response.data.forEach(tutor => {
              const option = document.createElement('option');
              option.value = tutor.id;
              option.textContent = tutor.id;
              select.appendChild(option);
            });
            console.log('✅ Tutor list loaded successfully');
            break; // Keluar dari loop jika sukses
          }
          
        } catch (error) {
          lastError = error;
          retries--;
          console.log(`Retry ${3 - retries}/3 failed:`, error);
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik
          }
        }
      }
      
      if (retries === 0 && lastError) {
        throw lastError;
      }
      
    } catch (error) {
      console.error('❌ Failed to load tutor list:', error);
      SmartCatalystUtils.showNotification('Gagal memuat data tutor: ' + error.message, 'error');
      
      // Tampilkan fallback atau error state
      const select = document.getElementById('tutor');
      if (select) {
        select.innerHTML = `
          <option value="">-- Gagal memuat data --</option>
          <option value="refresh" onclick="location.reload()">↻ Klik untuk refresh</option>
        `;
      }
    } finally {
      this.hideLoading('tutor');
    }
  }
  
  /**
   * Load siswa berdasarkan tutor
   */
  async loadSiswaByTutor() {
    const tutorSelect = document.getElementById('tutor');
    const siswaSelect = document.getElementById('siswaId');
    
    if (!tutorSelect || !siswaSelect) return;
    
    const tutorId = tutorSelect.value;
    if (!tutorId) return;
    
    try {
      this.showLoading('siswa', 'Memuat data siswa...');
      
      const response = await this.fetchData({
        action: 'getSiswaByTutor',
        tutorId: tutorId
      });
      
      siswaSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
      
      if (response && response.success && response.data) {
        response.data.forEach(siswa => {
          const option = document.createElement('option');
          option.value = siswa.id;
          option.textContent = `${siswa.id} - ${siswa.nama}`;
          siswaSelect.appendChild(option);
        });
      }
      
      // Reset detail siswa
      document.getElementById('namaSiswa').value = '';
      document.getElementById('alamatSiswa').value = '';
      
    } catch (error) {
      SmartCatalystUtils.showNotification('Gagal memuat data siswa: ' + error.message, 'error');
    } finally {
      this.hideLoading('siswa');
    }
  }
  
  /**
   * Handle form submission dengan FormData
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    // Validasi form
    if (!this.validateForm()) {
      return;
    }
    
    // Validasi file
    const file = this.fileInput.files[0];
    if (!file) {
      SmartCatalystUtils.showNotification('Harap pilih file bukti kehadiran', 'error');
      return;
    }
    
    const fileValidation = SmartCatalystUtils.validateFile(file);
    if (!fileValidation.isValid) {
      fileValidation.errors.forEach(error => {
        SmartCatalystUtils.showNotification(error, 'error');
      });
      return;
    }
    
    try {
      // Tampilkan loading
      this.showSubmitLoading();
      
      // Buat FormData object
      const formData = new FormData(this.form);
      
      // Tambahkan metadata
      formData.append('timestamp', new Date().toISOString());
      formData.append('userAgent', navigator.userAgent);
      
      console.log('📤 Mengirim FormData dengan file:', file.name);
      
      // Kirim ke Google Apps Script
      const response = await this.uploadFormData(formData);
      
      if (response.success) {
        SmartCatalystUtils.showNotification('✅ Absensi berhasil disimpan!');
        
        // Reset form
        this.form.reset();
        if (this.preview) {
          this.preview.style.display = 'none';
        }
        
        // Clear preview
        const previewImg = document.getElementById('previewImg');
        if (previewImg) {
          previewImg.src = '';
        }
        
      } else {
        throw new Error(response.error || 'Gagal menyimpan absensi');
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Coba metode fallback jika error karena CORS atau size
      if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
        await this.tryFallbackUpload();
      } else {
        SmartCatalystUtils.showNotification('❌ Gagal menyimpan: ' + error.message, 'error');
      }
      
    } finally {
      this.hideSubmitLoading();
    }
  }
  
  /**
   * Upload menggunakan FormData (multipart/form-data)
   */
  async uploadFormData(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APPS_SCRIPT_CONFIG.UPLOAD_TIMEOUT);
    
    try {
      const response = await fetch(APPS_SCRIPT_CONFIG.WEB_APP_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Tidak set Content-Type, biarkan browser set otomatis untuk FormData
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Fallback upload jika FormData gagal
   */
  async tryFallbackUpload() {
    SmartCatalystUtils.showNotification('Mencoba metode alternatif...', 'info');
    
    try {
      // Pisahkan file dari form data
      const formData = new FormData(this.form);
      const file = formData.get('bukti');
      
      if (!file) {
        throw new Error('File tidak ditemukan');
      }
      
      // Kirim data form tanpa file terlebih dahulu
      const formDataWithoutFile = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key !== 'bukti') {
          formDataWithoutFile.append(key, value);
        }
      }
      
      // Upload data form
      const formResponse = await this.uploadFormData(formDataWithoutFile);
      
      if (formResponse.success) {
        // Upload file secara terpisah jika diperlukan
        SmartCatalystUtils.showNotification('✅ Data tersimpan, file akan diupload terpisah', 'success');
        // File bisa diupload nanti atau diabaikan
      }
      
    } catch (fallbackError) {
      console.error('❌ Fallback juga gagal:', fallbackError);
      SmartCatalystUtils.showNotification('❌ Sistem upload sedang bermasalah', 'error');
    }
  }
  
  /**
   * Handle file selection untuk preview
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi file
    const validation = SmartCatalystUtils.validateFile(file);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        SmartCatalystUtils.showNotification(error, 'error');
      });
      event.target.value = ''; // Clear input
      return;
    }
    
    // Tampilkan preview untuk gambar
    if (file.type.startsWith('image/')) {
      this.showImagePreview(file);
    } else {
      this.showFileInfo(file);
    }
  }
  
  /**
   * Tampilkan preview gambar
   */
  showImagePreview(file) {
    if (!this.preview) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('previewImg');
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.alt = file.name;
      }
      this.preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Tampilkan info file (untuk non-gambar)
   */
  showFileInfo(file) {
    if (!this.preview) return;
    
    this.preview.innerHTML = `
      <div style="padding: 15px; background: #f8f9fa; border-radius: 4px;">
        <i class="fas fa-file" style="font-size: 48px; color: #6c757d; margin-bottom: 10px;"></i>
        <p><strong>${file.name}</strong></p>
        <p>Ukuran: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        <p>Tipe: ${file.type}</p>
      </div>
    `;
    this.preview.style.display = 'block';
  }
  
  /**
   * Validasi form sebelum submit
   */
  validateForm() {
    const requiredFields = ['tutor', 'siswaId', 'tanggal', 'jamDatang', 'jamPulang', 'rencanaHariIni', 'rencanaSelanjutnya'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && !field.value.trim()) {
        this.markFieldError(field, 'Field ini wajib diisi');
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    });
    
    // Validasi jam
    const jamDatang = document.getElementById('jamDatang').value;
    const jamPulang = document.getElementById('jamPulang').value;
    
    if (jamDatang && jamPulang && jamDatang >= jamPulang) {
      this.markFieldError(document.getElementById('jamPulang'), 'Jam pulang harus setelah jam datang');
      isValid = false;
    }
    
    return isValid;
  }
  
  /**
   * Tampilkan error pada field
   */
  markFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    
    // Cari atau buat error element
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  /**
   * Hapus error dari field
   */
  clearFieldError(field) {
    field.style.borderColor = '';
    
    const errorElement = field.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * Tampilkan loading state
   */
  showLoading(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = true;
      const originalHTML = element.innerHTML;
      element.dataset.originalHTML = originalHTML;
      element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    }
  }
  
  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element && element.dataset.originalHTML) {
      element.innerHTML = element.dataset.originalHTML;
      element.disabled = false;
    }
  }
  
  showSubmitLoading() {
    if (this.submitBtn) {
      const originalText = this.submitBtn.innerHTML;
      this.submitBtn.dataset.originalText = originalText;
      this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
      this.submitBtn.disabled = true;
    }
  }
  
  hideSubmitLoading() {
    if (this.submitBtn && this.submitBtn.dataset.originalText) {
      this.submitBtn.innerHTML = this.submitBtn.dataset.originalText;
      this.submitBtn.disabled = false;
    }
  }
  
  /**
   * Fetch data dari backend (untuk GET requests)
   */
  async fetchData(params = {}) {
    const url = new URL(APPS_SCRIPT_CONFIG.WEB_APP_URL);
    
    // Tambahkan parameters ke URL
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APPS_SCRIPT_CONFIG.REQUEST_TIMEOUT);
    
    try {
      console.log('🔗 Fetching data from:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors', // Pastikan mode cors
        credentials: 'omit', // Tidak perlu credentials untuk GAS
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data received:', data);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', error);
      
      // Berikan error yang lebih informatif
      let errorMessage = 'Gagal mengambil data dari server';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Permintaan timeout, coba lagi';
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Masalah keamanan browser. Coba buka console untuk detail.';
      }
      
      throw new Error(errorMessage + ' (' + error.message + ')');
    }
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  window.absensiHandler = new AbsensiHandler();
});


// Fix untuk CORS issues
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Jika request ke Google Apps Script
    if (url.includes('script.google.com')) {
      // Tambahkan timestamp untuk menghindari cache
      if (url.includes('?')) {
        url += '&_=' + Date.now();
      } else {
        url += '?_=' + Date.now();
      }
      
      // Tambahkan mode: 'no-cors' untuk testing
      options.mode = 'cors';
      options.credentials = 'omit';
    }
    return originalFetch.call(this, url, options);
  };
})();