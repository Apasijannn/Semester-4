// Karsa — myITS Connector
// Content script: scrape tugas + status pengumpulan dari myITS Classroom (Moodle)

(function () {
  const path = window.location.pathname;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getCourseName() {
    // Halaman course: h1 di page header
    const h1 = document.querySelector('.page-header-headings h1');
    if (h1) return h1.textContent.trim();

    // Halaman assignment: cari link breadcrumb menuju /course/view.php
    const crumbLink = document.querySelector(
      'ol.breadcrumb a[href*="/course/view.php"], nav[aria-label] a[href*="/course/view.php"]'
    );
    if (crumbLink) return crumbLink.textContent.trim();

    return 'Unknown';
  }

  // Parse "Thursday, 12 March 2026, 8:00 AM" atau "12 Juli 2026, 23:59" → ISO string
  function parseDeadline(text) {
    if (!text) return null;

    // Bersihkan prefix "Due:" / "Tenggat:"
    const cleaned = text.replace(/^(?:Due|Tenggat|Deadline)[:\s]*/i, '').trim();

    const MONTHS = {
      jan: 0, january: 0, januari: 0,
      feb: 1, february: 1, februari: 1,
      mar: 2, march: 2, maret: 2,
      apr: 3, april: 3,
      may: 4, mei: 4,
      jun: 5, june: 5, juni: 5,
      jul: 6, july: 6, juli: 6,
      aug: 7, august: 7, agustus: 7,
      sep: 8, september: 8,
      oct: 9, october: 9, oktober: 9,
      nov: 10, november: 10,
      dec: 11, december: 11, desember: 11
    };

    // Hapus nama hari (Monday, Tuesday, …, Senin, Selasa, …) di awal
    const withoutDay = cleaned.replace(
      /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),\s*/i,
      ''
    );

    // Coba native Date.parse (handles "12 March 2026, 8:00 AM")
    const native = Date.parse(withoutDay);
    if (!isNaN(native)) return new Date(native).toISOString();

    // Manual parse: "12 March 2026, 8:00 AM" atau "12 Juli 2026 23:59"
    const m = withoutDay.match(
      /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i
    );
    if (m) {
      const [, day, monthStr, year, rawH, rawM, ampm] = m;
      const mon = MONTHS[monthStr.toLowerCase()];
      if (mon !== undefined) {
        let h = parseInt(rawH ?? '23', 10);
        const min = parseInt(rawM ?? '59', 10);
        if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
        const d = new Date(parseInt(year, 10), mon, parseInt(day, 10), h, min);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }

  // Normalise URL ke "pathname?id=XXX" agar deduplicate tetap bekerja
  // meski ada parameter tambahan seperti &action=editsubmission
  function normalizeUrl(url) {
    try {
      const u = new URL(url);
      const id = u.searchParams.get('id');
      return id ? `${u.origin}${u.pathname}?id=${id}` : url;
    } catch {
      return url;
    }
  }

  // ── Scrapers ─────────────────────────────────────────────────────────────────

  // /my/ atau /dashboard/ — timeline upcoming events
  function scrapeDashboard() {
    const tasks = [];
    const items = document.querySelectorAll(
      '[data-region="event-list-item"], .event-item'
    );

    items.forEach((el) => {
      // Nama event bisa berada di berbagai elemen
      const nameEl = el.querySelector(
        '[data-region="event-name"], .event-name, h6, .eventname-content'
      );
      if (!nameEl) return;
      const title = nameEl.textContent.trim();
      if (!title) return;

      const linkEl = nameEl.closest('a') || el.querySelector('a[href*="/mod/"]');
      const dateEl = el.querySelector(
        '[data-region="event-list-item-date"], time, .date'
      );
      const deadlineText = dateEl
        ? dateEl.getAttribute('datetime') || dateEl.textContent.trim()
        : null;
      const courseEl = el.querySelector(
        '[data-region="event-course"], .course-fullname, .coursename'
      );

      tasks.push({
        title,
        deadlineText,
        deadline: parseDeadline(deadlineText),
        url: normalizeUrl(linkEl ? linkEl.href : window.location.href),
        course: courseEl ? courseEl.textContent.trim() : 'Unknown',
        scrapedAt: Date.now()
      });
    });

    return tasks;
  }

  // /course/view.php — daftar aktivitas dalam satu course
  // Selector didasarkan pada DevTools myITS Classroom:
  //   li.activity.assign → container assignment
  //   .activityname a.aalink → link tugas (teks bersih, tanpa suffix "Assignment")
  //   [data-region="activity-dates"] → berisi "Opened: … Due: …"
  function scrapeCoursePage() {
    const tasks = [];
    const course = getCourseName();

    document.querySelectorAll('li.activity.assign, li.activity.modtype_assign').forEach((el) => {
      // Ambil link dari .activityname > a.aalink  (bukan .instancename yang menyertakan hidden "Assignment")
      const linkEl = el.querySelector(
        '.activityname a.aalink, .activityname a[href*="/mod/assign/"], a.aalink.stretched-link'
      );
      if (!linkEl) return;

      const title = linkEl.textContent.trim();
      if (!title) return;

      // Tanggal dari [data-region="activity-dates"]
      const datesEl = el.querySelector('[data-region="activity-dates"], .activity-dates');
      let deadlineText = null;
      if (datesEl) {
        const dueMatch = datesEl.textContent.match(/(?:Due|Tenggat):\s*([^\n\r]+)/i);
        if (dueMatch) deadlineText = dueMatch[1].trim();
      }

      tasks.push({
        title,
        deadlineText,
        deadline: parseDeadline(deadlineText),
        url: normalizeUrl(linkEl.href),
        course,
        scrapedAt: Date.now()
      });
    });

    return tasks;
  }

  // /mod/assign/view.php — halaman detail tugas
  // Deteksi otomatis apakah tugas sudah dikumpulkan.
  function scrapeAssignmentPage() {
    const titleEl = document.querySelector('.page-header-headings h1');
    const title = titleEl ? titleEl.textContent.trim() : null;
    if (!title) return null;

    const course = getCourseName();

    // Due date — cari pola "Due: <dayname>, DD Month YYYY, H:MM AM/PM" di seluruh halaman
    let deadlineText = null;
    const bodyText = document.body.innerText || '';
    const dueMatch = bodyText.match(
      /(?:Due|Tenggat):\s*([A-Za-z]+day,\s*\d{1,2}\s+\w+\s+\d{4},?\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i
    );
    if (dueMatch) deadlineText = dueMatch[1].trim();

    // Status pengumpulan — scan semua baris tabel untuk "Submission status"
    // Moodle standard: <th>Submission status</th><td>Submitted for grading</td>
    let isSubmitted = false;
    let statusText = '';

    document.querySelectorAll('table tr').forEach((row) => {
      const th = row.querySelector('th');
      const td = row.querySelector('td');
      if (th && td && /submission status|status pengumpulan/i.test(th.textContent)) {
        statusText = td.textContent.trim();
      }
    });

    // Fallback: div.submissionstatustable (beberapa tema Moodle)
    if (!statusText) {
      const div = document.querySelector('.submissionstatustable');
      if (div) statusText = div.textContent;
    }

    if (statusText) {
      // "Submitted for grading" → sudah; "No attempt" / "Nothing has been submitted" → belum
      isSubmitted = /submitted for grading|sudah dikumpulkan/i.test(statusText);
    }

    return {
      title,
      deadlineText,
      deadline: parseDeadline(deadlineText),
      // Normalise URL — hilangkan &action=editsubmission dsb
      url: normalizeUrl(window.location.href),
      course,
      isSubmitted,
      scrapedAt: Date.now()
    };
  }

  // ── Entry point ──────────────────────────────────────────────────────────────

  function run() {
    // Halaman detail assignment → kirim TASK_UPDATE (termasuk status submitted)
    if (path.includes('/mod/assign/view.php')) {
      const task = scrapeAssignmentPage();
      if (task) {
        chrome.runtime.sendMessage({
          type: 'TASK_UPDATE',
          task,
          url: task.url
        });
      }
      return;
    }

    let tasks = [];

    if (path.includes('/my/') || path.includes('/dashboard')) {
      tasks = scrapeDashboard();
    } else if (path.includes('/course/view.php')) {
      tasks = scrapeCoursePage();
    } else {
      // Fallback: coba dashboard scraping
      tasks = scrapeDashboard();
    }

    if (tasks.length > 0) {
      chrome.runtime.sendMessage({
        type: 'TASKS_SCRAPED',
        tasks,
        url: window.location.href
      });
    }
  }

  run();
  window.__karsaRunScrape = run;
})();
