const express = require('express');
const router = express.Router();
const db = require('../db');
const { authorize } = require('../middleware/authMiddleware');

// Genel İstatistikleri Getir
router.get('/statistics', authorize(['admin', 'manager']), (req, res) => {
  // Müşteri sayısı
  db.get('SELECT COUNT(*) as customerCount FROM customers', (err, customerResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    // Poliçe sayısı
    db.get('SELECT COUNT(*) as policyCount FROM policies', (err, policyResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası' });
      }
      
      // Aktif poliçe sayısı
      db.get('SELECT COUNT(*) as activePolicyCount FROM policies WHERE status = "active"', (err, activePolicyResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası' });
        }
        
        // Hasar sayısı ve toplam tutar
        db.get('SELECT COUNT(*) as claimCount, SUM(damageAmount) as totalDamage FROM claims', (err, claimResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Sunucu hatası' });
          }
          
          // Toplam komisyon miktarı
          db.get('SELECT SUM(amount) as totalCommission FROM commissions', (err, commissionResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Sunucu hatası' });
            }
            
            res.json({
              customers: {
                total: customerResult.customerCount
              },
              policies: {
                total: policyResult.policyCount,
                active: activePolicyResult.activePolicyCount,
                expired: policyResult.policyCount - activePolicyResult.activePolicyCount
              },
              claims: {
                total: claimResult.claimCount || 0,
                totalDamage: claimResult.totalDamage || 0
              },
              commissions: {
                total: commissionResult.totalCommission || 0
              }
            });
          });
        });
      });
    });
  });
});

// Satış Raporları
router.get('/sales', authorize(['admin', 'manager']), (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  
  let query = `
    SELECT 
      COUNT(*) as policyCount, 
      SUM(premium) as totalPremium
  `;
  
  // Tarih gruplandırma için SQL eklentisi
  if (groupBy === 'month') {
    query += `, strftime('%Y-%m', startDate) as period `;
  } else if (groupBy === 'year') {
    query += `, strftime('%Y', startDate) as period `;
  } else if (groupBy === 'day') {
    query += `, date(startDate) as period `;
  }
  
  query += ` FROM policies WHERE 1=1 `;
  
  const params = [];
  
  if (startDate) {
    query += ` AND startDate >= ? `;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND startDate <= ? `;
    params.push(endDate);
  }
  
  if (['month', 'year', 'day'].includes(groupBy)) {
    query += ` GROUP BY period ORDER BY period ASC`;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!['month', 'year', 'day'].includes(groupBy)) {
      // Gruplandırma yoksa tek satır döndür
      res.json(rows[0] || { policyCount: 0, totalPremium: 0 });
    } else {
      res.json(rows);
    }
  });
});

// Hasar Raporları
router.get('/claims', authorize(['admin', 'manager']), (req, res) => {
  const { startDate, endDate, status, groupBy } = req.query;
  
  let query = `
    SELECT 
      COUNT(*) as claimCount, 
      SUM(damageAmount) as totalDamage,
      status
  `;
  
  // Tarih gruplandırma için SQL eklentisi
  if (groupBy === 'month') {
    query += `, strftime('%Y-%m', claimDate) as period `;
  } else if (groupBy === 'year') {
    query += `, strftime('%Y', claimDate) as period `;
  } else if (groupBy === 'day') {
    query += `, date(claimDate) as period `;
  }
  
  query += ` FROM claims WHERE 1=1 `;
  
  const params = [];
  
  if (startDate) {
    query += ` AND claimDate >= ? `;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND claimDate <= ? `;
    params.push(endDate);
  }
  
  if (status && ['pending', 'approved', 'rejected', 'paid'].includes(status)) {
    query += ` AND status = ? `;
    params.push(status);
  }
  
  if (['month', 'year', 'day'].includes(groupBy)) {
    query += ` GROUP BY period, status ORDER BY period ASC, status`;
  } else {
    query += ` GROUP BY status`;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    res.json(rows);
  });
});

// Komisyon Raporları
router.get('/commissions', authorize(['admin', 'manager']), (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  
  let query = `
    SELECT 
      COUNT(*) as commissionCount, 
      SUM(amount) as totalAmount,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paidAmount,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingAmount
  `;
  
  // Tarih gruplandırma için SQL eklentisi
  if (groupBy === 'month') {
    query += `, strftime('%Y-%m', paymentDate) as period `;
  } else if (groupBy === 'year') {
    query += `, strftime('%Y', paymentDate) as period `;
  } else if (groupBy === 'day') {
    query += `, date(paymentDate) as period `;
  }
  
  query += ` FROM commissions WHERE 1=1 `;
  
  const params = [];
  
  if (startDate) {
    query += ` AND paymentDate >= ? `;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND paymentDate <= ? `;
    params.push(endDate);
  }
  
  if (['month', 'year', 'day'].includes(groupBy)) {
    query += ` GROUP BY period ORDER BY period ASC`;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!['month', 'year', 'day'].includes(groupBy)) {
      // Gruplandırma yoksa tek satır döndür
      res.json(rows[0] || { 
        commissionCount: 0, 
        totalAmount: 0, 
        paidAmount: 0, 
        pendingAmount: 0 
      });
    } else {
      res.json(rows);
    }
  });
});

// Kullanıcı Aktivite Raporları
router.get('/user-activities', authorize(['admin']), (req, res) => {
  const { userId, startDate, endDate, actionType } = req.query;
  
  let query = `
    SELECT a.*, u.username 
    FROM activity_logs a
    JOIN users u ON a.userId = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (userId) {
    query += ` AND a.userId = ? `;
    params.push(userId);
  }
  
  if (startDate) {
    query += ` AND a.createdAt >= ? `;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND a.createdAt <= ? `;
    params.push(endDate);
  }
  
  if (actionType) {
    query += ` AND a.actionType = ? `;
    params.push(actionType);
  }
  
  query += ` ORDER BY a.createdAt DESC LIMIT 1000`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    res.json(rows);
  });
});

// Poliçe Yenilemelerini Listele
router.get('/renewals', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { days } = req.query;
  const daysToExpire = parseInt(days) || 30;
  
  const today = new Date();
  const futureDateObj = new Date();
  futureDateObj.setDate(today.getDate() + daysToExpire);
  
  const futureDate = futureDateObj.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  const query = `
    SELECT p.*, c.firstName, c.lastName, c.email, c.phone
    FROM policies p
    JOIN customers c ON p.customerId = c.id
    WHERE p.endDate <= ?
    AND p.endDate >= ?
    AND p.status = 'active'
    ORDER BY p.endDate ASC
  `;
  
  db.all(query, [futureDate, todayStr], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    res.json(rows);
  });
});

// Ajan Performans Raporu
router.get('/agent-performance', authorize(['admin', 'manager']), (req, res) => {
  const { startDate, endDate } = req.query;
  
  const query = `
    SELECT 
      u.id as userId,
      u.username,
      COUNT(DISTINCT p.id) as policyCount,
      SUM(p.premium) as totalPremium,
      SUM(c.amount) as totalCommission,
      COUNT(DISTINCT cl.id) as claimCount,
      SUM(cl.damageAmount) as totalClaimAmount
    FROM users u
    LEFT JOIN activity_logs a ON u.id = a.userId AND a.targetType = 'policy' AND a.actionType = 'create'
    LEFT JOIN policies p ON a.targetId = p.id
    LEFT JOIN commissions c ON p.id = c.policyId
    LEFT JOIN claims cl ON p.id = cl.policyId
    WHERE u.role = 'agent'
  `;
  
  const params = [];
  
  let dateCondition = '';
  if (startDate) {
    dateCondition += ` AND p.startDate >= ? `;
    params.push(startDate);
  }
  
  if (endDate) {
    dateCondition += ` AND p.startDate <= ? `;
    params.push(endDate);
  }
  
  const finalQuery = `${query} ${dateCondition} GROUP BY u.id ORDER BY totalPremium DESC`;
  
  db.all(finalQuery, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    res.json(rows);
  });
});

// Sigorta Türlerine Göre Dağılım Raporu
router.get('/insurance-types', authorize(['admin', 'manager']), (req, res) => {
  const query = `
    SELECT 
      insuranceType,
      COUNT(*) as policyCount,
      SUM(premium) as totalPremium,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activePolicies
    FROM policies
    GROUP BY insuranceType
    ORDER BY policyCount DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    res.json(rows);
  });
});

// Özel Rapor Oluştur
router.post('/custom', authorize(['admin']), (req, res) => {
  const { query, params } = req.body;
  
  // Güvenlik için basit bir kontrol (gerçek uygulamada daha sıkı güvenlik önlemleri alınmalıdır)
  if (!query || !query.toLowerCase().startsWith('select ')) {
    return res.status(400).json({ message: 'Yalnızca SELECT sorgularına izin verilmektedir.' });
  }
  
  db.all(query, params || [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sorgu çalıştırılırken hata oluştu', error: err.message });
    }
    
    // Aktivite logu
    if (req.user) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO activity_logs (
          userId, actionType, targetType, targetId, details, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId, 'query', 'report', null, 
          JSON.stringify({ description: 'Özel rapor sorgusu çalıştırıldı', query }), 
          now
        ]
      );
    }
    
    res.json(rows);
  });
});

module.exports = router; 