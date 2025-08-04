import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Button, DatePicker, message } from 'antd';
import axios from 'axios';
import API_BASE_URL from './config/api';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const Report = () => {
  const [mode, setMode] = useState('month');
  const [format, setFormat] = useState('excel');
  const [month, setMonth] = useState(moment().month() + 1);
  const [year, setYear] = useState(moment().year());
  const [week, setWeek] = useState(1);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'personal') {
      const token = localStorage.getItem('token');
      axios.get(`${API_BASE_URL}/users/only-users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setUsers(res.data))
        .catch(() => setUsers([]));
    }
  }, [mode]);

  const handleExport = async () => {
    setLoading(true);
    try {
      let params = { type: format, mode };
      if (mode === 'month') {
        params.month = month;
        params.year = year;
      } else if (mode === 'week') {
        params.week = week;
        params.year = year;
      } else if (mode === 'personal') {
        params.userId = userId;
        params.month = month;
        params.year = year;
      }
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users/export-report`, {
        params,
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Xác định tên file
      let ext = format === 'excel' ? 'xlsx' : (format === 'pdf' ? 'pdf' : 'docx');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `baocao.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
      if (err.response?.status === 401) {
        message.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!');
      } else {
        message.error(err.response?.data?.message || 'Xuất báo cáo thất bại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: 500 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Xuất báo cáo</Title>
        <div style={{ marginBottom: 16 }}>
          <span>Loại báo cáo: </span>
          <Select value={mode} onChange={setMode} style={{ width: 150, marginRight: 8 }}>
            <Option value="month">Theo tháng</Option>
            <Option value="week">Theo tuần</Option>
            <Option value="personal">Cá nhân</Option>
          </Select>
        </div>
        {mode === 'month' && (
          <div style={{ marginBottom: 16 }}>
            <span>Tháng: </span>
            <Select value={month} onChange={setMonth} style={{ width: 80, marginRight: 8 }}>
              {[...Array(12)].map((_, i) => <Option key={i+1} value={i+1}>{i+1}</Option>)}
            </Select>
            <span>Năm: </span>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              {[...Array(5)].map((_, i) => <Option key={year-i} value={year-i}>{year-i}</Option>)}
            </Select>
          </div>
        )}
        {mode === 'week' && (
          <div style={{ marginBottom: 16 }}>
            <span>Tuần: </span>
            <Select value={week} onChange={setWeek} style={{ width: 80, marginRight: 8 }}>
              {[...Array(52)].map((_, i) => <Option key={i+1} value={i+1}>{i+1}</Option>)}
            </Select>
            <span>Năm: </span>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              {[...Array(5)].map((_, i) => <Option key={year-i} value={year-i}>{year-i}</Option>)}
            </Select>
          </div>
        )}
        {mode === 'personal' && (
          <div style={{ marginBottom: 16 }}>
            <span>Người dùng: </span>
            <Select value={userId} onChange={setUserId} style={{ width: 200, marginRight: 8 }}>
              {(Array.isArray(users) ? users : []).map(u => <Option key={u._id} value={u._id}>{u.fullName} - {u.email}</Option>)}
            </Select>
            <span>Tháng: </span>
            <Select value={month} onChange={setMonth} style={{ width: 80, marginRight: 8 }}>
              {[...Array(12)].map((_, i) => <Option key={i+1} value={i+1}>{i+1}</Option>)}
            </Select>
            <span>Năm: </span>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              {[...Array(5)].map((_, i) => <Option key={year-i} value={year-i}>{year-i}</Option>)}
            </Select>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <span>Định dạng: </span>
          <Select value={format} onChange={setFormat} style={{ width: 120 }}>
            <Option value="excel">Excel</Option>
            <Option value="pdf">PDF</Option>
            <Option value="word">Word</Option>
          </Select>
        </div>
        <Button type="primary" block loading={loading} onClick={handleExport} disabled={mode==='personal' && !userId}>
          Xuất báo cáo
        </Button>
      </Card>
    </div>
  );
};

export default Report; 