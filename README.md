# SOFTWARE PM MTN 3

<!-- SOFTWARE_VERSION:START -->
**Current Version:** `v5.1.0`
<!-- SOFTWARE_VERSION:END -->

Frontend dashboard Preventive Maintenance berbasis Next.js App Router. Selama migrasi, engine dashboard lama dipertahankan sebagai compatibility layer agar polling PHP, SSE telemetry, simulator, dan workflow CMMS tetap berfungsi.

## Menjalankan frontend

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Backend ASP.NET Core Web API

Backend menggunakan .NET 10 LTS dan berjalan pada port `5080`:

```bash
dotnet run --project backend
```

Jalankan frontend pada terminal lain:

```bash
npm run dev
```

Next.js mem-proxy `/api`, `/api.php`, dan `/sse.php` ke `http://127.0.0.1:5080`. Ubah origin dengan `BACKEND_ORIGIN` bila backend berjalan pada host lain.

Endpoint utama:

- `GET /api/health`
- `GET|PUT /api/state`
- `GET /api/telemetry/poll`
- `GET /api/telemetry/stream`
- `GET /api/plc/test`

Endpoint kompatibilitas `/api.php` dan `/sse.php` dipertahankan agar frontend lama tetap berfungsi selama migrasi bertahap.

## Smart Notification Assistant

Dashboard menyediakan Bell realtime dan popup **Smart Maintenance Assistant** untuk spare part berstatus `WARNING` atau `CRITICAL`. Sumber utama adalah tabel PostgreSQL `spare_parts`; ketika connection string belum tersedia pada lingkungan trial, service menggunakan state store tersinkronisasi sebagai fallback aman.

Konfigurasikan PostgreSQL tanpa menyimpan credential di Git:

```powershell
$env:ConnectionStrings__PostgreSQL='Host=server;Port=5432;Database=cmms;Username=cmms_app;Password=...'
```

Endpoint utama:

- `GET /api/smart-assistant/notifications`
- `GET|PUT /api/smart-assistant/preferences?username=<user>`
- `WS /api/smart-assistant/ws`

Panduan kontrak data, deployment NAS, trigger popup, dan perilaku fallback tersedia di [`docs/smart-notification-assistant.md`](docs/smart-notification-assistant.md).

## Dynamic Machine Card Dashboard

Dashboard menampilkan satu card realtime untuk setiap `machine_id` aktif. Identitas mesin, gambar, PLC tag, URL Grafana/SCADA, urutan, mode tampilan, dan field yang terlihat dikonfigurasi melalui **Master Machine** lalu disimpan oleh ASP.NET Core API.

- Grouping berdasarkan semua mesin, line, area, department, atau jenis mesin.
- Drag-and-drop pointer/keyboard menyimpan `display_order` ke database.
- Update realtime memakai WebSocket `/api/machine-dashboard/ws`; running hours tidak dihitung di browser.
- Machine Health adalah rata-rata remaining percentage spare part aktif. Tanpa spare part aktif, health ditampilkan `N/A`.
- Upload hanya menerima isi PNG/JPEG valid maksimal 5 MB, menghapus metadata, mengoptimalkan ukuran, dan memakai nama file acak yang aman.
- Aksi hapus di Master Machine menjadi soft deactivate sehingga histori, spare part, maintenance, dan running hours tetap tersimpan.

Migration PostgreSQL bersifat additive dan harus dijalankan setelah backup serta verifikasi staging. Lihat [`docs/migration-dynamic-machine-dashboard.md`](docs/migration-dynamic-machine-dashboard.md).

## Software Version Management

Modul administrasi tersedia di:

- `http://localhost:3000/software-versions` — history, pencarian/filter, audit, aturan SemVer, ekspor PDF/Excel.
- `http://localhost:3000/software-versions/V2.0.0` — Release Notes per versi.
- `http://localhost:3000/about` — metadata software dan status API.

Metadata disimpan di direktori runtime `data/`. Backup sebelum update dibuat sebagai ZIP berisi state database, konfigurasi, master data, setting user, metadata versi, audit trail, dan manifest. Direktori ini tidak dimasukkan ke Git.

Endpoint version management:

- `GET /api/software-versions/`
- `GET /api/software-versions/current`
- `GET /api/software-versions/update-check?current=V2.0.0`
- `GET /api/software-versions/{version}`
- `GET /api/software-versions/audit`
- `POST /api/software-versions/`
- `POST /api/software-versions/{version}/backup`
- `POST /api/software-versions/{version}/install`

Request instalasi menggunakan `backupBeforeUpdate: true` secara default. Jika proses update gagal, service mengembalikan data dari backup dan mencatat `Automatic Rollback` pada audit trail.

## Sinkronisasi Codex ke GitHub

Aktifkan validasi lokal satu kali setelah clone:

```bash
pnpm hooks:install
```

Lihat rencana versi tanpa mengubah file:

```bash
pnpm release:sync -- --dry-run --type feat --message "add predictive maintenance dashboard"
```

Sinkronisasi resmi menggunakan satu perintah berikut. Perintah ini menentukan versi, memperbarui dokumentasi, menjalankan test dan build, memindai konflik/secret, membuat Conventional Commit dan annotated Git tag, lalu melakukan atomic push branch + tag:

```bash
pnpm release:sync -- \
  --type feat \
  --message "add predictive maintenance dashboard" \
  --feature "Dashboard Predictive Maintenance" \
  --optimization "Optimasi query PostgreSQL"
```

Gunakan `--database-change`, `--architecture-change`, `--framework-change`, `--api-breaking`, atau `--breaking` untuk Major release. Perubahan database otomatis mewajibkan Migration Guide. Gunakan `--no-push` untuk membuat commit dan tag hanya di lokal.

Untuk repository yang belum memiliki commit pertama:

```bash
pnpm release:sync -- --bootstrap --type feat --message "initialize CMMS v2 platform"
```

Setiap tag `v*.*.*` memicu GitHub Actions untuk mengulang seluruh validasi dan membuat GitHub Release dari file `releases/<tag>.md`. Push langsung tetap diperiksa oleh pre-push hook dan CI, tetapi alur yang didukung untuk perubahan source adalah `release:sync`.
