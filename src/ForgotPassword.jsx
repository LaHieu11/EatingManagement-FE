import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import axios from 'axios';
import API_BASE_URL from './config/api';

const { Title } = Typography;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu mới
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Gửi OTP về email
  const onFinishEmail = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/forgot-password`, { email: values.email });
      setEmail(values.email);
      setStep(2);
      message.success('Đã gửi OTP về email!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Xác thực OTP và đổi mật khẩu
  const onFinishReset = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/reset-password`, {
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công! Bạn có thể đăng nhập.');
      window.location.href = '/login';
    } catch (err) {
      message.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Quên mật khẩu</Title>
        {step === 1 && (
          <Form form={form} layout="vertical" onFinish={onFinishEmail} autoComplete="off">
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}> <Input autoFocus /> </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Gửi OTP</Button>
            </Form.Item>
          </Form>
        )}
        {step === 2 && (
          <Form layout="vertical" onFinish={onFinishReset} autoComplete="off">
            <Form.Item name="otp" label="Mã OTP" rules={[{ required: true, message: 'Vui lòng nhập mã OTP' }, { len: 6, message: 'OTP gồm 6 số' }]}> <Input maxLength={6} /> </Form.Item>
            <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}> <Input.Password /> </Form.Item>
            <Form.Item name="confirmNewPassword" label="Xác nhận mật khẩu mới" dependencies={["newPassword"]} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) { return Promise.resolve(); } return Promise.reject(new Error('Mật khẩu xác nhận không khớp!')); }, }), ]}> <Input.Password /> </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Đổi mật khẩu</Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword; 