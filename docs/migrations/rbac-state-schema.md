# Migrasi RBAC Backend

## Ringkasan

Backend menambahkan `rbac.schema_version = 1` dan matriks permission pada state persisten. Migrasi dilakukan otomatis dan tidak mengubah atau menghapus data mesin, spare part, user, running hours, maupun histori maintenance.

Role sistem tetap `ADMIN`, `SUPERVISOR`, dan `TECHNICIAN`. Administrator dapat mengubah permission masing-masing role dari **Kelola User → Role & Permission**. Backend mengevaluasi permission terbaru pada setiap request sehingga perubahan berlaku tanpa build ulang aplikasi.

## Persiapan dan backup

1. Hentikan container aplikasi.
2. Salin direktori `backend/data` atau volume data NAS ke lokasi backup bertanggal.
3. Pastikan file state dan credential tidak dimasukkan ke Git.
4. Jalankan versi baru; bootstrap RBAC menambahkan node yang belum ada secara idempotent.

## Rollback

1. Hentikan container versi baru.
2. Pulihkan image/container versi sebelumnya.
3. Node `rbac` aman dibiarkan karena versi lama mengabaikan field yang tidak dikenalnya. Jika regulasi mengharuskan rollback persis, pulihkan backup direktori data.

## Kontrol keselamatan

- Minimal satu role yang sedang digunakan user wajib memiliki `users.manage` dan `rbac.manage`; perubahan yang mengunci seluruh administrator ditolak backend.
- Perubahan matriks dicatat ke `backend/data/security-audit.jsonl` pada runtime.
- Cookie session bersifat `HttpOnly` dan `SameSite=Strict`; operasi mutasi memerlukan token anti-CSRF.
- Akses ditolak oleh backend dengan HTTP 401/403, bukan hanya dengan menyembunyikan tombol.
