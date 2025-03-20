const BASE_URL = 'https://sigorta-acentesi-uygulamasi.onrender.com';

const api = {
  fetch: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Token gönderiliyor:', token);
      console.log('Headers:', headers);
    }

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    console.log('İstek yapılan URL:', fullUrl);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.log('401 Hatası alındı');
      console.log('Response:', await response.text());
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
      return;
    }

    return response;
  }
};

export default api; 