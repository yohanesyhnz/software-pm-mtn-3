$targetAsset = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\predictacore_logo.png"

# Read bytes & convert to Base64
$bytes = [System.IO.File]::ReadAllBytes($targetAsset)
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/jpeg;base64," + $b64

# Write logo_data.js
$jsContent = "window.PREDICTACORE_LOGO = '" + $dataUri + "';"
[System.IO.File]::WriteAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\logo_data.js", $jsContent)

# Read index.html
$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$htmlText = [System.IO.File]::ReadAllText($htmlPath)

# Replace all old data URIs in index.html with the new 299KB P-Gear PredictaCore logo Data URI
$regexData = [regex]'src="(?:data:image/[^"]+|assets/predictacore_logo\.png)"'
$htmlUpdated = $regexData.Replace($htmlText, 'src="' + $dataUri + '"')

[System.IO.File]::WriteAllText($htmlPath, $htmlUpdated)
Write-Host "SUCCESS: Brand new P-Gear PREDICTACORE logo updated with exact base64 data URI (length: $($b64.Length))!"
