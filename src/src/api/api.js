import axios from 'axios';

const api = axios.create({
  baseURL: 'https://royal-hotel-6xe9.onrender.com', // Địa chỉ FastAPI backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
