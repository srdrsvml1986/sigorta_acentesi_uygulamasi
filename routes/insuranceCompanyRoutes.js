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
    name, code, contactPerson, phone, email, address, 
    taxNumber, foundationYear, website, commissionRate, 
    paymentTerms, contractDate, status 
  } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  const now = new Date().toISOString();
  const sql = `
    INSERT INTO insurance_companies (
      name, code, "contactPerson", phone, email, address, 
      "taxNumber", "foundationYear", website, "commissionRate", 
      "paymentTerms", "contractDate", status, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`;

  try {
    const result = await db.query(sql, [
      name, code, contactPerson || '', phone, email, address || '',
      taxNumber || '', foundationYear || null, website || '', commissionRate || null,
      paymentTerms || '', contractDate || '', status || 'active',
      now, now
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

// Sigorta şirketi güncelle
router.put('/:id', async (req, res, next) => {
  const { 
    name, code, contactPerson, phone, email, address, 
    taxNumber, foundationYear, website, commissionRate, 
    paymentTerms, contractDate, status 
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

    const now = new Date().toISOString();
    const sql = `
      UPDATE insurance_companies SET
        name = $1, code = $2, "contactPerson" = $3, phone = $4, email = $5, address = $6,
        "taxNumber" = $7, "foundationYear" = $8, website = $9, "commissionRate" = $10,
        "paymentTerms" = $11, "contractDate" = $12, status = $13, "updatedAt" = $14
      WHERE id = $15
      RETURNING *`;

    const result = await db.query(sql, [
      name, code, contactPerson || '', phone, email, address || '',
      taxNumber || '', foundationYear || null, website || '', commissionRate || null,
      paymentTerms || '', contractDate || '', status || 'active',
      now, req.params.id
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