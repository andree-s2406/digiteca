#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DigiTeca - Sincronizador Automático de Libros hacia GitHub Releases
Descarga desde Google Drive, optimiza imágenes en memoria, sube a GitHub Releases
y actualiza la base de datos CockroachDB con enlaces públicos de alta velocidad.
"""

import os
import sys
import re
import json
import time
import argparse
import requests
import pymupdf
from tqdm import tqdm
import gdown

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def load_env_simple(env_path):
    if not os.path.exists(env_path):
        return
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k not in os.environ:
                    os.environ[k] = v

load_env_simple(os.path.join(BASE_DIR, '.env'))

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_OWNER = os.getenv('GITHUB_OWNER', 'andresrodriguez750-max')
GITHUB_REPO = os.getenv('GITHUB_REPO', 'digiteca-libros')
API_URL = "http://localhost:3000/api/libros"

GH_API = "https://api.github.com"
GH_HEADERS = {
    'Authorization': f'Bearer {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github+json'
}

ADMIN_HEADERS = {
    'Content-Type': 'application/json',
    'x-user-email': 'admin@digiteca.edu.ar',
    'x-user-rol': 'admin'
}

RELEASES_CACHE = {}


def get_or_create_release(tag_name="libros-v1", title="Biblioteca DigiTeca - Lote 1"):
    """Obtiene o crea una Release en GitHub y devuelve su upload_url."""
    if tag_name in RELEASES_CACHE:
        return RELEASES_CACHE[tag_name]

    url = f"{GH_API}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases/tags/{tag_name}"
    r = requests.get(url, headers=GH_HEADERS)
    if r.status_code == 200:
        data = r.json()
        upload_url = data['upload_url'].split('{')[0]
        existing_assets = {a['name']: a['browser_download_url'] for a in data.get('assets', [])}
        RELEASES_CACHE[tag_name] = (data['id'], upload_url, existing_assets)
        return RELEASES_CACHE[tag_name]

    create_url = f"{GH_API}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases"
    payload = {
        'tag_name': tag_name,
        'name': title,
        'body': f'Colección pública de libros digitales educativos de DigiTeca ({tag_name})'
    }
    cr = requests.post(create_url, headers=GH_HEADERS, json=payload)
    if cr.status_code in (200, 201):
        data = cr.json()
        upload_url = data['upload_url'].split('{')[0]
        RELEASES_CACHE[tag_name] = (data['id'], upload_url, {})
        return RELEASES_CACHE[tag_name]

    raise Exception(f"No se pudo obtener o crear la release {tag_name}: {cr.status_code} {cr.text}")


def sanitize_filename(title, book_id):
    """Genera un nombre de archivo limpio y seguro para GitHub Releases."""
    clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', title.lower())
    clean = re.sub(r'_+', '_', clean).strip('_')
    return f"libro_{book_id}_{clean[:35]}.pdf"


def download_drive_temp(drive_id, dest_path):
    """Descarga temporalmente un PDF de Google Drive."""
    try:
        url = f"https://drive.google.com/uc?id={drive_id}&export=download"
        s = requests.Session()
        resp = s.get(url, stream=True, timeout=35)
        for k, v in resp.cookies.items():
            if k.startswith('download_warning'):
                resp = s.get(f"{url}&confirm={v}", stream=True, timeout=35)
                break

        content_type = resp.headers.get('Content-Type', '').lower()
        if 'text/html' in content_type and len(resp.content) < 50000:
            try:
                gdown.download(id=drive_id, output=dest_path, quiet=True)
            except Exception:
                pass
        else:
            with open(dest_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=128 * 1024):
                    if chunk:
                        f.write(chunk)
    except Exception:
        try:
            gdown.download(id=drive_id, output=dest_path, quiet=True)
        except Exception:
            pass

    return os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000


def compress_pdf_if_large(pdf_path, max_mb=18):
    """Comprime el PDF si supera max_mb usando descompresión/recompresión de PyMuPDF."""
    size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    if size_mb <= max_mb:
        return pdf_path

    try:
        tmp_compressed = pdf_path + ".comp.pdf"
        doc = pymupdf.open(pdf_path)
        doc.save(tmp_compressed, garbage=4, deflate=True, clean=True)
        doc.close()
        if os.path.exists(tmp_compressed) and os.path.getsize(tmp_compressed) < os.path.getsize(pdf_path):
            os.remove(pdf_path)
            os.rename(tmp_compressed, pdf_path)
    except Exception:
        pass
    return pdf_path


def upload_pdf_to_release(upload_url, filename, filepath):
    """Sube un archivo a la release pública de GitHub."""
    file_size = os.path.getsize(filepath)
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Content-Type': 'application/pdf',
        'Content-Length': str(file_size)
    }
    with open(filepath, 'rb') as f:
        r = requests.post(f"{upload_url}?name={filename}", headers=headers, data=f, timeout=120)
    if r.status_code in (200, 201):
        return r.json().get('browser_download_url')
    return None


def update_book_in_api(book, new_pdf_url):
    """Actualiza la URL del PDF en la base de datos a través de la API local."""
    book_id = book['id']
    payload = {
        't': book['titulo'],
        'a': book['autor'],
        'mat': book['materia'],
        'tipo': book.get('tipo', 'Libro'),
        'anios': book.get('anios', ['Todos']),
        'divisiones': book.get('divisiones', ['Todas']),
        'img': book.get('portada_url') or book.get('img', ''),
        'pdf': new_pdf_url,
        'e': book.get('emoji') or book.get('e', '📚'),
        'c': book.get('categoria_c') or book.get('c', 'Ciclo Superior'),
        'l': book.get('categoria_l') or book.get('l', 'Biblioteca General'),
        'x': book.get('descripcion') or book.get('x', '')
    }
    try:
        r = requests.put(f"{API_URL}/{book_id}", json=payload, headers=ADMIN_HEADERS, timeout=10)
        return r.status_code in (200, 201)
    except Exception:
        return False


def sync_single_book(book, upload_url, existing_assets):
    """Sincroniza un solo libro hacia GitHub Releases y actualiza la BD."""
    book_id = book['id']
    title = book.get('titulo') or book.get('t', '')
    pdf_url = book.get('pdf_url') or book.get('pdf', '')

    if 'github.com' in pdf_url and '/releases/download/' in pdf_url:
        return True, "Ya sincronizado en GitHub"

    drive_match = re.search(r'/d/([a-zA-Z0-9_-]{25,})', pdf_url) or re.search(r'id=([a-zA-Z0-9_-]{25,})', pdf_url)
    if not drive_match:
        return False, "Sin ID de Drive válido"

    drive_id = drive_match.group(1)
    safe_filename = sanitize_filename(title, book_id)

    if safe_filename in existing_assets:
        public_url = existing_assets[safe_filename]
        update_book_in_api(book, public_url)
        return True, f"Vinculado directo: {safe_filename[:25]}"

    temp_dir = os.path.join(BASE_DIR, 'tmp_ingest')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, safe_filename)

    ok = download_drive_temp(drive_id, temp_path)
    if not ok:
        return False, "Protegido o inaccesible en Drive"

    compress_pdf_if_large(temp_path, max_mb=15)
    public_url = upload_pdf_to_release(upload_url, safe_filename, temp_path)

    try:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception:
        pass

    if public_url:
        update_book_in_api(book, public_url)
        existing_assets[safe_filename] = public_url
        return True, f"✅ Subido: {title[:35]}"
    else:
        return False, "Error en subida a GitHub"


def main():
    parser = argparse.ArgumentParser(description="Sincronizador DigiTeca -> GitHub Releases")
    parser.add_argument('--trial', action='store_true', help="Probar lote inicial de 5 libros")
    parser.add_argument('--limit', type=int, default=0, help="Límite máximo de libros a sincronizar")
    parser.add_argument('--materia', type=str, help="Filtrar por materia (ej: --materia Matemática)")
    parser.add_argument('--all', action='store_true', help="Sincronizar todos los libros")
    args = parser.parse_args()

    print("=" * 65)
    print("🚀 DigiTeca - Sincronizador hacia GitHub Releases Públicas")
    print(f"📦 Destino: https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}")
    print("=" * 65)

    if not GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN no encontrado en .env")
        return

    try:
        r = requests.get(API_URL, timeout=10)
        if r.status_code != 200:
            print(f"❌ Error al consultar API de DigiTeca: HTTP {r.status_code}")
            return
        all_books = r.json()
    except Exception as e:
        print(f"❌ No se pudo conectar al servidor DigiTeca: {e}")
        print("💡 Asegurate de que el servidor esté corriendo en http://localhost:3000")
        return

    # Filtrar libros que estén en Drive y aún no en GitHub
    books = [b for b in all_books if 'drive.google.com' in (b.get('pdf') or b.get('pdf_url') or '')]

    if args.materia:
        books = [b for b in books if (b.get('materia') or b.get('mat', '')).lower() == args.materia.lower()]

    total_found = len(books)
    print(f"📚 Libros pendientes en Drive encontrados: {total_found}")

    if total_found == 0:
        print("🎉 ¡Todos los libros ya están en GitHub Releases o no hay libros pendientes!")
        return

    if args.trial:
        books = books[:5]
    elif args.limit > 0:
        books = books[:args.limit]

    print(f"⚙️ Procesando lote de {len(books)} libros...")

    rel_id, upload_url, existing_assets = get_or_create_release("libros-v1", "Biblioteca DigiTeca - Lote 1")

    exitos = 0
    errores = 0

    pbar = tqdm(books, desc="Sincronizando", unit="libro")
    for b in pbar:
        ok, msg = sync_single_book(b, upload_url, existing_assets)
        if ok:
            exitos += 1
            pbar.set_postfix_str(f"✅ {(b.get('titulo') or b.get('t', ''))[:22]}")
        else:
            errores += 1
            pbar.set_postfix_str(f"⚠️ {msg[:22]}")

    print("\n" + "=" * 65)
    print(f"🎉 Sincronización finalizada: {exitos} exitosos | {errores} omitidos/errores")
    print(f"🔗 Ver archivos en GitHub: https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases/tag/libros-v1")
    print("=" * 65)


if __name__ == '__main__':
    main()
