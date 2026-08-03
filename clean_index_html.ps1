$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$htmlText = [System.IO.File]::ReadAllText($htmlPath)

# Replace all inline data URIs with clean relative asset path + onerror fallback
$regex = [regex]'src="data:image/jpeg;base64,[^"]+"'
$htmlCleaned = $regex.Replace($htmlText, 'src="assets/predictacore_logo.png" onerror="this.onerror=null; if(window.PREDICTACORE_LOGO) this.src=window.PREDICTACORE_LOGO;"')

[System.IO.File]::WriteAllText($htmlPath, $htmlCleaned)
Write-Host "CLEANED INDEX.HTML SUCCESSFUL! Length: $($htmlCleaned.Length)"
