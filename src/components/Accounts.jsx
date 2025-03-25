import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

function Accounts({ userRole }) {
  console.log("userRole Accounts.jsx", userRole);
  console.log('Gelen userRole değeri:', userRole);
  console.log('userRole tipi:', typeof userRole);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'income', // income, expense
    category: '',
    amount: '',
    relatedEntityType: '', // customer, agency, insurance_company, policy, other
    relatedEntityId: '',
    description: '',
    paymentMethod: 'cash', // cash, bank, credit_card, check
    status: 'completed' // completed, pending, canceled
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    status: ''
  });
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchRelatedEntities();
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'İşlemler getirilemedi.');
        return;
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      setError('Sunucu hatası.');
      console.error('Transactions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedEntities = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Müşterileri getir
      const customersResponse = await fetch('/api/v1/customers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (customersResponse.ok) {
        const data = await customersResponse.json();
        setCustomers(data);
      }
      
      // Acenteleri getir
      const agenciesResponse = await fetch('/api/v1/agencies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (agenciesResponse.ok) {
        const data = await agenciesResponse.json();
        setAgencies(data);
      }
      
      // Sigorta şirketlerini getir
      const companiesResponse = await fetch('/api/v1/insurance-companies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (companiesResponse.ok) {
        const data = await companiesResponse.json();
        setInsuranceCompanies(data);
      }
      
      // Poliçeleri getir
      const policiesResponse = await fetch('/api/v1/policies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (policiesResponse.ok) {
        const data = await policiesResponse.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Related entities fetch error:', error);
    }
  };

  const calculateSummary = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status !== 'canceled')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense' && t.status !== 'canceled')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    setSummary({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // İlişkili varlık türü değiştiğinde, ID'yi sıfırla
    if (name === 'relatedEntityType') {
      setFormData(prev => ({
        ...prev,
        relatedEntityId: ''
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      type: 'income',
      category: '',
      amount: '',
      relatedEntityType: '',
      relatedEntityId: '',
      description: '',
      paymentMethod: 'cash',
      status: 'completed'
    });
    setEditingTransaction(null);
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
  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const url = editingTransaction 
      ? `/api/v1/transactions/${editingTransaction.id}` 
      : '/api/v1/transactions';
    
    try {
      const response = await fetch(url, {
        method: editingTransaction ? 'PUT' : 'POST',
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

      await fetchTransactions();
      setIsModalOpen(false);
      resetForm();
      showToast('success', editingTransaction ? 'İşlem başarıyla güncellendi.' : 'İşlem başarıyla eklendi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      date: transaction.date,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      relatedEntityType: transaction.relatedEntityType || '',
      relatedEntityId: transaction.relatedEntityId || '',
      description: transaction.description || '',
      paymentMethod: transaction.paymentMethod || 'cash',
      status: transaction.status || 'completed'
    });
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'İşlem silinemedi.');
        showToast('error', errorData.message || 'İşlem silinemedi.');
        return;
      }

      await fetchTransactions();
      showToast('success', 'İşlem başarıyla silindi.');
    } catch (error) {
      setError('Sunucu hatası.');
      showToast('error', 'Sunucu hatası.');
      console.error('Transaction delete error:', error);
    }
  };

  // İlişkili varlık adını ID ve türe göre bulmak için yardımcı fonksiyon
  const getRelatedEntityName = (type, id) => {
    if (!type || !id) return '-';
    
    switch (type) {
      case 'customer':
        const customer = customers.find(c => c.id === id);
        return customer ? `${customer.firstName} ${customer.lastName}` : 'Bilinmeyen Müşteri';
      
      case 'agency':
        const agency = agencies.find(a => a.id === id);
        return agency ? agency.name : 'Bilinmeyen Acente';
      
      case 'insurance_company':
        const company = insuranceCompanies.find(c => c.id === id);
        return company ? company.name : 'Bilinmeyen Şirket';
      
      case 'policy':
        const policy = policies.find(p => p.id === id);
        return policy ? policy.policyNumber : 'Bilinmeyen Poliçe';
      
      default:
        return '-';
    }
  };

  // Kategoriye göre filtre seçenekleri
  const getCategories = (type) => {
    if (type === 'income') {
      return [
        { value: 'policy_payment', label: 'Poliçe Ödemesi' },
        { value: 'commission', label: 'Komisyon' },
        { value: 'service_fee', label: 'Hizmet Bedeli' },
        { value: 'other_income', label: 'Diğer Gelir' }
      ];
    } else if (type === 'expense') {
      return [
        { value: 'rent', label: 'Kira' },
        { value: 'utilities', label: 'Faturalar' },
        { value: 'salary', label: 'Maaş' },
        { value: 'office_supplies', label: 'Ofis Malzemeleri' },
        { value: 'travel', label: 'Seyahat' },
        { value: 'marketing', label: 'Pazarlama' },
        { value: 'tax', label: 'Vergi' },
        { value: 'other_expense', label: 'Diğer Gider' }
      ];
    }
    return [];
  };

  // Filtrelenen işlemleri al
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Tarih filtresi
      if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
        return false;
      }
      // Tür filtresi
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }
      // Kategori filtresi
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }
      // Durum filtresi
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }
      return true;
    });
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

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="container">
      <ToastContainer />
      <div className="header-actions">
        <h2>Finansal İşlemler</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Yeni İşlem Ekle
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-title">Toplam Gelir</div>
          <div className="summary-amount">{summary.totalIncome.toLocaleString('tr-TR')} TL</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-title">Toplam Gider</div>
          <div className="summary-amount">{summary.totalExpense.toLocaleString('tr-TR')} TL</div>
        </div>
        <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="summary-title">Bakiye</div>
          <div className="summary-amount">{summary.balance.toLocaleString('tr-TR')} TL</div>
        </div>
      </div>

      <div className="filter-container">
        <h3>Filtreleme</h3>
        <div className="filter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Başlangıç Tarihi</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Bitiş Tarihi</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="filterType">İşlem Türü</label>
              <select
                id="filterType"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">Tümü</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filterStatus">Durum</label>
              <select
                id="filterStatus"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">Tümü</option>
                <option value="completed">Tamamlandı</option>
                <option value="pending">Beklemede</option>
                <option value="canceled">İptal Edildi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTransaction ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Tarih</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">İşlem Türü</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Kategori</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Seçiniz</option>
                {getCategories(formData.type).map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Tutar (TL)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="relatedEntityType">İlişkili Varlık Türü</label>
              <select
                id="relatedEntityType"
                name="relatedEntityType"
                value={formData.relatedEntityType}
                onChange={handleInputChange}
              >
                <option value="">Seçin</option>
                <option value="customer">Müşteri</option>
                <option value="agency">Acente</option>
                <option value="insurance_company">Sigorta Şirketi</option>
                <option value="policy">Poliçe</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="relatedEntityId">İlişkili Varlık</label>
              <select
                id="relatedEntityId"
                name="relatedEntityId"
                value={formData.relatedEntityId}
                onChange={handleInputChange}
                disabled={!formData.relatedEntityType || formData.relatedEntityType === 'other'}
              >
                <option value="">Seçin</option>
                
                {formData.relatedEntityType === 'customer' && customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
                
                {formData.relatedEntityType === 'agency' && agencies.map(agency => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
                
                {formData.relatedEntityType === 'insurance_company' && insuranceCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
                
                {formData.relatedEntityType === 'policy' && policies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policyNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentMethod">Ödeme Yöntemi</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
              >
                <option value="cash">Nakit</option>
                <option value="bank">Banka</option>
                <option value="credit_card">Kredi Kartı</option>
                <option value="check">Çek</option>
              </select>
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
                <option value="completed">Tamamlandı</option>
                <option value="pending">Beklemede</option>
                <option value="canceled">İptal Edildi</option>
              </select>
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
              {editingTransaction ? 'Güncelle' : 'Ekle'}
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

      {filteredTransactions.length === 0 ? (
        <p>Henüz işlem kaydı bulunmamaktadır.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tür</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>İlişkili Varlık</th>
                <th>Ödeme Yöntemi</th>
                <th>Tutar (TL)</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className={`transaction-row ${transaction.type}`}>
                  <td>{new Date(transaction.date).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <span className={`badge ${transaction.type}`}>
                      {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                    </span>
                  </td>
                  <td>
                    {transaction.type === 'income' && (
                      <>
                        {transaction.category === 'policy_payment' && 'Poliçe Ödemesi'}
                        {transaction.category === 'commission' && 'Komisyon'}
                        {transaction.category === 'service_fee' && 'Hizmet Bedeli'}
                        {transaction.category === 'other_income' && 'Diğer Gelir'}
                      </>
                    )}
                    {transaction.type === 'expense' && (
                      <>
                        {transaction.category === 'rent' && 'Kira'}
                        {transaction.category === 'utilities' && 'Faturalar'}
                        {transaction.category === 'salary' && 'Maaş'}
                        {transaction.category === 'office_supplies' && 'Ofis Malzemeleri'}
                        {transaction.category === 'travel' && 'Seyahat'}
                        {transaction.category === 'marketing' && 'Pazarlama'}
                        {transaction.category === 'tax' && 'Vergi'}
                        {transaction.category === 'other_expense' && 'Diğer Gider'}
                      </>
                    )}
                  </td>
                  <td>{transaction.description || '-'}</td>
                  <td>{getRelatedEntityName(transaction.relatedEntityType, transaction.relatedEntityId)}</td>
                  <td>
                    {transaction.paymentMethod === 'cash' && 'Nakit'}
                    {transaction.paymentMethod === 'bank' && 'Banka'}
                    {transaction.paymentMethod === 'credit_card' && 'Kredi Kartı'}
                    {transaction.paymentMethod === 'check' && 'Çek'}
                  </td>
                  <td className="amount">{Number(transaction.amount).toLocaleString('tr-TR')} TL</td>
                  <td>
                    <span className={`status-badge status-${transaction.status}`}>
                      {transaction.status === 'completed' && 'Tamamlandı'}
                      {transaction.status === 'pending' && 'Beklemede'}
                      {transaction.status === 'canceled' && 'İptal Edildi'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-edit" 
                      onClick={() => handleEdit(transaction)}
                    >
                      Düzenle
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDelete(transaction.id)}
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

export default Accounts; 