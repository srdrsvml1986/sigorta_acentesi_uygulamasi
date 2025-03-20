const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');
// NOT: Gerçek bir uygulamada burada e-posta ve SMS gönderimi için gerekli servisler eklenecektir
// const nodemailer = require('nodemailer');
// const smsService = require('../services/smsService');

// Tüm Bildirimleri Listele (Yönetici)
router.get('/all', authorize(['admin']), (req, res) => {
  db.query('SELECT * FROM notifications ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
    }
    res.json(rows);
  });
});

// Kullanıcının Bildirimlerini Listele
router.get('/', (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  
  db.query(
    'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', 
    [req.user.userId], 
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
      }
      res.json(rows);
    }
  );
});

// Okunmamış Bildirimleri Listele
router.get('/unread', (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  
  db.query(
    'SELECT * FROM notifications WHERE userId = ? AND status = "unread" ORDER BY createdAt DESC', 
    [req.user.userId], 
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
      }
      res.json(rows);
    }
  );
});

// Bildirim Oluştur (Yönetici/Yönetici için)
router.post('/', authorize(['admin', 'manager']), (req, res) => {
  const { userId, title, message, type } = req.body;
  
  if (!userId || !title || !message || !type) {
    return res.status(400).json({ message: 'Tüm alanları doldurun' });
  }
  
  if (!['email', 'sms', 'app'].includes(type)) {
    return res.status(400).json({ message: 'Geçersiz bildirim türü. email, sms veya app olmalıdır.' });
  }
  
  // Kullanıcının var olup olmadığını kontrol et
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const now = new Date().toISOString();
    
    // Bildirim oluştur
    db.run(
      `INSERT INTO notifications (userId, title, message, type, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, 'unread', now],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Bildirim oluşturulamadı', error: err.message });
        }
        
        const notificationId = this.lastID;
        
        // Bildirim türüne göre gönderim işlemi
        // NOT: Gerçek bir uygulamada burada e-posta ve SMS gönderimi yapılacaktır
        if (type === 'email') {
          // Email gönderim servisi burada olacak
          console.log(`E-posta gönderiliyor: ${user.username} - ${title}`);
          // sendEmail(user.email, title, message);
        } else if (type === 'sms') {
          // SMS gönderim servisi burada olacak
          console.log(`SMS gönderiliyor: ${user.username} - ${title}`);
          // sendSMS(user.phone, message);
        }
        
        // Bildirim gönderildi olarak işaretle
        db.run(
          'UPDATE notifications SET sentAt = ? WHERE id = ?', 
          [now, notificationId]
        );
        
        // Aktivite logu oluştur
        if (req.user) {
          db.run(
            `INSERT INTO activity_logs (
              userId, actionType, targetType, targetId, details, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.user.userId, 'create', 'notification', notificationId, 
              JSON.stringify({ 
                description: `${type} türünde bildirim gönderildi: ${title}`, 
                recipient: userId 
              }), 
              now
            ]
          );
        }
        
        res.status(201).json({ 
          message: 'Bildirim başarıyla oluşturuldu', 
          notificationId: notificationId 
        });
      }
    );
  });
});

// Toplu Bildirim Gönder
router.post('/bulk', authorize(['admin']), (req, res) => {
  const { userIds, title, message, type } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message || !type) {
    return res.status(400).json({ message: 'Tüm alanları doldurun' });
  }
  
  if (!['email', 'sms', 'app'].includes(type)) {
    return res.status(400).json({ message: 'Geçersiz bildirim türü. email, sms veya app olmalıdır.' });
  }
  
  const now = new Date().toISOString();
  let successCount = 0;
  let errorCount = 0;
  
  // Her kullanıcı için bildirim oluştur
  const processUsers = () => {
    if (userIds.length === 0) {
      return res.json({ 
        message: 'Bildirimler gönderildi', 
        success: successCount, 
        failed: errorCount 
      });
    }
    
    const userId = userIds.shift();
    
    // Kullanıcının var olup olmadığını kontrol et
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        errorCount++;
        return processUsers();
      }
      
      // Bildirim oluştur
      db.run(
        `INSERT INTO notifications (userId, title, message, type, status, createdAt, sentAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, message, type, 'unread', now, now],
        function (err) {
          if (err) {
            errorCount++;
          } else {
            successCount++;
            
            // Bildirim türüne göre gönderim işlemi
            if (type === 'email') {
              // Email gönderim servisi burada olacak
              console.log(`E-posta gönderiliyor: ${user.username} - ${title}`);
            } else if (type === 'sms') {
              // SMS gönderim servisi burada olacak
              console.log(`SMS gönderiliyor: ${user.username} - ${title}`);
            }
            
            // Aktivite logu oluştur
            if (req.user) {
              db.run(
                `INSERT INTO activity_logs (
                  userId, actionType, targetType, targetId, details, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  req.user.userId, 'create', 'notification', this.lastID, 
                  JSON.stringify({ 
                    description: `${type} türünde toplu bildirim gönderildi: ${title}`, 
                    recipient: userId 
                  }), 
                  now
                ]
              );
            }
          }
          
          processUsers();
        }
      );
    });
  };
  
  processUsers();
});

// Bildirim Durumunu Oku olarak İşaretle
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;
  
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  
  const now = new Date().toISOString();
  
  // Önce bildirimin kullanıcıya ait olup olmadığını ve durumunu kontrol et
  db.get(
    'SELECT * FROM notifications WHERE id = ? AND userId = ?', 
    [id, req.user.userId], 
    (err, notification) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
      }
      
      if (!notification) {
        return res.status(404).json({ message: 'Bildirim bulunamadı' });
      }
      
      if (notification.status === 'read') {
        return res.json({ message: 'Bildirim zaten okundu olarak işaretlenmiş' });
      }
      
      db.run(
        'UPDATE notifications SET status = ?, readAt = ? WHERE id = ?',
        ['read', now, id],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
          }
          
          res.json({ message: 'Bildirim okundu olarak işaretlendi' });
        }
      );
    }
  );
});

// Tüm Bildirimleri Oku olarak İşaretle
router.post('/mark-all-read', (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    'UPDATE notifications SET status = ?, readAt = ? WHERE userId = ? AND status = ?',
    ['read', now, req.user.userId, 'unread'],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
      }
      
      res.json({ 
        message: 'Tüm bildirimler okundu olarak işaretlendi',
        updatedCount: this.changes
      });
    }
  );
});

// Bildirimi Sil
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
  
  // Admin tüm bildirimleri silebilir, diğer kullanıcılar sadece kendilerine ait bildirimleri silebilir
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin 
    ? 'DELETE FROM notifications WHERE id = ?' 
    : 'DELETE FROM notifications WHERE id = ? AND userId = ?';
  const params = isAdmin ? [id] : [id, req.user.userId];
  
  db.run(query, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Bildirim bulunamadı veya silme yetkiniz yok' });
    }
    
    res.json({ message: 'Bildirim başarıyla silindi' });
  });
});

module.exports = router; 