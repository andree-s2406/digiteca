import requests
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

token = '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'
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json'
}
run_id = '34803334930'
url_run = f'https://api.github.com/repos/andresrodriguez750-max/digiteca-libros/actions/runs/{run_id}'

r = requests.get(url_run, headers=headers)
if r.status_code == 200:
    d = r.json()
    print(f"Run #{d['run_number']} ({d['id']})")
    print(f"Estado: {d['status']} | Conclusión: {d.get('conclusion')}")
    print(f"Iniciado: {d.get('run_started_at')} | Actualizado: {d.get('updated_at')}")

# Consultar releases y cantidad de assets
r_rel = requests.get('https://api.github.com/repos/andresrodriguez750-max/digiteca-libros/releases', headers=headers)
if r_rel.status_code == 200:
    print("\nEstado de volúmenes de GitHub Releases:")
    for rel in r_rel.json():
        print(f" - {rel['tag_name']}: {len(rel.get('assets', []))} archivos subidos")
