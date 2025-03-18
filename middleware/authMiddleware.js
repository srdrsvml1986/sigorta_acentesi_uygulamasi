const jwt = require('jsonwebtoken');
    const jwtSecret = 'your-secret-key'; // Güvenli bir şekilde saklanmalı

    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Kimlik doğrulama hatası: Token yok' });
      }

      jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
          return res.status(403).json({ message: 'Kimlik doğrulama hatası: Geçersiz token' });
        }
        req.user = user;
        next();
      });
    }

    function authorize(roles) {
      return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
          return res.status(403).json({ message: 'Yetkiniz yok' });
        }
        next();
      };
    }

    // Her iki fonksiyon adını da dışa aktaralım (geriye dönük uyumluluk için)
    const authorizeRoles = authorize;

    module.exports = { authenticateToken, authorize, authorizeRoles };
