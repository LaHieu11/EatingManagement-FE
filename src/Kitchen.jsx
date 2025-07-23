import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, DatePicker, Select, Row, Col, Tag, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const Kitchen = () => {
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [reportMonth, setReportMonth] = useState(dayjs());
  const token = localStorage.getItem('token');

  // Lấy danh sách bữa ăn
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await axios.get('http://localhost:3000/meals/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeals(res.data);
      } catch (err) {
        message.error('Không thể tải danh sách bữa ăn');
      }
    };
    fetchMeals();
    // eslint-disable-next-line
  }, []);

  // Lấy tổng hợp cho kitchen khi chọn bữa
  const fetchSummary = async (mealId) => {
    setLoading(true);
    try {
      // Lấy meal object đã chọn
      const meal = meals.find(m => m._id === mealId);
      if (!meal) throw new Error('Không tìm thấy meal');
      const date = meal.date;
      const type = meal.type;
      console.log('DEBUG fetchSummary:', { mealId, date, type });
      const res = await axios.get(`http://localhost:3000/meals/kitchen/summary?date=${date}&type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary({
        ...res.data,
        eaters: res.data.eaters || [],
        cancels: res.data.cancels || [],
      });
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải tổng hợp');
      setSummary({ eaters: [], cancels: [] });
    } finally {
      setLoading(false);
    }
  };

  // Lấy báo cáo tổng công, tổng tiền từng người trong tháng
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

  useEffect(() => {
    fetchReport(reportMonth);
    // eslint-disable-next-line
  }, [reportMonth]);

  const mealOptions = meals.map(m => ({
    value: m._id,
    label: `${dayjs(m.date).format('DD/MM/YYYY HH:mm')} - ${m.type === 'lunch' ? 'Trưa' : 'Tối'}`,
  }));

  const selectedMealObj = meals.find(m => m._id === selectedMeal);

  return (
    <Card style={{ maxWidth: 1200, margin: 'auto' }}>
      <Title level={3}>Nhà bếp - Quản lý suất ăn</Title>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8 }}>Chọn bữa ăn để xem chi tiết:</div>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Chọn bữa ăn"
            options={mealOptions}
            onChange={val => {
              setSelectedMeal(val);
              setSummary(null);
              fetchSummary(val);
            }}
            optionFilterProp="label"
          />
        </Col>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8 }}>Xem tổng công, tổng tiền từng người trong tháng:</div>
          <DatePicker.MonthPicker
            value={reportMonth}
            onChange={m => setReportMonth(m)}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      {summary && (
        <Card style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 8 }}>Chi tiết bữa ăn</Title>
          <div><b>Ngày:</b> {selectedMealObj ? dayjs(selectedMealObj.date).format('DD/MM/YYYY HH:mm') : ''}</div>
          <div><b>Bữa:</b> {selectedMealObj ? (selectedMealObj.type === 'lunch' ? 'Trưa' : 'Tối') : ''}</div>
          <div><b>Tổng số người ăn:</b> <Tag color="green">{summary.totalEat}</Tag></div>
          <div><b>Tổng số người hủy:</b> <Tag color="red">{summary.totalCancel}</Tag></div>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Title level={5}>Danh sách người ăn</Title>
              <Table
                columns={[{ title: 'Tên', dataIndex: 'fullName', key: 'fullName', render: (v, r) => v || r.username }, { title: 'Email', dataIndex: 'email', key: 'email' }]}
                dataSource={summary.eaters}
                rowKey="_id"
                size="small"
                pagination={false}
              />
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>Danh sách người hủy ăn</Title>
              <Table
                columns={[{ title: 'Tên', dataIndex: 'fullName', key: 'fullName', render: (v, r) => v || r.username }, { title: 'Email', dataIndex: 'email', key: 'email' }]}
                dataSource={summary.cancels}
                rowKey="_id"
                size="small"
                pagination={false}
              />
            </Col>
          </Row>
        </Card>
      )}
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>Báo cáo tổng công, tổng tiền từng người trong tháng</Title>
        <Table
          columns={[
            { title: 'Tên', dataIndex: ['user', 'fullName'], key: 'fullName', render: (v, r) => v || r.user.username },
            { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
            { title: 'Số công', dataIndex: 'count', key: 'count' },
            { title: 'Tổng tiền (VNĐ)', key: 'total', render: (_, r) => (r.count * 30000).toLocaleString() },
          ]}
          dataSource={report}
          rowKey={r => r.user._id}
          size="small"
          pagination={{ pageSize: 10, responsive: true }}
          scroll={{ x: true }}
        />
      </Card>
    </Card>
  );
};

export default Kitchen; 