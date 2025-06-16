import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Tag,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  EyeOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { categoryAPI } from '../api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Thêm vào trong component, sau các states hiện có:
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedPagination, setDeletedPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [restoringId, setRestoringId] = useState(null);
  useEffect(() => {
    fetchCategories();
    fetchDeletedCategories();
  }, [pagination.current, pagination.pageSize]);
  // Thêm sau useEffect hiện có:
  useEffect(() => {
    fetchDeletedCategories(0, 10);
  }, []);
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('📂 Fetching categories...');

      const response = await categoryAPI.getAll(
        pagination.current - 1,
        pagination.pageSize
      );

      console.log('📂 Categories API response:', response);

      // Xử lý cấu trúc response: { code, result: { content, page, size, totalElements, totalPages, last } }
      if (response.data && response.data.code === 1000 && response.data.result) {
        const { content, totalElements } = response.data.result;

        if (Array.isArray(content)) {
          setCategories(content);
          setPagination(prev => ({
            ...prev,
            total: totalElements || 0,
          }));
          console.log('✅ Categories loaded:', content.length, 'items');
        } else {
          console.warn('⚠️ Content is not an array:', content);
          setCategories([]);
        }
      } else {
        console.warn('⚠️ Invalid response structure:', response.data);
        setCategories([]);
        message.warning('Cấu trúc dữ liệu API không đúng định dạng');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      message.error(`Không thể tải danh sách danh mục: ${error.message}`);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedCategories = async (page = 0, size = 10) => {
    try {
      setDeletedLoading(true);
      console.log(`🗑️ Fetching deleted categories - Page: ${page}, Size: ${size}`);

      const response = await categoryAPI.getDeleted(page, size);
      console.log('🗑️ Deleted categories response:', response);

      // Xử lý response thành công
      if (response?.data && response.data.code === 1000) {
        const result = response.data.result || {};
        const deletedData = result.content || [];
        const totalElements = result.totalElements || 0;

        setDeletedCategories(deletedData);
        setDeletedPagination(prev => ({
          ...prev,
          current: page + 1,
          pageSize: size,
          total: totalElements
        }));
        console.log('✅ Successfully loaded deleted categories');
      }
      // Xử lý trường hợp không tìm thấy data (code 1005)
      else if (response?.data && response.data.code === 1005) {
        console.log('⚠️ No categories found on this page, trying page 0...');

        if (page > 0) {
          // Nếu đang ở trang > 0, thử load trang đầu tiên
          try {
            const fallbackResponse = await categoryAPI.getDeleted(0, size);
            console.log('🔄 Fallback response:', fallbackResponse);

            if (fallbackResponse?.data && fallbackResponse.data.code === 1000) {
              const result = fallbackResponse.data.result || {};
              const deletedData = result.content || [];
              const totalElements = result.totalElements || 0;

              setDeletedCategories(deletedData);
              setDeletedPagination(prev => ({
                ...prev,
                current: 1, // Reset về trang 1
                pageSize: size,
                total: totalElements
              }));
              console.log('✅ Successfully loaded page 0 as fallback');
            } else {
              // Trang 0 cũng không có data - danh sách trống
              setDeletedCategories([]);
              setDeletedPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size,
                total: 0
              }));
              console.log('ℹ️ No deleted categories found');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback request failed:', fallbackError);
            setDeletedCategories([]);
            setDeletedPagination(prev => ({
              ...prev,
              current: 1,
              total: 0
            }));
          }
        } else {
          // Đang ở trang 0 mà vẫn không có data - danh sách trống
          setDeletedCategories([]);
          setDeletedPagination(prev => ({
            ...prev,
            current: 1,
            pageSize: size,
            total: 0
          }));
          console.log('ℹ️ No deleted categories in database');
        }
      }
      // Các trường hợp lỗi khác
      else {
        console.error('❌ Unexpected response structure:', response);
        setDeletedCategories([]);
        setDeletedPagination(prev => ({
          ...prev,
          current: 1,
          total: 0
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching deleted categories:', error);
      console.log('❌ Error details:', {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message
      });

      // Nếu lỗi mạng hoặc 500, hiển thị lỗi
      if (error.response?.status >= 500 || !error.response) {
        message.error(`Lỗi kết nối: ${error.response?.data?.message || error.message}`);
      }
      // Nếu lỗi 404 hoặc page không tồn tại và đang ở trang > 0
      else if ((error.response?.status === 404 || error.response?.data?.code === 1005) && page > 0) {
        console.log('🔄 Page not found, trying page 0...');
        try {
          const fallbackResponse = await categoryAPI.getDeleted(0, size);
          if (fallbackResponse?.data && fallbackResponse.data.code === 1000) {
            const result = fallbackResponse.data.result || {};
            const deletedData = result.content || [];
            const totalElements = result.totalElements || 0;

            setDeletedCategories(deletedData);
            setDeletedPagination(prev => ({
              ...prev,
              current: 1,
              pageSize: size,
              total: totalElements
            }));
          } else {
            setDeletedCategories([]);
            setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
          }
        } catch (fallbackError) {
          setDeletedCategories([]);
          setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
      } else {
        // Các lỗi khác - set empty state
        setDeletedCategories([]);
        setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
      }
    } finally {
      setDeletedLoading(false);
    }
  };
  const handleSubmit = async (values) => {
    try {
      console.log('💾 Submitting category:', values);

      let response;
      if (editingCategory) {
        response = await categoryAPI.update(editingCategory.id, values);
        console.log('✏️ Update response:', response);
        message.success('Cập nhật danh mục thành công');
      } else {
        response = await categoryAPI.create(values);
        console.log('📝 Create response:', response);
        message.success('Thêm danh mục thành công');
      }

      setModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      console.error('❌ Error saving category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      message.error(editingCategory ? `Cập nhật danh mục thất bại: ${errorMessage}` : `Thêm danh mục thất bại: ${errorMessage}`);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa danh mục này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          console.log('🗑️ Deleting category:', id);
          await categoryAPI.delete(id);
          message.success('Xóa danh mục thành công');

          // Refresh bảng danh mục hiện tại
          const currentPage = pagination.current - 1;
          fetchCategories(currentPage, pagination.pageSize);

          // 👇 THÊM DÒNG NÀY: Refresh bảng danh mục đã xóa
          const deletedCurrentPage = deletedPagination.current - 1;
          fetchDeletedCategories(deletedCurrentPage, deletedPagination.pageSize);

          console.log('✅ Both tables refreshed after delete');

        } catch (error) {
          console.error('❌ Error deleting category:', error);
          message.error(`Không thể xóa danh mục: ${error.response?.data?.message || error.message}`);
        }
      },
    });
  };

  const handleRestore = (id) => {
    Modal.confirm({
      title: 'Xác nhận khôi phục',
      content: 'Bạn có chắc chắn muốn khôi phục danh mục này?',
      okText: 'Khôi phục',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setRestoringId(id);
          await categoryAPI.restore(id);
          message.success('Khôi phục danh mục thành công');

          // Refresh bảng danh mục hiện tại
          const currentPage = pagination.current - 1;
          fetchCategories(currentPage, pagination.pageSize);

          // Refresh bảng danh mục đã xóa
          const deletedCurrentPage = deletedPagination.current - 1;
          fetchDeletedCategories(deletedCurrentPage, deletedPagination.pageSize);

          console.log('✅ Both tables refreshed after restore');
        } catch (error) {
          console.error('❌ Error restoring category:', error);
          message.error(`Không thể khôi phục danh mục: ${error.response?.data?.message || error.message}`);
        } finally {
          setRestoringId(null);
        }
      },
    });
  };
  const openModal = (category = null) => {
    setEditingCategory(category);
    setModalVisible(true);
    if (category) {
      form.setFieldsValue(category);
    } else {
      form.resetFields();
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Tag color="blue" className="category-tag">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Số loại SP',
      dataIndex: 'phonesCount',
      key: 'phonesCount',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'red'}>
          {count > 0 ? `${count} loại sản phẩm` : 'Không có sản phẩm'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)} // 👈 Gọi trực tiếp luôn
          >
            Xóa
          </Button>
          <Button
            icon={<UndoOutlined />}
            size="small"
            onClick={() => handleRestore(record.id)}
          >
            Khôi phục
          </Button>
        </Space>
      ),
    },
  ];

  // 👇 THÊM NGAY SAU ĐÂY 👇
  const deletedColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <span style={{ color: '#999', textDecoration: 'line-through' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <span style={{ color: '#999' }}>
          {date ? new Date(date).toLocaleString('vi-VN') : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<UndoOutlined />}
            loading={restoringId === record.id}
            onClick={() => handleRestore(record.id)}
          >
            Khôi phục
          </Button>
          {/* <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openModal(record)}
            disabled={restoringId === record.id}
          >
            Xem
          </Button> */}
        </Space>
      ),
    },
  ];
  return (
    <div>
      <Card className="dashboard-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
              Quản lý danh mục
            </h1>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              size="large"
            >
              Thêm danh mục
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={categories}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} danh mục`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize,
              }));
            },
          }}
          rowKey="id"
          bordered
        />
      </Card>
      {/* PHẦN 2: DANH MỤC ĐÃ XÓA */}
      <div style={{ marginTop: 32 }}>


        <Card>
          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 16,
            color: '#cf1322'
          }}>
            Danh mục đã xóa
          </h2>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button
              icon={<SyncOutlined />}
              onClick={() => {
                const springBootPage = deletedPagination.current - 1;
                fetchDeletedCategories(springBootPage, deletedPagination.pageSize);
              }}
              loading={deletedLoading}
            >
              Làm mới
            </Button>
          </div>

          <Table
            columns={deletedColumns}
            dataSource={deletedCategories}
            rowKey="id"
            loading={deletedLoading}
            pagination={{
              current: deletedPagination.current,
              pageSize: deletedPagination.pageSize,
              total: deletedPagination.total,
              onChange: (page, pageSize) => {
                const springBootPage = page - 1;
                setDeletedPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize
                }));
                fetchDeletedCategories(springBootPage, pageSize);
              },
              onShowSizeChange: (current, size) => {
                fetchDeletedCategories(0, size);
                setDeletedPagination(prev => ({
                  ...prev,
                  current: 1,
                  pageSize: size
                }));
              },
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} danh mục đã xóa`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
        </Card>
      </div>

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục' },
              { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Tên danh mục không được quá 50 ký tự' },
            ]}
          >
            <Input
              placeholder="Nhập tên danh mục (ví dụ: Samsung, iPhone, Oppo...)"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingCategory(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                {editingCategory ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
