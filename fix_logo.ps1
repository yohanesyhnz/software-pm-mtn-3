# 1. Read the TRUE PREDICTACORE emblem logo file from brain
$correctSource = "C:\Users\yohanes.ariyanto\.gemini\antigravity\brain\80537150-c3fb-4e9e-9107-fe6866c1b7e2\media__1784538765586.png"
$targetAsset = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\predictacore_logo.png"

# Copy the file to assets
Copy-Item -Path $correctSource -Destination $targetAsset -Force

# Read bytes & convert to Base64
$bytes = [System.IO.File]::ReadAllBytes($targetAsset)
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64," + $b64

# Write logo_data.js
$jsContent = "window.PREDICTACORE_LOGO = '" + $dataUri + "';"
[System.IO.File]::WriteAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\logo_data.js", $jsContent)

# Read index.html
$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$htmlText = [System.IO.File]::ReadAllText($htmlPath)

# Replace all old src attributes (whether data URI or relative path) with clean relative path assets/predictacore_logo.png
# and also embed data URI so it works in every possible browser setup!
$regex = [regex]'src="(?:data:image/[^"]+|assets/predictacore_logo\.png)"'
$htmlCleaned = $regex.Replace($htmlText, 'src="' + $dataUri + '"')

[System.IO.File]::WriteAllText($htmlPath, $htmlCleaned)
Write-Host "SUCCESS: PREDICTACORE logo updated with exact base64 data URI (length: $($b64.Length))!"
