import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card, Select } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [step, setStep] = useState(1); // 1: register, 2: otp
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý đăng ký
  const onFinishRegister = async (values) => {
    console.log('Register payload:', values);
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/users/register', values);
      setPhone(values.phone);
      setStep(2);
      message.success('Đăng ký thành công! Vui lòng nhập OTP gửi về số điện thoại. (Xem console backend nếu demo)');
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác thực OTP
  const onFinishOTP = async (values) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/users/verify-otp', { phone, otp: values.otp });
      message.success('Xác thực OTP thành công! Bạn có thể đăng nhập.');
      setStep(1);
      form.resetFields();
      otpForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Đăng ký tài khoản</Title>
        {step === 1 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinishRegister}
            autoComplete="off"
          >
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }, { min: 4, message: 'Tối thiểu 4 ký tự' }]}>
              <Input autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]} hasFeedback>
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^0\d{9}$/, message: 'Số điện thoại phải có 10 số và bắt đầu bằng 0' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="gender" label="Giới tính" rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}>
              <Select placeholder="Chọn giới tính">
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item shouldUpdate>
              {() => (
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Đăng ký
                </Button>
              )}
            </Form.Item>
          </Form>
        )}
        {step === 2 && (
          <Form
            form={otpForm}
            layout="vertical"
            onFinish={onFinishOTP}
            autoComplete="off"
          >
            <Form.Item name="otp" label="Mã OTP" rules={[{ required: true, message: 'Vui lòng nhập mã OTP' }, { len: 6, message: 'OTP gồm 6 số' }]}>
              <Input maxLength={6} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Xác thực OTP
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default Register; 