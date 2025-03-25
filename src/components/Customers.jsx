import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css'; // Stil dosyasını içe aktaralım

function Customers({ userRole }) {
  console.log("userRole Customers.jsx", userRole);
  console.log('Gelen userRole değeri:', userRole);
  console.log('userRole tipi:', typeof userRole);

  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    birth_date: '',
    identity_number: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    email: true,
    phone: true,
    city: true,
    identity: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Müşteriler getirilemedi.');
        return;
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Customers fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      birth_date: '',
      identity_number: ''
    });
    setEditingCustomer(null);
  };

  const validateForm = () => {
    const errors = {};
    
    // E-posta doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Telefon doğrulama
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (10 haneli)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const url = editingCustomer 
      ? `/api/v1/customers/${editingCustomer.id}` 
      : '/api/v1/customers';
    
    // Form verilerini kopyala ve boş doğum tarihini kontrol et
    const submissionData = { ...formData };
    if (!submissionData.birth_date.trim()) {
      delete submissionData.birth_date;
    }
    
    try {
      const response = await fetch(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Hata mesajını göster ama modalı kapatma
        setError(errorData.message || 'İşlem başarısız oldu.');
        // Toast bildirimini göster
        showToast('error', errorData.message || 'İşlem başarısız oldu.');
        return;
      }

      // Başarılı durumda modalı kapat ve başarı mesajını göster
      await fetchCustomers();
      setIsModalOpen(false);
      resetForm();
      showToast('success', editingCustomer ? 'Müşteri başarıyla güncellendi.' : 'Müşteri başarıyla eklendi.');
    } catch (error) {
      // Hata durumunda modalı kapatma ve hata mesajını göster
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      birth_date: customer.birth_date || '',
      identity_number: customer.identity_number || ''
    });
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Müşteri silinemedi.');
        showToast('error', errorData.message || 'Müşteri silinemedi.');
        return;
      }

      await fetchCustomers();
      showToast('success', 'Müşteri başarıyla silindi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Customer delete error:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchValue = searchTerm.toLowerCase();
    const matchConditions = [];
    
    if (searchFilters.name) {
      matchConditions.push(
        customer.first_name.toLowerCase().includes(searchValue) ||
        customer.last_name.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.email) {
      matchConditions.push(customer.email.toLowerCase().includes(searchValue));
    }
    if (searchFilters.phone) {
      matchConditions.push(customer.phone.includes(searchValue));
    }
    if (searchFilters.city && customer.city) {
      matchConditions.push(customer.city.toLowerCase().includes(searchValue));
    }
    if (searchFilters.identity && customer.identity_number) {
      matchConditions.push(customer.identity_number.includes(searchValue));
    }
    
    return matchConditions.some(condition => condition);
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key].toLowerCase();
    const bValue = b[sortConfig.key].toLowerCase();
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Toast bildirimi gösterme fonksiyonu
  const showToast = (type, message) => {
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Yükleniyor...</p></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!userRole) {
    console.log('userRole boş geldi');
    return <div className="access-denied">Erişim izniniz yok.</div>;
  }

  if (userRole !== 'admin' && userRole !== 'manager') {
    console.log('userRole eşleşmedi:', userRole);
    return <div className="access-denied">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

  return (
    <div className="container">
      <ToastContainer />
      <div className="header-actions">
        <h2>Müşteriler</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Yeni Müşteri Ekle
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Aramayı Temizle"
            >
              ✕
            </button>
          )}
          <button
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Arama Filtreleri"
          >
            <i className="fas fa-filter"></i>
          </button>
        </div>
        
        {showFilters && (
          <div className="search-filters">
            <label>
              <input
                type="checkbox"
                checked={searchFilters.name}
                onChange={(e) => setSearchFilters({...searchFilters, name: e.target.checked})}
              />
              Ad Soyad
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.email}
                onChange={(e) => setSearchFilters({...searchFilters, email: e.target.checked})}
              />
              E-posta
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.phone}
                onChange={(e) => setSearchFilters({...searchFilters, phone: e.target.checked})}
              />
              Telefon
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.city}
                onChange={(e) => setSearchFilters({...searchFilters, city: e.target.checked})}
              />
              Şehir
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.identity}
                onChange={(e) => setSearchFilters({...searchFilters, identity: e.target.checked})}
              />
              TC Kimlik No
            </label>
          </div>
        )}
        
        {searchTerm && (
          <div className="search-results-info">
            {filteredCustomers.length} sonuç bulundu
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="first_name">Ad</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Soyad</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-posta</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="phone">Telefon</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="address">Adres</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="city">Şehir</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="postal_code">Posta Kodu</label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="birth_date">Doğum Tarihi</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="identity_number">TC Kimlik No</label>
            <input
              type="text"
              id="identity_number"
              name="identity_number"
              value={formData.identity_number}
              onChange={handleInputChange}
              maxLength="11"
              pattern="[0-9]{11}"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingCustomer ? 'Güncelle' : 'Ekle'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>

      {filteredCustomers.length === 0 ? (
        <p>Henüz müşteri kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('first_name')} className="sortable">
                  Ad {sortConfig.key === 'first_name' && (
                    <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => requestSort('last_name')} className="sortable">
                  Soyad {sortConfig.key === 'last_name' && (
                    <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Şehir</th>
                <th>TC Kimlik No</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.first_name}</td>
                  <td>{customer.last_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.city}</td>
                  <td>{customer.identity_number}</td>
                  <td className="actions">
                    <button 
                      className="btn btn-edit" 
                      onClick={() => handleEdit(customer)}
                    >
                      Düzenle
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDelete(customer.id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        {Array.from({ length: Math.ceil(sortedCustomers.length / itemsPerPage) }).map((_, index) => (
          <button
            key={index}
            onClick={() => paginate(index + 1)}
            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Customers;
