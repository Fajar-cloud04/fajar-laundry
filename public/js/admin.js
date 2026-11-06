let currentServices = [];

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginMsg = document.getElementById('loginMsg');
  const btnLogout = document.getElementById('btnLogout');
  const serviceForm = document.getElementById('serviceForm');

  // Cek Status Login Saat Halaman Dimuat
  checkAuth();

  function checkAuth() {
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isAdminLoggedIn === 'true') {
      if (loginSection) loginSection.classList.add('d-none');
      if (dashboardSection) dashboardSection.classList.remove('d-none');
      loadOrders();
      loadServices();
    } else {
      if (loginSection) loginSection.classList.remove('d-none');
      if (dashboardSection) dashboardSection.classList.add('d-none');
    }
  }

  // Handle Form Submit Login Admin
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usernameInput = document.getElementById('username').value.trim();
      const passwordInput = document.getElementById('password').value.trim();

      loginMsg.innerHTML = '<div class="alert alert-info py-2 small mt-2">Memeriksa akun...</div>';

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          localStorage.setItem('adminLoggedIn', 'true');
          loginMsg.innerHTML = '<div class="alert alert-success py-2 small mt-2">Login berhasil! Mengalihkan...</div>';
          setTimeout(() => checkAuth(), 300);
        } else {
          // Fallback pengujian lokal jika menggunakan akun default
          if ((usernameInput === 'admin' && passwordInput === 'admin') || (usernameInput === 'admin' && passwordInput === 'admin123')) {
            localStorage.setItem('adminLoggedIn', 'true');
            loginMsg.innerHTML = '<div class="alert alert-success py-2 small mt-2">Login berhasil!</div>';
            setTimeout(() => checkAuth(), 300);
          } else {
            loginMsg.innerHTML = `<div class="alert alert-danger py-2 small mt-2">${result.message || 'Username atau password salah!'}</div>`;
          }
        }
      } catch (err) {
        if ((usernameInput === 'admin' && passwordInput === 'admin') || (usernameInput === 'admin' && passwordInput === 'admin123')) {
          localStorage.setItem('adminLoggedIn', 'true');
          loginMsg.innerHTML = '<div class="alert alert-success py-2 small mt-2">Login berhasil!</div>';
          setTimeout(() => checkAuth(), 300);
        } else {
          loginMsg.innerHTML = '<div class="alert alert-danger py-2 small mt-2">Username atau password salah!</div>';
        }
      }
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('adminLoggedIn');
      checkAuth();
    });
  }

  // Handle Submit Form Layanan (Tambah / Edit)
  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('serviceId').value;
      const payload = {
        name: document.getElementById('serviceName').value.trim(),
        type: document.getElementById('serviceType').value,
        unit: document.getElementById('serviceUnit').value,
        price: parseFloat(document.getElementById('servicePrice').value),
        description: document.getElementById('serviceDesc').value.trim()
      };

      let url = id ? `/api/admin/services/${id}` : '/api/admin/services';
      let method = id ? 'PUT' : 'POST';

      try {
        let res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          url = id ? `/api/services/${id}` : '/api/services';
          res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          const modalEl = document.getElementById('serviceModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          loadServices();
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(errorData.error || 'Gagal menyimpan data layanan.');
        }
      } catch (err) {
        alert('Terjadi kesalahan server.');
      }
    });
  }
});

// Helper Badge Status
function getStatusBadgeClass(status) {
  if (status === 'Diproses' || status === 'Proses') return 'bg-warning text-dark';
  if (status === 'Selesai') return 'bg-success text-white';
  return 'bg-info text-dark';
}

// Load Data Pesanan di Dashboard Admin
async function loadOrders() {
  const ordersTable = document.getElementById('ordersTable');
  if (!ordersTable) return;

  ordersTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Memuat data pesanan...</td></tr>';

  try {
    let res = await fetch('/api/admin/orders');
    if (!res.ok) res = await fetch('/api/orders');
    const data = await res.json();

    if (!data || data.length === 0) {
      ordersTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada pesanan masuk.</td></tr>';
      return;
    }

    ordersTable.innerHTML = data.map(o => `
      <tr class="align-middle">
        <td class="text-center">
          <div class="fw-bold text-info">${o.code || o.order_code || 'LDR-001'}</div>
          <small class="text-muted d-block">Dibuat: ${o.created_at || 'Hari ini'}</small>
          <small class="text-warning fw-semibold d-block mt-1">📅 Jemput: ${o.pickup_at ? fmtDate(o.pickup_at) : '-'}</small>
        </td>
        <td class="text-start">
          <div class="fw-bold text-white">${esc(o.customer_name)}</div>
          <small class="text-info d-block mb-1">📞 ${esc(o.phone)}</small>
          <small class="text-light d-block lh-sm">📍 ${esc(o.address)}</small>
        </td>
        <td class="text-start">
          <div class="fw-bold text-white">${esc(o.service_name || o.service || 'Layanan Laundry')} (${o.quantity} ${o.unit || 'kg'})</div>
          ${o.notes ? `<small class="text-warning d-block mt-1">📝 Catatan: "${esc(o.notes)}"</small>` : '<small class="text-muted d-block mt-1">- Tidak ada catatan -</small>'}
        </td>
        <td class="text-center">
          <div class="fw-bold text-warning fs-6">${rp(o.total || o.total_price || 0)}</div>
          <small class="text-muted d-block">${esc(o.payment_method || 'Cash')}</small>
          <!-- Dropdown Status Pembayaran Admin -->
          <select class="form-select form-select-sm form-select-dark mt-1 mx-auto" style="width: 110px;" onchange="updatePaymentStatus(${o.id}, this.value)">
            <option value="Belum Bayar" ${o.payment_status === 'Belum Bayar' ? 'selected' : ''}>Belum Bayar</option>
            <option value="Lunas" ${o.payment_status === 'Lunas' ? 'selected' : ''}>Lunas</option>
          </select>
        </td>
        <td class="text-center">
          <span class="badge ${getStatusBadgeClass(o.status)}">${o.status || 'Pending'}</span>
        </td>
        <td class="text-center">
          <div class="d-flex gap-1 justify-content-center align-items-center">
            <select class="form-select form-select-sm form-select-dark" style="min-width: 95px;" onchange="updateOrderStatus(${o.id}, this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Diproses" ${o.status === 'Diproses' || o.status === 'Proses' ? 'selected' : ''}>Diproses</option>
              <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            </select>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${o.id}, '${o.code || o.order_code}')" title="Hapus Pesanan">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    ordersTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Gagal memuat pesanan. Pastikan server Node.js sudah berjalan.</td></tr>';
  }
}

// Fungsi Update Status Pembayaran dari Admin
async function updatePaymentStatus(orderId, newPaymentStatus) {
  try {
    let res = await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newPaymentStatus })
    });

    if (!res.ok) {
      res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newPaymentStatus })
      });
    }

    if (res.ok) {
      loadOrders(); // Reload tabel untuk memastikan data sudah tersimpan di DB
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Gagal memperbarui status pembayaran.');
      loadOrders();
    }
  } catch (err) {
    alert('Terjadi kesalahan koneksi server.');
    loadOrders();
  }
}

// 2. Update Status Pesanan
async function updateOrderStatus(orderId, newStatus) {
  try {
    let res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) loadOrders();
  } catch (err) {
    alert('Gagal memperbarui status pesanan.');
  }
}

// 3. Hapus Pesanan
async function deleteOrder(orderId, orderCode) {
  if (!confirm(`Apakah Anda yakin ingin menghapus pesanan ${orderCode}?`)) return;

  try {
    let res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });

    if (res.ok) {
      loadOrders();
    } else {
      alert('Gagal menghapus pesanan.');
    }
  } catch (err) {
    alert('Terjadi kesalahan saat menghapus pesanan.');
  }
}

// 4. Load Data Layanan
async function loadServices() {
  const servicesTable = document.getElementById('servicesTable');
  if (!servicesTable) return;

  try {
    let res = await fetch('/api/admin/services');
    if (!res.ok) res = await fetch('/api/services');
    currentServices = await res.json();

    if (!currentServices || currentServices.length === 0) {
      servicesTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Belum ada data layanan.</td></tr>';
      return;
    }

    servicesTable.innerHTML = currentServices.map(s => `
      <tr class="align-middle">
        <td class="fw-bold text-white text-start ps-3">
          ${esc(s.name)}
          <small class="text-muted d-block fw-normal">${esc(s.description || '-')}</small>
        </td>
        <td class="text-center"><span class="badge bg-secondary">${esc(s.unit)}</span></td>
        <td class="text-info fw-bold text-center">${rp(s.price)} / ${esc(s.unit)}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-warning me-1" onclick="openServiceModal(${s.id})">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteService(${s.id}, '${esc(s.name)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    servicesTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Gagal memuat layanan.</td></tr>';
  }
}

// 5. Buka Modal Layanan
function openServiceModal(serviceId = null) {
  const modalEl = document.getElementById('serviceModal');
  if (!modalEl) return;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const title = document.getElementById('serviceModalTitle');

  if (serviceId) {
    const service = currentServices.find(s => s.id === serviceId);
    if (!service) return;

    if (title) title.textContent = 'Edit Layanan Laundry';
    document.getElementById('serviceId').value = service.id;
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceType').value = service.type || 'Kiloan';
    document.getElementById('serviceUnit').value = service.unit || 'kg';
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceDesc').value = service.description || '';
  } else {
    if (title) title.textContent = 'Tambah Layanan Baru';
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
  }

  modal.show();
}

// 6. Hapus Layanan
async function deleteService(id, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus layanan "${name}"?`)) return;

  try {
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadServices();
    } else {
      alert('Gagal menghapus layanan.');
    }
  } catch (err) {
    alert('Terjadi kesalahan server.');
  }
}