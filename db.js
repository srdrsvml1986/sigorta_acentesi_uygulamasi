const { Pool } = require('pg');
const sql = require('mssql');
const mariadb = require('mariadb');

let dbConnection;

async function initializeDB() {
  const dbType = process.env.DB_TYPE || 'postgres'; // postgres, mssql, mariadb

  try {
    switch (dbType.toLowerCase()) {
      case 'postgres':
        dbConnection = await initializePostgres();
        break;
      case 'mssql':
        dbConnection = await initializeMSSQL();
        break;
      case 'mariadb':
        dbConnection = await initializeMariaDB();
        break;
      default:
        throw new Error('Desteklenmeyen veritabanı türü');
    }

    console.log(`${dbType} veritabanına başarıyla bağlandı`);
    await createTables(dbType);
    return dbConnection;
  } catch (err) {
    console.error('Veritabanına bağlanılamadı:', err.message);
    throw err;
  }
}

async function initializePostgres() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  return { type: 'postgres', connection: pool };
}

async function initializeMSSQL() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    }
  };
  const pool = await sql.connect(config);
  return { type: 'mssql', connection: pool };
}

async function initializeMariaDB() {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  return { type: 'mariadb', connection: pool };
}

async function createTables(dbType) {
  try {
    // Kullanıcılar tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'manager'))
      )
    `);

    // Finansal işlemler tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        description TEXT,
        payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'credit_card', 'check')),
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'canceled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Acente tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        owner_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT,
        tax_number VARCHAR(50),
        foundation_year INTEGER,
        employee_count INTEGER,
        website VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passive', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Sigorta şirketleri tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS insurance_companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT,
        tax_number VARCHAR(50),
        foundation_year INTEGER,
        website VARCHAR(100),
        commission_rate DECIMAL(5, 2),
        payment_terms TEXT,
        contract_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passive', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Müşteriler tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(50),
        postal_code VARCHAR(20),
        birth_date DATE,
        identity_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Poliçeler tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        policy_number VARCHAR(50),
        insurance_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        premium DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Hasar ve Talep Yönetimi Tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
        claim_number VARCHAR(50),
        claim_date DATE,
        description TEXT,
        damage_amount DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
        documents JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Komisyon ve Finans Yönetimi Tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id SERIAL PRIMARY KEY,
        policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2),
        rate DECIMAL(5, 2),
        payment_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Doküman ve Dosya Yönetimi Tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        related_type VARCHAR(20),
        related_id INTEGER,
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        file_type VARCHAR(50),
        file_size INTEGER,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Bildirim ve İletişim Sistemi Tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(10) CHECK (type IN ('email', 'sms', 'app')),
        status VARCHAR(10) DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP,
        read_at TIMESTAMP
      )
    `);

    // Raporlama ve Analitik için log tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(10) CHECK (action_type IN ('create', 'update', 'delete', 'view')),
        target_type VARCHAR(50),
        target_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Entegrasyon Kayıtları Tablosu
    await dbConnection.connection.query(`
      CREATE TABLE IF NOT EXISTS integration_logs (
        id SERIAL PRIMARY KEY,
        integration_type VARCHAR(50),
        request_data JSONB,
        response_data JSONB,
        status VARCHAR(10) CHECK (status IN ('success', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tüm tablolar başarıyla oluşturuldu');
  } catch (err) {
    console.error('Tablolar oluşturulurken hata:', err.message);
    throw err;
  }
}

// Query fonksiyonu
async function query(text, params) {
  if (!dbConnection) {
    await initializeDB();
  }

  try {
    switch (dbConnection.type) {
      case 'postgres':
        return await dbConnection.connection.query(text, params);
      case 'mssql':
        return await dbConnection.connection.request().query(text);
      case 'mariadb':
        return await dbConnection.connection.query(text, params);
      default:
        throw new Error('Desteklenmeyen veritabanı türü');
    }
  } catch (err) {
    console.error('Sorgu çalıştırılırken hata:', err);
    throw err;
  }
}

// Veritabanı bağlantısını kapatır
async function close() {
  try {
    if (dbConnection) {
      switch (dbConnection.type) {
        case 'postgres':
          await dbConnection.connection.end();
          break;
        case 'mssql':
          await dbConnection.connection.close();
          break;
        case 'mariadb':
          await dbConnection.connection.end();
          break;
      }
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  } catch (err) {
    console.error('Veritabanı bağlantısı kapatılırken hata:', err);
  }
}

module.exports = {
  query,
  close,
  init: initializeDB
};
