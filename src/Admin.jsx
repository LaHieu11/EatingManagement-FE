import React, { useEffect, useState } from 'react';
import { Tabs, Card, Typography, Table, Button, Form, DatePicker, Select, message, Tag, Input, Row, Col } from 'antd';
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
  const [logs, setLogs] = useState([]);
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

  // Lấy log hoạt động
  const fetchLogs = async () => {
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
      const res = await axios.get(`${API_BASE_URL}/users/activity-log`, { params });
      setLogs(res.data);
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

  // Tab Log hoạt động: fetchLogs chỉ gọi API /users/activity-log không truyền params
  const fetchAllLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/activity-log`);
      setLogs(res.data);
    } catch (err) {
      message.error('Không thể tải log hoạt động');
    }
  };

  useEffect(() => {
    fetchMeals();
    fetchAllLogs();
    fetchReport(reportMonth);
    // eslint-disable-next-line
  }, []);

  // Tab Log hoạt động người dùng: lấy userList từ /users/only-users
  useEffect(() => {
    axios.get(`${API_BASE_URL}/users/only-users`).then(res => setUserList(res.data)).catch(() => setUserList([]));
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
    { title: 'Hành động', dataIndex: 'action', key: 'action' },
    { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm') },
  ];

  // Cột cho bảng báo cáo
  const reportColumns = [
    { title: 'Tên', dataIndex: ['user', 'fullName'], key: 'fullName', render: (v, r) => v || r.user.username },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Số suất ăn', dataIndex: 'count', key: 'count' },
  ];

  return (
    <Card style={{ maxWidth: 1200, margin: 'auto' }}>
      <Title level={3}>Admin Panel</Title>
      <Tabs defaultActiveKey="1" type="card">
        <Tabs.TabPane tab="Tạo bữa ăn mới" key="1">
          <Form layout="inline" onFinish={onCreateMeal} style={{ marginBottom: 16 }}>
            <Form.Item name="date" label="Ngày & giờ" rules={[{ required: true, message: 'Chọn ngày giờ' }]}> <DatePicker showTime format="DD/MM/YYYY HH:mm" /> </Form.Item>
            <Form.Item name="type" label="Bữa" rules={[{ required: true, message: 'Chọn loại bữa' }]}> <Select style={{ minWidth: 100 }}><Option value="lunch">Trưa</Option><Option value="dinner">Tối</Option></Select> </Form.Item>
            <Form.Item><Button type="primary" htmlType="submit">Tạo bữa ăn</Button></Form.Item>
          </Form>
          <Table columns={[{ title: 'Ngày', dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm') }, { title: 'Bữa', dataIndex: 'type', key: 'type', render: (t) => t === 'lunch' ? 'Trưa' : 'Tối' }]} dataSource={meals} rowKey="_id" size="small" pagination={{ pageSize: 5, responsive: true }} scroll={{ x: true }} />
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
          <Table columns={logColumns} dataSource={logs} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
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
            <Button type="primary" onClick={fetchLogs}>Lọc</Button>
          </div>
          <Table columns={logColumns} dataSource={logs} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default Admin; 