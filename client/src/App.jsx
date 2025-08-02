import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
//import Dashboard from './components/Dashboard'; // will build later
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {!token ? (
          <>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
