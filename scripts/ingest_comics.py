#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DigiTeca - Ingesta y Conversión de Cómics (.cbr / .cbz) a PDF
Extrae viñetas ordenadas naturalmente, genera carátula optimizada,
compila a PDF de alta resolución y registra en CockroachDB bajo la materia
'Historietas' estrictamente SIN EMOJIS.
"""

import os
import sys
import json
import re
import time
import shutil
import tempfile
import zipfile
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

import requests
import pymupdf
from PIL import Image
from tqdm import tqdm

try:
    pymupdf.TOOLS.mupdf_display_errors(False)
except Exception:
    pass

# Forzar UTF-8 en consola Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CATALOG_PATH = os.path.join(r'C:\Users\User\.gemini\antigravity\brain\47a4d0e6-f9f1-441a-bc23-2ce74e7c2059\scratch', 'drive_catalog.json')
PROGRESS_FILE = os.path.join(BASE_DIR, 'data', 'ingest_comics_progress.json')
PORTADAS_DIR = os.path.join(BASE_DIR, 'img', 'portadas')
LIBROS_DIR = os.path.join(BASE_DIR, 'libros')

os.makedirs(PORTADAS_DIR, exist_ok=True)
os.makedirs(LIBROS_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)

progress_lock = threading.Lock()
db_lock = threading.Lock()

SEVEN_ZIP_PATH = r'C:\Program Files\7-Zip\7z.exe'
WINRAR_PATH = r'C:\Program Files\WinRAR\unrar.exe'

def get_db_cursor():
    import psycopg2
    from dotenv import dotenv_values
    env = dotenv_values(os.path.join(BASE_DIR, '.env'))
    db_url = env.get('DATABASE_URL')
    if not db_url:
        return None, None
    if 'sslmode=verify-full' in db_url:
        db_url = db_url.replace('sslmode=verify-full', 'sslmode=require')
    elif 'sslmode' not in db_url:
        db_url += '?sslmode=require' if '?' not in db_url else '&sslmode=require'
    conn = psycopg2.connect(db_url)
    return conn, conn.cursor()

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_progress(processed_set):
    with progress_lock:
        try:
            with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
                json.dump(list(processed_set), f)
        except Exception:
            pass

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def clean_comic_metadata(fn):
    raw = re.sub(r'\.\s*cbr$', '', fn.strip(), flags=re.IGNORECASE).strip()
    author = 'Varios Autores'
    title = raw

    # Caso Astérix
    if 'asterix' in raw.lower():
        author = 'René Goscinny y Albert Uderzo'
        m = re.search(r'Asterix[,\s]+(?:Nro?\.?|N°)?\s*(\d+)[\.\s]*["\']?([^"\']+)["\']?', raw, re.IGNORECASE)
        if m:
            num = int(m.group(1))
            sub = m.group(2).strip(' .,"\'')
            title = f'Astérix N° {num:02d}: {sub}'
        else:
            title = raw.replace('"', '').strip()

    # Caso Caloi
    elif 'caloi' in raw.lower():
        author = 'Caloi'
        title = re.sub(r'[\.\-\s]*caloi[\.\-\s]*', '', raw, flags=re.IGNORECASE).strip(' ".,\'-')

    # Caso Editoriales (Novaro, Recreativas)
    elif re.search(r'[-–]\s*Ed\.', raw, re.IGNORECASE):
        parts = re.split(r'[-–]\s*Ed\.\s*', raw, flags=re.IGNORECASE)
        title = parts[0].strip(' ".,\'-')
        author = 'Editorial ' + parts[1].strip(' ".,\'-')

    # Formato "Título". Autor
    elif re.search(r'^["\']([^"\']+)["\'][\.\s]+([^.]+)', raw):
        m = re.search(r'^["\']([^"\']+)["\'][\.\s]+([^.]+)', raw)
        title = m.group(1).strip()
        author = m.group(2).strip(' .,"\'')

    # Limpieza final estricta (SIN EMOJIS)
    title = re.sub(r'[\U00010000-\U0010ffff]', '', title).strip(' ".,\'-')[:240]
    author = re.sub(r'[\U00010000-\U0010ffff]', '', author).strip(' ".,\'-')[:240]
    if not author:
        author = 'Varios Autores'
    return title, author

def extract_images_from_cbr(file_path, temp_dir):
    images = []
    
    # 1. Intentar descompresión ZIP
    try:
        if zipfile.is_zipfile(file_path):
            with zipfile.ZipFile(file_path, 'r') as z:
                for name in z.namelist():
                    if name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')) and not name.startswith('__MACOSX'):
                        z.extract(name, temp_dir)
                        images.append(os.path.join(temp_dir, name))
    except Exception:
        pass

    # 2. Si no es ZIP o falló, usar 7-Zip o WinRAR
    if not images:
        if os.path.exists(SEVEN_ZIP_PATH):
            cmd = [SEVEN_ZIP_PATH, 'x', file_path, f'-o{temp_dir}', '-y']
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif os.path.exists(WINRAR_PATH):
            cmd = [WINRAR_PATH, 'x', '-y', file_path, temp_dir]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        for root, _, files in os.walk(temp_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')) and not f.startswith('.'):
                    images.append(os.path.join(root, f))

    images.sort(key=lambda p: natural_sort_key(os.path.basename(p)))
    return images

def create_pdf_and_cover(image_paths, pdf_dest_path, cover_dest_path):
    if not image_paths:
        return False

    # 1. Extraer y guardar carátula (primera página en alta resolución)
    try:
        first_img = Image.open(image_paths[0]).convert('RGB')
        first_img.thumbnail((720, 920), Image.Resampling.LANCZOS)
        first_img.save(cover_dest_path, 'JPEG', quality=85, optimize=True)
    except Exception as e:
        print(f"Error portada: {e}")
        return False

    # 2. Compilar páginas en un PDF ordenado
    doc = pymupdf.open()
    for img_p in image_paths:
        try:
            with open(img_p, 'rb') as f:
                img_data = f.read()
            img_doc = pymupdf.open(stream=img_data, filetype='image')
            rect = img_doc[0].rect
            pdf_bytes = img_doc.convert_to_pdf()
            img_pdf = pymupdf.open('pdf', pdf_bytes)
            page = doc.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(rect, img_pdf, 0)
        except Exception:
            continue

    if doc.page_count == 0:
        return False

    doc.save(pdf_dest_path, garbage=3, deflate=True)
    doc.close()
    return True

def process_comic(item, processed_ids):
    file_id = item['id']
    if file_id in processed_ids:
        return True, "Ya procesado"

    filename = item.get('filename', '')
    title, author = clean_comic_metadata(filename)

    clean_slug = re.sub(r'[^a-zA-Z0-9]', '_', title.lower())[:30].strip('_')
    comic_id = f"comic_{clean_slug}_{file_id[:8]}"
    
    pdf_filename = f"libro_{comic_id}.pdf"
    cover_filename = f"libro_{comic_id}.jpg"
    
    pdf_dest = os.path.join(LIBROS_DIR, pdf_filename)
    cover_dest = os.path.join(PORTADAS_DIR, cover_filename)

    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    temp_workdir = tempfile.mkdtemp(prefix="digi_cbr_")
    cbr_temp_file = os.path.join(temp_workdir, "comic.cbr")
    extract_temp_dir = os.path.join(temp_workdir, "extracted")
    os.makedirs(extract_temp_dir, exist_ok=True)

    try:
        r = requests.get(url, timeout=60, stream=True)
        if r.status_code != 200:
            shutil.rmtree(temp_workdir, ignore_errors=True)
            return False, f"HTTP {r.status_code}"

        with open(cbr_temp_file, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024*1024):
                if chunk:
                    f.write(chunk)

        images = extract_images_from_cbr(cbr_temp_file, extract_temp_dir)
        if not images:
            shutil.rmtree(temp_workdir, ignore_errors=True)
            return False, "Sin imágenes extraíbles"

        ok = create_pdf_and_cover(images, pdf_dest, cover_dest)
        if not ok:
            shutil.rmtree(temp_workdir, ignore_errors=True)
            return False, "Fallo compilando PDF"

        # Inserción a través de API local DigiTeca (ESTRICTAMENTE SIN EMOJIS)
        payload = {
            't': title,
            'a': author,
            'mat': 'Historietas',        # Materia formal limpia
            'tipo': 'Historieta',        # Tipo
            'anios': [],                 # Para todos los cursos
            'divisiones': [],
            'img': f"/img/portadas/{cover_filename}",
            'pdf': f"/libros/{pdf_filename}",
            'e': "",                     # EMOJI VACÍO (SIN EMOJIS)
            'c': 'historietas',
            'l': 'Historietas',
            'x': f"Edición gráfica digital de {title}. Colección escolar de historietas y narrativa visual."
        }
        headers = {
            'Content-Type': 'application/json',
            'x-user-email': 'admin@digiteca.edu.ar',
            'x-user-rol': 'admin'
        }
        api_ok = False
        for _ in range(3):
            try:
                resp = requests.post('http://localhost:3000/api/libros', json=payload, headers=headers, timeout=15)
                if resp.status_code in (200, 201):
                    api_ok = True
                    break
            except Exception:
                time.sleep(0.3)

        if not api_ok:
            shutil.rmtree(temp_workdir, ignore_errors=True)
            return False, "Error en API BD"

        processed_ids.add(file_id)
        save_progress(processed_ids)
        shutil.rmtree(temp_workdir, ignore_errors=True)
        return True, title

    except Exception as e:
        shutil.rmtree(temp_workdir, ignore_errors=True)
        return False, str(e)[:30]

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0, help='Límite de cómics a procesar')
    args = parser.parse_args()

    print("=" * 68)
    print("🚀 DigiTeca - Conversión y Carga de Cómics (.cbr) a PDF")
    print("📌 Regla: Materia 'Historietas' estrictamente SIN EMOJIS")
    print("=" * 68)

    if not os.path.exists(CATALOG_PATH):
        print(f"❌ No se encontró {CATALOG_PATH}")
        return

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        cat = json.load(f)

    files = cat.get('files', [])
    cbr_items = [f for f in files if 'cbr' in f.get('filename', '').lower()]
    processed_ids = load_progress()

    pending = [f for f in cbr_items if f['id'] not in processed_ids]
    if args.limit > 0:
        pending = pending[:args.limit]

    print(f"📦 Total cómics en catálogo: {len(cbr_items)}")
    print(f"✅ Ya procesados: {len(cbr_items) - len(pending)}")
    print(f"⏳ A convertir en esta tanda: {len(pending)}")

    if not pending:
        print("🎉 ¡Todos los cómics ya están convertidos e ingresados!")
        return

    # Usar 4 hilos concurrentes para descarga y compilación paralela
    success = 0
    with tqdm(total=len(pending), desc="Convirtiendo", unit="cómic") as pbar:
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_item = {executor.submit(process_comic, item, processed_ids): item for item in pending}
            for future in as_completed(future_to_item):
                try:
                    ok, msg = future.result()
                except Exception as ex:
                    ok, msg = False, str(ex)[:25]
                if ok:
                    success += 1
                    pbar.set_postfix_str(f"OK: {msg[:25]}")
                else:
                    pbar.set_postfix_str(f"ERR: {msg[:25]}")
                pbar.update(1)

    print("\n" + "=" * 68)
    print(f"🎉 ¡Tanda completada! {success} cómics convertidos a PDF.")
    print("📚 Disponibles en el catálogo bajo la materia 'Historietas' (sin emojis).")
    print("=" * 68)

if __name__ == '__main__':
    main()