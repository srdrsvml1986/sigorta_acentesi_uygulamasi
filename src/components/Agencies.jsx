import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

function Agencies({ userRole }) {
  const [agencies, setAgencies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    foundation_year: '',
    employee_count: '',
    website: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    code: true,
    email: true,
    phone: true,
    city: true,
    taxNumber: true
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/agencies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Acenteler getirilemedi.');
        return;
      }

      const data = await response.json();
      setAgencies(data);
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Agencies fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
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
      name: '',
      code: '',
      owner_name: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      foundation_year: '',
      employee_count: '',
      website: '',
      status: 'active'
    });
    setEditingAgency(null);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const url = editingAgency 
      ? `/api/v1/agencies/${editingAgency.id}` 
      : '/api/v1/agencies';
    
    try {
      const response = await fetch(url, {
        method: editingAgency ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
      await fetchAgencies();
      setIsModalOpen(false);
      resetForm();
      showToast('success', editingAgency ? 'Acente başarıyla güncellendi.' : 'Acente başarıyla eklendi.');
    } catch (error) {
      // Hata durumunda modalı kapatma ve hata mesajını göster
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (agency) => {
    setFormData({
      name: agency.name,
      code: agency.code,
      owner_name: agency.owner_name,
      phone: agency.phone,
      email: agency.email,
      address: agency.address || '',
      tax_number: agency.tax_number || '',
      foundation_year: agency.foundation_year || '',
      employee_count: agency.employee_count || '',
      website: agency.website || '',
      status: agency.status || 'active'
    });
    setEditingAgency(agency);
    setIsModalOpen(true);
  };

  const handleDelete = async (agencyId) => {
    if (!window.confirm('Bu acenteyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/agencies/${agencyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Acente silinemedi.');
        showToast('error', errorData.message || 'Acente silinemedi.');
        return;
      }

      await fetchAgencies();
      showToast('success', 'Acente başarıyla silindi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Agency delete error:', error);
    }
  };

  const filteredAgencies = agencies.filter(agency => {
    if (!searchTerm) return true;
    
    const searchValue = searchTerm.toLowerCase();
    const matchConditions = [];
    
    if (searchFilters.name) {
      matchConditions.push(
        agency.name.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.code) {
      matchConditions.push(
        agency.code.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.email) {
      matchConditions.push(agency.email.toLowerCase().includes(searchValue));
    }
    if (searchFilters.phone) {
      matchConditions.push(agency.phone.includes(searchValue));
    }
    if (searchFilters.city && agency.city) {
      matchConditions.push(agency.city.toLowerCase().includes(searchValue));
    }
    if (searchFilters.taxNumber && agency.tax_number) {
      matchConditions.push(agency.tax_number.includes(searchValue));
    }
    
    return matchConditions.some(condition => condition);
  });

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Yükleniyor...</p></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!userRole) {
    return <div className="access-denied">Erişim izniniz yok.</div>;
  }

  if (userRole !== 'admin' && userRole !== 'manager') {
    return <div className="access-denied">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

  return (
    <div className="container">
      <ToastContainer />
      <div className="header-actions">
        <h2>Acenteler</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Yeni Acente Ekle
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Acente ara..."
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
              Acente Adı
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.code}
                onChange={(e) => setSearchFilters({...searchFilters, code: e.target.checked})}
              />
              Acente Kodu
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
                checked={searchFilters.taxNumber}
                onChange={(e) => setSearchFilters({...searchFilters, taxNumber: e.target.checked})}
              />
              Vergi No
            </label>
          </div>
        )}
        
        {searchTerm && (
          <div className="search-results-info">
            {filteredAgencies.length} sonuç bulundu
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingAgency ? 'Acente Düzenle' : 'Yeni Acente Ekle'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Acente Adı</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="code">Acente Kodu</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="owner_name">Acente Sahibi</label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                required
              />
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
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          <div className="form-row">
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
            </div>
            <div className="form-group">
              <label htmlFor="website">Web Sitesi</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Adres</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tax_number">Vergi Numarası</label>
              <input
                type="text"
                id="tax_number"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="foundation_year">Kuruluş Yılı</label>
              <input
                type="number"
                id="foundation_year"
                name="foundation_year"
                value={formData.foundation_year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employee_count">Çalışan Sayısı</label>
              <input
                type="number"
                id="employee_count"
                name="employee_count"
                value={formData.employee_count}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Durum</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
                <option value="suspended">Askıya Alınmış</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingAgency ? 'Güncelle' : 'Ekle'}
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

      {agencies.length === 0 ? (
        <p>Henüz acente kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Acente Adı</th>
                <th>Kod</th>
                <th>Acente Sahibi</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Çalışan Sayısı</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgencies.map((agency) => (
                <tr key={agency.id}>
                  <td>{agency.name}</td>
                  <td>{agency.code}</td>
                  <td>{agency.owner_name}</td>
                  <td>{agency.phone}</td>
                  <td>{agency.email}</td>
                  <td>{agency.employee_count || '-'}</td>
                  <td>
                    <span className={`status-badge status-${agency.status}`}>
                      {agency.status === 'active' ? 'Aktif' : 
                       agency.status === 'passive' ? 'Pasif' : 'Askıda'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-edit" 
                      onClick={() => handleEdit(agency)}
                    >
                      Düzenle
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDelete(agency.id)}
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
    </div>
  );
}

export default Agencies; 