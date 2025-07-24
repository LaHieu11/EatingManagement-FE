import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/api';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/users/login`, values);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      message.success('Đăng nhập thành công!');
      const role = res.data.user.role;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'kitchen') {
        navigate('/kitchen');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: 350 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Đăng nhập</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}> 
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Đăng nhập</Button>
          </Form.Item>
        </Form>
        <a href="/register">Đăng ký</a>
      </Card>
    </div>
  );
};

export default Login; 