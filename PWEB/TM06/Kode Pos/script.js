(() => {
  /* DOM refs */
  const loadingState  = document.getElementById('loading-state');
  const mainCard      = document.getElementById('main-card');
  const rowCountEl    = document.getElementById('row-count');

  const selProvinsi   = document.getElementById('sel-provinsi');
  const selKabupaten  = document.getElementById('sel-kabupaten');
  const selKecamatan  = document.getElementById('sel-kecamatan');
  const selKelurahan  = document.getElementById('sel-kelurahan');

  const resultArea    = document.getElementById('result-area');
  const resultBox     = document.getElementById('result-box');
  const resultCode    = document.getElementById('result-code');
  const resultLocation = document.getElementById('result-location');

  /* State */
  let allData = []; 

  /* Helpers */
  function uniqueSorted(arr) {
    return [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'id'));
  }

  function populateSelect(sel, values, placeholder) {
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = toTitleCase(v);
      sel.appendChild(opt);
    });
  }

  function resetSelect(sel, placeholder) {
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    sel.disabled = true;
  }

  function toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function hideResult() {
    resultArea.classList.add('hidden');
  }

  function showResult(postalCode, location) {
    resultArea.classList.remove('hidden');

    // Re-trigger animation by cloning
    resultBox.classList.remove('success', 'error');
    void resultBox.offsetWidth; // reflow

    if (postalCode && postalCode.trim() !== '') {
      resultBox.classList.add('success');
      resultCode.textContent = postalCode.trim();
      resultLocation.textContent = location;
    } else {
      resultBox.classList.add('error');
      resultCode.textContent = 'Kode pos tidak tercatat';
      resultLocation.textContent = location;
    }
  }

  /* CSV Load */
  Papa.parse('full.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(results) {
      allData = results.data;

      // Show row count in footer
      rowCountEl.textContent = allData.length.toLocaleString('id-ID');

      // Populate Provinsi
      const provinsis = uniqueSorted(allData.map(r => r.prov_name));
      populateSelect(selProvinsi, provinsis, '— Pilih Provinsi —');

      // Swap loading → card
      loadingState.classList.add('hidden');
      mainCard.classList.remove('hidden');
    },
    error(err) {
      loadingState.innerHTML = `
        <div style="color:#ef4444;font-weight:600;font-size:.95rem;">
          ⚠️ Gagal memuat data CSV.<br>
          <span style="font-weight:400;font-size:.82rem;color:#94a3b8;">
            Pastikan file <code>full.csv</code> berada di folder yang sama dengan <code>index.html</code>
            dan halaman dibuka melalui server (bukan langsung dari file sistem).
          </span>
        </div>`;
      console.error('Papa Parse error:', err);
    }
  });

  /* Event: Provinsi */
  selProvinsi.addEventListener('change', () => {
    const prov = selProvinsi.value;

    resetSelect(selKabupaten, '— Pilih Kabupaten/Kota —');
    resetSelect(selKecamatan, '— Pilih Kecamatan —');
    resetSelect(selKelurahan, '— Pilih Kelurahan/Desa —');
    hideResult();

    if (!prov) return;

    const filtered = allData.filter(r => r.prov_name === prov);
    const kabupatens = uniqueSorted(filtered.map(r => r.city_name));
    populateSelect(selKabupaten, kabupatens, '— Pilih Kabupaten/Kota —');
    selKabupaten.disabled = false;
  });

  /* Event: Kabupaten/Kota */
  selKabupaten.addEventListener('change', () => {
    const prov = selProvinsi.value;
    const city = selKabupaten.value;

    resetSelect(selKecamatan, '— Pilih Kecamatan —');
    resetSelect(selKelurahan, '— Pilih Kelurahan/Desa —');
    hideResult();

    if (!city) return;

    const filtered = allData.filter(r => r.prov_name === prov && r.city_name === city);
    const kecamatans = uniqueSorted(filtered.map(r => r.dis_name));
    populateSelect(selKecamatan, kecamatans, '— Pilih Kecamatan —');
    selKecamatan.disabled = false;
  });

  /* Event: Kecamatan */
  selKecamatan.addEventListener('change', () => {
    const prov  = selProvinsi.value;
    const city  = selKabupaten.value;
    const dis   = selKecamatan.value;

    resetSelect(selKelurahan, '— Pilih Kelurahan/Desa —');
    hideResult();

    if (!dis) return;

    const filtered = allData.filter(
      r => r.prov_name === prov && r.city_name === city && r.dis_name === dis
    );
    const kelurahans = uniqueSorted(filtered.map(r => r.subdis_name));
    populateSelect(selKelurahan, kelurahans, '— Pilih Kelurahan/Desa —');
    selKelurahan.disabled = false;
  });

  /* Event: Kelurahan/Desa */
  selKelurahan.addEventListener('change', () => {
    const prov    = selProvinsi.value;
    const city    = selKabupaten.value;
    const dis     = selKecamatan.value;
    const subdis  = selKelurahan.value;

    hideResult();

    if (!subdis) return;

    const match = allData.find(
      r =>
        r.prov_name   === prov   &&
        r.city_name   === city   &&
        r.dis_name    === dis    &&
        r.subdis_name === subdis
    );

    if (!match) {
      showResult('', `${toTitleCase(subdis)}, ${toTitleCase(dis)}`);
      return;
    }

    const location = [
      toTitleCase(match.subdis_name),
      toTitleCase(match.dis_name),
      toTitleCase(match.city_name),
      toTitleCase(match.prov_name),
    ].join(', ');

    showResult(match.postal_code, location);
  });
})();