const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');

// Tüm Hasar Taleplerini Listele
router.get('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const query = `
    SELECT c.*, p.policyNumber, cu.firstName, cu.lastName 
    FROM claims c
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

// Belirli bir Poliçeye Ait Hasar Taleplerini Listele
router.get('/policy/:policyId', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { policyId } = req.params;
  
  db.all('SELECT * FROM claims WHERE policyId = ?', [policyId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    res.json(rows);
  });
});

// Belirli Bir Hasar Talebini Görüntüle
router.get('/:id', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM claims WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Hasar talebi bulunamadı' });
    }
    res.json(row);
  });
});

// Yeni Hasar Talebi Oluştur
router.post('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { 
    policyId, 
    claimNumber, 
    claimDate, 
    description, 
    damageAmount,
    status,
    documents
  } = req.body;
  
  if (!policyId || !claimNumber || !claimDate || !description || !damageAmount) {
    return res.status(400).json({ message: 'Zorunlu alanları doldurun' });
  }
  
  const now = new Date().toISOString();
  const documentsJSON = documents ? JSON.stringify(documents) : null;
  
  // Önce poliçenin varlığını kontrol et
  db.get('SELECT * FROM policies WHERE id = ?', [policyId], (err, policy) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!policy) {
      return res.status(404).json({ message: 'Poliçe bulunamadı' });
    }
    
    // Poliçe bulundu, hasar talebi oluştur
    db.run(
      `INSERT INTO claims (
        policyId, claimNumber, claimDate, description, 
        damageAmount, status, documents, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policyId, claimNumber, claimDate, description, 
        damageAmount, status || 'pending', documentsJSON, now, now
      ],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Hasar talebi oluşturulamadı', error: err.message });
        }
        
        // Aktivite logu oluştur
        const claimId = this.lastID;
        if (req.user) {
          db.run(
            `INSERT INTO activity_logs (
              userId, actionType, targetType, targetId, details, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.user.userId, 'create', 'claim', claimId, 
              JSON.stringify({ description: `${claimNumber} numaralı hasar talebi oluşturuldu` }), 
              now
            ]
          );
        }
        
        res.status(201).json({ 
          message: 'Hasar talebi başarıyla oluşturuldu', 
          claimId: claimId 
        });
      }
    );
  });
});

// Hasar Talebi Güncelle
router.put('/:id', authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { 
    policyId, 
    claimNumber, 
    claimDate, 
    description, 
    damageAmount,
    status,
    documents
  } = req.body;
  
  if (!policyId || !claimNumber || !claimDate || !description || !damageAmount || !status) {
    return res.status(400).json({ message: 'Tüm zorunlu alanları doldurun' });
  }
  
  const now = new Date().toISOString();
  const documentsJSON = documents ? JSON.stringify(documents) : null;
  
  db.run(
    `UPDATE claims SET 
     policyId = ?, claimNumber = ?, claimDate = ?, description = ?, 
     damageAmount = ?, status = ?, documents = ?, updatedAt = ?
     WHERE id = ?`,
    [
      policyId, claimNumber, claimDate, description, 
      damageAmount, status, documentsJSON, now, id
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Hasar talebi güncellenemedi', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Hasar talebi bulunamadı' });
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'update', 'claim', id, 
            JSON.stringify({ description: `${claimNumber} numaralı hasar talebi güncellendi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Hasar talebi başarıyla güncellendi' });
    }
  );
});

// Hasar Talebi Durumunu Güncelle
router.patch('/:id/status', authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['pending', 'approved', 'rejected', 'paid'].includes(status)) {
    return res.status(400).json({ message: 'Geçerli bir durum değeri girin' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    'UPDATE claims SET status = ?, updatedAt = ? WHERE id = ?',
    [status, now, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Hasar talebi durumu güncellenemedi', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Hasar talebi bulunamadı' });
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'update', 'claim', id, 
            JSON.stringify({ description: `Hasar talebi durumu ${status} olarak güncellendi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Hasar talebi durumu başarıyla güncellendi' });
    }
  );
});

// Hasar Talebi Sil
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT claimNumber FROM claims WHERE id = ?', [id], (err, claim) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!claim) {
      return res.status(404).json({ message: 'Hasar talebi bulunamadı' });
    }
    
    db.run('DELETE FROM claims WHERE id = ?', [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası' });
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        const now = new Date().toISOString();
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'delete', 'claim', id, 
            JSON.stringify({ description: `${claim.claimNumber} numaralı hasar talebi silindi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Hasar talebi başarıyla silindi' });
    });
  });
});

module.exports = router; 