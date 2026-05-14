import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModalProvider } from './components/ModalContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/caregiver" element={<CaregiverDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
