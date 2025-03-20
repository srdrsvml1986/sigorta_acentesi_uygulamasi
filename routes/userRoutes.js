const express = require('express');
    const router = express.Router();
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const db = require('../db');

    const jwtSecret = 'your-secret-key'; // Güvenli bir şekilde saklanmalı

    // Kullanıcı Kaydı
    router.post('/register', async (req, res) => {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [username, hashedPassword, role || 'agent'],
          function (err) {
            if (err) {
              console.error(err);
              return res.status(400).json({ message: 'Kullanıcı oluşturulamadı', error: err.message });
            }
            res.status(201).json({ message: 'Kullanıcı başarıyla kaydedildi', userId: this.lastID });
          }
        );
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Sunucu hatası'+error?.message });
      }
    });

    // Kullanıcı Girişi
    router.post('/login', (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
      }

      db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Sunucu hatası'+err?.message });
        }

        if (!user) {
          return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        try {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) {
            const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, jwtSecret, {
              expiresIn: '1h',
            });
            res.json({ token, userId: user.id, username: user.username, role: user.role });
          } else {
            res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
          }
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Sunucu hatası'+error?.message });
        }
      });
    });

    module.exports = router;
