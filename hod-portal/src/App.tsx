
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { Students } from './pages/Students';
import { Permissions } from './pages/Permissions';
import { ManageCRs } from './pages/ManageCRs';
import { Profile } from './pages/Profile';
import { Comparison } from './pages/Comparison';
import { Register } from './pages/Register';
import { Layout } from './layout/Layout';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students" element={<Students />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/crs" element={<ManageCRs />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" theme="colored" />
    </Router>
  );
}

export default App;
