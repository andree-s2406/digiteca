#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DigiTeca - Subir Libros Locales de la PC a GitHub Releases (Ultra-Turbo Concurrente)
Sube los PDFs existentes en la carpeta local `libros/` directamente a GitHub Releases,
sincroniza en segundo plano con CockroachDB y elimina los archivos de la PC para liberar espacio.
"""

import os
import sys
import re
import json
import time
import argparse
import threading
import queue
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import pymupdf

try:
    pymupdf.TOOLS.mupdf_display_errors(False)
except Exception:
    pass

from requests.adapters import HTTPAdapter
from tqdm import tqdm

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LIBROS_DIR = os.path.join(BASE_DIR, 'libros')

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

# Sesión HTTP de alta velocidad con pool de conexiones abiertas
http_session = requests.Session()
adapter = HTTPAdapter(pool_connections=50, pool_maxsize=50, max_retries=2)
http_session.mount('https://', adapter)
http_session.mount('http://', adapter)

RELEASES_CACHE = {}
lock = threading.Lock()
update_queue = queue.Queue()
stop_db_worker = threading.Event()


def get_or_create_release(tag_name="libros-v1", title="Biblioteca DigiTeca - Lote 1"):
    with lock:
        if tag_name in RELEASES_CACHE:
            return RELEASES_CACHE[tag_name]

        url = f"{GH_API}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases/tags/{tag_name}"
        r = http_session.get(url, headers=GH_HEADERS)
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
        cr = http_session.post(create_url, headers=GH_HEADERS, json=payload)
        if cr.status_code in (200, 201):
            data = cr.json()
            upload_url = data['upload_url'].split('{')[0]
            RELEASES_CACHE[tag_name] = (data['id'], upload_url, {})
            return RELEASES_CACHE[tag_name]

        raise Exception(f"Error con release {tag_name}: {cr.status_code}")


def sanitize_filename(title, book_id):
    clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', title.lower())
    clean = re.sub(r'_+', '_', clean).strip('_')
    return f"libro_{book_id}_{clean[:35]}.pdf"


def upload_pdf_to_release(upload_url, filename, filepath):
    file_size = os.path.getsize(filepath)
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Content-Type': 'application/pdf',
        'Content-Length': str(file_size)
    }
    try:
        with open(filepath, 'rb') as f:
            r = http_session.post(f"{upload_url}?name={filename}", headers=headers, data=f, timeout=120)
        if r.status_code in (200, 201):
            return r.json().get('browser_download_url')
        elif r.status_code == 422 and 'already_exists' in r.text:
            return f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases/download/libros-v1/{filename}"
    except Exception:
        pass
    return None


def db_worker():
    """Hilo trabajador en segundo plano para no demorar la subida con la base de datos."""
    admin_h = {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@digiteca.edu.ar',
        'x-user-rol': 'admin'
    }
    while not stop_db_worker.is_set() or not update_queue.empty():
        try:
            book, new_pdf_url = update_queue.get(timeout=0.5)
        except queue.Empty:
            continue

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
            http_session.put(f"{API_URL}/{book_id}", json=payload, headers=admin_h, timeout=5)
        except Exception:
            pass
        finally:
            update_queue.task_done()


def process_item(item, upload_url, existing_assets, keep_local):
    filename, filepath, book = item
    title = book.get('titulo') or book.get('t', 'Libro')
    book_id = book['id']
    safe_name = sanitize_filename(title, book_id)

    with lock:
        already_exists = safe_name in existing_assets
        public_url = existing_assets.get(safe_name)

    if already_exists and public_url:
        update_queue.put((book, public_url))
        if not keep_local and os.path.exists(filepath):
            try: os.remove(filepath)
            except Exception: pass
        return True, f"Ya existía: {title[:25]}"

    # Subida directa a máxima velocidad sin esperas de compresión de CPU
    uploaded_url = upload_pdf_to_release(upload_url, safe_name, filepath)
    if uploaded_url:
        update_queue.put((book, uploaded_url))
        with lock:
            existing_assets[safe_name] = uploaded_url
        if not keep_local and os.path.exists(filepath):
            try: os.remove(filepath)
            except Exception: pass
        return True, f"✅ Subido: {title[:28]}"
    else:
        return False, f"❌ Error: {title[:25]}"


def main():
    parser = argparse.ArgumentParser(description="Subir libros locales de la PC a GitHub Releases")
    parser.add_argument('--limit', type=int, default=0, help="Límite de libros a subir")
    parser.add_argument('--threads', type=int, default=10, help="Número de hilos simultáneos (por defecto: 10)")
    parser.add_argument('--keep-local', action='store_true', help="No borrar el archivo local tras subirlo")
    args = parser.parse_args()

    print("=" * 65)
    print("🚀 DigiTeca - Subida Turbo a GitHub Releases")
    print(f"📦 Destino: https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}")
    print(f"⚡ Hilos de subida paralela: {args.threads}")
    print("=" * 65)

    if not os.path.exists(LIBROS_DIR):
        print("❌ La carpeta 'libros/' no existe.")
        return

    local_files = [f for f in os.listdir(LIBROS_DIR) if f.lower().endswith('.pdf')]
    print(f"📂 Archivos PDF encontrados en la PC: {len(local_files)}")

    if not local_files:
        print("🎉 No hay archivos PDF locales para subir.")
        return

    try:
        r = http_session.get(API_URL, timeout=5)
        all_books = r.json()
    except Exception:
        backup_path = os.path.join(BASE_DIR, 'data', 'libros.json')
        if os.path.exists(backup_path):
            with open(backup_path, 'r', encoding='utf-8') as fp:
                all_books = json.load(fp)
        else:
            print("❌ No se pudo conectar al servidor ni leer libros.json.")
            return

    book_by_drive_id = {}
    book_by_num_id = {}
    for b in all_books:
        p = b.get('pdf') or b.get('pdf_url') or ''
        m = re.search(r'([a-zA-Z0-9_-]{25,})', p)
        if m:
            book_by_drive_id[m.group(1)] = b
        book_by_num_id[str(b['id'])] = b

    rel_id, upload_url, existing_assets = get_or_create_release("libros-v1", "Biblioteca DigiTeca - Lote 1")

    items_to_process = []
    for filename in local_files:
        filepath = os.path.join(LIBROS_DIR, filename)
        matched_book = None
        m_drive = re.search(r'libro_([a-zA-Z0-9_-]{25,})\.pdf', filename)
        if m_drive and m_drive.group(1) in book_by_drive_id:
            matched_book = book_by_drive_id[m_drive.group(1)]
        else:
            m_num = re.search(r'libro_(\d+)\.pdf', filename)
            if m_num and m_num.group(1) in book_by_num_id:
                matched_book = book_by_num_id[m_num.group(1)]

        if matched_book:
            items_to_process.append((filename, filepath, matched_book))

    print(f"🔗 Libros emparejados con la base de datos: {len(items_to_process)}")

    if args.limit > 0:
        items_to_process = items_to_process[:args.limit]

    # Iniciar hilo de sincronización BD en segundo plano
    worker_t = threading.Thread(target=db_worker, daemon=True)
    worker_t.start()

    subidos = 0
    errores = 0

    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(process_item, it, upload_url, existing_assets, args.keep_local): it for it in items_to_process}
        with tqdm(total=len(items_to_process), desc="Subiendo a GitHub", unit="libro") as pbar:
            for fut in as_completed(futures):
                try:
                    ok, msg = fut.result()
                    if ok:
                        subidos += 1
                        pbar.set_postfix_str(msg)
                    else:
                        errores += 1
                        pbar.set_postfix_str(msg)
                except Exception as e:
                    errores += 1
                    pbar.set_postfix_str(f"Excepción: {str(e)[:20]}")
                pbar.update(1)

    print("\n⏳ Sincronizando enlaces finales con la base de datos...")
    stop_db_worker.set()
    update_queue.join()

    print("=" * 65)
    print(f"🎉 Proceso finalizado: {subidos} subidos/vinculados | {errores} errores")
    print(f"💾 Espacio liberado en tu PC.")
    print(f"🔗 Podés verlos en: https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases/tag/libros-v1")
    print("=" * 65)


if __name__ == '__main__':
    main()
