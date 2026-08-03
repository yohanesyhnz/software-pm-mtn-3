const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper for DB queries to use Promises
const dbQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to calculate spare part details
const calculatePartDetails = (part, machineDailyHours = 20) => {
  const lifetime = part.lifetime_hours;
  const currentHours = part.current_running_hours || 0;
  const remainingHours = Math.max(0, lifetime - currentHours);
  const remainingLifePct = Number((((lifetime - currentHours) / lifetime) * 100).toFixed(1));

  // Determine condition level
  let status = 'NORMAL';
  let color = 'green';
  let message = 'Mesin aman digunakan';

  if (currentHours >= lifetime) {
    status = 'OVERDUE';
    color = 'red';
    message = 'Spare part wajib diganti (Overdue)';
  } else if (remainingLifePct < 10) {
    status = 'ACTION REQUIRED';
    color = 'red';
    message = 'Spare part wajib diganti';
  } else if (remainingLifePct >= 10 && remainingLifePct <= 30) {
    status = 'WARNING LEVEL 2';
    color = 'orange';
    message = 'Spare part hampir habis masa pakai (Wajib ada di warehouse)';
  } else if (remainingLifePct > 30 && remainingLifePct <= 50) {
    status = 'WARNING LEVEL 1';
    color = 'yellow';
    message = 'Persiapkan spare part baru & jadwalkan preventive maintenance';
  }

  // Predict Lifetime
  const dailyHours = machineDailyHours > 0 ? machineDailyHours : 20; // fallback to 20
  const remainingDays = Number((remainingHours / dailyHours).toFixed(1));

  // Predict Next PM Date
  const nextPMDate = new Date();
  nextPMDate.setDate(nextPMDate.getDate() + Math.ceil(remainingDays));

  return {
    ...part,
    remaining_hours: remainingHours,
    remaining_life_pct: remainingLifePct,
    status,
    color,
    status_message: message,
    remaining_days: remainingDays,
    predicted_pm_date: nextPMDate.toISOString().split('T')[0]
  };
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (user) {
      res.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          full_name: user.full_name
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER MANAGEMENT API ROUTES ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbQuery('SELECT id, username, role, full_name, password FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, full_name } = req.body;
  try {
    const duplicate = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (duplicate) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    const result = await dbRun(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      [username, password, role, full_name]
    );
    res.status(201).json({ id: result.id, username, role, full_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, full_name } = req.body;
  try {
    await dbRun(
      'UPDATE users SET username = ?, password = ?, role = ?, full_name = ? WHERE id = ?',
      [username, password, role, full_name, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MACHINE ROUTES ---
app.get('/api/machines', async (req, res) => {
  try {
    const machines = await dbQuery('SELECT * FROM machines');
    // For each machine, fetch its spare parts to calculate aggregated status if needed
    const enrichedMachines = await Promise.all(machines.map(async (m) => {
      const parts = await dbQuery('SELECT * FROM spare_parts WHERE machine_id = ?', [m.id]);
      const dailyHours = m.running_hours_daily > 0 ? m.running_hours_daily : 20;
      const calculatedParts = parts.map(p => calculatePartDetails(p, dailyHours));

      // Calculate overall health based on worst part status
      let health = 'NORMAL';
      if (calculatedParts.some(p => p.status === 'OVERDUE' || p.status === 'ACTION REQUIRED')) {
        health = 'ACTION REQUIRED';
      } else if (calculatedParts.some(p => p.status === 'WARNING LEVEL 2')) {
        health = 'WARNING LEVEL 2';
      } else if (calculatedParts.some(p => p.status === 'WARNING LEVEL 1')) {
        health = 'WARNING LEVEL 1';
      }

      return {
        ...m,
        parts: calculatedParts,
        health
      };
    }));
    res.json(enrichedMachines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/machines', async (req, res) => {
  const { name, asset_number, line_code, manufacturer, install_date, status } = req.body;
  const now = new Date().toISOString();
  try {
    const result = await dbRun(
      `INSERT INTO machines (name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`,
      [name, asset_number, line_code, manufacturer, install_date, status || 'Standby', now]
    );
    res.status(201).json({ id: result.id, name, asset_number, line_code, manufacturer, install_date, status: status || 'Standby' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/machines/:id', async (req, res) => {
  const { id } = req.params;
  const { name, asset_number, line_code, manufacturer, install_date, status } = req.body;
  const now = new Date().toISOString();
  try {
    await dbRun(
      `UPDATE machines SET name = ?, asset_number = ?, line_code = ?, manufacturer = ?, install_date = ?, status = ?, last_updated = ? WHERE id = ?`,
      [name, asset_number, line_code, manufacturer, install_date, status, now, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/machines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM machines WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SPARE PART ROUTES ---
app.get('/api/spare-parts', async (req, res) => {
  try {
    const parts = await dbQuery(`
      SELECT sp.*, m.name as machine_name, m.running_hours_daily as machine_daily_hours
      FROM spare_parts sp
      JOIN machines m ON sp.machine_id = m.id
    `);
    const calculatedParts = parts.map(p => calculatePartDetails(p, p.machine_daily_hours || 20));
    res.json(calculatedParts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spare-parts', async (req, res) => {
  const { machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level } = req.body;
  const now = new Date().toISOString().split('T')[0];
  try {
    const result = await dbRun(
      `INSERT INTO spare_parts (machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, now]
    );
    res.status(201).json({ id: result.id, name, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/spare-parts/:id', async (req, res) => {
  const { id } = req.params;
  const { machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level } = req.body;
  try {
    await dbRun(
      `UPDATE spare_parts SET machine_id = ?, name = ?, code = ?, description = ?, vendor = ?, price = ?, lifetime_hours = ?, safety_stock = ?, critical_level = ? WHERE id = ?`,
      [machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/spare-parts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM spare_parts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SPARE PART REPLACEMENT LOGGING ---
app.post('/api/spare-parts/:id/replace', async (req, res) => {
  const { id } = req.params;
  const { replaced_by, downtime_minutes, cost, notes, photo_url } = req.body;
  const now = new Date().toISOString();
  const nowDateOnly = now.split('T')[0];

  try {
    // 1. Get the spare part & machine details
    const part = await dbGet('SELECT * FROM spare_parts WHERE id = ?', [id]);
    if (!part) {
      return res.status(404).json({ error: 'Spare part not found' });
    }

    // 2. Insert into replacement history
    await dbRun(
      `INSERT INTO replacement_history (spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [part.id, part.machine_id, part.name, part.code, replaced_by || 'Technician', nowDateOnly, downtime_minutes || 0, cost || part.price, photo_url || '', notes || '']
    );

    // 3. Reset the spare part's running hours counter to 0, and update last replacement date
    await dbRun(
      `UPDATE spare_parts SET current_running_hours = 0, last_replacement_date = ? WHERE id = ?`,
      [nowDateOnly, id]
    );

    // 4. Clean up any active notifications for this spare part
    await dbRun('DELETE FROM notifications WHERE spare_part_id = ?', [id]);

    res.json({ success: true, message: 'Spare part successfully replaced' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE RUNNING HOURS ---
app.post('/api/machines/:id/running-hours', async (req, res) => {
  const { id } = req.params;
  const { added_hours, updated_by, source } = req.body;
  const now = new Date().toISOString();

  if (!added_hours || isNaN(added_hours) || added_hours <= 0) {
    return res.status(400).json({ error: 'added_hours must be a positive number' });
  }

  try {
    const machine = await dbGet('SELECT * FROM machines WHERE id = ?', [id]);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    const newTotal = (machine.running_hours_total || 0) + Number(added_hours);
    const newDaily = (machine.running_hours_daily || 0) + Number(added_hours);
    const newWeekly = (machine.running_hours_weekly || 0) + Number(added_hours);
    const newMonthly = (machine.running_hours_monthly || 0) + Number(added_hours);

    // 1. Update the Machine running hours counters
    await dbRun(
      `UPDATE machines SET running_hours_total = ?, running_hours_daily = ?, running_hours_weekly = ?, running_hours_monthly = ?, last_updated = ? WHERE id = ?`,
      [newTotal, newDaily, newWeekly, newMonthly, now, id]
    );

    // 2. Increment active spare parts current running hours
    await dbRun(
      `UPDATE spare_parts SET current_running_hours = current_running_hours + ? WHERE machine_id = ?`,
      [added_hours, id]
    );

    // 3. Log this action in running_hours_log
    await dbRun(
      `INSERT INTO running_hours_log (machine_id, added_hours, new_total, updated_by, timestamp, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, added_hours, newTotal, updated_by || 'Operator', now, source || 'Manual']
    );

    // 4. Trigger logic check for Notifications
    const parts = await dbQuery('SELECT * FROM spare_parts WHERE machine_id = ?', [id]);
    for (const p of parts) {
      const calculated = calculatePartDetails(p, newDaily);
      
      // If status is not NORMAL, generate a notification if it doesn't already exist
      if (calculated.status !== 'NORMAL') {
        const existing = await dbGet(
          'SELECT id FROM notifications WHERE spare_part_id = ? AND type = ? AND read_status = 0',
          [p.id, calculated.status]
        );

        if (!existing) {
          const title = `${calculated.status}: ${p.name}`;
          const message = `Mesin ${machine.name}. ${calculated.status_message} (Kondisi: ${calculated.remaining_life_pct}%)`;
          await dbRun(
            `INSERT INTO notifications (machine_id, spare_part_id, title, message, type, timestamp, read_status)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [id, p.id, title, message, calculated.status, now]
          );
        }
      }
    }

    res.json({ success: true, new_total: newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTOMATED PULL SIMULATION ---
app.post('/api/integration/test-pull', async (req, res) => {
  const { source } = req.body; // 'PredictaCore S7-1200', 'MQTT Broker', 'OPC UA Client', 'Modbus TCP/IP'
  const now = new Date().toISOString();
  
  try {
    const machines = await dbQuery('SELECT id, name FROM machines');
    const logs = [];

    for (const machine of machines) {
      // Generate a mock random hour addition between 1.0 and 8.0 hours
      const added = Number((Math.random() * 7 + 1).toFixed(1));
      
      const currentMachine = await dbGet('SELECT * FROM machines WHERE id = ?', [machine.id]);
      const newTotal = currentMachine.running_hours_total + added;
      
      // 1. Update running hours
      await dbRun(
        `UPDATE machines SET running_hours_total = ?, running_hours_daily = running_hours_daily + ?, running_hours_weekly = running_hours_weekly + ?, running_hours_monthly = running_hours_monthly + ?, last_updated = ? WHERE id = ?`,
        [newTotal, added, added, added, now, machine.id]
      );

      // 2. Update spare parts
      await dbRun(
        `UPDATE spare_parts SET current_running_hours = current_running_hours + ? WHERE machine_id = ?`,
        [added, machine.id]
      );

      // 3. Log historical event
      await dbRun(
        `INSERT INTO running_hours_log (machine_id, added_hours, new_total, updated_by, timestamp, source)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [machine.id, added, newTotal, `${source} Automatic Collector`, now, source]
      );

      logs.push({ machine_name: machine.name, added_hours: added, new_total: newTotal });
    }

    res.json({ success: true, source, logs, timestamp: now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANALYTICS ROUTES ---
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    // 1. Get totals
    const machineCount = await dbGet('SELECT COUNT(*) as count FROM machines');
    const partCount = await dbGet('SELECT COUNT(*) as count FROM spare_parts');
    
    // 2. Fetch all parts to evaluate their status categories
    const parts = await dbQuery(`
      SELECT sp.*, m.running_hours_daily as machine_daily_hours
      FROM spare_parts sp
      JOIN machines m ON sp.machine_id = m.id
    `);
    const calculatedParts = parts.map(p => calculatePartDetails(p, p.machine_daily_hours));

    const overdueCount = calculatedParts.filter(p => p.status === 'OVERDUE').length;
    const warningCount = calculatedParts.filter(p => p.status === 'WARNING LEVEL 1' || p.status === 'WARNING LEVEL 2').length;
    const actionRequiredCount = calculatedParts.filter(p => p.status === 'ACTION REQUIRED').length;

    // 3. Maintenance Cost calculations
    const costData = await dbGet('SELECT SUM(cost) as total_cost FROM replacement_history');
    const totalCost = costData.total_cost || 0;

    // Monthly maintenance costs: Group replacement history by month of replacement_date (YYYY-MM)
    const monthlyCostRows = await dbQuery(`
      SELECT strftime('%Y-%m', replacement_date) as month, SUM(cost) as cost
      FROM replacement_history
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `);

    // Top 10 most replaced parts
    const topReplaced = await dbQuery(`
      SELECT spare_part_name as name, spare_part_code as code, COUNT(*) as replacement_count, SUM(cost) as total_spent
      FROM replacement_history
      GROUP BY spare_part_code
      ORDER BY replacement_count DESC
      LIMIT 10
    `);

    // KPI: Preventive Maintenance Compliance (ratio of PM/schedule completed without crossing overdue thresholds)
    // PM Compliance = (Total PM / (Total PM + Overdue Parts)) * 100
    const totalReplacements = await dbGet('SELECT COUNT(*) as count FROM replacement_history');
    const pmCompliance = totalReplacements.count > 0 
      ? Number(((totalReplacements.count / (totalReplacements.count + overdueCount + actionRequiredCount)) * 100).toFixed(1)) 
      : 100.0;

    res.json({
      total_machines: machineCount.count,
      total_spare_parts: partCount.count,
      overdue_count: overdueCount,
      warning_count: warningCount,
      action_required_count: actionRequiredCount,
      total_maintenance_cost: totalCost,
      pm_compliance_kpi: pmCompliance,
      monthly_costs: monthlyCostRows.reverse(),
      top_replaced_parts: topReplaced,
      remaining_life_distribution: {
        normal: calculatedParts.filter(p => p.status === 'NORMAL').length,
        warning1: calculatedParts.filter(p => p.status === 'WARNING LEVEL 1').length,
        warning2: calculatedParts.filter(p => p.status === 'WARNING LEVEL 2').length,
        action: calculatedParts.filter(p => p.status === 'ACTION REQUIRED').length,
        overdue: calculatedParts.filter(p => p.status === 'OVERDUE').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/trends', async (req, res) => {
  try {
    // Trend of downtime vs. replacements
    const monthlyTrends = await dbQuery(`
      SELECT strftime('%Y-%m', replacement_date) as month, SUM(downtime_minutes) as downtime, SUM(cost) as cost, COUNT(*) as count
      FROM replacement_history
      GROUP BY month
      ORDER BY month ASC
    `);

    // Trend of running hours per machine (latest logs)
    const runningHoursTrends = await dbQuery(`
      SELECT m.name as machine_name, rhl.new_total as hours, rhl.timestamp
      FROM running_hours_log rhl
      JOIN machines m ON rhl.machine_id = m.id
      ORDER BY rhl.timestamp ASC
      LIMIT 50
    `);

    res.json({
      monthly_trends: monthlyTrends,
      running_hours: runningHoursTrends
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICATION ROUTES ---
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await dbQuery(`
      SELECT n.*, m.name as machine_name 
      FROM notifications n
      LEFT JOIN machines m ON n.machine_id = m.id
      ORDER BY timestamp DESC
    `);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('UPDATE notifications SET read_status = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/clear-all', async (req, res) => {
  try {
    await dbRun('DELETE FROM notifications');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPLACEMENT HISTORY ---
app.get('/api/history', async (req, res) => {
  try {
    const history = await dbQuery(`
      SELECT rh.*, m.name as machine_name
      FROM replacement_history rh
      JOIN machines m ON rh.machine_id = m.id
      ORDER BY replacement_date DESC, rh.id DESC
    `);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BACKUP & RESTORE ---
app.get('/api/system/backup', async (req, res) => {
  try {
    const users = await dbQuery('SELECT * FROM users');
    const machines = await dbQuery('SELECT * FROM machines');
    const spare_parts = await dbQuery('SELECT * FROM spare_parts');
    const running_hours_log = await dbQuery('SELECT * FROM running_hours_log');
    const replacement_history = await dbQuery('SELECT * FROM replacement_history');
    const notifications = await dbQuery('SELECT * FROM notifications');

    const backupData = {
      users,
      machines,
      spare_parts,
      running_hours_log,
      replacement_history,
      notifications,
      backup_timestamp: new Date().toISOString()
    };

    res.json(backupData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/restore', async (req, res) => {
  const backup = req.body;
  if (!backup || !backup.machines || !backup.spare_parts) {
    return res.status(400).json({ error: 'Format backup tidak valid' });
  }

  try {
    db.serialize(async () => {
      // Disable foreign keys temporarily
      db.run('PRAGMA foreign_keys = OFF');

      // Clear all tables
      db.run('DELETE FROM users');
      db.run('DELETE FROM machines');
      db.run('DELETE FROM spare_parts');
      db.run('DELETE FROM running_hours_log');
      db.run('DELETE FROM replacement_history');
      db.run('DELETE FROM notifications');

      // Restore Users
      if (backup.users) {
        for (const u of backup.users) {
          db.run('INSERT INTO users (id, username, password, role, full_name) VALUES (?, ?, ?, ?, ?)', [u.id, u.username, u.password, u.role, u.full_name]);
        }
      }

      // Restore Machines
      if (backup.machines) {
        for (const m of backup.machines) {
          db.run(
            `INSERT INTO machines (id, name, asset_number, line_code, manufacturer, install_date, status, running_hours_total, running_hours_daily, running_hours_weekly, running_hours_monthly, last_updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [m.id, m.name, m.asset_number, m.line_code, m.manufacturer, m.install_date, m.status, m.running_hours_total, m.running_hours_daily, m.running_hours_weekly, m.running_hours_monthly, m.last_updated]
          );
        }
      }

      // Restore Spare Parts
      if (backup.spare_parts) {
        for (const sp of backup.spare_parts) {
          db.run(
            `INSERT INTO spare_parts (id, machine_id, name, code, description, vendor, price, lifetime_hours, safety_stock, critical_level, last_replacement_date, current_running_hours)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sp.id, sp.machine_id, sp.name, sp.code, sp.description, sp.vendor, sp.price, sp.lifetime_hours, sp.safety_stock, sp.critical_level, sp.last_replacement_date, sp.current_running_hours]
          );
        }
      }

      // Restore Logs
      if (backup.running_hours_log) {
        for (const l of backup.running_hours_log) {
          db.run('INSERT INTO running_hours_log (id, machine_id, added_hours, new_total, updated_by, timestamp, source) VALUES (?, ?, ?, ?, ?, ?, ?)', [l.id, l.machine_id, l.added_hours, l.new_total, l.updated_by, l.timestamp, l.source]);
        }
      }

      // Restore History
      if (backup.replacement_history) {
        for (const rh of backup.replacement_history) {
          db.run(
            `INSERT INTO replacement_history (id, spare_part_id, machine_id, spare_part_name, spare_part_code, replaced_by, replacement_date, downtime_minutes, cost, photo_url, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [rh.id, rh.spare_part_id, rh.machine_id, rh.spare_part_name, rh.spare_part_code, rh.replaced_by, rh.replacement_date, rh.downtime_minutes, rh.cost, rh.photo_url, rh.notes]
          );
        }
      }

      // Restore Notifications
      if (backup.notifications) {
        for (const n of backup.notifications) {
          db.run('INSERT INTO notifications (id, machine_id, spare_part_id, title, message, type, timestamp, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [n.id, n.machine_id, n.spare_part_id, n.title, n.message, n.type, n.timestamp, n.read_status]);
        }
      }

      db.run('PRAGMA foreign_keys = ON');
    });

    res.json({ success: true, message: 'Restorasi database berhasil dilakukan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Preventive Maintenance API running on port ${PORT}`);
});
