$path = "d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\predictacore_logo.png"
$bytes = [System.IO.File]::ReadAllBytes($path)
$b64 = [System.Convert]::ToBase64String($bytes)
$js = "window.PREDICTACORE_LOGO = 'data:image/png;base64," + $b64 + "';"
[System.IO.File]::WriteAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\assets\logo_data.js", $js)
Write-Host "Logo Data JS generated successfully!"
