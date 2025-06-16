import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Tag,
  Image,
  Spin,
  Divider,
  Switch,
  Typography,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined, // Thêm icon này
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { phoneAPI, categoryAPI, getImageUrl, processPhoneData } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const PhoneManagement = () => {
  const [phones, setPhones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false); const [modalVisible, setModalVisible] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingPhone, setViewingPhone] = useState(null);
  const [imageGalleryVisible, setImageGalleryVisible] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [galleryFileList, setGalleryFileList] = useState([]);
  // States cho bảng điện thoại đã xóa
  const [deletedPhones, setDeletedPhones] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedPagination, setDeletedPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [restoringId, setRestoringId] = useState(null);

  // State để toggle hiển thị bảng
  const [showDeletedTable, setShowDeletedTable] = useState(false);
  // Debug logging
  console.log('🔍 PhoneManagement render - categories:', categories, 'type:', typeof categories, 'isArray:', Array.isArray(categories));
  console.log('🔍 PhoneManagement render - imageGalleryVisible:', imageGalleryVisible);
  console.log('🔍 PhoneManagement render - selectedPhone:', selectedPhone);
  console.log('🔍 PhoneManagement render - phones count:', phones.length);

  useEffect(() => {
    fetchPhones();
    fetchCategories();
  }, [pagination.current, pagination.pageSize]);


  useEffect(() => {
    if (showDeletedTable) {
      fetchDeletedPhones(0, 10);
    }
  }, [showDeletedTable]);
  const fetchPhones = async () => {
    try {
      setLoading(true);
      console.log('📱 Fetching phones...');

      const response = await phoneAPI.getAll(
        pagination.current - 1,
        pagination.pageSize
      );

      console.log('📱 Phones response:', response);

      // Xử lý cấu trúc response: { code, result: { content, totalElements, ... } }
      let phonesData = [];
      let totalElements = 0;

      if (response && response.data) {
        if (response.data.code === 1000 && response.data.result) {
          // API trả về { code: 1000, result: { content: [...], totalElements: ... } }
          const { content, totalElements: total } = response.data.result;
          if (Array.isArray(content)) {
            phonesData = content;
            totalElements = total || 0;
          }
        } else if (Array.isArray(response.data)) {
          // Fallback: API trả về array trực tiếp
          phonesData = response.data;
          totalElements = response.data.length;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // Fallback: API trả về { content: [...], totalElements: ... }
          phonesData = response.data.content;
          totalElements = response.data.totalElements || 0;
        } else {
          console.warn('⚠️ Phones data structure not recognized:', response.data);
          phonesData = [];
          totalElements = 0;
        }
      }
      console.log('📱 Raw phones data:', phonesData);

      // Xử lý đường dẫn ảnh cho từng phone
      const processedPhones = phonesData.map(processPhoneData);
      console.log('📱 Processed phones with full image URLs:', processedPhones);

      setPhones(processedPhones);
      setPagination(prev => ({
        ...prev,
        total: totalElements,
      }));
    } catch (error) {
      console.error('❌ Error fetching phones:', error);
      message.error(`Không thể tải danh sách điện thoại: ${error.message}`);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  }; const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories for phone management...');
      const response = await categoryAPI.getAllList();
      console.log('📂 Categories response:', response);

      // Xử lý cấu trúc response: { code, result: { content, ... } } hoặc { data: [...] }
      let categoriesData = [];
      if (response && response.data) {
        if (response.data.code === 1000 && response.data.result) {
          // API trả về { code: 1000, result: { content: [...] } }
          if (Array.isArray(response.data.result.content)) {
            categoriesData = response.data.result.content;
          } else if (Array.isArray(response.data.result)) {
            categoriesData = response.data.result;
          }
        } else if (Array.isArray(response.data)) {
          // Fallback: API trả về array trực tiếp
          categoriesData = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // Fallback: API trả về { content: [...] }
          categoriesData = response.data.content;
        } else {
          console.warn('⚠️ Categories data structure not recognized:', response.data);
          categoriesData = [];
        }
      } console.log('📂 Processed categories data:', categoriesData);

      // Đảm bảo luôn set array, ngay cả khi empty
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        return categoriesData; // Return data for use in other functions
      } else {
        console.error('❌ Categories data is not an array, setting empty array');
        setCategories([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      // Luôn set empty array để tránh undefined/null
      setCategories([]);
      message.warning('Không thể tải danh sách danh mục');
      return [];
    }
  };

  // Function để fetch điện thoại đã xóa
  const fetchDeletedPhones = async (page = 0, size = 10) => {
    try {
      setDeletedLoading(true);
      console.log(`🗑️ Fetching deleted phones - Page: ${page}, Size: ${size}`);

      const response = await phoneAPI.getDeleted(page, size);
      console.log('🗑️ Deleted phones response:', response);

      // Xử lý response thành công
      if (response?.data && response.data.code === 1000) {
        const result = response.data.result || {};
        const deletedData = result.content || [];
        const totalElements = result.totalElements || 0;

        // Xử lý đường dẫn ảnh cho từng phone
        const processedPhones = deletedData.map(processPhoneData);

        setDeletedPhones(processedPhones);
        setDeletedPagination(prev => ({
          ...prev,
          current: page + 1,
          pageSize: size,
          total: totalElements
        }));
        console.log('✅ Successfully loaded deleted phones');
      }
      // Xử lý trường hợp không tìm thấy data (code 1005)
      else if (response?.data && response.data.code === 1005) {
        console.log('⚠️ No phones found on this page, trying page 0...');

        if (page > 0) {
          try {
            const fallbackResponse = await phoneAPI.getDeleted(0, size);
            if (fallbackResponse?.data && fallbackResponse.data.code === 1000) {
              const result = fallbackResponse.data.result || {};
              const deletedData = result.content || [];
              const totalElements = result.totalElements || 0;
              const processedPhones = deletedData.map(processPhoneData);

              setDeletedPhones(processedPhones);
              setDeletedPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size,
                total: totalElements
              }));
            } else {
              setDeletedPhones([]);
              setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
            }
          } catch (fallbackError) {
            setDeletedPhones([]);
            setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
          }
        } else {
          setDeletedPhones([]);
          setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
      } else {
        setDeletedPhones([]);
        setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
      }
    } catch (error) {
      console.error('❌ Error fetching deleted phones:', error);

      if (error.response?.status >= 500 || !error.response) {
        message.error(`Lỗi kết nối: ${error.response?.data?.message || error.message}`);
      } else if ((error.response?.status === 404 || error.response?.data?.code === 1005) && page > 0) {
        try {
          const fallbackResponse = await phoneAPI.getDeleted(0, size);
          if (fallbackResponse?.data && fallbackResponse.data.code === 1000) {
            const result = fallbackResponse.data.result || {};
            const deletedData = result.content || [];
            const processedPhones = deletedData.map(processPhoneData);

            setDeletedPhones(processedPhones);
            setDeletedPagination(prev => ({ ...prev, current: 1, total: deletedData.length }));
          } else {
            setDeletedPhones([]);
            setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
          }
        } catch (fallbackError) {
          setDeletedPhones([]);
          setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
      } else {
        setDeletedPhones([]);
        setDeletedPagination(prev => ({ ...prev, current: 1, total: 0 }));
      }
    } finally {
      setDeletedLoading(false);
    }
  };

  // Function để khôi phục điện thoại
  const handleRestore = async (id) => {

    Modal.confirm({
      title: 'Xác nhận khôi phục',
      content: 'Bạn có chắc chắn muốn khôi phục danh mục này?',
      okText: 'Khôi phục',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setRestoringId(id);
          console.log('🔄 Restoring phone:', id);

          await phoneAPI.restore(id);
          message.success('Khôi phục điện thoại thành công');

          // Refresh bảng điện thoại hiện tại
          fetchPhones();

          // Refresh bảng điện thoại đã xóa
          fetchDeletedPhones(0, deletedPagination.pageSize);

        } catch (error) {
          console.error('❌ Error restoring phone:', error);
          message.error(`Không thể khôi phục điện thoại: ${error.response?.data?.message || error.message}`);
        } finally {
          setRestoringId(null);
        }
      },
    });
  };

  // Helper function để extract filename từ URL
  const extractFilenameFromUrl = (url) => {
    if (!url) return null;
    console.log('🔍 Extracting filename from URL:', url);

    // Extract filename from URL: "http://localhost:9999/uploads/uuid_originalname.jpeg" -> "originalname.jpeg"
    const parts = url.split('/');
    const fullFilename = parts[parts.length - 1];
    console.log('🔍 Full filename:', fullFilename);

    // Check if filename has UUID pattern: "uuid_originalname.ext"
    // UUID pattern: 8-4-4-4-12 characters separated by hyphens
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i;
    const match = fullFilename.match(uuidPattern);

    if (match) {
      // Extract original filename after UUID_
      const originalFilename = match[1];
      console.log('🔍 Extracted original filename:', originalFilename);
      return originalFilename;
    } else {
      // No UUID pattern, return full filename
      console.log('🔍 No UUID pattern, returning full filename:', fullFilename);
      return fullFilename;
    }
  };

  const handleSubmit = async (values) => {
    console.log('📝 Form submitted with values:', values);

    if (!values.categoryId) {
      message.error('Vui lòng chọn danh mục');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting form submission process...');

      const formData = new FormData();

      // Append basic form fields
      formData.append('name', values.name);
      formData.append('categoryId', Number(values.categoryId));
      formData.append('model', values.model || '');
      formData.append('os', values.os || '');
      formData.append('color', values.color || '');
      formData.append('ram', Number(values.ram));
      formData.append('rom', Number(values.rom));
      formData.append('screen', values.screen || '');
      formData.append('camera', values.camera || '');
      formData.append('priceImport', Number(values.priceImport));
      formData.append('priceSale', Number(values.priceSale));
      formData.append('quantityInStock', Number(values.quantityInStock));
      formData.append('description', values.description || '');
      formData.append('status', Boolean(values.status));
      // Handle avatar
      if (avatarFileList.length > 0) {
        const avatarFile = avatarFileList[0];
        console.log('📷 Processing avatar:', avatarFile);

        if (avatarFile.originFileObj) {
          // New avatar file - gửi file object
          formData.append('avatar', avatarFile.originFileObj);
          console.log('📷 ✅ Appending new avatar file:', avatarFile.originFileObj.name);
        } else if (avatarFile.url) {
          // Existing avatar - download và tạo File object với tên mới
          try {
            console.log('📷 🔄 Converting existing avatar from URL:', avatarFile.url);

            // Extract tên file mới
            const newFilename = extractFilenameFromUrl(avatarFile.url);
            console.log('📷 📝 New avatar filename will be:', newFilename);

            // Download file từ URL
            const response = await fetch(avatarFile.url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            console.log('📷 📥 Downloaded avatar blob:', blob.size, 'bytes, type:', blob.type);

            // Tạo File object với tên mới
            const newAvatarFile = new File([blob], newFilename, {
              type: blob.type || 'image/jpeg',
              lastModified: Date.now()
            });

            formData.append('avatar', newAvatarFile);
            console.log('📷 ✅ Converted existing avatar to:', newAvatarFile.name, newAvatarFile.size, 'bytes');

          } catch (error) {
            console.error('📷 ❌ Failed to convert existing avatar:', error);
            // Skip avatar if conversion fails
          }
        }
      }// Handle gallery files
      console.log('📷 Processing gallery files. Total files in list:', galleryFileList.length);
      console.log('📷 Gallery file list:', galleryFileList);

      const allGalleryFiles = [];

      for (let i = 0; i < galleryFileList.length; i++) {
        const file = galleryFileList[i];
        console.log(`📷 Processing file ${i + 1}:`, file);

        if (file.originFileObj) {
          // New file - gửi file gốc
          allGalleryFiles.push(file.originFileObj);
          console.log(`📷 ✅ New gallery file ${i + 1}:`, file.originFileObj.name);
        } else if (file.url) {
          // Existing file - download và tạo File object với tên mới
          try {
            console.log(`📷 🔄 Converting existing file ${i + 1} from URL:`, file.url);

            // Extract tên file mới
            const newFilename = extractFilenameFromUrl(file.url);
            console.log(`📷 📝 New filename will be:`, newFilename);

            // Download file từ URL
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            console.log(`📷 📥 Downloaded blob:`, blob.size, 'bytes, type:', blob.type);

            // Tạo File object với tên mới
            const newFile = new File([blob], newFilename, {
              type: blob.type || 'image/jpeg',
              lastModified: Date.now()
            });

            allGalleryFiles.push(newFile);
            console.log(`📷 ✅ Converted existing file ${i + 1} to:`, newFile.name, newFile.size, 'bytes');

          } catch (error) {
            console.error(`📷 ❌ Failed to convert existing file ${i + 1}:`, error);
            // Skip this file if conversion fails
          }
        } else {
          console.log(`📷 ❌ File ${i + 1} has no originFileObj or url:`, file);
        }
      }

      console.log('📷 Summary - Total gallery files to upload:', allGalleryFiles.length);

      // Append all gallery files
      if (allGalleryFiles.length > 0) {
        allGalleryFiles.forEach((file, index) => {
          formData.append('files', file);
          console.log(`📷 ✅ Appending gallery file ${index + 1}:`, file.name, `(${file.size} bytes)`);
        });
      }

      // Debug FormData
      console.log('📝 FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      if (editingPhone) {
        await phoneAPI.update(editingPhone.id, formData);
        message.success('Cập nhật điện thoại thành công');
      } else {
        await phoneAPI.create(formData);
        message.success('Thêm điện thoại thành công');
      }

      handleCloseModal();
      fetchPhones();

    } catch (error) {
      console.error('❌ Error submitting phone:', error);
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa danh mục này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await phoneAPI.delete(id);
          message.success('Xóa điện thoại thành công');

          // Refresh bảng điện thoại hiện tại
          fetchPhones();

          // Refresh bảng điện thoại đã xóa nếu đang hiển thị
          if (showDeletedTable) {
            fetchDeletedPhones(0, deletedPagination.pageSize);
          }

        } catch (error) {
          message.error('Xóa điện thoại thất bại');
          console.error('Error deleting phone:', error);
        }
      },

    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingPhone(null);
    form.resetFields();
    setAvatarFileList([]);
    setGalleryFileList([]);
  };
  // Helper function để tìm categoryId từ categoryName
  const findCategoryIdByName = async (categoryName) => {
    try {
      console.log('🔍 Finding categoryId for:', categoryName);

      // Nếu categories đã được load
      if (Array.isArray(categories) && categories.length > 0) {
        const category = categories.find(cat => cat.name === categoryName);
        console.log('🔍 Found in existing categories:', category);
        return category ? category.id : null;
      }

      // Nếu categories chưa được load, gọi API để lấy
      console.log('📂 Categories not loaded, fetching to find categoryId...');
      const categoriesData = await fetchCategories();

      // Tìm trong data vừa fetch
      if (Array.isArray(categoriesData)) {
        const category = categoriesData.find(cat => cat.name === categoryName);
        console.log('🔍 Found in fetched categories:', category);
        return category ? category.id : null;
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding categoryId:', error);
      return null;
    }
  };

  const openModal = async (phone = null) => {
    setEditingPhone(phone);
    setModalVisible(true);

    if (phone) {
      console.log('✏️ Opening edit modal for phone:', phone);

      try {
        setLoading(true);

        // Gọi API để lấy chi tiết đầy đủ (bao gồm categoryId)
        const response = await phoneAPI.getById(phone.id);
        console.log('✏️ Phone details for edit:', response);

        if (response?.data && response.data.code === 200) {
          const phoneDetails = response.data.result;
          console.log('✏️ Full phone details:', phoneDetails);
          // Tìm categoryId từ categoryName
          const categoryId = await findCategoryIdByName(phoneDetails.categoryName);
          console.log('✏️ Found categoryId:', categoryId, 'for categoryName:', phoneDetails.categoryName);

          // Set form values với categoryId
          form.setFieldsValue({
            name: phoneDetails.name,
            categoryId: categoryId, // Sử dụng categoryId thay vì categoryName
            model: phoneDetails.model,
            os: phoneDetails.os,
            color: phoneDetails.color,
            ram: phoneDetails.ram,
            rom: phoneDetails.rom,
            screen: phoneDetails.screen,
            camera: phoneDetails.camera,
            priceImport: phoneDetails.priceImport,
            priceSale: phoneDetails.priceSale,
            quantityInStock: phoneDetails.quantityInStock,
            description: phoneDetails.description,
            status: phoneDetails.status || false,
          }); console.log('✏️ Form values set:', form.getFieldsValue());

          // Reset file lists để chỉ cho phép upload ảnh mới
          setAvatarFileList([]);
          setGalleryFileList([]);
          console.log('✏️ File lists reset - only new images can be uploaded');

        } else {
          console.error('❌ Invalid response for edit:', response);
          message.error('Không thể tải thông tin chi tiết để chỉnh sửa');
        }
      } catch (error) {
        console.error('❌ Error loading phone for edit:', error);
        message.error(`Không thể tải thông tin: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Adding new phone
      console.log('📝 Opening add new phone modal');
      form.resetFields();
      setAvatarFileList([]);
      setGalleryFileList([]);
    }
  };
  const openViewModal = async (phone) => {
    try {
      setLoading(true);
      console.log('👁️ Viewing phone details for ID:', phone.id);

      // Gọi API để lấy chi tiết đầy đủ  
      const response = await phoneAPI.getById(phone.id);
      console.log('👁️ Phone details response:', response);

      if (response?.data && response.data.code === 200) {
        const phoneDetails = response.data.result;
        console.log('👁️ Phone details data:', phoneDetails);

        // Xử lý đường dẫn ảnh
        const processedPhone = processPhoneData(phoneDetails);
        console.log('👁️ Processed phone details:', processedPhone);

        setViewingPhone(processedPhone);
        setViewModalVisible(true);
      } else {
        console.error('❌ Invalid response structure:', response);
        message.error('Không thể tải thông tin chi tiết điện thoại');
      }
    } catch (error) {
      console.error('❌ Error viewing phone:', error);
      message.error(`Không thể xem chi tiết: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    showUploadList: true,
  };

  const columns = [{
    title: 'Ảnh',
    dataIndex: 'avatarUrl',
    key: 'avatarUrl',
    width: 80,
    render: (avatarUrl, record) => (
      <Image
        width={50}
        height={50}
        src={avatarUrl || '/api/placeholder/50/50'}
        style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
        fallback="/api/placeholder/50/50"
        preview={{
          mask: <EyeOutlined />
        }}
      />
    ),
  },
  {
    title: 'Tên điện thoại',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <strong>{text}</strong>,
  },
  {
    title: 'Model',
    dataIndex: 'model',
    key: 'model',
  },
  {
    title: 'Danh mục',
    dataIndex: 'categoryName',    // Đổi từ 'categoryId' thành 'categoryName'
    key: 'categoryName',          // Đổi key cho đúng
    render: (categoryName) => (   // Parameter nhận categoryName (string)
      <Tag color="blue">
        {categoryName || 'Chưa phân loại'}
      </Tag>
    ),
  },
  {
    title: 'Giá nhập',
    dataIndex: 'priceImport',
    key: 'priceImport',
    render: (price) => `${(price || 0).toLocaleString('vi-VN')} ₫`,
  },
  {
    title: 'Giá bán',
    dataIndex: 'priceSale',
    key: 'priceSale',
    render: (price) => (
      <span className="price-tag">
        {(price || 0).toLocaleString('vi-VN')} ₫
      </span>
    ),
  },
  {
    title: 'Tồn kho',
    dataIndex: 'quantityInStock',
    key: 'quantityInStock',
    render: (quantity) => (
      <Tag color={quantity > 20 ? 'green' : quantity > 10 ? 'orange' : 'red'}>
        {quantity}
      </Tag>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status ? 'green' : 'red'}>
        {status ? 'Hoạt động' : 'Ngừng bán'}
      </Tag>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button
          type="default"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => openViewModal(record)}
        >
          Xem
        </Button>
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
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewImages(record)}
          title="Xem tất cả ảnh"
        >
          Ảnh
        </Button>
      </Space>
    ),
  },
  ];

  // Columns cho bảng điện thoại đã xóa
  const deletedColumns = [
    {
      title: 'Ảnh',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 80,
      render: (avatarUrl) => (
        <Image
          width={50}
          height={50}
          src={avatarUrl || '/api/placeholder/50/50'}
          style={{ objectFit: 'cover', borderRadius: 4, opacity: 0.6 }}
          fallback="/api/placeholder/50/50"
          preview={{
            mask: <EyeOutlined />
          }}
        />
      ),
    },
    {
      title: 'Tên điện thoại',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <span style={{ color: '#999', textDecoration: 'line-through' }}>
          <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (text) => (
        <span style={{ color: '#999' }}>{text}</span>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (categoryName) => (
        <Tag color="default" style={{ opacity: 0.6 }}>
          {categoryName || 'Chưa phân loại'}
        </Tag>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'priceSale',
      key: 'priceSale',
      render: (price) => (
        <span style={{ color: '#999' }}>
          {(price || 0).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantityInStock',
      key: 'quantityInStock',
      render: (quantity) => (
        <Tag color="default" style={{ opacity: 0.6 }}>
          {quantity}
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
            icon={<UndoOutlined />}
            size="small"
            loading={restoringId === record.id}
            onClick={() => handleRestore(record.id)}
          >
            Khôi phục
          </Button>
          {/* <Button
            type="default"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openViewModal(record)}
            disabled={restoringId === record.id}
          >
            Xem
          </Button> */}
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewImages(record)}
            disabled={restoringId === record.id}
            title="Xem tất cả ảnh"
          >
            Ảnh
          </Button>
        </Space>
      ),
    },
  ];

  // Function để xem gallery ảnh
  const handleViewImages = (phone) => {
    console.log('🖼️ Opening gallery for phone:', phone);
    console.log('🖼️ Avatar URL:', phone.avatarUrl);
    console.log('🖼️ Image URLs:', phone.imageUrls);
    setSelectedPhone(phone);
    setImageGalleryVisible(true);
  };

  // Safe guard - nếu categories không phải array, render loading
  if (!Array.isArray(categories)) {
    console.error('❌ Categories is not an array:', categories, typeof categories);
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải danh mục...</div>
        <div style={{ marginTop: 8, color: '#999' }}>
          Categories type: {typeof categories}
        </div>
      </div>
    );
  }


  return (
    <div>
      <Card className="dashboard-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
              Quản lý điện thoại
            </h1>
          </Col>
          <Col>
            <Space>
              {/* Toggle buttons */}
              <Button
                type={!showDeletedTable ? "primary" : "default"}
                onClick={() => setShowDeletedTable(false)}
                style={{
                  backgroundColor: !showDeletedTable ? '#1890ff' : undefined,
                  borderColor: !showDeletedTable ? '#1890ff' : undefined
                }}
              >
                Điện thoại đang bán
              </Button>
              <Button
                type={showDeletedTable ? "primary" : "default"}
                danger={showDeletedTable}
                onClick={() => setShowDeletedTable(true)}
                style={{
                  backgroundColor: showDeletedTable ? '#ff4d4f' : undefined,
                  borderColor: showDeletedTable ? '#ff4d4f' : undefined
                }}
              >
                Điện thoại đã xóa ({deletedPagination.total})
              </Button>

              {/* Chỉ hiển thị nút thêm khi ở bảng điện thoại đang bán */}
              {!showDeletedTable && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openModal()}
                  size="large"
                >
                  Thêm điện thoại
                </Button>
              )}

              {/* Nút test - chỉ hiển thị khi đang develop */}
              {!showDeletedTable && process.env.NODE_ENV === 'development' && (
                <>
                  {/* <Button
                    onClick={() => {
                      console.log('🧪 Test Gallery Modal');
                      console.log('🧪 Phones data:', phones);
                      if (phones.length > 0) {
                        handleViewImages(phones[0]);
                      } else {
                        console.log('❌ No phones data for testing');
                      }
                    }}
                  >
                    🧪 Test Gallery
                  </Button> */}
                  {/* <Button
                    onClick={() => {
                      console.log('🧪 Testing filename extraction...');
                      const testUrls = [
                        'http://localhost:9999/uploads/d3b497c2-5e32-4e06-8232-b581009d7935_ip15_3.jpeg',
                        'http://localhost:9999/uploads/b40bf322-052e-4637-896f-5d959f073c3d_ip15_4.jpeg',
                        'http://localhost:9999/uploads/c94d1204-14f3-4f11-ac91-1cb78fec5092_ipda15_2.jpeg'
                      ];

                      testUrls.forEach(url => {
                        const extracted = extractFilenameFromUrl(url);
                        console.log(`📁 ${url} -> ${extracted}`);
                      });

                      console.log('🧪 Gallery file list:', galleryFileList);
                    }}
                  >
                    🧪 Test Extract
                  </Button> */}
                </>
              )}
            </Space>
          </Col>
        </Row>

        {/* Bảng điện thoại đang bán */}
        {!showDeletedTable && (
          <Table
            dataSource={phones}
            columns={columns}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} điện thoại`,
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
            scroll={{ x: 1200 }}
          />
        )}

        {/* Bảng điện thoại đã xóa */}
        {showDeletedTable && (
          <div>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button
                icon={<UndoOutlined />}
                onClick={() => {
                  fetchDeletedPhones(0, deletedPagination.pageSize);
                }}
                loading={deletedLoading}
              >
                Làm mới
              </Button>
            </div>

            <Table
              dataSource={deletedPhones}
              columns={deletedColumns}
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
                  fetchDeletedPhones(springBootPage, pageSize);
                },
                onShowSizeChange: (current, size) => {
                  fetchDeletedPhones(0, size);
                  setDeletedPagination(prev => ({
                    ...prev,
                    current: 1,
                    pageSize: size
                  }));
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} điện thoại đã xóa`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              rowKey="id"
              bordered
              scroll={{ x: 1200 }}
            />
          </div>
        )}
      </Card>

      {/* Tất cả các Modal giữ nguyên không thay đổi */}

      {/* Add/Edit Modal */}
      <Modal
        title={editingPhone ? 'Sửa điện thoại' : 'Thêm điện thoại mới'}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        style={{ top: 20 }}
        confirmLoading={loading}
      >
        <Spin spinning={loading} tip={loading ? (editingPhone ? "Đang xử lý ảnh và cập nhật..." : "Đang xử lý dữ liệu...") : "Đang tải dữ liệu..."}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onFinishFailed={(errorInfo) => {
              console.log('❌ Form validation failed:', errorInfo);
              console.log('❌ Failed fields:', errorInfo.errorFields);
              message.error('Vui lòng kiểm tra lại thông tin đã nhập');
            }}
            onValuesChange={(changedValues, allValues) => {
              console.log('📝 Form values changed:', changedValues);
              console.log('📝 All form values:', allValues);
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên điện thoại"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên điện thoại' }]}
                >
                  <Input placeholder="iPhone 15 Pro Max" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Danh mục"
                  name="categoryId"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    loading={!Array.isArray(categories) || categories.length === 0}
                    disabled={!Array.isArray(categories) || categories.length === 0}
                    onChange={(value) => {
                      console.log('📂 Selected categoryId:', value, typeof value);
                    }}
                  >
                    {Array.isArray(categories) && categories.length > 0 ? categories.map(category => (
                      <Option key={category.id} value={Number(category.id)}>
                        {category.name}
                      </Option>
                    )) : (
                      <Option disabled value="">
                        Đang tải danh mục...
                      </Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Model"
                  name="model"
                  rules={[{ required: true, message: 'Vui lòng nhập model' }]}
                >
                  <Input placeholder="A3108" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Hệ điều hành"
                  name="os"
                  rules={[{ required: true, message: 'Vui lòng nhập hệ điều hành' }]}
                >
                  <Input placeholder="iOS 17" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Màu sắc"
                  name="color"
                  rules={[{ required: true, message: 'Vui lòng nhập màu sắc' }]}
                >
                  <Input placeholder="Titan tự nhiên" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  label="RAM (GB)"
                  name="ram"
                  rules={[{ required: true, message: 'Vui lòng nhập RAM' }]}
                >
                  <InputNumber min={1} placeholder="8" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="ROM (GB)"
                  name="rom"
                  rules={[{ required: true, message: 'Vui lòng nhập ROM' }]}
                >
                  <InputNumber min={1} placeholder="256" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Màn hình"
                  name="screen"
                  rules={[{ required: true, message: 'Vui lòng nhập thông tin màn hình' }]}
                >
                  <Input placeholder='6.7", 120Hz' />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Camera"
              name="camera"
              rules={[{ required: true, message: 'Vui lòng nhập thông tin camera' }]}
            >
              <Input placeholder="48MP + 12MP + 12MP" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Giá nhập"
                  name="priceImport"
                  rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="28000000"
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Giá bán"
                  name="priceSale"
                  rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="32990000"
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Số lượng tồn kho"
                  name="quantityInStock"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} placeholder="50" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <TextArea rows={3} placeholder="Mô tả chi tiết về sản phẩm..." />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng bán" />
            </Form.Item>

            <Divider>Hình ảnh sản phẩm</Divider>

            <div className="form-upload-section">
              <div className="upload-avatar">
                <Form.Item label="Ảnh đại diện sản phẩm">
                  <Upload
                    {...uploadProps}
                    listType="picture-card"
                    fileList={avatarFileList}
                    onChange={({ fileList }) => setAvatarFileList(fileList)}
                    maxCount={1}
                  >
                    {avatarFileList.length < 1 && (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Tải ảnh đại diện</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </div>

              <div className="upload-gallery">
                <Form.Item label="Các ảnh khác của sản phẩm">
                  <Upload
                    {...uploadProps}
                    listType="picture-card"
                    fileList={galleryFileList}
                    onChange={({ fileList }) => setGalleryFileList(fileList)}
                    multiple
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải ảnh</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
            </div>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={handleCloseModal} disabled={loading}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  disabled={loading}
                >
                  {editingPhone ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* View Details Modal - Giữ nguyên */}
      <Modal
        title="Chi tiết điện thoại"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setViewingPhone(null);
        }}
        footer={[
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            setViewModalVisible(false);
            openModal(viewingPhone);
          }}>
            Chỉnh sửa
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={900}
      >
        {/* Toàn bộ nội dung view modal giữ nguyên */}
        {viewingPhone && (
          <div>
            {/* Header với ảnh và tên */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card
                  cover={
                    <Image
                      src={viewingPhone.avatarUrl}
                      alt="Avatar"
                      style={{ height: 250, objectFit: 'cover' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                    />
                  }
                  size="small"
                >
                  <Card.Meta
                    title={viewingPhone.name}
                    description={
                      <div>
                        <Tag color="blue">{viewingPhone.categoryName}</Tag>
                        <br />
                        <Text type="secondary">Model: {viewingPhone.model}</Text>
                      </div>
                    }
                  />
                </Card>
              </Col>

              <Col span={16}>
                <Card title="Thông tin cơ bản" size="small">
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text strong>Hệ điều hành:</Text>
                      <br />
                      <Text>{viewingPhone.os || 'Chưa cập nhật'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Màu sắc:</Text>
                      <br />
                      <Text>{viewingPhone.color || 'Chưa cập nhật'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>RAM:</Text>
                      <br />
                      <Text>{viewingPhone.ram} GB</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>ROM:</Text>
                      <br />
                      <Text>{viewingPhone.rom} GB</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Màn hình:</Text>
                      <br />
                      <Text>{viewingPhone.screen || 'Chưa cập nhật'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Camera:</Text>
                      <br />
                      <Text>{viewingPhone.camera || 'Chưa cập nhật'}</Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* Thông tin giá và kho */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Giá nhập"
                    value={viewingPhone.priceImport}
                    precision={0}
                    valueStyle={{ color: '#cf1322' }}
                    suffix="VNĐ"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Giá bán"
                    value={viewingPhone.priceSale}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    suffix="VNĐ"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Tồn kho"
                    value={viewingPhone.quantityInStock}
                    suffix="Chiếc"
                    valueStyle={{
                      color: viewingPhone.quantityInStock > 10 ? '#3f8600' : '#faad14'
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Mô tả */}
            <Card title="Mô tả sản phẩm" size="small" style={{ marginBottom: 24 }}>
              <Text>{viewingPhone.description || 'Chưa có mô tả'}</Text>
            </Card>

            {/* Gallery ảnh */}
            <Card title={`Gallery (${viewingPhone.imageUrls?.length || 0} ảnh)`} size="small">
              <Image.PreviewGroup>
                <Row gutter={[16, 16]}>
                  {viewingPhone.imageUrls && viewingPhone.imageUrls.length > 0 ? (
                    viewingPhone.imageUrls.map((imageUrl, index) => (
                      <Col span={6} key={index}>
                        <Image
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                        />
                      </Col>
                    ))
                  ) : (
                    <Col span={24}>
                      <Empty description="Không có ảnh gallery" />
                    </Col>
                  )}
                </Row>
              </Image.PreviewGroup>
            </Card>

            {/* Thông tin hệ thống */}
            <Card title="Thông tin hệ thống" size="small" style={{ marginTop: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Text strong>Trạng thái:</Text>
                  <br />
                  <Tag color={viewingPhone.status ? 'green' : 'red'}>
                    {viewingPhone.status ? 'Đang bán' : 'Ngừng bán'}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text strong>Ngày tạo:</Text>
                  <br />
                  <Text>{new Date(viewingPhone.createdAt).toLocaleString('vi-VN')}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Cập nhật cuối:</Text>
                  <br />
                  <Text>{new Date(viewingPhone.updatedAt).toLocaleString('vi-VN')}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>

      {/* Image Gallery Modal - Giữ nguyên */}
      <Modal
        title={`Gallery - ${selectedPhone?.name || 'Điện thoại'}`}
        open={imageGalleryVisible}
        onCancel={() => {
          console.log('🔒 Closing gallery modal');
          setImageGalleryVisible(false);
          setSelectedPhone(null);
        }}
        footer={null}
        width={800}
        centered
      >
        {selectedPhone && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>Ảnh đại diện:</h4>
              {selectedPhone.avatarUrl ? (
                <Image
                  src={selectedPhone.avatarUrl}
                  alt="Avatar"
                  style={{ marginBottom: 16 }}
                  width={200}
                  fallback="/api/placeholder/200/200"
                />
              ) : (
                <div style={{
                  width: 200,
                  height: 200,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  Không có ảnh đại diện
                </div>
              )}
            </div>

            <div>
              <h4>Gallery ({selectedPhone.imageUrls?.length || 0} ảnh):</h4>
              {selectedPhone.imageUrls && selectedPhone.imageUrls.length > 0 ? (
                <Image.PreviewGroup>
                  <Row gutter={[16, 16]}>
                    {selectedPhone.imageUrls.map((imageUrl, index) => (
                      <Col span={6} key={index}>
                        <Image
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                          fallback="/api/placeholder/150/150"
                        />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                  Không có ảnh gallery
                </div>
              )}
            </div>

            {/* Debug info */}
            {/* <div style={{ marginTop: 16, padding: 8, background: '#f5f5f5', fontSize: 12 }}>
              <strong>Debug:</strong><br />
              Avatar URL: {selectedPhone.avatarUrl || 'Không có'}<br />
              Gallery: {selectedPhone.imageUrls?.length || 0} ảnh
            </div> */}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhoneManagement;
