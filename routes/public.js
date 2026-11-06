const express = require('express');
const router = express.Router();
const db = require('../db');

// API Ambil Daftar Layanan
router.get('/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Simpan Booking Pesanan Baru Customer
router.post('/orders', (req, res) => {
  try {
    const result = db.createOrder(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      success: true,
      code: result.code,
      total: result.total,
      message: 'Booking berhasil'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Cek Status Pesanan (Berdasarkan Kode / No HP)
router.get('/orders/track', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    const sql = `
      SELECT orders.*, services.name as service_name, services.unit 
      FROM orders 
      LEFT JOIN services ON orders.service_id = services.id 
      WHERE orders.code = ? OR orders.phone = ?
      ORDER BY orders.id DESC
    `;
    const rows = db.prepare(sql).all(q, q);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;