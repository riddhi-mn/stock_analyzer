import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// Register user
export const registerUser = (email, password) =>
  API.post('/register', { email, password });

// Login user
export const loginUser = (email, password) =>
  API.post('/login', { email, password });

export default API;
