// Konfigurasi Apps Script Web App
const APPS_SCRIPT_CONFIG = {
  // GANTI DENGAN URL WEB APP ANDA
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbw830xkd-9i6-Uf-7H8-yiimRSfcm0tLYSluanSa3jSawvDeU0xBlWy_db8J5VkPaAK/exec',
  
  // Endpoints
  ENDPOINTS: {
    UPLOAD: '', // POST ke root
    GET_TUTOR: '?action=getTutorList',
    GET_SISWA: '?action=getSiswaByTutor&tutorId=',
    GET_PROFIL: '?action=getProfilTutor&tutorName=',
    GET_ABSENSI: '?action=getDataAbsensi'
  },
  
  // Konstanta
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Timeout
  UPLOAD_TIMEOUT: 30000, // 30 detik
  REQUEST_TIMEOUT: 10000 // 10 detik
};

// Export untuk module (jika menggunakan ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APPS_SCRIPT_CONFIG };
}