import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Progress, Spin, Button, message } from 'antd';
import {
  MobileOutlined,
  AppstoreOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { categoryAPI, phoneAPI, testAPIConnection } from '../api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPhones: 0,
    totalCategories: 0,
    totalValue: 0,
    stockValue: 0,
  });
  const [recentPhones, setRecentPhones] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting dashboard data fetch...');
      
      // Test API connection first
      const testResult = await testAPIConnection();
      if (!testResult.success) {
        console.warn('⚠️ API connection test failed:', testResult.error);
        message.warning(`Không thể kết nối API: ${testResult.error}. Sử dụng dữ liệu mẫu.`);
        
        // Use mock data
        setCategories([
          { id: 1, name: 'Samsung', description: 'Điện thoại Samsung' },
          { id: 2, name: 'iPhone', description: 'Điện thoại Apple' },
          { id: 3, name: 'Xiaomi', description: 'Điện thoại Xiaomi' },
        ]);
        
        setRecentPhones([
          { id: 1, name: 'iPhone 14 Pro', priceSale: 25000000, category: 'iPhone', quantityInStock: 10 },
          { id: 2, name: 'Samsung Galaxy S23', priceSale: 20000000, category: 'Samsung', quantityInStock: 15 },
          { id: 3, name: 'Xiaomi 13 Pro', priceSale: 15000000, category: 'Xiaomi', quantityInStock: 20 },
        ]);
        
        setStats({
          totalPhones: 3,
          totalCategories: 3,
          totalValue: 60000000,
          stockValue: 900000000,
        });
        
        return;
      }      // Fetch categories
      const categoriesResponse = await categoryAPI.getAllList();
      console.log('📂 Categories response:', categoriesResponse);
      
      // Safely handle categories data với cấu trúc: { code, result: { content, ... } }
      let categoriesData = [];
      if (categoriesResponse && categoriesResponse.data) {
        if (categoriesResponse.data.code === 1000 && categoriesResponse.data.result) {
          // API trả về { code: 1000, result: { content: [...] } }
          if (Array.isArray(categoriesResponse.data.result.content)) {
            categoriesData = categoriesResponse.data.result.content;
          } else if (Array.isArray(categoriesResponse.data.result)) {
            categoriesData = categoriesResponse.data.result;
          }
        } else if (Array.isArray(categoriesResponse.data)) {
          // Fallback: API trả về array trực tiếp
          categoriesData = categoriesResponse.data;
        } else if (categoriesResponse.data.content && Array.isArray(categoriesResponse.data.content)) {
          // Fallback: API trả về { content: [...] }
          categoriesData = categoriesResponse.data.content;
        } else {
          console.warn('⚠️ Categories data structure not recognized:', categoriesResponse.data);
          categoriesData = [];
        }
      }
      console.log('📂 Processed categories data:', categoriesData);
      setCategories(categoriesData);      // Fetch phones
      const phonesResponse = await phoneAPI.getAll(0, 100);
      console.log('📱 Phones response:', phonesResponse);
      
      // Safely handle phones data với cấu trúc: { code, result: { content, ... } }
      let phonesData = [];
      if (phonesResponse && phonesResponse.data) {
        if (phonesResponse.data.code === 1000 && phonesResponse.data.result) {
          // API trả về { code: 1000, result: { content: [...] } }
          if (Array.isArray(phonesResponse.data.result.content)) {
            phonesData = phonesResponse.data.result.content;
          } else if (Array.isArray(phonesResponse.data.result)) {
            phonesData = phonesResponse.data.result;
          }
        } else if (Array.isArray(phonesResponse.data)) {
          // Fallback: API trả về array trực tiếp
          phonesData = phonesResponse.data;
        } else if (phonesResponse.data.content && Array.isArray(phonesResponse.data.content)) {
          // Fallback: API trả về { content: [...] }
          phonesData = phonesResponse.data.content;
        } else {
          console.warn('⚠️ Phones data structure not recognized:', phonesResponse.data);
          phonesData = [];
        }
      }
      console.log('📱 Processed phones data:', phonesData);
      setRecentPhones(phonesData.slice(0, 5));

      // Calculate stats
      const totalPhones = phonesData.length;
      const totalCategories = categoriesData.length;
      const totalValue = phonesData.reduce((sum, phone) => sum + (phone.priceSale || 0), 0);
      const stockValue = phonesData.reduce((sum, phone) => sum + ((phone.priceSale || 0) * (phone.quantityInStock || 0)), 0);

      setStats({
        totalPhones,
        totalCategories,
        totalValue,
        stockValue,
      });
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      message.error(`Lỗi tải dữ liệu: ${error.message}`);
      
      // Fallback to mock data on error
      setCategories([
        { id: 1, name: 'Samsung', description: 'Điện thoại Samsung' },
        { id: 2, name: 'iPhone', description: 'Điện thoại Apple' },
      ]);
      setRecentPhones([
        { id: 1, name: 'iPhone 14 Pro', priceSale: 25000000, category: 'iPhone' },
      ]);
      setStats({ totalPhones: 1, totalCategories: 2, totalValue: 25000000, stockValue: 25000000 });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAPI = async () => {
    try {
      const result = await testAPIConnection();
      if (result.success) {
        message.success('✅ Kết nối API thành công!');
        console.log('API test successful:', result.data);
      } else {
        message.error(`❌ Kết nối API thất bại: ${result.error}`);
      }
    } catch (error) {
      message.error(`❌ Lỗi test API: ${error.message}`);
    }
  };

  const phoneColumns = [
    {
      title: 'Tên điện thoại',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Giá bán',
      dataIndex: 'priceSale',
      key: 'priceSale',
      render: (price) => `${(price || 0).toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantityInStock',
      key: 'quantityInStock',
      render: (quantity) => (
        <Progress
          percent={Math.min((quantity / 100) * 100, 100)}
          size="small"
          format={() => quantity}
          strokeColor={quantity > 20 ? '#52c41a' : quantity > 10 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ 
          color: status ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {status ? 'Hoạt động' : 'Ngừng bán'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>
          Dashboard - Tổng quan hệ thống
        </h1>
        <Button type="primary" onClick={handleTestAPI}>
          🧪 Test API
        </Button>
      </div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Tổng số điện thoại"
              value={stats.totalPhones}
              prefix={<MobileOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Số danh mục"
              value={stats.totalCategories}
              prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Giá trị trung bình"
              value={stats.totalValue / (stats.totalPhones || 1)}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              suffix="₫"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Giá trị tồn kho"
              value={stats.stockValue}
              prefix={<RiseOutlined style={{ color: '#f5222d' }} />}
              suffix="₫"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Điện thoại gần đây" 
            className="dashboard-card"
            extra={<a href="/phones">Xem tất cả</a>}
          >
            <Table
              dataSource={recentPhones}
              columns={phoneColumns}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>        <Col xs={24} lg={8}>
          <Card title="Danh mục sản phẩm" className="dashboard-card">
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category, index) => (
                <div key={category.id || index} style={{ 
                  padding: '12px 0',
                  borderBottom: index < categories.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'                }}>
                  <span style={{ fontWeight: 500 }}>
                    {category.name || `Danh mục ${index + 1}`}
                  </span>
                  <span style={{ color: '#1890ff' }}>
                    {Math.floor(Math.random() * 50) + 5} sản phẩm
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                Không có dữ liệu danh mục
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
