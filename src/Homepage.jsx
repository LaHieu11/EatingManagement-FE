import React from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SmileOutlined, LoginOutlined, UserAddOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './Homepage.css';

const { Title, Paragraph } = Typography;

const Homepage = () => {
  const navigate = useNavigate();
  return (
    <div className="homepage-bg">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} md={16} lg={12}>
          <Card className="homepage-card" bordered={false}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <SmileOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={1} style={{ fontSize: 40, margin: '16px 0 0 0', color: '#222' }}>Hệ thống Quản lý Suất ăn Cơ quan xã Lương Minh</Title>
              <Paragraph style={{ fontSize: 18, color: '#666' }}>
                Đăng ký, quản lý và tổng hợp suất ăn cho toàn thể cán bộ nhân viên một cách nhanh chóng, minh bạch và tiện lợi.
              </Paragraph>
            </div>
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={8}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<LoginOutlined />}
                  style={{ fontSize: 22, height: 56 }}
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<UserAddOutlined />}
                  style={{ fontSize: 22, height: 56 }}
                  onClick={() => navigate('/register')}
                >
                  Đăng ký
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="dashed"
                  size="large"
                  block
                  icon={<InfoCircleOutlined />}
                  style={{ fontSize: 22, height: 56 }}
                  onClick={() => window.open('https://ant.design', '_blank')}
                >
                  Giới thiệu
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Homepage; 