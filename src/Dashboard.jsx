import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Row, Col, Button, message, Modal, DatePicker, Form, Input, InputNumber } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import API_BASE_URL from './config/api';

const { Title, Text } = Typography;

// Đặt ActivityLog lên đầu file để dễ quản lý và debug
const ActivityLog = ({ userId }) => {
  console.log('ActivityLog render, userId:', userId);
  const [logs, setLogs] = useState([]);
  const [from, setFrom] = useState();
  const [to, setTo] = useState();

  const fetchLogs = () => {
    if (userId) {
      let url = `${API_BASE_URL}/users/activity-log?userId=${userId}`;
      if (from) url += `&from=${from.format('YYYY-MM-DD')}`;
      if (to) url += `&to=${to.format('YYYY-MM-DD')}`;
      console.log('Gọi API:', url);
      const token = localStorage.getItem('token');
      axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          console.log('Activity log data:', res.data);
          setLogs(res.data);
        })
        .catch((err) => {
          console.error('Lỗi tải lịch sử hoạt động:', err);
          message.error('Không thể tải lịch sử hoạt động');
        });
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [userId]);

  const columns = [
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        switch (action) {
          case 'cancel_meal':
            return 'Đăng ký hủy ăn';
          case 'uncancel_meal':
            return 'Đăng ký ăn lại';
          case 'cancel_registration':
            return 'Hủy đăng ký suất ăn';
          case 'register_meal':
            return 'Đăng ký ăn';
          default:
            return action;
        }
      }
    },
    { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: d => new Date(d).toLocaleString('vi-VN') },
  ];

  return (
    <Card style={{ maxWidth: 900, margin: 'auto', marginTop: 32 }}>
      <Title level={4}>Lịch sử hoạt động của bạn</Title>
      <div style={{ marginBottom: 16 }}>
        <span>Lọc theo ngày: </span>
        <DatePicker value={from} onChange={setFrom} style={{ marginRight: 8 }} placeholder="Từ ngày" />
        <DatePicker value={to} onChange={setTo} style={{ marginRight: 8 }} placeholder="Đến ngày" />
        <Button type="primary" onClick={fetchLogs}>Lọc</Button>
      </div>
      <Table columns={columns} dataSource={Array.isArray(logs) ? logs : []} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
    </Card>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userReady, setUserReady] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [meals, setMeals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const [guestModal, setGuestModal] = useState({ visible: false, meal: null });
  const [guestForm] = Form.useForm();
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
          setUserReady(true);
          console.log('User info:', userInfo);
        } else {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(payload);
          setUserReady(true);
          console.log('Payload:', payload);
        }
        const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Registrations loaded:', regRes.data);
        console.log('Registrations details:', regRes.data.map(r => ({
          _id: r._id,
          date: r.date,
          type: r.type,
          isCancel: r.isCancel,
          user: r.user,
          dateFormatted: dayjs(r.date).format('YYYY-MM-DD')
        })));
        setRegistrations(regRes.data);
        const mealRes = await axios.get(`${API_BASE_URL}/meals/list`, {
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

  useEffect(() => {
    if (user && user._id) {
      let url = `${API_BASE_URL}/users/activity-log?userId=${user._id}`;
      console.log('Gọi API trực tiếp trong Dashboard:', url);
      axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          console.log('Activity log data trực tiếp:', res.data);
        })
        .catch((err) => {
          console.error('Lỗi tải lịch sử hoạt động trực tiếp:', err);
        });
    }
  }, [user]);

  // Kiểm tra user đã đăng ký hủy bữa ăn này chưa (so sánh date và type)
  // So sánh ngày bằng UTC ở mọi nơi:
  const isCancel = (date, type) => {
    return registrations.some(r => {
      if (!r.isCancel) return false;
      const regDate = dayjs(r.date).utc().format('YYYY-MM-DD HH:mm');
      const mealDate = dayjs(date).utc().format('YYYY-MM-DD HH:mm');
      return regDate === mealDate && r.type === type;
    });
  };

  // Lấy _id của bản ghi MealRegistration tương ứng với meal (date+type)
  const getRegistrationId = (date, type) => {
    const reg = registrations.find(r => {
      // Chỉ xét các đăng ký có isCancel = true
      if (!r.isCancel) return false;

      // So sánh ngày (chỉ phần date, không tính giờ)
      const regDate = dayjs(r.date).utc().format('YYYY-MM-DD HH:mm');
      const mealDate = dayjs(date).utc().format('YYYY-MM-DD HH:mm');
      const dateMatch = regDate === mealDate;

      // So sánh type
      const typeMatch = r.type === type;

      return dateMatch && typeMatch;
    });
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

  // Trước khi hiển thị modal hủy ăn, kiểm tra isCancel
  const handleCancel = async (date, type) => {
    if (isCancel(date, type)) {
      message.error('Bạn đã đăng ký hủy ăn cho bữa này');
      return;
    }
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
          const res = await axios.post(`${API_BASE_URL}/meals/cancel`, { date: dayjs(date).utc().toISOString(), type }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('API response:', res);
          message.success('Đã đăng ký hủy ăn!');
          const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
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
          await axios.delete(`${API_BASE_URL}/meals/cancel/${regId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Đã đồng ý ăn lại!');
          const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRegistrations(regRes.data);
        } catch (err) {
          message.error(err.response?.data?.message || 'Đồng ý ăn thất bại');
        }
      },
    });
  };

  // Hàm xử lý đổi mật khẩu
  const handleChangePassword = async (values) => {
    setChangePasswordLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/users/change-password`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Đổi mật khẩu thành công!');
      setChangePasswordVisible(false);
      changePasswordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Gom bữa ăn theo ngày
  const groupedMeals = meals.reduce((acc, meal) => {
    const day = dayjs(meal.date).format('DD/MM/YYYY');
    if (!acc[day]) acc[day] = [];
    acc[day].push(meal);
    return acc;
  }, {});
  console.log('Grouped meals:', groupedMeals);

  const isWeekend = (date) => {
    const d = dayjs(date).day();
    return d === 0 || d === 6; // Chủ nhật (0) hoặc Thứ 7 (6)
  };

  // Khi gửi date lên backend:
  const toUTCISOString = (date) => dayjs(date).utc().toISOString();

  // Trong các chỗ gọi axios.post/axios.get liên quan đến date:
  // Ví dụ:
  // await axios.post(`${API_BASE_URL}/meals/cancel`, { date: toUTCISOString(date), type }, ...)
  // ...
  // Hiển thị giờ bữa trưa/tối:
  // Hiển thị giờ bữa trưa là 11:30, bữa tối là 19:00
  const getMealTime = (type) => type === 'lunch' ? '11:30' : '19:00';

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
        render: (_, record) => {
          if (isWeekend(record.date)) {
            return isCancel(record.date, record.type)
              ? <Tag color="green">Đã đăng ký ăn</Tag>
              : <Tag color="red">Không ăn</Tag>;
          }
          return isCancel(record.date, record.type)
            ? <Tag color="red">Đã đăng ký hủy ăn</Tag>
            : <Tag color="green">Sẽ ăn</Tag>;
        },
      },
      {
        title: 'Hành động',
        key: 'action',
        render: (_, record) => {
          const past = isPastCutoff(record.date, record.type);
          const isCancelled = isCancel(record.date, record.type);
          console.log('Action render:', { date: record.date, type: record.type, past, isCancelled });
          if (isWeekend(record.date)) {
            if (isCancelled) {
              return (
                <Button type="default" size="small" disabled>
                  Đã đăng ký ăn
                </Button>
              );
            }
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUncancel(record.date, record.type)}
                disabled={past}
              >
                Đăng ký ăn
              </Button>
            );
          }
          if (isCancelled) {
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUncancel(record.date, record.type)}
                disabled={past}
              >
                Đồng ý ăn
              </Button>
            );
          }
          return (
            <Button
              danger
              size="small"
              onClick={() => handleCancel(record.date, record.type)}
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
          if (isCancel(record.date, record.type)) return <span style={{ color: '#888' }}>Đã đăng ký hủy, bấm "Đồng ý ăn" để đăng kí ăn lại</span>;
          return null;
        },
      },
      {
        title: 'Khách',
        key: 'guest',
        render: (_, record) => (
          <Button size="small" onClick={() => setGuestModal({ visible: true, meal: record })}>
            Đăng ký thêm suất ăn cho khách
          </Button>
        ),
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

  console.log('Dashboard component render');
  console.log('userReady:', userReady, 'user:', user);

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
              <br />
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={() => setChangePasswordVisible(true)}
              >
                Đổi mật khẩu
              </Button>
              <ActivityLog userId={user && user._id} />
            </>
          ) : <Text>Đang tải...</Text>}
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card>
          <Title level={4}>Đăng ký hủy ăn các bữa sắp tới</Title>
          {/* Hiển thị banner nếu có bữa ăn đã được đăng ký hủy */}
          {Object.entries(groupedMeals).some(([day, mealsOfDay]) =>
            mealsOfDay.some(meal => isCancel(meal.date, meal.type))
          ) && (
              <div style={{
                backgroundColor: '#ff4d4f',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px' }}>⚠️</span>
                Bạn đã đăng ký hủy ăn cho một số bữa trong danh sách này
              </div>
            )}
          {Object.keys(groupedMeals).length === 0 ? (
            <div style={{ color: '#888', padding: 24 }}>Không có bữa ăn nào trong 7 ngày tới.</div>
          ) : (
            Object.entries(groupedMeals).map(([day, mealsOfDay]) => renderTable(day, mealsOfDay))
          )}
        </Card>
      </Col>

      {/* Modal đổi mật khẩu */}
      <Modal
        title="Đổi mật khẩu"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu cũ' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu cũ" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordLoading}
              block
            >
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal đăng ký suất ăn cho khách */}
      {/* Modal đăng ký suất ăn cho khách - ĐÃ SỬA */}
      <Modal
        title="Đăng ký thêm suất ăn cho khách"
        open={guestModal.visible}
        onCancel={() => {
          setGuestModal({ visible: false, meal: null });
          guestForm.resetFields();
        }}
        footer={null}
        destroyOnClose={false} // Thay đổi từ true thành false
      >
        <Form
          form={guestForm}
          layout="vertical"
          initialValues={{ guestCount: 1 }}
          onFinish={async (values) => {
            try {
              console.log('Form values:', values); // Debug log
              const { guestName, guestCount, guestReason } = values;
              const { date, type } = guestModal.meal;

              // Kiểm tra dữ liệu trước khi gửi
              if (!guestName || !guestName.trim()) {
                message.error('Vui lòng nhập tên khách');
                return;
              }

              console.log('Sending data:', { // Debug log
                date,
                type,
                guestName: guestName.trim(),
                guestCount,
                guestReason
              });

              await axios.post(`${API_BASE_URL}/meals/register-guest`, {
                date: dayjs(date).utc().toISOString(),
                type,
                guestName: guestName.trim(),
                guestCount,
                guestReason
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              message.success('Đăng ký suất ăn cho khách thành công!');
              setGuestModal({ visible: false, meal: null });
              guestForm.resetFields();

              // Reload lại dữ liệu
              const regRes = await axios.get(`${API_BASE_URL}/meals/my-registrations`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setRegistrations(regRes.data);
              const mealRes = await axios.get(`${API_BASE_URL}/meals/list`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setMeals(mealRes.data);
            } catch (err) {
              console.error('Guest registration error:', err); // Debug log
              message.error(err?.response?.data?.message || 'Đăng ký suất ăn cho khách thất bại');
            }
          }}
        >
          <Form.Item
            name="guestName"
            label="Tên khách"
            rules={[
              { required: true, message: 'Vui lòng nhập tên khách' },
              { whitespace: true, message: 'Tên khách không được chỉ chứa khoảng trắng' }
            ]}
          >
            <Input
              placeholder="Nhập tên khách"
              allowClear
              onBlur={(e) => {
                // Trim khoảng trắng khi blur
                const trimmedValue = e.target.value.trim();
                guestForm.setFieldsValue({ guestName: trimmedValue });
              }}
            />
          </Form.Item>

          <Form.Item
            name="guestCount"
            label="Số suất"
            rules={[
              { required: true, message: 'Nhập số suất hợp lệ' },
              { type: 'number', min: 1, message: 'Số suất phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Nhập số suất"
            />
          </Form.Item>

          <Form.Item
            name="guestReason"
            label="Lý do (tùy chọn)"
          >
            <Input placeholder="Nhập lý do (nếu có)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default Dashboard; 