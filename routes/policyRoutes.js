const express = require('express');
    const router = express.Router();
    const db = require('../db');
    const { authorize } = require('../middleware/authMiddleware');

    // Tüm Poliçeleri Listele
    router.get('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
      db.all('SELECT * FROM policies', (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
        }
        res.json(rows);
      });
    });

    // Yeni Poliçe Oluştur
    router.post('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
      const { customerId, policyNumber, startDate, endDate, premium } = req.body;

      if (!customerId || !policyNumber || !startDate || !endDate || !premium) {
        return res.status(400).json({ message: 'Tüm alanları doldurun' });
      }

      db.run(
        'INSERT INTO policies (customerId, policyNumber, startDate, endDate, premium) VALUES (?, ?, ?, ?, ?)',
        [customerId, policyNumber, startDate, endDate, premium],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Poliçe oluşturulamadı', error: err.message });
          }
          res.status(201).json({ message: 'Poliçe başarıyla oluşturuldu', policyId: this.lastID });
        }
      );
    });

    // Poliçe Güncelle
    router.put('/:id', authorize(['admin', 'manager']), (req, res) => {
      const { id } = req.params;
      const { customerId, policyNumber, startDate, endDate, premium } = req.body;

      if (!customerId || !policyNumber || !startDate || !endDate || !premium) {
        return res.status(400).json({ message: 'Tüm alanları doldurun' });
      }

      db.run(
        'UPDATE policies SET customerId = ?, policyNumber = ?, startDate = ?, endDate = ?, premium = ? WHERE id = ?',
        [customerId, policyNumber, startDate, endDate, premium, id],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Poliçe güncellenemedi', error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ message: 'Poliçe bulunamadı' });
          }
          res.json({ message: 'Poliçe başarıyla güncellendi' });
        }
      );
    });

    // Poliçeyi Sil
    router.delete('/:id', authorize(['admin', 'manager']), (req, res) => {
      const { id } = req.params;

      db.run('DELETE FROM policies WHERE id = ?', [id], function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Poliçe bulunamadı' });
        }
        res.json({ message: 'Poliçe başarıyla silindi' });
      });
    });

    module.exports = router;
