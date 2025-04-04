import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

function InsuranceCompanies({ userRole }) {
  console.log("userRole InsuranceCompanies.jsx", userRole);
  console.log('Gelen userRole değeri:', userRole);
  console.log('userRole tipi:', typeof userRole);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    foundation_year: '',
    website: '',
    commission_rate: '',
    payment_terms: '',
    contract_date: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    code: true,
    email: true,
    phone: true,
    website: true,
    taxNumber: true
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/insurance-companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Sigorta şirketleri getirilemedi.');
        return;
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Insurance companies fetch error:', error);
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
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      foundation_year: '',
      website: '',
      commission_rate: '',
      payment_terms: '',
      contract_date: '',
      status: 'active'
    });
    setEditingCompany(null);
  };

  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
  };

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
    const url = editingCompany 
      ? `/api/v1/insurance-companies/${editingCompany.id}` 
      : '/api/v1/insurance-companies';
    
    try {
      const response = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'İşlem başarısız oldu.');
        showToast('error', errorData.message || 'İşlem başarısız oldu.');
        return;
      }

      await fetchCompanies();
      setIsModalOpen(false);
      resetForm();
      showToast('success', editingCompany ? 'Sigorta şirketi başarıyla güncellendi.' : 'Sigorta şirketi başarıyla eklendi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      name: company.name,
      code: company.code,
      contact_person: company.contact_person || '',
      phone: company.phone,
      email: company.email,
      address: company.address || '',
      tax_number: company.tax_number || '',
      foundation_year: company.foundation_year || '',
      website: company.website || '',
      commission_rate: company.commission_rate || '',
      payment_terms: company.payment_terms || '',
      contract_date: company.contract_date || '',
      status: company.status || 'active'
    });
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Bu sigorta şirketini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/insurance-companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Sigorta şirketi silinemedi.');
        showToast('error', errorData.message || 'Sigorta şirketi silinemedi.');
        return;
      }

      await fetchCompanies();
      showToast('success', 'Sigorta şirketi başarıyla silindi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Company delete error:', error);
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true;
    
    const searchValue = searchTerm.toLowerCase();
    const matchConditions = [];
    
    if (searchFilters.name) {
      matchConditions.push(
        company.name.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.code) {
      matchConditions.push(
        company.code.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.email) {
      matchConditions.push(company.email.toLowerCase().includes(searchValue));
    }
    if (searchFilters.phone) {
      matchConditions.push(company.phone.includes(searchValue));
    }
    if (searchFilters.website && company.website) {
      matchConditions.push(company.website.toLowerCase().includes(searchValue));
    }
    if (searchFilters.taxNumber && company.tax_number) {
      matchConditions.push(company.tax_number.includes(searchValue));
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
        <h2>Sigorta Şirketleri</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Yeni Şirket Ekle
        </button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Sigorta şirketi ara..."
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
              Şirket Adı
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.code}
                onChange={(e) => setSearchFilters({...searchFilters, code: e.target.checked})}
              />
              Şirket Kodu
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
                checked={searchFilters.website}
                onChange={(e) => setSearchFilters({...searchFilters, website: e.target.checked})}
              />
              Web Sitesi
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
            {filteredCompanies.length} sonuç bulundu
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCompany ? 'Sigorta Şirketi Düzenle' : 'Yeni Sigorta Şirketi Ekle'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Şirket Adı</label>
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
              <label htmlFor="code">Şirket Kodu</label>
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
              <label htmlFor="contact_person">İlgili Kişi</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
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
              <label htmlFor="commission_rate">Komisyon Oranı (%)</label>
              <input
                type="number"
                id="commission_rate"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="contract_date">Sözleşme Tarihi</label>
              <input
                type="date"
                id="contract_date"
                name="contract_date"
                value={formData.contract_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="payment_terms">Ödeme Koşulları</label>
              <textarea
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
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
              {editingCompany ? 'Güncelle' : 'Ekle'}
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

      {companies.length === 0 ? (
        <p>Henüz sigorta şirketi kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Şirket Adı</th>
                <th>Kod</th>
                <th>İlgili Kişi</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Komisyon Oranı</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.code}</td>
                  <td>{company.contact_person}</td>
                  <td>{company.phone}</td>
                  <td>{company.email}</td>
                  <td>{company.commission_rate ? `%${company.commission_rate}` : '-'}</td>
                  <td>
                    <span className={`status-badge status-${company.status}`}>
                      {company.status === 'active' ? 'Aktif' : 
                       company.status === 'passive' ? 'Pasif' : 'Askıda'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-edit" 
                      onClick={() => handleEdit(company)}
                    >
                      Düzenle
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDelete(company.id)}
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

export default InsuranceCompanies; 