const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');

// Tüm Poliçeleri Listele
router.get('/', authorize(['admin', 'manager', 'agent']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        COALESCE(c.first_name, '') as customer_first_name,
        COALESCE(c.last_name, '') as customer_last_name,
        COALESCE(a.name, '') as agency_name,
        COALESCE(ic.name, '') as insurance_company_name
      FROM policies p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN agencies a ON p.agency_id = a.id
      LEFT JOIN insurance_companies ic ON p.insurance_company_id = ic.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Poliçeler listelenirken hata:', err);
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Yeni Poliçe Oluştur
router.post('/', authorize(['admin', 'manager', 'agent']), async (req, res) => {
  const { 
    policy_number, customer_id, agency_id, insurance_company_id,
    start_date, end_date, premium, commission_rate, commission_amount,
    profit, type, status, description 
  } = req.body;

  if (!policy_number || !customer_id || !start_date || !end_date || !premium) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }

  try {
    // Önce foreign key referanslarını kontrol et
    if (customer_id) {
      const customerCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
      if (customerCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Geçersiz müşteri ID' });
      }
    }

    if (agency_id) {
      const agencyCheck = await db.query('SELECT id FROM agencies WHERE id = $1', [agency_id]);
      if (agencyCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Geçersiz acente ID' });
      }
    }

    if (insurance_company_id) {
      const companyCheck = await db.query('SELECT id FROM insurance_companies WHERE id = $1', [insurance_company_id]);
      if (companyCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Geçersiz sigorta şirketi ID' });
      }
    }

    const sql = `
      INSERT INTO policies (
        policy_number, customer_id, agency_id, insurance_company_id,
        start_date, end_date, premium, commission_rate, commission_amount,
        profit, type, status, description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`;

    const result = await db.query(sql, [
      policy_number,
      customer_id,
      agency_id || null,
      insurance_company_id || null,
      start_date,
      end_date,
      premium,
      commission_rate || 0,
      commission_amount || 0,
      profit || 0,
      type || '',
      status || 'active',
      description || ''
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Poliçe oluşturulurken hata:', err);
    return res.status(400).json({ 
      message: 'Poliçe oluşturulamadı', 
      error: err.message,
      details: err.detail || 'Detaylı hata bilgisi mevcut değil'
    });
  }
});

// Poliçe Güncelle
router.put('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { 
    policy_number, customer_id, agency_id, insurance_company_id,
    start_date, end_date, premium, commission_rate, commission_amount,
    profit, type, status, description 
  } = req.body;

  if (!policy_number || !customer_id || !start_date || !end_date || !premium) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }

  try {
    const checkResult = await db.query('SELECT id FROM policies WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Poliçe bulunamadı' });
    }

    const sql = `
      UPDATE policies SET
        policy_number = $1, customer_id = $2, agency_id = $3, insurance_company_id = $4,
        start_date = $5, end_date = $6, premium = $7, commission_rate = $8,
        commission_amount = $9, profit = $10, type = $11, status = $12,
        description = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`;

    const result = await db.query(sql, [
      policy_number, customer_id, agency_id || null, insurance_company_id || null,
      start_date, end_date, premium, commission_rate || null, commission_amount || null,
      profit || null, type || '', status || 'active', description || '',
      id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Poliçe güncellenirken hata:', err);
    return res.status(400).json({ message: 'Poliçe güncellenemedi', error: err.message });
  }
});

// Poliçeyi Sil
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM policies WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Poliçe bulunamadı' });
    }

    res.json({ 
      message: 'Poliçe başarıyla silindi', 
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error('Poliçe silinirken hata:', err);
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router;
