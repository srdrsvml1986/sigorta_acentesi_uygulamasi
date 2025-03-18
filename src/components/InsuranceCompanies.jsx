import React, { useState, useEffect } from 'react';
import './styles.css';

function InsuranceCompanies({ userRole }) {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    foundationYear: '',
    website: '',
    commissionRate: '',
    paymentTerms: '',
    contractDate: '',
    status: 'active'
  });

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
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      foundationYear: '',
      website: '',
      commissionRate: '',
      paymentTerms: '',
      contractDate: '',
      status: 'active'
    });
    setEditingCompany(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
        return;
      }

      // Başarılı işlem sonrası
      await fetchCompanies();
      setShowForm(false);
      resetForm();
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      name: company.name,
      code: company.code,
      contactPerson: company.contactPerson || '',
      phone: company.phone,
      email: company.email,
      address: company.address || '',
      taxNumber: company.taxNumber || '',
      foundationYear: company.foundationYear || '',
      website: company.website || '',
      commissionRate: company.commissionRate || '',
      paymentTerms: company.paymentTerms || '',
      contractDate: company.contractDate || '',
      status: company.status || 'active'
    });
    setEditingCompany(company);
    setShowForm(true);
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
        return;
      }

      await fetchCompanies();
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Insurance company delete error:', error);
    }
  };

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
      <div className="header-actions">
        <h2>Sigorta Şirketleri</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'İptal' : 'Yeni Şirket Ekle'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingCompany ? 'Sigorta Şirketi Düzenle' : 'Yeni Sigorta Şirketi Ekle'}</h3>
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
                <label htmlFor="contactPerson">İlgili Kişi</label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="foundationYear">Kuruluş Yılı</label>
                <input
                  type="number"
                  id="foundationYear"
                  name="foundationYear"
                  value={formData.foundationYear}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="form-row">
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taxNumber">Vergi Numarası</label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
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
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="commissionRate">Komisyon Oranı (%)</label>
                <input
                  type="number"
                  id="commissionRate"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contractDate">Sözleşme Tarihi</label>
                <input
                  type="date"
                  id="contractDate"
                  name="contractDate"
                  value={formData.contractDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentTerms">Ödeme Koşulları</label>
                <input
                  type="text"
                  id="paymentTerms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  placeholder="Örn: 30 gün vade"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Durum</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                  <option value="suspended">Askıda</option>
                </select>
              </div>
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

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingCompany ? 'Güncelle' : 'Ekle'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {companies.length === 0 ? (
        <p>Henüz sigorta şirketi kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Şirket Adı</th>
                <th>Şirket Kodu</th>
                <th>İlgili Kişi</th>
                <th>Telefon</th>
                <th>Komisyon Oranı</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.code}</td>
                  <td>{company.contactPerson || '-'}</td>
                  <td>{company.phone}</td>
                  <td>{company.commissionRate ? `%${company.commissionRate}` : '-'}</td>
                  <td>
                    <span className={`status-badge status-${company.status}`}>
                      {company.status === 'active' && 'Aktif'}
                      {company.status === 'passive' && 'Pasif'}
                      {company.status === 'suspended' && 'Askıda'}
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