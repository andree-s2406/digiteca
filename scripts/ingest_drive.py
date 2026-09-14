#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DigiTeca - Ingesta Ultra-Rápida y Optimizada de Libros desde Google Drive
Descarga concurrente con hilos paralelos, renderizado de carátulas 100% en RAM,
detección inteligente de autor y sincronización directa con base de datos.
"""

import os
import sys
import json
import re
import time
import argparse
import threading
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import pymupdf  # API moderna de PyMuPDF sin warnings
try:
    pymupdf.TOOLS.mupdf_display_errors(False)
except Exception:
    pass
from PIL import Image
from tqdm import tqdm
import gdown

# Configurar salida UTF-8 para consola de Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CATALOG_PATH = os.path.join(r'C:\Users\User\.gemini\antigravity\brain\47a4d0e6-f9f1-441a-bc23-2ce74e7c2059\scratch', 'drive_catalog.json')
PROGRESS_FILE = os.path.join(BASE_DIR, 'data', 'ingest_progress.json')
LIBROS_DIR = os.path.join(BASE_DIR, 'libros')
PORTADAS_DIR = os.path.join(BASE_DIR, 'img', 'portadas')

os.makedirs(LIBROS_DIR, exist_ok=True)
os.makedirs(PORTADAS_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)

# Bloqueos para operaciones concurrentes seguras
progress_lock = threading.Lock()
print_lock = threading.Lock()

# Mapeo de materias limpias y emojis representativos
MATERIAS_MAP = {
    # Expresiones compuestas primero para máxima especificidad
    'educación física': ('Educación Física', '⚽'),
    'educacion fisica': ('Educación Física', '⚽'),
    'deporte': ('Educación Física', '⚽'),
    'voleibol': ('Educación Física', '⚽'),
    'biofísica': ('Biofísica', '🧬'),
    'biofisica': ('Biofísica', '🧬'),
    'ciencias naturales': ('Ciencias Naturales', '🔬'),
    'ciencias sociales': ('Ciencias Sociales', '🏛️'),
    'matemática financiera': ('Matemática Financiera', '🪙'),
    'matematica financiera': ('Matemática Financiera', '🪙'),
    'lengua y literatura': ('Lengua y Literatura', '✍️'),
    'literatura infantil': ('Literatura Infantil / Cuentos', '📚'),
    'literatura y esi': ('Literatura y ESI', '🌱'),
    'literatura en inglés': ('Literatura en Inglés', '🗣️'),
    'literatura en ingles': ('Literatura en Inglés', '🗣️'),
    'administración de recursos humanos': ('Administración de Recursos Humanos', '👥'),
    'administracion de recursos humanos': ('Administración de Recursos Humanos', '👥'),
    'adolescencia y niñez': ('Adolescencia y Niñez', '🌱'),
    'adolescencia y ninez': ('Adolescencia y Niñez', '🌱'),
    'adolescencia': ('Adolescencia y Niñez', '🌱'),
    'agua': ('Ciencias Naturales / Agua', '💧'),
    'anatomía': ('Anatomía y Salud', '🫀'),
    'anatomia': ('Anatomía y Salud', '🫀'),
    'antropología': ('Antropología', '🏺'),
    'antropologia': ('Antropología', '🏺'),
    'arqueología': ('Arqueología', '⛏️'),
    'arqueologia': ('Arqueología', '⛏️'),
    'arte: artes visuales': ('Arte y Teatro', '🎨'),
    'bachillerato internacional': ('Bachillerato Internacional', '🌐'),
    'bibliografías': ('Bibliografías y Referencia', '📑'),
    'bibliografias': ('Bibliografías y Referencia', '📑'),
    'bioquímica': ('Bioquímica', '🧪'),
    'bioquimica': ('Bioquímica', '🧪'),
    'biolog': ('Biología', '🧬'),
    'matem': ('Matemática', '📐'),
    'cálculo': ('Matemática', '📐'),
    'calculo': ('Matemática', '📐'),
    'historia': ('Historia', '📜'),
    'física': ('Física', '⚡'),
    'fisica': ('Física', '⚡'),
    'química': ('Química', '🧪'),
    'quimica': ('Química', '🧪'),
    'filosofía': ('Filosofía', '🏛️'),
    'filosofia': ('Filosofía', '🏛️'),
    'literatura': ('Literatura', '📚'),
    'lengua': ('Lengua y Literatura', '✍️'),
    'geografía': ('Geografía', '🌍'),
    'geografia': ('Geografía', '🌍'),
    'informática': ('Informática', '💻'),
    'informatica': ('Informática', '💻'),
    'economía': ('Economía', '📈'),
    'economia': ('Economía', '📈'),
    'educación': ('Educación', '🎓'),
    'educacion': ('Educación', '🎓'),
    'arte': ('Arte', '🎨'),
    'música': ('Música', '🎵'),
    'musica': ('Música', '🎵'),
    'psicología': ('Psicología', '🧠'),
    'psicologia': ('Psicología', '🧠'),
    'sociología': ('Sociología', '👥'),
    'sociologia': ('Sociología', '👥'),
    'manuales': ('Manuales', '📖'),
    'administración': ('Administración', '📊'),
    'administracion': ('Administración', '📊'),
    'derecho': ('Derecho y Ciudadanía', '⚖️'),
    'turismo': ('Turismo', '✈️'),
    'esi': ('Educación Sexual Integral (ESI)', '🌱'),
    'cuento': ('Literatura Infantil / Cuentos', '📚'),
    'infantil': ('Literatura Infantil / Cuentos', '📚'),
    'tecnolog': ('Tecnología', '⚙️'),
    'robot': ('Robótica', '🤖'),
    'electr': ('Electrónica / Electricidad', '🔌'),
    'mecanic': ('Mecánica', '🔧'),
    'taller': ('Taller Técnico', '🛠️'),
    'ingles': ('Inglés', '🗣️'),
    'inglés': ('Inglés', '🗣️'),
}

# Claves ordenadas por longitud descendente para evitar que 'fisica' capture 'educacion fisica'
SORTED_MATERIA_KEYS = sorted(MATERIAS_MAP.keys(), key=len, reverse=True)

# Sesión HTTP persistente con connection pooling
http_session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=20, max_retries=2)
http_session.mount('https://', adapter)
http_session.mount('http://', adapter)


def normalize_materia(raw_folder, path=''):
    """Normaliza el nombre de la carpeta a materia oficial explorando subcarpetas si es necesario."""
    # Si viene un path con carpetas anidadas (ej: "AA Material a editar.../BIBLIOTECA INFANTIL/CUENTOS INFANTILES/...")
    if path:
        parts = [p.strip() for p in path.split('/') if p.strip()]
        # Examinar subcarpetas (de la más interna a la más externa), ignorando prefijos administrativos
        candidates = []
        for p in reversed(parts[:-1]):  # excluimos el nombre del archivo
            p_low = p.lower()
            if any(term in p_low for term in ['aa material', 'bibliotecario', 'material a editar']):
                continue
            candidates.append(p)

        for cand in candidates:
            c_low = cand.lower()
            for key in SORTED_MATERIA_KEYS:
                if key in c_low:
                    return MATERIAS_MAP[key]

        # Si no hizo match con clave conocida pero hay una subcarpeta limpia
        if candidates:
            clean = candidates[0].replace('_', ' ').replace('-', ' ').strip()
            if len(clean) > 2:
                return clean, '📖'

    folder_low = raw_folder.lower()
    for key in SORTED_MATERIA_KEYS:
        if key in folder_low:
            return MATERIAS_MAP[key]
    clean = raw_folder.replace('_', ' ').replace('-', ' ').strip()
    return clean, '📖'


def parse_filename(fn):
    """Extrae Título, Autor y Editorial eficientemente."""
    s = fn.strip()
    s = re.sub(r'(\.\s*pdf|\.pf)+$', '', s, flags=re.IGNORECASE).strip()

    title = ''
    author = ''
    editorial = ''

    # 1. "Título". Autor - Ed. Editorial
    m1 = re.match(r'^"([^"]+)"\.?\s*(?:-\s*)?([^-\.]+?)(?:\s*-\s*Ed\.?\s*(.+))?$', s, re.IGNORECASE)
    if m1:
        title = m1.group(1).strip()
        author = m1.group(2).strip() if m1.group(2) else ''
        editorial = m1.group(3).strip() if m1.group(3) else ''

    # 2. Título. Autor - Ed. Editorial
    if not title:
        m2 = re.match(r'^([^\.]+)\.\s*([^-]+?)\s*-\s*Ed\.?\s*(.+)$', s, re.IGNORECASE)
        if m2:
            title = m2.group(1).strip()
            author = m2.group(2).strip()
            editorial = m2.group(3).strip()

    # 3. Autor, Nombre. Título
    if not title:
        m3 = re.match(r'^([A-Z\u00C0-\u017F][^,]+,\s*[A-Z\u00C0-\u017F][^\.]+)\.\s*(.+)$', s)
        if m3:
            author = m3.group(1).strip()
            title = m3.group(2).strip()

    # 4. Título - Autor
    if not title and ' - ' in s:
        parts = s.split(' - ')
        if len(parts) == 2:
            title = parts[0].strip()
            author = parts[1].strip()

    if not title:
        title = s.replace('"', '').strip()

    if author and ',' in author and ';' not in author:
        ap_nom = [p.strip() for p in author.split(',')]
        if len(ap_nom) == 2:
            author = f"{ap_nom[1]} {ap_nom[0]}"

    if author.lower().startswith('ed.'):
        editorial = author
        author = ''

    title = title.replace('', '')
    author = author.replace('', '')

    return title, author, editorial


_author_cache = {}

def search_author_online(title):
    """Consulta rápida a la API de Google Books con timeout ultra-corto y caché."""
    if not title or len(title) < 4:
        return ''
    clean_title = title.strip().lower()
    if clean_title in _author_cache:
        return _author_cache[clean_title]

    try:
        query = urllib.parse.quote(f"intitle:{title}")
        url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=1&langRestrict=es"
        resp = http_session.get(url, timeout=1.2)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get('items', [])
            if items:
                authors = items[0].get('volumeInfo', {}).get('authors', [])
                if authors:
                    found = ', '.join(authors[:2])
                    _author_cache[clean_title] = found
                    return found
    except Exception:
        pass
    _author_cache[clean_title] = ''
    return ''


def download_drive_pdf(file_id, dest_path):
    """
    Descarga directa optimizada en streaming con requests.
    Si el archivo ya fue descargado previamente, lo reutiliza al instante (0 segundos).
    """
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 5000:
        return True

    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    try:
        resp = http_session.get(url, stream=True, timeout=20)
        # Revisar si pide token de confirmación de descarga de archivo grande
        for key, value in resp.cookies.items():
            if key.startswith('download_warning'):
                resp = http_session.get(url, params={'id': file_id, 'confirm': value}, stream=True, timeout=25)
                break

        # Verificar que el contenido sea realmente un PDF o binario y no una página HTML de error
        content_type = resp.headers.get('Content-Type', '').lower()
        if 'text/html' in content_type and resp.content.startswith(b'<!DOCTYPE') and len(resp.content) < 50000:
            # Fallback seguro a gdown para archivos con seguridad extra
            try:
                gdown.download(id=file_id, output=dest_path, quiet=True)
            except Exception:
                pass
        else:
            with open(dest_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=128 * 1024):
                    if chunk:
                        f.write(chunk)
    except Exception:
        # Fallback de respaldo garantizado
        try:
            gdown.download(id=file_id, output=dest_path, quiet=True)
        except Exception:
            pass

    return os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000


def extract_cover_in_memory(pdf_path, cover_output_path):
    """
    Extrae la página 1 del PDF directamente en memoria RAM (~75 ms)
    y la comprime en JPEG de alta calidad sin escribir archivos intermedios en disco.
    """
    if os.path.exists(cover_output_path) and os.path.getsize(cover_output_path) > 500:
        return True

    try:
        doc = pymupdf.open(pdf_path)
        if len(doc) == 0:
            return False
        page = doc[0]
        pix = page.get_pixmap(dpi=115)

        # Conversión directa en RAM de pixmap a imagen Pillow
        if pix.alpha:
            im = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples).convert("RGB")
        else:
            im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        doc.close()

        # Redimensionar si supera 620px de altura para carga móvil instantánea
        if im.height > 620:
            new_w = int(im.width * (620.0 / im.height))
            im = im.resize((new_w, 620), Image.Resampling.LANCZOS)

        im.save(cover_output_path, 'JPEG', quality=84, optimize=True)
        return True
    except Exception:
        return False


def register_book_api(book_data):
    """Registra el libro a través del API local con reintentos."""
    url = 'http://localhost:3000/api/libros'
    payload = {
        't': book_data['titulo'],
        'a': book_data['autor'],
        'mat': book_data['materia'],
        'tipo': 'Libro',
        'anios': ['Todos'],
        'divisiones': ['Todas'],
        'img': book_data['portada_url'],
        'pdf': book_data['pdf_url'],
        'e': book_data['emoji'],
        'c': 'Ciclo Superior',
        'l': 'Biblioteca General',
        'x': f"{book_data['titulo']}. Material educativo digital de {book_data['materia']} por {book_data['autor']}."
    }
    headers = {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@digiteca.edu.ar',
        'x-user-rol': 'admin'
    }

    for _ in range(3):
        try:
            resp = http_session.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code in (200, 201):
                return resp.json()
        except Exception:
            time.sleep(0.3)
    return None


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as fp:
                return set(json.load(fp))
        except Exception:
            return set()
    return set()


def save_progress_threadsafe(file_id):
    with progress_lock:
        try:
            current = load_progress()
            current.add(file_id)
            with open(PROGRESS_FILE, 'w', encoding='utf-8') as fp:
                json.dump(list(current), fp, indent=2)
        except Exception:
            pass


def process_single_book(item):
    """Procesa un libro de inicio a fin: descarga, carátula en RAM, autor y BD."""
    file_id = item['id']
    raw_filename = item['filename']
    raw_folder = item.get('folder', 'General')
    path = item.get('path', '')
    materia, emoji = normalize_materia(raw_folder, path)
    title, author, editorial = parse_filename(raw_filename)

    final_pdf_path = os.path.join(LIBROS_DIR, f"libro_{file_id}.pdf")
    final_cover_path = os.path.join(PORTADAS_DIR, f"libro_{file_id}.jpg")

    # 1. Descarga directa optimizada
    ok = download_drive_pdf(file_id, final_pdf_path)
    if not ok:
        save_progress_threadsafe(file_id)
        return False, f"Protegido o inaccesible: {title[:30]}"

    # 2. Descartar archivos de solo 1 página (afiches, carátulas sueltas o folletos)
    try:
        doc_test = pymupdf.open(final_pdf_path)
        page_count = len(doc_test)
        doc_test.close()
    except Exception:
        page_count = 0

    if page_count <= 1:
        try:
            if os.path.exists(final_pdf_path):
                os.remove(final_pdf_path)
        except Exception:
            pass
        save_progress_threadsafe(file_id)
        return False, f"Omitido (solo {page_count} pág): {title[:30]}"

    # 3. Metadatos PDF para autor si está vacío
    if not author or author.lower() in ('desconocido', 'ed.', 'varios'):
        try:
            doc = pymupdf.open(final_pdf_path)
            meta_a = doc.metadata.get('author', '').strip()
            if meta_a and len(meta_a) > 2 and not meta_a.lower().startswith(('pdf', 'micro', 'adobe', 'scan')):
                author = meta_a
            doc.close()
        except Exception:
            pass

    # 3. Búsqueda en línea si aún no hay autor
    if not author or len(author) < 3:
        online_a = search_author_online(title)
        author = online_a if online_a else (editorial if editorial else "Autor Institucional / Educativo")

    # 4. Extracción de carátula en RAM
    has_cover = extract_cover_in_memory(final_pdf_path, final_cover_path)
    portada_url = f"/img/portadas/libro_{file_id}.jpg" if has_cover else "/img/test.jpg"

    # 5. Eliminar PDF local inmediatamente para NO ocupar espacio en la PC ni en GitHub
    try:
        if os.path.exists(final_pdf_path):
            os.remove(final_pdf_path)
    except Exception:
        pass

    # 6. Registro en Base de Datos con enlace directo a Google Drive en la nube
    record = {
        'titulo': title,
        'autor': author,
        'materia': materia,
        'emoji': emoji,
        'portada_url': portada_url,
        'pdf_url': f"https://drive.google.com/file/d/{file_id}/preview"
    }

    res = register_book_api(record)
    if res:
        save_progress_threadsafe(file_id)
        assigned_id = res.get('id', file_id)
        return True, f"#{assigned_id} {title[:38]} ({author[:22]}) [{materia}]"
    else:
        return False, f"Error en BD para {title[:40]}"


def check_server():
    try:
        resp = http_session.get('http://localhost:3000/catalogo.html', timeout=2)
        return resp.status_code == 200
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="Ingesta Ultra-Rápida de Libros para DigiTeca")
    parser.add_argument('--trial', action='store_true', help="Ejecutar lote de prueba")
    parser.add_argument('--balance', type=int, default=0, help="Cargar N libros de cada materia para variedad total")
    parser.add_argument('--folder', type=str, help="Procesar una materia específica (ej: --folder Física)")
    parser.add_argument('--limit', type=int, default=0, help="Límite máximo de libros a procesar")
    parser.add_argument('--all', action='store_true', help="Procesar todos los libros pendientes")
    parser.add_argument('--threads', type=int, default=4, help="Número de descargas simultáneas (por defecto: 4)")
    args = parser.parse_args()

    print("=" * 68)
    print("⚡ DigiTeca - Ingesta Concurrente y Optimizada de Libros")
    print(f"🚀 Concurrencia activada: {args.threads} descargas y carátulas en paralelo")
    print("=" * 68)

    if not check_server():
        print("⚠️ AVISO: El servidor local de DigiTeca no parece estar activo.")
        print("👉 Asegurate de tener 'node server.js' corriendo en otra terminal.")
        print("=" * 68)

    if not os.path.exists(CATALOG_PATH):
        print(f"❌ No se encontró el catálogo en {CATALOG_PATH}")
        return

    with open(CATALOG_PATH, 'r', encoding='utf-8', errors='ignore') as fp:
        catalog_data = json.load(fp)

    files = catalog_data.get('files', [])
    processed_ids = load_progress()
    print(f"✅ Libros ya registrados en DigiTeca: {len(processed_ids)}")

    def is_pdf(fname):
        clean = fname.lower().replace(' ', '')
        return '.pdf' in clean or '.pf' in clean

    pending_by_materia = {}
    files_by_materia = {}
    for f in files:
        if f['id'] not in processed_ids and is_pdf(f.get('filename', '')):
            mat, emoji = normalize_materia(f.get('folder', 'General'), f.get('path', ''))
            pending_by_materia[mat] = (pending_by_materia.get(mat, (0, emoji))[0] + 1, emoji)
            if mat not in files_by_materia:
                files_by_materia[mat] = []
            files_by_materia[mat].append(f)

    targets = []
    if args.trial:
        print("\n🎯 Modo: LOTE DE PRUEBA")
        bio_books = files_by_materia.get('Biología', [])
        mat_books = files_by_materia.get('Matemática', [])
        hist_books = files_by_materia.get('Historia', [])
        targets = bio_books[:4] + mat_books[:3] + hist_books[:3]
    elif args.balance > 0:
        per_mat = args.balance
        targets = []
        for mat_n, f_list in files_by_materia.items():
            targets.extend(f_list[:per_mat])
        print(f"\n🎯 Modo Balanceado ({per_mat} libros por materia): {len(targets)} libros seleccionados.")
    elif args.folder:
        folder_query = args.folder.lower()
        targets = []
        for mat, f_list in files_by_materia.items():
            if folder_query in mat.lower():
                targets.extend(f_list)
    elif args.all:
        targets = [f for f in files if f['id'] not in processed_ids]
    else:
        sorted_materias = sorted(pending_by_materia.items(), key=lambda x: x[1][0], reverse=True)
        print("\n📂 Materias disponibles con libros pendientes en Google Drive:")
        print("-" * 68)
        top_list = []
        for i, (mat_name, (count, emoji)) in enumerate(sorted_materias[:35], 1):
            top_list.append(mat_name)
            print(f"  {i:2}. {emoji} {mat_name} ({count} libros)")
        print("-" * 68)
        print("  B. 🌟 Cargar MUESTRA BALANCEADA (5 libros de cada materia para variedad total)")
        print("  0. 🚀 Cargar TODOS los libros de todas las materias")
        print("-" * 68)

        try:
            opc = input("\n👉 Ingresá el NÚMERO, la letra B, o el NOMBRE de la materia: ").strip()
        except EOFError:
            opc = '0'

        if not opc:
            print("Operación cancelada.")
            return

        if opc.upper() == 'B':
            per_mat = 5
            try:
                bm_in = input("👉 ¿Cuántos libros por materia querés cargar? (Enter para 5): ").strip()
                if bm_in.isdigit() and int(bm_in) > 0:
                    per_mat = int(bm_in)
            except Exception:
                pass
            targets = []
            for mat_n, f_list in files_by_materia.items():
                targets.extend(f_list[:per_mat])
            print(f"Modo Balanceado: {len(targets)} libros seleccionados ({per_mat} por cada una de las {len(files_by_materia)} materias).")
        elif opc == '0' or opc.lower() in ('todas', 'todos'):
            targets = [f for f in files if f['id'] not in processed_ids]
        elif opc.isdigit() and 1 <= int(opc) <= len(top_list):
            selected_mat = top_list[int(opc) - 1]
            targets = files_by_materia.get(selected_mat, [])
            print(f"Seleccionaste: {selected_mat} ({len(targets)} libros)")
        else:
            q = opc.lower()
            targets = []
            for mat, f_list in files_by_materia.items():
                if q in mat.lower():
                    targets.extend(f_list)
            print(f"Búsqueda por texto '{opc}': {len(targets)} libros encontrados.")

        if targets and opc.upper() != 'B':
            try:
                lim_input = input(f"👉 ¿Cuántos libros querés cargar de este grupo? (Presioná Enter para los {len(targets)}): ").strip()
                if lim_input.isdigit() and int(lim_input) > 0:
                    args.limit = int(lim_input)
            except EOFError:
                pass

    targets = [f for f in targets if is_pdf(f.get('filename', ''))]

    if args.limit > 0:
        targets = targets[:args.limit]

    print(f"\n📖 Total a procesar en esta tanda: {len(targets)} libros")
    if not targets:
        print("No hay libros pendientes para procesar.")
        return

    # Ejecución concurrente ultra-rápida
    success_count = 0
    start_time = time.time()

    print("\nIniciando descarga y procesamiento concurrente...")
    with tqdm(total=len(targets), desc="Progreso", unit="libro", dynamic_ncols=True) as pbar:
        with ThreadPoolExecutor(max_workers=args.threads) as executor:
            future_to_item = {executor.submit(process_single_book, item): item for item in targets}
            for future in as_completed(future_to_item):
                try:
                    ok, msg = future.result()
                except Exception as ex:
                    ok, msg = False, f"Protegido en Drive: {str(ex)[:25]}"
                if ok:
                    success_count += 1
                    pbar.set_postfix_str(f"✅ {msg[:35]}")
                else:
                    pbar.set_postfix_str(f"⚠️ {msg[:35]}")
                pbar.update(1)

    elapsed = time.time() - start_time
    rate = success_count / elapsed if elapsed > 0 else 0

    print("\n" + "=" * 68)
    print(f"🎉 ¡Tanda completada en {elapsed:.1f} segundos!")
    print(f"✅ {success_count} libros importados exitosamente ({rate:.2f} libros/segundo).")
    print(f"📚 Visita tu catálogo en: http://localhost:3000/catalogo.html")
    print("=" * 68)


if __name__ == '__main__':
    main()
