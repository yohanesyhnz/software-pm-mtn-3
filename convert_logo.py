import base64

with open('assets/predictacore_logo.png', 'rb') as f:
    data = f.read()

b64 = base64.b64encode(data).decode('utf-8')
data_uri = f"data:image/png;base64,{b64}"

js_content = f"window.PREDICTACORE_LOGO = '{data_uri}';\n"

with open('assets/logo_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully generated assets/logo_data.js! Length: {len(js_content)} chars")
