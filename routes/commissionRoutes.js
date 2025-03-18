const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');

// Tüm Komisyonları Listele
router.get('/', authorize(['admin', 'manager']), (req, res) => {
  const query = `
    SELECT c.*, p.policyNumber, p.insuranceType, cu.firstName, cu.lastName
    FROM commissions c
    JOIN policies p ON c.policyId = p.id
    JOIN customers cu ON p.customerId = cu.id
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    res.json(rows);
  });
});

// Belirli bir Poliçeye Ait Komisyonları Listele
router.get('/policy/:policyId', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { policyId } = req.params;
  
  db.all('SELECT * FROM commissions WHERE policyId = ?', [policyId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    res.json(rows);
  });
});

// Belirli Bir Komisyonu Görüntüle
router.get('/:id', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM commissions WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Komisyon kaydı bulunamadı' });
    }
    res.json(row);
  });
});

// Yeni Komisyon Kaydı Oluştur
router.post('/', authorize(['admin', 'manager']), (req, res) => {
  const { 
    policyId, 
    amount, 
    rate, 
    paymentDate, 
    status
  } = req.body;
  
  if (!policyId || !amount || !rate) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }
  
  const now = new Date().toISOString();
  
  // Önce poliçenin varlığını kontrol et
  db.get('SELECT * FROM policies WHERE id = ?', [policyId], (err, policy) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!policy) {
      return res.status(404).json({ message: 'Poliçe bulunamadı' });
    }
    
    // Poliçe bulundu, komisyon kaydı oluştur
    db.run(
      `INSERT INTO commissions (
        policyId, amount, rate, paymentDate, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        policyId, amount, rate, paymentDate || null, status || 'pending', now, now
      ],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Komisyon kaydı oluşturulamadı', error: err.message });
        }
        
        // Aktivite logu oluştur
        const commissionId = this.lastID;
        if (req.user) {
          db.run(
            `INSERT INTO activity_logs (
              userId, actionType, targetType, targetId, details, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.user.userId, 'create', 'commission', commissionId, 
              JSON.stringify({ description: `${policy.policyNumber} nolu poliçe için komisyon kaydı oluşturuldu` }), 
              now
            ]
          );
        }
        
        res.status(201).json({ 
          message: 'Komisyon kaydı başarıyla oluşturuldu', 
          commissionId: commissionId 
        });
      }
    );
  });
});

// Komisyon Kaydını Güncelle
router.put('/:id', authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { 
    policyId, 
    amount, 
    rate, 
    paymentDate, 
    status
  } = req.body;
  
  if (!policyId || !amount || !rate) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    `UPDATE commissions SET 
     policyId = ?, amount = ?, rate = ?, paymentDate = ?, status = ?, updatedAt = ?
     WHERE id = ?`,
    [
      policyId, amount, rate, paymentDate || null, status || 'pending', now, id
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Komisyon kaydı güncellenemedi', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Komisyon kaydı bulunamadı' });
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'update', 'commission', id, 
            JSON.stringify({ description: `Komisyon kaydı güncellendi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Komisyon kaydı başarıyla güncellendi' });
    }
  );
});

// Komisyon Ödeme Durumunu Güncelle
router.patch('/:id/status', authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { status, paymentDate } = req.body;
  
  if (!status || !['pending', 'paid'].includes(status)) {
    return res.status(400).json({ message: 'Geçerli bir durum değeri girin' });
  }
  
  const now = new Date().toISOString();
  const payment = status === 'paid' ? (paymentDate || now) : null;
  
  db.run(
    'UPDATE commissions SET status = ?, paymentDate = ?, updatedAt = ? WHERE id = ?',
    [status, payment, now, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Komisyon durumu güncellenemedi', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Komisyon kaydı bulunamadı' });
      }
      
      // Eğer ödeme yapıldıysa finansal işlem ekle
      if (status === 'paid') {
        db.get('SELECT * FROM commissions WHERE id = ?', [id], (err, commission) => {
          if (!err && commission) {
            db.run(
              `INSERT INTO financial_transactions (
                transactionType, relatedId, amount, transactionDate, description, status, createdAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                'commission_payment', id, commission.amount, payment, 
                'Komisyon ödemesi', 'completed', now
              ]
            );
          }
        });
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'update', 'commission', id, 
            JSON.stringify({ description: `Komisyon durumu ${status} olarak güncellendi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Komisyon durumu başarıyla güncellendi' });
    }
  );
});

// Komisyon Kaydını Sil
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM commissions WHERE id = ?', [id], (err, commission) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!commission) {
      return res.status(404).json({ message: 'Komisyon kaydı bulunamadı' });
    }
    
    db.run('DELETE FROM commissions WHERE id = ?', [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası' });
      }
      
      // İlgili finansal işlemleri de sil
      db.run('DELETE FROM financial_transactions WHERE transactionType = ? AND relatedId = ?', 
        ['commission_payment', id]);
      
      // Aktivite logu oluştur
      if (req.user) {
        const now = new Date().toISOString();
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'delete', 'commission', id, 
            JSON.stringify({ description: `Komisyon kaydı silindi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Komisyon kaydı başarıyla silindi' });
    });
  });
});

// Finansal İşlemleri Listele
router.get('/financial/transactions', authorize(['admin', 'manager']), (req, res) => {
  db.all('SELECT * FROM financial_transactions ORDER BY transactionDate DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    res.json(rows);
  });
});

// Finansal İşlem Oluştur
router.post('/financial/transactions', authorize(['admin', 'manager']), (req, res) => {
  const { 
    transactionType, 
    relatedId, 
    amount, 
    transactionDate, 
    description, 
    status
  } = req.body;
  
  if (!transactionType || !amount || !description) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO financial_transactions (
      transactionType, relatedId, amount, transactionDate, description, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionType, relatedId || null, amount, 
      transactionDate || now, description, 
      status || 'completed', now, now
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Finansal işlem oluşturulamadı', error: err.message });
      }
      
      const transactionId = this.lastID;
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'create', 'financial_transaction', transactionId, 
            JSON.stringify({ description: `Finansal işlem oluşturuldu: ${description}` }), 
            now
          ]
        );
      }
      
      res.status(201).json({ 
        message: 'Finansal işlem başarıyla oluşturuldu', 
        transactionId: transactionId 
      });
    }
  );
});

module.exports = router; 