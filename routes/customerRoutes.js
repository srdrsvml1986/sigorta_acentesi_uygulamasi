const express = require('express');
    const router = express.Router();
    const db = require('../db');
    const { authorize } = require('../middleware/authMiddleware');

    // Tüm Müşterileri Listele
    router.get('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
      db.all('SELECT * FROM customers', (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
        }
        res.json(rows);
      });
    });

    // Yeni Müşteri Oluştur
    router.post('/', authorize(['admin', 'manager']), (req, res) => {
      const { firstName, lastName, email, phone } = req.body;
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ message: 'Tüm alanları doldurun' });
      }
      db.run(
        'INSERT INTO customers (firstName, lastName, email, phone) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, phone],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Müşteri oluşturulamadı', error: err.message });
          }
          res.status(201).json({ message: 'Müşteri başarıyla oluşturuldu', customerId: this.lastID });
        }
      );
    });

    // Belirli Bir Müşteriyi Güncelle
    router.put('/:id', authorize(['admin', 'manager']), (req, res) => {
      const { id } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ message: 'Tüm alanları doldurun' });
      }

      db.run(
        'UPDATE customers SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
        [firstName, lastName, email, phone, id],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Müşteri güncellenemedi', error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
          }
          res.json({ message: 'Müşteri başarıyla güncellendi' });
        }
      );
    });

    // Belirli Bir Müşteriyi Sil
    router.delete('/:id', authorize(['admin', 'manager']), (req, res) => {
      const { id } = req.params;

      db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }
        res.json({ message: 'Müşteri başarıyla silindi' });
      });
    });

    module.exports = router;
