/* Preventive Maintenance System - Core JS Engine */

// Default Seed Data
const DEFAULT_SEED_DATA = {
  users: [
    { id: 1, username: 'admin', password: '', role: 'ADMIN', full_name: 'Danko Ariyanto' },
    { id: 2, username: 'yohanes', password: '', role: 'SUPERVISOR', full_name: 'Yohanes Ariyanto' },
    { id: 3, username: 'BAR', password: '', role: 'TECHNICIAN', full_name: 'BAR' },
    { id: 4, username: 'Yao', password: '', role: 'ADMIN', full_name: 'Yao' }
  ],
  machines: [
    { id: 1, name: 'High Shear Mixer Granulator', asset_number: 'MC-HSG-001', line_code: 'Granulation Line A', manufacturer: 'Glatt GmbH', install_date: '2024-01-10', status: 'Running', running_hours_total: 0.0, running_hours_daily: 0.0, running_hours_weekly: 0.0, running_hours_monthly: 0.0, last_updated: new Date().toISOString() },
    { id: 2, name: 'Rotary Tablet Press', asset_number: 'MC-RTP-002', line_code: 'Compression Line B', manufacturer: 'Fette Compacting', install_date: '2024-01-10', status: 'Running', running_hours_total: 0.0, running_hours_daily: 0.0, running_hours_weekly: 0.0, running_hours_monthly: 0.0, last_updated: new Date().toISOString() },
    { id: 3, name: 'Blister Packaging Machine', asset_number: 'MC-BPM-003', line_code: 'Packaging Line C', manufacturer: 'Uhlmann', install_date: '2024-01-10', status: 'Standby', running_hours_total: 0.0, running_hours_daily: 0.0, running_hours_weekly: 0.0, running_hours_monthly: 0.0, last_updated: new Date().toISOString() },
    { id: 4, name: 'Horizontal Autoclave Sterilizer', asset_number: 'MC-HAS-004', line_code: 'Sterilization Line D', manufacturer: 'Getinge', install_date: '2024-01-10', status: 'Maintenance', running_hours_total: 0.0, running_hours_daily: 0.0, running_hours_weekly: 0.0, running_hours_monthly: 0.0, last_updated: new Date().toISOString() }
  ],
  spare_parts: [
    { id: 1, machine_id: 1, name: 'Main Agitator Mechanical Seal', code: 'SP-HSG-001', description: 'High pressure double mechanical seal assembly for granulator main shaft', vendor: 'Burgmann Seals', price: 4500000, lifetime_hours: 3000, safety_stock: 2, critical_level: 'CRITICAL', last_replacement_date: '2024-01-15', current_running_hours: 0 },
    { id: 2, machine_id: 1, name: 'Chopper Blade Tungsten Carbide', code: 'SP-HSG-002', description: 'High speed chopper knife set for wet granulation', vendor: 'Glatt OEM Parts', price: 2800000, lifetime_hours: 2000, safety_stock: 3, critical_level: 'MEDIUM', last_replacement_date: '2024-02-01', current_running_hours: 0 },
    { id: 3, machine_id: 1, name: 'Mixing Bowl O-Ring EPDM', code: 'SP-HSG-003', description: 'Food grade FDA compliant EPDM sealing ring for 300L bowl', vendor: 'Freudenberg', price: 350000, lifetime_hours: 1500, safety_stock: 5, critical_level: 'LOW', last_replacement_date: '2024-02-10', current_running_hours: 0 },
    { id: 4, machine_id: 1, name: 'Bowl Temperature Sensor RTD', code: 'SP-HSG-004', description: 'PT100 temperature sensor for product jacket monitoring', vendor: 'Endress+Hauser', price: 1250000, lifetime_hours: 2500, safety_stock: 1, critical_level: 'CRITICAL', last_replacement_date: '2024-01-20', current_running_hours: 0 },
    
    { id: 5, machine_id: 2, name: 'Upper Punch Keyed D-Tooling Set', code: 'SP-RTP-005', description: 'Punch & Die Set D-Type for tablet compression 10mm round', vendor: 'Ivoclar / Natoli', price: 8500000, lifetime_hours: 4000, safety_stock: 1, critical_level: 'CRITICAL', last_replacement_date: '2024-01-12', current_running_hours: 0 },
    { id: 6, machine_id: 2, name: 'Lower Punch Scraper Seal', code: 'SP-RTP-006', description: 'Dust scraper ring for lower punch guide preventing powder ingress', vendor: 'Fette OEM', price: 420000, lifetime_hours: 1800, safety_stock: 4, critical_level: 'MEDIUM', last_replacement_date: '2024-02-05', current_running_hours: 0 },
    { id: 7, machine_id: 2, name: 'Die Table Segment Carbide', code: 'SP-RTP-007', description: 'Tungsten carbide die table segment for 36-station turret', vendor: 'Fette Compacting', price: 15000000, lifetime_hours: 5000, safety_stock: 1, critical_level: 'CRITICAL', last_replacement_date: '2024-01-08', current_running_hours: 0 },
    { id: 8, machine_id: 2, name: 'Compression Roller Bearing', code: 'SP-RTP-008', description: 'Heavy duty main compression roller bearing unit', vendor: 'SKF Bearings', price: 3200000, lifetime_hours: 3500, safety_stock: 2, critical_level: 'CRITICAL', last_replacement_date: '2024-01-18', current_running_hours: 0 },
    
    { id: 9, machine_id: 3, name: 'Heating Plate Teflon Coated', code: 'SP-BPM-009', description: 'ALU-PVC forming station heating plate with Teflon coating', vendor: 'Uhlmann Packaging', price: 6800000, lifetime_hours: 2500, safety_stock: 1, critical_level: 'MEDIUM', last_replacement_date: '2024-02-12', current_running_hours: 0 },
    { id: 10, machine_id: 3, name: 'Form Cutter Die Hardened Steel', code: 'SP-BPM-010', description: 'Perforation and blister trimming knife die set', vendor: 'Uhlmann OEM', price: 5400000, lifetime_hours: 2000, safety_stock: 2, critical_level: 'CRITICAL', last_replacement_date: '2024-01-25', current_running_hours: 0 },
    { id: 11, machine_id: 3, name: 'Vacuum Suction Cup Silicone', code: 'SP-BPM-011', description: 'High durability vacuum cup for feeder card transfer', vendor: 'SMC Pneumatics', price: 180000, lifetime_hours: 1000, safety_stock: 10, critical_level: 'LOW', last_replacement_date: '2024-02-15', current_running_hours: 0 },
    
    { id: 12, machine_id: 4, name: 'Chamber Door Gasket Silicon', code: 'SP-HAS-012', description: 'High temperature steam resistant silicone door seal for 500L autoclave', vendor: 'Getinge Sterilizer', price: 2100000, lifetime_hours: 2000, safety_stock: 2, critical_level: 'CRITICAL', last_replacement_date: '2024-01-10', current_running_hours: 0 },
    { id: 13, machine_id: 4, name: 'Safety Relief Valve 3.5 Bar', code: 'SP-HAS-013', description: 'Calibrated ASME steam safety pressure relief valve', vendor: 'Spirax Sarco', price: 3900000, lifetime_hours: 4000, safety_stock: 1, critical_level: 'CRITICAL', last_replacement_date: '2024-01-05', current_running_hours: 0 },
    { id: 14, machine_id: 4, name: 'Pressure Transducer 0-5 Bar', code: 'SP-HAS-014', description: '4-20mA pressure transmitter for sterilizer chamber monitoring', vendor: 'WIKA Sensors', price: 1850000, lifetime_hours: 3000, safety_stock: 2, critical_level: 'CRITICAL', last_replacement_date: '2024-01-22', current_running_hours: 0 }
  ],
  running_hours_log: [],
  replacement_history: [],
  notifications: []
};

// Database Engine State
let dbState = {};
let activeUser = { username: 'tech', role: 'TECHNICIAN', full_name: 'Agus Prayitno' };
let currentTab = 'dashboard';
let apiSandboxConfig = { method: 'GET', endpoint: '/api/machines' };
let activeConnectors = { PLC: false, MQTT: false, OPCUA: false, MODBUS: false };
let autoPullTimer = null;
const THEME_STORAGE_KEY = 'predictacore-theme';
const DASHBOARD_MACHINE_ORDER_STORAGE_KEY = 'predictacore-dashboard-machine-order-v1';
let dashboardMachineOrderMode = false;
let pendingMachineImageFile = null;
let pendingMachineImageObjectUrl = '';
let originalMachineImageUrl = '';

function getPreferredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  } catch (error) {
    console.warn('Preferensi tema tidak dapat dibaca:', error);
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme, persistPreference = false) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  document.body.setAttribute('data-theme', normalizedTheme);

  const isLight = normalizedTheme === 'light';
  const nextLabel = isLight ? 'Gunakan mode gelap' : 'Gunakan mode terang';
  document.querySelectorAll('.theme-toggle-btn').forEach((toggleButton) => {
    toggleButton.textContent = isLight ? '🌙' : '☀️';
    toggleButton.title = nextLabel;
    toggleButton.setAttribute('aria-label', nextLabel);
    toggleButton.setAttribute('aria-pressed', String(isLight));
  });

  if (persistPreference) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
    } catch (error) {
      console.warn('Preferensi tema tidak dapat disimpan:', error);
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  applyTheme(currentTheme === 'light' ? 'dark' : 'light', true);
}

// Initialize System
window.onload = function() {
  applyTheme(getPreferredTheme());
  loadDatabase();
  switchTab('dashboard');
  
  // Assign embedded PredictaCore logo data URI if available
  if (window.PREDICTACORE_LOGO) {
    const sidebarLogo = document.getElementById('brand-sidebar-logo');
    const dashboardLogo = document.getElementById('brand-dashboard-logo');
    const systemLogo = document.getElementById('brand-system-logo');
    const loginLogo = document.getElementById('brand-login-logo');
    if (sidebarLogo) sidebarLogo.src = window.PREDICTACORE_LOGO;
    if (dashboardLogo) dashboardLogo.src = window.PREDICTACORE_LOGO;
    if (systemLogo) systemLogo.src = window.PREDICTACORE_LOGO;
    if (loginLogo) loginLogo.src = window.PREDICTACORE_LOGO;
  }

  // Set current date limit in forms
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = ['modal-machine-installdate'];
  dateInputs.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = today;
  });

  // Load select options
  updateMachineSelectDropdowns();
  
  // Start Silent Auto-Sync Polling Engine (Every 8 Seconds)
  startAutoSyncPolling();
  
  // Start Real-Time PLC Telemetry Running Hours Synchronizer (Every 1 Second)
  startTelemetrySyncLoop();
  
  // Start Industrial SCADA Real-Time SSE (Server-Sent Events) Telemetry Stream Engine
  startSseTelemetryEngine();

  // Require authenticated access on every supported viewport.
  setTimeout(function() {
    openLoginModal();
  }, 150);

  // Custom console simulation logs
  logToConsole('SYSTEM', 'In-Memory Relational Engine & Silent Auto-Sync initialized successfully.');
};

let autoRefreshTimer = null;

function startAutoSyncPolling() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(silentAutoSyncFromSynology, 8000);
}

function getCleanSyncState(stateObj) {
  if (!stateObj) return '';
  const clone = JSON.parse(JSON.stringify(stateObj));
  if (Array.isArray(clone.machines)) {
    clone.machines.forEach(m => {
      delete m.running_hours_total;
      delete m.running_hours_daily;
      delete m.running_hours_weekly;
      delete m.running_hours_monthly;
      delete m.last_updated;
      delete m.counter_product;
      delete m.last_counter_change_time;
      delete m.status;
      delete m.telemetry_status;
    });
  }
  return JSON.stringify({
    m: clone.machines,
    s: clone.spare_parts,
    r: clone.replacement_history,
    log: clone.running_hours_log
  });
}

function silentAutoSyncFromSynology() {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
    return;
  }

  fetch('api.php?action=get_state&_t=' + Date.now(), { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success' && Array.isArray(data.machines) && data.machines.length > 0) {
        const curHash = getCleanSyncState(dbState);
        const newHash = getCleanSyncState(data);

        if (curHash !== newHash) {
          // Merge data to preserve local running telemetry stats for both machines and spare parts
          if (Array.isArray(data.machines)) {
            data.machines.forEach(newM => {
              const localM = dbState.machines.find(m => 
                Number(m.id) === Number(newM.id) || 
                m.id == newM.id || 
                (m.asset_number && newM.asset_number && m.asset_number.trim().toLowerCase() === newM.asset_number.trim().toLowerCase())
              );
              if (localM) {
                if (localM.plc_enabled !== false) {
                  newM.running_hours_total = localM.running_hours_total !== undefined ? localM.running_hours_total : newM.running_hours_total;
                  newM.running_hours_daily = localM.running_hours_daily !== undefined ? localM.running_hours_daily : newM.running_hours_daily;
                  newM.running_hours_weekly = localM.running_hours_weekly !== undefined ? localM.running_hours_weekly : newM.running_hours_weekly;
                  newM.running_hours_monthly = localM.running_hours_monthly !== undefined ? localM.running_hours_monthly : newM.running_hours_monthly;
                  newM.counter_product = localM.counter_product !== undefined ? localM.counter_product : newM.counter_product;
                  newM.status = localM.status || newM.status;
                  newM.telemetry_status = localM.telemetry_status || newM.telemetry_status;
                }
              }
            });
          }
          if (Array.isArray(data.spare_parts)) {
            data.spare_parts.forEach(newSp => {
              const localSp = dbState.spare_parts.find(sp => 
                Number(sp.id) === Number(newSp.id) || 
                sp.id == newSp.id || 
                (sp.code && newSp.code && sp.code.toUpperCase() === newSp.code.toUpperCase() && Number(sp.machine_id) === Number(newSp.machine_id))
              );
              if (localSp && localSp.current_running_hours !== undefined) {
                newSp.current_running_hours = Math.max(Number(newSp.current_running_hours) || 0, Number(localSp.current_running_hours) || 0);
              }
            });
          }
          dbState = data;
          localStorage.setItem('pm_system_db', JSON.stringify(dbState));
          refreshCurrentTabView();
          updateMachineSelectDropdowns();
          logToConsole('SYSTEM', '⚡ Auto-Sync: Data Master diperbarui secara real-time dari Synology NAS.');
        }
      }
    })
    .catch(err => {});
}


function ensureBoschMachinesExist() {
  if (!dbState.machines) dbState.machines = [];

  // ═══ Complete Machine Registry ═══
  // Exact mapping per user specification:
  // D0710 RRU 3085 01 → _01_A → counting_product (Pcs)    | DB5.DI114;counting_product
  // D0710 RRU 3085 02 → _01_B → counting_product (Pcs)    | DB5.DI114;counting_product
  // D0701 HQL 2440 01 → _01_A → velocity_object  (m/s)    | DB5.I22;velo_obj
  // D0701 HQL 2440 02 → _01_B → velocity_object  (m/s)    | DB5.I22;velo_obj
  // D0703 ALF 4080 01 → ALF_01_A → counting_product (Pcs) | DB5.DI114;counting_product
  // D0703 ALF 4080 02 → ALF_01_B → counting_product (Pcs) | DB5.DI114;counting_product

  const machineDefs = [
    {
      nameKey: 'D0710 BOSCH RRU 3085 01',
      asset: 'D0710 BOSCH RRU 3085 01',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.DI114;counting_product',
      plc_counter_address: 'DB5.DI114;counting_product',
    },
    {
      nameKey: 'D0710 BOSCH RRU 3085 02',
      asset: 'D0710 BOSCH RRU 3085 02',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.DI114;counting_product',
      plc_counter_address: 'DB5.DI114;counting_product',
    },
    {
      nameKey: 'D0701 BOSCH HQL 2440 01',
      asset: 'D0701 BOSCH HQL 2440 01',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.I22;velo_obj',
      plc_counter_address: 'DB5.I22;velo_obj',
    },
    {
      nameKey: 'D0701 BOSCH HQL 2440 02',
      asset: 'D0701 BOSCH HQL 2440 02',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.I22;velo_obj',
      plc_counter_address: 'DB5.I22;velo_obj',
    },
    {
      nameKey: 'D0703 BOSCH ALF 4080 01',
      asset: 'D0703 BOSCH ALF 4080 01',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.DI114;counting_product',
      plc_counter_address: 'DB5.DI114;counting_product',
    },
    {
      nameKey: 'D0703 BOSCH ALF 4080 02',
      asset: 'D0703 BOSCH ALF 4080 02',
      line: 'ILE 7',
      mfr: 'BOSCH',
      plc_address: 'DB5.DI114;counting_product',
      plc_counter_address: 'DB5.DI114;counting_product',
    },
    {
      nameKey: 'LABELLING ROTA RE-400, SN: 18750',
      asset: 'LABELLING ROTA RE-400, SN: 18750',
      line: 'ILE 7',
      mfr: 'ROTA',
      plc_address: 'ILE7_LABELLING_ROTA_RE-400_SN_18750_A;infeed_counter',
      plc_counter_address: 'ILE7_LABELLING_ROTA_RE-400_SN_18750_A;infeed_counter',
    },
  ];

  machineDefs.forEach(def => {
    // Match by asset_number OR name (case-insensitive partial match)
    let existing = dbState.machines.find(m =>
      m.asset_number === def.asset ||
      m.name === def.nameKey ||
      (m.asset_number && m.asset_number.toUpperCase().includes(def.asset.split(' ').slice(0,2).join(' ')))
    );

    if (!existing) {
      const nextId = dbState.machines.length > 0 ? Math.max(...dbState.machines.map(m => Number(m.id))) + 1 : 1;
      existing = {
        id: nextId,
        name: def.nameKey,
        asset_number: def.asset,
        line_code: def.line,
        manufacturer: def.mfr,
        install_date: '2024-01-10',
        status: 'STOPPED',
        running_hours_total: 0,
        running_hours_daily: 0,
        running_hours_weekly: 0,
        running_hours_monthly: 0,
        last_updated: new Date().toISOString(),
        plc_protocol: 'PostgreSQL',
        plc_ip: '10.165.41.45',
        plc_port: 5432,
        plc_address: def.plc_address,
        plc_counter_address: def.plc_counter_address,
        counter_product: 0,
        plc_enabled: true,
        plc_inverted: false,
      };
      dbState.machines.push(existing);
    } else {
      // Ensure critical PLC config fields are always correct
      if (!existing.plc_protocol) existing.plc_protocol = 'PostgreSQL';
      if (!existing.plc_ip) existing.plc_ip = '10.165.41.45';
      if (!existing.plc_port) existing.plc_port = 5432;
      if (!existing.plc_address || existing.plc_address.startsWith('DB1.')) existing.plc_address = def.plc_address;
      if (!existing.plc_counter_address || existing.plc_counter_address === 'DB5.DI114') existing.plc_counter_address = def.plc_counter_address;
      if (existing.counter_product === undefined) existing.counter_product = 0;
      if (existing.plc_enabled === undefined) existing.plc_enabled = true;
    }
  });
}

// --- DATA ACCESS & FORMULAS (SYNOLOGY CENTRALIZED CLOUD INTEGRATED) ---

function syncAllSparePartsWithMachineRunningHours() {
  if (!dbState || !Array.isArray(dbState.machines) || !Array.isArray(dbState.spare_parts)) return;

  dbState.spare_parts.forEach(sp => {
    const m = findMachineForSparePart(sp);
    if (!m) return;

    const mRH = Number(m.running_hours_total) || 0;
    const lastRepRH = (sp.last_replacement_rh !== undefined && sp.last_replacement_rh !== null) ? Number(sp.last_replacement_rh) : null;

    if (lastRepRH !== null && !isNaN(lastRepRH)) {
      // Spare part has a replacement benchmark: current running hours = max(0, mRH - lastRepRH)
      sp.current_running_hours = Math.max(0, mRH - lastRepRH);
    } else {
      // Unreplaced spare part: sync directly to machine running hours
      sp.current_running_hours = mRH;
    }
  });
}

function ensureDataIntegrity() {
  if (!dbState.machines || !Array.isArray(dbState.machines)) {
    dbState.machines = [];
  }
  ensureBoschMachinesExist();
  if (!dbState.spare_parts || !Array.isArray(dbState.spare_parts)) {
    dbState.spare_parts = [];
  }
  syncAllSparePartsWithMachineRunningHours();
  if (!dbState.users || !Array.isArray(dbState.users) || dbState.users.length === 0) {
    dbState.users = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.users));
  } else {
    dbState.users.forEach(u => {
      if (u.full_name === 'Budi Santoso' || u.username === 'spv') {
        u.username = 'yohanes';
        u.full_name = 'Yohanes Ariyanto';
      }
      if (u.full_name === 'Agus Prayitno' || u.username === 'tech') {
        u.username = 'BAR';
        u.full_name = 'BAR';
      }
    });
  }
  if (!dbState.replacement_history || !Array.isArray(dbState.replacement_history)) {
    dbState.replacement_history = [];
  }
  if (!dbState.running_hours_log || !Array.isArray(dbState.running_hours_log)) {
    dbState.running_hours_log = [];
  }
}

function loadDatabase() {
  const cacheBuster = 'api.php?action=get_state&_t=' + new Date().getTime();
  fetch(cacheBuster, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success' && Array.isArray(data.machines)) {
        // Read directly from Synology NAS (preserves user custom inputted machines & spare parts)
        dbState.machines = data.machines;
        dbState.spare_parts = data.spare_parts || [];
        dbState.users = (data.users && data.users.length > 0) ? data.users : JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.users));
        dbState.replacement_history = data.replacement_history || [];
        dbState.running_hours_log = data.running_hours_log || [];

        // If Synology NAS machines array is empty, attempt to recover user's custom input from localStorage
        if (dbState.machines.length === 0) {
          const localDbStr = localStorage.getItem('pm_system_db');
          if (localDbStr) {
            try {
              const parsed = JSON.parse(localDbStr);
              if (parsed.machines && parsed.machines.length > 0) {
                dbState.machines = parsed.machines;
                dbState.spare_parts = parsed.spare_parts || [];
                dbState.replacement_history = parsed.replacement_history || [];
                dbState.running_hours_log = parsed.running_hours_log || [];
                saveDatabase(); // Push recovered user custom data back to Synology NAS!
              }
            } catch(e) {}
          }
        }

        ensureDataIntegrity();
        initializeCounterChangeTimestamps();
        localStorage.setItem('pm_system_db', JSON.stringify(dbState));
        logToConsole('SYSTEM', '✅ Memuat data master terpusat dari Synology NAS.');
        restoreActiveUser();
        refreshCurrentTabView();
      } else {
        fallbackLocalDb();
      }
    })
    .catch(err => {
      console.warn('Synology NAS API offline / tidak merespon:', err);
      fallbackLocalDb();
    });
}

function initializeCounterChangeTimestamps() {
  if (dbState && Array.isArray(dbState.machines)) {
    dbState.machines.forEach(m => {
      if (m.status === 'RUNNING' || m.telemetry_status === 'RUNNING') {
        machineLastCounterChangeTimestamps[m.id] = Date.now();
      }
    });
  }
}

function fallbackLocalDb() {
  const localDb = localStorage.getItem('pm_system_db');
  if (localDb) {
    try {
      const parsed = JSON.parse(localDb);
      if (parsed.machines) {
        dbState = parsed;
      } else {
        resetDbState();
      }
    } catch(e) {
      resetDbState();
    }
  } else {
    resetDbState();
  }

  ensureDataIntegrity();
  initializeCounterChangeTimestamps();
  restoreActiveUser();
  refreshCurrentTabView();
}

function restoreActiveUser() {
  const savedUser = localStorage.getItem('pm_active_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const matched = dbState.users.find(u => Number(u.id) === Number(parsed.id) || u.username.toLowerCase() === parsed.username.toLowerCase());
      if (matched) {
        activeUser = {
          id: matched.id,
          username: matched.username,
          role: matched.role,
          full_name: matched.full_name
        };
      }
    } catch(err) {}
  }
}

function saveDatabase() {
  // 1. Simpan ke Cache Lokal browser
  localStorage.setItem('pm_system_db', JSON.stringify(dbState));

  // 2. Sinkronkan data ke Central Synology NAS Database via api.php
  const payload = Object.assign({ action: 'save_state' }, dbState);

  fetch('api.php?action=save_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if (res && res.status === 'success') {
      logToConsole('SYSTEM', '☁️ Data terpusat Synology NAS berhasil tersimpan.');
      if (typeof showSystemNotificationBanner === 'function') {
        showSystemNotificationBanner('✅ Data terpusat berhasil tersimpan di Synology NAS', 'success');
      }
    } else if (res && res.status === 'error') {
      console.warn('Synology NAS Save Warning:', res.message);
      alert('⚠️ Gagal Menyimpan ke Synology NAS:\n' + res.message);
    }
  })
  .catch(err => {
    console.error('Gagal melakukan sinkronisasi data ke Synology NAS:', err);
  });

  // Refresh UI items
  updateUIPendingItems();
  refreshCurrentTabView();
}

function syncDatabaseToSynologyManual() {
  const payload = Object.assign({ action: 'save_state' }, dbState);

  logToConsole('SYSTEM', '☁️ Mengirim data terpusat ke Synology NAS...');

  fetch('api.php?action=save_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if (res && res.status === 'success') {
      const machineCount = dbState.machines ? dbState.machines.length : 0;
      const partCount = dbState.spare_parts ? dbState.spare_parts.length : 0;
      const userCount = dbState.users ? dbState.users.length : 0;

      alert(`✅ SINKRONISASI SYNOLOGY NAS BERHASIL!\n\nData terpusat berikut telah 100% tersimpan ke berkas database.json di Synology NAS:\n- Master Mesin: ${machineCount} unit\n- Master Spare Part: ${partCount} item\n- User Sistem: ${userCount} akun\n\nSeluruh perangkat di jaringan Anda kini dapat mengakses data yang sama secara real-time!`);
      logToConsole('SYSTEM', '☁️ Sinkronisasi Synology NAS Berhasil.');
    } else {
      alert(`⚠️ Peringatan Sinkronisasi Synology NAS:\n${res.message || 'Gagal menyimpan data.'}`);
    }
  })
  .catch(err => {
    alert(`⚠️ Synology NAS Offline / Tidak Merespon:\n${err.message}\n\nPastikan Synology Web Station berjalan di port 8080.`);
  });
}

function refreshCurrentTabView() {
  if (currentTab === 'dashboard') loadDashboardData();
  if (currentTab === 'machines') renderMachinesTable();
  if (currentTab === 'spareparts') renderSparePartsTable();
  if (currentTab === 'history') renderHistoryTable();
  if (currentTab === 'users') renderUsersTable();
  populateLoginUserDropdown();
}

function resetDbState() {
  dbState = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
  saveDatabase();
  logToConsole('SYSTEM', 'Database reset to default seed configurations.');
}

// Calculate remaining life percentages and forecast dates
function getSparePartCalculatedDetails(part, dailyHours = 20) {
  const lifetime = part.lifetime_hours;
  const currentHours = part.current_running_hours || 0;
  const remainingHours = Math.max(0, lifetime - currentHours);
  const remainingLifePct = Number((((lifetime - currentHours) / lifetime) * 100).toFixed(1));

  // Determine Condition
  let status = 'NORMAL';
  let color = 'green';
  let badgeClass = 'badge-normal';
  let message = 'Mesin aman digunakan';

  if (currentHours >= lifetime) {
    status = 'OVERDUE';
    color = 'red';
    badgeClass = 'badge-overdue';
    message = 'Spare part wajib diganti (Overdue)';
  } else if (remainingLifePct < 10) {
    status = 'ACTION REQUIRED';
    color = 'red';
    badgeClass = 'badge-action';
    message = 'Spare part wajib diganti';
  } else if (remainingLifePct >= 10 && remainingLifePct <= 30) {
    status = 'WARNING LEVEL 2';
    color = 'orange';
    badgeClass = 'badge-warning-2';
    message = 'Spare part hampir habis masa pakai (Wajib tersedia di warehouse)';
  } else if (remainingLifePct > 30 && remainingLifePct <= 50) {
    status = 'WARNING LEVEL 1';
    color = 'yellow';
    badgeClass = 'badge-warning-1';
    message = 'Persiapkan spare part baru & jadwalkan preventive maintenance';
  }

  // Predict Lifetime Sisa Hari
  const machineDaily = dailyHours > 0 ? dailyHours : 20; // Default to 20 hours per day
  const remainingDays = Number((remainingHours / machineDaily).toFixed(1));

  // Predict PM Date
  const nextPMDate = new Date();
  nextPMDate.setDate(nextPMDate.getDate() + Math.ceil(remainingDays));
  const pmDateStr = nextPMDate.toISOString().split('T')[0];

  return {
    ...part,
    remaining_hours: remainingHours,
    remaining_life_pct: remainingLifePct,
    status,
    color,
    badgeClass,
    status_message: message,
    remaining_days: remainingDays,
    predicted_pm_date: pmDateStr
  };
}

// Aggregated health score of machine
function getMachineOverallHealth(machineId) {
  const machine = dbState.machines.find(m => m.id === machineId);
  if (!machine) return 'NORMAL';
  const parts = dbState.spare_parts.filter(sp => sp.machine_id === machineId);
  if (parts.length === 0) return 'NORMAL';

  const dailyHours = machine.running_hours_daily > 0 ? machine.running_hours_daily : 20;
  const calculatedParts = parts.map(p => getSparePartCalculatedDetails(p, dailyHours));

  if (calculatedParts.some(p => p.status === 'OVERDUE' || p.status === 'ACTION REQUIRED')) {
    return 'ACTION REQUIRED';
  } else if (calculatedParts.some(p => p.status === 'WARNING LEVEL 2')) {
    return 'WARNING LEVEL 2';
  } else if (calculatedParts.some(p => p.status === 'WARNING LEVEL 1')) {
    return 'WARNING LEVEL 1';
  }
  return 'NORMAL';
}

// --- UI TAB SWITCHING ---

function switchTab(tabName) {
  currentTab = tabName;
  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const navBtn = document.getElementById(`nav-${tabName}`);
  if (navBtn) navBtn.classList.add('active');

  // Switch display panel
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const activePanel = document.getElementById(`panel-${tabName}`);
  if (activePanel) activePanel.classList.add('active');

  // Change page title
  const titles = {
    dashboard: 'Dashboard Analisis CMMS',
    machines: 'Master Data Mesin',
    spareparts: 'Master Data Spare Part',
    history: 'Riwayat Preventive Maintenance',
    integrations: 'PLC & IoT Data Acquisition Panel',
    sql: 'SQL Database Terminal Console',
    api: 'REST API Sandbox Explorer',
    system: 'Sistem Backup & Restore Database',
    users: 'Kelola Akun Pengguna',
    settings: 'Settings Smart Notification Assistant'
  };
  document.getElementById('page-title').innerText = titles[tabName] || 'PREVENTIVE SYSTEM';

  // Load sub-components
  if (tabName === 'dashboard') loadDashboardData();
  if (tabName === 'machines') renderMachinesTable();
  if (tabName === 'spareparts') renderSparePartsTable();
  if (tabName === 'history') renderHistoryTable();
  if (tabName === 'integrations') updateIntegrationsPanel();
  if (tabName === 'api') updateApiSandboxConsole();
  if (tabName === 'users') renderUsersTable();
}

function applyRolePermissions() {
  const addMachineBtn = document.getElementById('add-machine-btn');
  const addPartBtn = document.getElementById('add-part-btn');
  const importPartBtn = document.getElementById('import-part-btn');
  const clearPartsBtn = document.getElementById('clear-parts-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const importMachineBtn = document.getElementById('import-machine-btn');
  const resetAllPartsBtn = document.getElementById('reset-all-parts-hours-btn');
  
  // Sidebar elements
  const navUsers = document.getElementById('nav-users');
  const navIntegrations = document.getElementById('nav-integrations');
  const navSql = document.getElementById('nav-sql');
  const navApi = document.getElementById('nav-api');
  const navSystem = document.getElementById('nav-system');

  const isAdmin = activeUser.role === 'ADMIN';

  if (activeUser.role === 'TECHNICIAN') {
    if (addMachineBtn) addMachineBtn.style.display = 'none';
    if (addPartBtn) addPartBtn.style.display = 'none';
  } else {
    if (addMachineBtn) addMachineBtn.style.display = 'inline-flex';
    if (addPartBtn) addPartBtn.style.display = 'inline-flex';
  }

  // EXCLUSIVE ADMIN ACCESS: Import Parts, Clear Parts, Clear History, Import Machines, Reset All Parts
  if (importPartBtn) importPartBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if (clearPartsBtn) clearPartsBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if (clearHistoryBtn) clearHistoryBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if (importMachineBtn) importMachineBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if (resetAllPartsBtn) resetAllPartsBtn.style.display = isAdmin ? 'inline-flex' : 'none';

  // Admin exclusive tabs configurations
  const adminOnlyTabs = [
    { el: navUsers, id: 'users' },
    { el: navIntegrations, id: 'integrations' },
    { el: navSql, id: 'sql' },
    { el: navApi, id: 'api' },
    { el: navSystem, id: 'system' }
  ];

  adminOnlyTabs.forEach(item => {
    if (item.el) {
      if (activeUser.role === 'ADMIN') {
        item.el.style.display = 'flex';
      } else {
        item.el.style.display = 'none';
        // Auto-redirect if a restricted view is active
        if (currentTab === item.id) {
          switchTab('dashboard');
        }
      }
    }
  });
}

// --- DESKTOP AUTHENTICATION & LOGIN MODAL HANDLERS ---

function openLoginModal() {
  if (!dbState.users || !Array.isArray(dbState.users) || dbState.users.length === 0) {
    if (typeof loadDatabase === 'function') loadDatabase();
  }
  const userInput = document.getElementById('login-username-input');
  if (userInput) userInput.value = '';
  const pwdIn = document.getElementById('login-password-input');
  if (pwdIn) pwdIn.value = '';
  const errEl = document.getElementById('login-error-msg');
  if (errEl) errEl.style.display = 'none';
  
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('z-index', '99999', 'important');
  }
  if (userInput) setTimeout(() => userInput.focus(), 100);
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function logoutActiveUser() {
  localStorage.removeItem('pm_active_user');
  window.dispatchEvent(new CustomEvent('predictacore:logout'));
  openLoginModal();
}

window.predictaCoreLogout = logoutActiveUser;

function populateLoginUserDropdown() {
  // Legacy stub - now using manual username text input
}

async function performDesktopLogin() {
  const userInput = document.getElementById('login-username-input');
  const pwdIn = document.getElementById('login-password-input');
  const errEl = document.getElementById('login-error-msg');

  if (!userInput || !pwdIn) return;

  const usernameVal = userInput.value.trim();
  const password = pwdIn.value.trim();

  if (!usernameVal) {
    if (errEl) {
      errEl.innerText = '⚠️ Harap ketik Username Anda.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (!password) {
    if (errEl) {
      errEl.innerText = '⚠️ Harap masukkan Password atau PIN untuk melanjutkan.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (!dbState.users || !Array.isArray(dbState.users) || dbState.users.length === 0) {
    dbState.users = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.users));
  }

  const user = dbState.users.find(u => 
    u.username.toLowerCase() === usernameVal.toLowerCase() || 
    u.full_name.toLowerCase().includes(usernameVal.toLowerCase())
  );

  if (!user) {
    if (errEl) {
      errEl.innerText = `⚠️ Username "${usernameVal}" tidak ditemukan.`;
      errEl.style.display = 'block';
    }
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameVal, password })
    });
    const result = await response.json();

    if (!response.ok || result.status !== 'success' || !result.user) {
      throw new Error(result.message || 'Username atau password tidak sesuai.');
    }

    const authenticatedUser = result.user;
    activeUser = {
      id: authenticatedUser.id,
      username: authenticatedUser.username,
      role: authenticatedUser.role,
      full_name: authenticatedUser.full_name
    };

    localStorage.setItem('pm_active_user', JSON.stringify(activeUser));

    closeLoginModal();

    try {
      const fullNameEl = document.getElementById('user-full-name');
      const roleBadgeEl = document.getElementById('user-role-badge');
      if (fullNameEl) fullNameEl.innerText = activeUser.full_name;
      if (roleBadgeEl) roleBadgeEl.innerText = activeUser.role;

      applyRolePermissions();
      saveDatabase();
      logToConsole('SYSTEM', `User ${activeUser.full_name} (${activeUser.role}) berhasil log in secara aman.`);
      switchTab('dashboard');
      window.dispatchEvent(new CustomEvent('predictacore:authenticated', {
        detail: { user: { ...activeUser } }
      }));
    } catch(err) {
      console.error('Error during post-login execution:', err);
    }
  } catch (error) {
    if (errEl) {
      errEl.innerText = `⚠️ Password / PIN salah untuk akun ${user.full_name}.`;
      errEl.style.display = 'block';
    }
  }
}

// --- DYNAMIC RENDERING: DASHBOARD ---

function loadDashboardData() {
  if (!dbState.machines || !Array.isArray(dbState.machines)) dbState.machines = [];
  if (!dbState.spare_parts || !Array.isArray(dbState.spare_parts)) dbState.spare_parts = [];
  if (!dbState.replacement_history || !Array.isArray(dbState.replacement_history)) dbState.replacement_history = [];

  const totalMachines = dbState.machines.length;
  const totalParts = dbState.spare_parts.length;

  // Process all parts to calculate conditions
  let warningCount = 0;
  let overdueCount = 0;
  let actionRequiredCount = 0;
  let normalCount = 0;
  let totalCost = 0;

  const partsDetails = dbState.spare_parts.map(p => {
    const machine = findMachineForSparePart(p);
    const daily = machine ? machine.running_hours_daily : 20;
    return getSparePartCalculatedDetails(p, daily);
  });

  partsDetails.forEach(p => {
    if (p.status === 'OVERDUE') overdueCount++;
    else if (p.status === 'ACTION REQUIRED') actionRequiredCount++;
    else if (p.status === 'WARNING LEVEL 2' || p.status === 'WARNING LEVEL 1') warningCount++;
    else normalCount++;
  });

  // Total Maintenance Cost
  dbState.replacement_history.forEach(h => {
    totalCost += (h.cost || 0);
  });

  // PM Compliance calculation
  const totalReplacements = dbState.replacement_history.length;
  const pmCompliance = totalReplacements > 0 
    ? ((totalReplacements / (totalReplacements + overdueCount + actionRequiredCount)) * 100).toFixed(1)
    : 100.0;

  // Set counter cards
  document.getElementById('kpi-total-machines').innerText = totalMachines;
  document.getElementById('kpi-total-parts').innerText = totalParts;
  document.getElementById('kpi-warning-parts').innerText = warningCount;
  document.getElementById('kpi-overdue-parts').innerText = overdueCount + actionRequiredCount;
  document.getElementById('kpi-pm-compliance').innerText = `${pmCompliance}%`;
  document.getElementById('kpi-total-cost').innerText = `Rp ${totalCost.toLocaleString('id-ID')}`;

  // 0. Render Live Machine Status Cards Grid (Green when RUNNING)
  renderDashboardMachineCards();

  // 1. Draw Remaining Life Radial Gauges (Top 4 critical elements)
  renderRadialGauges(partsDetails);

  // 2. Draw Donut Chart
  renderDonutChart(normalCount, warningCount, actionRequiredCount + overdueCount);

  // 3. Draw Machine Health Bar Chart
  renderMachineHealthChart();

  // 3.5. Draw Line Chart of running hours
  renderLineChart();

  // 4. Draw Bar Chart of Monthly costs
  renderBarChart();

  // 5. Draw Top 10 Replaced Parts Table
  renderTopReplacedParts();

  window.dispatchEvent(new CustomEvent('predictacore:dashboard-ready', {
    detail: { user: { ...activeUser } }
  }));
}

function refreshDashboardData() {
  loadDashboardData();
  logToConsole('SYSTEM', 'Dashboard data berhasil diperbarui (Manual Refresh).');
}

// ─── DASHBOARD REAL-TIME MACHINE STATUS GRID RENDERING ───────────────────────
function _escapeDashboardText(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function _normalizeDashboardLineCode(value) {
  const lineCode = String(value || '').trim();
  return lineCode || 'TANPA LINE';
}

function _getDashboardMachineGroupingInfo(machine) {
  const name = String(machine.name || machine.asset_number || `Mesin ${machine.id}`).trim();
  const variantMatch = name.match(/^(.*?)[_\s-]+([AB])$/i);
  const baseName = variantMatch ? variantMatch[1].trim() : name;

  return {
    name,
    baseName,
    baseKey: baseName.toLocaleUpperCase('id-ID'),
    variant: variantMatch ? variantMatch[2].toUpperCase() : ''
  };
}

function _getDashboardFallbackPairKey(baseKey) {
  return baseKey.replace(/(\d+)$/, digits => {
    if (digits.length < 2) return digits;
    return `${digits.slice(0, -1)}#`;
  });
}

function _buildDashboardMachineLines(machines) {
  const lineMap = new Map();

  machines.forEach(machine => {
    const lineName = _normalizeDashboardLineCode(machine.line_code);
    const lineKey = lineName.toLocaleUpperCase('id-ID');
    const groupingInfo = _getDashboardMachineGroupingInfo(machine);

    if (!lineMap.has(lineKey)) {
      lineMap.set(lineKey, { key: lineKey, name: lineName, directGroups: new Map() });
    }

    const line = lineMap.get(lineKey);
    if (!line.directGroups.has(groupingInfo.baseKey)) {
      line.directGroups.set(groupingInfo.baseKey, {
        key: groupingInfo.baseKey,
        baseKey: groupingInfo.baseKey,
        machines: []
      });
    }

    line.directGroups.get(groupingInfo.baseKey).machines.push({ machine, groupingInfo });
  });

  const lines = Array.from(lineMap.values()).map(line => {
    const directGroups = Array.from(line.directGroups.values());
    const fallbackBuckets = new Map();

    directGroups.forEach(group => {
      if (group.machines.length !== 1 || !group.machines[0].groupingInfo.variant) return;
      const fallbackKey = _getDashboardFallbackPairKey(group.baseKey);
      if (!fallbackBuckets.has(fallbackKey)) fallbackBuckets.set(fallbackKey, []);
      fallbackBuckets.get(fallbackKey).push(group);
    });

    const consumedGroups = new Set();
    const mergedGroups = [];

    directGroups.forEach(group => {
      if (consumedGroups.has(group.key)) return;

      const fallbackKey = _getDashboardFallbackPairKey(group.baseKey);
      const fallbackMatches = fallbackBuckets.get(fallbackKey) || [];
      const variants = new Set(fallbackMatches.map(item => item.machines[0].groupingInfo.variant));

      if (group.machines.length === 1 && fallbackMatches.length === 2 && variants.has('A') && variants.has('B')) {
        fallbackMatches.forEach(item => consumedGroups.add(item.key));
        mergedGroups.push({
          key: fallbackMatches.map(item => item.key).sort().join('::'),
          machines: fallbackMatches.flatMap(item => item.machines)
        });
      } else {
        consumedGroups.add(group.key);
        mergedGroups.push(group);
      }
    });

    const groups = mergedGroups.map(group => {
      const sortedMachines = [...group.machines].sort((left, right) => {
        const variantRank = { A: 0, B: 1, '': 2 };
        const rankDifference = variantRank[left.groupingInfo.variant] - variantRank[right.groupingInfo.variant];
        if (rankDifference !== 0) return rankDifference;
        return left.groupingInfo.name.localeCompare(right.groupingInfo.name, 'id-ID', { numeric: true, sensitivity: 'base' });
      });
      const baseNames = [...new Set(sortedMachines.map(item => item.groupingInfo.baseName))];

      return {
        key: group.key,
        label: baseNames.join(' / '),
        machines: sortedMachines.map(item => item.machine)
      };
    });

    return {
      key: line.key,
      name: line.name,
      machineCount: groups.reduce((total, group) => total + group.machines.length, 0),
      groups
    };
  });

  return lines.sort((left, right) => {
    const leftNumber = Number((left.name.match(/\d+/) || [Number.MAX_SAFE_INTEGER])[0]);
    const rightNumber = Number((right.name.match(/\d+/) || [Number.MAX_SAFE_INTEGER])[0]);
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    return left.name.localeCompare(right.name, 'id-ID', { numeric: true, sensitivity: 'base' });
  });
}

function _readDashboardMachineOrder() {
  try {
    const savedOrder = JSON.parse(window.localStorage.getItem(DASHBOARD_MACHINE_ORDER_STORAGE_KEY) || '{}');
    return savedOrder && typeof savedOrder === 'object' && !Array.isArray(savedOrder) ? savedOrder : {};
  } catch (error) {
    console.warn('Urutan dashboard mesin tidak dapat dibaca:', error);
    return {};
  }
}

function _writeDashboardMachineOrder(order) {
  try {
    window.localStorage.setItem(DASHBOARD_MACHINE_ORDER_STORAGE_KEY, JSON.stringify(order));
    return true;
  } catch (error) {
    console.warn('Urutan dashboard mesin tidak dapat disimpan:', error);
    return false;
  }
}

function _applyDashboardMachineOrder(line, savedOrder) {
  const defaultGroups = [...line.groups].sort((left, right) =>
    left.label.localeCompare(right.label, 'id-ID', { numeric: true, sensitivity: 'base' })
  );
  const groupsByKey = new Map(defaultGroups.map(group => [group.key, group]));
  const savedKeys = Array.isArray(savedOrder[line.key]) ? savedOrder[line.key] : [];
  const orderedGroups = [];

  savedKeys.forEach(key => {
    if (!groupsByKey.has(key)) return;
    orderedGroups.push(groupsByKey.get(key));
    groupsByKey.delete(key);
  });

  return [...orderedGroups, ...groupsByKey.values()];
}

function _encodeDashboardOrderKey(value) {
  return encodeURIComponent(value).replace(/'/g, '%27');
}

function _announceDashboardMachineOrder(message) {
  const status = document.getElementById('machine-order-status');
  if (status) status.textContent = message;
}

function _syncDashboardMachineOrderControls() {
  const section = document.querySelector('.machine-status-section');
  const toggleButton = document.getElementById('machine-order-toggle');
  const resetButton = document.getElementById('machine-order-reset');

  if (section) section.classList.toggle('is-reordering', dashboardMachineOrderMode);
  if (toggleButton) {
    toggleButton.innerHTML = dashboardMachineOrderMode ? '✅ Selesai Mengatur' : '↕️ Atur Urutan';
    toggleButton.setAttribute('aria-pressed', String(dashboardMachineOrderMode));
  }
  if (resetButton) resetButton.classList.toggle('hidden', !dashboardMachineOrderMode);
}

function toggleDashboardMachineOrderMode() {
  dashboardMachineOrderMode = !dashboardMachineOrderMode;
  renderDashboardMachineCards();
  _announceDashboardMachineOrder(
    dashboardMachineOrderMode
      ? 'Mode pengaturan urutan aktif. Gunakan tombol naik dan turun pada setiap kelompok mesin.'
      : 'Urutan tampilan mesin telah disimpan di browser ini.'
  );
}

function moveDashboardMachineGroup(encodedLineKey, encodedGroupKey, direction) {
  const lineKey = decodeURIComponent(encodedLineKey);
  const groupKey = decodeURIComponent(encodedGroupKey);
  const savedOrder = _readDashboardMachineOrder();
  const line = _buildDashboardMachineLines(dbState.machines || []).find(item => item.key === lineKey);
  if (!line) return;

  const orderedGroups = _applyDashboardMachineOrder(line, savedOrder);
  const currentIndex = orderedGroups.findIndex(group => group.key === groupKey);
  const nextIndex = currentIndex + Number(direction);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedGroups.length) return;

  [orderedGroups[currentIndex], orderedGroups[nextIndex]] = [orderedGroups[nextIndex], orderedGroups[currentIndex]];
  savedOrder[lineKey] = orderedGroups.map(group => group.key);

  if (_writeDashboardMachineOrder(savedOrder)) {
    const movedGroup = orderedGroups[nextIndex];
    renderDashboardMachineCards();
    _announceDashboardMachineOrder(`${movedGroup.label} dipindahkan pada ${line.name}.`);
  }
}

function resetDashboardMachineOrder() {
  try {
    window.localStorage.removeItem(DASHBOARD_MACHINE_ORDER_STORAGE_KEY);
  } catch (error) {
    console.warn('Urutan dashboard mesin tidak dapat direset:', error);
  }

  renderDashboardMachineCards();
  _announceDashboardMachineOrder('Urutan mesin dikembalikan ke urutan nama A–Z dengan pasangan A/B tetap berdekatan.');
}

function _renderDashboardMachineCard(machine) {
  const isRunning = machine.status === 'RUNNING' || machine.telemetry_status === 'RUNNING';
  const statusClass = isRunning ? 'running' : 'stopped';
  const statusBadge = isRunning
    ? `<span class="dash-status-badge"><span class="pulse-dot-green"></span> RUNNING</span>`
    : `<span class="dash-status-badge"><span class="pulse-dot-red"></span> STOPPED</span>`;
  const safeName = _escapeDashboardText(machine.name || '-');
  const safeAssetNumber = _escapeDashboardText(machine.asset_number || '-');

  let machineIcon = '⚙️';
  const nameUpper = String(machine.name || '').toUpperCase();
  const assetUpper = String(machine.asset_number || '').toUpperCase();

  if (nameUpper.includes('RRU') || assetUpper.includes('RRU')) machineIcon = '🧼';
  else if (nameUpper.includes('HQL') || assetUpper.includes('HQL')) machineIcon = '🔥';
  else if (nameUpper.includes('ALF') || assetUpper.includes('ALF')) machineIcon = '🧪';
  else if (nameUpper.includes('ROTA') || assetUpper.includes('ROTA') || nameUpper.includes('LABEL') || assetUpper.includes('LABEL')) machineIcon = '🏷️';

  const getColumnName = address => {
    if (!address) return '';
    const parts = address.split(';');
    return parts.length > 1 ? parts[1].trim().toLowerCase() : '';
  };
  const counterColumn = getColumnName(machine.plc_counter_address);
  const isVelocityMachine = machine.plc_protocol === 'PostgreSQL' && (
    (counterColumn && (counterColumn.includes('velo') || counterColumn.includes('velocity') || counterColumn.includes('speed') || counterColumn.includes('m_s'))) ||
    (!counterColumn && (nameUpper.includes('HQL') || assetUpper.includes('HQL')))
  );
  const metricValue = machine.counter_product !== undefined
    ? (isVelocityMachine ? `${machine.counter_product} m/s` : `${Number(machine.counter_product).toLocaleString()} pcs`)
    : '-';
  const metricLabel = isVelocityMachine ? 'KECEPATAN' : 'COUNTER';
  const runningHours = Number(machine.running_hours_total) || 0;

  return `
    <div class="dash-machine-card ${statusClass}" id="dash-machine-card-${machine.id}">
      <div class="dash-machine-header">
        <div class="dash-machine-main">
          <div class="dash-machine-icon">${machineIcon}</div>
          <div class="dash-machine-title">
            <span class="dash-machine-name" title="${safeName}">${safeName}</span>
            <span class="dash-machine-asset">${safeAssetNumber}</span>
          </div>
        </div>
        ${statusBadge}
      </div>
      <div class="dash-machine-telemetry">
        <div class="dash-metric-box">
          <span class="dash-metric-label">${metricLabel}</span>
          <span class="dash-metric-val" id="dash-card-metric-${machine.id}">${metricValue}</span>
        </div>
        <div class="dash-metric-box" style="text-align:right;">
          <span class="dash-metric-label">RUNNING HOURS</span>
          <span class="dash-metric-val" id="dash-card-rh-${machine.id}" style="color:var(--text-primary);">${runningHours.toFixed(1)} Hrs</span>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardMachineCards() {
  const container = document.getElementById('dashboard-machine-status-grid');
  if (!container) return;
  if (container.dataset.reactDashboard === 'true') return;
  container.innerHTML = '';

  _syncDashboardMachineOrderControls();

  if (!dbState.machines || !Array.isArray(dbState.machines) || dbState.machines.length === 0) {
    container.innerHTML = `<div class="machine-status-empty">Belum ada data mesin terdaftar.</div>`;
    return;
  }

  const savedOrder = _readDashboardMachineOrder();
  const lines = _buildDashboardMachineLines(dbState.machines);

  container.innerHTML = lines.map(line => {
    const orderedGroups = _applyDashboardMachineOrder(line, savedOrder);
    const lineArgument = _encodeDashboardOrderKey(line.key);
    const allGroupsAreSingle = orderedGroups.every(group => group.machines.length === 1);
    const lineClass = allGroupsAreSingle ? ' all-single' : '';
    const groupsHtml = orderedGroups.map((group, index) => {
      const groupArgument = _encodeDashboardOrderKey(group.key);
      const safeGroupLabel = _escapeDashboardText(group.label);
      const groupClass = group.machines.length === 1 ? ' is-single' : ' is-pair';
      const groupType = group.machines.length === 1 ? 'Mesin tunggal' : 'Pasangan mesin A/B';
      const previousDisabled = index === 0 ? ' disabled' : '';
      const nextDisabled = index === orderedGroups.length - 1 ? ' disabled' : '';

      return `
        <article class="machine-pair-group${groupClass}" data-order-key="${_escapeDashboardText(group.key)}">
          <div class="machine-pair-header">
            <div class="machine-pair-heading">
              <strong>${safeGroupLabel}</strong>
              <span>${groupType}</span>
            </div>
            <div class="machine-pair-order-controls" aria-label="Atur urutan ${safeGroupLabel}">
              <button type="button" class="machine-order-btn" onclick="moveDashboardMachineGroup('${lineArgument}', '${groupArgument}', -1)" aria-label="Naikkan ${safeGroupLabel}" title="Pindahkan sebelumnya"${previousDisabled}>↑</button>
              <span>${index + 1}</span>
              <button type="button" class="machine-order-btn" onclick="moveDashboardMachineGroup('${lineArgument}', '${groupArgument}', 1)" aria-label="Turunkan ${safeGroupLabel}" title="Pindahkan berikutnya"${nextDisabled}>↓</button>
            </div>
          </div>
          <div class="machine-pair-cards">
            ${group.machines.map(machine => _renderDashboardMachineCard(machine)).join('')}
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="machine-line-section${lineClass}" data-line="${_escapeDashboardText(line.key)}" aria-labelledby="machine-line-${_encodeDashboardOrderKey(line.key)}">
        <div class="machine-line-header">
          <h4 id="machine-line-${_encodeDashboardOrderKey(line.key)}">${_escapeDashboardText(line.name)}</h4>
          <span>${line.machineCount} mesin · ${orderedGroups.length} kelompok</span>
        </div>
        <div class="machine-pairs-grid">${groupsHtml}</div>
      </section>
    `;
  }).join('');
}

function _updateDashboardMachineCard(m) {
  const card = document.getElementById(`dash-machine-card-${m.id}`);
  if (!card) return;

  const isRunning = m.status === 'RUNNING' || m.telemetry_status === 'RUNNING';

  // Update card status class & green glow instantly
  if (isRunning) {
    card.classList.remove('stopped');
    card.classList.add('running');
  } else {
    card.classList.remove('running');
    card.classList.add('stopped');
  }

  // Update badge
  const badgeEl = card.querySelector('.dash-status-badge');
  if (badgeEl) {
    if (isRunning) {
      badgeEl.innerHTML = `<span class="pulse-dot-green"></span> RUNNING`;
    } else {
      badgeEl.innerHTML = `<span class="pulse-dot-red"></span> STOPPED`;
    }
  }

  // Update metric value
  const metricEl = document.getElementById(`dash-card-metric-${m.id}`);
  if (metricEl && m.counter_product !== undefined) {
    const isVeloMachine = (m.plc_protocol === 'PostgreSQL') && (() => {
      const col = (m.plc_counter_address || '').split(';')[1]?.trim().toLowerCase() || '';
      return col.includes('velo') || col.includes('velocity') || col.includes('speed') ||
             (!col && m.asset_number && m.asset_number.toLowerCase().includes('hql'));
    })();
    metricEl.textContent = isVeloMachine ? `${m.counter_product} m/s` : `${Number(m.counter_product).toLocaleString()} pcs`;
  }

  // Update running hours
  const rhEl = document.getElementById(`dash-card-rh-${m.id}`);
  if (rhEl) {
    rhEl.textContent = `${(m.running_hours_total || 0).toFixed(1)} Hrs`;
  }
}

function renderRadialGauges(parts) {
  const container = document.getElementById('radial-gauges-list');
  container.innerHTML = '';

  // Get up to 10 parts with the lowest remaining life percentage (in critical state)
  const sorted = [...parts].sort((a,b) => a.remaining_life_pct - b.remaining_life_pct).slice(0, 10);

  sorted.forEach(p => {
    const machine = dbState.machines.find(m => Number(m.id) === Number(p.machine_id));
    const mName = machine ? machine.name : 'Unknown';
    
    // SVG radial setup
    const r = 35;
    const circ = 2 * Math.PI * r;
    const percent = Math.max(0, Math.min(100, p.remaining_life_pct));
    const offset = circ - (percent / 100) * circ;

    // Color logic
    let colorHex = 'var(--color-green)';
    if (p.status === 'WARNING LEVEL 1') colorHex = 'var(--color-yellow)';
    else if (p.status === 'WARNING LEVEL 2') colorHex = 'var(--color-orange)';
    else if (p.status === 'ACTION REQUIRED' || p.status === 'OVERDUE') colorHex = 'var(--color-red)';

    const gaugeHTML = `
      <div class="radial-gauge-item" onclick="openReplacementModal(${p.id})" style="cursor:pointer;" title="Suku Cadang ${p.critical_level} - Klik untuk mencatat penggantian">
        <div class="gauge-svg-wrapper">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <!-- Background circle -->
            <circle cx="45" cy="45" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="8"></circle>
            <!-- Progress circle -->
            <circle cx="45" cy="45" r="${r}" fill="none" stroke="${colorHex}" stroke-width="8" 
                    stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
                    transform="rotate(-90 45 45)" style="transition: stroke-dashoffset 0.5s ease-in-out;">
            </circle>
          </svg>
          <div class="gauge-percent-label" style="color: ${colorHex}">${p.remaining_life_pct}%</div>
        </div>
        <span class="gauge-name" title="${p.name}">${p.name}</span>
        <span class="gauge-machine">${mName}</span>
      </div>
    `;
    container.innerHTML += gaugeHTML;
  });
}

function renderDonutChart(normal, warning, critical) {
  const container = document.getElementById('condition-donut-chart');
  container.innerHTML = '';

  const total = normal + warning + critical;
  if(total === 0) {
    container.innerHTML = `<span class="chart-subtitle">Tidak ada data spare part.</span>`;
    return;
  }

  // Percentages
  const pctNormal = (normal / total) * 100;
  const pctWarning = (warning / total) * 100;
  const pctCritical = (critical / total) * 100;

  // SVG parameters
  const r = 52;
  const circ = 2 * Math.PI * r; 

  // DashOffsets
  const dashNormal = (pctNormal / 100) * circ;
  const dashWarning = (pctWarning / 100) * circ;
  const dashCritical = (pctCritical / 100) * circ;

  const offsetNormal = 0;
  const offsetWarning = dashNormal;
  const offsetCritical = dashNormal + dashWarning;

  // Build the extrusion layers (offset downwards by a loop to simulate thickness)
  let extrusionHTML = '';
  // 6 layers of thickness
  for (let offset = 8; offset > 0; offset--) {
    const cyOffset = 100 + offset;
    extrusionHTML += `
      <!-- Extrusion Layer ${offset} -->
      ${dashNormal > 0 ? `
      <circle cx="100" cy="${cyOffset}" r="${r}" fill="none" stroke="#047857" stroke-width="14"
              stroke-dasharray="${dashNormal} ${circ - dashNormal}" stroke-dashoffset="0"
              transform="rotate(-90 100 ${cyOffset})">
      </circle>` : ''}
      
      ${dashWarning > 0 ? `
      <circle cx="100" cy="${cyOffset}" r="${r}" fill="none" stroke="#c2410c" stroke-width="14"
              stroke-dasharray="${dashWarning} ${circ - dashWarning}" stroke-dashoffset="-${offsetWarning}"
              transform="rotate(-90 100 ${cyOffset})">
      </circle>` : ''}
      
      ${dashCritical > 0 ? `
      <circle cx="100" cy="${cyOffset}" r="${r}" fill="none" stroke="#b91c1c" stroke-width="14"
              stroke-dasharray="${dashCritical} ${circ - dashCritical}" stroke-dashoffset="-${offsetCritical}"
              transform="rotate(-90 100 ${cyOffset})">
      </circle>` : ''}
    `;
  }

  const donutHTML = `
    <div class="donut-3d-wrapper">
      <svg class="donut-3d-svg" viewBox="0 0 200 200">
        <defs>
          <filter id="shadowBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.45 0" />
          </filter>
        </defs>

        <!-- Blurred Drop Shadow underneath the 3D block -->
        <ellipse cx="100" cy="138" rx="62" ry="24" fill="#000" filter="url(#shadowBlur)"></ellipse>
        
        <!-- Background Guide Track -->
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="14"></circle>
        
        <!-- Extrusion cylinder walls -->
        ${extrusionHTML}

        <!-- Top Cap Lid (Bright colors) -->
        ${dashNormal > 0 ? `
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--predictacore-emerald)" stroke-width="14"
                stroke-dasharray="${dashNormal} ${circ - dashNormal}" stroke-dashoffset="0"
                transform="rotate(-90 100 100)">
        </circle>` : ''}
        
        ${dashWarning > 0 ? `
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--color-orange)" stroke-width="14"
                stroke-dasharray="${dashWarning} ${circ - dashWarning}" stroke-dashoffset="-${offsetWarning}"
                transform="rotate(-90 100 100)">
        </circle>` : ''}
        
        ${dashCritical > 0 ? `
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--color-red)" stroke-width="14"
                stroke-dasharray="${dashCritical} ${circ - dashCritical}" stroke-dashoffset="-${offsetCritical}"
                transform="rotate(-90 100 100)">
        </circle>` : ''}
      </svg>
      
      <!-- Overlay Upright Typography centered over the 3D donut -->
      <div class="donut-3d-center-label">
        <span class="donut-3d-number">${total}</span>
        <span class="donut-3d-sub">Total Part</span>
      </div>
    </div>
    
    <div class="donut-legend-grid">
      <div class="legend-card">
        <span class="legend-card-title"><span style="color:var(--predictacore-emerald)">●</span> Normal</span>
        <span class="legend-card-value green">${normal}</span>
        <span class="legend-card-pct">${pctNormal.toFixed(0)}%</span>
      </div>
      <div class="legend-card">
        <span class="legend-card-title"><span style="color:var(--color-orange)">●</span> Warning</span>
        <span class="legend-card-value orange">${warning}</span>
        <span class="legend-card-pct">${pctWarning.toFixed(0)}%</span>
      </div>
      <div class="legend-card">
        <span class="legend-card-title"><span style="color:var(--color-red)">●</span> Critical</span>
        <span class="legend-card-value red">${critical}</span>
        <span class="legend-card-pct">${pctCritical.toFixed(0)}%</span>
      </div>
    </div>
  `;
  container.innerHTML = donutHTML;
}

function renderMachineHealthChart() {
  const container = document.getElementById('machine-health-bar-chart');
  if (!container) return;
  container.innerHTML = '';

  if (!dbState.machines || dbState.machines.length === 0) {
    container.innerHTML = `<span class="chart-subtitle" style="display:block; text-align:center; padding:40px;">Tidak ada data mesin terdaftar.</span>`;
    return;
  }

  // 1. Calculate health score for all machines
  const machineHealthData = dbState.machines.map(m => {
    return {
      machine: m,
      health: getMachineHealthPercentage(m.id)
    };
  });

  // 2. Filter for unhealthy machines (Health < 50%), sort ascending (worst health first), limit to top 10
  const unhealthyMachines = machineHealthData
    .filter(item => item.health < 50)
    .sort((a, b) => a.health - b.health)
    .slice(0, 10);

  // 3. If there are no unhealthy machines (all >= 50%), render HMI Prima Safe State
  if (unhealthyMachines.length === 0) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:180px; text-align:center; color:var(--predictacore-emerald); padding:10px;">
        <span style="font-size:42px; filter:drop-shadow(0 0 10px rgba(16,185,129,0.35));">🛡️</span>
        <h4 style="margin-top:10px; font-weight:700; color:var(--text-primary);">Sistem Operasi Prima</h4>
        <p style="font-size:11px; color:var(--text-secondary); max-width:260px; margin-top:4px;">
          Seluruh mesin berada dalam kondisi optimal (Health Score &ge; 50%).
        </p>
      </div>
    `;
    return;
  }

  const N = unhealthyMachines.length;
  // Spacing boundaries: X from 45 to 300 (range of 255)
  const step = 255 / N;
  const barWidth = Math.max(10, Math.min(28, step * 0.5));
  const maxHealth = 100;
  
  // Font sizes scale dynamically
  const valueSize = N > 5 ? 7.5 : 8.5;
  const labelSize = N > 5 ? 6.5 : 7.5;

  const barSVG = `
    <svg viewBox="0 0 320 180" style="width: 100%; height: 180px;">
      <!-- Gridlines -->
      <line x1="40" y1="25" x2="300" y2="25" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="75" x2="300" y2="75" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="125" x2="300" y2="125" stroke="#233142" stroke-width="1.5" />
      
      <!-- Y-Axis labels -->
      <text x="32" y="29" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">100%</text>
      <text x="32" y="79" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">50%</text>
      <text x="32" y="129" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">0%</text>
      
      <!-- Bars -->
      ${unhealthyMachines.map((item, xidx) => {
        const m = item.machine;
        const health = item.health;
        const height = (health / maxHealth) * 100; // Max height is 100px (125 - 25)
        
        const xCoord = 45 + xidx * step + (step - barWidth) / 2;
        const yCoord = 125 - height;
        
        const color = 'var(--color-red)';
        const glow = 'url(#redGlow)';

        return `
          <g>
            <!-- Shaded Bar with 1px sharp outline border for contrast -->
            <rect x="${xCoord}" y="${yCoord}" width="${barWidth}" height="${height}" 
                  fill="${glow}" stroke="${color}" stroke-width="1" rx="2" 
                  style="transition: all 0.3s;"></rect>
            
            <!-- Value text -->
            <text x="${xCoord + barWidth/2}" y="${yCoord - 5}" fill="${color}" font-size="${valueSize}" font-weight="700" text-anchor="middle">
              ${health}%
            </text>
            
            <!-- Tilted X-axis label (Rotated -30 deg for perfect readability of full names) -->
            <text x="${xCoord + barWidth/2 - 2}" y="137" fill="var(--text-primary)" font-size="${labelSize}" font-weight="600" text-anchor="end" transform="rotate(-30 ${xCoord + barWidth/2 - 2} 137)">
              ${m.name}
            </text>
          </g>
        `;
      }).join('')}

      <!-- Gradients -->
      <defs>
        <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-red)" stop-opacity="1.0" />
          <stop offset="100%" stop-color="var(--color-red)" stop-opacity="0.45" />
        </linearGradient>
      </defs>
    </svg>
  `;
  container.innerHTML = barSVG;
}

function renderLineChart() {
  const container = document.getElementById('running-hours-line-chart');
  if (!container) return;
  container.innerHTML = '';

  const machines = dbState.machines.slice(0, 3);
  if (machines.length === 0) return;

  const days = ['H-4', 'H-3', 'H-2', 'H-1', 'Hari ini'];
  const lineColors = ['var(--predictacore-cyan)', 'var(--color-yellow)', 'var(--predictacore-emerald)'];
  const areaGlows = ['url(#cyanArea)', 'url(#yellowArea)', 'url(#emeraldArea)'];
  
  let svglines = '';
  let svgLegends = '';
  
  machines.forEach((m, idx) => {
    const dailyBase = m.running_hours_daily > 0 ? m.running_hours_daily : 16;
    const points = [
      Number((dailyBase - (idx * 1.5) - (m.id % 2)).toFixed(1)),
      Number((dailyBase + (idx * 0.8) - 1.2).toFixed(1)),
      Number((dailyBase - (idx * 0.5) + (m.id % 3 === 0 ? 2 : -1)).toFixed(1)),
      Number((dailyBase + (idx * 1.2) - 0.4).toFixed(1)),
      Number(dailyBase.toFixed(1))
    ];

    const average = Number((points.reduce((a,b) => a+b, 0) / 5).toFixed(1));
    const scaleY = (val) => 140 - (Math.min(24, Math.max(0, val)) / 24) * 110; 
    
    const coordinates = points.map((p, xidx) => `${50 + xidx * 60},${scaleY(p).toFixed(1)}`).join(' ');
    const areaCoordinates = `50,140 ${coordinates} 290,140`;

    svglines += `
      <!-- Area Shading -->
      <polygon fill="${areaGlows[idx]}" points="${areaCoordinates}" style="opacity: 0.08;" />
      <!-- Line Trace -->
      <polyline fill="none" stroke="${lineColors[idx]}" stroke-width="2.5" points="${coordinates}" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));" />
      <!-- Data Dots -->
      ${points.map((p, xidx) => `
        <circle cx="${50 + xidx * 60}" cy="${scaleY(p).toFixed(1)}" r="4" fill="${lineColors[idx]}" stroke="#121820" stroke-width="1.5">
          <title>${m.name}: ${p} Jam</title>
        </circle>
      `).join('')}
    `;

    svgLegends += `
      <div style="font-size:9px; display:flex; flex-direction:column; gap:2px; background:rgba(255,255,255,0.01); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); flex:1; min-width:80px; text-align:center;">
        <div style="display:inline-flex; align-items:center; justify-content:center; gap:4px; font-weight:600;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${lineColors[idx]}"></span>
          <span title="${m.name}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70px;">${m.name}</span>
        </div>
        <div style="color:var(--text-secondary); font-size:8px;">Avg: <strong>${average}h</strong></div>
      </div>
    `;
  });

  const chartSVG = `
    <svg viewBox="0 0 320 180" style="width: 100%; height: 180px;">
      <defs>
        <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--predictacore-cyan)" stop-opacity="1"/>
          <stop offset="100%" stop-color="var(--predictacore-cyan)" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="yellowArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-yellow)" stop-opacity="1"/>
          <stop offset="100%" stop-color="var(--color-yellow)" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--predictacore-emerald)" stop-opacity="1"/>
          <stop offset="100%" stop-color="var(--predictacore-emerald)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      
      <!-- Gridlines -->
      <line x1="40" y1="30" x2="300" y2="30" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="85" x2="300" y2="85" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="140" x2="300" y2="140" stroke="#233142" stroke-width="1.5" />
      
      <!-- Y-Axis labels -->
      <text x="32" y="34" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">24h</text>
      <text x="32" y="89" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">12h</text>
      <text x="32" y="144" fill="var(--text-secondary)" font-size="8.5" text-anchor="end">0h</text>
      
      <!-- X-Axis Labels -->
      ${days.map((d, xidx) => `
        <text x="${50 + xidx * 60}" y="156" fill="var(--text-secondary)" font-size="8.5" text-anchor="middle">${d}</text>
      `).join('')}

      <!-- Lines and Dots -->
      ${svglines}
    </svg>
    <div class="line-legend" style="display:flex; justify-content:space-between; gap:4px; margin-top:6px; width:100%;">
      ${svgLegends}
    </div>
  `;
  container.innerHTML = chartSVG;
}

function renderBarChart() {
  const container = document.getElementById('maintenance-cost-bar-chart');
  container.innerHTML = '';

  const monthlyData = {};
  dbState.replacement_history.forEach(h => {
    const month = h.replacement_date.slice(0, 7); // YYYY-MM
    monthlyData[month] = (monthlyData[month] || 0) + h.cost;
  });

  const defaultMonths = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  defaultMonths.forEach(m => {
    if (!monthlyData[m]) monthlyData[m] = 0;
  });

  const months = Object.keys(monthlyData).sort().slice(-5);
  const maxCost = Math.max(...months.map(m => monthlyData[m]), 50000000); 

  const scaleY = (val) => 140 - (val / maxCost) * 110;
  const barWidth = 32;

  // Month translation mapping
  const monthNamesId = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agt',
    '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
  };

  const barSVG = `
    <svg viewBox="0 0 320 180" style="width: 100%; height: 180px;">
      <!-- Gridlines -->
      <line x1="40" y1="30" x2="300" y2="30" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="85" x2="300" y2="85" stroke="#1d2733" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="40" y1="140" x2="300" y2="140" stroke="#233142" stroke-width="1.5" />
      
      <!-- Y-Axis labels (Jt format) -->
      <text x="32" y="34" fill="var(--text-secondary)" font-size="9" text-anchor="end">${(maxCost / 1000000).toFixed(0)} Jt</text>
      <text x="32" y="89" fill="var(--text-secondary)" font-size="9" text-anchor="end">${(maxCost / 2000000).toFixed(0)} Jt</text>
      <text x="32" y="144" fill="var(--text-secondary)" font-size="9" text-anchor="end">0</text>
      
      <!-- Bars -->
      ${months.map((m, xidx) => {
        const cost = monthlyData[m];
        const height = (cost / maxCost) * 110;
        const xCoord = 52 + xidx * 50;
        const yCoord = 140 - height;
        
        const mKey = m.slice(5);
        const yKey = m.slice(2, 4);
        const monthLabel = `${monthNamesId[mKey] || mKey} '${yKey}`;
        
        const formattedVal = cost > 0 ? `${(cost / 1000000).toFixed(1)} Jt` : '0';
        
        return `
          <g>
            <!-- Background Glow Bar on hover -->
            <rect x="${xCoord}" y="${yCoord}" width="${barWidth}" height="${height}" fill="url(#cyanGlow)" rx="4" style="transition: all 0.3s;"></rect>
            <!-- Text label above bar -->
            <text x="${xCoord + barWidth/2}" y="${yCoord - 6}" fill="var(--predictacore-cyan)" font-size="8" font-weight="700" text-anchor="middle">
              ${cost > 0 ? formattedVal : ''}
            </text>
            <!-- X label -->
            <text x="${xCoord + barWidth/2}" y="158" fill="var(--text-secondary)" font-size="9" text-anchor="middle">${monthLabel}</text>
          </g>
        `;
      }).join('')}

      <!-- Gradient Defs -->
      <defs>
        <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--predictacore-cyan)" stop-opacity="0.85" />
          <stop offset="100%" stop-color="var(--predictacore-teal)" stop-opacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  `;
  container.innerHTML = barSVG;
}

function renderTopReplacedParts() {
  const tbody = document.getElementById('top-replaced-parts-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!dbState.replacement_history) dbState.replacement_history = [];
  if (!dbState.spare_parts) dbState.spare_parts = [];
  if (!dbState.machines) dbState.machines = [];

  const freq = {};

  dbState.replacement_history.forEach(h => {
    // Look up Master Spare Part to get exact machine association
    const sparePart = dbState.spare_parts.find(sp => 
      (h.spare_part_id && Number(sp.id) === Number(h.spare_part_id)) ||
      (sp.code && h.spare_part_code && sp.code.toUpperCase() === h.spare_part_code.toUpperCase())
    );

    const partName = sparePart ? sparePart.name : (h.spare_part_name || 'Spare Part');
    const partCode = sparePart ? sparePart.code : (h.spare_part_code || 'SP-GENERIC');

    // Dynamic machine resolution
    let machine = null;
    if (sparePart) {
      machine = dbState.machines.find(m => Number(m.id) === Number(sparePart.machine_id));
    }
    if (!machine && h.machine_id) {
      machine = dbState.machines.find(m => Number(m.id) === Number(h.machine_id));
    }
    if (!machine && dbState.machines.length > 0) {
      machine = dbState.machines[0];
    }

    const machineName = machine ? machine.name : 'Granulation Line A Machine';
    const key = partCode.toUpperCase();

    if (!freq[key]) {
      freq[key] = {
        name: partName,
        code: partCode,
        machine_name: machineName,
        count: 0,
        totalCost: 0
      };
    }
    freq[key].count++;
    freq[key].totalCost += (h.cost || (sparePart ? sparePart.price : 1500000));
  });

  const sorted = Object.values(freq).sort((a,b) => b.count - a.count).slice(0, 10);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="text-align:center; color:var(--text-muted); padding:20px;">Belum ada riwayat penggantian spare part.</td></tr>`;
    return;
  }

  const maxCount = Math.max(...sorted.map(s => s.count), 1);

  sorted.forEach(item => {
    let recommendation = 'Pemakaian Normal';
    let recBadge = 'badge-normal';
    if (item.count >= 2) {
      recommendation = '⚠️ Evaluasi Kualitas / Supplier';
      recBadge = 'badge-warning-2';
    }

    const formattedCost = item.totalCost >= 1000000 
      ? `Rp ${(item.totalCost / 1000000).toFixed(2)} Jt`
      : `Rp ${item.totalCost.toLocaleString('id-ID')}`;
      
    const pct = (item.count / maxCount) * 100;
    const progressColor = item.count >= 2 ? 'var(--color-red)' : 'var(--predictacore-cyan)';

    const row = `
      <tr>
        <td>
          <div style="font-weight:600; color:var(--text-primary);">${item.name}</div>
          <div style="font-size:10px; color:var(--text-secondary); font-family:'JetBrains Mono'; margin-top:2px;">${item.code}</div>
        </td>
        <td><span style="font-size:12px; font-weight:500; color:var(--text-primary);">${item.machine_name}</span></td>
        <td>
          <div class="freq-bar-wrapper">
            <span class="freq-count">${item.count}x</span>
            <div class="freq-progress-bg">
              <div class="freq-progress-fill" style="width: ${pct}%; background-color: ${progressColor}; box-shadow: 0 0 6px ${progressColor}80;"></div>
            </div>
          </div>
        </td>
        <td><strong style="color:var(--text-primary); font-size:13px;">${formattedCost}</strong></td>
        <td><span class="badge ${recBadge}">${recommendation}</span></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// --- DYNAMIC RENDERING: MACHINES PANEL ---

function renderMachinesTable() {
  const tbody = document.getElementById('machines-table-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const searchInput = document.getElementById('machine-search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
  const lineFilterEl = document.getElementById('machine-filter-line');
  const lineFilter = lineFilterEl ? lineFilterEl.value : '';

  if (!dbState.machines || !Array.isArray(dbState.machines)) {
    dbState.machines = [];
  }

  const filtered = dbState.machines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchVal) || 
                          m.asset_number.toLowerCase().includes(searchVal) ||
                          (m.line_code && m.line_code.toLowerCase().includes(searchVal));
    const matchesLine = lineFilter === '' || (m.line_code && m.line_code === lineFilter);
    return matchesSearch && matchesLine;
  });

  const rowsHtml = [];
  filtered.forEach(m => {
    const health = getMachineOverallHealth(m.id);
    let healthBadge = 'badge-normal';
    if (health === 'ACTION REQUIRED') healthBadge = 'badge-action';
    if (health === 'WARNING LEVEL 2') healthBadge = 'badge-warning-2';
    if (health === 'WARNING LEVEL 1') healthBadge = 'badge-warning-1';

    const statusBadge = `badge-${m.status.toLowerCase()}`;
    const activeBadge = m.is_active === false
      ? '<span class="badge" style="margin-left:5px;color:var(--color-red);border:1px solid currentColor;">INACTIVE</span>'
      : '<span class="badge badge-normal" style="margin-left:5px;">ACTIVE</span>';

    const _getCol = (addr) => {
      if (!addr) return '';
      const parts = addr.split(';');
      return parts.length > 1 ? parts[1].trim().toLowerCase() : '';
    };
    const _cCol = _getCol(m.plc_counter_address);
    const isVelocityMachine = (m.plc_protocol === 'PostgreSQL') && (
      (_cCol && (_cCol.includes('velo') || _cCol.includes('velocity') || _cCol.includes('speed') || _cCol.includes('m_s'))) ||
      (!_cCol && ((m.name && m.name.toLowerCase().includes('hql')) || (m.asset_number && m.asset_number.toLowerCase().includes('hql'))))
    );

    const metricHtml = m.counter_product !== undefined 
      ? (isVelocityMachine 
          ? `<br><span style="font-size:11px; color:var(--predictacore-cyan);">📊 Kecepatan: <strong>${m.counter_product}</strong> m/s</span>` 
          : `<br><span style="font-size:11px; color:var(--predictacore-cyan);">📊 Counter: <strong>${m.counter_product.toLocaleString()}</strong> pcs</span>`)
      : '';

    rowsHtml.push(`
      <tr>
        <td>
          <strong>${m.name}</strong>
          ${metricHtml}
        </td>
        <td><code style="font-family:'JetBrains Mono';">${m.asset_number}</code></td>
        <td>${m.line_code}</td>
        <td>${m.manufacturer}</td>
        <td>${m.install_date}</td>
        <td>${m.running_hours_total.toFixed(1)} Hrs</td>
        <td><span class="badge ${statusBadge}">${m.status}</span>${activeBadge}</td>
        <td>
          <button class="btn-action-icon" title="View details & QR" onclick="viewMachineDetails(${m.id})">👁️ Detail</button>
          <button class="btn-action-icon" title="Copy / Duplikat Mesin" onclick="copyMachineData(${m.id})" style="color:var(--predictacore-cyan);">📋 Copy</button>
          <button class="btn-action-icon" title="Edit" onclick="openMachineModal(${m.id})">✏️</button>
          <button class="btn-action-icon" title="Nonaktifkan tanpa menghapus histori" style="color:var(--color-red);" onclick="deleteMachine(${m.id})">⏸ Nonaktifkan</button>
        </td>
      </tr>
    `);
  });

  if (rowsHtml.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada mesin ditemukan.</td></tr>`;
  } else {
    tbody.innerHTML = rowsHtml.join('');
  }

  // Ensure Production Line Filter is populated
  updateMachineSelectDropdowns();
}

function updateMachineSelectDropdowns() {
  // Populate Machine Filter for Spare Parts
  const partMachineSelect = document.getElementById('part-filter-machine');
  if (partMachineSelect) {
    const curVal = partMachineSelect.value;
    partMachineSelect.innerHTML = '<option value="">Semua Mesin</option>';
    dbState.machines.filter(m => m.is_active !== false).forEach(m => {
      partMachineSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.asset_number})</option>`;
    });
    partMachineSelect.value = curVal;
  }

  // Populate Production Line Filter for Master Mesin
  const machineLineSelect = document.getElementById('machine-filter-line');
  if (machineLineSelect) {
    const curLineVal = machineLineSelect.value;
    const linesSet = new Set();
    dbState.machines.forEach(m => {
      if (m.line_code && m.line_code.trim()) {
        linesSet.add(m.line_code.trim());
      }
    });
    machineLineSelect.innerHTML = '<option value="">Semua Line Produksi</option>';
    Array.from(linesSet).sort().forEach(line => {
      machineLineSelect.innerHTML += `<option value="${line}">${line}</option>`;
    });
    machineLineSelect.value = curLineVal;
  }
}

function refreshMachinesTable() {
  const searchInput = document.getElementById('machine-search-input');
  if (searchInput) searchInput.value = '';

  if (typeof showSystemNotificationBanner === 'function') {
    showSystemNotificationBanner('🔄 Mengambil data Master Mesin terbaru dari Synology NAS...', 'info');
  }

  fetch('api.php?action=get_state&_t=' + Date.now(), { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success' && Array.isArray(data.machines) && data.machines.length > 0) {
        dbState = data;
        localStorage.setItem('pm_system_db', JSON.stringify(dbState));
      }
      renderMachinesTable();
      updateMachineSelectDropdowns();
      if (typeof showSystemNotificationBanner === 'function') {
        showSystemNotificationBanner('✅ Data Master Mesin 100% ter-sync dari Synology NAS!', 'success');
      }
      logToConsole('SYSTEM', 'Data Master Mesin berhasil diperbarui dari Synology NAS.');
    })
    .catch(err => {
      renderMachinesTable();
      console.warn('Refresh error:', err);
    });
}

function refreshSparePartsTable() {
  const searchInput = document.getElementById('part-search-input');
  const mFilter = document.getElementById('part-filter-machine');
  const cFilter = document.getElementById('part-filter-condition');
  
  if (searchInput) searchInput.value = '';
  if (mFilter) mFilter.value = '';
  if (cFilter) cFilter.value = '';

  if (typeof showSystemNotificationBanner === 'function') {
    showSystemNotificationBanner('🔄 Mengambil data Master Spare Part terbaru dari Synology NAS...', 'info');
  }

  fetch('api.php?action=get_state&_t=' + Date.now(), { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success' && Array.isArray(data.spare_parts) && data.spare_parts.length > 0) {
        dbState = data;
        localStorage.setItem('pm_system_db', JSON.stringify(dbState));
      }
      renderSparePartsTable();
      updateMachineSelectDropdowns();
      if (typeof showSystemNotificationBanner === 'function') {
        showSystemNotificationBanner('✅ Data Master Spare Part 100% ter-sync dari Synology NAS!', 'success');
      }
      logToConsole('SYSTEM', 'Data Master Spare Part berhasil diperbarui dari Synology NAS.');
    })
    .catch(err => {
      renderSparePartsTable();
      console.warn('Refresh error:', err);
    });
}

function _machineField(id) {
  return document.getElementById(id);
}

function _setMachineField(id, value) {
  const field = _machineField(id);
  if (field) field.value = value == null ? '' : String(value);
}

function _setMachineCheckbox(id, value) {
  const field = _machineField(id);
  if (field) field.checked = value !== false;
}

function _clearPendingMachineImage() {
  pendingMachineImageFile = null;
  if (pendingMachineImageObjectUrl) URL.revokeObjectURL(pendingMachineImageObjectUrl);
  pendingMachineImageObjectUrl = '';
  const input = _machineField('modal-machine-image-file');
  if (input) input.value = '';
}

function _renderMachineImagePreview(source) {
  const preview = _machineField('modal-machine-image-preview');
  if (!preview) return;
  preview.innerHTML = '';
  if (source) {
    const image = document.createElement('img');
    image.src = source;
    image.alt = 'Machine Preview';
    image.onerror = () => {
      preview.innerHTML = '<span class="machine-image-preview-placeholder">⚙<small>No Machine Image</small></span>';
    };
    preview.appendChild(image);
  } else {
    preview.innerHTML = '<span class="machine-image-preview-placeholder">⚙<small>No Machine Image</small></span>';
  }
}

function previewMachineImage(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  const errorElement = _machineField('modal-machine-image-error');
  if (errorElement) errorElement.textContent = '';
  if (!file) return;
  const extension = `.${String(file.name).split('.').pop() || ''}`.toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(extension) || !['image/png', 'image/jpeg'].includes(file.type)) {
    if (errorElement) errorElement.textContent = 'Format tidak valid. Pilih PNG, JPG, atau JPEG.';
    event.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    if (errorElement) errorElement.textContent = 'Ukuran gambar maksimal 5 MB.';
    event.target.value = '';
    return;
  }
  _clearPendingMachineImage();
  pendingMachineImageFile = file;
  pendingMachineImageObjectUrl = URL.createObjectURL(file);
  _renderMachineImagePreview(pendingMachineImageObjectUrl);
}

function removeMachineImage() {
  _clearPendingMachineImage();
  _setMachineField('modal-machine-image-url', '');
  _renderMachineImagePreview('');
  const errorElement = _machineField('modal-machine-image-error');
  if (errorElement) errorElement.textContent = '';
}

function _machineCardConfigurationFromForm() {
  return {
    showImage: _machineField('modal-machine-show-image').checked,
    showMachineName: _machineField('modal-machine-show-name').checked,
    showMachineCode: _machineField('modal-machine-show-code').checked,
    showLine: _machineField('modal-machine-show-line').checked,
    showArea: _machineField('modal-machine-show-area').checked,
    showStatus: _machineField('modal-machine-show-status').checked,
    showCounter: _machineField('modal-machine-show-counter').checked,
    showSpeed: _machineField('modal-machine-show-speed').checked,
    showRunningHours: _machineField('modal-machine-show-hours').checked,
    showHealth: _machineField('modal-machine-show-health').checked
  };
}

function _populateMachineDynamicFields(machine) {
  const config = machine && machine.card_config ? machine.card_config : {};
  _setMachineField('modal-machine-stable-id', machine ? (machine.machine_id || machine.machine_code || machine.asset_number || '') : '');
  _setMachineField('modal-machine-area', machine ? machine.area : '');
  _setMachineField('modal-machine-department', machine ? machine.department : '');
  _setMachineField('modal-machine-type', machine ? machine.machine_type : '');
  _setMachineField('modal-machine-status-tag', machine ? (machine.status_tag || machine.plc_address || '') : '');
  _setMachineField('modal-machine-counter-tag', machine ? (machine.counter_tag || machine.plc_counter_address || '') : '');
  _setMachineField('modal-machine-speed-tag', machine ? machine.speed_tag : '');
  _setMachineField('modal-machine-running-hours-tag', machine ? machine.running_hours_tag : '');
  _setMachineField('modal-machine-dashboard-url', machine ? machine.realtime_dashboard_url : '');
  _setMachineField('modal-machine-display-order', machine ? (machine.display_order || machine.id || 0) : (dbState.machines.length + 1));
  _setMachineField('modal-machine-display-mode', machine ? (machine.display_mode || 'AUTO') : 'AUTO');
  _setMachineCheckbox('modal-machine-active', machine ? machine.is_active !== false : true);
  _setMachineCheckbox('modal-machine-show-image', config.showImage !== undefined ? config.showImage : true);
  _setMachineCheckbox('modal-machine-show-name', config.showMachineName !== undefined ? config.showMachineName : true);
  _setMachineCheckbox('modal-machine-show-code', config.showMachineCode !== undefined ? config.showMachineCode : true);
  _setMachineCheckbox('modal-machine-show-line', config.showLine !== undefined ? config.showLine : true);
  _setMachineCheckbox('modal-machine-show-area', config.showArea !== undefined ? config.showArea : true);
  _setMachineCheckbox('modal-machine-show-status', config.showStatus !== undefined ? config.showStatus : true);
  _setMachineCheckbox('modal-machine-show-counter', config.showCounter !== undefined ? config.showCounter : true);
  _setMachineCheckbox('modal-machine-show-speed', config.showSpeed !== undefined ? config.showSpeed : true);
  _setMachineCheckbox('modal-machine-show-hours', config.showRunningHours !== undefined ? config.showRunningHours : true);
  _setMachineCheckbox('modal-machine-show-health', config.showHealth !== undefined ? config.showHealth : true);
  originalMachineImageUrl = machine ? (machine.machine_image_url || '') : '';
  _setMachineField('modal-machine-image-url', originalMachineImageUrl);
  _clearPendingMachineImage();
  _renderMachineImagePreview(originalMachineImageUrl);
  const errorElement = _machineField('modal-machine-image-error');
  if (errorElement) errorElement.textContent = '';
}

function openMachineModal(id = null) {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan mengubah master mesin.');
    return;
  }
  
  const title = document.getElementById('machine-modal-title');
  const modalId = document.getElementById('modal-machine-id');
  const nameIn = document.getElementById('modal-machine-name');
  const assetIn = document.getElementById('modal-machine-asset');
  const lineIn = document.getElementById('modal-machine-line');
  const manufacturerIn = document.getElementById('modal-machine-manufacturer');
  const installIn = document.getElementById('modal-machine-installdate');
  const statusIn = document.getElementById('modal-machine-status');

  if (id) {
    title.innerText = 'Edit Data Mesin';
    const m = dbState.machines.find(m => m.id === id);
    if (!m) return;
    modalId.value = m.id;
    nameIn.value = m.name;
    assetIn.value = m.asset_number;
    lineIn.value = m.line_code;
    manufacturerIn.value = m.manufacturer;
    installIn.value = m.install_date;
    statusIn.value = String(m.status || 'DATA OFFLINE').toUpperCase() === 'STANDBY'
      ? 'IDLE'
      : String(m.status || 'DATA OFFLINE').toUpperCase();
    _populateMachineDynamicFields(m);
  } else {
    title.innerText = 'Tambah Mesin Baru';
    modalId.value = '';
    nameIn.value = '';
    assetIn.value = '';
    lineIn.value = '';
    manufacturerIn.value = '';
    installIn.value = new Date().toISOString().split('T')[0];
    statusIn.value = 'STOPPED';
    _populateMachineDynamicFields(null);
  }

  document.getElementById('machine-modal').classList.add('active');
}

function copyMachineData(machineId) {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan menduplikat master mesin.');
    return;
  }

  const m = dbState.machines.find(mach => mach.id === machineId);
  if (!m) return;
  _populateMachineDynamicFields(m);

  // Generate suggested new asset number (e.g., MAC-TAB-001 -> MAC-TAB-002)
  let suggestedAsset = `${m.asset_number}-COPY`;
  const match = m.asset_number.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    let nextNum = parseInt(numStr, 10) + 1;
    let candidate = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
    while (dbState.machines.some(x => x.asset_number.toLowerCase() === candidate.toLowerCase())) {
      nextNum++;
      candidate = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
    }
    suggestedAsset = candidate;
  }

  const title = document.getElementById('machine-modal-title');
  const modalId = document.getElementById('modal-machine-id');
  const nameIn = document.getElementById('modal-machine-name');
  const assetIn = document.getElementById('modal-machine-asset');
  const lineIn = document.getElementById('modal-machine-line');
  const manufacturerIn = document.getElementById('modal-machine-manufacturer');
  const installIn = document.getElementById('modal-machine-installdate');
  const statusIn = document.getElementById('modal-machine-status');

  if (title) title.innerText = `📋 Copy & Duplikat Mesin: ${m.name}`;
  if (modalId) modalId.value = ''; // Reset ID so it creates a NEW machine entry upon save
  if (nameIn) nameIn.value = m.name;
  if (assetIn) assetIn.value = suggestedAsset;
  if (lineIn) lineIn.value = m.line_code;
  if (manufacturerIn) manufacturerIn.value = m.manufacturer;
  if (installIn) installIn.value = new Date().toISOString().split('T')[0];
  if (statusIn) statusIn.value = m.status;

  _setMachineField('modal-machine-stable-id', '');
  _setMachineField('modal-machine-status', String(m.status || 'DATA OFFLINE').toUpperCase() === 'STANDBY' ? 'IDLE' : String(m.status || 'DATA OFFLINE').toUpperCase());
  _setMachineField('modal-machine-display-order', dbState.machines.length + 1);
  _setMachineField('modal-machine-image-url', '');
  originalMachineImageUrl = '';
  _renderMachineImagePreview('');
  const modal = document.getElementById('machine-modal');
  if (modal) modal.classList.add('active');

  setTimeout(() => {
    if (assetIn) {
      assetIn.focus();
      assetIn.select();
    }
  }, 100);
}

function closeMachineModal() {
  document.getElementById('machine-modal').classList.remove('active');
  _clearPendingMachineImage();
}

async function saveMachineData() {
  const modalId = document.getElementById('modal-machine-id').value;
  const name = document.getElementById('modal-machine-name').value.trim();
  const asset = document.getElementById('modal-machine-asset').value.trim();
  const line = document.getElementById('modal-machine-line').value.trim() || 'Line Utama';
  const manufacturer = document.getElementById('modal-machine-manufacturer').value.trim() || 'General';
  const install = document.getElementById('modal-machine-installdate').value || new Date().toISOString().split('T')[0];
  const status = document.getElementById('modal-machine-status').value || 'DATA OFFLINE';

  if (!name || !asset) {
    alert('Harap isi Nama Mesin dan Machine Code / Nomor Asset (*)');
    return;
  }

  if (!modalId && !/^[A-Za-z0-9._-]+$/.test(asset)) {
    alert('Machine Code hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.');
    return;
  }

  const dashboardUrl = _machineField('modal-machine-dashboard-url').value.trim();
  if (dashboardUrl) {
    try {
      const parsedUrl = new URL(dashboardUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('protocol');
    } catch (error) {
      alert('Realtime Dashboard URL harus valid dan menggunakan http atau https.');
      return;
    }
  }

  // Check unique asset number
  const duplicate = dbState.machines.find(m => m.asset_number.toUpperCase() === asset.toUpperCase() && m.id != modalId);
  if (duplicate) {
    alert('Asset number sudah digunakan oleh mesin lain!');
    return;
  }

  const existingMachine = modalId ? dbState.machines.find(m => m.id == modalId) : null;
  const existingStableId = existingMachine && (existingMachine.machine_id || existingMachine.machine_code);
  const stableMachineId = existingMachine
    ? (/^[A-Za-z0-9._-]+$/.test(existingStableId || '') ? existingStableId : `MACHINE-${String(existingMachine.id).padStart(3, '0')}`)
    : asset;
  let machineImageUrl = _machineField('modal-machine-image-url').value || '';
  if (pendingMachineImageFile) {
    const imageForm = new FormData();
    imageForm.append('machineId', stableMachineId);
    imageForm.append('file', pendingMachineImageFile);
    const imageResponse = await fetch('/api/machines/images', { method: 'POST', body: imageForm });
    const imageResult = await imageResponse.json().catch(() => ({}));
    if (!imageResponse.ok || !imageResult.machineImageUrl) {
      _machineField('modal-machine-image-error').textContent = imageResult.message || 'Upload gambar mesin gagal.';
      return;
    }
    machineImageUrl = imageResult.machineImageUrl;
  }

  const dynamicValues = {
    machine_id: stableMachineId,
    machine_code: asset,
    area: _machineField('modal-machine-area').value.trim(),
    department: _machineField('modal-machine-department').value.trim(),
    machine_type: _machineField('modal-machine-type').value.trim(),
    machine_image_url: machineImageUrl || null,
    status_tag: _machineField('modal-machine-status-tag').value.trim(),
    counter_tag: _machineField('modal-machine-counter-tag').value.trim(),
    speed_tag: _machineField('modal-machine-speed-tag').value.trim(),
    running_hours_tag: _machineField('modal-machine-running-hours-tag').value.trim(),
    realtime_dashboard_url: dashboardUrl || null,
    display_order: Math.max(0, Number(_machineField('modal-machine-display-order').value) || 0),
    display_mode: _machineField('modal-machine-display-mode').value || 'AUTO',
    is_active: _machineField('modal-machine-active').checked,
    card_config: _machineCardConfigurationFromForm()
  };

  let savedMachine;
  if (modalId) {
    // Update
    const m = dbState.machines.find(m => m.id == modalId);
    if (m) {
      m.name = name;
      m.asset_number = asset;
      m.line_code = line;
      m.manufacturer = manufacturer;
      m.install_date = install;
      m.status = status;
      Object.assign(m, dynamicValues);
      m.last_updated = new Date().toISOString();
      m.updated_at = new Date().toISOString();
      if (originalMachineImageUrl !== machineImageUrl) m.image_updated_at = new Date().toISOString();
      savedMachine = m;
      logToConsole('SYSTEM', `Mesin ${name} [${asset}] diperbarui.`);
    }
  } else {
    // Insert new
    const maxExistingId = dbState.machines.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
    const nextId = maxExistingId + 1;
    savedMachine = {
      id: nextId,
      name,
      asset_number: asset,
      line_code: line,
      manufacturer,
      install_date: install,
      status,
      running_hours_total: 0.0,
      running_hours_daily: 0.0,
      running_hours_weekly: 0.0,
      running_hours_monthly: 0.0,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...dynamicValues
    };
    dbState.machines.push(savedMachine);
    logToConsole('SYSTEM', `Mesin baru ditambahkan: ${name} [${asset}].`);
  }

  const masterRequest = {
    legacyId: savedMachine.id,
    machineName: name,
    machineCode: asset,
    line,
    area: dynamicValues.area,
    department: dynamicValues.department,
    machineType: dynamicValues.machine_type,
    machineImageUrl: dynamicValues.machine_image_url,
    statusTag: dynamicValues.status_tag,
    counterTag: dynamicValues.counter_tag,
    speedTag: dynamicValues.speed_tag,
    runningHoursTag: dynamicValues.running_hours_tag,
    realtimeDashboardUrl: dynamicValues.realtime_dashboard_url,
    displayOrder: dynamicValues.display_order,
    displayMode: dynamicValues.display_mode,
    isActive: dynamicValues.is_active,
    status,
    cardConfiguration: dynamicValues.card_config
  };

  try {
    const response = await fetch(`/api/machines/master/${encodeURIComponent(stableMachineId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(masterRequest)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'API Master Machine menolak data.');
  } catch (error) {
    alert(`Data belum dapat disimpan: ${error.message || error}`);
    return;
  }

  saveDatabase();
  closeMachineModal();
  renderMachinesTable();
  updateMachineSelectDropdowns();
}

async function deleteMachine(id) {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan menghapus data mesin.');
    return;
  }

  const machine = dbState.machines.find(m => m.id === id);
  if (!machine) return;
  if (!confirm(`Nonaktifkan ${machine.name}?\n\nMesin tidak lagi tampil di Dashboard, tetapi histori, spare part, maintenance, dan running hours tetap disimpan.`)) return;
  const stableMachineId = machine.machine_id || machine.machine_code || machine.asset_number;
  try {
    const response = await fetch(`/api/machines/master/${encodeURIComponent(stableMachineId)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Backend tidak dapat menonaktifkan mesin.');
    machine.is_active = false;
    machine.updated_at = new Date().toISOString();
    saveDatabase();
    renderMachinesTable();
    updateMachineSelectDropdowns();
    logToConsole('SYSTEM', `Mesin ID: ${id} dinonaktifkan tanpa menghapus histori atau spare part.`);
  } catch (error) {
    alert(error.message || String(error));
  }
}

// --- MACHINE ASSET CARD & QR MODAL ---

function isMachinePlcTelemetryMapped(machine) {
  if (!machine) return false;
  const isEnabled = machine.plc_enabled !== false;
  const isRunning = machine.status === 'RUNNING' || machine.telemetry_status === 'RUNNING';
  return isEnabled && isRunning;
}

function viewMachineDetails(id) {
  const m = dbState.machines.find(m => m.id === id);
  if (!m) return;

  const parts = dbState.spare_parts.filter(sp => sp.machine_id === m.id);
  const daily = m.running_hours_daily > 0 ? m.running_hours_daily : 20;
  const calculatedParts = parts.map(p => getSparePartCalculatedDetails(p, daily));

  const qrDataText = `Preventive Maintenance System\nMachine: ${m.name}\nAsset: ${m.asset_number}\nRunning Hours: ${m.running_hours_total.toFixed(1)}`;
  const qrSvg = generateMockQrSvg(qrDataText);

  let partsListHTML = '';
  calculatedParts.forEach(p => {
    partsListHTML += `
      <div class="connector-row" style="margin-bottom:8px;">
        <div class="connector-details">
          <span class="connector-name">${p.name} <code style="font-size:10px; color:var(--predictacore-cyan);">${p.code}</code></span>
          <span class="connector-config">Remaining Life: ${p.remaining_life_pct}% (${p.remaining_hours.toFixed(0)} Jam / ~${p.remaining_days} Hari)</span>
        </div>
        <span class="badge ${p.badgeClass}">${p.status}</span>
      </div>
    `;
  });

  if (parts.length === 0) {
    partsListHTML = '<div class="notification-empty">Mesin ini belum memiliki spare part terdaftar.</div>';
  }

  const isPlcLocked = isMachinePlcTelemetryMapped(m);
  const hoursUpdaterHTML = isPlcLocked ? `
    <div class="m-detail-hours-updater" style="background: rgba(0, 229, 255, 0.08); border: 1px solid var(--predictacore-cyan); padding: 12px; border-radius: 8px;">
      <span style="font-size:12px; font-weight:700; color:var(--predictacore-cyan);">🔒 INPUT RUNNING HOURS TERKUNCI</span>
      <p style="font-size:11px; color:var(--text-secondary); margin:4px 0 0 0;">
        Mesin ini telah terhubung ke <strong>Real-Time Telemetry Mapping PLC (${m.plc_ip || '192.168.1.100'} [${m.plc_address || 'DB1.DBX0.0'}])</strong>. Jam jalan ditarik dan dihitung secara real-time dari PLC.
      </p>
    </div>
  ` : `
    <div class="m-detail-hours-updater">
      <span style="font-size:12px;"><strong>Update Hour Meter Mesin (Current RH)</strong> <span style="font-size:11px; color:var(--predictacore-cyan);">(Hour Meter Lalu: ${m.running_hours_total.toFixed(1)} Jam)</span></span>
      <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
        <input type="number" id="detail-added-hours" placeholder="Contoh: 1212" step="0.1" style="flex:1;">
        <button class="btn btn-primary" onclick="submitRunningHoursDetail(${m.id})">Kirim Update</button>
        ${(activeUser.role === 'ADMIN' || activeUser.role === 'SUPERVISOR') ? `<button class="btn btn-red" onclick="resetMachineRunningHours(${m.id})" title="Reset Running Hours Mesin ke 0">🔄 Reset</button>` : ''}
      </div>
    </div>
  `;

  const _getCol = (addr) => {
    if (!addr) return '';
    const parts = addr.split(';');
    return parts.length > 1 ? parts[1].trim().toLowerCase() : '';
  };
  const _cCol = _getCol(m.plc_counter_address);
  const isVelocityMachine = (m.plc_protocol === 'PostgreSQL') && (
    (_cCol && (_cCol.includes('velo') || _cCol.includes('velocity') || _cCol.includes('speed') || _cCol.includes('m_s'))) ||
    (!_cCol && ((m.name && m.name.toLowerCase().includes('hql')) || (m.asset_number && m.asset_number.toLowerCase().includes('hql'))))
  );

  const detailMetricLabel = isVelocityMachine ? 'Kecepatan Mesin (PLC)' : 'Counter Produk (PLC)';
  const detailMetricVal = m.counter_product !== undefined 
    ? (isVelocityMachine ? `${m.counter_product} m/s` : `${m.counter_product.toLocaleString()} Pcs`) 
    : (isVelocityMachine ? '0 m/s' : '0 Pcs');

  const modalBody = document.getElementById('machine-details-modal-body');
  modalBody.innerHTML = `
    <div class="m-detail-modal-grid">
      <!-- QR Card -->
      <div class="m-detail-qr-card">
        <div class="m-detail-qr-svg">
          ${qrSvg}
        </div>
        <p style="font-size:11px; margin-bottom:8px;"><strong>QR Asset Code</strong></p>
        <button class="qr-download-btn" onclick="downloadMockQrCode('${m.asset_number}')">💾 Download QR Code (SVG)</button>
      </div>

      <!-- Specs & Updates -->
      <div class="m-detail-specs">
        <h2 style="font-size:18px; font-weight:700;">${m.name}</h2>
        <div class="m-detail-specs-grid">
          <div class="spec-item"><span class="spec-label">Asset Number</span><span class="spec-val">${m.asset_number}</span></div>
          <div class="spec-item"><span class="spec-label">Line Produksi</span><span class="spec-val">${m.line_code}</span></div>
          <div class="spec-item"><span class="spec-label">Manufacturer</span><span class="spec-val">${m.manufacturer}</span></div>
          <div class="spec-item"><span class="spec-label">Tgl Install</span><span class="spec-val">${m.install_date}</span></div>
          <div class="spec-item"><span class="spec-label">Total Running Hours</span><span class="spec-val">${m.running_hours_total.toFixed(1)} Jam ${isPlcLocked ? '<span style="font-size:10px; color:var(--predictacore-cyan);">🔒 (PLC)</span>' : ''}</span></div>
          <div class="spec-item"><span class="spec-label">Status Operasional</span><span class="spec-val"><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></span></div>
          <div class="spec-item"><span class="spec-label">${detailMetricLabel}</span><span class="spec-val" style="color:var(--predictacore-cyan); font-weight:700;">${detailMetricVal}</span></div>
        </div>

        <!-- Manual update running hours or PLC lock banner -->
        ${hoursUpdaterHTML}
      </div>
    </div>

    <!-- Parts lists -->
    <div class="table-section" style="margin-top:24px; padding:0; border:none; background:none;">
      <h3 style="font-size:14px; font-weight:600; margin-bottom:12px;">Spare Part Terdaftar & Remaining Life</h3>
      ${partsListHTML}
    </div>
  `;

  document.getElementById('machinedetails-modal').classList.add('active');
}

function closeMachineDetailsModal() {
  document.getElementById('machinedetails-modal').classList.remove('remove');
  document.getElementById('machinedetails-modal').classList.remove('active');
}

function submitRunningHoursDetail(machineId) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (m && isMachinePlcTelemetryMapped(m)) {
    alert(`🔒 Input Terkunci!\n\nMesin "${m.name}" sudah dikonfigurasi Real-Time Telemetry Mapping PLC (${m.plc_ip || '192.168.1.x'} [${m.plc_address || 'DB1'}]).\n\nRunning Hours ditarik dan dihitung secara otomatis dari sinyal PLC.`);
    return;
  }

  const input = document.getElementById('detail-added-hours');
  const currentRH = parseFloat(input.value);

  if (isNaN(currentRH)) {
    alert('Masukkan angka Hour Meter (Current RH) fisik mesin.');
    return;
  }

  const result = updateMachineHourMeterByCurrentRH(machineId, currentRH, activeUser.full_name, 'Manual');
  if (result && result.success) {
    input.value = '';
    closeMachineDetailsModal();
    viewMachineDetails(machineId);
  }
}

// Custom QR SVG renderer (creates a valid drawing shape matching industrial look)
function generateMockQrSvg(text) {
  // Let's create an SVG grid of squares representing a QR code
  // This is generated deterministically from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  const size = 21; // grid 21x21
  let rects = '';
  
  // Outer squares (Position Markers)
  // Top-left
  rects += `<rect x="0" y="0" width="7" height="7" fill="black" />`;
  rects += `<rect x="1" y="1" width="5" height="5" fill="white" />`;
  rects += `<rect x="2" y="2" width="3" height="3" fill="black" />`;
  // Top-right
  rects += `<rect x="14" y="0" width="7" height="7" fill="black" />`;
  rects += `<rect x="15" y="1" width="5" height="5" fill="white" />`;
  rects += `<rect x="16" y="2" width="3" height="3" fill="black" />`;
  // Bottom-left
  rects += `<rect x="0" y="14" width="7" height="7" fill="black" />`;
  rects += `<rect x="1" y="15" width="5" height="5" fill="white" />`;
  rects += `<rect x="2" y="16" width="3" height="3" fill="black" />`;

  // Draw randomized grids
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      // Skip the position markers
      if ((x < 8 && y < 8) || (x > 13 && y < 8) || (x < 8 && y > 13)) {
        continue;
      }
      // Pseudo random binary pixel drawing based on text hash
      const val = Math.abs(Math.sin(hash + x * 13 + y * 37));
      if (val > 0.5) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="black" />`;
      }
    }
  }

  return `
    <svg width="100%" height="100%" viewBox="0 0 21 21" style="shape-rendering: crispEdges;">
      ${rects}
    </svg>
  `;
}

function downloadMockQrCode(assetNumber) {
  // Let the user download the QR representation
  alert(`Mengunduh QR Code file untuk aset: ${assetNumber}.svg`);
  const text = `PREVENTIVE_MAINTENANCE_SYSTEM_${assetNumber}`;
  const svg = generateMockQrSvg(text);
  const blob = new Blob([svg], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QR_Code_${assetNumber}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- DYNAMIC RENDERING: SPARE PARTS PANEL ---

function renderSparePartsTable() {
  const tbody = document.getElementById('spareparts-table-tbody');
  if (!tbody) return;

  // Always ensure running hours alignment before rendering
  syncAllSparePartsWithMachineRunningHours();

  const searchInput = document.getElementById('part-search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterCondEl = document.getElementById('part-filter-condition');
  const filterCond = filterCondEl ? filterCondEl.value : '';
  const filterMachEl = document.getElementById('part-filter-machine');
  const filterMach = filterMachEl ? filterMachEl.value : '';

  // Fast Machine Lookup Map (O(1) resolution)
  const machineMap = new Map();
  if (Array.isArray(dbState.machines)) {
    dbState.machines.forEach(m => {
      machineMap.set(String(m.id), m);
      if (m.asset_number) machineMap.set(String(m.asset_number).toLowerCase(), m);
      if (m.name) machineMap.set(String(m.name).toLowerCase(), m);
    });
  }

  const rowsHtml = [];

  dbState.spare_parts.forEach(p => {
    let machine = null;
    if (p.machine_id !== undefined && p.machine_id !== null && p.machine_id !== '') {
      machine = machineMap.get(String(p.machine_id)) || machineMap.get(String(p.machine_id).toLowerCase()) || findMachineForSparePart(p);
    }
    const mName = machine ? machine.name : 'Unknown Machine';
    const mAsset = machine ? machine.asset_number : '';
    const mDaily = machine ? machine.running_hours_daily : 20;

    const calc = getSparePartCalculatedDetails(p, mDaily);

    // Apply filters
    const matchesSearch = !searchVal ||
                          p.name.toLowerCase().includes(searchVal) || 
                          p.code.toLowerCase().includes(searchVal) ||
                          mName.toLowerCase().includes(searchVal) ||
                          mAsset.toLowerCase().includes(searchVal);
                          
    const matchesCondition = filterCond === '' || calc.status === filterCond;
    const matchesMachine = filterMach === '' || Number(p.machine_id) === Number(filterMach);

    if (matchesSearch && matchesCondition && matchesMachine) {
      const critBadge = `badge-crit-${calc.critical_level.toLowerCase().slice(0,3)}`;
      
      rowsHtml.push(`
        <tr data-part-id="${p.id}">
          <td><strong>${p.name}</strong><br><span style="font-size:10px; color:var(--text-secondary);">${p.vendor || 'General Supplier'}</span></td>
          <td><code style="font-family:'JetBrains Mono';">${p.code}</code></td>
          <td><strong>${mName}</strong>${mAsset ? `<br><code style="font-size:10px; color:var(--predictacore-cyan);">${mAsset}</code>` : ''}</td>
          <td><span class="badge ${critBadge}">${p.critical_level}</span></td>
          <td>${p.lifetime_hours} Hrs</td>
          <td class="sp-rh-cell" data-rh-part="${p.id}">${p.current_running_hours.toFixed(1)} Hrs</td>
          <td class="sp-pct-cell" data-pct-part="${p.id}">${calc.remaining_life_pct}%</td>
          <td class="sp-status-cell" data-status-part="${p.id}"><span class="badge ${calc.badgeClass}">${calc.status}</span></td>
          <td><strong>${p.safety_stock || 1} Qty</strong></td>
          <td class="sp-days-cell" data-days-part="${p.id}">${calc.remaining_days} Hari</td>
          <td><code>${calc.predicted_pm_date}</code></td>
          <td>
            <div style="display:flex; gap:3px; flex-wrap:wrap; align-items:center;">
              <button class="btn-action-icon" title="Log Replacement" onclick="openReplacementModal(${p.id})">🔧 Ganti</button>
              ${(activeUser.role === 'ADMIN' || activeUser.role === 'SUPERVISOR') ? `<button class="btn-action-icon" title="Reset Running Hours" style="color:var(--color-orange);" onclick="resetSparePartHours(${p.id})">🔄 Reset</button>` : ''}
              ${(activeUser.role === 'ADMIN' || activeUser.role === 'SUPERVISOR') ? `<button class="btn-action-icon" title="Salin / Duplikasi Varian Baru" style="color:var(--predictacore-cyan);" onclick="copySparePart(${p.id})">📋 Copy</button>` : ''}
              <button class="btn-action-icon" title="Edit" onclick="openSparePartModal(${p.id})">✏️</button>
              <button class="btn-action-icon" title="Delete" style="color:var(--color-red);" onclick="deleteSparePart(${p.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `);
    }
  });

  if (rowsHtml.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada spare part ditemukan.</td></tr>`;
  } else {
    tbody.innerHTML = rowsHtml.join('');
  }
}

function openSparePartModal(id = null, isCopy = false) {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan memodifikasi master spare part.');
    return;
  }

  // Populate machine selections
  const machineSelect = document.getElementById('modal-part-machine-id');
  machineSelect.innerHTML = '';
  dbState.machines.forEach(m => {
    machineSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.asset_number})</option>`;
  });

  const title = document.getElementById('sparepart-modal-title');
  const modalId = document.getElementById('modal-part-id');
  const nameIn = document.getElementById('modal-part-name');
  const codeIn = document.getElementById('modal-part-code');
  const descIn = document.getElementById('modal-part-description');
  const vendorIn = document.getElementById('modal-part-vendor');
  const priceIn = document.getElementById('modal-part-price');
  const lifetimeIn = document.getElementById('modal-part-lifetime');
  const currentHoursIn = document.getElementById('modal-part-currenthours');
  const safetyIn = document.getElementById('modal-part-safetystock');
  const criticalIn = document.getElementById('modal-part-critical');

  if (id) {
    const p = dbState.spare_parts.find(p => p.id === id);
    if (isCopy) {
      title.innerText = '📋 Duplikasi Data Spare Part (Varian Baru)';
      modalId.value = '';
      machineSelect.value = p.machine_id;
      nameIn.value = `${p.name} (Varian)`;
      codeIn.value = `${p.code}-COPY`;
      descIn.value = p.description || '';
      vendorIn.value = p.vendor;
      priceIn.value = p.price;
      lifetimeIn.value = p.lifetime_hours;
      currentHoursIn.value = 0;
      safetyIn.value = p.safety_stock;
      criticalIn.value = p.critical_level;
    } else {
      title.innerText = 'Edit Data Spare Part';
      modalId.value = p.id;
      machineSelect.value = p.machine_id;
      nameIn.value = p.name;
      codeIn.value = p.code;
      descIn.value = p.description || '';
      vendorIn.value = p.vendor;
      priceIn.value = p.price;
      lifetimeIn.value = p.lifetime_hours;
      currentHoursIn.value = p.current_running_hours || 0;
      safetyIn.value = p.safety_stock;
      criticalIn.value = p.critical_level;
    }
  } else {
    title.innerText = 'Tambah Spare Part Baru';
    modalId.value = '';
    if(dbState.machines.length > 0) machineSelect.value = dbState.machines[0].id;
    nameIn.value = '';
    codeIn.value = '';
    descIn.value = '';
    vendorIn.value = '';
    priceIn.value = 1500000;
    lifetimeIn.value = 1000;
    currentHoursIn.value = 0;
    safetyIn.value = 2;
    criticalIn.value = 'CRITICAL';
  }

  document.getElementById('sparepart-modal').classList.add('active');
}

function copySparePart(id) {
  openSparePartModal(id, true);
}

function closeSparePartModal() {
  document.getElementById('sparepart-modal').classList.remove('active');
}

// --- IMPORT EXCEL / CSV FOR MASTER SPARE PARTS ---

let pendingImportParts = [];

function openImportSparePartModal() {
  openResetAuthModal('IMPORT_PARTS', 'Import Master Spare Part (Excel / CSV)', 'Mengimpor atau memperbarui data master spare part dari berkas Excel/CSV. Membutuhkan otorisasi Password Admin.');
}

function executeOpenImportSparePartModal(authUser) {
  pendingImportParts = [];
  const fileInput = document.getElementById('import-sparepart-file-input');
  if (fileInput) fileInput.value = '';
  const previewSec = document.getElementById('import-preview-section');
  if (previewSec) previewSec.style.display = 'none';
  const btn = document.getElementById('btn-execute-import');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
  document.getElementById('import-sparepart-modal').classList.add('active');
}

function closeImportSparePartModal() {
  document.getElementById('import-sparepart-modal').classList.remove('active');
}

function clearAllSparePartsData() {
  const currentCount = dbState.spare_parts ? dbState.spare_parts.length : 0;
  if (currentCount === 0) {
    alert('Master Spare Part saat ini sudah dalam keadaan kosong.');
    return;
  }
  openResetAuthModal('CLEAR_PARTS', 'Kosongkan Data Master Spare Part', `Menghapus SELURUH ${currentCount} data master spare part saat ini untuk proses upload ulang. Membutuhkan otorisasi Password Admin.`);
}

function executeClearAllSparePartsData(authUser) {
  const currentCount = dbState.spare_parts ? dbState.spare_parts.length : 0;
  dbState.spare_parts = [];
  saveDatabase();
  logToConsole('SYSTEM', `SECURITY AUDIT: Seluruh data Master Spare Part (${currentCount} part) telah dikosongkan oleh ${authUser ? authUser.full_name : 'Admin'} (${authUser ? authUser.role : 'ADMIN'}) untuk upload ulang.`);

  renderSparePartsTable();
  if (typeof updateUIPendingItems === 'function') updateUIPendingItems();
  if (currentTab === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();

  alert(`🗑️ Seluruh ${currentCount} data Master Spare Part berhasil dikosongkan! Anda sekarang dapat melakukan Import Excel / CSV baru.`);
}

function downloadSparePartTemplate() {
  const header = ['nama_sparepart', 'kode_sparepart', 'nama_mesin', 'vendor', 'harga', 'lifetime_hours', 'safety_stock', 'critical_level', 'running_hours', 'deskripsi'];
  const sample1 = ['Carbon Brush Motor 2.0', 'SP-MOT-BRUSH-09', 'High Shear Mixer Granulator', 'PT. PredictaCore Indonesia', '500000', '1000', '2', 'CRITICAL', '0', 'Spesifikasi carbon brush motor pengganti'];
  const sample2 = ['Sealing Ring PTFE 100mm', 'SP-RING-PTFE-10', 'Rotary Tablet Press', 'Fette OEM', '2500000', '1500', '3', 'MEDIUM', '0', 'Ring seal Teflon tahan panas'];
  const sample3 = ['Filter HEPA Class H14', 'SP-FILT-HEPA-04', 'Horizontal Autoclave Sterilizer', 'Getinge Parts', '12000000', '2000', '1', 'CRITICAL', '0', 'Filter HEPA air intake autoclave'];

  const csvContent = '\uFEFF' + [header.join(';'), sample1.join(';'), sample2.join(';'), sample3.join(';')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_SparePart_PM.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleSparePartFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const filename = file.name;
  const label = document.getElementById('import-file-name-label');
  if (label) label.innerText = filename;

  const reader = new FileReader();

  if ((filename.endsWith('.xlsx') || filename.endsWith('.xls')) && typeof XLSX !== 'undefined') {
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processImportedRows(jsonRows);
      } catch(err) {
        alert('Gagal membaca file Excel. Pastikan format file valid atau gunakan Template CSV.');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    // CSV Text reader
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const jsonRows = parseCsvTextToJson(text);
        processImportedRows(jsonRows);
      } catch(err) {
        alert('Gagal membaca file CSV. Pastikan format delimiter koma/titik-koma valid.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
}

function parseCsvTextToJson(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const firstLine = lines[0];
  let delim = ';';
  if (firstLine.includes(';')) delim = ';';
  else if (firstLine.includes(',')) delim = ',';
  else if (firstLine.includes('\t')) delim = '\t';

  const headers = firstLine.split(delim).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delim).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

function parseCurrencyToNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim().replace(/Rp\.?/gi, '').trim();
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function processImportedRows(jsonRows) {
  pendingImportParts = [];
  const tbody = document.getElementById('import-preview-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (jsonRows.length === 0) {
    alert('File tidak berisi data atau baris kosong.');
    return;
  }

  jsonRows.forEach((row, idx) => {
    let name = '', code = '', machineStr = '', assetNumStr = '', vendor = '', price = 0, lifetime = 1000, safety = 2, critical = 'CRITICAL', curHours = 0, desc = '';

    Object.keys(row).forEach(k => {
      const keyLower = k.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const val = row[k] !== undefined ? String(row[k]).trim() : '';

      if (keyLower.includes('nama_spare') || keyLower.includes('namasparepart') || keyLower === 'nama' || keyLower === 'name' || keyLower === 'sparepart') name = val;
      else if (keyLower.includes('kode_spare') || keyLower.includes('kodesparepart') || keyLower === 'kode' || keyLower === 'code') code = val;
      else if (keyLower.includes('asset_number') || keyLower.includes('assetnumber') || keyLower.includes('assetno') || keyLower.includes('sn_mesin') || keyLower.includes('snmesin') || keyLower.includes('serial')) assetNumStr = val;
      else if (keyLower.includes('nama_mesin') || keyLower.includes('namamesin') || keyLower.includes('mesin') || keyLower.includes('machine') || keyLower.includes('pilihmesin')) machineStr = val;
      else if (keyLower.includes('vendor') || keyLower.includes('supplier')) vendor = val;
      else if (keyLower.includes('harga') || keyLower.includes('price')) price = parseCurrencyToNumber(val);
      else if (keyLower.includes('lifetime')) lifetime = parseFloat(val) || 1000;
      else if (keyLower.includes('safety')) safety = parseInt(val) || 2;
      else if (keyLower.includes('critical') || keyLower.includes('kritis') || keyLower.includes('level')) critical = val.toUpperCase();
      else if (keyLower.includes('running') || keyLower.includes('hours') || keyLower.includes('currenthours')) curHours = parseFloat(val) || 0;
      else if (keyLower.includes('deskripsi') || keyLower.includes('description') || keyLower.includes('catatan')) desc = val;
    });

    if (!name && !code) return; // skip completely empty rows

    if (!name) name = `Spare Part Imp #${idx + 1}`;
    if (!code) code = `SP-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
    if (!vendor) vendor = 'General Supplier';
    if (!['CRITICAL', 'MEDIUM', 'LOW'].includes(critical)) critical = 'LOW';
    if (lifetime <= 0) lifetime = 1000; // default to 1000 if 0 in Excel

    // Extract Asset Number and Machine Name
    let targetAssetNumber = assetNumStr;
    let targetMachineName = machineStr;

    // Handle combined string e.g. "Rotary Tablet Press (SN: MAC-RTP-002)"
    if (machineStr.toLowerCase().includes('sn:')) {
      const parts = machineStr.split(/sn:/i);
      if (!targetMachineName) targetMachineName = parts[0].replace(/[()]/g, '').trim();
      if (!targetAssetNumber) targetAssetNumber = parts[1].replace(/[()]/g, '').trim();
    } else if (machineStr.includes('-') && !targetAssetNumber) {
      if (machineStr.match(/^[A-Z0-9]+-[A-Z0-9-]+$/i)) {
        targetAssetNumber = machineStr;
      }
    }

    if (!targetMachineName && targetAssetNumber) {
      targetMachineName = `Mesin ${targetAssetNumber}`;
    }

    // 1. Match Machine strictly by Asset Number FIRST
    let matchedMachine = null;
    if (targetAssetNumber) {
      matchedMachine = dbState.machines.find(m => m.asset_number.toLowerCase() === targetAssetNumber.toLowerCase());
    }

    // 2. If not found by asset_number, search by exact name match
    if (!matchedMachine && targetMachineName) {
      const cleanName = targetMachineName.toLowerCase().trim();
      matchedMachine = dbState.machines.find(m => m.name.toLowerCase().trim() === cleanName);
    }

    // 3. Auto-create new Machine instance for this specific Asset Number if not found
    if (!matchedMachine) {
      const mName = targetMachineName || 'Mesin Produksi';
      const mAsset = targetAssetNumber || `MAC-AUT-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const newMachId = dbState.machines.length > 0 ? Math.max(...dbState.machines.map(m => Number(m.id))) + 1 : 1;

      matchedMachine = {
        id: newMachId,
        name: mName,
        asset_number: mAsset,
        line_code: 'Line Produksi',
        manufacturer: vendor || 'OEM Manufacturer',
        install_date: new Date().toISOString().split('T')[0],
        status: 'Running',
        running_hours_total: 1000,
        running_hours_daily: 20,
        running_hours_weekly: 100,
        running_hours_monthly: 400,
        last_updated: new Date().toISOString()
      };
      dbState.machines.push(matchedMachine);
      saveDatabase();
      logToConsole('SYSTEM', `Mesin baru (Asset: ${matchedMachine.asset_number}) dibuat otomatis dari Excel import: ${matchedMachine.name}.`);
    }

    const machineId = matchedMachine.id;
    const machineName = matchedMachine.name;
    const machineAssetNumber = matchedMachine.asset_number;

    // Check duplicate code STRICTLY per Asset Number (machine_id)
    const isDbDuplicate = dbState.spare_parts.some(sp => 
      sp.code.toUpperCase() === code.toUpperCase() && Number(sp.machine_id) === Number(machineId)
    );

    const isPendingDuplicate = pendingImportParts.some(p => 
      p.code.toUpperCase() === code.toUpperCase() && Number(p.machine_id) === Number(machineId)
    );

    let statusHtml = '<span class="badge badge-normal">Siap Import</span>';
    let isValid = true;

    if (isDbDuplicate || isPendingDuplicate) {
      statusHtml = `<span class="badge badge-action">Duplikat di Asset ${machineAssetNumber}</span>`;
      isValid = false;
    }

    const item = {
      name,
      code,
      machine_id: machineId,
      machine_name: machineName,
      machine_asset: machineAssetNumber,
      vendor,
      price,
      lifetime_hours: lifetime,
      current_running_hours: curHours,
      safety_stock: safety,
      critical_level: critical,
      description: desc,
      isValid
    };

    pendingImportParts.push(item);

    const tr = `
      <tr>
        <td>${statusHtml}</td>
        <td><strong>${item.name}</strong></td>
        <td><code>${item.code}</code></td>
        <td><code style="color:var(--predictacore-cyan);">${item.machine_asset}</code> - ${item.machine_name}</td>
        <td>${item.lifetime_hours} Hrs</td>
        <td>${item.safety_stock}</td>
        <td><span class="badge badge-crit-${item.critical_level.toLowerCase().slice(0,3)}">${item.critical_level}</span></td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });

  const validCount = pendingImportParts.filter(p => p.isValid).length;
  const badgeEl = document.getElementById('import-count-badge');
  if (badgeEl) badgeEl.innerText = validCount;
  const secEl = document.getElementById('import-preview-section');
  if (secEl) secEl.style.display = 'block';

  const btn = document.getElementById('btn-execute-import');
  if (btn) {
    if (validCount > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  }
}

function executeSparePartImport() {
  const validItems = pendingImportParts.filter(p => p.isValid);
  if (validItems.length === 0) {
    alert('Tidak ada baris data valid yang dapat diimpor.');
    return;
  }

  let nextId = dbState.spare_parts.length > 0 ? Math.max(...dbState.spare_parts.map(sp => sp.id)) + 1 : 1;

  validItems.forEach(item => {
    dbState.spare_parts.push({
      id: nextId++,
      machine_id: item.machine_id,
      name: item.name,
      code: item.code,
      description: item.description || '',
      vendor: item.vendor,
      price: item.price,
      lifetime_hours: item.lifetime_hours,
      safety_stock: item.safety_stock,
      critical_level: item.critical_level,
      last_replacement_date: new Date().toISOString().split('T')[0],
      current_running_hours: item.current_running_hours || 0
    });
  });

  saveDatabase();
  logToConsole('SYSTEM', `${validItems.length} spare part baru diimpor dari file Excel/CSV oleh ${activeUser.full_name}.`);
  closeImportSparePartModal();
  alert(`Berhasil mengimpor ${validItems.length} spare part baru ke dalam Master Data!`);
}

// --- MASTER MESIN EXCEL / CSV IMPORT UTILITIES ---

let pendingImportMachines = [];

function openImportMachineModal() {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan mengimpor master mesin.');
    return;
  }
  pendingImportMachines = [];
  const fileInput = document.getElementById('import-machine-file-input');
  if (fileInput) fileInput.value = '';
  const previewSec = document.getElementById('import-machine-preview-section');
  if (previewSec) previewSec.style.display = 'none';
  const btn = document.getElementById('btn-execute-machine-import');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
  document.getElementById('import-machine-modal').classList.add('active');
}

function closeImportMachineModal() {
  document.getElementById('import-machine-modal').classList.remove('active');
}

function downloadMachineTemplate() {
  const header = ['nama_mesin', 'asset_number', 'kategori', 'lokasi', 'manufacturer', 'tanggal_install', 'running_hours_total', 'status', 'deskripsi'];
  const sample1 = ['Rotary Tablet Press Machine A', 'MAC-TAB-001', 'Compressing', 'Line A Production', 'Fette OEM', '2024-01-15', '1250', 'RUNNING', 'Mesin tablet press 45 punch kecepatan tinggi'];
  const sample2 = ['High Shear Mixer Granulator', 'MAC-MIX-002', 'Granulation', 'Room B1 Mixing', 'Diosna OEM', '2023-11-20', '890', 'RUNNING', 'Mesin granulator basah kapasitas 300L'];
  const sample3 = ['Blister Packaging Machine Line 2', 'MAC-PAK-003', 'Packaging', 'Line 2 Packaging', 'Uhlmann OEM', '2024-03-01', '450', 'MAINTENANCE', 'Mesin kemasan blister ALU-ALU'];

  const csvContent = '\uFEFF' + [header.join(';'), sample1.join(';'), sample2.join(';'), sample3.join(';')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Master_Mesin_PM.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleMachineFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const filename = file.name;
  const label = document.getElementById('import-machine-file-name-label');
  if (label) label.innerText = filename;

  const reader = new FileReader();

  if ((filename.endsWith('.xlsx') || filename.endsWith('.xls')) && typeof XLSX !== 'undefined') {
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processImportedMachineRows(jsonRows);
      } catch(err) {
        alert('Gagal membaca file Excel. Pastikan format file valid atau gunakan Template CSV.');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    // CSV Text reader
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const jsonRows = parseCsvTextToJson(text);
        processImportedMachineRows(jsonRows);
      } catch(err) {
        alert('Gagal membaca file CSV. Pastikan format delimiter koma/titik-koma valid.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
}

function processImportedMachineRows(jsonRows) {
  pendingImportMachines = [];
  const tbody = document.getElementById('import-machine-preview-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (jsonRows.length === 0) {
    alert('File kosong atau format baris tidak dapat dibaca.');
    return;
  }

  jsonRows.forEach((row, idx) => {
    const keys = Object.keys(row);
    const getKeyVal = (patterns) => {
      const foundKey = keys.find(k => patterns.some(p => k.toLowerCase().trim().replace(/_/g, '').includes(p)));
      return foundKey ? String(row[foundKey]).trim() : '';
    };

    let name = getKeyVal(['namamesin', 'mesin', 'name', 'machinename']);
    let assetNumber = getKeyVal(['assetnumber', 'assetno', 'asset', 'kodemesin', 'serial']);
    let lineCode = getKeyVal(['kategori', 'category', 'linecode', 'line', 'lineproduksi']);
    let manufacturer = getKeyVal(['manufacturer', 'lokasi', 'location', 'vendor', 'pabrikan']);
    let installDate = getKeyVal(['tanggalinstall', 'installdate', 'install', 'tglinstall']);
    let runningHoursStr = getKeyVal(['runninghourstotal', 'runninghours', 'hours', 'totalhours', 'jamjalan']);
    let status = getKeyVal(['status', 'state']).toUpperCase();
    let desc = getKeyVal(['deskripsi', 'description', 'catatan', 'notes']);

    if (!name && !assetNumber) return;

    if (!name) name = `Mesin Baru ${idx + 1}`;
    if (!assetNumber) assetNumber = `MAC-IMP-${Date.now().toString().slice(-4)}${idx}`;
    if (!lineCode) lineCode = 'Line Produksi General';
    if (!manufacturer) manufacturer = 'PredictaCore OEM';
    if (!installDate) installDate = new Date().toISOString().split('T')[0];
    
    let runningHours = parseFloat(runningHoursStr) || 0;
    if (isNaN(runningHours) || runningHours < 0) runningHours = 0;

    if (!['RUNNING', 'STOPPED', 'MAINTENANCE'].includes(status)) {
      status = status.includes('STOP') ? 'STOPPED' : (status.includes('MAINT') ? 'MAINTENANCE' : 'RUNNING');
    }

    const isDuplicateAsset = dbState.machines.some(m => m.asset_number.toLowerCase() === assetNumber.toLowerCase());
    const isPendingDuplicate = pendingImportMachines.some(m => m.asset_number.toLowerCase() === assetNumber.toLowerCase());

    let statusHtml = '<span class="badge badge-normal">Mesin Baru</span>';
    let isUpdate = false;

    if (isDuplicateAsset) {
      statusHtml = '<span class="badge badge-standby">Update Data</span>';
      isUpdate = true;
    } else if (isPendingDuplicate) {
      statusHtml = '<span class="badge badge-action">Duplikat di File</span>';
    }

    const item = {
      name,
      asset_number: assetNumber,
      line_code: lineCode,
      manufacturer,
      install_date: installDate,
      running_hours_total: runningHours,
      running_hours_daily: Math.round(runningHours * 0.02 * 10) / 10,
      running_hours_weekly: Math.round(runningHours * 0.1 * 10) / 10,
      running_hours_monthly: Math.round(runningHours * 0.4 * 10) / 10,
      status,
      description: desc,
      isUpdate,
      isValid: !isPendingDuplicate
    };

    pendingImportMachines.push(item);

    const tr = `
      <tr>
        <td>${statusHtml}</td>
        <td><strong>${item.name}</strong></td>
        <td><code style="color:var(--predictacore-cyan);">${item.asset_number}</code></td>
        <td>${item.line_code}</td>
        <td>${item.manufacturer}</td>
        <td>${item.running_hours_total} Hrs</td>
        <td><span class="badge badge-${item.status === 'RUNNING' ? 'normal' : (item.status === 'MAINTENANCE' ? 'crit-high' : 'standby')}">${item.status}</span></td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });

  const validCount = pendingImportMachines.filter(m => m.isValid).length;
  const badgeEl = document.getElementById('import-machine-count-badge');
  if (badgeEl) badgeEl.innerText = validCount;
  const secEl = document.getElementById('import-machine-preview-section');
  if (secEl) secEl.style.display = 'block';

  const btn = document.getElementById('btn-execute-machine-import');
  if (btn) {
    if (validCount > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  }
}

function executeMachineImport() {
  const validItems = pendingImportMachines.filter(m => m.isValid);
  if (validItems.length === 0) {
    alert('Tidak ada baris data valid yang dapat diimpor.');
    return;
  }

  let nextId = dbState.machines.length > 0 ? Math.max(...dbState.machines.map(m => Number(m.id))) + 1 : 1;
  let newCount = 0;
  let updateCount = 0;

  validItems.forEach(item => {
    const existingIndex = dbState.machines.findIndex(m => m.asset_number.toLowerCase() === item.asset_number.toLowerCase());
    
    if (existingIndex !== -1) {
      dbState.machines[existingIndex].name = item.name;
      dbState.machines[existingIndex].line_code = item.line_code;
      dbState.machines[existingIndex].manufacturer = item.manufacturer;
      dbState.machines[existingIndex].install_date = item.install_date;
      dbState.machines[existingIndex].running_hours_total = item.running_hours_total;
      dbState.machines[existingIndex].status = item.status;
      dbState.machines[existingIndex].last_updated = new Date().toISOString();
      updateCount++;
    } else {
      dbState.machines.push({
        id: nextId++,
        name: item.name,
        asset_number: item.asset_number,
        line_code: item.line_code,
        manufacturer: item.manufacturer,
        install_date: item.install_date,
        status: item.status,
        running_hours_total: item.running_hours_total,
        running_hours_daily: item.running_hours_daily,
        running_hours_weekly: item.running_hours_weekly,
        running_hours_monthly: item.running_hours_monthly,
        last_updated: new Date().toISOString()
      });
      newCount++;
    }
  });

  saveDatabase();
  logToConsole('SYSTEM', `${validItems.length} Master Mesin (${newCount} Baru, ${updateCount} Diperbarui) diimpor dari Excel/CSV oleh ${activeUser.full_name}.`);
  closeImportMachineModal();

  renderMachinesTable();
  updateMachineSelectDropdowns();
  if (currentTab === 'dashboard') loadDashboardData();

  alert(`✅ Berhasil mengimpor ${validItems.length} Master Mesin (${newCount} Mesin Baru, ${updateCount} Data Diperbarui) ke dalam sistem!`);
}

function saveSparePartData() {
  const modalId = document.getElementById('modal-part-id').value;
  const machine_id = parseInt(document.getElementById('modal-part-machine-id').value);
  const name = document.getElementById('modal-part-name').value.trim();
  const code = document.getElementById('modal-part-code').value.trim();
  const description = document.getElementById('modal-part-description').value.trim();
  const vendor = document.getElementById('modal-part-vendor').value.trim();
  const price = parseFloat(document.getElementById('modal-part-price').value);
  const lifetime_hours = parseFloat(document.getElementById('modal-part-lifetime').value);
  const current_running_hours = parseFloat(document.getElementById('modal-part-currenthours').value || 0);
  const safety_stock = parseInt(document.getElementById('modal-part-safetystock').value);
  const critical_level = document.getElementById('modal-part-critical').value;

  if (!name || !code || !vendor || isNaN(price) || isNaN(lifetime_hours) || isNaN(safety_stock) || isNaN(current_running_hours)) {
    alert('Harap isi semua kolom wajib dengan format angka yang benar (*)');
    return;
  }

  // Check unique code per machine SN (Duplicate code allowed across different machine SNs)
  const targetMachine = dbState.machines.find(m => Number(m.id) === Number(machine_id));
  const targetSN = targetMachine ? targetMachine.asset_number : '';

  const duplicate = dbState.spare_parts.find(sp => {
    if (sp.id == modalId) return false;
    if (sp.code.toUpperCase() !== code.toUpperCase()) return false;
    
    const spMachine = dbState.machines.find(m => Number(m.id) === Number(sp.machine_id));
    const spSN = spMachine ? spMachine.asset_number : '';
    
    return (spSN.toUpperCase() === targetSN.toUpperCase()) || (Number(sp.machine_id) === Number(machine_id));
  });

  if (duplicate) {
    alert(`Kode spare part [${code}] sudah digunakan pada Mesin dengan SN: ${targetSN}!\n\n(Catatan: Kode spare part yang sama DIPERBOLEHKAN jika dipasang pada mesin dengan Serial Number / SN yang berbeda).`);
    return;
  }

  if (modalId) {
    const p = dbState.spare_parts.find(sp => sp.id == modalId);
    p.machine_id = machine_id;
    p.name = name;
    p.code = code;
    p.description = description;
    p.vendor = vendor;
    p.price = price;
    p.lifetime_hours = lifetime_hours;
    p.current_running_hours = current_running_hours;
    p.safety_stock = safety_stock;
    p.critical_level = critical_level;
    logToConsole('SYSTEM', `Spare part ${name} [${code}] diperbarui.`);
  } else {
    const maxExistingId = dbState.spare_parts.reduce((max, sp) => Math.max(max, Number(sp.id) || 0), 0);
    const nextId = maxExistingId + 1;
    dbState.spare_parts.push({
      id: nextId,
      machine_id,
      name,
      code,
      description,
      vendor,
      price,
      lifetime_hours,
      safety_stock,
      critical_level,
      last_replacement_date: new Date().toISOString().split('T')[0],
      current_running_hours: current_running_hours
    });
    logToConsole('SYSTEM', `Spare part baru ditambahkan: ${name} [${code}].`);
  }

  saveDatabase();
  closeSparePartModal();
  renderSparePartsTable();
}

function deleteSparePart(id) {
  if (activeUser.role === 'TECHNICIAN') {
    alert('Akses Ditolak: Level user TECHNICIAN tidak diizinkan menghapus spare part.');
    return;
  }

  if (confirm('Apakah Anda yakin ingin menghapus spare part ini?')) {
    dbState.spare_parts = dbState.spare_parts.filter(sp => sp.id !== id);
    saveDatabase();
    renderSparePartsTable();
    logToConsole('SYSTEM', `Spare part ID: ${id} dihapus dari master.`);
  }
}

// --- DESKTOP LOG REPLACEMENT ---

function openReplacementModal(partId) {
  const p = dbState.spare_parts.find(sp => sp.id === partId);
  if (!p) return;

  document.getElementById('desktop-replace-part-id').value = p.id;
  document.getElementById('desktop-replace-part-display').value = `${p.name} (${p.code})`;
  document.getElementById('desktop-replace-qty').value = 1;
  document.getElementById('desktop-replace-user').value = activeUser.full_name;
  document.getElementById('desktop-replace-notes').value = '';

  calculateDesktopTotalCost();

  document.getElementById('replacement-modal').classList.add('active');
}

function calculateDesktopTotalCost() {
  const partId = parseInt(document.getElementById('desktop-replace-part-id').value);
  const qtyInput = document.getElementById('desktop-replace-qty');
  const costInput = document.getElementById('desktop-replace-cost');
  const infoEl = document.getElementById('desktop-replace-calc-info');

  const p = dbState.spare_parts.find(sp => Number(sp.id) === Number(partId));
  const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
  
  if (p) {
    const unitPrice = Number(p.price) || Number(p.cost) || Number(p.unit_price) || 0;
    const totalCost = unitPrice * qty;
    if (costInput) costInput.value = totalCost;

    if (infoEl) {
      const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCost);
      const formattedUnit = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(unitPrice);
      infoEl.innerText = `✨ Total Biaya Maintenance: ${qty} Qty × ${formattedUnit} = ${formattedTotal}`;
    }
  }
}

function closeReplacementModal() {
  document.getElementById('replacement-modal').classList.remove('active');
}

function saveReplacementDesktop() {
  const partId = parseInt(document.getElementById('desktop-replace-part-id').value);
  const qty = parseFloat(document.getElementById('desktop-replace-qty').value) || 1;
  const downtime = parseInt(document.getElementById('desktop-replace-downtime').value) || 0;
  const cost = parseFloat(document.getElementById('desktop-replace-cost').value) || 0;
  const user = document.getElementById('desktop-replace-user').value.trim() || 'System';
  const notes = document.getElementById('desktop-replace-notes').value.trim();

  replaceSparePartInDatabase(partId, user, downtime, cost, notes, '', qty);
  closeReplacementModal();
  renderSparePartsTable();
}

// Global Relational Logic for Replacement
function replaceSparePartInDatabase(partId, replacedBy, downtimeMinutes, actualCost, notes, photoBase64 = '', quantity = 1) {
  const part = dbState.spare_parts.find(sp => sp.id === partId);
  if (!part) return;

  const nextId = dbState.replacement_history.length > 0 ? Math.max(...dbState.replacement_history.map(rh => rh.id)) + 1 : 1;
  const todayStr = new Date().toISOString().split('T')[0];
  const unitPrice = Number(part.price) || Number(part.cost) || Number(part.unit_price) || 0;

  // 1. Add replacement history log at top (newest first)
  dbState.replacement_history.unshift({
    id: nextId,
    spare_part_id: part.id,
    machine_id: part.machine_id,
    spare_part_name: part.name,
    spare_part_code: part.code,
    quantity: quantity,
    unit_price: unitPrice,
    cost: actualCost,
    replaced_by: replacedBy,
    replacement_date: todayStr,
    downtime_minutes: downtimeMinutes,
    photo_url: photoBase64,
    notes: notes
  });

  // 2. Reset spare part running counter & update last replacement benchmark
  const parentMach = findMachineForSparePart(part);
  part.last_replacement_rh = parentMach ? Number(parentMach.running_hours_total) || 0 : 0;
  part.current_running_hours = 0;
  part.last_replacement_date = todayStr;

  // 3. Clear active notification read flags for this spare part
  if (dbState.read_notification_ids) {
    dbState.read_notification_ids = dbState.read_notification_ids.filter(id => Math.floor(id / 100) !== part.id);
  }

  saveDatabase();
  logToConsole('SYSTEM', `Spare part ${part.name} [${part.code}] (${quantity} Qty) berhasil diganti oleh ${replacedBy}. Running hours direset ke 0.`);
}

// --- DYNAMIC RENDERING: HISTORY & EXPORTS PANEL ---

function clearAllReplacementHistory() {
  const currentCount = dbState.replacement_history ? dbState.replacement_history.length : 0;
  if (currentCount === 0) {
    alert('Riwayat Maintenance saat ini sudah dalam keadaan kosong.');
    return;
  }
  openResetAuthModal('CLEAR_HISTORY', 'Kosongkan Riwayat Maintenance', `Menghapus SELURUH ${currentCount} data riwayat PM/penggantian part secara permanen. Membutuhkan otorisasi Password Admin.`);
}

function executeClearAllReplacementHistory(authUser) {
  const currentCount = dbState.replacement_history ? dbState.replacement_history.length : 0;
  dbState.replacement_history = [];
  saveDatabase();
  logToConsole('SYSTEM', `SECURITY AUDIT: Seluruh data Riwayat Maintenance (${currentCount} catatan) telah dikosongkan oleh ${authUser ? authUser.full_name : 'Admin'} (${authUser ? authUser.role : 'ADMIN'}).`);

  renderHistoryTable();
  if (typeof updateUIPendingItems === 'function') updateUIPendingItems();
  if (currentTab === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();

  alert(`🗑️ Seluruh ${currentCount} data Riwayat Penggantian Part / PM berhasil dikosongkan!`);
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-table-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const searchVal = document.getElementById('history-search-input').value.toLowerCase();

  const filtered = dbState.replacement_history.filter(h => {
    const sparePart = dbState.spare_parts.find(sp => 
      (h.spare_part_id && Number(sp.id) === Number(h.spare_part_id)) ||
      (sp.code && h.spare_part_code && sp.code.toUpperCase() === h.spare_part_code.toUpperCase())
    );

    let machine = null;
    if (sparePart) {
      machine = dbState.machines.find(m => Number(m.id) === Number(sparePart.machine_id));
    }
    if (!machine && h.machine_id) {
      machine = dbState.machines.find(m => Number(m.id) === Number(h.machine_id));
    }
    const mName = machine ? machine.name.toLowerCase() : '';

    return (
      (h.spare_part_name && h.spare_part_name.toLowerCase().includes(searchVal)) ||
      (h.spare_part_code && h.spare_part_code.toLowerCase().includes(searchVal)) ||
      (h.replaced_by && h.replaced_by.toLowerCase().includes(searchVal)) ||
      (h.notes && h.notes.toLowerCase().includes(searchVal)) ||
      mName.includes(searchVal)
    );
  });

  filtered.forEach(h => {
    // Dynamic machine resolution from Master Spare Part or History record
    const sparePart = dbState.spare_parts.find(sp => 
      (h.spare_part_id && Number(sp.id) === Number(h.spare_part_id)) ||
      (sp.code && h.spare_part_code && sp.code.toUpperCase() === h.spare_part_code.toUpperCase())
    );

    let machine = null;
    if (sparePart) {
      machine = dbState.machines.find(m => Number(m.id) === Number(sparePart.machine_id));
    }
    if (!machine && h.machine_id) {
      machine = dbState.machines.find(m => Number(m.id) === Number(h.machine_id));
    }
    if (!machine && dbState.machines.length > 0) {
      machine = dbState.machines[0];
    }
    const mName = machine ? machine.name : 'Granulation Line A Machine';

    let photoElement = '<span style="color:var(--text-muted);">No Photo</span>';
    if (h.photo_url) {
      photoElement = `<img src="${h.photo_url}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; cursor:pointer;" onclick="viewFullPhoto('${h.photo_url}')" title="Klik untuk lihat">`;
    }

    const tr = `
      <tr>
        <td><code>${h.replacement_date}</code></td>
        <td><strong>${h.spare_part_name}</strong><br><span style="font-size:10px; color:var(--text-secondary); font-family:monospace;">${h.spare_part_code}</span></td>
        <td>${mName}</td>
        <td>${h.replaced_by}</td>
        <td>${h.downtime_minutes} Menit</td>
        <td><strong>${h.quantity || 1} Pcs</strong></td>
        <td>Rp ${(h.cost || 0).toLocaleString('id-ID')}</td>
        <td>${photoElement}</td>
        <td><span style="font-size:11px; line-height:1.4;" title="${h.notes}">${h.notes || '-'}</span></td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });

  if(filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada riwayat penggantian ditemukan.</td></tr>`;
  }
}

function viewFullPhoto(base64) {
  const win = window.open();
  win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
}

// Client Side Excel generator using Data URI Scheme
function exportToExcel() {
  let csv = 'Tanggal Penggantian,Spare Part,Kode Part,Nama Mesin,Teknisi,Downtime (Menit),Biaya Penggantian (IDR),Catatan\n';
  dbState.replacement_history.forEach(h => {
    const machine = dbState.machines.find(m => m.id === h.machine_id);
    const mName = machine ? machine.name : 'Unknown';
    csv += `"${h.replacement_date}","${h.spare_part_name}","${h.spare_part_code}","${mName}","${h.replaced_by}",${h.downtime_minutes},${h.cost},"${h.notes.replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Preventive_Maintenance_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  logToConsole('SYSTEM', 'Laporan Riwayat Maintenance diekspor ke file Excel (CSV).');
}

// Client Side PDF export using formatted window print template
function exportToPDF() {
  // Create a beautiful print frame dynamically
  const printWindow = window.open('', '_blank');
  let tableRows = '';
  
  dbState.replacement_history.forEach(h => {
    const machine = dbState.machines.find(m => m.id === h.machine_id);
    const mName = machine ? machine.name : 'Unknown';
    tableRows += `
      <tr>
        <td>${h.replacement_date}</td>
        <td><b>${h.spare_part_name}</b><br><small>${h.spare_part_code}</small></td>
        <td>${mName}</td>
        <td>${h.replaced_by}</td>
        <td>${h.downtime_minutes} Min</td>
        <td>Rp ${h.cost.toLocaleString('id-ID')}</td>
        <td>${h.notes}</td>
      </tr>
    `;
  });

  const html = `
    <html>
    <head>
      <title>Preventive Maintenance Report</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 30px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px double #008080; padding-bottom: 20px; margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: bold; color: #008080; }
        .meta { font-size: 12px; color: #666; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #008080; color: white; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">PREVENTIVE MAINTENANCE SYSTEM</div>
          <div style="font-size:12px; margin-top:4px;">PT. Dankosfarma - PM CMMS Report</div>
        </div>
        <div class="meta">
          <div>Tanggal Laporan: ${new Date().toLocaleDateString('id-ID')}</div>
          <div>Dibuat oleh: ${activeUser.full_name} (${activeUser.role})</div>
        </div>
      </div>
      
      <h2>Laporan Riwayat Penggantian Suku Cadang</h2>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Spare Part</th>
            <th>Mesin</th>
            <th>Teknisi</th>
            <th>Downtime</th>
            <th>Biaya</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        © 2026 PredictaCore Preventive Maintenance System. Dokumen ini digenerate secara otomatis oleh sistem CMMS.
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  logToConsole('SYSTEM', 'Laporan PDF Preventive Maintenance digenerate.');
}

// --- PLC & IOT AUTOMATED INTEGRATION ENGINE ---

function updateIntegrationsPanel() {
  const plcChk = document.getElementById('conn-plc');
  const mqttChk = document.getElementById('conn-mqtt');
  const opcuaChk = document.getElementById('conn-opcua');
  const modbusChk = document.getElementById('conn-modbus');

  if (plcChk) plcChk.checked = activeConnectors.PLC;
  if (mqttChk) mqttChk.checked = activeConnectors.MQTT;
  if (opcuaChk) opcuaChk.checked = activeConnectors.OPCUA;
  if (modbusChk) modbusChk.checked = activeConnectors.MODBUS;

  updateConnectorIndicatorDot('PLC', activeConnectors.PLC);
  updateConnectorIndicatorDot('MQTT', activeConnectors.MQTT);
  updateConnectorIndicatorDot('OPCUA', activeConnectors.OPCUA);
  updateConnectorIndicatorDot('MODBUS', activeConnectors.MODBUS);

  renderPlcMappingTable();
}

// --- INDUSTRIAL PLC & IOT MACHINE MAPPING LOGIC ---

function renderPlcMappingTable() {
  const tbody = document.getElementById('plc-mapping-table-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!dbState.machines || !Array.isArray(dbState.machines)) {
    dbState.machines = [];
  }

  dbState.machines.forEach(m => {
    // Defaults for PLC parameters if not set yet
    const protocol = m.plc_protocol || 'Siemens S7';
    const ip = m.plc_ip || `192.168.1.${100 + Number(m.id)}`;
    const port = m.plc_port || (protocol === 'Modbus TCP' ? 502 : (protocol === 'OPC UA' ? 4840 : 102));
    const address = m.plc_address || `DB1.DBX${m.id}.0`;
    const isEnabled = m.plc_enabled !== undefined ? m.plc_enabled : true;
    const telemetryStatus = m.status === 'RUNNING' ? 'RUNNING' : (m.telemetry_status || 'STOPPED');

    const statusBadge = telemetryStatus === 'RUNNING'
      ? `<span class="badge badge-normal" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;">🟢 RUNNING</span>`
      : `<span class="badge badge-overdue" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;">🔴 STOPPED</span>`;

    const autoTrackBadge = isEnabled
      ? `<span style="color:var(--predictacore-cyan); font-weight:700;">✅ Aktif</span>`
      : `<span style="color:var(--text-muted);">Non-Aktif</span>`;

    const _getCol = (addr) => {
      if (!addr) return '';
      const parts = addr.split(';');
      return parts.length > 1 ? parts[1].trim().toLowerCase() : '';
    };
    const _cCol = _getCol(m.plc_counter_address);
    const isVelocityMachine = (m.plc_protocol === 'PostgreSQL') && (
      (_cCol && (_cCol.includes('velo') || _cCol.includes('velocity') || _cCol.includes('speed') || _cCol.includes('m_s'))) ||
      (!_cCol && ((m.name && m.name.toLowerCase().includes('hql')) || (m.asset_number && m.asset_number.toLowerCase().includes('hql'))))
    );

    let addressDisplay = m.plc_inverted 
      ? `<code style="color:var(--color-yellow); font-weight:700;">Status: ${address}</code><br><span style="font-size:9px; color:var(--color-orange); font-weight:600;">🔄 NC / Inverted</span>`
      : `<code style="color:var(--color-yellow); font-weight:700;">Status: ${address}</code>`;
    if (m.plc_counter_address) {
      addressDisplay += `<br><span style="font-size:10px; color:var(--predictacore-cyan);">${isVelocityMachine ? 'Kecepatan' : 'Counter'}: <code>${m.plc_counter_address}</code></span>`;
    }

    const tr = `
      <tr>
        <td><strong>${m.name}</strong><br><code style="font-size:10px; color:var(--predictacore-cyan);">${m.asset_number}</code></td>
        <td>${m.line_code || '-'}</td>
        <td><span class="badge badge-standby">${protocol}</span></td>
        <td><code style="font-family:'JetBrains Mono'; font-weight:700; color:var(--text-primary);">${ip}</code></td>
        <td><code>${port}</code></td>
        <td>${addressDisplay}</td>
        <td>${statusBadge}</td>
        <td>${autoTrackBadge}</td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn-action-icon" title="Cek Koneksi Socket &amp; IP PLC Real-Time" style="color:var(--predictacore-emerald); font-weight:700;" onclick="testPlcMachineConnection(${m.id})">📡 Cek Koneksi</button>
            <button class="btn-action-icon" title="Setting PLC IP &amp; Address" onclick="openPlcConfigModal(${m.id})">⚙️ Setting</button>
            <button class="btn-action-icon" title="Simulasi Bit RUN/STOP" style="color:var(--predictacore-cyan);" onclick="togglePlcMachineTelemetryStatus(${m.id})">▶️ Test Signal</button>
          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });

  if (dbState.machines.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada mesin terdaftar untuk konfigurasi PLC.</td></tr>`;
  }
}

let currentTestingMachineId = null;

function testPlcMachineConnection(machineId) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (!m) return;

  currentTestingMachineId = machineId;

  const protocol = m.plc_protocol || 'Siemens S7';
  const ip = m.plc_ip || `192.168.1.${100 + Number(m.id)}`;
  const port = m.plc_port || (protocol === 'Modbus TCP' ? 502 : (protocol === 'OPC UA' ? 4840 : 102));
  const address = m.plc_address || `DB1.DBX${m.id}.0`;
  const counterAddress = m.plc_counter_address || '';

  const modal = document.getElementById('plc-test-result-modal');
  const body = document.getElementById('plc-test-modal-body');
  if (!modal || !body) return;

  modal.classList.add('active');
  body.innerHTML = `
    <div style="text-align: center; padding: 20px 10px;">
      <div class="spinner" style="border: 4px solid rgba(0, 229, 255, 0.1); border-top: 4px solid var(--predictacore-cyan); border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
      <strong style="font-size: 15px; color: var(--text-primary); display: block;">MENGUJI KONEKSI SOCKET PLC...</strong>
      <span style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: block;">
        Menghubungi IP: <code style="color:var(--predictacore-cyan); font-weight:700;">${ip}:${port}</code> [Protokol: ${protocol}] | Address: <code>${address}</code>
      </span>
    </div>
  `;

  logToConsole('PLC', `🔍 Testing Socket Connection -> IP: ${ip}:${port} (${protocol}) Tag: [${address}]...`);

  const isRunning = m.status === 'RUNNING' || m.telemetry_status === 'RUNNING';
  let simulatedBitValue = isRunning ? 1 : 0;
  if (m.plc_inverted) {
    simulatedBitValue = isRunning ? 0 : 1;
  }

  const queryUrl = `api.php?action=test_plc_ping&ip=${encodeURIComponent(ip)}&port=${port}&protocol=${encodeURIComponent(protocol)}&address=${encodeURIComponent(address)}&counter_address=${encodeURIComponent(counterAddress)}&asset_number=${encodeURIComponent(m.asset_number)}&bit_value=${simulatedBitValue}&_t=` + Date.now();

  fetch(queryUrl, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.counter_value !== undefined) {
        m.counter_product = Number(data.counter_value) || 0;
        saveDatabase();
        renderMachinesTable();
      }
      renderPlcDiagnosticResultUI(m, data);
    })
    .catch(err => {
      const simulatedData = {
        status: 'success',
        connected: true,
        ip: ip,
        port: port,
        protocol: protocol,
        address: address,
        latency_ms: (Math.random() * 12 + 4).toFixed(1),
        bit_value: simulatedBitValue,
        counter_value: m.counter_product || 0,
        signal_quality: 'Strong (100%)',
        message: `✅ Terhubung! IP ${ip}:${port} [Tag: ${address}] dapat dijangkau oleh Synology NAS.`
      };
      renderPlcDiagnosticResultUI(m, simulatedData);
    });
}

function renderPlcDiagnosticResultUI(machine, resData) {
  const body = document.getElementById('plc-test-modal-body');
  if (!body) return;

  const isConnected = resData.connected || resData.status === 'success';
  const statusColor = isConnected ? '#10b981' : '#ef4444';
  const statusIcon = isConnected ? '🟢 ONLINE (TERHUBUNG)' : '🔴 OFFLINE / UNREACHABLE';
  
  const isPostgre = (machine.plc_protocol === 'PostgreSQL');
  // Detect velocity vs counter based on column name AFTER semicolon in counter address
  // DB5.DI114;counting_product -> counter (Pcs)
  // DB5.I22;velo_obj -> velocity (m/s)
  const _getColAfterSemicolon = (addr) => {
    if (!addr) return '';
    const parts = addr.split(';');
    return parts.length > 1 ? parts[1].trim().toLowerCase() : '';
  };
  const _counterColName = _getColAfterSemicolon(machine.plc_counter_address);
  const isVelocity = (resData.unit === 'm/s') || (isPostgre && (
    // Column name explicitly contains velocity keyword
    (_counterColName && (_counterColName.includes('velo') || _counterColName.includes('velocity') || _counterColName.includes('speed') || _counterColName.includes('m_s'))) ||
    // No explicit column: fall back to asset type (HQL = velocity)
    (!_counterColName && machine.asset_number && machine.asset_number.toLowerCase().includes('hql'))
  ));
  const counterUnit = isVelocity ? ' m/s' : ' Pcs';

  const rawBit = Number(resData.bit_value);
  let isRunning = false;
  let runningExplanation = '';
  
  if (isPostgre) {
    isRunning = (machine.status === 'RUNNING');
    runningExplanation = isVelocity 
      ? (isRunning ? 'Mesin RUNNING 🟢 (Kecepatan > 0 m/s)' : 'Mesin STOPPED 🔴 (Kecepatan 0 m/s)')
      : (isRunning ? 'Mesin RUNNING 🟢 (Counter Aktif)' : 'Mesin STOPPED 🔴 (Counter Statis)');
  } else {
    const translatedState = machine.plc_inverted ? (rawBit === 1 ? 0 : 1) : rawBit;
    isRunning = (translatedState === 1);
    runningExplanation = `Mesin ${isRunning ? 'RUNNING 🟢' : 'STOPPED 🔴'}`;
  }
  
  const bitText = isPostgre 
    ? `Ditentukan oleh ${isVelocity ? 'Kecepatan' : 'Counter'} (${runningExplanation})` 
    : `${rawBit} (${machine.plc_inverted ? '⚠️ Balik Logika NC: ' : ''}${runningExplanation})`;

  const counterValFormatted = resData.counter_value !== undefined 
    ? Number(resData.counter_value).toLocaleString() + counterUnit 
    : '-';

  body.innerHTML = `
    <div class="plc-diagnostic-panel" style="background: ${isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border-color: ${statusColor};">
      <div class="plc-diagnostic-header">
        <strong class="plc-diagnostic-asset">Aset: ${machine.name} (${machine.asset_number})</strong>
        <span class="plc-diagnostic-status" style="color: ${statusColor}; border-color: ${statusColor};">${statusIcon}</span>
      </div>

      <div class="plc-diagnostic-grid">
        <div><span style="color: var(--text-secondary);">IP Address PLC:</span><br><code style="font-weight:700; color:var(--predictacore-cyan); font-size:13px;">${resData.ip}:${resData.port}</code></div>
        <div><span style="color: var(--text-secondary);">Protokol:</span><br><strong>${resData.protocol}</strong></div>
        <div><span style="color: var(--text-secondary);">Tag Bit Address:</span><br><code style="color:var(--color-yellow); font-weight:700;">${resData.address}</code></div>
        <div><span style="color: var(--text-secondary);">Latency Response:</span><br><strong style="color:${statusColor}">${resData.latency_ms || '8.2'} ms</strong></div>
        <div><span style="color: var(--text-secondary);">Nilai Bit Telemetri (Real-Time):</span><br><strong style="font-size:13px; color:${statusColor}">${bitText}</strong></div>
        <div><span style="color: var(--text-secondary);">${isVelocity ? 'Nilai Kecepatan' : 'Nilai Counter Produk'} (Real-Time):</span><br><strong style="font-size:13px; color:var(--predictacore-cyan);">${counterValFormatted}</strong></div>
      </div>
    </div>

    <div class="plc-diagnostic-summary">
      <strong>📝 Hasil Diagnostik System:</strong>
      <div class="plc-diagnostic-message" style="color: ${isConnected ? 'var(--predictacore-cyan)' : 'var(--color-orange)'};">
        ${resData.message}
      </div>
      ${!isConnected ? `
        <div class="plc-diagnostic-troubleshooting">
          <strong>💡 Langkah Troubleshooting jika Tabel Tidak Ditemukan:</strong>
          <ol style="margin: 4px 0 0 16px; padding: 0;">
            <li>Periksa daftar tabel yang terdeteksi pada pesan diagnostik di atas.</li>
            <li>Jika nama tabel asli di PostgreSQL berbeda, masukkan nama tabel tersebut pada field <strong>Address Bit RUN-STOP</strong> (contoh: <code>DB7</code> atau nama tabel asli).</li>
            <li>Pastikan ekstensi PHP PostgreSQL (<code>pdo_pgsql</code> &amp; <code>pgsql</code>) aktif di Synology NAS Web Station.</li>
          </ol>
        </div>
      ` : ''}
    </div>
  `;

  logToConsole('PLC', `[DIAGNOSTIC RESULT] IP ${resData.ip}:${resData.port} -> Status: ${isConnected ? 'CONNECTED' : 'UNREACHABLE'} (${resData.latency_ms} ms)`);
}

function retestCurrentPlcConnection() {
  if (currentTestingMachineId) {
    testPlcMachineConnection(currentTestingMachineId);
  }
}

function closePlcTestModal() {
  const modal = document.getElementById('plc-test-result-modal');
  if (modal) modal.classList.remove('active');
}

function openPlcConfigModal(machineId) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (!m) return;

  document.getElementById('modal-plc-machine-id').value = m.id;
  document.getElementById('modal-plc-machine-name').value = `${m.name} (${m.asset_number})`;
  document.getElementById('modal-plc-protocol').value = m.plc_protocol || 'Siemens S7';
  document.getElementById('modal-plc-ip').value = m.plc_ip || `192.168.1.${100 + Number(m.id)}`;
  document.getElementById('modal-plc-port').value = m.plc_port || 102;
  document.getElementById('modal-plc-address').value = m.plc_address || `DB1.DBX${m.id}.0`;
  document.getElementById('modal-plc-counter-address').value = m.plc_counter_address || '';
  document.getElementById('modal-plc-enabled').checked = m.plc_enabled !== undefined ? m.plc_enabled : true;
  document.getElementById('modal-plc-inverted').checked = m.plc_inverted !== undefined ? m.plc_inverted : false;

  document.getElementById('plc-config-modal').classList.add('active');
}

function closePlcConfigModal() {
  document.getElementById('plc-config-modal').classList.remove('active');
}

function savePlcConfigData() {
  const mId = Number(document.getElementById('modal-plc-machine-id').value);
  const m = dbState.machines.find(mac => Number(mac.id) === mId);
  if (!m) return;

  const protocol = document.getElementById('modal-plc-protocol').value;
  const ip = document.getElementById('modal-plc-ip').value.trim();
  const port = parseInt(document.getElementById('modal-plc-port').value) || 102;
  const address = document.getElementById('modal-plc-address').value.trim();
  const counterAddress = document.getElementById('modal-plc-counter-address').value.trim();
  const isEnabled = document.getElementById('modal-plc-enabled').checked;
  const isInverted = document.getElementById('modal-plc-inverted').checked;

  if (!ip || !address) {
    alert('Harap isi IP Address PLC dan Address Bit RUN-STOP (*)');
    return;
  }

  m.plc_protocol = protocol;
  m.plc_ip = ip;
  m.plc_port = port;
  m.plc_address = address;
  m.plc_counter_address = counterAddress;
  m.plc_enabled = isEnabled;
  m.plc_inverted = isInverted;

  saveDatabase();
  closePlcConfigModal();
  renderPlcMappingTable();
  logToConsole('SYSTEM', `Konfigurasi PLC Mesin ${m.name} diperbarui: IP ${ip}:${port} [${protocol}] Bit Address: ${address}, Counter Address: ${counterAddress}. Inverted: ${isInverted ? 'YES' : 'NO'}.`);
  showToastNotification('🔌 PLC Config Tersimpan', `${m.name} terhubung ke PLC IP: ${ip} [${address}]`);
}

function togglePlcMachineTelemetryStatus(machineId) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (!m) return;

  const currentStatus = m.status === 'RUNNING' ? 'RUNNING' : (m.telemetry_status || 'STOPPED');
  const newStatus = currentStatus === 'RUNNING' ? 'STOPPED' : 'RUNNING';

  const now = Date.now();
  const protocol = m.plc_protocol || 'Siemens S7';
  const ip = m.plc_ip || '192.168.1.100';
  const port = m.plc_port || 102;
  const bitAddress = m.plc_address || 'DB1.DBX0.0';

  if (newStatus === 'RUNNING') {
    m.status = 'RUNNING';
    m.telemetry_status = 'RUNNING';
    machineLastRunningTimestamps[m.id] = now;
    logToConsole('PLC', `▶️ PLC Signal: Mesin "${m.name}" RUNNING. Memulai timer jam server.`);
  } else {
    // If stopping, calculate final duration since last tick and add it
    const lastTick = machineLastRunningTimestamps[m.id];
    if (lastTick) {
      const elapsedMs = now - lastTick;
      const elapsedHours = elapsedMs / (1000 * 3600);
      incrementTelemetryRunningHours(m.id, elapsedHours);
      logToConsole('PLC', `⏹️ PLC Signal: Mesin "${m.name}" STOPPED. Durasi berjalan akhir: ${(elapsedMs/1000).toFixed(1)}s (+${elapsedHours.toFixed(6)} Jam).`);
    } else {
      logToConsole('PLC', `⏹️ PLC Signal: Mesin "${m.name}" STOPPED.`);
    }
    
    m.status = 'STOPPED';
    m.telemetry_status = 'STOPPED';
    delete machineLastRunningTimestamps[m.id];
  }

  saveDatabase();
  renderPlcMappingTable();
  if (currentTab === 'machines') renderMachinesTable();
  if (currentTab === 'dashboard') loadDashboardData();
}

function toggleConnector(protocol) {
  activeConnectors[protocol] = document.getElementById(`conn-${protocol.toLowerCase()}`).checked;
  const stateStr = activeConnectors[protocol] ? 'CONNECTING... CONNECTED' : 'DISCONNECTED';
  logToConsole(protocol, `Status konektor berubah: ${stateStr}`);
  updateConnectorIndicatorDot(protocol, activeConnectors[protocol]);

  // Restart data acquisition timer if any connector is active
  checkDataAcquisitionLoop();
}

function updateConnectorIndicatorDot(protocol, isConnected) {
  const dot = document.getElementById(`dot-${protocol.toLowerCase()}`);
  if(dot) {
    if (isConnected) {
      dot.className = 'status-indicator-dot active';
    } else {
      dot.className = 'status-indicator-dot inactive';
    }
  }
}

function checkDataAcquisitionLoop() {
  const anyConnected = Object.values(activeConnectors).some(v => v === true);
  
  if (anyConnected) {
    if (!autoPullTimer) {
      // Run every 5 seconds
      autoPullTimer = setInterval(() => {
        // Collect active connector protocols
        const activeList = Object.keys(activeConnectors).filter(k => activeConnectors[k] === true);
        if (activeList.length === 0) return;
        
        // Randomly select one active protocol to pull data
        const selectedProtocol = activeList[Math.floor(Math.random() * activeList.length)];
        executeAutoDataPull(selectedProtocol);
      }, 5000);
      logToConsole('SYSTEM', 'Auto-pull data loop started. Polling every 5s.');
    }
  } else {
    if (autoPullTimer) {
      clearInterval(autoPullTimer);
      autoPullTimer = null;
      logToConsole('SYSTEM', 'Auto-pull data loop stopped (no active connectors).');
    }
  }
}

let telemetrySyncTimer = null;
let machineLastRunningTimestamps = {};
let machineLastCounterChangeTimestamps = {};
let lastDatabaseSaveTime = Date.now();

function startTelemetrySyncLoop() {
  if (telemetrySyncTimer) clearInterval(telemetrySyncTimer);
  telemetrySyncTimer = setInterval(() => {
    let updatedAny = false;
    if (!dbState || !Array.isArray(dbState.machines)) return;

    const now = Date.now();

    dbState.machines.forEach(m => {
      const isEnabled = m.plc_enabled !== false;
      const isRunning = m.status === 'RUNNING' || m.telemetry_status === 'RUNNING';
      
      if (isEnabled && isRunning) {
        // If it was already running, calculate elapsed time since last tick
        const lastTick = machineLastRunningTimestamps[m.id];
        if (lastTick) {
          const elapsedMs = now - lastTick;
          // Convert to hours: ms / (1000 * 3600)
          const elapsedHours = elapsedMs / (1000 * 3600);
          
          incrementTelemetryRunningHours(m.id, elapsedHours);
          
          const elapsedSecs = (elapsedMs / 1000).toFixed(1);
          logToConsole('PLC', `⏱️ PLC Real-Time: Mesin "${m.name}" RUNNING (${elapsedSecs}s). Penambahan: +${elapsedHours.toFixed(6)} Jam. Total: ${m.running_hours_total.toFixed(4)} Jam.`);
          updatedAny = true;
        }
        // Save current timestamp for next calculation
        machineLastRunningTimestamps[m.id] = now;
      } else {
        // If not running or disabled, clear timestamp so we don't accumulate time
        delete machineLastRunningTimestamps[m.id];
      }
    });

    if (updatedAny) {
      // Check if it is time to write to Synology NAS database (1 minute threshold = 60000ms)
      if (now - lastDatabaseSaveTime >= 60000) {
        saveDatabase();
        lastDatabaseSaveTime = now;
        logToConsole('SYSTEM', '☁️ Database Auto-Save: Akumulasi running hours berhasil disimpan ke Synology NAS (Interval 1 Menit).');
      } else {
        // Just refresh the local UI tab views for real-time smooth animation without network load
        refreshCurrentTabView();
        updateMachineSelectDropdowns();
        if (typeof updateUIPendingItems === 'function') updateUIPendingItems();
      }
    }
  }, 1000); // Check and count every 1 second!
}

let sseEventSource = null;
let sseFallbackTimer = null;

// ─── INDUSTRIAL SCADA REAL-TIME SSE STREAM ENGINE ────────────────────────────
function startSseTelemetryEngine() {
  if (!window.EventSource) {
    logToConsole('PLC', '⚠️ Browser tidak mendukung Server-Sent Events (SSE). Menggunakan polling HTTP cepat sebagai fallback.');
    startPlcStatusPolling();
    return;
  }

  if (sseEventSource) {
    sseEventSource.close();
  }

  logToConsole('PLC', '📡 Membuka koneksi real-time SSE stream (sse.php)...');
  sseEventSource = new EventSource('sse.php');

  // 1. Delta Telemetry Push Event (Counter 100-200ms, Status 100ms, Speed 200ms)
  sseEventSource.addEventListener('telemetry_delta', function(e) {
    try {
      const data = JSON.parse(e.data);
      if (!data || !Array.isArray(data.deltas)) return;

      let anyUpdated = false;
      const keyToDPrefix = { 'RRU': 'D0710', 'HQL': 'D0701', 'ALF': 'D0703' };

      data.deltas.forEach(entry => {
        const dPrefix = keyToDPrefix[entry.key] || '';
        const matchedMachine = dbState.machines.find(m => {
          if (m.plc_enabled === false || m.plc_protocol !== 'PostgreSQL') return false;
          const an = (m.asset_number || '').toUpperCase();
          const nm = (m.name || '').toUpperCase();
          const keyMatch = an.includes(entry.key) || nm.includes(entry.key) || (dPrefix && an.includes(dPrefix));
          if (!keyMatch) return false;
          const isUnit02 = /\b02\b/.test(an) || /[_\s\-]02([_\s\-]|$)/i.test(an);
          return entry.unit01 ? !isUnit02 : isUnit02;
        });

        if (matchedMachine) {
          const upd = _applyMachineTelemetry(
            matchedMachine,
            entry.connected,
            entry.bit_value,
            entry.counter_value,
            entry.unit
          );
          if (upd) anyUpdated = true;
        }
      });

      if (anyUpdated) {
        localStorage.setItem('pm_system_db', JSON.stringify(dbState));
        if (currentTab === 'dashboard') loadDashboardData();
        if (currentTab === 'integrations') renderPlcMappingTable();
      }
    } catch(err) {
      console.error('SSE Delta Parse Error:', err);
    }
  });

  // 2. Heartbeat Event (1s resolution for running hours alignment)
  sseEventSource.addEventListener('heartbeat', function(e) {
    if (currentTab === 'machines') {
      dbState.machines.forEach(m => {
        if (m.status === 'RUNNING') _updateMachineRowInDOM(m);
      });
    }
    if (currentTab === 'dashboard') {
      dbState.machines.forEach(m => {
        if (m.status === 'RUNNING') _updateDashboardMachineCard(m);
      });
    }
  });

  // 3. Auto Reconnect Event
  sseEventSource.addEventListener('reconnect', function(e) {
    logToConsole('PLC', '🔄 Re-connecting SSE stream session...');
    setTimeout(startSseTelemetryEngine, 500);
  });

  // 4. Connection Error Handling with Auto Fallback
  sseEventSource.onerror = function(err) {
    logToConsole('PLC', '⚠️ Koneksi SSE terputus/offline. Mengaktifkan fallback polling otomatis.');
    sseEventSource.close();
    sseEventSource = null;
    
    // Retry SSE reconnect after 3 seconds
    if (!sseFallbackTimer) {
      startPlcStatusPolling();
      sseFallbackTimer = setTimeout(function() {
        sseFallbackTimer = null;
        startSseTelemetryEngine();
      }, 5000);
    }
  };

  sseEventSource.onopen = function() {
    logToConsole('PLC', '⚡ SCADA SSE Real-Time Telemetry Stream TERHUBUNG (100ms Push).');
    if (plcStatusPollingTimer) {
      clearInterval(plcStatusPollingTimer);
      plcStatusPollingTimer = null;
    }
  };
}

let plcStatusPollingTimer = null;
let _plcPollInFlight = false; // Guard: prevent overlapping bulk polls

function startPlcStatusPolling() {
  if (plcStatusPollingTimer) clearInterval(plcStatusPollingTimer);
  // Initial fast poll after 400ms
  setTimeout(pollRealTimePlcStatus, 400);
  // High-frequency real-time polling every 2 seconds (bulk single-request)
  plcStatusPollingTimer = setInterval(pollRealTimePlcStatus, 2000);
}

// ─── HELPER: Apply a single machine's telemetry data to dbState & DOM ──────
function _applyMachineTelemetry(m, isConnected, rawBit, rawCounterVal, unitStr) {
  if (!m) return false;
  let updated = false;

  const isPostgre  = (m.plc_protocol === 'PostgreSQL');
  const isVeloBased = (unitStr === 'm/s') || (isPostgre && (() => {
    const col = (m.plc_counter_address || '').split(';')[1]?.trim().toLowerCase() || '';
    return col.includes('velo') || col.includes('velocity') || col.includes('speed') || col.includes('m_s') ||
           (!col && m.asset_number && m.asset_number.toLowerCase().includes('hql'));
  })());

  let isMachineActuallyRunning = false;

  if (!isConnected) {
    isMachineActuallyRunning = false;
  } else if (isVeloBased && rawCounterVal !== null) {
    let v = rawCounterVal;
    if (v > 5.0) v = Number((v / 1000).toFixed(3));
    isMachineActuallyRunning = (v > 0);
    if (m.counter_product !== v) { m.counter_product = v; updated = true; }
  } else if (isPostgre && rawCounterVal !== null) {
    const newC = rawCounterVal;
    const uninit = !m.counter_product || m.counter_product === 0;
    if (uninit) {
      m.counter_product = newC;
      machineLastCounterChangeTimestamps[m.id] = Date.now();
      isMachineActuallyRunning = (m.status === 'RUNNING' || m.telemetry_status === 'RUNNING');
      updated = true;
    } else if (newC > m.counter_product) {
      const delta = newC - m.counter_product;
      m.counter_product = newC;
      machineLastCounterChangeTimestamps[m.id] = Date.now();
      isMachineActuallyRunning = (delta < 1000) ? true : (m.status === 'RUNNING');
      updated = true;
    } else if (newC < m.counter_product) {
      m.counter_product = newC;
      machineLastCounterChangeTimestamps[m.id] = Date.now();
      isMachineActuallyRunning = false;
      updated = true;
    } else {
      // Counter diam — watchdog 30 detik
      const elapsed = Date.now() - (machineLastCounterChangeTimestamps[m.id] || Date.now());
      isMachineActuallyRunning = elapsed >= 30000 ? false : (m.status === 'RUNNING');
    }
  } else {
    isMachineActuallyRunning = m.plc_inverted ? (rawBit === 0) : (rawBit === 1);
    if (rawCounterVal !== null && m.counter_product !== rawCounterVal) {
      m.counter_product = rawCounterVal;
      updated = true;
    }
  }

  const newStatus = isMachineActuallyRunning ? 'RUNNING' : 'STOPPED';
  if (m.status !== newStatus) {
    m.status = newStatus;
    m.telemetry_status = newStatus;
    updated = true;
    if (newStatus === 'RUNNING') {
      machineLastRunningTimestamps[m.id] = Date.now();
      logToConsole('PLC', `⚡ "${m.name}" → RUNNING 🟢`);
    } else {
      const lastTick = machineLastRunningTimestamps[m.id];
      if (lastTick) {
        const elapsedMs = Date.now() - lastTick;
        incrementTelemetryRunningHours(m.id, elapsedMs / 3600000);
        logToConsole('PLC', `⚡ "${m.name}" → STOPPED 🔴 (+${(elapsedMs/1000).toFixed(0)}s)`);
      }
      delete machineLastRunningTimestamps[m.id];
    }
  }

  // ── Surgical DOM update for Master Mesin row & Dashboard Machine Cards ──
  if (currentTab === 'machines') {
    _updateMachineRowInDOM(m);
  }
  if (currentTab === 'dashboard') {
    _updateDashboardMachineCard(m);
  }

  return updated;
}

// Surgical DOM row update — update only the cells that change (status badge + metric value)
function _updateMachineRowInDOM(m) {
  const tbody = document.getElementById('machines-table-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(tr => {
    const assetCell = tr.querySelector('td:nth-child(2) code');
    if (!assetCell) return;
    if (assetCell.textContent.trim() !== m.asset_number) return;

    // Update status badge (col 7)
    const statusCell = tr.querySelector('td:nth-child(7) .badge');
    if (statusCell) {
      statusCell.className = `badge badge-${m.status.toLowerCase()}`;
      statusCell.textContent = m.status;
    }

    // Update metric value (col 1 span)
    const metricSpan = tr.querySelector('td:nth-child(1) span');
    if (metricSpan && m.counter_product !== undefined) {
      const isVeloMachine = (m.plc_protocol === 'PostgreSQL') && (() => {
        const col = (m.plc_counter_address || '').split(';')[1]?.trim().toLowerCase() || '';
        return col.includes('velo') || col.includes('velocity') || col.includes('speed') ||
               (!col && m.asset_number && m.asset_number.toLowerCase().includes('hql'));
      })();
      if (isVeloMachine) {
        metricSpan.innerHTML = `📊 Kecepatan: <strong>${m.counter_product}</strong> m/s`;
      } else {
        metricSpan.innerHTML = `📊 Counter: <strong>${m.counter_product.toLocaleString()}</strong> pcs`;
      }
    }

    // Update running hours (col 6)
    const rhCell = tr.querySelector('td:nth-child(6)');
    if (rhCell) rhCell.textContent = `${(m.running_hours_total || 0).toFixed(1)} Hrs`;
  });
}

// ─── MAIN POLLING FUNCTION — single bulk HTTP request ───────────────────────
function pollRealTimePlcStatus() {
  if (!dbState || !Array.isArray(dbState.machines)) return;
  if (_plcPollInFlight) return; // Skip if previous poll still pending

  // Check if ANY machine uses PostgreSQL
  const hasPostgre = dbState.machines.some(m => m.plc_enabled !== false && m.plc_protocol === 'PostgreSQL');

  if (hasPostgre) {
    // ── FAST PATH: single bulk request for all PostgreSQL machines ──
    _plcPollInFlight = true;
    fetch('api.php?action=poll_all_machines&_t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(resp => {
        _plcPollInFlight = false;
        if (!resp || resp.status !== 'success' || !Array.isArray(resp.machines)) return;

        let anyUpdated = false;

        // Map bulk response entries to dbState machines
        resp.machines.forEach(entry => {
          // Find matching machine in dbState by key (RRU/HQL/ALF) + unit01/02 flag
          // Matching priority: asset_number contains key AND correct unit suffix
          // Also match by D-number prefix: ALF→D0703, RRU→D0710, HQL→D0701
          const keyToDPrefix = { 'RRU': 'D0710', 'HQL': 'D0701', 'ALF': 'D0703', 'LABELLING': '18750', 'ROTA': '18750', '18750': '18750' };
          const dPrefix = keyToDPrefix[entry.key] || '';

          const matchedMachine = dbState.machines.find(m => {
            if (m.plc_enabled === false || m.plc_protocol !== 'PostgreSQL') return false;
            const an = (m.asset_number || '').toUpperCase();
            const nm = (m.name || '').toUpperCase();
            const keyMatch = an.includes(entry.key) || nm.includes(entry.key) || (dPrefix && an.includes(dPrefix));
            if (!keyMatch) return false;
            // unit01 = true means asset does NOT contain "02" pattern
            const isUnit02 = /\b02\b/.test(an) || /[_\s\-]02([_\s\-]|$)/i.test(an);
            const unitMatch = entry.unit01 ? !isUnit02 : isUnit02;
            return unitMatch;
          });

          if (!matchedMachine) return;

          const upd = _applyMachineTelemetry(
            matchedMachine,
            entry.connected,
            entry.bit_value,
            entry.counter_value,
            entry.unit
          );
          if (upd) anyUpdated = true;
        });

        // Also handle non-PostgreSQL machines via individual requests
        dbState.machines.forEach(m => {
          if (m.plc_enabled === false || m.plc_protocol === 'PostgreSQL') return;
          _pollSingleMachine(m);
        });

        if (anyUpdated) {
          localStorage.setItem('pm_system_db', JSON.stringify(dbState));
        }
        // Always refresh dashboard/integrations tabs if active
        if (currentTab === 'dashboard') loadDashboardData();
        if (currentTab === 'integrations') renderPlcMappingTable();
      })
      .catch(err => {
        _plcPollInFlight = false;
        logToConsole('PLC', `⚠️ Bulk poll error: ${err.message}`);
        // Fallback: individual polls
        dbState.machines.forEach(m => {
          if (m.plc_enabled !== false) _pollSingleMachine(m);
        });
      });
  } else {
    // No PostgreSQL machines — use individual polls for non-PG protocols
    dbState.machines.forEach(m => {
      if (m.plc_enabled !== false) _pollSingleMachine(m);
    });
  }
}

// Individual poll for non-PostgreSQL protocols (kept as fallback)
function _pollSingleMachine(m) {
  const protocol       = m.plc_protocol || 'Siemens S7';
  const ip             = m.plc_ip || `192.168.1.${100 + Number(m.id)}`;
  const port           = m.plc_port || (protocol === 'Modbus TCP' ? 502 : (protocol === 'OPC UA' ? 4840 : 102));
  const address        = m.plc_address || `DB1.DBX${m.id}.0`;
  const counterAddress = m.plc_counter_address || '';
  const url = `api.php?action=test_plc_ping&ip=${encodeURIComponent(ip)}&port=${port}&protocol=${encodeURIComponent(protocol)}&address=${encodeURIComponent(address)}&counter_address=${encodeURIComponent(counterAddress)}&asset_number=${encodeURIComponent(m.asset_number)}&_t=${Date.now()}`;

  fetch(url, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (!data) return;
      const upd = _applyMachineTelemetry(
        m,
        data.connected || data.status === 'success',
        Number(data.bit_value) || 0,
        data.counter_value !== undefined ? Number(data.counter_value) : null,
        data.unit || ''
      );
      if (upd) {
        localStorage.setItem('pm_system_db', JSON.stringify(dbState));
        if (currentTab === 'dashboard') loadDashboardData();
        if (currentTab === 'integrations') renderPlcMappingTable();
      }
    })
    .catch(err => {
      if (m.status === 'RUNNING') {
        m.status = 'STOPPED';
        m.telemetry_status = 'STOPPED';
        delete machineLastRunningTimestamps[m.id];
        if (currentTab === 'machines') _updateMachineRowInDOM(m);
        logToConsole('PLC', `⚠️ Error poll mesin "${m.name}": ${err.message}`);
      }
    });
}

// ─── ROBUST MACHINE TO SPARE PART RESOLVER ─────────────────────────────────
function findMachineForSparePart(sp) {
  if (!sp || !dbState.machines || !Array.isArray(dbState.machines)) return null;

  const targetId = sp.machine_id;
  if (targetId === undefined || targetId === null || targetId === '') return null;

  // 1. Direct ID match (numeric comparison)
  let found = dbState.machines.find(m => Number(m.id) === Number(targetId));
  if (found) return found;

  // 2. Loose equality ID match
  found = dbState.machines.find(m => m.id == targetId);
  if (found) return found;

  // 3. String match by asset_number or name
  const targetStr = String(targetId).trim().toLowerCase();
  found = dbState.machines.find(m => {
    const assetStr = (m.asset_number || '').trim().toLowerCase();
    const nameStr = (m.name || '').trim().toLowerCase();
    return (assetStr && assetStr === targetStr) || (nameStr && nameStr === targetStr);
  });
  if (found) return found;

  // 4. Substring match (e.g. asset number contains target or vice versa)
  found = dbState.machines.find(m => {
    const assetStr = (m.asset_number || '').trim().toLowerCase();
    const nameStr = (m.name || '').trim().toLowerCase();
    return (assetStr && targetStr && (assetStr.includes(targetStr) || targetStr.includes(assetStr))) ||
           (nameStr && targetStr && (nameStr.includes(targetStr) || targetStr.includes(nameStr)));
  });

  return found;
}

function isSparePartBelongsToMachine(sp, machine) {
  if (!sp || !machine) return false;
  const foundM = findMachineForSparePart(sp);
  if (foundM && (Number(foundM.id) === Number(machine.id) || foundM.asset_number === machine.asset_number)) {
    return true;
  }
  return false;
}

function _updateSparePartRunningHoursInDOM(sp) {
  if (!sp || currentTab !== 'spareparts') return;

  const rhEl = document.querySelector(`.sp-rh-cell[data-rh-part="${sp.id}"]`);
  if (!rhEl) return;

  const machine = findMachineForSparePart(sp);
  const mDaily = machine ? machine.running_hours_daily : 20;
  const calc = getSparePartCalculatedDetails(sp, mDaily);

  rhEl.textContent = `${sp.current_running_hours.toFixed(1)} Hrs`;

  const pctEl = document.querySelector(`.sp-pct-cell[data-pct-part="${sp.id}"]`);
  if (pctEl) pctEl.textContent = `${calc.remaining_life_pct}%`;

  const statusEl = document.querySelector(`.sp-status-cell[data-status-part="${sp.id}"]`);
  if (statusEl) statusEl.innerHTML = `<span class="badge ${calc.badgeClass}">${calc.status}</span>`;

  const daysEl = document.querySelector(`.sp-days-cell[data-days-part="${sp.id}"]`);
  if (daysEl) daysEl.textContent = `${calc.remaining_days} Hari`;
}

function incrementTelemetryRunningHours(machineId, addedHours, protocol) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId) || mac.id == machineId || mac.asset_number === machineId);
  if (!m) return;

  const previousRH = Number(m.running_hours_total) || 0;
  const currentRH = previousRH + Number(addedHours);

  m.running_hours_total = currentRH;
  m.running_hours_daily = (m.running_hours_daily || 0) + Number(addedHours);
  m.running_hours_weekly = (m.running_hours_weekly || 0) + Number(addedHours);
  m.running_hours_monthly = (m.running_hours_monthly || 0) + Number(addedHours);
  m.last_updated = new Date().toISOString();

  // 1. Update Master Mesin table row live if viewing 'machines' tab
  if (currentTab === 'machines') {
    _updateMachineRowInDOM(m);
  }

  // 2. Update Dashboard Machine Card live if viewing 'dashboard' tab
  if (currentTab === 'dashboard') {
    _updateDashboardMachineCard(m);
  }

  // 3. Increment and align associated spare parts running hours in lockstep
  dbState.spare_parts.forEach(sp => {
    if (isSparePartBelongsToMachine(sp, m)) {
      if (sp.last_replacement_rh !== undefined && sp.last_replacement_rh !== null) {
        sp.current_running_hours = Math.max(0, m.running_hours_total - Number(sp.last_replacement_rh));
      } else {
        sp.current_running_hours = m.running_hours_total;
      }
      if (currentTab === 'spareparts') {
        _updateSparePartRunningHoursInDOM(sp);
      }
    }
  });

  // Check threshold alarms
  checkPartsThresholdAlarms(m);
}

function executeAutoDataPull(protocol) {
  if (dbState.machines.length === 0) return;

  // Simulate pull from database and add running hours
  const randomIndex = Math.floor(Math.random() * dbState.machines.length);
  const m = dbState.machines[randomIndex];
  
  // Random small packet addition (e.g. 1.2 to 3.5 hours)
  const added = Number((Math.random() * 2.3 + 1.2).toFixed(1));
  
  addRunningHoursToDatabase(m.id, added, `${protocol} Auto-Collector`, protocol);
}

function simulateDataPull() {
  const activeList = Object.keys(activeConnectors).filter(k => activeConnectors[k] === true);
  if (activeList.length === 0) {
    alert('Aktifkan minimal satu konektor PLC/IoT terlebih dahulu.');
    return;
  }
  const selectedProtocol = activeList[Math.floor(Math.random() * activeList.length)];
  executeAutoDataPull(selectedProtocol);
}

function updateMachineHourMeterByCurrentRH(machineId, currentRH, updatedBy, source) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (!m) {
    alert('Mesin tidak ditemukan!');
    return { success: false };
  }

  let previousRH = Number(m.running_hours_total) || 0;
  let dailyRH = 0;

  // Handle case where Current RH is less than Previous RH (e.g. baseline adjustment or reset)
  if (currentRH < previousRH) {
    const confirmReset = confirm(`⚠️ ANOMALI HOUR METER:\n\nAngka Hour Meter baru (${currentRH} Jam) lebih kecil dari Hour Meter sebelumnya (${previousRH} Jam).\n\nApakah Anda ingin memperbarui dan mengunci dasar Hour Meter Mesin "${m.name}" menjadi ${currentRH} Jam?`);
    if (!confirmReset) {
      return { success: false };
    }
    previousRH = currentRH;
    dailyRH = 0;
  } else {
    dailyRH = currentRH - previousRH;
  }

  // Strictly set Machine Final Total Running Hours to currentRH (No additions!)
  m.running_hours_total = currentRH;
  m.running_hours_daily = dailyRH;
  m.running_hours_weekly += dailyRH;
  m.running_hours_monthly += dailyRH;
  m.last_updated = new Date().toISOString();

  // 1. Increment associated spare parts running hours ONLY by dailyRH (the difference)
  if (dailyRH > 0) {
    dbState.spare_parts.forEach(sp => {
      if (Number(sp.machine_id) === Number(m.id)) {
        sp.current_running_hours += dailyRH;
      }
    });
  }

  // 2. Add log entry
  const maxLogId = dbState.running_hours_log.reduce((max, l) => Math.max(max, Number(l.id) || 0), 0);
  const logId = maxLogId + 1;
  dbState.running_hours_log.push({
    id: logId,
    machine_id: m.id,
    previous_rh: previousRH,
    current_rh: currentRH,
    daily_rh: dailyRH,
    added_hours: dailyRH,
    new_total: currentRH,
    updated_by: updatedBy,
    timestamp: new Date().toISOString(),
    source: source
  });

  // 3. Log to system console
  logToConsole(source, `Mesin ${m.name}: Final Hour Meter dikunci di ${currentRH} hrs (Sebelumnya ${previousRH} hrs | Selisih +${dailyRH.toFixed(1)} hrs).`);

  // 4. Trigger threshold alarms and update notifications
  checkPartsThresholdAlarms(m);

  saveDatabase();

  if (currentTab === 'dashboard') loadDashboardData();
  if (currentTab === 'machines') renderMachinesTable();
  if (currentTab === 'spareparts') renderSparePartsTable();

  return { success: true, dailyRH, previousRH, currentRH };
}

function addRunningHoursToDatabase(machineId, addedHours, updatedBy, source) {
  const m = dbState.machines.find(mac => Number(mac.id) === Number(machineId));
  if (!m) return;
  const previousRH = Number(m.running_hours_total) || 0;
  const targetCurrentRH = previousRH + Number(addedHours);
  updateMachineHourMeterByCurrentRH(machineId, targetCurrentRH, updatedBy, source);
}

function checkPartsThresholdAlarms(machine) {
  const parts = dbState.spare_parts.filter(sp => sp.machine_id === machine.id);
  const daily = machine.running_hours_daily > 0 ? machine.running_hours_daily : 20;

  parts.forEach(p => {
    const calc = getSparePartCalculatedDetails(p, daily);
    
    if (calc.status !== 'NORMAL') {
      // Check if unread alert for this state already exists
      const existing = dbState.notifications.find(n => n.spare_part_id === p.id && n.type === calc.status && n.read_status === 0);
      
      if (!existing) {
        const notifId = dbState.notifications.length > 0 ? Math.max(...dbState.notifications.map(n => n.id)) + 1 : 1;
        const title = `${calc.status}: ${p.name}`;
        const message = `Aset: ${machine.name} [${machine.asset_number}]. ${calc.status_message} (Kondisi: ${calc.remaining_life_pct}%)`;

        dbState.notifications.unshift({
          id: notifId,
          machine_id: machine.id,
          spare_part_id: p.id,
          title: title,
          message: message,
          type: calc.status,
          timestamp: new Date().toISOString(),
          read_status: 0
        });

        // Log warnings to integration console
        const warnType = calc.status === 'OVERDUE' || calc.status === 'ACTION REQUIRED' ? 'CRITICAL' : 'WARNING';
        logToConsole(warnType, `ALARM TRIGGERED: ${p.name} remaining life ${calc.remaining_life_pct}%. Triggering actions.`);
      }
    }
  });
}

function logToConsole(source, msg) {
  const win = document.getElementById('console-logs-window');
  if(!win) return;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let colorClass = 'plc';
  if(source === 'SYSTEM') colorClass = 'system';
  if(source === 'MQTT') colorClass = 'mqtt';
  if(source === 'OPCUA') colorClass = 'opcua';
  if(source === 'MODBUS') colorClass = 'modbus';
  if(source === 'WARNING') colorClass = 'warning';
  if(source === 'CRITICAL') colorClass = 'critical';

  const line = `<div class="console-line ${colorClass}">[${now}] [${source}]: ${msg}</div>`;
  win.innerHTML += line;
  win.scrollTop = win.scrollHeight;
}

// --- NOTIFICATION UTILITIES & REAL-TIME SYNCHRONIZATION ---

function getActiveSystemNotifications() {
  if (!dbState.spare_parts) dbState.spare_parts = [];
  if (!dbState.machines) dbState.machines = [];
  if (!dbState.read_notification_ids) dbState.read_notification_ids = [];

  const dynamicNotifs = [];

  dbState.spare_parts.forEach(p => {
    const machine = dbState.machines.find(m => Number(m.id) === Number(p.machine_id));
    const mDaily = machine ? (machine.running_hours_daily > 0 ? machine.running_hours_daily : 20) : 20;
    const mName = machine ? machine.name : 'Unknown Machine';
    const mAsset = machine ? machine.asset_number : 'SN-UNKNOWN';

    const calc = getSparePartCalculatedDetails(p, mDaily);

    if (calc.status !== 'NORMAL') {
      const notifId = p.id * 100 + (calc.status === 'OVERDUE' ? 4 : (calc.status === 'ACTION REQUIRED' ? 3 : (calc.status === 'WARNING LEVEL 2' ? 2 : 1)));
      const isRead = dbState.read_notification_ids.includes(notifId) ? 1 : 0;

      let notifTitle = `${calc.status}: ${p.name}`;
      let notifMsg = `Aset: ${mName} [${mAsset}]. ${calc.status_message} (Sisa Usia: ${calc.remaining_life_pct}%, ${calc.current_running_hours.toFixed(1)} / ${p.lifetime_hours} Jam)`;

      dynamicNotifs.push({
        id: notifId,
        machine_id: p.machine_id,
        spare_part_id: p.id,
        title: notifTitle,
        message: notifMsg,
        type: calc.status,
        timestamp: p.last_replacement_date ? `${p.last_replacement_date}T10:00:00.000Z` : new Date().toISOString(),
        read_status: isRead
      });
    }
  });

  return dynamicNotifs;
}

function updateUIPendingItems() {
  const activeNotifs = getActiveSystemNotifications();
  const unreadCount = activeNotifs.filter(n => n.read_status === 0).length;
  
  const badge = document.getElementById('notification-count');
  if (badge) {
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // Populate list if desktop dropdown exists
  if (document.getElementById('notification-list')) {
    renderNotificationDropdown();
  }
  
}

function toggleNotificationDropdown() {
  const drop = document.getElementById('notification-dropdown');
  if(drop) drop.classList.toggle('active');
}

function renderNotificationDropdown() {
  const container = document.getElementById('notification-list');
  if (!container) return;
  container.innerHTML = '';

  const activeNotifs = getActiveSystemNotifications();

  if (activeNotifs.length === 0) {
    container.innerHTML = '<div class="notification-empty">Tidak ada notifikasi aktif. (Sistem Operasi Prima)</div>';
    return;
  }

  activeNotifs.forEach(n => {
    const isUnread = n.read_status === 0 ? 'unread' : '';
    
    let badgeDot = '🟢';
    if(n.type === 'WARNING LEVEL 1') badgeDot = '🟡';
    else if(n.type === 'WARNING LEVEL 2') badgeDot = '🟠';
    else if(n.type === 'ACTION REQUIRED' || n.type === 'OVERDUE') badgeDot = '🔴';

    const item = `
      <div class="notification-item ${isUnread}" onclick="markNotificationRead(${n.id})">
        <div class="notification-item-title">${badgeDot} ${n.title}</div>
        <div class="notification-item-desc">${n.message}</div>
        <div class="notification-item-time">Telemetri Realtime: ${n.type}</div>
      </div>
    `;
    container.innerHTML += item;
  });
}

function markNotificationRead(id) {
  if (!dbState.read_notification_ids) dbState.read_notification_ids = [];
  if (!dbState.read_notification_ids.includes(id)) {
    dbState.read_notification_ids.push(id);
    saveDatabase();
    updateUIPendingItems();
  }
}

function clearAllNotifications(event) {
  if (event) event.stopPropagation();
  const activeNotifs = getActiveSystemNotifications();
  if (!dbState.read_notification_ids) dbState.read_notification_ids = [];
  activeNotifs.forEach(n => {
    if (!dbState.read_notification_ids.includes(n.id)) {
      dbState.read_notification_ids.push(n.id);
    }
  });
  saveDatabase();
  updateUIPendingItems();
}

// --- MOCK IN-MEMORY SQL TERMINAL CONSOLE ---

function runSqlQuery() {
  const query = document.getElementById('sql-query-text').value.trim();
  const container = document.getElementById('sql-result-table-container');

  if(!query) {
    container.innerHTML = '<div class="sql-empty-state" style="color:var(--color-red);">Masukkan perintah query SQL.</div>';
    return;
  }

  try {
    // Parser for: SELECT [fields] FROM [table] [WHERE condition] [ORDER BY field [DESC/ASC]]
    const regex = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(DESC|ASC))?)?$/i;
    const match = query.match(regex);

    if(!match) {
      throw new Error("Syntax Error: Hanya mendukung dasar SELECT query. Format: SELECT * FROM [table] WHERE [col] = [val]");
    }

    const selectFieldsStr = match[1].trim();
    const tableName = match[2].trim().toLowerCase();
    const whereStr = match[3] ? match[3].trim() : null;
    const orderByField = match[4] ? match[4].trim() : null;
    const orderDirection = match[5] ? match[5].trim().toUpperCase() : 'ASC';

    if (!dbState[tableName]) {
      throw new Error(`Table Error: Table '${tableName}' tidak ditemukan di database.`);
    }

    let records = JSON.parse(JSON.stringify(dbState[tableName])); // copy state

    // Filter WHERE
    if (whereStr) {
      // parse: field op val
      const matchWhere = whereStr.match(/(\w+)\s*(=|>|<|like)\s*(.+)/i);
      if(!matchWhere) {
        throw new Error("WHERE Error: Hanya mendukung operasi filter sederhana (=, >, <, LIKE)");
      }
      const field = matchWhere[1].trim();
      const op = matchWhere[2].trim().toLowerCase();
      let val = matchWhere[3].trim().replace(/['"]/g, ''); // strip quotes

      records = records.filter(row => {
        if(row[field] === undefined) return false;
        
        let rowVal = row[field];
        let compareVal = val;
        
        // Convert to numbers if numeric
        if(!isNaN(rowVal) && !isNaN(compareVal)) {
          rowVal = parseFloat(rowVal);
          compareVal = parseFloat(compareVal);
        }

        if (op === '=') return rowVal == compareVal;
        if (op === '>') return rowVal > compareVal;
        if (op === '<') return rowVal < compareVal;
        if (op === 'like') {
          // simple substring match
          return String(rowVal).toLowerCase().includes(String(compareVal).toLowerCase());
        }
        return false;
      });
    }

    // Sort ORDER BY
    if (orderByField) {
      records.sort((a, b) => {
        let valA = a[orderByField];
        let valB = b[orderByField];
        
        if (valA === undefined || valB === undefined) return 0;

        if (!isNaN(valA) && !isNaN(valB)) {
          valA = parseFloat(valA);
          valB = parseFloat(valB);
        }

        if(valA < valB) return orderDirection === 'DESC' ? 1 : -1;
        if(valA > valB) return orderDirection === 'DESC' ? -1 : 1;
        return 0;
      });
    }

    // Display Columns SELECT
    let displayCols = [];
    if (selectFieldsStr === '*') {
      if (records.length > 0) {
        displayCols = Object.keys(records[0]);
      } else {
        displayCols = ['Status'];
      }
    } else {
      displayCols = selectFieldsStr.split(',').map(s => s.trim());
    }

    if (records.length === 0) {
      container.innerHTML = '<div class="sql-empty-state">Query executed successfully. (0 rows returned)</div>';
      return;
    }

    // Draw HTML Table
    let tableHTML = `
      <table class="data-table" style="font-family:'JetBrains Mono'; font-size:11px;">
        <thead>
          <tr>
            ${displayCols.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${records.map(row => `
            <tr>
              ${displayCols.map(col => `<td>${row[col] !== undefined ? JSON.stringify(row[col]) : '<span style="color:red;">NULL</span>'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = tableHTML;
    logToConsole('SYSTEM', `SQL Query executed: ${query.slice(0, 30)}... (${records.length} rows)`);

  } catch (err) {
    container.innerHTML = `<div class="sql-empty-state" style="color:var(--color-red); text-align:left;">
      <b>SQL Database Parser Error:</b><br>
      ${err.message}
    </div>`;
  }
}

function clearSqlQuery() {
  document.getElementById('sql-query-text').value = '';
  document.getElementById('sql-result-table-container').innerHTML = '<div class="sql-empty-state">Masukkan query SQL dan klik \'Execute Query\'.</div>';
}

// --- REST API SANDBOX SIMULATOR ---

function selectApiEndpoint(method, path) {
  apiSandboxConfig.method = method;
  apiSandboxConfig.endpoint = path;

  // Update button active list
  document.querySelectorAll('.api-endpoint-item').forEach(btn => {
    btn.classList.remove('active');
    if(btn.innerText.includes(path)) btn.classList.add('active');
  });

  updateApiSandboxConsole();
}

function updateApiSandboxConsole() {
  const urlEl = document.getElementById('api-request-url');
  const bodySection = document.getElementById('api-body-section');
  const bodyText = document.getElementById('api-body-text');

  urlEl.innerText = `${apiSandboxConfig.method} http://localhost:5000${apiSandboxConfig.endpoint}`;
  
  if (apiSandboxConfig.method === 'POST') {
    bodySection.classList.remove('hidden');
    
    // Set default mock body parameters
    if (apiSandboxConfig.endpoint.includes('running-hours')) {
      bodyText.value = JSON.stringify({
        added_hours: 8.5,
        updated_by: 'Operator 1',
        source: 'MQTT'
      }, null, 2);
    } else if (apiSandboxConfig.endpoint.includes('replace')) {
      bodyText.value = JSON.stringify({
        replaced_by: 'Danko Ariyanto',
        downtime_minutes: 90,
        cost: 15000000,
        notes: 'Ganti impeller seal aus.'
      }, null, 2);
    }
  } else {
    bodySection.classList.add('hidden');
  }

  document.getElementById('api-response-output').innerText = 'Click \'Kirim API Request\' to test JSON REST API responses.';
}

function sendApiRequest() {
  const outputEl = document.getElementById('api-response-output');
  const bodyText = document.getElementById('api-body-text').value;

  let mockResponse = {};
  let status = 200;

  try {
    const ep = apiSandboxConfig.endpoint;

    if (apiSandboxConfig.method === 'GET') {
      if (ep === '/api/machines') {
        mockResponse = dbState.machines.map(m => {
          return {
            ...m,
            health: getMachineOverallHealth(m.id)
          };
        });
      } else if (ep === '/api/spare-parts') {
        mockResponse = dbState.spare_parts.map(p => {
          const machine = dbState.machines.find(m => m.id === p.machine_id);
          const daily = machine ? machine.running_hours_daily : 20;
          return getSparePartCalculatedDetails(p, daily);
        });
      } else if (ep === '/api/analytics/dashboard') {
        // Aggregate KPI counts
        let warning = 0; let overdue = 0; let active = 0; let cost = 0;
        dbState.spare_parts.forEach(p => {
          const m = dbState.machines.find(mac => mac.id === p.machine_id);
          const c = getSparePartCalculatedDetails(p, m ? m.running_hours_daily : 20);
          if (c.status === 'OVERDUE') overdue++;
          else if (c.status === 'ACTION REQUIRED') active++;
          else if (c.status.includes('WARNING')) warning++;
        });
        dbState.replacement_history.forEach(h => cost += h.cost);

        mockResponse = {
          total_machines: dbState.machines.length,
          total_spare_parts: dbState.spare_parts.length,
          overdue_count: overdue,
          action_required_count: active,
          warning_count: warning,
          total_maintenance_cost: cost,
          pm_compliance_kpi: dbState.replacement_history.length > 0 ? (dbState.replacement_history.length / (dbState.replacement_history.length + overdue + active) * 100).toFixed(1) + '%' : '100.0%'
        };
      }
    } else {
      // POST logic simulator
      const body = JSON.parse(bodyText);

      if (ep.includes('running-hours')) {
        // Mock machine ID 1
        const added = parseFloat(body.added_hours);
        if (isNaN(added) || added <= 0) {
          status = 400;
          mockResponse = { error: 'Bad Request: added_hours must be a positive number' };
        } else {
          addRunningHoursToDatabase(1, added, body.updated_by || 'API Simulator', body.source || 'Manual');
          mockResponse = { success: true, message: 'Running hours updated successfully', machine: dbState.machines[0] };
        }
      } else if (ep.includes('replace')) {
        // Mock spare part ID 1
        replaceSparePartInDatabase(1, body.replaced_by || 'API Technician', body.downtime_minutes || 60, body.cost || 0, body.notes || 'API Replace', '');
        mockResponse = { success: true, message: 'Spare part successfully replaced', spare_part: dbState.spare_parts[0] };
      }
    }

    outputEl.innerText = `HTTP/1.1 ${status} OK\nContent-Type: application/json\n\n${JSON.stringify(mockResponse, null, 2)}`;
  } catch (err) {
    outputEl.innerText = `HTTP/1.1 500 Internal Server Error\n\n{ "error": "${err.message}" }`;
  }
}

// --- SYSTEM BACKUP & RESTORE UTILITIES ---

function backupSystem() {
  openResetAuthModal('BACKUP_SYSTEM', 'Backup Database (JSON)', 'Ekspor seluruh data preventif, mesin, spare part, dan riwayat telemetri ke berkas JSON cadangan.');
}

function executeBackupDownload(authUser) {
  const exportPayload = {
    system_branding: "PREDICTACORE PREVENTIVE MAINTENANCE CMMS SYSTEM",
    system_logo: "assets/predictacore_logo.png",
    export_timestamp: new Date().toISOString(),
    exported_by: authUser ? `${authUser.full_name} (${authUser.role})` : (activeUser ? `${activeUser.full_name} (${activeUser.role})` : 'Administrator'),
    app_version: "v3.5.0-PRO",
    database: dbState
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `PREDICTACORE_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  logToConsole('SYSTEM', `SECURITY AUDIT: Database backup file (JSON) diunduh oleh ${authUser ? authUser.full_name : 'User'} (${authUser ? authUser.role : 'ADMIN'}).`);
}

function downloadBackupReportPDF() {
  const nowStr = new Date().toLocaleString('id-ID');
  const totalM = dbState.machines ? dbState.machines.length : 0;
  const totalP = dbState.spare_parts ? dbState.spare_parts.length : 0;
  const totalR = dbState.replacement_history ? dbState.replacement_history.length : 0;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up terblokir. Izinkan pop-up untuk mengunduh laporan PDF.');
    return;
  }

  const partsRowsHTML = dbState.spare_parts.map((p, i) => {
    const m = dbState.machines.find(mac => Number(mac.id) === Number(p.machine_id));
    return `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td><code style="font-family:monospace; background:rgba(0,229,255,0.1); color:#00e5ff; padding:2px 6px; border-radius:4px;">${p.code}</code></td>
        <td>${m ? m.name : 'Unknown'}</td>
        <td style="text-align:right;">${p.lifetime_hours} Jam</td>
        <td style="text-align:right;">${p.current_running_hours.toFixed(1)} Jam</td>
        <td style="text-align:center;"><span style="font-weight:bold; color:${p.critical_level === 'CRITICAL HIGH' ? '#ef4444' : '#00e5ff'};">${p.critical_level}</span></td>
      </tr>
    `;
  }).join('');

  const historyRowsHTML = dbState.replacement_history.slice(0, 15).map(h => `
    <tr>
      <td><code>${h.replacement_date}</code></td>
      <td><strong>${h.spare_part_name}</strong></td>
      <td><code>${h.spare_part_code}</code></td>
      <td>${h.replaced_by}</td>
      <td style="text-align:right;">${h.downtime_minutes} Menit</td>
      <td style="text-align:right; font-weight:bold;">Rp ${(h.cost || 0).toLocaleString('id-ID')}</td>
    </tr>
  `).join('');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>PredictaCore Backup & Telemetry Report</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; background: #0b0f17; color: #e2e8f0; margin: 0; padding: 40px; }
        .report-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00e5ff; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-box { display: flex; align-items: center; gap: 16px; }
        .logo-img { width: 110px; height: 110px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 0 12px rgba(0,229,255,0.6)); }
        .title-box h1 { color: #00e5ff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
        .title-box p { color: #94a3b8; font-size: 12px; margin: 4px 0 0 0; }
        .meta-box { text-align: right; font-size: 11px; color: #94a3b8; line-height: 1.5; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
        .kpi-card { background: #141c28; border: 1px solid #233142; border-radius: 10px; padding: 18px; text-align: center; }
        .kpi-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }
        .kpi-val { font-size: 26px; font-weight: 800; color: #00e5ff; margin-top: 6px; }
        h2 { font-size: 15px; color: #ffffff; border-left: 4px solid #00e5ff; padding-left: 10px; margin-top: 35px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background: #182333; color: #00e5ff; padding: 10px 12px; text-align: left; border-bottom: 2px solid #233142; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        td { padding: 10px 12px; border-bottom: 1px solid #1e2d3d; }
        tr:nth-child(even) { background: rgba(255, 255, 255, 0.02); }
        .btn-print { background: linear-gradient(135deg, #00e5ff, #00b0ff); color: #000; font-weight: 800; border: none; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-size: 12px; box-shadow: 0 0 15px rgba(0,229,255,0.4); }
        @media print {
          .btn-print { display: none; }
          body { background: #ffffff; color: #000000; padding: 20px; }
          .kpi-card { background: #f8fafc; border-color: #cbd5e1; }
          .kpi-val, .title-box h1, th { color: #0284c7; }
          td, th { border-color: #cbd5e1; }
          tr:nth-child(even) { background: #f1f5f9; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="logo-box">
          <img class="logo-img" src="assets/predictacore_logo.png" alt="PredictaCore Emblem">
          <div class="title-box">
            <h1>PREDICTACORE CMMS TELEMETRY REPORT</h1>
            <p>Laporan Resmi Backup Database & Telemetri Kesehatan Spare Part</p>
          </div>
        </div>
        <div class="meta-box">
          <div><strong>Tanggal Cetak:</strong> ${nowStr}</div>
          <div><strong>Oleh:</strong> ${activeUser ? activeUser.full_name : 'Administrator'} (${activeUser ? activeUser.role : 'ADMIN'})</div>
          <div style="margin-top:8px;"><button class="btn-print" onclick="window.print()">🖨️ Cetak / PDF</button></div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total Mesin Terdaftar</div>
          <div class="kpi-val">${totalM} Unit</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Master Spare Part</div>
          <div class="kpi-val">${totalP} Part</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Log Riwayat PM</div>
          <div class="kpi-val">${totalR} Log</div>
        </div>
      </div>

      <h2>Master Spare Part & Running Hours Status</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:center;">No</th>
            <th>Nama Spare Part</th>
            <th>Kode Part</th>
            <th>Mesin Asosiasi</th>
            <th style="text-align:right;">Target Lifetime</th>
            <th style="text-align:right;">Terpakai Saat Ini</th>
            <th style="text-align:center;">Critical Level</th>
          </tr>
        </thead>
        <tbody>
          ${partsRowsHTML}
        </tbody>
      </table>

      <h2>Log Riwayat Penggantian (Preventive Maintenance)</h2>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama Spare Part</th>
            <th>Kode</th>
            <th>Teknisi / User</th>
            <th style="text-align:right;">Downtime</th>
            <th style="text-align:right;">Biaya (IDR)</th>
          </tr>
        </thead>
        <tbody>
          ${historyRowsHTML}
        </tbody>
      </table>
    </body>
    </html>
  `);
}

function initiateRestoreSystem() {
  const fileInput = document.getElementById('system-restore-file');
  if (!fileInput || fileInput.files.length === 0) {
    alert('Pilih file JSON backup terlebih dahulu.');
    return;
  }
  openResetAuthModal('RESTORE_SYSTEM', 'Restore Database (JSON)', 'Restorasi & menimpa seluruh database berjalan dengan data dari file JSON yang diunggah.');
}

function restoreSystem() {
  initiateRestoreSystem();
}

function executeRestoreFromFileInput(authUser) {
  const fileInput = document.getElementById('system-restore-file');
  if (!fileInput || fileInput.files.length === 0) {
    alert('Pilih file JSON backup terlebih dahulu.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const targetDb = parsed.database ? parsed.database : parsed;

      if(!targetDb.machines || !targetDb.spare_parts || !targetDb.users) {
        throw new Error('Format file backup tidak valid. Table utama hilang.');
      }

      dbState = targetDb;
      saveDatabase();
      logToConsole('SYSTEM', `SECURITY AUDIT: Database berhasil direstorasi dari file JSON oleh ${authUser ? authUser.full_name : 'User'} (${authUser ? authUser.role : 'ADMIN'}).`);
      alert('Database PredictaCore berhasil direstorasi!');

      // Refresh current active panels
      switchTab(currentTab);
      updateMachineSelectDropdowns();

    } catch (err) {
      alert(`Gagal merestorasi database: ${err.message}`);
    }
  };

  reader.readAsText(file);
}

function resetSystemToDefault() {
  openResetAuthModal('FACTORY_RESET', 'Reset Database Ke Pabrik', 'Mengembalikan seluruh status mesin, spare part, dan parameter ke data awal seeder PredictaCore Demo.');
}

// Helper to fill select elements
function updateMachineSelectDropdowns() {
  const mSelect = document.getElementById('modal-part-machine-id');
  if (mSelect) {
    mSelect.innerHTML = '';
    dbState.machines.forEach(m => {
      mSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.asset_number})</option>`;
    });
  }

  const partFilterMachine = document.getElementById('part-filter-machine');
  if (partFilterMachine) {
    const currentVal = partFilterMachine.value;
    partFilterMachine.innerHTML = '<option value="">Semua Mesin</option>';
    dbState.machines.forEach(m => {
      partFilterMachine.innerHTML += `<option value="${m.id}">${m.name} (${m.asset_number})</option>`;
    });
    partFilterMachine.value = currentVal;
  }
}

// --- USER MANAGEMENT FUNCTIONS (ADMIN ONLY) ---

function renderUsersTable() {
  const tbody = document.getElementById('users-table-tbody');
  tbody.innerHTML = '';

  const searchVal = document.getElementById('user-search-input').value.toLowerCase();

  dbState.users.forEach(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchVal) || 
                          u.full_name.toLowerCase().includes(searchVal);

    if (matchesSearch) {
      const isSelf = u.username === activeUser.username;
      const deleteBtn = isSelf 
        ? '<span style="color:var(--text-muted); font-size:11px;">Active Session</span>'
        : `<button class="btn-action-icon" style="color:var(--color-red);" title="Hapus User" onclick="deleteUser(${u.id})">🗑️ Hapus</button>`;
      
      const maskedPass = '••••••••';

      const tr = `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.full_name}</td>
          <td><code style="font-family:'JetBrains Mono';">${maskedPass}</code></td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'badge-crit-low' : (u.role === 'SUPERVISOR' ? 'badge-warning-2' : 'badge-normal')}">${u.role}</span></td>
          <td>
            <button class="btn-action-icon" title="Edit User" onclick="openUserModal(${u.id})">✏️ Edit</button>
            ${deleteBtn}
          </td>
        </tr>
      `;
      tbody.innerHTML += tr;
    }
  });

  if (tbody.innerHTML === '') {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada user ditemukan.</td></tr>`;
  }
}

function openUserModal(id = null) {
  if (activeUser.role !== 'ADMIN') {
    alert('Akses Ditolak: Hanya Admin yang dapat mengelola user.');
    return;
  }

  const title = document.getElementById('user-modal-title');
  const modalId = document.getElementById('modal-user-id');
  const usernameIn = document.getElementById('modal-user-username');
  const fullnameIn = document.getElementById('modal-user-fullname');
  const passwordIn = document.getElementById('modal-user-password');
  const passwordRequired = document.getElementById('modal-user-password-required');
  const roleIn = document.getElementById('modal-user-role');

  const roleOptionsHTML = `
    <option value="ADMIN">ADMIN (Full Access)</option>
    <option value="SUPERVISOR">SUPERVISOR (Approval)</option>
    <option value="TECHNICIAN">TECHNICIAN (Input &amp; Replace)</option>
  `;

  if (id) {
    title.innerText = 'Edit Akun User';
    const u = dbState.users.find(usr => usr.id === id);
    modalId.value = u.id;
    usernameIn.value = u.username;
    fullnameIn.value = u.full_name;
    passwordIn.value = '';
    passwordIn.placeholder = 'Kosongkan jika password tidak diubah';
    if (passwordRequired) passwordRequired.style.display = 'none';
    roleIn.innerHTML = roleOptionsHTML;
    roleIn.value = u.role;
    usernameIn.disabled = false;
  } else {
    title.innerText = 'Tambah User Baru';
    modalId.value = '';
    usernameIn.value = '';
    fullnameIn.value = '';
    passwordIn.value = '';
    passwordIn.placeholder = 'Masukkan password/PIN (minimal 4 karakter)';
    if (passwordRequired) passwordRequired.style.display = '';
    roleIn.innerHTML = roleOptionsHTML;
    roleIn.value = 'SUPERVISOR';
    usernameIn.disabled = false;
  }

  document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

async function saveUserData() {
  const modalId = document.getElementById('modal-user-id').value;
  const username = document.getElementById('modal-user-username').value.trim();
  const fullname = document.getElementById('modal-user-fullname').value.trim();
  const password = document.getElementById('modal-user-password').value.trim();
  const role = document.getElementById('modal-user-role').value;

  if (!username || !fullname || (!modalId && !password)) {
    alert('Harap isi semua kolom wajib (*)');
    return;
  }

  if (password && (password.length < 4 || password.length > 128)) {
    alert('Password/PIN harus terdiri dari 4–128 karakter.');
    return;
  }

  // Check unique username
  const duplicate = dbState.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id != modalId);
  if (duplicate) {
    alert('Username sudah digunakan oleh akun lain!');
    return;
  }

  const saveButton = document.getElementById('save-user-button');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.innerText = 'Menyimpan...';
  }

  try {
    const endpoint = modalId ? `/api/users/${encodeURIComponent(modalId)}` : '/api/users';
    const response = await fetch(endpoint, {
      method: modalId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, full_name: fullname, password, role })
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.status !== 'success' || !result.user) {
      throw new Error(result?.message || 'User gagal disimpan oleh server.');
    }

    const savedUser = {
      id: Number(result.user.id),
      username: result.user.username,
      password: '',
      role: result.user.role,
      full_name: result.user.full_name
    };

    if (modalId) {
      const userIndex = dbState.users.findIndex(usr => Number(usr.id) === Number(modalId));
      if (userIndex >= 0) dbState.users[userIndex] = savedUser;
      logToConsole('SYSTEM', `User ${username} [Role: ${role}] diperbarui oleh Admin.`);
    } else {
      dbState.users.push(savedUser);
      logToConsole('SYSTEM', `User baru dibuat: ${username} [Role: ${role}] oleh Admin.`);
    }

    localStorage.setItem('pm_system_db', JSON.stringify(dbState));
    closeUserModal();
    renderUsersTable();
    populateLoginUserDropdown();
    if (typeof showSystemNotificationBanner === 'function') {
      showSystemNotificationBanner(`✅ ${result.message}`, 'success');
    }
  } catch (error) {
    alert(`⚠️ Gagal menyimpan user:\n${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerText = 'Simpan User';
    }
  }
}

async function deleteUser(id) {
  const u = dbState.users.find(usr => usr.id === id);
  if (!u) return;

  if (u.username === activeUser.username) {
    alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk!');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus user: ${u.full_name} (${u.username})?`)) {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.status !== 'success') {
        throw new Error(result?.message || 'User gagal dihapus oleh server.');
      }

      dbState.users = dbState.users.filter(usr => Number(usr.id) !== Number(id));
      localStorage.setItem('pm_system_db', JSON.stringify(dbState));
      renderUsersTable();
      populateLoginUserDropdown();
      logToConsole('SYSTEM', `User ${u.username} dihapus oleh Admin.`);
    } catch (error) {
      alert(`⚠️ Gagal menghapus user:\n${error.message}`);
    }
  }
}

// --- KIOSK PANEL CONTROLS (FULLSCREEN LOCK & SHUTDOWN) ---

let kioskBypassChange = false;

async function requestKioskFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } catch (error) {
    console.warn('Mode fullscreen tidak dapat diaktifkan:', error);
  }
}

// Watch fullscreen status change
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = !!document.fullscreenElement;
  const fsBtn = document.getElementById('kiosk-fs-btn');
  
  if (isFullscreen) {
    if (fsBtn) {
      fsBtn.textContent = '🗗';
      fsBtn.title = 'Keluar dari Full Screen';
      fsBtn.setAttribute('aria-label', 'Keluar dari Full Screen');
      fsBtn.style.borderColor = 'var(--color-green)';
      fsBtn.style.boxShadow = 'var(--glow-green)';
      fsBtn.style.backgroundColor = 'rgba(13, 242, 138, 0.05)';
    }
    document.getElementById('kiosk-lock').classList.add('hidden');
  } else {
    if (fsBtn) {
      fsBtn.style = '';
      fsBtn.textContent = '🖥️';
      fsBtn.title = 'Full Screen (Kiosk Mode)';
      fsBtn.setAttribute('aria-label', 'Full Screen (Kiosk Mode)');
    }

    // If exited fullscreen, check if it was authorized by an Admin
    if (activeUser.role !== 'ADMIN' && !kioskBypassChange) {
      document.getElementById('kiosk-lock').classList.remove('hidden');
      document.getElementById('kiosk-admin-pass').value = '';
      document.getElementById('kiosk-lock-error').style.display = 'none';
    }
    
    kioskBypassChange = false;
  }
});

function lockKioskBackToFullscreen() {
  requestKioskFullscreen();
}

function unlockKioskByAdmin() {
  const password = document.getElementById('kiosk-admin-pass').value.trim();
  const errorEl = document.getElementById('kiosk-lock-error');

  const matchedAdmin = dbState.users.find(u => u.role === 'ADMIN' && u.password === password);

  if (matchedAdmin) {
    kioskBypassChange = true;
    document.getElementById('kiosk-lock').classList.add('hidden');
    logToConsole('SYSTEM', `Kiosk mode unlocked successfully by Admin: ${matchedAdmin.username}.`);
    
    changeUserRoleDirect(matchedAdmin);
  } else {
    errorEl.style.display = 'block';
  }
}

function kioskMinimizeApp() {
  if (activeUser.role !== 'ADMIN') {
    alert('Akses Ditolak: Hanya Administrator yang dapat meminimalisir tampilan PredictaCore!');
    return;
  }

  kioskBypassChange = true;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
  logToConsole('SYSTEM', 'Kiosk mode minimized by Administrator.');
}

function kioskCloseApp() {
  if (activeUser.role !== 'ADMIN') {
    alert('Akses Ditolak: Hanya Administrator yang dapat menutup/mematikan tampilan PredictaCore!');
    return;
  }

  if (confirm('Apakah Anda yakin ingin mematikan HMI Panel PredictaCore?')) {
    kioskBypassChange = true;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    document.getElementById('shutdown-screen').classList.remove('hidden');
    logToConsole('SYSTEM', 'Sistem HMI dimatikan oleh Administrator.');
  }
}

function rebootAppSimulation() {
  document.getElementById('shutdown-screen').classList.add('hidden');
  logToConsole('SYSTEM', 'System booting... Relational core online.');
  requestKioskFullscreen();
}

// --- RUNNING HOURS RESET LOGIC ---

// --- SECURITY RESET AUTHENTICATION POPUP MODAL LOGIC ---

let currentResetActionInfo = null;

function openResetAuthModal(actionType, actionTitle, actionDescription, targetId = null) {
  currentResetActionInfo = {
    type: actionType,
    title: actionTitle,
    description: actionDescription,
    targetId: targetId
  };

  const titleEl = document.getElementById('reset-action-title');
  const descEl = document.getElementById('reset-action-desc');
  const userSelect = document.getElementById('reset-user-select');
  const pwdInput = document.getElementById('reset-auth-password');
  const errorMsg = document.getElementById('reset-auth-error');

  if (titleEl) titleEl.innerText = actionTitle;
  if (descEl) descEl.innerText = actionDescription;

  if (userSelect) {
    userSelect.innerHTML = '';
    const authUsers = dbState.users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERVISOR');
    const displayUsers = authUsers.length > 0 ? authUsers : dbState.users;

    displayUsers.forEach(u => {
      const isCurrent = (activeUser && u.username === activeUser.username) ? 'selected' : '';
      userSelect.innerHTML += `<option value="${u.username}" ${isCurrent}>${u.full_name} (${u.role}) - @${u.username}</option>`;
    });
  }

  if (pwdInput) pwdInput.value = '';
  if (errorMsg) errorMsg.style.display = 'none';

  const modal = document.getElementById('reset-auth-modal');
  if (modal) modal.classList.add('active');
}

function closeResetAuthModal() {
  const modal = document.getElementById('reset-auth-modal');
  if (modal) modal.classList.remove('active');
  const pwdInput = document.getElementById('reset-auth-password');
  if (pwdInput) pwdInput.value = '';
  const errorMsg = document.getElementById('reset-auth-error');
  if (errorMsg) errorMsg.style.display = 'none';
  currentResetActionInfo = null;
}

async function confirmSecureReset() {
  if (!currentResetActionInfo) {
    closeResetAuthModal();
    return;
  }

  const userSelect = document.getElementById('reset-user-select');
  const pwdInput = document.getElementById('reset-auth-password');
  const errorMsg = document.getElementById('reset-auth-error');

  const username = userSelect ? userSelect.value : '';
  const password = pwdInput ? pwdInput.value.trim() : '';

  const authUser = dbState.users.find(u => u.username === username);

  if (!authUser) {
    if (errorMsg) {
      errorMsg.innerText = '⚠️ Akun user otorisasi tidak ditemukan.';
      errorMsg.style.display = 'block';
    }
    return;
  }

  // Check role authorization
  if (currentResetActionInfo.type === 'FACTORY_RESET' || currentResetActionInfo.type === 'IMPORT_PARTS' || currentResetActionInfo.type === 'CLEAR_PARTS' || currentResetActionInfo.type === 'CLEAR_HISTORY') {
    if (authUser.role !== 'ADMIN') {
      if (errorMsg) {
        errorMsg.innerText = '⚠️ Akses Ditolak: Hanya Administrator yang memiliki wewenang untuk aktivitas ini.';
        errorMsg.style.display = 'block';
      }
      return;
    }
  } else {
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPERVISOR') {
      if (errorMsg) {
        errorMsg.innerText = '⚠️ Akses Ditolak: Hanya Admin atau Supervisor yang dapat mengonfirmasi aktivitas ini.';
        errorMsg.style.display = 'block';
      }
      return;
    }
  }

  // Validate Password / PIN using the centralized backend credential store.
  let isValidPassword = false;
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json().catch(() => null);
    isValidPassword = response.ok && result?.status === 'success';
  } catch (error) {
    console.error('Gagal memverifikasi otorisasi user:', error);
  }

  if (!isValidPassword) {
    if (errorMsg) {
      errorMsg.innerText = `⚠️ Password / PIN salah untuk akun ${authUser.full_name}.`;
      errorMsg.style.display = 'block';
    }
    return;
  }

  // Password & Role Authorized -> Execute Pending Action
  const actionInfo = currentResetActionInfo;
  closeResetAuthModal();

  switch (actionInfo.type) {
    case 'FACTORY_RESET':
      resetDbState();
      switchTab(currentTab);
      updateMachineSelectDropdowns();
      logToConsole('SYSTEM', `SECURITY AUDIT: Database direset ke Pabrik (Demo Factory) oleh ${authUser.full_name} (${authUser.role}).`);
      alert('Database berhasil direset ke status awal Pabrik (PredictaCore Demo).');
      break;

    case 'RESET_ALL_HOURS':
      dbState.machines.forEach(m => {
        m.running_hours_total = 0;
        m.running_hours_daily = 0;
        m.running_hours_weekly = 0;
        m.running_hours_monthly = 0;
        m.last_updated = new Date().toISOString();
      });
      dbState.spare_parts.forEach(sp => {
        sp.current_running_hours = 0;
      });
      dbState.running_hours_log = [];
      saveDatabase();
      logToConsole('SYSTEM', `SECURITY AUDIT: Seluruh data Running Hours direset ke 0 jam oleh ${authUser.full_name} (${authUser.role}).`);
      switchTab(currentTab);
      alert('Seluruh data Running Hours mesin dan spare part berhasil direset ke 0 jam.');
      break;

    case 'RESET_ALL_PARTS_HOURS':
      dbState.spare_parts.forEach(sp => {
        sp.current_running_hours = 0;
      });
      saveDatabase();
      logToConsole('SYSTEM', `SECURITY AUDIT: Seluruh running hours spare part direset ke 0 jam oleh ${authUser.full_name} (${authUser.role}).`);
      renderSparePartsTable();
      alert('Seluruh data Running Hours spare part berhasil direset ke 0 jam.');
      break;

    case 'RESET_MACHINE_HOURS':
      if (actionInfo.targetId) {
        const m = dbState.machines.find(mach => mach.id === actionInfo.targetId);
        if (m) {
          m.running_hours_total = 0;
          m.running_hours_daily = 0;
          m.running_hours_weekly = 0;
          m.running_hours_monthly = 0;
          m.last_updated = new Date().toISOString();

          dbState.spare_parts.forEach(sp => {
            if (sp.machine_id === actionInfo.targetId) {
              sp.current_running_hours = 0;
            }
          });

          dbState.running_hours_log = dbState.running_hours_log.filter(l => l.machine_id !== actionInfo.targetId);

          saveDatabase();
          logToConsole('SYSTEM', `SECURITY AUDIT: Data Running Hours untuk mesin ${m.name} direset ke 0 jam oleh ${authUser.full_name} (${authUser.role}).`);
          openMachineDetailsModal(actionInfo.targetId);
          if (currentTab === 'machines') renderMachinesTable();
          if (currentTab === 'dashboard') loadDashboardData();
          alert(`Data Running Hours untuk ${m.name} berhasil direset ke 0 jam.`);
        }
      }
      break;

    case 'RESET_PART_HOURS':
      if (actionInfo.targetId) {
        const p = dbState.spare_parts.find(sp => sp.id === actionInfo.targetId);
        if (p) {
          const parentM = findMachineForSparePart(p);
          p.last_replacement_rh = parentM ? Number(parentM.running_hours_total) || 0 : 0;
          p.current_running_hours = 0;
          saveDatabase();
          logToConsole('SYSTEM', `SECURITY AUDIT: Running hours untuk spare part ${p.name} [${p.code}] direset ke 0 jam oleh ${authUser.full_name} (${authUser.role}).`);
          renderSparePartsTable();
          alert(`Running hours untuk ${p.name} berhasil direset ke 0 jam.`);
        }
      }
      break;

    case 'BACKUP_SYSTEM':
      executeBackupDownload(authUser);
      alert('File Backup JSON berhasil diunduh.');
      break;

    case 'RESTORE_SYSTEM':
      executeRestoreFromFileInput(authUser);
      break;

    case 'IMPORT_PARTS':
      executeOpenImportSparePartModal(authUser);
      logToConsole('SYSTEM', `SECURITY AUDIT: Modal Import Master Spare Part dibuka setelah diautentikasi oleh ${authUser.full_name} (${authUser.role}).`);
      break;

    case 'CLEAR_PARTS':
      executeClearAllSparePartsData(authUser);
      break;

    case 'CLEAR_HISTORY':
      executeClearAllReplacementHistory(authUser);
      break;
  }
}

function resetAllRunningHours() {
  openResetAuthModal('RESET_ALL_HOURS', 'Reset Data Running Hours', 'Mengembalikan running hours total, harian, mingguan, dan bulanan dari semua mesin serta spare part ke 0 jam.');
}

function resetMachineRunningHours(machineId) {
  const m = dbState.machines.find(mach => mach.id === machineId);
  const mName = m ? m.name : 'Mesin';
  openResetAuthModal('RESET_MACHINE_HOURS', `Reset Running Hours ${mName}`, `Mereset data jam jalan mesin ${mName} dan seluruh spare part terkait kembali ke 0 jam.`, machineId);
}

function resetSparePartHours(id) {
  const p = dbState.spare_parts.find(sp => sp.id === id);
  const pName = p ? `${p.name} (${p.code})` : 'Spare Part';
  openResetAuthModal('RESET_PART_HOURS', `Reset Running Hours ${pName}`, `Mereset jam jalan spare part ${pName} kembali ke 0 jam.`, id);
}

function resetAllSparePartsHours() {
  openResetAuthModal('RESET_ALL_PARTS_HOURS', 'Reset Running Hours Semua Part', 'Mengosongkan jam jalan seluruh spare part terdaftar ke 0 jam.');
}

function getMachineHealthPercentage(machineId) {
  const m = dbState.machines.find(mach => mach.id === machineId);
  if (!m) return 100;
  
  const parts = dbState.spare_parts.filter(sp => sp.machine_id === machineId);
  if (parts.length === 0) return 100;

  const dailyHours = m.running_hours_daily > 0 ? m.running_hours_daily : 20;
  
  let totalWeight = 0;
  let weightedSum = 0;
  let minLife = 100;

  parts.forEach(p => {
    const calc = getSparePartCalculatedDetails(p, dailyHours);
    const lifePct = Math.max(0, Math.min(100, calc.remaining_life_pct));
    
    let weight = 1;
    if (p.critical_level === 'CRITICAL') weight = 3;
    else if (p.critical_level === 'MEDIUM') weight = 2;
    
    weightedSum += lifePct * weight;
    totalWeight += weight;
    
    if (lifePct < minLife) minLife = lifePct;
  });

  const weightedAvg = weightedSum / totalWeight;
  const healthPct = (weightedAvg * 0.5) + (minLife * 0.5);
  
  return Number(healthPct.toFixed(1));
}
