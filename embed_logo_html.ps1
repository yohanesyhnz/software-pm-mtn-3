$path = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\predictacore_logo.png"
$bytes = [System.IO.File]::ReadAllBytes($path)
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64," + $b64

$htmlPath = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath)

$updatedHtml = $html.Replace('src="assets/predictacore_logo.png"', 'src="' + $dataUri + '"')

[System.IO.File]::WriteAllText($htmlPath, $updatedHtml)
Write-Host "Successfully embedded logo Data URI directly into index.html!"
