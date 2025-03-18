const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authorize } = require('../middleware/authMiddleware');

// Dosya yükleme klasörünü yapılandır
const uploadDir = path.join(__dirname, '../uploads');
// Eğer uploads klasörü yoksa oluştur
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // İzin verilen dosya tipleri
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnızca .jpeg, .jpg, .png, .pdf, .doc, .docx, .xls, .xlsx ve .txt dosyaları yüklenebilir!'));
    }
  }
});

// Tüm Dokümanları Listele
router.get('/', authorize(['admin', 'manager', 'agent']), (req, res) => {
  db.all('SELECT * FROM documents ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    res.json(rows);
  });
});

// Belirli bir Kayıt Türüne Ait Dokümanları Listele
router.get('/related/:type/:id', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { type, id } = req.params;
  
  db.all(
    'SELECT * FROM documents WHERE relatedType = ? AND relatedId = ? ORDER BY createdAt DESC', 
    [type, id], 
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası' });
      }
      res.json(rows);
    }
  );
});

// Belirli Bir Dokümanı Görüntüle
router.get('/:id', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Doküman bulunamadı' });
    }
    res.json(row);
  });
});

// Doküman İndir
router.get('/:id/download', authorize(['admin', 'manager', 'agent']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, document) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!document) {
      return res.status(404).json({ message: 'Doküman bulunamadı' });
    }
    
    const filePath = path.join(uploadDir, document.filePath);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }
    
    // Aktivite logu oluştur
    if (req.user) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO activity_logs (
          userId, actionType, targetType, targetId, details, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId, 'download', 'document', id, 
          JSON.stringify({ description: `${document.fileName} dosyası indirildi` }), 
          now
        ]
      );
    }
    
    res.download(filePath, document.fileName);
  });
});

// Yeni Doküman Yükle
router.post('/', authorize(['admin', 'manager', 'agent']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Dosya yüklemelisiniz' });
  }
  
  const { relatedType, relatedId } = req.body;
  
  if (!relatedType || !relatedId) {
    // Yüklenen dosyayı sil
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'İlişkili kayıt türü ve ID belirtilmelidir' });
  }
  
  const now = new Date().toISOString();
  const filePath = path.relative(uploadDir, req.file.path);
  
  db.run(
    `INSERT INTO documents (
      relatedType, relatedId, fileName, filePath, fileType, fileSize, uploadedBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      relatedType, relatedId, req.file.originalname, 
      filePath, req.file.mimetype, req.file.size, 
      req.user.userId, now, now
    ],
    function (err) {
      if (err) {
        console.error(err);
        // Yüklenen dosyayı sil
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Doküman kaydedilemedi', error: err.message });
      }
      
      const documentId = this.lastID;
      
      // Aktivite logu oluştur
      if (req.user) {
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'create', 'document', documentId, 
            JSON.stringify({ description: `${req.file.originalname} dosyası yüklendi` }), 
            now
          ]
        );
      }
      
      res.status(201).json({ 
        message: 'Doküman başarıyla yüklendi', 
        documentId: documentId,
        document: {
          id: documentId,
          relatedType,
          relatedId,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          createdAt: now
        }
      });
    }
  );
});

// Doküman Sil
router.delete('/:id', authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, document) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Sunucu hatası' });
    }
    
    if (!document) {
      return res.status(404).json({ message: 'Doküman bulunamadı' });
    }
    
    db.run('DELETE FROM documents WHERE id = ?', [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Sunucu hatası' });
      }
      
      // Disk üzerindeki dosyayı sil
      const filePath = path.join(uploadDir, document.filePath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Dosya silinirken hata oluştu:', error);
          // Dosya silinmese bile veritabanı kaydı silindiği için işlemi başarılı olarak kabul ediyoruz
        }
      }
      
      // Aktivite logu oluştur
      if (req.user) {
        const now = new Date().toISOString();
        db.run(
          `INSERT INTO activity_logs (
            userId, actionType, targetType, targetId, details, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.userId, 'delete', 'document', id, 
            JSON.stringify({ description: `${document.fileName} dosyası silindi` }), 
            now
          ]
        );
      }
      
      res.json({ message: 'Doküman başarıyla silindi' });
    });
  });
});

// Hata yönetimi
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer hataları için
    return res.status(400).json({ message: 'Dosya yükleme hatası', error: err.message });
  } else if (err) {
    // Diğer hatalar için
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router; 