const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');

// Tüm Müşterileri Listele
router.get('/', authorize(['admin', 'manager', 'agent']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Sunucu hatası: ' + err.message });
  }
});

// Yeni Müşteri Oluştur
router.post('/', authorize(['admin', 'manager']), async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ message: 'Tüm alanları doldurun' });
  }

  try {
    const result = await db.query(
      'INSERT INTO customers (firstName, lastName, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
      [firstName, lastName, email, phone]
    );
    res.status(201).json({ 
      message: 'Müşteri başarıyla oluşturuldu', 
      customerId: result.rows[0].id 
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
      message: 'Müşteri oluşturulamadı', 
      error: err.message 
    });
  }
});

// Belirli Bir Müşteriyi Güncelle
router.put('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ message: 'Tüm alanları doldurun' });
  }

  try {
    const result = await db.query(
      'UPDATE customers SET firstName = $1, lastName = $2, email = $3, phone = $4 WHERE id = $5 RETURNING id',
      [firstName, lastName, email, phone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }

    res.json({ message: 'Müşteri başarıyla güncellendi' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
      message: 'Müşteri güncellenemedi', 
      error: err.message 
    });
  }
});

// Belirli Bir Müşteriyi Sil
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }

    res.json({ message: 'Müşteri başarıyla silindi' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: err.message 
    });
  }
});

module.exports = router;
