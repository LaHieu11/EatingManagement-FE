// Cấu hình API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'eatingmanagement-be-production.up.railway.app'
    : 'http://localhost:3000');

export default API_BASE_URL; 