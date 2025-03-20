const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

// Tüm işlemleri getir
router.get('/', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
  }
});

// Belirli bir işlemi getir
router.get('/:id', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
  }
});

// Yeni işlem ekle
router.post('/', authorize(['admin', 'manager']), (req, res) => {
  const {
    date,
    type,
    category,
    amount,
    relatedEntityType,
    relatedEntityId,
    description,
    paymentMethod,
    status
  } = req.body;

  // Temel doğrulama
  if (!date || !type || !category || !amount) {
    return res.status(400).json({ message: 'Tarih, tür, kategori ve tutar zorunludur' });
  }

  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO transactions (
      date, type, category, amount, relatedEntityType, relatedEntityId, 
      description, paymentMethod, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      date, 
      type, 
      category, 
      amount, 
      relatedEntityType || null, 
      relatedEntityId || null, 
      description || null, 
      paymentMethod || 'cash', 
      status || 'completed', 
      now, 
      now
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        date,
        type,
        category,
        amount,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        description: description || null,
        paymentMethod: paymentMethod || 'cash',
        status: status || 'completed',
        createdAt: now,
        updatedAt: now
      });
    }
  );
});

// İşlemi güncelle
router.put('/:id', authorize(['admin', 'manager']), (req, res) => {
  const {
    date,
    type,
    category,
    amount,
    relatedEntityType,
    relatedEntityId,
    description,
    paymentMethod,
    status
  } = req.body;

  // Temel doğrulama
  if (!date || !type || !category || !amount) {
    return res.status(400).json({ message: 'Tarih, tür, kategori ve tutar zorunludur' });
  }

  const now = new Date().toISOString();

  // Önce işlemin var olduğunu kontrol et
  db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }

    // İşlemi güncelle
    db.run(
      `UPDATE transactions SET
        date = ?,
        type = ?,
        category = ?,
        amount = ?,
        relatedEntityType = ?,
        relatedEntityId = ?,
        description = ?,
        paymentMethod = ?,
        status = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        date, 
        type, 
        category, 
        amount, 
        relatedEntityType || null, 
        relatedEntityId || null, 
        description || null, 
        paymentMethod || 'cash', 
        status || 'completed', 
        now, 
        req.params.id
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ message: 'İşlem bulunamadı veya değişiklik yapılmadı' });
        }
        
        res.json({
          id: parseInt(req.params.id),
          date,
          type,
          category,
          amount,
          relatedEntityType: relatedEntityType || null,
          relatedEntityId: relatedEntityId || null,
          description: description || null,
          paymentMethod: paymentMethod || 'cash',
          status: status || 'completed',
          updatedAt: now
        });
      }
    );
  });
});

// İşlemi sil
router.delete('/:id', authorize(['admin', 'manager']), (req, res) => {
  db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Veritabanı hatası', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.json({ message: 'İşlem başarıyla silindi' });
  });
});

module.exports = router; 