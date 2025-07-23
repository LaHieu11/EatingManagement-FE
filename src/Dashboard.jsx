import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Row, Col, Button, message, Modal } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!token) {
          message.error('Bạn chưa đăng nhập.');
          setLoading(false);
          return;
        }
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          setUser(JSON.parse(userInfo));
          console.log('User info:', userInfo);
        } else {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Payload:', payload);
          setUser(payload);
        }
        const regRes = await axios.get('http://localhost:3000/meals/my-registrations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Registrations loaded:', regRes.data);
        setRegistrations(regRes.data);
        const mealRes = await axios.get('http://localhost:3000/meals/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Meals loaded:', mealRes.data);
        setMeals(mealRes.data);
      } catch (err) {
        message.error('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Kiểm tra user đã đăng ký hủy bữa ăn này chưa (so sánh date và type)
  const isCancel = (date, type) => {
    const result = registrations.some(r => r.date && r.type && dayjs(r.date).isSame(dayjs(date), 'day') && r.type === type);
    console.log('isCancel check:', {
      date: date,
      type: type,
      dateFormatted: dayjs(date).format('YYYY-MM-DD'),
      registrations: registrations.map(r => ({
        date: r.date,
        type: r.type,
        dateFormatted: dayjs(r.date).format('YYYY-MM-DD'),
        isSameDay: dayjs(r.date).isSame(dayjs(date), 'day'),
        typeMatch: r.type === type
      })),
      result
    });
    return result;
  };

  // Lấy _id của bản ghi MealRegistration tương ứng với meal (date+type)
  const getRegistrationId = (date, type) => {
    const reg = registrations.find(r => r.date && r.type && dayjs(r.date).isSame(dayjs(date), 'day') && r.type === type);
    return reg ? reg._id : null;
  };

  const isPastCutoff = (date, type) => {
    const mealTime = dayjs(date);
    const now = dayjs();
    const cutoff = type === 'lunch'
      ? mealTime.hour(8).minute(30).second(0)
      : mealTime.hour(14).minute(30).second(0);
    const result = now.isAfter(cutoff);
    console.log('isPastCutoff check:', { date, type, mealTime: mealTime.format(), now: now.format(), cutoff: cutoff.format(), result });
    return result;
  };

  const handleCancel = async (date, type) => {
    console.log('handleCancel called:', { date, type });
    if (!token) {
      message.error('Bạn chưa đăng nhập.');
      return;
    }
    Modal.confirm({
      title: 'Xác nhận hủy ăn',
      content: `Bạn có chắc chắn muốn hủy bữa ${type === 'lunch' ? 'trưa' : 'tối'} ngày ${dayjs(date).format('DD/MM/YYYY')} không?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        console.log('Modal onOk called, about to call axios.post');
        try {
          const res = await axios.post('http://localhost:3000/meals/cancel', { date: new Date(date).toISOString(), type }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('API response:', res);
          message.success('Đã đăng ký hủy ăn!');
          const regRes = await axios.get('http://localhost:3000/meals/my-registrations', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRegistrations(regRes.data);
        } catch (err) {
          console.error('API error:', err, err?.response);
          message.error(err?.response?.data?.message || 'Đăng ký hủy ăn thất bại');
        }
      },
      onCancel: () => {
        console.log('Modal cancelled');
      },
    });
  };

  const handleUncancel = async (date, type) => {
    if (!token) {
      message.error('Bạn chưa đăng nhập.');
      return;
    }
    const regId = getRegistrationId(date, type);
    if (!regId) {
      message.error('Không tìm thấy đăng ký hủy. Vui lòng tải lại trang!');
      return;
    }
    Modal.confirm({
      title: 'Xác nhận đồng ý ăn',
      content: `Bạn có chắc chắn muốn đồng ý ăn lại bữa ${type === 'lunch' ? 'trưa' : 'tối'} ngày ${dayjs(date).format('DD/MM/YYYY')} không?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:3000/meals/cancel/${regId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Đã đồng ý ăn lại!');
          const regRes = await axios.get('http://localhost:3000/meals/my-registrations', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRegistrations(regRes.data);
        } catch (err) {
          message.error(err.response?.data?.message || 'Đồng ý ăn thất bại');
        }
      },
    });
  };

  // Gom bữa ăn theo ngày
  const groupedMeals = meals.reduce((acc, meal) => {
    const day = dayjs(meal.date).format('DD/MM/YYYY');
    if (!acc[day]) acc[day] = [];
    acc[day].push(meal);
    return acc;
  }, {});
  console.log('Grouped meals:', groupedMeals);

  const renderTable = (day, mealsOfDay) => {
    console.log('Rendering table for day:', day, 'meals:', mealsOfDay);
    const columns = [
      {
        title: 'Giờ',
        dataIndex: 'date',
        key: 'date',
        render: (date) => dayjs(date).format('HH:mm:ss'),
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
        render: (_, record) => isCancel(record.date, record.type)
          ? <Tag color="red">Đã đăng ký hủy ăn</Tag>
          : <Tag color="green">Sẽ ăn</Tag>,
      },
      {
        title: 'Hành động',
        key: 'action',
        render: (_, record) => {
          const past = isPastCutoff(record.date, record.type);
          const isCancelled = isCancel(record.date, record.type);
          console.log('Action render:', { date: record.date, type: record.type, past, isCancelled });
          if (isCancelled) {
            console.log('Rendering "Đồng ý ăn" button for:', record);
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  console.log('Button clicked for:', record);
                  handleUncancel(record.date, record.type);
                }}
                disabled={past}
              >
                Đồng ý ăn
              </Button>
            );
          }
          console.log('Rendering "Hủy ăn" button for:', record);
          return (
            <Button
              danger
              size="small"
              onClick={() => {
                console.log('Button clicked for:', record);
                handleCancel(record.date, record.type);
              }}
              disabled={past}
            >
              Hủy ăn
            </Button>
          );
        },
      },
      {
        title: 'Ghi chú',
        key: 'note',
        render: (_, record) => {
          const past = isPastCutoff(record.date, record.type);
          if (past) return <span style={{ color: '#888' }}>Đã quá giờ hủy ăn</span>;
          if (isCancel(record.date, record.type)) return <span style={{ color: '#888' }}>Đã đăng ký hủy, bấm "Đồng ý ăn" để ăn lại</span>;
          return null;
        },
      },
    ];
    return (
      <div key={day} style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 8 }}>{day}</Title>
        <Table
          columns={columns}
          dataSource={mealsOfDay}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: 'Không có bữa ăn nào.' }}
          pagination={false}
          size="small"
          scroll={{ x: true }}
        />
      </div>
    );
  };

  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} md={8}>
        <Card>
          <Title level={4}>Thông tin cá nhân</Title>
          {user ? (
            <>
              <Text strong>Họ tên:</Text> <Text>{user.fullName || user.username}</Text><br />
              <Text strong>Email:</Text> <Text>{user.email || '-'}</Text><br />
              <Text strong>Giới tính:</Text> <Text>{user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}</Text><br />
              <Text strong>Vai trò:</Text> <Text>{user.role === 'admin' ? 'Quản trị viên' : user.role === 'kitchen' ? 'Nhà bếp' : 'Thành viên'}</Text>
            </>
          ) : <Text>Đang tải...</Text>}
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card>
          <Title level={4}>Đăng ký hủy ăn các bữa sắp tới</Title>
          {Object.keys(groupedMeals).length === 0 ? (
            <div style={{ color: '#888', padding: 24 }}>Không có bữa ăn nào trong 7 ngày tới.</div>
          ) : (
            Object.entries(groupedMeals).map(([day, mealsOfDay]) => renderTable(day, mealsOfDay))
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard; 