import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await register(email, password);
      // Redirect to dashboard or home
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Register</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="block w-full mb-4 p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
        Register
      </button>
    </form>
  );
}
