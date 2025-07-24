import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Tag, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import API_BASE_URL from './config/api';

const { Title } = Typography;

const MealRegister = () => {
  const [meals, setMeals] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy danh sách bữa ăn
        const mealRes = await axios.get(`${API_BASE_URL}/meals/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeals(mealRes.data);
        // Lấy lịch sử đăng ký hủy của user
        const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegistrations(regRes.data);
      } catch (err) {
        message.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Kiểm tra user đã đăng ký hủy bữa ăn này chưa
  const isCancel = (mealId) => registrations.some(r => r.meal && r.meal._id === mealId);
  const getRegistrationId = (mealId) => {
    const reg = registrations.find(r => r.meal && r.meal._id === mealId);
    return reg ? reg._id : null;
  };

  const handleCancel = async (mealId) => {
    try {
      await axios.post(`${API_BASE_URL}/meals/cancel`, { mealId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Đã đăng ký hủy ăn!');
      // Refresh data
      const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(regRes.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng ký hủy ăn thất bại');
    }
  };

  const handleUncancel = async (registrationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/meals/cancel/${registrationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Đã bỏ đăng ký hủy ăn!');
      // Refresh data
      const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(regRes.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Bỏ đăng ký hủy ăn thất bại');
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Bữa',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'lunch' ? 'Trưa' : 'Tối',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => isCancel(record._id)
        ? <Tag color="red">Đã đăng ký hủy ăn</Tag>
        : <Tag color="green">Sẽ ăn</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => isCancel(record._id)
        ? <Button danger size="small" onClick={() => handleUncancel(getRegistrationId(record._id))}>Bỏ hủy</Button>
        : <Button type="primary" size="small" onClick={() => handleCancel(record._id)}>Hủy ăn</Button>,
    },
  ];

  // Chỉ hiển thị các bữa ăn trong tương lai
  const futureMeals = meals.filter(m => dayjs(m.date).isAfter(dayjs().subtract(1, 'hour')));

  return (
    <Card style={{ maxWidth: 900, margin: 'auto' }}>
      <Title level={4}>Đăng ký hủy ăn</Title>
      <Table
        columns={columns}
        dataSource={futureMeals}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5, responsive: true }}
        size="small"
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default MealRegister; 