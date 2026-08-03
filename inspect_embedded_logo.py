import base64
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'src="(data:image/png;base64,[^"]+)"', html)
if match:
    data_uri = match.group(1)
    b64_str = data_uri.split(',')[1]
    raw_bytes = base64.b64decode(b64_str)
    
    with open('test_embedded.png', 'wb') as f_out:
        f_out.write(raw_bytes)
        
    print(f"Extracted embedded PNG from index.html! Bytes length: {len(raw_bytes)}")
else:
    print("No data URI found in index.html!")
