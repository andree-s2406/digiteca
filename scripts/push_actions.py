import requests
import base64

token = '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'
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json'
}

# 1. Subir cloud_sync.py
with open('cloud_sync.py', 'rb') as f:
    content = base64.b64encode(f.read()).decode('utf-8')
payload = {'message': 'Add cloud_sync.py', 'content': content}
r = requests.put('https://api.github.com/repos/andresrodriguez750-max/digiteca-libros/contents/cloud_sync.py', headers=headers, json=payload)
print('cloud_sync.py push:', r.status_code)

# 2. Subir .github/workflows/cloud_sync.yml
workflow_yaml = """name: DigiTeca Cloud Sync (1 Gbps)

on:
  workflow_dispatch:

jobs:
  cloud_sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install requests psycopg2-binary gdown

      - name: Run High-Speed Cloud Sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RELEASE_TOKEN: ${{ secrets.RELEASE_TOKEN }}
        run: |
          python cloud_sync.py
"""
wf_b64 = base64.b64encode(workflow_yaml.encode('utf-8')).decode('utf-8')
wf_payload = {'message': 'Add cloud_sync workflow', 'content': wf_b64}
r2 = requests.put('https://api.github.com/repos/andresrodriguez750-max/digiteca-libros/contents/.github/workflows/cloud_sync.yml', headers=headers, json=wf_payload)
print('workflow push:', r2.status_code)
