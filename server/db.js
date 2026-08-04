const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Run serial initialization to ensure tables are created in order
db.serialize(() => {
  // 1. Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- ADMIN, SUPERVISOR, TECHNICIAN
      full_name TEXT NOT NULL
    )
  `);

  // 2. Machines Table
  db.run(`
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      asset_number TEXT UNIQUE NOT NULL,
      line_code TEXT NOT NULL, -- e.g., Line 1, Liquid Line, Packaging Line
      manufacturer TEXT NOT NULL,
      install_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Standby', -- Running, Standby, Maintenance
      running_hours_total REAL DEFAULT 0,
      running_hours_daily REAL DEFAULT 0,
      running_hours_weekly REAL DEFAULT 0,
      running_hours_monthly REAL DEFAULT 0,
      last_updated TEXT NOT NULL
    )
  `);

  // 3. Spare Parts Table
  db.run(`
    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      vendor TEXT,
      price REAL DEFAULT 0,
      lifetime_hours REAL NOT NULL,
      safety_stock INTEGER DEFAULT 1,
      critical_level TEXT NOT NULL, -- CRITICAL, MEDIUM, LOW
      last_replacement_date TEXT,
      current_running_hours REAL DEFAULT 0, -- accumulated hours since last replacement
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
    )
  `);

  // 4. Running Hours Log Table (For historical audit of updates)
  db.run(`
    CREATE TABLE IF NOT EXISTS running_hours_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER NOT NULL,
      added_hours REAL NOT NULL,
      new_total REAL NOT NULL,
      updated_by TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT DEFAULT 'Manual', -- Manual, PLC, MQTT, Modbus, OPC UA
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
    )
  `);

  // 5. Replacement History Table
  db.run(`
    CREATE TABLE IF NOT EXISTS replacement_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spare_part_id INTEGER NOT NULL,
      machine_id INTEGER NOT NULL,
      spare_part_name TEXT NOT NULL,
      spare_part_code TEXT NOT NULL,
      replaced_by TEXT NOT NULL,
      replacement_date TEXT NOT NULL,
      downtime_minutes INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      photo_url TEXT,
      notes TEXT
    )
  `);

  // 6. Notifications Table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER,
      spare_part_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- WARNING_1, WARNING_2, ACTION_REQUIRED, OVERDUE, RUNNING_HOURS_EXCEEDED
      timestamp TEXT NOT NULL,
      read_status INTEGER DEFAULT 0 -- 0 = Unread, 1 = Read
    )
  `);

  // Seed default data if users table is empty
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users count:', err.message);
      return;
    }
    if (row.count === 0) {
      console.log('Seeding initial data...');
      
      // Users Seed
      // Passwords are intentionally empty. Provision credentials at runtime; never commit default passwords.
      db.run("INSERT INTO users (username, password, role, full_name) VALUES ('admin', '', 'ADMIN', 'Danko Ariyanto')");
      db.run("INSERT INTO users (username, password, role, full_name) VALUES ('spv', '', 'SUPERVISOR', 'Budi Santoso')");
      db.run("INSERT INTO users (username, password, role, full_name) VALUES ('tech', '', 'TECHNICIAN', 'Agus Prayitno')");
      db.run("INSERT INTO users (username, password, role, full_name) VALUES ('YAO', '', 'ADMIN', 'YAO Admin')");

      // Machines Seed (Industry context: mixing, granulator, blister, autoclave)
      const nowStr = new Date().toISOString();
      const installDate = '2024-01-10T08:00:00Z';
      
      db.run(`INSERT INTO machines (name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated) VALUES 
        ('High Shear Mixer Granulator', 'MC-HSG-001', 'Granulation Line A', 'Glatt GmbH', ?, 'Running', 2450.5, 18.5, 110.2, 420.5, ?)`, [installDate, nowStr]);
      
      db.run(`INSERT INTO machines (name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated) VALUES 
        ('Rotary Tablet Press', 'MC-RTP-002', 'Compression Line B', 'Fette Compacting', ?, 'Running', 3120.0, 16.0, 95.0, 380.0, ?)`, [installDate, nowStr]);

      db.run(`INSERT INTO machines (name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated) VALUES 
        ('Blister Packaging Machine', 'MC-BPM-003', 'Packaging Line C', 'Uhlmann', ?, 'Standby', 1890.2, 0.0, 65.5, 290.0, ?)`, [installDate, nowStr]);

      db.run(`INSERT INTO machines (name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated) VALUES 
        ('Horizontal Autoclave Sterilizer', 'MC-HAS-004', 'Sterilization Line D', 'Getinge', ?, 'Maintenance', 4200.8, 0.0, 0.0, 150.0, ?)`, [installDate, nowStr]);

      // Seed Spare Parts for Granulator (machine_id = 1)
      // Normal part: Main Impeller Seal (Lifetime 1000h, run 200h)
      // Warning 1 part: Chopper Blade Assembly (Lifetime 800h, run 420h -> ~47% remaining)
      // Warning 2 part: Pneumatic Discharge Valve O-Ring (Lifetime 500h, run 380h -> 24% remaining)
      // Action Required: Mixing Bowl Temperature Sensor (Lifetime 2000h, run 1920h -> 4% remaining)
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (1, 'Main Impeller Seal', 'SP-IMP-SEAL-01', 'PTFE Double Seal for main shaft', 'Glatt OEM', 1250.0, 1000, 2, 'CRITICAL', '2025-10-01', 200.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (1, 'Chopper Blade Assembly', 'SP-CHOP-BLD-02', 'High-speed chopper blade kit', 'Bohle Parts', 3400.0, 800, 1, 'CRITICAL', '2025-08-15', 420.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (1, 'Discharge Valve O-Ring', 'SP-VALV-ORNG-03', 'EPDM FDA-grade seal 150mm', 'Freudenberg', 180.0, 500, 5, 'MEDIUM', '2026-02-10', 380.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (1, 'Bowl Temperature Sensor RTD', 'SP-TEMP-SENS-04', 'PT100 Temperature sensor sanitary tri-clamp', 'Endress+Hauser', 650.0, 2000, 2, 'LOW', '2024-12-05', 1920.0)`);

      // Seed Spare Parts for Tablet Press (machine_id = 2)
      // Overdue/Action Required: Upper Punch Guide Seals (Lifetime 600h, run 595h -> <1% remaining)
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (2, 'Upper Punch Guide Seals Set', 'SP-PUNCH-SEAL-21', 'Set of 36 polyurethane punch guides', 'Fette OEM', 890.0, 600, 3, 'CRITICAL', '2026-04-12', 595.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (2, 'Compression Roller Bearing', 'SP-ROLL-BEAR-22', 'Heavy duty cylindrical roller bearing', 'SKF', 1450.0, 5000, 1, 'CRITICAL', '2024-05-10', 3120.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (2, 'Discharge Chute Scraper', 'SP-CHUT-SCRP-23', 'Food-grade UHMW scraper blade', 'Fette OEM', 120.0, 1200, 10, 'LOW', '2025-11-20', 450.0)`);

      // Seed Spare Parts for Blister Machine (machine_id = 3)
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (3, 'Forming Die Heating Element', 'SP-HEAT-ELEM-31', 'Cartridge heater 220V 400W', 'Watlow', 310.0, 1500, 4, 'CRITICAL', '2025-06-01', 1100.0)`);
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (3, 'Rotary Sealing Roller Seal', 'SP-SEAL-ROLL-32', 'Teflon coated silicone seal strip', 'Uhlmann OEM', 780.0, 1000, 2, 'CRITICAL', '2026-01-15', 200.0)`);

      // Seed Spare Parts for Autoclave (machine_id = 4)
      db.run(`INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours) VALUES 
        (4, 'Chamber Door Gasket Silicon', 'SP-GASK-DOOR-41', 'Molded silicon chamber gasket Getinge 900L', 'Getinge Parts', 1980.0, 2000, 1, 'CRITICAL', '2025-03-20', 1985.0)`); // Overdue!

      // Seed Replacement History (for graphs and metrics)
      db.run(`INSERT INTO replacement_history (spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes) VALUES 
        (4, 1, 'Bowl Temperature Sensor RTD', 'SP-TEMP-SENS-04', 'Agus Prayitno', '2024-12-05', 45, 650.0, '', 'Old sensor drifted. Calibration failed. Swapped with new unit.')`);
      
      db.run(`INSERT INTO replacement_history (spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes) VALUES 
        (1, 1, 'Main Impeller Seal', 'SP-IMP-SEAL-01', 'Agus Prayitno', '2025-10-01', 120, 1250.0, '', 'Scheduled replacement during annual preventive maintenance.')`);

      db.run(`INSERT INTO replacement_history (spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes) VALUES 
        (3, 1, 'Discharge Valve O-Ring', 'SP-VALV-ORNG-03', 'Agus Prayitno', '2026-02-10', 30, 180.0, '', 'Preventive replacement due to minor steam leak detected.')`);

      db.run(`INSERT INTO replacement_history (spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes) VALUES 
        (5, 2, 'Upper Punch Guide Seals Set', 'SP-PUNCH-SEAL-21', 'Agus Prayitno', '2026-04-12', 90, 890.0, '', 'Guides worn, causing powder leakage. Replaced.')`);

      // Seed Running Hours Log (initial log records)
      db.run(`INSERT INTO running_hours_log (machine_id, added_hours, new_total, updated_by, timestamp, source) VALUES 
        (1, 18.5, 2450.5, 'Agus Prayitno', ?, 'Manual')`, [nowStr]);
      db.run(`INSERT INTO running_hours_log (machine_id, added_hours, new_total, updated_by, timestamp, source) VALUES 
        (2, 16.0, 3120.0, 'OPC UA Connector', ?, 'OPC UA')`, [nowStr]);

      // Seed initial Notifications
      db.run(`INSERT INTO notifications (machine_id, spare_part_id, title, message, type, timestamp, read_status) VALUES 
        (1, 4, 'ACTION REQUIRED: Bowl Temperature Sensor RTD', 'Remaining life < 10% (Currently 4.0%). Spare part replacement mandatory.', 'ACTION_REQUIRED', ?, 0)`, [nowStr]);
      db.run(`INSERT INTO notifications (machine_id, spare_part_id, title, message, type, timestamp, read_status) VALUES 
        (4, 11, 'OVERDUE: Chamber Door Gasket Silicon', 'Spare part has exceeded its lifetime. Currently 1985 hours out of 2000 hours.', 'OVERDUE', ?, 0)`, [nowStr]);

      console.log('Seed completed successfully.');
    }
  });
});

module.exports = db;
