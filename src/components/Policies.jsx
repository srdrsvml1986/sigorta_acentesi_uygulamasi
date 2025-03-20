import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, Button, Modal, Form, Input, DatePicker,
  message, Select, InputNumber, Badge, Space, Tooltip
} from 'antd';
import moment from 'moment';
import { EditOutlined, DeleteOutlined, FileProtectOutlined } from '@ant-design/icons';

const { Option } = Select;

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form] = Form.useForm();

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
      const response = await axios.get('/api/policies');
      setPolicies(response.data);
    } catch (error) {
      message.error('Poliçeler yüklenirken hata oluştu');
      console.error('Poliçe yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      message.error('Müşteriler yüklenirken hata oluştu');
      console.error('Müşteri yükleme hatası:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get('/api/agencies');
      setAgencies(response.data);
    } catch (error) {
      message.error('Acenteler yüklenirken hata oluştu');
      console.error('Acente yükleme hatası:', error);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      const response = await axios.get('/api/insurance-companies');
      setInsuranceCompanies(response.data);
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
    try {
      await axios.delete(`/api/policies/${id}`);
      message.success('Poliçe başarıyla silindi');
      fetchPolicies();
    } catch (error) {
      message.error('Poliçe silinirken hata oluştu');
      console.error('Poliçe silme hatası:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD')
      };

      if (editingPolicy) {
        await axios.put(`/api/policies/${editingPolicy.id}`, formattedValues);
        message.success('Poliçe başarıyla güncellendi');
      } else {
        await axios.post('/api/policies', formattedValues);
        message.success('Poliçe başarıyla oluşturuldu');
      }

      setModalVisible(false);
      form.resetFields();
      fetchPolicies();
    } catch (error) {
      if (error.isAxiosError) {
        message.error(error.response?.data?.message || 'İşlem sırasında hata oluştu');
      } else {
        message.error('Lütfen form alanlarını kontrol edin');
      }
      console.error('Form gönderme hatası:', error);
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <FileProtectOutlined /> Poliçeler
        </h2>
        <Button type="primary" onClick={handleAdd}>
          Yeni Poliçe
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={policies}
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
