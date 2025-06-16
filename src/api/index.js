import axios from 'axios';

// Thay đổi base URL này theo API server của bạn
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api/v1';

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment Variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để log requests
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📤 Full URL:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('📊 Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    if (error.response) {
      console.error('❌ Error Status:', error.response.status);
      console.error('❌ Error Data:', error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error - No response received:', error.request);
      console.error('❌ Check if backend server is running on:', API_BASE_URL);
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Category API
export const categoryAPI = {
  create: async (data) => {
    try {
      console.log('📝 Creating category:', data);
      return await api.post('/categories/create', data);
    } catch (error) {
      console.error('❌ Failed to create category:', error);
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      console.log('✏️ Updating category:', id, data);
      return await api.put(`/categories/update/${id}`, data);
    } catch (error) {
      console.error('❌ Failed to update category:', error);
      throw error;
    }
  },
 // API để khôi phục danh mục
  restore: async (id) => {
    try {
      console.log(`🔄 Restoring category ID: ${id}`);
      const response = await api.put(`/categories/restore/${id}`);
      console.log('🔄 Restore response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error restoring category:', error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      console.log('🗑️ Deleting category:', id);
      return await api.delete(`/categories/delete/${id}`);
    } catch (error) {
      console.error('❌ Failed to delete category:', error);
      throw error;
    }
  },
  // Sử dụng endpoint phân trang với query parameters
  getAll: async (page = 0, size = 10) => {
    try {
      console.log('📋 Fetching categories page:', page, 'size:', size);
      // Thay đổi từ /categories/all thành /categories với query params
      return await api.get(`/categories/all-page`, {
        params: { page, size }
      });
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      // Fallback: thử endpoint backup nếu có
      try {
        console.log('🔄 Trying fallback endpoint /categories/list');
        return await api.get(`/categories/list`, {
          params: { page, size }
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    }
  },
  // Endpoint lấy tất cả categories (không phân trang)
  getAllList: async () => {
    try {
      console.log('📋 Fetching all categories list');
      // Thử các endpoint khác nhau
      const endpoints = [
        '/categories/list',
        '/categories/all-list',
        '/categories'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          return await api.get(endpoint);
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error.response?.status);
          continue;
        }
      }

      // Nếu tất cả endpoints đều fail, ném lỗi
      throw new Error('All category list endpoints failed');
    } catch (error) {
      console.error('❌ Failed to fetch categories list:', error);
      throw error;
    }
  },
  // API để lấy danh mục đã xóa mềm với phân trang (giống pattern getAll)
  getDeleted: async (page = 0, size = 10) => {
    try {
      console.log('🗑️ Fetching deleted categories page:', page, 'size:', size);
      // Endpoint chính cho danh mục đã xóa
      return await api.get(`/categories/deleted`, {
        params: { page, size }
      });
    } catch (error) {
      console.error('❌ Failed to fetch deleted categories:', error);
      // Fallback: thử endpoint backup nếu có
      try {
        console.log('🔄 Trying fallback endpoint /categories/deleted');
        return await api.get(`/categories/deleted`, {
          params: { page, size }
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    }
  },
  getById: async (id) => {
    try {
      console.log('🔍 Fetching category by ID:', id);
      return await api.get(`/categories/${id}`);
    } catch (error) {
      console.error('❌ Failed to fetch category:', error);
      throw error;
    }
  }
};

// Phone API
export const phoneAPI = {
  create: async (formData) => {
    try {
      console.log('📱 Creating phone with form data:', formData);
      return await api.post('/phones/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('❌ Failed to create phone:', error);
      throw error;
    }
  },
  update: async (id, formData) => {
    try {
      console.log('📱 Updating phone:', id, formData);
      return await api.put(`/phones/update?id=${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('❌ Failed to update phone:', error);
      throw error;
    }
  },
  restore: async (id, formData) => {
    try {
      console.log('🔄 Restoring phone:', id, formData);
      return await api.put(`/phones/restore/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('❌ Failed to restore phone:', error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      console.log('🗑️ Deleting phone:', id);
      return await api.delete(`/phones/delete/${id}`);
    } catch (error) {
      console.error('❌ Failed to delete phone:', error);
      throw error;
    }
  },
  getById: async (id) => {
    try {
      console.log('🔍 Fetching phone by ID:', id);
      return await api.get(`/phones/${id}`);
    } catch (error) {
      console.error('❌ Failed to fetch phone:', error);
      throw error;
    }
  }, 
  getAll: async (page = 0, size = 10) => {
    try {
      console.log('📱 Fetching phones page:', page, 'size:', size);
      // Thử endpoint với query parameters thay vì /phones/all
      return await api.get(`/phones/all`, {
        params: { page, size }
      });
    } catch (error) {
      console.error('❌ Failed to fetch phones:', error);
      // Fallback: thử endpoint backup
      try {
        console.log('🔄 Trying fallback endpoint /phones/list');
        return await api.get(`/phones/list`, {
          params: { page, size }
        });
      } catch (fallbackError) {
        console.error('❌ Phones fallback also failed:', fallbackError);
        throw error;
      }
    }
  },
   // API để lấy danh mục đã xóa mềm với phân trang (giống pattern getAll)
  getDeleted: async (page = 0, size = 10) => {
    try {
      console.log('🗑️ Fetching deleted phones page:', page, 'size:', size);
      // Endpoint chính cho danh mục đã xóa
      return await api.get(`/phones/deleted`, {
        params: { page, size }
      });
    } catch (error) {
      console.error('❌ Failed to fetch deleted phones:', error);
      // Fallback: thử endpoint backup nếu có
      try {
        console.log('🔄 Trying fallback endpoint /phones/deleted');
        return await api.get(`/phones/deleted`, {
          params: { page, size }
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    }
  },
};

// Test API connection
export const testAPIConnection = async () => {
  try {
    console.log('🧪 Testing API connection to:', API_BASE_URL);

    // Thử các endpoint khác nhau để tìm endpoint đúng
    const testEndpoints = [
      '/categories/list',
      '/categories',
      '/categories/all-list'
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${API_BASE_URL}${endpoint}`);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log(`🧪 Test response status for ${endpoint}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`🧪 Raw API response from ${endpoint}:`, data);

          // Kiểm tra cấu trúc response: { code: 1000, result: {...} }
          if (data && data.code === 1000) {
            console.log(`✅ API Connection successful! Working endpoint: ${endpoint}`);
            return {
              success: true,
              data,
              endpoint,
              message: `Working endpoint found: ${endpoint}`
            };
          } else {
            console.log(`⚠️ Endpoint ${endpoint} responded but structure is different:`, data);
            continue;
          }
        } else {
          console.log(`❌ Endpoint ${endpoint} returned error status:`, response.status);
          continue;
        }
      } catch (endpointError) {
        console.log(`❌ Endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }

    // Nếu tất cả endpoints đều fail
    return {
      success: false,
      error: 'All test endpoints failed. Please check backend routing.'
    };

  } catch (error) {
    console.error('❌ API Connection test failed completely:', error);
    return { success: false, error: error.message };
  }
};

// Helper function để tạo FormData cho phone
export const createPhoneFormData = (phoneData, avatarFile, galleryFiles) => {
  const formData = new FormData();

  // Thêm dữ liệu text
  Object.keys(phoneData).forEach(key => {
    if (phoneData[key] !== null && phoneData[key] !== undefined) {
      formData.append(key, phoneData[key]);
    }
  });

  // Thêm avatar file
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  // Thêm gallery files
  if (galleryFiles && galleryFiles.length > 0) {
    galleryFiles.forEach(file => {
      formData.append('files', file);
    });
  }

  return formData;
};

// Function để tạo đường dẫn ảnh đầy đủ
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already full URL

  const imageBaseUrl = process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:9999/uploads';
  return `${imageBaseUrl}/${imagePath}`;
};

// Function để xử lý data phones từ API
export const processPhoneData = (phone) => {
  if (!phone) return phone;

  return {
    ...phone,
    avatarUrl: getImageUrl(phone.avatarUrl),
    imageUrls: Array.isArray(phone.imageUrls)
      ? phone.imageUrls.map(img => getImageUrl(img))
      : []
  };
};

export default api;
