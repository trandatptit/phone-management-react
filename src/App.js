import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  MobileOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import CategoryManagement from './components/CategoryManagement';
import PhoneManagement from './components/PhoneManagement';

const { Header, Sider, Content } = Layout;

// Component con để sử dụng useLocation và useNavigate
const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); // Hook để lấy đường dẫn hiện tại
  const navigate = useNavigate(); // Hook để navigate
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: 'Quản lý danh mục',
    },
    {
      key: '/phones',
      icon: <MobileOutlined />,
      label: 'Quản lý điện thoại',
    },
  ];

  // Function để handle menu click
  const handleMenuClick = ({ key }) => {
    console.log('📍 Navigating to:', key);
    navigate(key);
  };

  // Debug current location
  console.log('📍 Current location:', location.pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'PM' : 'Phone Manager'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]} // Sử dụng location.pathname để highlight đúng menu
          items={menuItems}
          onClick={handleMenuClick} // Sử dụng navigate thay vì window.location
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 24px'
          }}>
            <div>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 18 }
              })}
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 'bold',
              color: '#1890ff'
            }}>
              Hệ thống quản lý điện thoại
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/phones" element={<PhoneManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

// Component chính wrap Router
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;