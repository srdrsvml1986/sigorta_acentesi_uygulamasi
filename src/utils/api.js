const BASE_URL = 'https://sigorta-acentesi-uygulamasi.onrender.com';

const api = {
  fetch: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    console.log('Stored token:', token);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Request headers:', headers);
    } else {
      console.log('No token found in localStorage');
    }

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    console.log('Making request to:', fullUrl);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const responseText = await response.text();
        console.log('401 Hatası detayları:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return;
      }

      return response;
    } catch (error) {
      console.error('API isteği hatası:', error);
      throw error;
    }
  }
};

export default api; 