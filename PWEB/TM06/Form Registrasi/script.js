// Daftar nama mahasiswa untuk autocomplete
const daftarNama = [
    "Sitti Aminah",
    "Muhammad Dayyan Ghazanfar Latief",
    "Fazle Mawla Wahyuhanda",
    "Ahmad Naufal Farras",
    "Royan Harits Yustanto",
    "Mochammad Henry Alifian",
    "Muhammad Aditya Nugraha",
    "Faiz Akbar Hizbullah",
    "Muhammad Fathur Aziz",
    "Marvel Mahanara",
    "Syahri Banun",
    "Belvany Virginia Kenetta Setiawan",
    "Jylan Annisa Mumtaza Syidana",
    "Shabrinna Sarayati"
];

let activeIndex = -1;

// Mengambil inisial dari nama 
function getInitials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Highlight teks yang cocok dengan query
function highlight(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx)
        + '<span class="match">' + text.slice(idx, idx + query.length) + '</span>'
        + text.slice(idx + query.length);
}

// Menampilkan dropdown autocomplete berdasarkan input
function cariNama(input) {
    const val = input.value.trim();
    const list = document.getElementById('ac-list');
    activeIndex = -1;

    if (!val) {
        list.classList.remove('open');
        return;
    }

    const matches = daftarNama.filter(n => n.toLowerCase().includes(val.toLowerCase()));

    if (!matches.length) {
        list.classList.remove('open');
        return;
    }

    list.innerHTML = matches.map((name) => `
        <div class="autocomplete-item" data-val="${name}" onmousedown="pilihNama('${name.replace(/'/g, "\\'")}')">
            <div class="autocomplete-avatar">${getInitials(name)}</div>
            <span>${highlight(name, val)}</span>
        </div>
    `).join('');

    list.classList.add('open');
}

// Memilih nama dari dropdown
function pilihNama(name) {
    const inputNama = document.getElementById('nama');
    inputNama.value = name;
    document.getElementById('ac-list').classList.remove('open');
    setValid('nama');
}

// Navigasi dropdown dengan keyboard
function handleKey(e) {
    const list = document.getElementById('ac-list');
    const items = list.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        pilihNama(items[activeIndex].dataset.val);
        return;
    } else if (e.key === 'Escape') {
        list.classList.remove('open');
        return;
    }

    items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: 'nearest' });
}

// Tutup dropdown saat klik di luar area nama
document.addEventListener('click', function(e) {
    if (!e.target.closest('#wrap-nama')) {
        const acList = document.getElementById('ac-list');
        if (acList) acList.classList.remove('open');
    }
});

// --- Validasi State ---

function setError(field) {
    const el = document.getElementById(field);
    el.classList.add('error');
    el.classList.remove('valid');
    document.getElementById('err-' + field).classList.add('show');
}

function setValid(field) {
    const el = document.getElementById(field);
    el.classList.remove('error');
    el.classList.add('valid');
    const errEl = document.getElementById('err-' + field);
    if (errEl) errEl.classList.remove('show');
}

function clearState(field) {
    const el = document.getElementById(field);
    el.classList.remove('error', 'valid');
    const errEl = document.getElementById('err-' + field);
    if (errEl) errEl.classList.remove('show');
}

// Live validation saat pindah field (blur)
['nama', 'nrp', 'matakuliah', 'dosen'].forEach(function(id) {
    document.getElementById(id).addEventListener('blur', function() {
        if (this.value.trim()) {
            setValid(id);
        } else {
            clearState(id);
        }
    });
});

// --- Submit Form ---

function validasiForm(e) {
    e.preventDefault();
    const fields = ['nama', 'nrp', 'matakuliah', 'dosen'];
    let valid = true;

    fields.forEach(function(id) {
        const val = document.getElementById(id).value.trim();
        if (!val) {
            setError(id);
            valid = false;
        } else {
            setValid(id);
        }
    });

    if (!valid) return false;

    // Tampilkan pesan sukses
    const nama = document.getElementById('nama').value;
    const mk = document.getElementById('matakuliah').value;
    document.getElementById('successMsg').textContent =
        nama + ' telah berhasil didaftarkan pada mata kuliah ' + mk + '.';
    document.getElementById('successOverlay').classList.add('show');
}

// --- Reset Form ---

function resetForm() {
    document.getElementById('formPendaftaran').reset();
    ['nama', 'nrp', 'matakuliah', 'dosen'].forEach(clearState);
    document.getElementById('successOverlay').classList.remove('show');
}