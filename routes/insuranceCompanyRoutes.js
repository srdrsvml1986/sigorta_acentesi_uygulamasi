const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm sigorta şirketlerini getir
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM insurance_companies ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

// ID'ye göre sigorta şirketi getir
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM insurance_companies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Yeni sigorta şirketi ekle
router.post('/', async (req, res, next) => {
  const { 
    name, code, contact_person, phone, email, address, 
    tax_number, foundation_year, website, commission_rate, 
    payment_terms, contract_date, status 
  } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  try {
    const sql = `
      INSERT INTO insurance_companies (
        name, code, contact_person, phone, email, address, 
        tax_number, foundation_year, website, commission_rate, 
        payment_terms, contract_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`;

    const result = await db.query(sql, [
      name, code, contact_person || '', phone, email, address || '',
      tax_number || '', foundation_year || null, website || '', commission_rate || null,
      payment_terms || '', contract_date || null, status || 'active'
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Sigorta şirketi güncelle
router.put('/:id', async (req, res, next) => {
  const { 
    name, code, contact_person, phone, email, address, 
    tax_number, foundation_year, website, commission_rate, 
    payment_terms, contract_date, status 
  } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  try {
    // Önce şirketin var olup olmadığını kontrol et
    const checkResult = await db.query('SELECT id FROM insurance_companies WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }

    const sql = `
      UPDATE insurance_companies SET
        name = $1, code = $2, contact_person = $3, phone = $4, email = $5, address = $6,
        tax_number = $7, foundation_year = $8, website = $9, commission_rate = $10,
        payment_terms = $11, contract_date = $12, status = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`;

    const result = await db.query(sql, [
      name, code, contact_person || '', phone, email, address || '',
      tax_number || '', foundation_year || null, website || '', commission_rate || null,
      payment_terms || '', contract_date || null, status || 'active',
      req.params.id
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Sigorta şirketi sil
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM insurance_companies WHERE id = $1 RETURNING id', 
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }

    res.json({ 
      message: 'Sigorta şirketi başarıyla silindi', 
      deletedId: req.params.id 
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router; 