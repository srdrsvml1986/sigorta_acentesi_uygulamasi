import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import './styles.css'; // Stil dosyasını içe aktaralım

function Policies({ userRole }) {
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policyNumber: '',
    customerId: '',
    agencyId: '',
    insuranceCompanyId: '',
    startDate: '',
    endDate: '',
    premium: '',
    commissionRate: '',
    commissionAmount: '',
    profit: '',
    type: '',
    status: 'active',
    description: ''
  });

  useEffect(() => {
    fetchPolicies();
    fetchCustomers();
    fetchAgencies();
    fetchInsuranceCompanies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/policies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Poliçeler getirilemedi.');
        return;
      }

      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Policies fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Müşteriler getirilemedi');
        return;
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Customers fetch error:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/agencies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Acenteler getirilemedi');
        return;
      }

      const data = await response.json();
      setAgencies(data);
    } catch (error) {
      console.error('Agencies fetch error:', error);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/insurance-companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Sigorta şirketleri getirilemedi');
        return;
      }

      const data = await response.json();
      setInsuranceCompanies(data);
    } catch (error) {
      console.error('Insurance companies fetch error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'premium' || name === 'commissionRate') {
      const premium = name === 'premium' ? parseFloat(value) || 0 : parseFloat(formData.premium) || 0;
      const commissionRate = name === 'commissionRate' ? parseFloat(value) || 0 : parseFloat(formData.commissionRate) || 0;
      
      const commissionAmount = (premium * commissionRate / 100).toFixed(2);
      setFormData(prev => ({
        ...prev,
        commissionAmount: commissionAmount,
        profit: commissionAmount
      }));
    }

    if (name === 'insuranceCompanyId') {
      const selectedCompany = insuranceCompanies.find(company => company.id === value);
      if (selectedCompany && selectedCompany.commissionRate) {
        const commissionRate = selectedCompany.commissionRate;
        const premium = parseFloat(formData.premium) || 0;
        const commissionAmount = (premium * commissionRate / 100).toFixed(2);
        
        setFormData(prev => ({
          ...prev,
          commissionRate: commissionRate,
          commissionAmount: commissionAmount,
          profit: commissionAmount
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      policyNumber: '',
      customerId: '',
      agencyId: '',
      insuranceCompanyId: '',
      startDate: '',
      endDate: '',
      premium: '',
      commissionRate: '',
      commissionAmount: '',
      profit: '',
      type: '',
      status: 'active',
      description: ''
    });
    setEditingPolicy(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const token = localStorage.getItem('token');
    const url = editingPolicy 
      ? `/api/v1/policies/${editingPolicy.id}` 
      : '/api/v1/policies';
    
    try {
      const response = await fetch(url, {
        method: editingPolicy ? 'PUT' : 'POST',
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

      await fetchPolicies();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (policy) => {
    setFormData({
      policyNumber: policy.policyNumber,
      customerId: policy.customerId,
      agencyId: policy.agencyId || '',
      insuranceCompanyId: policy.insuranceCompanyId || '',
      startDate: policy.startDate,
      endDate: policy.endDate,
      premium: policy.premium,
      commissionRate: policy.commissionRate || '',
      commissionAmount: policy.commissionAmount || '',
      profit: policy.profit || '',
      type: policy.type || '',
      status: policy.status || 'active',
      description: policy.description || ''
    });
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleDelete = async (policyId) => {
    if (!window.confirm('Bu poliçeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Poliçe silinemedi.');
        return;
      }

      await fetchPolicies();
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Policy delete error:', error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Bilinmeyen Müşteri';
  };

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? agency.name : 'Bilinmeyen Acente';
  };

  const getInsuranceCompanyName = (insuranceCompanyId) => {
    const company = insuranceCompanies.find(c => c.id === insuranceCompanyId);
    return company ? company.name : 'Bilinmeyen Şirket';
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
        <h2>Poliçeler</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Yeni Poliçe Ekle
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingPolicy ? 'Poliçe Düzenle' : 'Yeni Poliçe Ekle'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="policyNumber">Poliçe Numarası</label>
              <input
                type="text"
                id="policyNumber"
                name="policyNumber"
                value={formData.policyNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">Poliçe Türü</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                <option value="kasko">Kasko</option>
                <option value="trafik">Trafik</option>
                <option value="konut">Konut</option>
                <option value="saglik">Sağlık</option>
                <option value="dask">DASK</option>
                <option value="diger">Diğer</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerId">Müşteri</label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="agencyId">Acente</label>
              <select
                id="agencyId"
                name="agencyId"
                value={formData.agencyId}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                {agencies.map(agency => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="insuranceCompanyId">Sigorta Şirketi</label>
              <select
                id="insuranceCompanyId"
                name="insuranceCompanyId"
                value={formData.insuranceCompanyId}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                {insuranceCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
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
                <option value="cancelled">İptal</option>
                <option value="expired">Süresi Dolmuş</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Başlangıç Tarihi</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Bitiş Tarihi</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="premium">Prim Tutarı (TL)</label>
              <input
                type="number"
                id="premium"
                name="premium"
                value={formData.premium}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
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
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="commissionAmount">Komisyon Tutarı (TL)</label>
              <input
                type="number"
                id="commissionAmount"
                name="commissionAmount"
                value={formData.commissionAmount}
                readOnly
              />
            </div>
            <div className="form-group">
              <label htmlFor="profit">Kar (TL)</label>
              <input
                type="number"
                id="profit"
                name="profit"
                value={formData.profit}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Açıklama</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingPolicy ? 'Güncelle' : 'Ekle'}
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

      {policies.length === 0 ? (
        <p>Henüz poliçe kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Poliçe No</th>
                <th>Müşteri</th>
                <th>Sigorta Şirketi</th>
                <th>Tür</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Prim</th>
                <th>Komisyon</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.policyNumber}</td>
                  <td>{getCustomerName(policy.customerId)}</td>
                  <td>{getInsuranceCompanyName(policy.insuranceCompanyId)}</td>
                  <td>{policy.type}</td>
                  <td>{new Date(policy.startDate).toLocaleDateString('tr-TR')}</td>
                  <td>{new Date(policy.endDate).toLocaleDateString('tr-TR')}</td>
                  <td>{parseFloat(policy.premium).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                  <td>{parseFloat(policy.commissionAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                  <td>
                    {policy.status === 'active' && 'Aktif'}
                    {policy.status === 'passive' && 'Pasif'}
                    {policy.status === 'cancelled' && 'İptal'}
                    {policy.status === 'expired' && 'Süresi Dolmuş'}
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-edit" 
                      onClick={() => handleEdit(policy)}
                    >
                      Düzenle
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDelete(policy.id)}
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

export default Policies;
