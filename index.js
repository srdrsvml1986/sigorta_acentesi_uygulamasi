const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const insuranceCompanyRoutes = require('./routes/insuranceCompanyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 80;

app.use(express.json());

// API Dokümantasyonu (Swagger/OpenAPI)
const swaggerDocument = YAML.load(path.join(__dirname, './swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Static dosyaları sunma (uploads klasörü için)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotaları kullan
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', authenticateToken, customerRoutes);
app.use('/api/v1/policies', authenticateToken, policyRoutes);
app.use('/api/v1/claims', authenticateToken, claimRoutes);
app.use('/api/v1/commissions', authenticateToken, commissionRoutes);
app.use('/api/v1/documents', authenticateToken, documentRoutes);
app.use('/api/v1/notifications', authenticateToken, notificationRoutes);
app.use('/api/v1/reports', authenticateToken, reportRoutes);
app.use('/api/v1/agencies', authenticateToken, agencyRoutes);
app.use('/api/v1/insurance-companies', authenticateToken, insuranceCompanyRoutes);
app.use('/api/v1/transactions', authenticateToken, transactionRoutes);

// React uygulamasını sunmak için
// Build klasörü varsa statik olarak sunuyoruz
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Tüm istekleri index.html'e yönlendir (SPA için)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Geliştirme modunda ana HTML
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Hata Yönetimi
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası!';
  res.status(statusCode).json({ message: message, error: err.stack });
});

// 404 - Route bulunamadı (API istekleri için)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'İstenen API kaynağı bulunamadı' });
});

app.listen(port, () => {
  console.log(`Sunucu ${port} numaralı portta çalışıyor`);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Dökümantasyon: http://localhost:${port}/api-docs`);
});
