/**
 * Utility functions untuk frontend
 */

class SmartCatalystUtils {
  
  /**
   * Format tanggal Indonesia
   */
  static formatTanggalIndonesia(date) {
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const hari = namaHari[date.getDay()];
    const tanggal = date.getDate();
    const bulan = namaBulan[date.getMonth()];
    const tahun = date.getFullYear();
    
    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
  }
  
  /**
   * Validasi file sebelum upload
   */
  static validateFile(file) {
    const errors = [];
    
    // 1. Cek ukuran file
    if (file.size > APPS_SCRIPT_CONFIG.MAX_FILE_SIZE) {
      errors.push(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 10MB.`);
    }
    
    // 2. Cek tipe file
    if (!APPS_SCRIPT_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`Tipe file tidak diizinkan. Hanya gambar (JPG, PNG, GIF) dan PDF.`);
    }
    
    // 3. Cek ekstensi file
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`Ekstensi file tidak diizinkan. Hanya: ${allowedExtensions.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Tampilkan notifikasi
   */
  static showNotification(message, type = 'success') {
    // Implementasi notifikasi Anda
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Contoh dengan alert sederhana
    const alertType = type === 'error' ? 'error' : 'success';
    // alert(`${alertType === 'error' ? '❌' : '✅'} ${message}`);
  }
  
  /**
   * Format nomor WhatsApp
   */
  static formatWhatsAppNumber(number) {
    if (!number) return null;
    
    let clean = number.replace(/\D/g, '');
    
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    
    return clean.startsWith('62') ? clean : '62' + clean;
  }
  
  /**
   * Debounce function untuk optimasi
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}