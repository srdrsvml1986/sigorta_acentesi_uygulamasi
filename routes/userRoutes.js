const express = require('express');
const router = express.Router();
//const bcrypt = require('bcrypt');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../db');

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// Kullanıcı Kaydı
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
  }

  try {
    const hashedPassword = await argon2.hash(password);
    const result = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role || 'agent']
    );
    
    res.status(201).json({ 
      message: 'Kullanıcı başarıyla kaydedildi', 
      userId: result.rows[0].id 
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // unique_violation
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    return res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Kullanıcı Girişi
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const passwordMatch = await argon2.verify(user.password, password);
    if (passwordMatch) {
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role }, 
        jwtSecret, 
        { expiresIn: '1h' }
      );
      res.json({ token, userId: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;
