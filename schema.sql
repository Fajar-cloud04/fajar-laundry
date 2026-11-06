-- Skema database Laundry (SQLite)
CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,                       -- hash bcrypt
  role     TEXT NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS services (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Kiloan','Satuan','Express')),
  price       INTEGER NOT NULL CHECK (price >= 0),
  unit        TEXT NOT NULL DEFAULT 'kg',      -- kg / pcs
  description TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  address        TEXT NOT NULL,
  service_id     INTEGER NOT NULL REFERENCES services(id),
  pickup_at      TEXT NOT NULL,
  quantity       REAL NOT NULL CHECK (quantity > 0),
  total          INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Transfer Bank','E-Wallet','Cash')),
  payment_status TEXT NOT NULL DEFAULT 'Belum Bayar' CHECK (payment_status IN ('Belum Bayar','Lunas')),
  status         TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Diproses','Selesai')),
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
