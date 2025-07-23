import React, { useEffect, useState } from 'react';
import { Tabs, Card, Typography, Table, Button, Form, DatePicker, Select, message, Tag, Input, Row, Col } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

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

  // Lấy danh sách bữa ăn
  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/meals/list', {
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
      const res = await axios.get('http://localhost:3000/users/activity-log', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      message.error('Không thể tải log hoạt động');
    }
  };

  // Lấy báo cáo
  const fetchReport = async (month) => {
    try {
      const res = await axios.get(`http://localhost:3000/meals/report/${month.year()}/${month.month() + 1}`, {
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
      const res = await axios.get(`http://localhost:3000/meals/registrations/${mealId}`, {
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
      const res = await axios.get(`http://localhost:3000/meals/kitchen/summary?date=${date}&type=${selectedType}`, {
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

  useEffect(() => {
    fetchMeals();
    fetchLogs();
    fetchReport(reportMonth);
    // eslint-disable-next-line
  }, []);

  // Tạo bữa ăn mới
  const onCreateMeal = async (values) => {
    try {
      await axios.post('http://localhost:3000/meals/create', {
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
      await axios.put(`http://localhost:3000/meals/confirm/${registrationId}`, {}, {
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
        <Tabs.TabPane tab="Danh sách hủy ăn" key="2">
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
          <DatePicker.MonthPicker value={reportMonth} onChange={m => { setReportMonth(m); fetchReport(m); }} style={{ marginBottom: 16 }} />
          <Table columns={reportColumns} dataSource={report} rowKey={r => r.user._id} size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Log hoạt động" key="4">
          <Table columns={logColumns} dataSource={logs} rowKey="_id" size="small" pagination={{ pageSize: 10, responsive: true }} scroll={{ x: true }} />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default Admin; 