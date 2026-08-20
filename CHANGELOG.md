# Changelog

Semua perubahan penting pada project ini didokumentasikan mengikuti Semantic Versioning dan Conventional Commits.

## [6.0.2] - 2026-08-20

### New Features

- Tidak ada.

### Improvements

- Protected dashboard queries and realtime connections now start only after server session validation

### Fixed

- prevent pre-login realtime requests from invalidating login sessions
- Login no longer gets cancelled by pre-authentication PLC or SSE 401 responses

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [6.0.1] - 2026-08-20

### New Features

- Tidak ada.

### Improvements

- Regression test verifies the RBAC panel hierarchy

### Fixed

- place RBAC matrix inside user management
- Role & Permission panel is visible under Kelola User

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [6.0.0] - 2026-08-20

### New Features

- implement backend RBAC and configurable role permissions
- Backend-enforced RBAC permission policies
- Role & Permission matrix under user management

### Improvements

- Cookie sessions, CSRF protection, security audit, and protected domain mutations

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- RBAC migration backup and rollback guide

## [5.2.0] - 2026-08-14

### New Features

- move maintenance analytics into Preventive Maintenance
- Preventive Maintenance now contains remaining-life, spare-part condition, machine health, running-hours trend, maintenance cost, and replacement-frequency analytics

### Improvements

- Dashboard is focused on KPI and scalable realtime Machine Cards

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.1.1] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- Tidak ada.

### Fixed

- align FILLING PDS16 live metrics
- Act Speed and Output Count now render side by side while Running Hours remains full width

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.1.0] - 2026-08-14

### New Features

- show FILLING PDS16 output count beside act speed
- FILLING PDS16 displays Act Speed and Output Count from the same latest PostgreSQL record

### Improvements

- Machine status and running hours remain driven exclusively by Act Speed

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.0.3] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- Tidak ada.

### Fixed

- correct LINE 08 speed acquisition types
- Tunnel and Filling now use SPEED status logic after upgrading legacy machine metadata

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.0.2] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- Tidak ada.

### Fixed

- preserve backend acquisition bootstrap during legacy saves
- Legacy dashboard saves no longer revert newly activated LINE 08 acquisition

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.0.1] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- Tidak ada.

### Fixed

- activate legacy LINE 08 acquisition mappings once
- Previously inactive NAS assets are enabled once without overriding later administrator choices

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [5.0.0] - 2026-08-14

### New Features

- extend realtime acquisition to four LINE 08 machines
- Four LINE 08 machine cards use the shared PostgreSQL acquisition service

### Improvements

- Audited physical columns and timestamp indexes for latest-row acquisition

### Fixed

- Stop timeout now uses observed time when source rows are unchanged

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [4.0.4] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- simplify machine master and application settings
- Remove duplicate realtime counter and speed values from Master Mesin
- Remove SQL Console and REST API Sandbox from the application UI
- Move concise software version and product information into Settings

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [4.0.3] - 2026-08-14

### New Features

- Tidak ada.

### Improvements

- Tabel Master Spare Part membungkus teks dan adaptif di layar kecil

### Fixed

- fix spare part entry and lifetime forecasting
- Spare part baru kini disimpan secara atomik melalui ASP.NET Core API
- Prediksi sisa hari dan tanggal PM memakai kapasitas operasi terencana
- Robot Smart Assistant tidak lagi menutupi dialog pada layar mobile

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [4.0.2] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Tidak ada.

### Fixed

- handle abrupt WebSocket client disconnects
- Dashboard and assistant sockets now treat missing close handshakes as normal disconnects

### Optimizations

- Prevents routine browser reconnects from polluting Kestrel error logs

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [4.0.1] - 2026-08-11

### New Features

- Tidak ada.

### Improvements

- Default acquisition configuration survives legacy state synchronization

### Fixed

- map legacy NAS machine cards to realtime sources
- Realtime PostgreSQL values now resolve through legacy machine IDs

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- Tidak ada.

### Documentation

- Tidak ada.

## [4.0.0] - 2026-08-11

### New Features

- add PostgreSQL machine status and running-hours engine
- Realtime status engine for ten Line 07 machines
- Timestamp-based persistent running hours

### Improvements

- Responsive dynamic machine cards with live parameter labels

### Fixed

- Tidak ada.

### Optimizations

- Tidak ada.

### Breaking Changes

- Tidak ada.

### Known Issues

- A database owner must apply the additive migration because appuser has no DDL privilege
- ILE7_LABELLING_ROTA_B is missing in production and remains DATA UNAVAILABLE until provisioned
- Tunnel speed currently maps to audited velocity_belt; confirm the final engineering unit

### Documentation

- PostgreSQL deployment, migration, backup and rollback guide

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
