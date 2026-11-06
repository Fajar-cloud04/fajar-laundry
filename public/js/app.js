let services = [];
const $ = (id) => document.getElementById(id);

async function loadServices() {
  services = await api('/api/services');
  
  // Render daftar layanan dengan layout 2 kolom persis seperti di foto
  $('serviceList').innerHTML = services.map((s) => `
    <div class="col-md-6">
      <div class="service-price-card d-flex justify-content-between align-items-center p-4">
        <div>
          <h3 class="h5 fw-bold mb-1 text-white">${esc(s.name)}</h3>
          <p class="small text-muted mb-0">${esc(s.description || 'Layanan laundry berkualitas')}</p>
        </div>
        <div class="text-end ms-3 text-nowrap">
          <span class="fs-5 fw-bold text-info">${rp(s.price)}/${s.unit}</span>
        </div>
      </div>
    </div>
  `).join('') || '<div class="col-12"><p class="text-muted">Belum ada layanan.</p></div>';

  // Isi dropdown pada form booking
  $('service_id').innerHTML = serviceOptions(services);
  updateEstimate();
}

function updateEstimate() {
  const s = services.find((x) => x.id == $('service_id').value);
  if (!s) return;
  $('unitLabel').textContent = s.unit;
  $('estimate').textContent = rp(s.price * (parseFloat($('quantity').value) || 0));
}
$('service_id').onchange = $('quantity').oninput = updateEstimate;

// Penanganan Submit Form Booking (Desain Card Pembayaran Premium)
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    bookingMsg.innerHTML = '<div class="alert alert-info py-2 small mt-2 rounded-3 text-center">Mengirim pesanan...</div>';

    const paymentMethod = document.getElementById('payment_method').value;

    const payload = {
      customer_name: document.getElementById('customer_name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      pickup_at: document.getElementById('pickup_at').value,
      address: document.getElementById('address').value.trim(),
      service_id: parseInt(document.getElementById('service_id').value),
      quantity: parseFloat(document.getElementById('quantity').value),
      payment_method: paymentMethod,
      notes: document.getElementById('notes').value.trim()
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && (data.success || data.code || data.order_code)) {
        const orderCode = data.code || data.order_code;
        const total = data.total || data.total_price;

        let paymentCardHtml = '';

        if (paymentMethod === 'Transfer Bank') {
          paymentCardHtml = `
            <div class="payment-box mt-3 p-3 rounded-3 text-start border border-cyan" style="background: #0d222e;">
              <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                <span class="fw-bold text-cyan d-flex align-items-center gap-1">🏦 Transfer Bank BCA</span>
                <span class="badge bg-primary text-white">Manual Transfer</span>
              </div>
              <div class="row g-2 align-items-center my-1">
                <div class="col-8">
                  <small class="text-muted d-block">Nomor Rekening BCA:</small>
                  <span class="fs-5 fw-bold text-warning letter-spacing-1" id="numToCopy">7112135327</span>
                  <small class="text-light d-block mt-1">a.n <b>Fajar Laundry</b></small>
                </div>
                <div class="col-4 text-end">
                  <button type="button" class="btn btn-sm btn-outline-info rounded-pill px-2 py-1 small" onclick="copyPaymentNum('7112135327', this)">
                    📋 Salin
                  </button>
                </div>
              </div>
              <div class="mt-2 pt-2 border-top border-secondary small text-muted">
                ⚠️ Sertakan Kode Booking <b class="text-cyan">${orderCode}</b> pada berita transfer.
              </div>
            </div>
          `;
        } else if (paymentMethod === 'E-Wallet') {
          paymentCardHtml = `
            <div class="payment-box mt-3 p-3 rounded-3 text-start border border-cyan" style="background: #0d222e;">
              <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                <span class="fw-bold text-cyan d-flex align-items-center gap-1">📱 Dompet DANA / E-Wallet</span>
                <span class="badge bg-info text-dark">Instant Pay</span>
              </div>
              <div class="row g-2 align-items-center my-1">
                <div class="col-8">
                  <small class="text-muted d-block">Nomor Virtual Account / DANA:</small>
                  <span class="fs-5 fw-bold text-warning letter-spacing-1" id="numToCopy">3901081511515636</span>
                  <small class="text-light d-block mt-1">a.n <b>Fajar Laundry</b></small>
                </div>
                <div class="col-4 text-end">
                  <button type="button" class="btn btn-sm btn-outline-info rounded-pill px-2 py-1 small" onclick="copyPaymentNum('3901081511515636', this)">
                    📋 Salin
                  </button>
                </div>
              </div>
              <div class="mt-2 pt-2 border-top border-secondary small text-muted">
                💡 Silakan kirim saldo sesuai total nominal di atas.
              </div>
            </div>
          `;
        } else {
          paymentCardHtml = `
            <div class="payment-box mt-3 p-3 rounded-3 text-start border border-secondary" style="background: #0d222e;">
              <div class="fw-bold text-warning mb-1">💵 Pembayaran Tunai (Cash)</div>
              <p class="text-muted small mb-0">Pembayaran diserahkan langsung secara tunai kepada kurir saat penjemputan/pengantaran pakaian.</p>
            </div>
          `;
        }

        bookingMsg.innerHTML = `
          <div class="card-success-popup mt-3 p-3 rounded-3 border border-cyan shadow-lg text-start" style="background: #102837;">
            <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-2">
              <h5 class="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <span class="fs-4">🎉</span> Booking Berhasil!
              </h5>
              <span class="badge bg-success text-white px-2 py-1">Terverifikasi</span>
            </div>
            
            <div class="row g-2 my-2 small">
              <div class="col-6">
                <span class="text-muted d-block">Kode Booking:</span>
                <span class="fs-5 fw-bold text-cyan">${orderCode}</span>
              </div>
              <div class="col-6 text-end">
                <span class="text-muted d-block">Total Biaya:</span>
                <span class="fs-5 fw-bold text-warning">Rp ${Number(total).toLocaleString('id-ID')}</span>
              </div>
            </div>

            ${paymentCardHtml}

            <div class="mt-3 text-center">
              <small class="text-muted">Simpan Kode Booking ini untuk melacak status cucianmu di kolom seksi Kontak.</small>
            </div>
          </div>
        `;

        bookingForm.reset();
        if (typeof updateEstimate === 'function') updateEstimate();
      } else {
        bookingMsg.innerHTML = `<div class="alert alert-danger py-2 small mt-2 rounded-3">${data.error || 'Gagal membuat pesanan.'}</div>`;
      }
    } catch (err) {
      bookingMsg.innerHTML = '<div class="alert alert-danger py-2 small mt-2 rounded-3">Gagal terhubung ke server.</div>';
    }
  });
}

// Fungsi Helper Salin Nomor Rekening / DANA Ke Clipboard
function copyPaymentNum(number, btnEl) {
  navigator.clipboard.writeText(number).then(() => {
    const originalText = btnEl.innerHTML;
    btnEl.innerHTML = '✅ Tersalin!';
    btnEl.classList.replace('btn-outline-info', 'btn-success');
    setTimeout(() => {
      btnEl.innerHTML = originalText;
      btnEl.classList.replace('btn-success', 'btn-outline-info');
    }, 2000);
  }).catch(() => {
    alert('Nomor: ' + number);
  });
}

// Fitur Cek Status Pesanan (Lengkap Waktu Jemput & Estimasi Waktu Antar)
const trackForm = $('trackForm');
if (trackForm) {
  trackForm.onsubmit = async (e) => {
    e.preventDefault();
    const trackQ = $('trackQ').value.trim();
    const trackResult = $('trackResult');
    if (!trackQ) return;

    trackResult.innerHTML = '<div class="text-center text-muted py-3 small">Mencari data pesanan...</div>';

    try {
      const rows = await api('/api/orders/track?q=' + encodeURIComponent(trackQ));

      if (!rows || rows.length === 0) {
        trackResult.innerHTML = `
          <div class="alert alert-warning py-3 text-center small mt-3 border-0 rounded-3">
            <strong>Pesanan Tidak Ditemukan</strong><br>
            <span class="text-muted">Periksa kembali Kode Booking atau Nomor HP Anda.</span>
          </div>
        `;
        return;
      }

      trackResult.innerHTML = rows.map((o) => {
        let statusBg = 'bg-info text-dark';
        if (o.status === 'Diproses' || o.status === 'Proses') statusBg = 'bg-warning text-dark';
        if (o.status === 'Selesai') statusBg = 'bg-success text-white';

        let payBg = o.payment_status === 'Lunas' ? 'bg-success text-white' : 'bg-danger text-white';

        // Hitung Estimasi Waktu Antar (Default +2 Hari dari Waktu Jemput / Express +6 Jam)
        let deliverDate = '-';
        if (o.pickup_at) {
          const pickupDateObj = new Date(o.pickup_at);
          if (!isNaN(pickupDateObj)) {
            if ((o.service_name || '').toLowerCase().includes('express')) {
              pickupDateObj.setHours(pickupDateObj.getHours() + 6);
            } else {
              pickupDateObj.setDate(pickupDateObj.getDate() + 2);
            }
            deliverDate = fmtDate(pickupDateObj.toISOString());
          }
        }

        return `
          <div class="track-card p-3 mb-3 rounded-3 border border-secondary bg-dark-card shadow-sm text-start">
            <!-- Header Kartu: Kode & Badge Status -->
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
              <div>
                <span class="fw-bold text-cyan fs-5 d-block">${o.code || o.order_code}</span>
                <small class="text-muted">Dibuat: ${fmtDate(o.created_at)}</small>
              </div>
              <div class="text-end">
                <span class="badge ${statusBg} px-3 py-2 rounded-pill fw-bold">${o.status || 'Pending'}</span>
              </div>
            </div>

            <!-- Detail Layanan & Pelanggan -->
            <div class="row g-2 small my-1">
              <div class="col-7">
                <div class="text-white fw-bold fs-6">${esc(o.service_name || o.service || 'Cuci Laundry')}</div>
                <div class="text-muted">Jumlah: <b>${o.quantity} ${o.unit || 'kg'}</b></div>
                <div class="text-light text-truncate mt-1">📍 ${esc(o.address)}</div>
              </div>
              <div class="col-5 text-end">
                <div class="text-muted">Estimasi Total:</div>
                <div class="text-warning fw-bold fs-5">${rp(o.total || o.total_price)}</div>
              </div>
            </div>

            <div class="row g-2 small my-2 p-2 rounded bg-dark border border-secondary align-items-center">
              <div class="col-6 text-center text-info border-end border-secondary">
                📅 <b>Jemput:</b>
                <div class="text-cyan fw-bold mt-1">${fmtDate(o.pickup_at)}</div>
              </div>
              <div class="col-6 text-center text-warning">
                🚚 <b>Estimasi Antar:</b>
                <div class="text-warning fw-bold mt-1">${deliverDate}</div>
              </div>
            </div>

            <!-- Footer: Status Bayar -->
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary small">
              <span class="text-muted">Metode: <b>${esc(o.payment_method)}</b></span>
              <span class="badge ${payBg} px-2 py-1">${o.payment_status || 'Belum Bayar'}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      trackResult.innerHTML = `<div class="alert alert-danger py-2 small mt-3">${esc(err.message)}</div>`;
    }
  };
}

/* ---------- Fitur Mode Gelap / Terang ---------- */
const themeBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Cek tema tersimpan di localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
  if (themeIcon) themeIcon.textContent = '🌙';
}

if (themeBtn) {
  themeBtn.onclick = () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    
    // Ubah ikon tombol
    if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
    
    // Simpan status tema ke localStorage
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  };
}

loadServices();
