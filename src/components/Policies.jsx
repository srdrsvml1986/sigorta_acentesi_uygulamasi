import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Select, InputNumber, Badge, Space, Tooltip } from 'antd';
import moment from 'moment';
import { EditOutlined, DeleteOutlined, FileProtectOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

const { Option } = Select;

const Policies = ({ userRole }) => {
  console.log("userRole Policies.jsx", userRole);
  console.log('Gelen userRole değeri:', userRole);
  console.log('userRole tipi:', typeof userRole);
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    policyNumber: true,
    customerName: true,
    insuranceType: true,
    company: true,
    agency: true,
    status: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  const initialFormData = {
    policy_number: '',
    customer_id: undefined,
    agency_id: undefined,
    insurance_company_id: undefined,
    start_date: null,
    end_date: null,
    premium: 0,
    commission_rate: 0,
    commission_amount: 0,
    profit: 0,
    type: '',
    status: 'active',
    description: ''
  };

  useEffect(() => {
    fetchPolicies();
    fetchCustomers();
    fetchAgencies();
    fetchInsuranceCompanies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.fetch('/api/v1/policies');
      if (!response.ok) {
        throw new Error('Poliçeler yüklenemedi');
      }
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      message.error('Poliçeler yüklenirken hata oluştu');
      console.error('Poliçe yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.fetch('/api/v1/customers');
      if (!response.ok) {
        throw new Error('Müşteriler yüklenemedi');
      }
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      message.error('Müşteriler yüklenirken hata oluştu');
      console.error('Müşteri yükleme hatası:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await api.fetch('/api/v1/agencies');
      if (!response.ok) {
        throw new Error('Acenteler yüklenemedi');
      }
      const data = await response.json();
      setAgencies(data);
    } catch (error) {
      message.error('Acenteler yüklenirken hata oluştu');
      console.error('Acente yükleme hatası:', error);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      const response = await api.fetch('/api/v1/insurance-companies');
      if (!response.ok) {
        throw new Error('Sigorta şirketleri yüklenemedi');
      }
      const data = await response.json();
      setInsuranceCompanies(data);
    } catch (error) {
      message.error('Sigorta şirketleri yüklenirken hata oluştu');
      console.error('Sigorta şirketi yükleme hatası:', error);
    }
  };

  const handleAdd = () => {
    setEditingPolicy(null);
    form.setFieldsValue(initialFormData);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPolicy(record);
    form.setFieldsValue({
      ...record,
      start_date: moment(record.start_date),
      end_date: moment(record.end_date)
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu poliçeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.fetch(`/api/v1/policies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Poliçe silinemedi.');
        toast.error(errorData.message || 'Poliçe silinemedi.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      await fetchPolicies();
      toast.success('Poliçe başarıyla silindi.');
    } catch (error) {
      setError('Sunucu hatası.');
      toast.error('Sunucu hatası.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Policy delete error:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Sayısal değerleri kontrol et ve dönüştür
      const formattedValues = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        premium: parseFloat(values.premium) || 0,
        commission_rate: parseFloat(values.commission_rate) || 0,
        commission_amount: parseFloat(values.commission_amount) || 0,
        profit: parseFloat(values.profit) || 0,
        agency_id: values.agency_id ? parseInt(values.agency_id) : null,
        customer_id: parseInt(values.customer_id),
        insurance_company_id: values.insurance_company_id ? parseInt(values.insurance_company_id) : null
      };

      const token = localStorage.getItem('token');
      const response = await api.fetch(
        editingPolicy ? `/api/v1/policies/${editingPolicy.id}` : '/api/v1/policies',
        {
          method: editingPolicy ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formattedValues)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'İşlem başarısız oldu');
      }

      await fetchPolicies();
      setModalVisible(false);
      form.resetFields();
      toast.success(editingPolicy ? 'Poliçe başarıyla güncellendi' : 'Poliçe başarıyla oluşturuldu');
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      toast.error(error.message || 'Sunucu hatası');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const calculateCommissionAmount = (premium, rate) => {
    const amount = (premium * rate) / 100;
    form.setFieldsValue({ commission_amount: amount });
  };

  const columns = [
    {
      title: 'Poliçe No',
      dataIndex: 'policy_number',
      key: 'policy_number',
      width: 120,
    },
    {
      title: 'Müşteri',
      dataIndex: 'customer_first_name',
      key: 'customer',
      render: (_, record) => `${record.customer_first_name} ${record.customer_last_name}`,
    },
    {
      title: 'Acente',
      dataIndex: 'agency_name',
      key: 'agency',
    },
    {
      title: 'Sigorta Şirketi',
      dataIndex: 'insurance_company_name',
      key: 'insurance_company',
    },
    {
      title: 'Başlangıç',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Bitiş',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Prim',
      dataIndex: 'premium',
      key: 'premium',
      render: (premium) => `₺${premium.toLocaleString('tr-TR')}`,
    },
    {
      title: 'Komisyon',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      render: (amount) => `₺${amount.toLocaleString('tr-TR')}`,
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: 'Aktif' },
          pending: { color: 'gold', text: 'Beklemede' },
          expired: { color: 'red', text: 'Süresi Dolmuş' },
          cancelled: { color: 'gray', text: 'İptal' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return <Badge status={config.color} text={config.text} />;
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredPolicies = policies.filter(policy => {
    if (!searchTerm) return true;
    
    const searchValue = searchTerm.toLowerCase();
    const matchConditions = [];
    
    if (searchFilters.policyNumber && policy.policy_number) {
      matchConditions.push(
        policy.policy_number.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.customerName && (policy.customer_first_name || policy.customer_last_name)) {
      matchConditions.push(
        `${policy.customer_first_name || ''} ${policy.customer_last_name || ''}`.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.insuranceType && policy.type) {
      matchConditions.push(
        policy.type.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.company && policy.insurance_company_name) {
      matchConditions.push(
        policy.insurance_company_name.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.agency && policy.agency_name) {
      matchConditions.push(
        policy.agency_name.toLowerCase().includes(searchValue)
      );
    }
    if (searchFilters.status && policy.status) {
      matchConditions.push(
        policy.status.toLowerCase().includes(searchValue)
      );
    }
    
    return matchConditions.some(condition => condition);
  });

  if (!userRole) {
    return <div className="access-denied">Erişim izniniz yok.</div>;
  }

  if (userRole !== 'admin' && userRole !== 'manager') {
    return <div className="access-denied">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <ToastContainer />
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <FileProtectOutlined /> Poliçeler
        </h2>
        <Button type="primary" onClick={handleAdd}>
          Yeni Poliçe
        </Button>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Poliçe ara..."
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
                checked={searchFilters.policyNumber}
                onChange={(e) => setSearchFilters({...searchFilters, policyNumber: e.target.checked})}
              />
              Poliçe No
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.customerName}
                onChange={(e) => setSearchFilters({...searchFilters, customerName: e.target.checked})}
              />
              Müşteri Adı
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.insuranceType}
                onChange={(e) => setSearchFilters({...searchFilters, insuranceType: e.target.checked})}
              />
              Sigorta Türü
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.company}
                onChange={(e) => setSearchFilters({...searchFilters, company: e.target.checked})}
              />
              Sigorta Şirketi
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.agency}
                onChange={(e) => setSearchFilters({...searchFilters, agency: e.target.checked})}
              />
              Acente
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchFilters.status}
                onChange={(e) => setSearchFilters({...searchFilters, status: e.target.checked})}
              />
              Durum
            </label>
          </div>
        )}
        
        {searchTerm && (
          <div className="search-results-info">
            {filteredPolicies.length} sonuç bulundu
          </div>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredPolicies}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
      />

      <Modal
        title={editingPolicy ? 'Poliçe Düzenle' : 'Yeni Poliçe'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialFormData}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="policy_number"
              label="Poliçe No"
              rules={[{ required: true, message: 'Poliçe no gerekli' }]}
            >
              <Input placeholder="Poliçe numarasını girin" />
            </Form.Item>

            <Form.Item
              name="customer_id"
              label="Müşteri"
              rules={[{ required: true, message: 'Müşteri seçimi gerekli' }]}
            >
              <Select
                placeholder="Müşteri seçin"
                showSearch
                optionFilterProp="children"
              >
                {customers.map(customer => (
                  <Option key={customer.id} value={customer.id}>
                    {`${customer.first_name} ${customer.last_name}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="agency_id"
              label="Acente"
            >
              <Select
                placeholder="Acente seçin"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {agencies.map(agency => (
                  <Option key={agency.id} value={agency.id}>
                    {agency.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="insurance_company_id"
              label="Sigorta Şirketi"
            >
              <Select
                placeholder="Sigorta şirketi seçin"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {insuranceCompanies.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="start_date"
              label="Başlangıç Tarihi"
              rules={[{ required: true, message: 'Başlangıç tarihi gerekli' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="end_date"
              label="Bitiş Tarihi"
              rules={[{ required: true, message: 'Bitiş tarihi gerekli' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="premium"
              label="Prim"
              rules={[{ required: true, message: 'Prim tutarı gerekli' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₺\s?|(,*)/g, '')}
                onChange={(value) => {
                  const rate = form.getFieldValue('commission_rate');
                  if (value && rate) {
                    calculateCommissionAmount(value, rate);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="commission_rate"
              label="Komisyon Oranı (%)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                onChange={(value) => {
                  const premium = form.getFieldValue('premium');
                  if (premium && value) {
                    calculateCommissionAmount(premium, value);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="commission_amount"
              label="Komisyon Tutarı"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₺\s?|(,*)/g, '')}
                disabled
              />
            </Form.Item>

            <Form.Item
              name="profit"
              label="Kar"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₺\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Poliçe Türü"
            >
              <Select placeholder="Poliçe türü seçin">
                <Option value="kasko">Kasko</Option>
                <Option value="trafik">Trafik</Option>
                <Option value="konut">Konut</Option>
                <Option value="saglik">Sağlık</Option>
                <Option value="diger">Diğer</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Durum"
            >
              <Select placeholder="Durum seçin">
                <Option value="active">Aktif</Option>
                <Option value="pending">Beklemede</Option>
                <Option value="expired">Süresi Dolmuş</Option>
                <Option value="cancelled">İptal</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea rows={4} placeholder="Poliçe hakkında açıklama girin" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Policies;
