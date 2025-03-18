const mysql = require('mysql2/promise');
let pool;

async function initializeDB() {
  try {
    // MySQL/MariaDB bağlantı havuzu oluştur
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost:3306',
      user: process.env.DB_USER || 'elacigde_mysql',
      password: process.env.DB_PASSWORD || '6hJm6^99n',
      database: process.env.DB_NAME || 'elacigde_sigorta',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('MariaDB veritabanına başarıyla bağlandı');
    
    // Tabloları oluştur
    await createTables();
    
    return pool;
  } catch (err) {
    console.error('Veritabanına bağlanılamadı:', err.message);
    throw err;
  }
}

async function createTables() {
  try {
    // Kullanıcılar tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'agent', 'manager') NOT NULL DEFAULT 'agent'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Finansal işlemler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        relatedEntityType VARCHAR(50), 
        relatedEntityId INT,
        description TEXT,
        paymentMethod ENUM('cash', 'bank', 'credit_card', 'check') DEFAULT 'cash',
        status ENUM('completed', 'pending', 'canceled') DEFAULT 'completed',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Acente tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        ownerName VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT,
        taxNumber VARCHAR(50),
        foundationYear INT,
        employeeCount INT,
        website VARCHAR(100),
        status ENUM('active', 'passive', 'suspended') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Sigorta şirketleri tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insurance_companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        contactPerson VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT,
        taxNumber VARCHAR(50),
        foundationYear INT,
        website VARCHAR(100),
        commissionRate DECIMAL(5, 2),
        paymentTerms TEXT,
        contractDate DATE,
        status ENUM('active', 'passive', 'suspended') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Müşteriler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50),
        lastName VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(50),
        postalCode VARCHAR(20),
        birthDate DATE,
        identityNumber VARCHAR(20),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Poliçeler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customerId INT,
        policyNumber VARCHAR(50),
        insuranceType VARCHAR(50),
        startDate DATE,
        endDate DATE,
        premium DECIMAL(10, 2),
        status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Hasar ve Talep Yönetimi Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policyId INT,
        claimNumber VARCHAR(50),
        claimDate DATE,
        description TEXT,
        damageAmount DECIMAL(10, 2),
        status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
        documents JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policyId) REFERENCES policies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Komisyon ve Finans Yönetimi Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policyId INT,
        amount DECIMAL(10, 2),
        rate DECIMAL(5, 2),
        paymentDate DATE,
        status ENUM('pending', 'paid') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policyId) REFERENCES policies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Finansal işlemler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transactionType ENUM('premium_payment', 'commission_payment', 'claim_payment'),
        relatedId INT,
        amount DECIMAL(10, 2),
        transactionDate DATE,
        description TEXT,
        status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Doküman ve Dosya Yönetimi Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        relatedType VARCHAR(20),
        relatedId INT,
        fileName VARCHAR(255),
        filePath VARCHAR(255),
        fileType VARCHAR(50),
        fileSize INT,
        uploadedBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Bildirim ve İletişim Sistemi Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        title VARCHAR(255),
        message TEXT,
        type ENUM('email', 'sms', 'app'),
        status ENUM('read', 'unread') DEFAULT 'unread',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sentAt TIMESTAMP NULL,
        readAt TIMESTAMP NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Raporlama ve Analitik için log tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        actionType ENUM('create', 'update', 'delete', 'view'),
        targetType VARCHAR(50),
        targetId INT,
        details JSON,
        ipAddress VARCHAR(45),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    // Entegrasyon Kayıtları Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        integrationType VARCHAR(50),
        requestData JSON,
        responseData JSON,
        status ENUM('success', 'failed'),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci
    `);

    console.log('Tüm tablolar başarıyla oluşturuldu');
  } catch (err) {
    console.error('Tablolar oluşturulurken hata:', err.message);
    throw err;
  }
}

// Veritabanı sorguları için yardımcı fonksiyonlar
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('Sorgu hatası:', err);
    throw err;
  }
}

// Veritabanı bağlantısını kapatır (uygulamayı kapatırken kullanılabilir)
async function close() {
  try {
    await pool.end();
    console.log('Veritabanı bağlantısı kapatıldı');
  } catch (err) {
    console.error('Veritabanı bağlantısı kapatılırken hata:', err);
  }
}

module.exports = {
  init: initializeDB,
  query,
  close,
  getPool: () => pool
};
