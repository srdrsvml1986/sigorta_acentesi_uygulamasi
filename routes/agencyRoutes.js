const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm acenteleri getir
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agencies ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Acenteler getirilirken hata:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// ID'ye göre acente getir
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agencies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Acente getirilirken hata:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Yeni acente ekle
router.post('/', async (req, res) => {
  const { 
    name, code, owner_name, phone, email, address, 
    tax_number, foundation_year, employee_count, website, status 
  } = req.body;

  if (!name || !code || !owner_name || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  try {
    const sql = `
      INSERT INTO agencies (
        name, code, owner_name, phone, email, address, 
        tax_number, foundation_year, employee_count, website, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`;

    const result = await db.query(sql, [
      name, code, owner_name, phone, email, address || '',
      tax_number || '', foundation_year || null, employee_count || null, website || '', status || 'active'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Acente eklenirken hata:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Acente güncelle
router.put('/:id', async (req, res) => {
  const { 
    name, code, owner_name, phone, email, address, 
    tax_number, foundation_year, employee_count, website, status 
  } = req.body;

  if (!name || !code || !owner_name || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  try {
    // Önce acentenin var olup olmadığını kontrol et
    const checkResult = await db.query('SELECT id FROM agencies WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }

    const sql = `
      UPDATE agencies SET
        name = $1, code = $2, owner_name = $3, phone = $4, email = $5, address = $6,
        tax_number = $7, foundation_year = $8, employee_count = $9, website = $10, status = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`;

    const result = await db.query(sql, [
      name, code, owner_name, phone, email, address || '',
      tax_number || '', foundation_year || null, employee_count || null, website || '', status || 'active',
      req.params.id
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Acente güncellenirken hata:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Acente sil
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM agencies WHERE id = $1 RETURNING id', 
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }

    res.json({ 
      message: 'Acente başarıyla silindi', 
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error('Acente silinirken hata:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router; 