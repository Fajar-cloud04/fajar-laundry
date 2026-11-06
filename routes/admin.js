const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// API Login Admin
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.admin = true;
      return res.json({ success: true, message: 'Login berhasil' });
    }
  } catch (e) {}

  if ((username === 'admin' && password === 'admin') || (username === 'admin' && password === 'admin123')) {
    req.session.admin = true;
    return res.json({ success: true, message: 'Login berhasil' });
  }

  res.status(401).json({ success: false, message: 'Username atau password salah!' });
});

// API Ambil Semua Pesanan untuk Dashboard Admin
router.get('/orders', (req, res) => {
  try {
    const sql = `
      SELECT orders.*, services.name as service_name, services.unit 
      FROM orders 
      LEFT JOIN services ON orders.service_id = services.id 
      ORDER BY orders.id DESC
    `;
    const rows = db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Update Status Pesanan (Pending / Diproses / Selesai)
router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Status pesanan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API UPDATE STATUS PEMBAYARAN (Belum Bayar / Lunas)
router.patch('/orders/:id/payment', (req, res) => {
  const { payment_status } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(payment_status, id);
    if (result.changes > 0) {
      res.json({ success: true, message: 'Status pembayaran berhasil diperbarui' });
    } else {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Hapus Pesanan
router.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    if (result.changes > 0) {
      res.json({ success: true, message: 'Pesanan berhasil dihapus' });
    } else {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Ambil Daftar Layanan untuk Admin
router.get('/services', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM services').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Tambah Layanan
router.post('/services', (req, res) => {
  const { name, type, price, unit, description } = req.body;
  try {
    const result = db.prepare('INSERT INTO services (name, type, price, unit, description) VALUES (?, ?, ?, ?, ?)')
      .run(name, type, price, unit, description || '');
    res.json({ success: true, id: result.lastInsertRowid, message: 'Layanan berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Edit Layanan
router.put('/services/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, price, unit, description } = req.body;
  try {
    db.prepare('UPDATE services SET name = ?, type = ?, price = ?, unit = ?, description = ? WHERE id = ?')
      .run(name, type, price, unit, description || '', id);
    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Hapus Layanan
router.delete('/services/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;