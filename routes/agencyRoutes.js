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
router.get('/:id', (req, res, next) => {
  db.get('SELECT * FROM agencies WHERE id = ?', [req.params.id], (err, agency) => {
    if (err) {
      return next(err);
    }
    if (!agency) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }
    res.json(agency);
  });
});

// Yeni acente ekle
router.post('/', (req, res, next) => {
  const { 
    name, code, ownerName, phone, email, address, 
    taxNumber, foundationYear, employeeCount, website, status 
  } = req.body;

  if (!name || !code || !ownerName || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  const now = new Date().toISOString();
  const sql = `INSERT INTO agencies (
    name, code, ownerName, phone, email, address, 
    taxNumber, foundationYear, employeeCount, website, status, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    name, code, ownerName, phone, email, address || '',
    taxNumber || '', foundationYear || null, employeeCount || null, website || '', status || 'active',
    now, now
  ], function(err) {
    if (err) {
      return next(err);
    }
    db.get('SELECT * FROM agencies WHERE id = ?', [this.lastID], (err, agency) => {
      if (err) {
        return next(err);
      }
      res.status(201).json(agency);
    });
  });
});

// Acente güncelle
router.put('/:id', (req, res, next) => {
  const { 
    name, code, ownerName, phone, email, address, 
    taxNumber, foundationYear, employeeCount, website, status 
  } = req.body;

  if (!name || !code || !ownerName || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  // Önce acentenin var olup olmadığını kontrol et
  db.get('SELECT * FROM agencies WHERE id = ?', [req.params.id], (err, agency) => {
    if (err) {
      return next(err);
    }
    if (!agency) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }

    const now = new Date().toISOString();
    const sql = `UPDATE agencies SET
      name = ?, code = ?, ownerName = ?, phone = ?, email = ?, address = ?,
      taxNumber = ?, foundationYear = ?, employeeCount = ?, website = ?, status = ?, updatedAt = ?
      WHERE id = ?`;

    db.run(sql, [
      name, code, ownerName, phone, email, address || '',
      taxNumber || '', foundationYear || null, employeeCount || null, website || '', status || 'active',
      now, req.params.id
    ], function(err) {
      if (err) {
        return next(err);
      }
      db.get('SELECT * FROM agencies WHERE id = ?', [req.params.id], (err, updatedAgency) => {
        if (err) {
          return next(err);
        }
        res.json(updatedAgency);
      });
    });
  });
});

// Acente sil
router.delete('/:id', (req, res, next) => {
  db.get('SELECT * FROM agencies WHERE id = ?', [req.params.id], (err, agency) => {
    if (err) {
      return next(err);
    }
    if (!agency) {
      return res.status(404).json({ message: 'Acente bulunamadı' });
    }

    db.run('DELETE FROM agencies WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return next(err);
      }
      res.json({ message: 'Acente başarıyla silindi', deletedId: req.params.id });
    });
  });
});

module.exports = router; 