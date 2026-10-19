  // ===== DATA =====
  const menuData = [
    { id: 'm1', name: 'Nasi Putih', cat: 'nasi', image: 'images/nasi-putih.png', price: 5000, desc: 'Nasi putih pulen, dimasak segar setiap hari.', badge: '' },
    { id: 'm4', name: 'Nasi Daun Jeruk', cat: 'nasi', image: 'images/nasi-daun-jeruk.png', price: 7000, desc: 'nasi aromatik gurih yang wangi khas daun jeruk purut.', badge: 'Favorit' },
    { id: 'm2', name: 'Nasi Uduk', cat: 'nasi', image: 'images/nasi-uduk.png', price: 7000, desc: 'Nasi harum santan dengan rempah pilihan.', badge: '' },
    { id: 'm3', name: 'Nasi Kecombrang', cat: 'nasi', image: 'images/nasi-kecombrang.png', price: 7000, desc: 'Nasi dengan irisan bunga kecombrang yang segar & wangi.', badge: '' },
    { id: 'm5', name: 'Ayam Goreng', cat: 'lauk', image: 'images/ayam-goreng.png', price: 10000, desc: 'Ayam goreng crispy bumbu kuning rahasia dapur Kala.', badge: 'Terlaris' },
    { id: 'm6', name: 'Telur Balado', cat: 'lauk', image: 'images/telur-balado.png', price: 8000, desc: 'Telur rebus dengan sambal balado pedas manis.', badge: '' },
    { id: 'm7', name: 'Rendang Sapi', cat: 'lauk', image: 'images/rendang.png', price: 13000, desc: 'Daging sapi empuk, dimasak 3 jam dengan 12 rempah.', badge: 'Premium' },
    { id: 'm8', name: 'Ikan Bakar', cat: 'lauk', image: 'images/ikan-bakar.png', price: 13000, desc: 'Ikan segar dibakar dengan bumbu kecap manis legit.', badge: 'Baru' },
    { id: 'm9', name: 'Sayur Sop', cat: 'side', image: 'images/sayur-sop.png', price: 5000, desc: 'Sayur berkuah bening dengan wortel, kentang & buncis.', badge: '' },
    { id: 'm10', name: 'Mie Goreng', cat: 'side', image: 'images/mie-goreng.png', price: 4000, desc: 'Mie goreng gurih manis dengan kecap & bumbu spesial.', badge: '' },
    { id: 'm11', name: 'Tempe Orek', cat: 'side', image: 'images/tempe-orek.png', price: 5000, desc: 'Tempe orek renyah manis pedas dengan aroma daun kemangi.', badge: '' },
    { id: 'm12', name: 'Tumis Buncis', cat: 'side', image: 'images/buncis.png', price: 5000, desc: 'Sayur buncis tumis dengan bumbu khas', badge: '' },
    { id: 'm13', name: 'Sambal Bawang', cat: 'sambal', image: 'images/sambal-bawang.png', price: 2000, desc: 'Sambal bawang pedas manis.', badge: '' },
    { id: 'm14', name: 'Sambal Tomat', cat: 'sambal', image: 'images/sambal-tomat.png', price: 2000, desc: 'Sambal tomat segar dan pedas.', badge: '' },
    { id: 'm15', name: 'Sambal Kecap', cat: 'sambal', image: 'images/sambal-kecap.png', price: 2000, desc: 'Sambal kecap manis pedas.', badge: '' },
    { id: 'm16', name: 'Sambal Matah', cat: 'sambal', image: 'images/sambal-matah.png', price: 2000, desc: 'Sambal matah khas Bali.', badge: '' },
    { id: 'm17', name: 'Paket Hemat', cat: 'paket', image: 'images/paket-hemat.png', price: 19000, desc: 'Nasi putih + Telur Balado + Mie Goreng dengan sambal tomat.', badge: 'Hemat' },
    { id: 'm18', name: 'Paket Spesial', cat: 'paket', image: 'images/paket-spesial.png', price: 27000, desc: 'Nasi daun jeruk + Rendang + Tempe orek dengan sambal bawang.', badge: 'Best Value' }  
];

  let fullCart = [];
  let customSelection = { nasi: null, lauk: null, side: null, sambal: null };

  const customItems = {
    nasi: [
      { name: 'Nasi Putih', price: 5000 },
      { name: 'Nasi Uduk', price: 7000 },
      { name: 'Nasi Daun Jeruk', price: 7000 },
      { name: 'Nasi Kecombrang', price: 7000 },
    ],
    lauk: [
      { name: 'Ayam Goreng', price: 10000 },
      { name: 'Telur Balado', price: 8000 },
      { name: 'Rendang', price: 13000 },
      { name: 'Ikan Bakar', price: 13000 }
    ],
    side: [
      { name: 'Sayur Sop', price: 5000 },
      { name: 'Mie Goreng', price: 4000 },
      { name: 'Tempe Orek', price: 5000 },
      { name: 'Tumis Buncis', price: 5000 }
    ],
    sambal: [
      { name: 'Sambal Bawang', price: 2000 },
      { name: 'Sambal Tomat', price: 2000 },
      { name: 'Sambal Kecap', price: 2000 },
      { name: 'Sambal Matah', price: 2000 }
    ]
  };

  const packageData = {
    'm15': { name: 'Paket Hemat', price: 19000},
    'm16': { name: 'Paket Spesial', price: 27000},
  };

  // ===== NAVIGATION =====
  function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('nav-' + page).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'menu') renderMenu('all');
    if (page === 'order') renderOrderSummary();
  }

  // ===== MENU PAGE LOGIC =====
  function renderMenu(filter) {
    const grid = document.getElementById('menu-grid');
    const items = filter === 'all' ? menuData : menuData.filter(m => m.cat === filter);
    grid.innerHTML = items.map(item => `
      <div class="menu-card" data-cat="${item.cat}">
        <div class="menu-card-img">
          ${item.badge ? `<div class="menu-card-badge">${item.badge}</div>` : ''}
          ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<div style=\\'font-size:40px;\\'>${item.emoji}</div>'"/>` : `<div style="font-size:40px;">${item.emoji}</div>`}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-cat">${catLabel(item.cat)}</div>
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="menu-card-footer">
            <div class="menu-price">Rp ${item.price.toLocaleString('id-ID')}<span>/porsi</span></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function catLabel(c) {
    return { nasi: 'Nasi', lauk: 'Lauk Pauk', side: 'Side Dish', paket: 'Paket', sambal: 'Sambal' }[c] || c;
  }

  function filterMenu(btn, cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMenu(cat);
  }

  function addToCart(id, event) {
    const item = menuData.find(m => m.id === id);
    if (!item) return;
    const existing = fullCart.find(c => c.id === id && !c.isCustom);
    if (existing) {
      existing.qty++;
    } else {
      fullCart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, image: item.image, qty: 1, isCustom: false });
    }
    updateCartBadge();
    renderFullCart();
    showToast('✅ ' + item.name + ' ditambahkan!');
    if (event) {
      const btn = event.target;
      if(btn.tagName === 'BUTTON') {
          btn.classList.add('added');
          btn.textContent = '✓';
          setTimeout(() => { btn.classList.remove('added'); btn.textContent = '+'; }, 1200);
      }
    }
  }

  // ===== CUSTOM PAGE LOGIC =====
  function selectItem(cat, idx, el) {
    el.parentElement.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    customSelection[cat] = customItems[cat][idx];
    updateCustomCart();
  }

  function updateCustomCart() {
    const sel = customSelection;
    const items = [];
    let total = 0;

    if (sel.nasi) { items.push({ ...sel.nasi, cat: 'Nasi' }); total += sel.nasi.price; }
    if (sel.lauk) { items.push({ ...sel.lauk, cat: 'Lauk' }); total += sel.lauk.price; }
    if (sel.side) { items.push({ ...sel.side, cat: 'Side Dish' }); total += sel.side.price; }
    if (sel.sambal) { items.push({ ...sel.sambal, cat: 'Sambal' }); total += sel.sambal.price; }

    const container = document.getElementById('custom-cart-items');
    if (items.length === 0) {
      container.innerHTML = '<div class="cart-empty">Belum ada yang dipilih. Pilih nasi, lauk, side dish, dan sambal di atas!</div>';
      document.getElementById('custom-cart-actions').style.display = 'none';
      document.getElementById('custom-cart-total').style.display = 'none';
      return;
    }

    container.innerHTML = items.map(it => `
      <div class="cart-item">
        <div class="cart-item-left">
          <div>
            <div class="cart-item-name">${it.name}</div>
            <div class="cart-item-cat">${it.cat}</div>
          </div>
        </div>
        <div class="cart-item-price">Rp ${it.price.toLocaleString('id-ID')}</div>
      </div>
    `).join('');

    document.getElementById('custom-total-price').textContent = 'Rp ' + total.toLocaleString('id-ID');
    document.getElementById('custom-cart-total').style.display = 'flex';
    document.getElementById('custom-cart-actions').style.display = 'flex';
  }

  function addCustomToOrder() {
    const sel = customSelection;
    if (!sel.nasi || !sel.lauk || !sel.side || !sel.sambal) {
      showToast('⚠️ Lengkapi pilihan Nasi, Lauk, Side Dish, dan Sambal terlebih dahulu!');
      return;
    }
    const customId = 'custom_' + Date.now();
    const customName = `Paket Custom: ${sel.nasi.name} + ${sel.lauk.name} + ${sel.side.name} + ${sel.sambal.name}`;
    const customPrice = sel.nasi.price + sel.lauk.price + sel.side.price + sel.sambal.price;
    
    fullCart.push({ id: customId, name: customName, price: customPrice, emoji: '🍱', qty: 1, isCustom: true });
    
    updateCartBadge();
    renderFullCart();
    resetCustom();
    showToast('✅ Paket racikan ditambahkan ke keranjang!');
  }

  function resetCustom() {
    customSelection = { nasi: null, lauk: null, side: null, sambal: null };
    document.querySelectorAll('.custom-grid .option-item').forEach(i => i.classList.remove('selected'));
    updateCustomCart();
  }

  function addPackageToCart(id, event) {
    // Reusing the existing addToCart logic since packages are in menuData
    addToCart(id, null); 
    // Small animation effect on the card itself
    if(event) {
        let el = event.currentTarget;
        el.style.transform = 'scale(0.95)';
        setTimeout(()=> { el.style.transform = 'none'; }, 150);
    }
  }

  // ===== FULL CART LOGIC =====
  function renderFullCart() {
    const container = document.getElementById('full-cart-items');
    if (fullCart.length === 0) {
      container.innerHTML = '<div class="cart-empty">Keranjang masih kosong.</div>';
      document.getElementById('full-cart-total').style.display = 'none';
      document.getElementById('full-cart-actions').style.display = 'none';
      return;
    }

    let total = 0;
    container.innerHTML = fullCart.map((it, i) => {
      total += it.price * it.qty;
      const icon = it.image ? `<img src="${it.image}" alt="${it.name}" onerror="this.outerHTML='<div style=\\'font-size:26px;\\'>${it.emoji}</div>'"/>` : (it.emoji || '🍽️');
      return `
        <div class="cart-item">
          <div class="cart-item-left">
            <div class="cart-item-emoji">${icon}</div>
            <div>
              <div class="cart-item-name">${it.name}</div>
              <div class="cart-item-cat">${it.isCustom ? 'Paket Custom' : 'Menu Pilihan'}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            <div class="qty-control">
              <button class="qty-btn" onclick="changeQty(${i}, -1)">−</button>
              <input type="number" class="qty-input" value="${it.qty}" onchange="updateManualQty(${i}, this.value)" min="1">
              <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
            </div>
            <div class="cart-item-price">Rp ${(it.price * it.qty).toLocaleString('id-ID')}</div>
            <button onclick="removeFromCart(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:18px;padding:4px;" title="Hapus">✕</button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('full-total-price').textContent = 'Rp ' + total.toLocaleString('id-ID');
    document.getElementById('full-cart-total').style.display = 'flex';
    document.getElementById('full-cart-actions').style.display = 'flex';
    updateCartBadge();
  }

  function changeQty(idx, delta) {
    fullCart[idx].qty = Math.max(1, fullCart[idx].qty + delta);
    renderFullCart();
  }

  function updateManualQty(idx, val) {
  // Parsing string menjadi integer
  let newQty = parseInt(val);
  
  // Validasi: Jika input kosong (NaN) atau kurang dari 1, paksa menjadi 1
  if (isNaN(newQty) || newQty < 1) {
    newQty = 1;
  }
  
  // Update data array dan render ulang
  fullCart[idx].qty = newQty;
  renderFullCart();
}


  function removeFromCart(idx) {
    fullCart.splice(idx, 1);
    renderFullCart();
    updateCartBadge();
  }

  function clearFullCart() {
    fullCart = [];
    renderFullCart();
    updateCartBadge();
    showToast('🗑️ Keranjang dikosongkan.');
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = fullCart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = total;
    if (total > 0) badge.classList.add('show'); else badge.classList.remove('show');
  }

  // ===== ORDER / CHECKOUT =====
function renderOrderSummary() {
  const container = document.getElementById('order-summary-items');
  const totalEl = document.getElementById('order-summary-total');

  if (fullCart.length === 0) {
    container.innerHTML = '<div class="order-empty-msg">Belum ada item di keranjang.</div>';
    totalEl.style.display = 'none';
    return;
  }

  let subtotal = 0;
  let totalQty = 0; // Variabel baru untuk menghitung total porsi

  container.innerHTML = fullCart.map(it => {
    subtotal += it.price * it.qty;
    totalQty += it.qty; // Hitung akumulasi porsi
    return `
      <div class="summary-item">
        <span class="summary-item-name">${it.emoji || '🍽️'} ${it.name} ×${it.qty}</span>
        <span class="summary-item-price">Rp ${(it.price * it.qty).toLocaleString('id-ID')}</span>
      </div>
    `;
  }).join('');

// Hapus atau ganti baris: let ongkir = 5000;
  
  // Logika Ongkir: Rp 5.000 untuk setiap kelipatan 10 porsi (dibulatkan ke atas)
  // Jika totalQty = 0, ongkir harus 0. Mencegah bug ongkir muncul saat keranjang kosong.
  let ongkir = totalQty > 0 ? Math.ceil(totalQty / 10) * 5000 : 0;

  let diskon = 0;
  let diskonElement = '';

  if (totalQty >= 30) {
    diskon = Math.min(subtotal * 0.05, 300000); 
    
    diskonElement = `
      <div class="summary-item" style="align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="summary-item-name" style="color: var(--accent); font-weight: 600;">Diskon (5%)</span>
          <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500; opacity: 0.8;">
            *Min. pembelian 30 porsi, maks potongan Rp 300.000
          </span>
        </div>
        <span class="summary-item-price" style="color: var(--accent); font-weight: 600;">- Rp ${diskon.toLocaleString('id-ID')}</span>
      </div>
    `;
  }

  const grandTotal = subtotal - diskon + ongkir;

  // Timpa struktur HTML bawaan agar kalkulasi dinamis
  totalEl.innerHTML = `
    <div class="summary-divider"></div>
    <div class="summary-item">
      <span class="summary-item-name">Subtotal</span>
      <span class="summary-item-price">Rp ${subtotal.toLocaleString('id-ID')}</span>
    </div>
    ${diskonElement}
    <div class="summary-item">
      <span class="summary-item-name">Ongkos Kirim</span>
      <span class="summary-item-price">Rp ${ongkir.toLocaleString('id-ID')}</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-total">
      <span class="summary-total-label">Total Bayar</span>
      <span class="summary-total-price">Rp ${grandTotal.toLocaleString('id-ID')}</span>
    </div>
  `;
  
  totalEl.style.display = 'block';
}

function submitOrder() {
  const name = document.getElementById('ord-name').value.trim();
  const phone = document.getElementById('ord-phone').value.trim();
  const address = document.getElementById('ord-address').value.trim();
  const date = document.getElementById('ord-date').value;

  if (!name) { showToast('⚠️ Nama wajib diisi!'); return; }
  if (!phone) { showToast('⚠️ Nomor WhatsApp wajib diisi!'); return; }
  if (!address) { showToast('⚠️ Alamat wajib diisi!'); return; }
  if (!date) { showToast('⚠️ Tanggal pengiriman wajib diisi!'); return; }
  if (fullCart.length === 0) { showToast('⚠️ Keranjang masih kosong!'); return; }

  let subtotal = 0;
  let totalQty = 0;
  
  fullCart.forEach(i => {
    subtotal += i.price * i.qty;
    totalQty += i.qty;
  });

let diskon = 0;
  let pesanDiskon = '';
  
  if (totalQty >= 30) {
    diskon = Math.min(subtotal * 0.10, 300000);
    pesanDiskon = `<br><span style="color:var(--accent);"><em>(Termasuk Diskon: - Rp ${diskon.toLocaleString('id-ID')})</em></span>`;
  }

  // Ubah perhitungan ongkir di sini juga
  let ongkir = totalQty > 0 ? Math.ceil(totalQty / 10) * 5000 : 0;
  let grandTotal = subtotal - diskon + ongkir;

  document.getElementById('modal-text').innerHTML = `
    Hai <strong>${name}</strong>! Pesananmu sudah kami terima dan akan diantar pada <strong>${formatDate(date)}</strong>.
    ${pesanDiskon}
    <br><br>Total pembayaran: <strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong>
    <br>Kami akan menghubungi kamu melalui WhatsApp ke <strong>${phone}</strong>.
  `;
  document.getElementById('success-modal').classList.add('show');
}

  function formatDate(d) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(d).toLocaleDateString('id-ID', opts);
  }

  function closeModal() {
    document.getElementById('success-modal').classList.remove('show');
    fullCart = [];
    updateCartBadge();
    document.getElementById('ord-name').value = '';
    document.getElementById('ord-phone').value = '';
    document.getElementById('ord-address').value = '';
    document.getElementById('ord-date').value = '';
    document.getElementById('ord-time').value = '';
    document.getElementById('ord-note').value = '';
    showPage('home');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('ord-date').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('ord-date').value = tomorrow.toISOString().split('T')[0];

    renderMenu('all');
    renderFullCart();
  });