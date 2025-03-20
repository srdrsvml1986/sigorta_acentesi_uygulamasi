const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token);
    console.log('JWT Secret:', jwtSecret);

    if (!token) {
      return res.status(401).json({ message: 'Kimlik doğrulama hatası: Token yok' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        console.error('Token doğrulama hatası detayı:', {
          name: err.name,
          message: err.message,
          expiredAt: err.expiredAt,
          token: token
        });
        return res.status(403).json({ 
          message: 'Kimlik doğrulama hatası: Geçersiz token',
          details: err.message 
        });
      }
      console.log('Doğrulanmış kullanıcı:', user);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Middleware hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
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
