$html = [System.IO.File]::ReadAllText("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\index.html")
$regex = [regex]'src="data:image/png;base64,([^"]+)"'
$m = $regex.Match($html)

if ($m.Success) {
    $b64 = $m.Groups[1].Value
    $bytes = [System.Convert]::FromBase64String($b64)
    [System.IO.File]::WriteAllBytes("d:\DANKOS FILE\GROWW\2026\PROJECTS\SOFTWARE PM MTN 3\extracted_embedded.png", $bytes)
    Write-Host "Extracted embedded PNG file! Length: $($bytes.Length) bytes."
} else {
    Write-Host "No base64 data URI found in index.html!"
}
