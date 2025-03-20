const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm sigorta şirketlerini getir
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM insurance_companies ORDER BY name ASC', (err, companies) => {
    if (err) {
      return next(err);
    }
    res.json(companies);
  });
});

// ID'ye göre sigorta şirketi getir
router.get('/:id', (req, res, next) => {
  db.get('SELECT * FROM insurance_companies WHERE id = ?', [req.params.id], (err, company) => {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }
    res.json(company);
  });
});

// Yeni sigorta şirketi ekle
router.post('/', (req, res, next) => {
  const { 
    name, code, contactPerson, phone, email, address, 
    taxNumber, foundationYear, website, commissionRate, 
    paymentTerms, contractDate, status 
  } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  const now = new Date().toISOString();
  const sql = `INSERT INTO insurance_companies (
    name, code, contactPerson, phone, email, address, 
    taxNumber, foundationYear, website, commissionRate, 
    paymentTerms, contractDate, status, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    name, code, contactPerson || '', phone, email, address || '',
    taxNumber || '', foundationYear || null, website || '', commissionRate || null,
    paymentTerms || '', contractDate || '', status || 'active',
    now, now
  ], function(err) {
    if (err) {
      return next(err);
    }
    db.get('SELECT * FROM insurance_companies WHERE id = ?', [this.lastID], (err, company) => {
      if (err) {
        return next(err);
      }
      res.status(201).json(company);
    });
  });
});

// Sigorta şirketi güncelle
router.put('/:id', (req, res, next) => {
  const { 
    name, code, contactPerson, phone, email, address, 
    taxNumber, foundationYear, website, commissionRate, 
    paymentTerms, contractDate, status 
  } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ message: 'Gerekli alanlar eksik' });
  }

  // Önce şirketin var olup olmadığını kontrol et
  db.get('SELECT * FROM insurance_companies WHERE id = ?', [req.params.id], (err, company) => {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }

    const now = new Date().toISOString();
    const sql = `UPDATE insurance_companies SET
      name = ?, code = ?, contactPerson = ?, phone = ?, email = ?, address = ?,
      taxNumber = ?, foundationYear = ?, website = ?, commissionRate = ?,
      paymentTerms = ?, contractDate = ?, status = ?, updatedAt = ?
      WHERE id = ?`;

    db.run(sql, [
      name, code, contactPerson || '', phone, email, address || '',
      taxNumber || '', foundationYear || null, website || '', commissionRate || null,
      paymentTerms || '', contractDate || '', status || 'active',
      now, req.params.id
    ], function(err) {
      if (err) {
        return next(err);
      }
      db.get('SELECT * FROM insurance_companies WHERE id = ?', [req.params.id], (err, updatedCompany) => {
        if (err) {
          return next(err);
        }
        res.json(updatedCompany);
      });
    });
  });
});

// Sigorta şirketi sil
router.delete('/:id', (req, res, next) => {
  db.get('SELECT * FROM insurance_companies WHERE id = ?', [req.params.id], (err, company) => {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).json({ message: 'Sigorta şirketi bulunamadı' });
    }

    db.run('DELETE FROM insurance_companies WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return next(err);
      }
      res.json({ message: 'Sigorta şirketi başarıyla silindi', deletedId: req.params.id });
    });
  });
});

module.exports = router; 