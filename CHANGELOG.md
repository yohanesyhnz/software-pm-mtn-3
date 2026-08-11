# Changelog

Semua perubahan penting pada project ini didokumentasikan mengikuti Semantic Versioning dan Conventional Commits.

## [3.0.6] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Machine Card image layout now uses centered flex containment

### Fixed

- prevent machine images from overflowing card frames
- Machine image boxes are constrained inside the padded responsive frame

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.5] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Uploaded JPEG orientation is normalized before metadata cleanup

### Fixed

- keep uploaded machine images fully visible
- Machine photos now remain fully visible inside responsive Machine Cards

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.4] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Ship and synchronize versioned runtime scripts with each NAS release

### Fixed

- make NAS updater snapshot and self-update safely
- Prevent live database writes from aborting NAS backups

### Optimizations

- Retry health checks for up to 60 seconds before rollback

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.3] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Rate-limit login attempts per client IP

### Fixed

- optimize authentication for DS124 hardware
- Prevent NAS login and user creation from exceeding the Next.js proxy timeout

### Optimizations

- Use a configurable PBKDF2 work factor with a DS124-appropriate deployment profile

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.2] - 2026-08-10

### New Features

- Tidak ada.

### Improvements

- Store managed user passwords as PBKDF2 hashes in the backend credential store
- Verify secure reset authorization through the backend authentication API

### Fixed

- persist managed users and allow immediate login
- Persist newly managed users and allow immediate login

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.1] - 2026-08-10

### New Features

- Tidak ada.

### Improvements

- Enlarge and responsively position the Robot Assistant

### Fixed

- center responsive smart assistant dialog and enlarge robot
- Center Smart Notification popup across viewport resolutions

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [3.0.0] - 2026-08-10

### New Features

- deliver dynamic machine cards and smart maintenance assistant
- Dynamic Machine Card Dashboard configured from Master Machine
- Smart Maintenance Assistant with realtime WebSocket alerts

### Improvements

- Add responsive SCADA grouping, display modes, and accessible drag ordering

### Fixed

- Preserve machine history and spare-part relations through soft deactivation

### Optimizations

- Memoize machine cards and optimize uploaded machine images

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Add PostgreSQL migration and NAS rollback guide

## [2.2.0] - 2026-08-05

### New Features

- deliver responsive themed CMMS dashboard and NAS release
- Add responsive dark and light themes across dashboard pages, data tables, and application modals.
- Group real-time machines by production line and allow operators to arrange machine groups.
- Add corporate PredictaCore and Dankos branding with a responsive login experience.
- Build signed-checksum Synology DS124 ARM64 packages with automated update and rollback scripts.

### Improvements

- Extend automated UI regression coverage for regulated controls, responsive layouts, themes, and machine ordering.

### Fixed

- Remove redundant access-level switching and the Android simulator from the regulated interface.
- Correct full-screen layouts, light-mode readability, and viewport containment across management dialogs.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

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
