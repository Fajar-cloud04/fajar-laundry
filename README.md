# Bubble Laundry - Aplikasi Manajemen & Pemesanan Laundry

Aplikasi web CRUD sederhana untuk tugas perkuliahan.
**Stack:** HTML5 + Bootstrap 5 + JavaScript | Node.js (Express) | SQLite (better-sqlite3)

## Struktur Folder
```
laundry-app/
├── server.js          # Entry point Express (middleware, session, mount route)
├── db.js              # Koneksi SQLite, eksekusi schema, data awal, fungsi createOrder
├── schema.sql         # Skema tabel: users, services, orders
├── routes/
│   ├── public.js      # API pelanggan: layanan, booking, cek status, login/logout
│   └── admin.js       # API admin (wajib login): CRUD orders & services
├── public/
│   ├── index.html     # Halaman pelanggan
│   ├── admin.html     # Panel admin
│   ├── css/style.css
│   └── js/ common.js, app.js (pelanggan), admin.js (admin)
└── package.json
```

## Cara Menjalankan (Lokal)
1. Instal **Node.js 18+** (https://nodejs.org).
2. Buka terminal di folder proyek, lalu:
   ```bash
   npm install
   npm start
   ```
3. Buka **http://localhost:3000** (pelanggan) dan **http://localhost:3000/admin.html** (admin).

File database `laundry.db` dibuat otomatis beserta data awal saat pertama kali dijalankan.

**Akun admin default:** `admin` / `admin123` (segera ganti untuk penggunaan nyata).

## Endpoint API
| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/services` | Daftar layanan |
| POST | `/api/orders` | Booking pelanggan |
| GET | `/api/orders/track?q=` | Cek status (kode / no HP) |
| POST | `/api/login`, `/api/logout` | Auth admin |
| GET/POST | `/api/admin/orders` | Lihat / tambah pesanan |
| PUT/DELETE | `/api/admin/orders/:id` | Ubah status / hapus pesanan |
| POST | `/api/admin/services` | Tambah layanan |
| PUT/DELETE | `/api/admin/services/:id` | Edit / hapus layanan |

## Catatan Keamanan
- Password disimpan sebagai hash bcrypt; semua query memakai prepared statement (anti SQL injection).
- Total harga dihitung di server; output HTML di-escape (anti XSS).
- Ganti `secret` session di `server.js` sebelum dipakai di luar tugas kuliah.
