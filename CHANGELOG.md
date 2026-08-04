# Changelog

Semua perubahan penting pada project ini didokumentasikan mengikuti Semantic Versioning dan Conventional Commits.

## [2.1.3] - 2026-08-04

### New Features

- Tidak ada.

### Improvements

- enforce mandatory Next.js and .NET 10 architecture rules

### Fixed

- fix responsive rendering and secure local authentication
- restore responsive rendering across mobile and desktop resolutions
- authenticate local users through the ASP.NET Core Web API

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Synology NAS synchronization still requires the external service to be reachable

### Documentation

- document frontend, backend, security, and validation requirements

## [2.1.2] - 2026-08-04

### New Features

- Tidak ada.

### Improvements

- add manual GitHub Release recovery trigger
- GitHub Release workflow can be rerun manually for an existing tag

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- GitHub connector currently reports read-only repository permission

### Documentation

- Document release recovery input in workflow

## [2.1.1] - 2026-08-04

### New Features

- Tidak ada.

### Improvements

- Record Codex GitHub source synchronization in audit trail

### Fixed

- synchronize runtime version metadata and file counts
- Runtime About and Version History now follow version.json
- Release summary now counts staged Git files accurately

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- GitHub connector currently reports read-only repository permission

### Documentation

- Tidak ada.

## [2.1.0] - 2026-08-04

### New Features

- add automated Codex GitHub release flow
- Automatic Semantic Versioning based on change type
- Automatic changelog and release notes generation
- GitHub Actions release publishing

### Improvements

- Atomic branch and tag push

### Fixed

- Remove hardcoded default credentials from legacy source

### Optimizations

- Fail-fast validation before commit and push

### Breaking Changes

- Tidak ada.

### Known Issues

- GitHub connector currently reports read-only repository permission

### Documentation

- Add Codex synchronization workflow and migration documentation

## [2.0.0] - 2026-08-04

### New Features

- Software Version History, Release Notes, About Software, dan Update Checker.
- Backup sebelum update, rollback otomatis, dan audit trail administrator.
- Frontend Next.js App Router dan backend ASP.NET Core Web API.

### Improvements

- Navigasi dashboard terintegrasi dengan modul Version Management.
- Desain SCADA industrial yang responsif.

### Fixed

- Isolasi compatibility script dashboard lama pada halaman utama.

### Optimizations

- Static rendering Next.js dan persistence metadata versi secara atomik.

### Breaking Changes

- Migrasi arsitektur frontend dan backend serta perubahan struktur project.
- Penambahan struktur data Software Version Management.

### Known Issues

- Koneksi PostgreSQL dan PLC produksi memerlukan jaringan NAS/pabrik.

### Documentation

- Dokumentasi endpoint version management dan proses backup/rollback.
