const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'laundry.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Data awal (hanya jika tabel masih kosong)
if (!db.prepare('SELECT COUNT(*) c FROM users').get().c) {
  db.prepare('INSERT INTO users (username,password) VALUES (?,?)')
    .run('admin', bcrypt.hashSync('admin123', 10));
}
if (!db.prepare('SELECT COUNT(*) c FROM services').get().c) {
  const ins = db.prepare('INSERT INTO services (name,type,price,unit,description) VALUES (?,?,?,?,?)');
  ins.run('Cuci Kering Lipat', 'Kiloan', 6000, 'kg', 'Selesai 2-3 hari');
  ins.run('Cuci Setrika', 'Kiloan', 8000, 'kg', 'Selesai 2-3 hari');
  ins.run('Jas / Blazer', 'Satuan', 25000, 'pcs', 'Dry clean, selesai 3 hari');
  ins.run('Bed Cover', 'Satuan', 35000, 'pcs', 'Cuci bersih, selesai 3 hari');
  ins.run('Express Cuci Setrika', 'Express', 15000, 'kg', 'Selesai dalam 6 jam');
}

// Membuat pesanan: total dihitung di server agar tidak bisa dimanipulasi dari browser
db.createOrder = (d) => {
  const sv = db.prepare('SELECT * FROM services WHERE id=?').get(d.service_id);
  const qty = parseFloat(d.quantity);
  const methods = ['Transfer Bank', 'E-Wallet', 'Cash'];
  if (!d.customer_name || !d.phone || !d.address || !d.pickup_at || !sv || !(qty > 0) || !methods.includes(d.payment_method))
    return { error: 'Data belum lengkap atau tidak valid.' };
  const total = Math.round(sv.price * qty);
  const code = 'LDR-' + Date.now().toString(36).toUpperCase();
  const status = ['Pending', 'Diproses', 'Selesai'].includes(d.status) ? d.status : 'Pending';
  const pay = d.payment_status === 'Lunas' ? 'Lunas' : 'Belum Bayar';
  db.prepare(`INSERT INTO orders (code,customer_name,phone,address,service_id,pickup_at,quantity,total,payment_method,payment_status,status,notes)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(code, d.customer_name.trim(), d.phone.trim(), d.address.trim(), sv.id, d.pickup_at, qty, total, d.payment_method, pay, status, d.notes || '');
  return { code, total };
};

module.exports = db;
