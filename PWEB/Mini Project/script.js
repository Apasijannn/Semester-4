// Data Menu
var menuData = [
  { id: 'm1',  name: 'Nasi Putih',     cat: 'nasi',   image: 'images/nasi-putih.png',     price: 5000,  badge: '',          desc: 'Nasi putih pulen, dimasak segar setiap hari.' },
  { id: 'm2',  name: 'Nasi Uduk',      cat: 'nasi',   image: 'images/nasi-uduk.png',      price: 7000,  badge: '',          desc: 'Nasi harum santan dengan rempah pilihan.' },
  { id: 'm3',  name: 'Nasi Kecombrang',cat: 'nasi',   image: 'images/nasi-kecombrang.png',price: 7000,  badge: '',          desc: 'Nasi dengan irisan bunga kecombrang yang segar.' },
  { id: 'm4',  name: 'Nasi Daun Jeruk',cat: 'nasi',   image: 'images/nasi-daun-jeruk.png',price: 7000,  badge: 'Favorit',   desc: 'Nasi aromatik gurih yang wangi khas daun jeruk.' },
  { id: 'm5',  name: 'Ayam Goreng',    cat: 'lauk',   image: 'images/ayam-goreng.png',    price: 10000, badge: 'Terlaris',  desc: 'Ayam goreng crispy bumbu kuning rahasia dapur Kala.' },
  { id: 'm6',  name: 'Telur Balado',   cat: 'lauk',   image: 'images/telur-balado.png',   price: 8000,  badge: '',          desc: 'Telur rebus dengan sambal balado pedas manis.' },
  { id: 'm7',  name: 'Rendang Sapi',   cat: 'lauk',   image: 'images/rendang.png',        price: 13000, badge: 'Premium',   desc: 'Daging sapi empuk, dimasak 3 jam dengan 12 rempah.' },
  { id: 'm8',  name: 'Ikan Bakar',     cat: 'lauk',   image: 'images/ikan-bakar.png',     price: 13000, badge: 'Baru',      desc: 'Ikan segar dibakar dengan bumbu kecap manis.' },
  { id: 'm9',  name: 'Sayur Sop',      cat: 'side',   image: 'images/sayur-sop.png',      price: 5000,  badge: '',          desc: 'Sayur berkuah bening dengan wortel, kentang & buncis.' },
  { id: 'm10', name: 'Mie Goreng',     cat: 'side',   image: 'images/mie-goreng.png',     price: 4000,  badge: '',          desc: 'Mie goreng gurih manis dengan kecap & bumbu spesial.' },
  { id: 'm11', name: 'Tempe Orek',     cat: 'side',   image: 'images/tempe-orek.png',     price: 5000,  badge: '',          desc: 'Tempe orek renyah manis pedas.' },
  { id: 'm12', name: 'Tumis Buncis',   cat: 'side',   image: 'images/buncis.png',         price: 5000,  badge: '',          desc: 'Sayur buncis tumis dengan bumbu khas.' },
  { id: 'm13', name: 'Sambal Bawang',  cat: 'sambal', image: 'images/sambal-bawang.png',  price: 2000,  badge: '',          desc: 'Sambal bawang pedas manis.' },
  { id: 'm14', name: 'Sambal Tomat',   cat: 'sambal', image: 'images/sambal-tomat.png',   price: 2000,  badge: '',          desc: 'Sambal tomat segar dan pedas.' },
  { id: 'm15', name: 'Sambal Kecap',   cat: 'sambal', image: 'images/sambal-kecap.png',   price: 2000,  badge: '',          desc: 'Sambal kecap manis pedas.' },
  { id: 'm16', name: 'Sambal Matah',   cat: 'sambal', image: 'images/sambal-matah.png',   price: 2000,  badge: '',          desc: 'Sambal matah khas Bali.' },
  { id: 'm17', name: 'Paket Hemat',    cat: 'paket',  image: 'images/paket-hemat.png',    price: 19000, badge: 'Hemat',     desc: 'Nasi putih + Telur Balado + Mie Goreng + Sambal Tomat.' },
  { id: 'm18', name: 'Paket Spesial',  cat: 'paket',  image: 'images/paket-spesial.png',  price: 27000, badge: 'Best Value',desc: 'Nasi daun jeruk + Rendang + Tempe Orek + Sambal Bawang.' }
];

// data pilihan custom
var customItems = {
  nasi:   [{ name: 'Nasi Putih', price: 5000 }, { name: 'Nasi Uduk', price: 7000 }, { name: 'Nasi Daun Jeruk', price: 7000 }, { name: 'Nasi Kecombrang', price: 7000 }],
  lauk:   [{ name: 'Ayam Goreng', price: 10000 }, { name: 'Telur Balado', price: 8000 }, { name: 'Rendang', price: 13000 }, { name: 'Ikan Bakar', price: 13000 }],
  side:   [{ name: 'Sayur Sop', price: 5000 }, { name: 'Mie Goreng', price: 4000 }, { name: 'Tempe Orek', price: 5000 }, { name: 'Tumis Buncis', price: 5000 }],
  sambal: [{ name: 'Sambal Bawang', price: 2000 }, { name: 'Sambal Tomat', price: 2000 }, { name: 'Sambal Kecap', price: 2000 }, { name: 'Sambal Matah', price: 2000 }]
};

// state cart & custom
var fullCart = [];
var customSelection = { nasi: null, lauk: null, side: null, sambal: null };


function showPage(page) {
  // sembunyikan semua halaman
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }

  // hilangkan active di semua nav link
  var links = document.querySelectorAll('.nav-links a');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
  }

  // tampilkan halaman yang dipilih
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'menu') renderMenu('all');

  if (page === 'order') renderOrderSummary();
}


// Menu page
function renderMenu(filter) {
  var grid = document.getElementById('menu-grid');
  var items = [];

  // filter data menu
  for (var i = 0; i < menuData.length; i++) {
    if (filter === 'all' || menuData[i].cat === filter) {
      items.push(menuData[i]);
    }
  }

  var html = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var badgeHtml = item.badge ? '<div class="menu-badge">' + item.badge + '</div>' : '';
    var catText = { nasi: 'Nasi', lauk: 'Lauk Pauk', side: 'Side Dish', sambal: 'Sambal', paket: 'Paket' }[item.cat] || item.cat;

    html += '<div class="menu-card">';
    html += '  <div class="menu-card-img">';
    html += '    ' + badgeHtml;
    html += '    <img src="' + item.image + '" alt="' + item.name + '" onerror="this.style.display=\'none\'">';
    html += '  </div>';
    html += '  <div class="menu-card-body">';
    html += '    <div class="menu-cat">' + catText + '</div>';
    html += '    <h3>' + item.name + '</h3>';
    html += '    <p>' + item.desc + '</p>';
    html += '    <div class="menu-card-footer">';
    html += '      <div class="menu-price">Rp ' + item.price.toLocaleString('id-ID') + '<small> / porsi</small></div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  }

  grid.innerHTML = html;
}

function filterMenu(btn, cat) {
  // hilangkan active dari semua tombol filter
  var btns = document.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active');
  }
  btn.classList.add('active');
  renderMenu(cat);
}


// === CART (KERANJANG) ===
function addToCart(id, event) {
  // cari item di menuData
  var item = null;
  for (var i = 0; i < menuData.length; i++) {
    if (menuData[i].id === id) {
      item = menuData[i];
      break;
    }
  }
  if (!item) return;

  // cek apakah sudah ada di keranjang
  var existing = null;
  for (var i = 0; i < fullCart.length; i++) {
    if (fullCart[i].id === id && !fullCart[i].isCustom) {
      existing = fullCart[i];
      break;
    }
  }

  if (existing) {
    existing.qty++;
  } else {
    fullCart.push({ id: item.id, name: item.name, price: item.price, image: item.image, qty: 1, isCustom: false });
  }

  updateCartBadge();
  renderFullCart();
  showToast('✅ ' + item.name + ' ditambahkan!');

  // animasi tombol +
  if (event) {
    var btn = event.target;
    if (btn.tagName === 'BUTTON') {
      btn.textContent = '✓';
      setTimeout(function() { btn.textContent = '+'; }, 1200);
    }
  }
}

function updateCartBadge() {
  var badge = document.getElementById('cart-badge');
  var total = 0;
  for (var i = 0; i < fullCart.length; i++) {
    total += fullCart[i].qty;
  }
  badge.textContent = total;
  if (total > 0) {
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}

function renderFullCart() {
  var container = document.getElementById('full-cart-items');
  var totalEl = document.getElementById('full-cart-total');
  var actionsEl = document.getElementById('full-cart-actions');

  if (fullCart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Keranjang masih kosong.</p>';
    totalEl.style.display = 'none';
    actionsEl.style.display = 'none';
    return;
  }

  var html = '';
  var total = 0;

  for (var i = 0; i < fullCart.length; i++) {
    var it = fullCart[i];
    total += it.price * it.qty;
    var imgHtml = it.image
      ? '<img src="' + it.image + '" alt="' + it.name + '" onerror="this.style.display=\'none\'">'
      : '🍽️';

    html += '<div class="cart-item">';
    html += '  <div class="cart-item-left">';
    html += '    <div class="cart-item-img">' + imgHtml + '</div>';
    html += '    <div>';
    html += '      <div class="cart-item-name">' + it.name + '</div>';
    html += '      <div class="cart-item-sub">' + (it.isCustom ? 'Paket Custom' : 'Menu Pilihan') + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="cart-item-right">';
    html += '    <div class="qty-control">';
    html += '      <button class="qty-btn" onclick="changeQty(' + i + ', -1)">−</button>';
    html += '      <span class="qty-num">' + it.qty + '</span>';
    html += '      <button class="qty-btn" onclick="changeQty(' + i + ', 1)">+</button>';
    html += '    </div>';
    html += '    <div class="cart-item-price">Rp ' + (it.price * it.qty).toLocaleString('id-ID') + '</div>';
    html += '    <button class="remove-btn" onclick="removeFromCart(' + i + ')" title="Hapus">✕</button>';
    html += '  </div>';
    html += '</div>';
  }

  container.innerHTML = html;

  document.getElementById('full-total-price').textContent = 'Rp ' + total.toLocaleString('id-ID');
  totalEl.style.display = 'block';
  actionsEl.style.display = 'flex';

  updateCartBadge();
}

function changeQty(idx, delta) {
  fullCart[idx].qty = Math.max(1, fullCart[idx].qty + delta);
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


// Custom Menu
function selectItem(cat, idx, el) {
  // hilangkan selected dari pilihan lain di kategori ini
  var siblings = el.parentElement.querySelectorAll('.option-item');
  for (var i = 0; i < siblings.length; i++) {
    siblings[i].classList.remove('selected');
  }
  el.classList.add('selected');
  customSelection[cat] = customItems[cat][idx];
  updateCustomCart();
}

function updateCustomCart() {
  var sel = customSelection;
  var items = [];
  var total = 0;

  if (sel.nasi)   { items.push({ name: sel.nasi.name,   price: sel.nasi.price,   cat: 'Nasi' }); total += sel.nasi.price; }
  if (sel.lauk)   { items.push({ name: sel.lauk.name,   price: sel.lauk.price,   cat: 'Lauk' }); total += sel.lauk.price; }
  if (sel.side)   { items.push({ name: sel.side.name,   price: sel.side.price,   cat: 'Side Dish' }); total += sel.side.price; }
  if (sel.sambal) { items.push({ name: sel.sambal.name, price: sel.sambal.price, cat: 'Sambal' }); total += sel.sambal.price; }

  var container = document.getElementById('custom-cart-items');

  if (items.length === 0) {
    container.innerHTML = '<p class="cart-empty">Belum ada yang dipilih. Pilih semua kategori di atas!</p>';
    document.getElementById('custom-cart-total').style.display = 'none';
    document.getElementById('custom-cart-actions').style.display = 'none';
    return;
  }

  var html = '';
  for (var i = 0; i < items.length; i++) {
    html += '<div class="cart-item">';
    html += '  <div class="cart-item-left">';
    html += '    <div>';
    html += '      <div class="cart-item-name">' + items[i].name + '</div>';
    html += '      <div class="cart-item-sub">' + items[i].cat + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="cart-item-price">Rp ' + items[i].price.toLocaleString('id-ID') + '</div>';
    html += '</div>';
  }
  container.innerHTML = html;

  document.getElementById('custom-total-price').textContent = 'Rp ' + total.toLocaleString('id-ID');
  document.getElementById('custom-cart-total').style.display = 'block';
  document.getElementById('custom-cart-actions').style.display = 'flex';
}

function addCustomToOrder() {
  var sel = customSelection;
  if (!sel.nasi || !sel.lauk || !sel.side || !sel.sambal) {
    showToast('⚠️ Lengkapi semua pilihan dulu ya!');
    return;
  }

  var nama = 'Custom : ' + sel.nasi.name + ' + ' + sel.lauk.name + ' + ' + sel.side.name + ' + ' + sel.sambal.name;
  var harga = sel.nasi.price + sel.lauk.price + sel.side.price + sel.sambal.price;
  var idBaru = 'custom_' + Date.now();

  fullCart.push({ id: idBaru, name: nama, price: harga, image: '', qty: 1, isCustom: true });

  updateCartBadge();
  renderFullCart();
  resetCustom();
  showToast('✅ Paket racikan ditambahkan ke keranjang!');
}

function resetCustom() {
  customSelection = { nasi: null, lauk: null, side: null, sambal: null };
  var optionItems = document.querySelectorAll('.custom-grid .option-item');
  for (var i = 0; i < optionItems.length; i++) {
    optionItems[i].classList.remove('selected');
  }
  updateCustomCart();
}


// Checkout
function renderOrderSummary() {
  var container = document.getElementById('order-summary-items');
  var totalEl = document.getElementById('order-summary-total');

  if (fullCart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Belum ada item di keranjang.</p>';
    totalEl.style.display = 'none';
    return;
  }

  var html = '';
  var subtotal = 0;
  var totalQty = 0;

  for (var i = 0; i < fullCart.length; i++) {
    var it = fullCart[i];
    subtotal += it.price * it.qty;
    totalQty += it.qty;
    html += '<div class="summary-item">';
    html += '  <span>' + it.name + ' ×' + it.qty + '</span>';
    html += '  <span>Rp ' + (it.price * it.qty).toLocaleString('id-ID') + '</span>';
    html += '</div>';
  }

  container.innerHTML = html;

  // ongkir: Rp 5.000 per 10 porsi
  var ongkir = Math.ceil(totalQty / 10) * 5000;

  // diskon 5% klo order 30 porsi atau lebih
  var diskon = 0;
  var diskonHtml = '';
  if (totalQty >= 30) {
    diskon = Math.min(subtotal * 0.05, 300000);
    diskonHtml = '<div class="summary-item" style="color:#527356"><span>Diskon (5%, min 30 porsi)</span><span>- Rp ' + diskon.toLocaleString('id-ID') + '</span></div>';
  }

  var grandTotal = subtotal - diskon + ongkir;

  totalEl.innerHTML = '<hr style="margin:10px 0; border-color:#e0d0c0;">'
    + '<div class="summary-item"><span>Subtotal</span><span>Rp ' + subtotal.toLocaleString('id-ID') + '</span></div>'
    + diskonHtml
    + '<div class="summary-item"><span>Ongkos Kirim</span><span>Rp ' + ongkir.toLocaleString('id-ID') + '</span></div>'
    + '<div class="summary-total"><span>Total Bayar</span><span>Rp ' + grandTotal.toLocaleString('id-ID') + '</span></div>';

  totalEl.style.display = 'block';
}

function submitOrder() {
  var name    = document.getElementById('ord-name').value.trim();
  var phone   = document.getElementById('ord-phone').value.trim();
  var address = document.getElementById('ord-address').value.trim();
  var date    = document.getElementById('ord-date').value;

  if (!name)    { showToast('⚠️ Nama wajib diisi!'); return; }
  if (!phone)   { showToast('⚠️ Nomor WhatsApp wajib diisi!'); return; }
  if (!address) { showToast('⚠️ Alamat wajib diisi!'); return; }
  if (!date)    { showToast('⚠️ Tanggal pengiriman wajib diisi!'); return; }
  if (fullCart.length === 0) { showToast('⚠️ Keranjang masih kosong!'); return; }

  var subtotal = 0;
  var totalQty = 0;
  for (var i = 0; i < fullCart.length; i++) {
    subtotal += fullCart[i].price * fullCart[i].qty;
    totalQty += fullCart[i].qty;
  }

  var ongkir = Math.ceil(totalQty / 10) * 5000;
  var diskon = 0;
  if (totalQty >= 30) {
    diskon = Math.min(subtotal * 0.05, 300000);
  }
  var grandTotal = subtotal - diskon + ongkir;

  // format tanggal
  var tgl = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  var pesan = 'Hai <strong>' + name + '</strong>! Pesananmu sudah diterima dan akan diantar pada <strong>' + tgl + '</strong>.';

  pesan += '<br><br>Total bayar: <strong>Rp ' + grandTotal.toLocaleString('id-ID') + '</strong>';
  pesan += '<br>Kami akan menghubungi kamu via WhatsApp ke <strong>' + phone + '</strong>.';

  document.getElementById('modal-text').innerHTML = pesan;
  document.getElementById('success-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('success-modal').classList.remove('show');

  // reset semua
  fullCart = [];
  updateCartBadge();
  document.getElementById('ord-name').value    = '';
  document.getElementById('ord-phone').value   = '';
  document.getElementById('ord-address').value = '';
  document.getElementById('ord-date').value    = '';
  document.getElementById('ord-time').value    = '';
  document.getElementById('ord-note').value    = '';

  showPage('home');
}


function showToast(msg) {
  var toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2800);
}


document.addEventListener('DOMContentLoaded', function() {
  // set minimum tanggal = besok
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var minDate = tomorrow.toISOString().split('T')[0];
  document.getElementById('ord-date').min = minDate;
  document.getElementById('ord-date').value = minDate;

  renderMenu('all');
  renderFullCart();
});