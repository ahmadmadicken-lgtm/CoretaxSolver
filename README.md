# TaxAI Indonesia — Playbook Viewer

Website: https://konsultasipajakgratis.com/ai

---

## Struktur Folder

```
/ai
├── index.html        → Kerangka HTML (jarang diubah)
├── style.css         → Seluruh tampilan (jarang diubah)
├── app.js            → Logika utama (jarang diubah)
├── playbooks.js      → ⭐ DAFTAR PLAYBOOK — edit file ini saat menambah playbook baru
├── README.md         → Panduan ini
│
└── /playbooks        → Folder berisi semua file JSON Playbook
    ├── PB001.json
    ├── PB002.json
    ├── PB003.json
    ├── PB004.json
    ├── PB005.json
    ├── PB006.json
    └── PB007.json    ← contoh file baru
```

---

## Cara Menambah Playbook Baru

### Langkah 1 — Buat file JSON
Simpan file JSON playbook baru di folder `/playbooks/`.
Contoh: `PB007.json`

### Langkah 2 — Daftarkan di playbooks.js
Buka `playbooks.js`, tambahkan satu baris:

```js
{ id: 'PB007', title: 'Membuat Kode Billing PPh Pasal 25', file: 'playbooks/PB007.json' },
```

### Langkah 3 — Selesai
Tidak ada file lain yang perlu diubah.

---

## File yang TIDAK perlu diubah saat menambah playbook

- `index.html` — tidak perlu diubah
- `style.css` — tidak perlu diubah
- `app.js` — tidak perlu diubah

**Satu-satunya file yang perlu diedit: `playbooks.js`**

---

## Playbook yang Sudah Ada

| ID    | Judul                                        |
|-------|----------------------------------------------|
| PB001 | Login Pertama Kali ke Coretax                |
| PB002 | Memperoleh Kode Otorisasi DJP (KODJP)        |
| PB003 | Aktivasi Akun WP — Email/HP Tidak Aktif      |
| PB004 | Pendaftaran NPWP WP OP Baru                  |
| PB005 | Perubahan KLU Utama & Rekening Bank          |
| PB006 | Ikhtisar Profil WP (TAM 360°)                |

---

## Hosting di GitHub Pages

1. Push seluruh folder `/ai` ke repository GitHub
2. Aktifkan GitHub Pages dari Settings → Pages
3. Arahkan domain `konsultasipajakgratis.com/ai` ke GitHub Pages
