# 1. Read Base64 Data URI from assets/logo_data.js
$jsContent = [System.IO.File]::ReadAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\logo_data.js")
$match = [regex]::Match($jsContent, "window\.PREDICTACORE_LOGO = '([^']+)';")
$dataUri = $match.Groups[1].Value

Write-Host "Data URI extracted, length: $($dataUri.Length)"

# 2. Read index.html
$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath)

# 3. Build prominent sidebar logo block
$sidebarBlock = @"
      <div class="sidebar-logo" style="padding: 16px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
        <img id="brand-sidebar-logo" src="$dataUri" alt="PREDICTACORE" style="width: 100%; max-width: 185px; max-height: 85px; object-fit: contain; filter: drop-shadow(0 0 14px rgba(0, 229, 255, 0.75)); transition: all 0.3s ease;">
      </div>
"@

# Replace sidebar logo section using regex
$sidebarRegex = [regex]'(?s)<div class="sidebar-logo"[^>]*>.*?</div>\s*</div>'
if ($sidebarRegex.IsMatch($html)) {
    $html = $sidebarRegex.Replace($html, $sidebarBlock, 1)
}

# 4. Build prominent dashboard header block
$dashBlock = @"
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; padding:12px 18px; background:linear-gradient(135deg, rgba(0, 229, 255, 0.06), rgba(16, 185, 129, 0.03)); border:1px solid rgba(0, 229, 255, 0.2); border-radius:10px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display:flex; align-items:center; gap:16px;">
            <img id="brand-dashboard-logo" src="$dataUri" alt="PREDICTACORE" style="height:64px; width:auto; max-width:180px; object-fit:contain; filter:drop-shadow(0 0 14px rgba(0,229,255,0.7));">
            <div style="border-left:1px solid rgba(0, 229, 255, 0.25); padding-left:16px;">
              <h2 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:0.5px;">Dashboard Analisis &amp; Telemetri</h2>
              <span style="font-size:11px; color:var(--text-secondary);">Real-time monitoring &amp; kesehatan suku cadang pabrik</span>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="refreshDashboardData()" style="padding:8px 16px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">🔄 Refresh Dashboard</button>
        </div>
"@

$dashRegex = [regex]'(?s)<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">.*?</div>\s*</div>'
if ($dashRegex.IsMatch($html)) {
    $html = $dashRegex.Replace($html, $dashBlock, 1)
}

# 5. Build prominent login modal block
$loginHeaderBlock = @"
      <div style="text-align: center; margin-bottom: 24px;">
        <img id="brand-login-logo" src="$dataUri" alt="PREDICTACORE Emblem Logo" style="height: 100px; width: auto; max-width: 240px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(0, 229, 255, 0.75)); margin: 0 auto 12px auto; display: block;">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: 0.5px;">AUTENTIKASI USER PREDICTACORE</h2>
        <span style="font-size: 12px; color: var(--text-secondary);">Silakan pilih akun &amp; masukkan Password / PIN untuk masuk</span>
      </div>
"@

$loginRegex = [regex]'(?s)<div style="text-align: center; margin-bottom: 24px;">.*?</div>'
if ($loginRegex.IsMatch($html)) {
    $html = $loginRegex.Replace($html, $loginHeaderBlock, 1)
}

# Save updated HTML
[System.IO.File]::WriteAllText($htmlPath, $html)
Write-Host "SUCCESS: Prominent PREDICTACORE Logo layout updated in index.html!"
