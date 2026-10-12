import axios from 'axios';

const api = axios.create({
  baseURL: 'https://royal-hotel-6xe9.onrender.com', // Link Backend trên Render
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
