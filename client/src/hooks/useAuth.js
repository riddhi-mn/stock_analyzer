import { useState } from 'react';
import { registerUser, loginUser } from '../api/auth';

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const register = async (email, password) => {
    const { data } = await registerUser(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
  };

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return { token, register, login, logout };
}
