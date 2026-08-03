# 1. Copy correct source
$source = "C:\Users\yohanes.ariyanto\.gemini\antigravity\brain\80537150-c3fb-4e9e-9107-fe6866c1b7e2\media__1784538765586.png"
$target = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\predictacore_logo.png"
Copy-Item -Path $source -Destination $target -Force

# 2. Base64 string
$bytes = [System.IO.File]::ReadAllBytes($target)
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64," + $b64
$jsContent = "window.PREDICTACORE_LOGO = '" + $dataUri + "';"
[System.IO.File]::WriteAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\logo_data.js", $jsContent)

# 3. Read index.html and clean long data URIs back to clean asset URLs with onerror fallback
$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath)

# Replace any src="data:image/png;base64,..." with src="assets/predictacore_logo.png" onerror="..."
$regexData = [regex]'src="data:image/png;base64,[^"]+"'
$htmlClean = $regexData.Replace($html, 'src="assets/predictacore_logo.png" onerror="this.onerror=null; if(window.PREDICTACORE_LOGO) this.src=window.PREDICTACORE_LOGO;"')

[System.IO.File]::WriteAllText($htmlPath, $htmlClean)
Write-Host "CLEANED HTML LOGO URLS WITH FALLBACK SUCCESSFUL!"
