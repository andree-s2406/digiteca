import requests
import base64
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

token = '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'
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json'
}
owner = 'andresrodriguez750-max'
repo = 'digiteca-libros'

# 1. Obtener SHA actual de cloud_sync.py en GitHub
url_contents = f'https://api.github.com/repos/{owner}/{repo}/contents/cloud_sync.py'
r = requests.get(url_contents, headers=headers)
sha = r.json().get('sha') if r.status_code == 200 else None

# 2. Subir nueva versión de cloud_sync.py
with open('cloud_sync.py', 'rb') as f:
    content = base64.b64encode(f.read()).decode('utf-8')

payload = {
    'message': 'Optimize cloud_sync.py with direct drive streaming and progress tracking',
    'content': content
}
if sha:
    payload['sha'] = sha

r_put = requests.put(url_contents, headers=headers, json=payload)
print(f'Actualización de cloud_sync.py en GitHub: {r_put.status_code}')
if r_put.status_code not in (200, 201):
    print(r_put.text)
    sys.exit(1)

# 3. Disparar el workflow de GitHub Actions
url_dispatch = f'https://api.github.com/repos/{owner}/{repo}/actions/workflows/cloud_sync.yml/dispatches'
r_disp = requests.post(url_dispatch, headers=headers, json={'ref': 'main'})
print(f'Disparo de GitHub Actions workflow: {r_disp.status_code}')

if r_disp.status_code == 204:
    print('Workflow activado correctamente en la nube (1 Gbps).')
    print('Esperando a que GitHub Actions inicialice el Runner...')
    time.sleep(6)
    
    # 4. Obtener la última ejecución
    url_runs = f'https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=1'
    r_runs = requests.get(url_runs, headers=headers)
    if r_runs.status_code == 200:
        latest = r_runs.json().get('workflow_runs', [])[0]
        print(f"Run #{latest['run_number']} ID: {latest['id']}")
        print(f"Estado: {latest['status']} | Conclusión: {latest['conclusion']}")
        print(f"Enlace en vivo: {latest['html_url']}")
else:
    print('Error disparando workflow:', r_disp.text)
