# Smart Notification Assistant

## Arsitektur

- Frontend: Client Component React + TypeScript pada boundary kecil di halaman dashboard.
- Data cache: TanStack React Query.
- Realtime: WebSocket same-origin `/api/smart-assistant/ws` dengan reconnect eksponensial.
- Dialog: primitive Radix Dialog yang digunakan oleh pola Shadcn UI; menyediakan focus trap, ESC, dan dismiss dari overlay.
- Animasi: Framer Motion dan CSS transform dengan durasi 600–900 ms serta dukungan `prefers-reduced-motion`.
- Styling: Tailwind CSS v3 dengan prefix `tw-` dan preflight dimatikan agar compatibility layer dashboard tidak berubah.
- Backend: ASP.NET Core Web API `.NET 10` dengan Npgsql.

## Sumber PostgreSQL

Service membaca tabel `spare_parts` dan hanya mengembalikan status `WARNING` atau `CRITICAL`:

```sql
SELECT
    machine_name,
    part_name,
    remaining_hours,
    remaining_percentage,
    status,
    next_replacement_date,
    last_replacement_date
FROM spare_parts
WHERE UPPER(status) IN ('WARNING', 'CRITICAL');
```

Hasil diurutkan dengan `CRITICAL` terlebih dahulu, lalu `WARNING`, kemudian berdasarkan `remaining_percentage` dan `remaining_hours` terkecil.

Connection string dibaca dari konfigurasi ASP.NET Core bernama `PostgreSQL`. Gunakan environment variable agar credential tidak masuk repository:

```text
ConnectionStrings__PostgreSQL=Host=...;Port=5432;Database=...;Username=...;Password=...
```

Jika koneksi belum dikonfigurasi atau sementara tidak tersedia, endpoint tetap hidup menggunakan `backend/data/database.json`. Respons menandai sumber sebagai `state-store-fallback`; fallback ini ditujukan untuk trial dan pemulihan, bukan pengganti PostgreSQL produksi.

## Kontrak WebSocket

Server mengirim snapshot saat koneksi dibuka dan setiap fingerprint notifikasi berubah:

```json
{
  "type": "smart-notifications",
  "data": {
    "notifications": [],
    "total": 0,
    "criticalCount": 0,
    "warningCount": 0,
    "highestSeverity": "HEALTHY",
    "source": "postgresql",
    "updatedAt": "2026-08-10T00:00:00Z"
  }
}
```

Monitor backend memeriksa perubahan sumber setiap tiga detik. Browser tidak melakukan polling; perubahan dikirim melalui WebSocket dan hanya memperbarui Bell/list. Popup tidak dibuka otomatis oleh frame realtime.

## Siklus popup

- Login berhasil: popup dapat tampil satu kali setelah dashboard selesai dirender.
- Refresh: aplikasi meminta autentikasi ulang; login berikutnya memulai satu siklus popup baru.
- Logout dan login ulang: flag siklus direset.
- Menutup popup tidak menghapus notifikasi dari Bell.
- Klik Bell selalu dapat membuka kembali daftar selama Smart Assistant aktif.

Auto popup hanya dibuka bila daftar memiliki minimal satu notifikasi dan ketiga preferensi user mengizinkannya.

## Preferensi

Preferensi tersimpan per username pada storage runtime `backend/data/smart-assistant-preferences.json`:

- `enableSmartAssistant`
- `enableRobotAnimation`
- `enableAutoPopup`

File berada di direktori data yang tidak dilacak Git dan ikut dipertahankan oleh shared data NAS.

## Konfigurasi Synology NAS

Buat file berikut pada NAS, di luar direktori release:

```text
/volume1/homes/YAO/predictacore/shared/config/smart-assistant.env
```

Isi dengan connection string yang diberi quote:

```sh
ConnectionStrings__PostgreSQL='Host=10.x.x.x;Port=5432;Database=cmms;Username=cmms_app;Password=...'
```

Batasi permission file:

```sh
chmod 600 /volume1/homes/YAO/predictacore/shared/config/smart-assistant.env
```

`scripts/nas/start.sh` memuat file ini bila tersedia. Jangan menaruh credential pada `appsettings.json`, Git, release notes, atau log aplikasi.
