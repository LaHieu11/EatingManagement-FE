import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button } from 'antd';
import 'antd/dist/reset.css';
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';
import MealRegister from './MealRegister';
import Admin from './Admin';
import Register from './Register';
import Homepage from './Homepage';
import Kitchen from './Kitchen';
import { LogoutOutlined } from '@ant-design/icons';

function LogoutButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  // Chỉ hiện nút trên các trang không phải homepage, login, register
  if (!isLoggedIn || ['/','/login','/register'].includes(location.pathname)) return null;
  return (
    <Button
      icon={<LogoutOutlined />}
      style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}
      onClick={() => {
        localStorage.removeItem('token');
        navigate('/');
      }}
    >
      Đăng xuất
    </Button>
  );
}

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <LogoutButton />
        <Layout.Content style={{ padding: '16px', maxWidth: 1200, margin: 'auto', width: '100%' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-meal" element={<MealRegister />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/kitchen" element={<Kitchen />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Router>
  );
}

export default App;
