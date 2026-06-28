'use strict';

/* ===========================================
   TAMBAH PLAYBOOK BARU: tambah 1 baris di sini
   =========================================== */
const PLAYBOOKS = [
  { id: 'PB001', title: 'Login Pertama Kali ke Coretax',           file: 'playbooks/PB001.json' },
  { id: 'PB002', title: 'Memperoleh Kode Otorisasi DJP (KODJP)',   file: 'playbooks/PB002.json' },
  { id: 'PB003', title: 'Aktivasi Akun WP — Email/HP Tidak Aktif', file: 'playbooks/PB003.json' },
  { id: 'PB004', title: 'Pendaftaran NPWP WP OP Baru',             file: 'playbooks/PB004.json' },
  { id: 'PB005', title: 'Perubahan KLU Utama & Rekening Bank',     file: 'playbooks/PB005.json' },
  { id: 'PB006', title: 'Ikhtisar Profil WP (TAM 360°)',           file: 'playbooks/PB006.json' },
  { id: 'PB007', title: 'Membuat Kode Billing PPh Pasal 25',       file: 'playbooks/PB007.json' },
  { id: 'PB008', title: 'Membuat Kode Billing Pajak Final PP-23 (UMKM)', file: 'playbooks/PB008.json' },
  { id: 'PB009', title: 'SPT Tahunan PPh OP — Status Nihil',             file: 'playbooks/PB009.json' },
  { id: 'PB010', title: 'SPT Tahunan PPh OP — Status Kurang Bayar',     file: 'playbooks/PB010.json' },
  { id: 'PB011', title: 'SPT Tahunan PPh OP — Status Lebih Bayar',      file: 'playbooks/PB011.json' },
  { id: 'PB012', title: 'Pembetulan SPT Tahunan PPh OP',                file: 'playbooks/PB012.json' },
  { id: 'PB013', title: 'Pemberitahuan Penggunaan NPPN',               file: 'playbooks/PB013.json' },
  { id: 'PB014', title: 'Perubahan Alamat Utama WP OP',                 file: 'playbooks/PB014.json' },
  // { id: 'PB015', title: '...', file: 'playbooks/PB015.json' },
];

/* STATE */
let activeId    = null;
let stepsDone   = {};   // { stepIndex: true }
let totalSteps  = 0;
const cache     = {};

/* UTILS */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function el(id)   { return document.getElementById(id); }
function show(id) { const e=el(id); if(e) e.style.display=''; }
function hide(id) { const e=el(id); if(e) e.style.display='none'; }

/* ── DARK / LIGHT MODE ── */
const html = document.documentElement;
const themeBtn = el('theme-toggle');

function applyTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeBtn.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('taxai-theme', dark ? 'dark' : 'light');
}

themeBtn.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') !== 'dark');
});

// Restore saved theme
applyTheme(localStorage.getItem('taxai-theme') === 'dark');

/* ── STATE SCREENS ── */
function showState(which) {
  hide('state-empty'); hide('state-loading'); hide('state-error'); hide('pb-content');
  if (which === 'empty')   show('state-empty');
  if (which === 'loading') show('state-loading');
  if (which === 'error')   show('state-error');
  if (which === 'content') show('pb-content');
}

/* ── PROGRESS ── */
function updateProgress() {
  const done  = Object.keys(stepsDone).length;
  const pct   = totalSteps > 0 ? Math.round(done / totalSteps * 100) : 0;
  el('progress-text').textContent = done + ' / ' + totalSteps + ' langkah';
  el('progress-fill').style.width = pct + '%';
}

function resetProgress() {
  stepsDone = {};
  document.querySelectorAll('.step-card').forEach(card => card.classList.remove('done'));
  document.querySelectorAll('.btn-check').forEach(btn => {
    btn.classList.remove('checked');
    btn.textContent = '✓ Selesai';
  });
  updateProgress();
}

el('btn-reset').addEventListener('click', resetProgress);
el('btn-print').addEventListener('click', () => window.print());

/* ── RENDER SIDEBAR ── */
function renderList(items) {
  el('pb-count').textContent = items.length;
  const list = el('pb-list');
  if (!items.length) {
    list.innerHTML = '<div class="pb-no-result">Tidak ditemukan.</div>';
    return;
  }
  list.innerHTML = items.map(pb => `
    <div class="pb-item${activeId===pb.id?' active':''}" data-id="${esc(pb.id)}" tabindex="0" role="button" aria-pressed="${activeId===pb.id}">
      <span class="pb-item-id">${esc(pb.id)}</span>
      <span class="pb-item-title">${esc(pb.title)}</span>
    </div>`).join('');

  list.querySelectorAll('.pb-item').forEach(item => {
    item.onclick    = () => selectPlaybook(item.dataset.id);
    item.onkeydown  = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectPlaybook(item.dataset.id); } };
  });
}

/* ── KEYBOARD NAVIGATION ── */
document.addEventListener('keydown', e => {
  // ↑↓ navigasi sidebar
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const items = [...document.querySelectorAll('.pb-item')];
    if (!items.length) return;
    const idx   = items.findIndex(i => i.dataset.id === activeId);
    let next    = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
    next = Math.max(0, Math.min(next, items.length - 1));
    items[next].focus();
    e.preventDefault();
  }
});

/* ── FETCH JSON ── */
async function fetchJSON(id) {
  if (cache[id]) return cache[id];
  const entry = PLAYBOOKS.find(p => p.id === id);
  if (!entry) throw new Error('Playbook ' + id + ' tidak ditemukan dalam konfigurasi.');
  const res = await fetch(entry.file);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + entry.file);
  const data = await res.json();
  cache[id] = data;
  return data;
}

/* ── SELECT ── */
async function selectPlaybook(id) {
  if (activeId === id) return;
  activeId = id;
  stepsDone = {};
  renderList(PLAYBOOKS);
  showState('loading');
  closeSidebar();
  try {
    const pb = await fetchJSON(id);
    render(pb);
    showState('content');
    el('main-panel').scrollTop = 0;
  } catch(err) {
    el('error-msg').textContent = err.message;
    showState('error');
  }
}

/* ── RENDER PLAYBOOK ── */
function render(pb) {
  el('pb-id').textContent   = pb.id   || '';
  el('pb-type').textContent = pb.type || '';
  el('pb-title').textContent  = pb.title  || '';
  el('pb-module').textContent = pb.module || '—';
  el('pb-time').textContent   = pb.estimated_time || '—';
  el('pb-objective').textContent = pb.objective || '—';

  const d = el('pb-difficulty');
  d.textContent = pb.difficulty || '';
  d.className   = 'pb-difficulty ' + ({mudah:'difficulty-mudah',menengah:'difficulty-menengah',sulit:'difficulty-sulit'}[pb.difficulty]||'');

  el('pb-prereq').innerHTML = (pb.prerequisites||[]).map(p=>`<li>${esc(p)}</li>`).join('') || '<li>—</li>';

  renderSteps(pb.navigation || []);
  renderErrors(pb.possible_errors || []);

  el('pb-success').textContent = pb.success_result || '—';
  el('pb-refs').innerHTML = (pb.references||[]).map(r=>`<li>${esc(r)}</li>`).join('') || '<li>—</li>';

  const notes = pb.notes || [];
  if (notes.length) { show('section-notes'); el('pb-notes-list').innerHTML = notes.map(n=>`<li>${esc(n)}</li>`).join(''); }
  else { hide('section-notes'); }

  el('pb-verified').textContent = pb.verified ? 'Ya' : 'Belum';
  el('pb-revision').textContent = pb.revision  || '1';
  el('pb-date').textContent     = pb.last_review || '—';
}

/* ── RENDER STEPS ── */
function renderSteps(steps) {
  totalSteps = steps.length;
  stepsDone  = {};
  updateProgress();

  const c = el('pb-steps');
  if (!steps.length) { c.innerHTML = '<p style="color:var(--text-faint);font-size:13px">Tidak ada langkah.</p>'; return; }

  c.innerHTML = steps.map((s, i) => {
    const last  = i === steps.length - 1;
    const klik  = s.click  && s.click  !== '-' ? `<div class="step-row"><span class="step-label">Klik</span><span class="step-value">${esc(s.click)}</span></div>`  : '';
    const input = s.input  && s.input  !== '-' ? `<div class="step-row"><span class="step-label">Input</span><span class="step-value">${esc(s.input)}</span></div>`  : '';
    const layar = s.expected_screen             ? `<div class="step-expected"><span class="step-label">Layar</span><span class="step-value">${esc(s.expected_screen)}</span></div>` : '';
    const note  = s.note   && s.note   !== '-' ? `<div class="step-note">💡 ${esc(s.note)}</div>` : '';
    const menu  = s.menu   && s.menu   !== '-' ? `<span class="step-menu">${esc(s.menu)}</span>`  : '';
    const page  = s.page   && s.page   !== '-' ? `<span class="step-page">${esc(s.page)}</span>`  : '';

    // Teks ringkas untuk copy
    const copyText = [
      'Langkah ' + s.step + (s.menu && s.menu!=='-' ? ' — ' + s.menu : ''),
      s.click  && s.click  !== '-' ? 'Klik: '  + s.click  : '',
      s.input  && s.input  !== '-' ? 'Input: ' + s.input  : '',
      s.expected_screen             ? 'Layar: ' + s.expected_screen : '',
      s.note   && s.note   !== '-' ? 'Catatan: ' + s.note : '',
    ].filter(Boolean).join('\n');

    return `<div class="step-card" data-step="${i}">
      ${!last ? '<div class="step-line"></div>' : ''}
      <div class="step-num">${s.step}</div>
      <div class="step-body">
        <div class="step-meta">${menu}${page}</div>
        <div class="step-card-inner">
          <div class="step-action-row">${klik}${input}</div>
          ${layar}${note}
          <div class="step-footer">
            <button class="btn-copy" data-copy="${esc(copyText)}">📋 Salin</button>
            <button class="btn-check" data-step="${i}">✓ Selesai</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Event: Salin
  c.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.copy).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ Disalin!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });

  // Event: Centang selesai
  c.querySelectorAll('.btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx  = parseInt(btn.dataset.step);
      const card = c.querySelector('.step-card[data-step="' + idx + '"]');
      if (stepsDone[idx]) {
        delete stepsDone[idx];
        card.classList.remove('done');
        btn.classList.remove('checked');
        btn.textContent = '✓ Selesai';
      } else {
        stepsDone[idx] = true;
        card.classList.add('done');
        btn.classList.add('checked');
        btn.textContent = '✓ Done';
      }
      updateProgress();
    });
  });
}

/* ── RENDER ERRORS ── */
function renderErrors(errors) {
  const c = el('pb-errors');
  if (!errors.length) { c.innerHTML = '<p style="color:var(--text-faint);font-size:13px">Tidak ada error yang diidentifikasi.</p>'; return; }
  c.innerHTML = errors.map(e => `
    <div class="error-card">
      <div class="error-card-header"><div class="error-label">Error</div><div class="error-msg">${esc(e.error)}</div></div>
      <div class="error-card-body">
        <div class="error-cause"><span class="label">Penyebab</span><span class="val">${esc(e.cause)}</span></div>
        <div class="error-solution"><span class="label">Solusi</span><span class="val">${esc(e.solution)}</span></div>
      </div>
    </div>`).join('');
}

/* ── SEARCH ── */
el('search-input').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  el('search-clear').classList.toggle('visible', q.length > 0);
  const filtered = q ? PLAYBOOKS.filter(pb => (pb.id+' '+pb.title).toLowerCase().includes(q)) : PLAYBOOKS;
  renderList(filtered);
});
el('search-clear').addEventListener('click', () => {
  el('search-input').value = '';
  el('search-clear').classList.remove('visible');
  renderList(PLAYBOOKS);
  el('search-input').focus();
});

/* ── MOBILE SIDEBAR ── */
function openSidebar()  { el('sidebar').classList.add('open');    el('sidebar-overlay').classList.add('visible');    el('sidebar-overlay').style.display='block'; }
function closeSidebar() { el('sidebar').classList.remove('open'); el('sidebar-overlay').classList.remove('visible'); el('sidebar-overlay').style.display='none'; }
el('sidebar-toggle').addEventListener('click', () => el('sidebar').classList.contains('open') ? closeSidebar() : openSidebar());
el('sidebar-overlay').addEventListener('click', closeSidebar);

/* ── INIT ── */
showState('empty');
renderList(PLAYBOOKS);
/* =========================================================
   HARGA LAYANAN PER PLAYBOOK
   ─────────────────────────────────────────────────────────
   Ubah harga tier di TIER_HARGA.
   Tambah PB baru: satu baris di HARGA_PB.

   TIER:
   'tier1' = Rp150.000 → cek/lihat/billing (cepat)
   'tier2' = Rp200.000 → aktivasi & perubahan data
   'tier3' = Rp300.000 → pelaporan SPT & layanan kompleks
   ========================================================= */

const TIER_HARGA = {
  tier1: { harga: 'Rp200.000', label: 'Layanan Cek & Billing'         },
  tier2: { harga: 'Rp250.000', label: 'Pendampingan Teknis'           },
  tier3: { harga: 'Rp300.000', label: 'Pendampingan SPT'              },
  tier4: { harga: 'Rp400.000', label: 'Pendampingan SPT Lebih Bayar'  },
};

const HARGA_PB = {
  'PB001': { tier: 'tier2', keterangan: 'login berhasil dan passphrase tersimpan dengan benar'         },
  'PB002': { tier: 'tier2', keterangan: 'KODJP aktif dan siap digunakan untuk tanda tangan digital'    },
  'PB003': { tier: 'tier2', keterangan: 'akun berhasil diaktivasi kembali dengan data kontak terbaru'  },
  'PB004': { tier: 'tier2', keterangan: 'NPWP berhasil terdaftar dan akun Coretax aktif'               },
  'PB005': { tier: 'tier2', keterangan: 'KLU dan rekening bank berhasil diperbarui di Coretax'         },
  'PB006': { tier: 'tier1', keterangan: 'ikhtisar profil WP tampil lengkap dan dapat dibaca'           },
  'PB007': { tier: 'tier1', keterangan: 'kode billing PPh Pasal 25 berhasil dibuat dan siap dibayar'   },
  'PB008': { tier: 'tier1', keterangan: 'kode billing PPh Final UMKM berhasil dibuat dan siap dibayar' },
  'PB009': { tier: 'tier3', keterangan: 'SPT Tahunan Nihil berhasil dilaporkan dan BPE diterima'       },
  'PB010': { tier: 'tier3', keterangan: 'SPT Tahunan Kurang Bayar berhasil dilaporkan dan dibayar'     },
  'PB011': { tier: 'tier4', keterangan: 'SPT Tahunan Lebih Bayar berhasil dilaporkan dan proses restitusi dimulai' },
  // Tambahkan PB baru di sini — saya isi otomatis setiap generate PB baru:
  'PB012': { tier: 'tier3', keterangan: 'SPT Tahunan Pembetulan berhasil dilaporkan dan data perpajakan WP sudah diperbarui' },
  'PB013': { tier: 'tier2', keterangan: 'BPE Pemberitahuan NPPN berhasil diterbitkan dan WP dapat menggunakan NPPN di SPT Tahunan' },
  'PB014': { tier: 'tier2', keterangan: 'Alamat Utama WP berhasil diperbarui di Coretax tanpa harus ke KPP' },
  // 'PB015': { tier: 'tier2', keterangan: '...' },
};

function getHarga(id) {
  const entry = HARGA_PB[id];
  if (!entry) return { harga: 'Rp200.000', label: 'Pendampingan Teknis', keterangan: 'proses selesai dengan benar sesuai ketentuan DJP' };
  const tier  = TIER_HARGA[entry.tier];
  return { harga: tier.harga, label: tier.label, keterangan: entry.keterangan };
}

/* =========================================================
   REPLY GENERATOR — dari data JSON lokal, tanpa API
   ========================================================= */

function generateLocalReply(pb) {
  const body = document.getElementById('ai-reply-body');
  const btn  = document.getElementById('btn-generate');
  body.classList.add('visible');

  const judul     = pb.title || '';
  const langkah   = pb.navigation || [];
  const errors    = pb.possible_errors || [];
  const prereq    = pb.prerequisites || [];
  const tipePajak = pb.type || '';
  const { harga, label, keterangan } = getHarga(pb.id);

  // Konteks singkat per tipe
  let konteks = '';
  if (tipePajak === 'login')           konteks = 'Proses ini tidak bisa dilakukan dengan cara biasa — dibutuhkan jalur khusus dan beberapa tahap verifikasi yang harus dilalui secara berurutan.';
  else if (tipePajak === 'sertifikat') konteks = 'Tanda tangan elektronik ini dibutuhkan untuk menandatangani seluruh dokumen perpajakan di Coretax dan prosesnya melibatkan verifikasi identitas digital.';
  else if (tipePajak === 'pembayaran') konteks = 'Pembuatan kode billing harus dilakukan dengan memilih kode pajak yang tepat — salah pilih kode berarti pembayaran tidak akan tercatat dengan benar di sistem DJP.';
  else if (tipePajak === 'spt')        konteks = 'Pelaporan SPT di Coretax berbeda dari sistem lama — alur pengisian, lampiran, penandatanganan digital, dan pembayaran saling terhubung dan tidak bisa dilakukan sembarangan.';
  else if (tipePajak === 'profil')     konteks = 'Data yang tampil di sini bersumber dari seluruh proses perpajakan WP dan perlu dipahami dengan benar agar tidak menimbulkan kesalahan interpretasi.';
  else                                 konteks = 'Proses ini membutuhkan beberapa tahap teknis yang harus dilakukan secara berurutan di sistem Coretax DJP.';

  // Langkah awal
  const s1 = langkah[0] || null;
  let langkahAwal = '';
  if (s1) {
    const parts = [
      s1.page  && s1.page  !== '-' ? s1.page  : '',
      s1.click && s1.click !== '-' ? s1.click : '',
      s1.input && s1.input !== '-' ? s1.input : '',
    ].filter(Boolean);
    langkahAwal = parts.slice(0, 2).join(' → ');
  }
  if (!langkahAwal) langkahAwal = 'buka https://coretaxdjp.pajak.go.id dan login menggunakan NIK/NPWP 16 digit';

  // Kendala spesifik dari JSON — ambil semua, format dengan risiko
  let kendalaList = '';
  if (errors.length > 0) {
    kendalaList = errors.map(e => {
      // Jika ada solusi yang menyebut "tidak bisa dipulihkan" atau "ulang dari awal", tambahkan penekanan
      const ada_risiko = e.solution && (
        e.solution.includes('ulang') ||
        e.solution.includes('awal') ||
        e.solution.includes('baru') ||
        e.solution.includes('tidak dapat')
      );
      return e.error + (ada_risiko ? ' (dan jika ini terjadi, prosesnya harus diulang dari awal)' : '');
    }).join('; ');
  }

  // ── VERSI WHATSAPP ──
  const wa =
`Halo, terima kasih sudah menghubungi kami 🙏

Untuk ${judul}, ${konteks}

Kendala yang paling sering terjadi: ${kendalaList || 'proses tidak berjalan karena urutan langkah yang tidak tepat'}. Setiap tahap harus dilakukan secara berurutan dan tidak bisa diulang sembarangan jika ada yang terlewat.

Jika ingin mencoba sendiri, Bapak/Ibu bisa mulai dari: ${langkahAwal}.

Jika ingin kami bantu dari awal sampai selesai, biaya ${label} kami ${harga} — sudah termasuk memastikan ${keterangan}. Hubungi kami untuk konfirmasi ya 😊`;

  // ── VERSI EMAIL ──
  const email =
`Yth. Bapak/Ibu,

Terima kasih atas pertanyaan Anda mengenai ${judul}.

${konteks}${prereq.length > 0 ? ' Sebelum memulai, terdapat beberapa hal yang perlu disiapkan dan diverifikasi terlebih dahulu.' : ''}

Kendala yang paling sering terjadi dalam proses ini: ${kendalaList || 'urutan langkah yang tidak tepat sehingga proses harus diulang dari awal'}. Setiap tahap harus dilakukan secara berurutan dan tidak bisa diulang sembarangan jika ada yang terlewat.

Jika Bapak/Ibu ingin mencoba menyelesaikan sendiri, langkah awalnya adalah: ${langkahAwal}.

Apabila mengalami kendala atau ingin memastikan prosesnya berjalan benar sejak awal, kami menyediakan ${label} dengan biaya ${harga}. Dengan layanan ini, kami pastikan ${keterangan}.

Silakan hubungi kami untuk informasi lebih lanjut.

Hormat kami`;

  renderReplies(wa.trim(), email.trim());
  btn.textContent = '✨ Generate Ulang';
}

function renderReplies(wa, email) {
  const body = document.getElementById('ai-reply-body');
  body.innerHTML = `
    <div class="ai-versions">
      <div class="ai-version-card">
        <div class="ai-version-header">
          <span class="ai-version-label">📱 Versi WhatsApp / Chat</span>
          <button class="btn-copy-reply" data-text="${esc(wa)}">📋 Salin</button>
        </div>
        <div class="ai-version-text">${esc(wa)}</div>
      </div>
      <div class="ai-version-card">
        <div class="ai-version-header">
          <span class="ai-version-label">📧 Versi Email Profesional</span>
          <button class="btn-copy-reply" data-text="${esc(email)}">📋 Salin</button>
        </div>
        <div class="ai-version-text">${esc(email)}</div>
      </div>
    </div>`;

  body.querySelectorAll('.btn-copy-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = btn.dataset.text
        .replace(/&amp;/g,'&').replace(/&lt;/g,'<')
        .replace(/&gt;/g,'>').replace(/&quot;/g,'"');
      navigator.clipboard.writeText(txt).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ Disalin!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });
}

document.getElementById('btn-generate').addEventListener('click', () => {
  const pb = activeId ? cache[activeId] : null;
  if (!pb) return;
  generateLocalReply(pb);
});
