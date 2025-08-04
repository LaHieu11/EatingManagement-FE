import React, { useEffect, useState } from 'react';
import { Tabs, Card, Typography, Table, Button, Form, DatePicker, Select, message, Tag, Input, Row, Col, Modal, Space, Popconfirm } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import API_BASE_URL from './config/api';
import Report from './Report';

const { Title } = Typography;
const { Option } = Select;

const Admin = () => {
  const token = localStorage.getItem('token');
  // State cho các tab
  const [meals, setMeals] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  // State cho tab "Log hoạt động" (hiển thị tất cả logs)
  const [allLogs, setAllLogs] = useState([]);
  // State cho tab "Log hoạt động người dùng" (logs được filter)
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState(dayjs());
  const [summary, setSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedType, setSelectedType] = useState('lunch');
  const [logUser, setLogUser] = useState();
  const [logMode, setLogMode] = useState('month');
  const [logMonth, setLogMonth] = useState(dayjs());
  const [logWeek, setLogWeek] = useState(1);
  const [logYear, setLogYear] = useState(dayjs().year());
  const [logDate, setLogDate] = useState(dayjs());
  const [userList, setUserList] = useState([]);
  
  // State cho quản lý người dùng
  const [allUsers, setAllUsers] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // State cho lịch sử xuất báo cáo
  const [exportHistory, setExportHistory] = useState([]);

  // Lấy danh sách bữa ăn
  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/meals/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeals(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách bữa ăn');
    } finally {
      setLoading(false);
    }
  };

  // Lấy log hoạt động cho tab "Log hoạt động người dùng" (có filter)
  const fetchFilteredLogs = async () => {
    try {
      let params = {};
      if (logUser) params.userId = logUser;
      params.mode = logMode;
      if (logMode === 'month') {
        params.month = logMonth.month() + 1;
        params.year = logMonth.year();
      } else if (logMode === 'week') {
        params.week = logWeek;
        params.year = logYear;
      } else if (logMode === 'day') {
        params.date = logDate.format('YYYY-MM-DD');
      }
      const res = await axios.get(`${API_BASE_URL}/users/activity-log`, { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilteredLogs(res.data);
    } catch (err) {
      message.error('Không thể tải log hoạt động');
    }
  };

  // Lấy báo cáo
  const fetchReport = async (month) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/meals/report/${month.year()}/${month.month() + 1}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
    } catch (err) {
      message.error('Không thể tải báo cáo');
    }
  };

  // Lấy danh sách đăng ký của 1 bữa ăn
  const fetchRegistrations = async (mealId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/meals/registrations/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  // Lấy tổng hợp danh sách ăn/hủy
  const fetchSummary = async () => {
    setLoading(true);
    try {
      // Đặt đúng giờ bữa ăn
      let date;
      if (selectedType === 'lunch') {
        date = selectedDate.hour(11).minute(30).second(0).millisecond(0).toISOString();
      } else {
        date = selectedDate.hour(18).minute(0).second(0).millisecond(0).toISOString();
      }
      const res = await axios.get(`${API_BASE_URL}/meals/kitchen/summary?date=${date}&type=${selectedType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary({
        ...res.data,
        eaters: res.data.eaters || [],
        cancels: res.data.cancels || [],
      });
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách');
      setSummary({ eaters: [], cancels: [] });
    } finally {
      setLoading(false);
    }
  };

  // Tab Log hoạt động: fetchAllLogs chỉ gọi API /users/activity-log không truyền params
  const fetchAllLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/activity-log`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllLogs(res.data);
    } catch (err) {
      message.error('Không thể tải log hoạt động');
    }
  };

  useEffect(() => {
    fetchMeals();
    fetchAllLogs();
    fetchReport(reportMonth);
    fetchAllUsers();
    fetchExportHistory();
    // eslint-disable-next-line
  }, []);

  // Tab Log hoạt động người dùng: lấy userList từ /users/only-users
  useEffect(() => {
    axios.get(`${API_BASE_URL}/users/only-users`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setUserList(res.data)).catch(() => setUserList([]));
  }, []);

  // Load dữ liệu ban đầu cho tab "Log hoạt động người dùng"
  useEffect(() => {
    fetchFilteredLogs();
  }, []);

  // Tạo bữa ăn mới
  const onCreateMeal = async (values) => {
    try {
      await axios.post(`${API_BASE_URL}/meals/create`, {
        date: values.date.toISOString(),
        type: values.type,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tạo bữa ăn thành công!');
      fetchMeals();
    } catch (err) {
      message.error(err.response?.data?.message || 'Tạo bữa ăn thất bại');
    }
  };

  // Lấy danh sách tất cả người dùng
  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách người dùng');
    }
  };

  // Lấy lịch sử xuất báo cáo
  const fetchExportHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/export-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExportHistory(res.data);
    } catch (err) {
      message.error('Không thể tải lịch sử xuất báo cáo');
    }
  };

  // Tạo người dùng mới
  const onCreateUser = async (values) => {
    try {
      await axios.post(`${API_BASE_URL}/users/create`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tạo người dùng thành công!');
      setUserModalVisible(false);
      fetchAllUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Tạo người dùng thất bại');
    }
  };

  // Khóa/mở khóa tài khoản
  const handleToggleStatus = async (userId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/users/toggle-status/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(res.data.message);
      fetchAllUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    try {
      await axios.put(`${API_BASE_URL}/users/change-password/${selectedUser._id}`, 
        { newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đổi mật khẩu thành công!');
      setPasswordModalVisible(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  // Xóa người dùng
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Đã xóa người dùng');
      fetchAllUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Xóa người dùng thất bại');
    }
  };

  // Xác nhận đăng ký ăn
  const handleConfirm = async (registrationId) => {
    try {
      await axios.put(`${API_BASE_URL}/meals/confirm/${registrationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Đã xác nhận!');
      // Sau khi xác nhận, reload lại danh sách đăng ký nếu có
      if (registrations.length > 0) {
        // Giả sử mỗi registration có trường meal là mealId
        fetchRegistrations(registrations[0].meal);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xác nhận thất bại');
    }
  };

  // Cột cho bảng đăng ký suất ăn
  const regColumns = [
    { title: 'Tên', dataIndex: ['user', 'fullName'], key: 'fullName', render: (v, r) => v || r.user.username },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Trạng thái', dataIndex: 'confirmed', key: 'confirmed', render: (c) => c ? <Tag color="green">Đã xác nhận</Tag> : <Tag color="orange">Chờ xác nhận</Tag> },
    { title: 'Hành động', key: 'action', render: (_, record) => !record.confirmed && <Button size="small" type="primary" onClick={() => handleConfirm(record._id)}>Xác nhận</Button> },
  ];

  // Cột cho bảng log hoạt động
  const logColumns = [
    { title: 'Người dùng', dataIndex: ['user', 'fullName'], key: 'user', render: (v, r) => v || r.user.username },
    { 
      title: 'Hành động', 
      dataIndex: 'action', 
      key: 'action',
      render: (action) => {
        switch(action) {
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
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm') },
  ];

  // Cột cho bảng báo cáo
  const reportColumns = [
    { title: 'Tên', dataIndex: ['user', 'fullName'], key: 'fullName', render: (v, r) => v || r.user.username },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Số suất ăn', dataIndex: 'count', key: 'count' },
  ];

  // Cột cho bảng quản lý người dùng
  const userColumns = [
    { title: 'Tên', dataIndex: 'fullName', key: 'fullName', render: (v, r) => v || r.username },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', render: (role) => {
      switch(role) {
        case 'admin': return <Tag color="red">Admin</Tag>;
        case 'kitchen': return <Tag color="orange">Kitchen</Tag>;
        case 'user': return <Tag color="blue">User</Tag>;
        default: return role;
      }
    }},
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: (isActive) => 
      isActive ? <Tag color="red">Đã khóa</Tag> : <Tag color="green">Đang hoạt động</Tag>
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Hành động', key: 'action', render: (_, record) => (
      <Space>
        <Button 
          size="small" 
          type={record.isActive ? "danger" : "primary"}
          onClick={() => handleToggleStatus(record._id)}
        >
          {record.isActive ? 'Mở khóa' : 'Khóa'}
        </Button>
        <Button 
          size="small" 
          type="default"
          onClick={() => {
            setSelectedUser(record);
            setPasswordModalVisible(true);
          }}
        >
          Đổi MK
        </Button>
        {record.role !== 'admin' && (
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  // Cột cho bảng lịch sử xuất báo cáo
  const exportHistoryColumns = [
    { title: 'Người dùng', dataIndex: ['user', 'fullName'], key: 'user', render: (v, r) => v || r.user?.username || 'Admin' },
    { title: 'Hành động', dataIndex: 'action', key: 'action', render: (action) => 'Xuất báo cáo' },
    { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm') },
  ];

  return (
    <Card style={{ maxWidth: 1200, margin: 'auto' }}>
      <Title level={3}>Admin Panel</Title>
      <Tabs defaultActiveKey="1" type="card">
        <Tabs.TabPane tab="Quản lý người dùng" key="1">
          <Button 
            type="primary" 
            style={{ marginBottom: 16 }}
            onClick={() => setUserModalVisible(true)}
          >
            Thêm người dùng mới
          </Button>
          <Table 
            columns={userColumns} 
            dataSource={allUsers} 
            rowKey="_id" 
            size="small" 
            pagination={{ pageSize: 10, responsive: true }} 
            scroll={{ x: true }}
            loading={loading}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Danh sách ăn/hủy ăn" key="2">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col><DatePicker value={selectedDate} onChange={d => { setSelectedDate(d); setSummary(null); }} /></Col>
            <Col><Select value={selectedType} onChange={v => { setSelectedType(v); setSummary(null); }} style={{ minWidth: 100 }}>
              <Option value="lunch">Trưa</Option>
              <Option value="dinner">Tối</Option>
            </Select></Col>
            <Col><Button type="primary" onClick={fetchSummary}>Xem danh sách</Button></Col>
          </Row>
          {summary && (
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>Danh sách người ăn</Title>
                <Table
                  columns={[{ title: 'Tên', dataIndex: 'fullName', key: 'fullName', render: (v, r) => v || r.username }, { title: 'Email', dataIndex: 'email', key: 'email' }]}
                  dataSource={summary.eaters}
                  rowKey="_id"
                  size="small"
                  pagination={false}
                  loading={loading}
                />
              </Col>
              <Col span={12}>
                <Title level={5}>Danh sách người hủy ăn</Title>
                <Table
                  columns={[{ title: 'Tên', dataIndex: 'fullName', key: 'fullName', render: (v, r) => v || r.username }, { title: 'Email', dataIndex: 'email', key: 'email' }]}
                  dataSource={summary.cancels}
                  rowKey="_id"
                  size="small"
                  pagination={false}
                  loading={loading}
                />
              </Col>
            </Row>
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Báo cáo" key="3">
          <Report />
          <DatePicker.MonthPicker value={reportMonth} onChange={m => { setReportMonth(m); fetchReport(m); }} style={{ marginBottom: 16 }} />
          <Table columns={reportColumns} dataSource={report} rowKey={r => r.user._id} size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Log hoạt động" key="4">
          <Table columns={logColumns} dataSource={allLogs} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Log hoạt động người dùng" key="5">
          <div style={{ marginBottom: 16 }}>
            <span>Lọc theo người dùng: </span>
            <Select
              allowClear
              showSearch
              style={{ width: 200, marginRight: 8 }}
              placeholder="Chọn người dùng"
              value={logUser}
              onChange={setLogUser}
              optionFilterProp="children"
            >
              {(Array.isArray(userList) ? userList : []).map(u => (
                <Option key={u._id} value={u._id}>{u.fullName} - {u.email}</Option>
              ))}
            </Select>
            <span>Lọc theo: </span>
            <Select value={logMode} onChange={setLogMode} style={{ width: 120, marginRight: 8 }}>
              <Option value="month">Tháng</Option>
              <Option value="week">Tuần</Option>
              <Option value="day">Ngày</Option>
            </Select>
            {logMode === 'month' && (
              <DatePicker.MonthPicker value={logMonth} onChange={setLogMonth} style={{ width: 120, marginRight: 8 }} />
            )}
            {logMode === 'week' && (
              <>
                <Select value={logWeek} onChange={setLogWeek} style={{ width: 80, marginRight: 8 }}>
                  {[...Array(52)].map((_, i) => <Option key={i+1} value={i+1}>{i+1}</Option>)}
                </Select>
                <Select value={logYear} onChange={setLogYear} style={{ width: 100, marginRight: 8 }}>
                  {[...Array(5)].map((_, i) => <Option key={logYear-i} value={logYear-i}>{logYear-i}</Option>)}
                </Select>
              </>
            )}
            {logMode === 'day' && (
              <DatePicker value={logDate} onChange={setLogDate} style={{ width: 120, marginRight: 8 }} />
            )}
            <Button type="primary" onClick={fetchFilteredLogs}>Lọc</Button>
          </div>
          <Table columns={logColumns} dataSource={filteredLogs} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Lịch sử xuất báo cáo" key="6">
          <Table 
            columns={exportHistoryColumns} 
            dataSource={exportHistory} 
            rowKey="_id" 
            size="small" 
            pagination={{ pageSize: 10, responsive: true }} 
            scroll={{ x: true }}
          />
        </Tabs.TabPane>
      </Tabs>

      {/* Modal thêm người dùng mới */}
      <Modal
        title="Thêm người dùng mới"
        visible={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={onCreateUser}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Nhập username' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
            <Select>
              <Option value="user">User</Option>
              <Option value="kitchen">Kitchen</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select>
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              Tạo người dùng
            </Button>
            <Button onClick={() => setUserModalVisible(false)}>
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal đổi mật khẩu */}
      <Modal
        title="Đổi mật khẩu"
        visible={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          setNewPassword('');
          setSelectedUser(null);
        }}
        onOk={handleChangePassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
      >
        <p>Đổi mật khẩu cho: <strong>{selectedUser?.fullName || selectedUser?.username}</strong></p>
        <Form.Item label="Mật khẩu mới" required>
          <Input.Password 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
          />
        </Form.Item>
      </Modal>
    </Card>
  );
};

export default Admin; 