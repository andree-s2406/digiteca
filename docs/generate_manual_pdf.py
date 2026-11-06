import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        if self._pageNumber == 1:
            # Marco institucional exterior e interior en la portada
            self.saveState()
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(1)
            self.rect(36, 36, 523, 770)
            self.setStrokeColor(colors.HexColor("#1E3A8A"))
            self.setLineWidth(2.5)
            self.rect(40, 40, 515, 762)
            self.restoreState()
            return

        self.saveState()
        # Encabezado institucional superior
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E3A8A"))
        self.drawString(54, 804, "DIGITECA")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(104, 804, "|  Manual de Usuario  -  Escuela Tecnica Nro 29 D.E. 6 'Reconquista de Buenos Aires'")
        
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 796, 541, 796)

        # Pie de pagina institucional
        self.line(54, 48, 541, 48)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 36, "Secretaria Academica y Coordinacion de Informatica  -  Documento Oficial de Operacion")
        
        page_str = f"Pagina {self._pageNumber} de {total_pages}"
        self.drawRightString(541, 36, page_str)
        self.restoreState()


def build_manual_pdf(output_path, page_map=None):
    if page_map is None:
        page_map = {f"sec_{i}": i for i in range(1, 11)}

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    c_primary = colors.HexColor("#1E3A8A")
    c_secondary = colors.HexColor("#0284C7")
    c_text = colors.HexColor("#1E293B")
    c_muted = colors.HexColor("#64748B")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=c_primary,
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=17,
        textColor=c_secondary,
        alignment=1
    )

    institution_style = ParagraphStyle(
        'CoverInstitution',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=c_text,
        alignment=1
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=18,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14.5,
        textColor=c_secondary,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'FormalBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_text,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'FormalBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=c_text,
        leftIndent=12,
        spaceAfter=2.5
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0C4A6E")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.3,
        leading=11.2,
        textColor=c_text
    )

    def make_callout(text, label="NOTA INSTITUCIONAL"):
        content = [
            Paragraph(f"<b>[{label}]</b> {text}", callout_style)
        ]
        t = Table([[content]], colWidths=[487])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0F9FF")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BAE6FD")),
            ('LINELEFT', (0,0), (-1,-1), 3.5, colors.HexColor("#0284C7")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 9),
            ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ]))
        return t

    story = []

    # =========================================================================
    # PAGINA 1: PORTADA FORMAL
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(Paragraph("GOBIERNO DE LA CIUDAD AUTONOMA DE BUENOS AIRES", institution_style))
    story.append(Paragraph("MINISTERIO DE EDUCACION  -  DIRECCION DE EDUCACION TECNICA", institution_style))
    story.append(Paragraph("<b>ESCUELA TECNICA N° 29 D.E. 6 'RECONQUISTA DE BUENOS AIRES'</b>", institution_style))
    story.append(Spacer(1, 25))

    logo_path = os.path.join(os.path.dirname(__file__), "..", "img", "logo.png")
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=105, height=105))
    else:
        story.append(Spacer(1, 105))

    story.append(Spacer(1, 25))
    story.append(Paragraph("MANUAL DE USUARIO Y GUIA DE OPERACION", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("PLATAFORMA DE BIBLIOTECA DIGITAL INSTITUCIONAL — DIGITECA", subtitle_style))
    story.append(Spacer(1, 16))

    story.append(HRFlowable(width="65%", thickness=1.5, color=c_secondary, spaceAfter=20, spaceBefore=0))

    meta_data = [
        [Paragraph("<b>Documento:</b>", table_cell_style), Paragraph("Manual de Instrucciones del Sistema Web", table_cell_style)],
        [Paragraph("<b>Version:</b>", table_cell_style), Paragraph("1.0 — Edicion Oficial Actualizada", table_cell_style)],
        [Paragraph("<b>Destinatarios:</b>", table_cell_style), Paragraph("Alumnos, Profesores, Preceptores y Administradores", table_cell_style)],
        [Paragraph("<b>Ambito:</b>", table_cell_style), Paragraph("Comunidad Educativa E.T. N° 29 D.E. 6", table_cell_style)],
        [Paragraph("<b>Fecha:</b>", table_cell_style), Paragraph("Ciclo Lectivo Institucional", table_cell_style)],
    ]
    meta_table = Table(meta_data, colWidths=[120, 260])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 30))
    story.append(Paragraph("Este documento oficial establece las normas operativas, procedimientos de consulta y administracion de contenidos dentro de la plataforma digital DigiTeca.", ParagraphStyle('NoteIntro', parent=body_style, fontSize=8.5, textColor=c_muted, alignment=1)))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 2: INDICE GENERAL Y MARCO INSTITUCIONAL
    # =========================================================================
    story.append(Paragraph("INDICE GENERAL", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=10, spaceBefore=2))

    index_data = [
        [Paragraph("<b>Sec.</b>", table_header_style), Paragraph("<b>Titulo del Modulo</b>", table_header_style), Paragraph("<b>Pag.</b>", table_header_style)],
        [Paragraph("1", table_cell_style), Paragraph("Introduccion y Proposito Institucional", table_cell_style), Paragraph(str(page_map.get("sec_1", 3)), table_cell_style)],
        [Paragraph("2", table_cell_style), Paragraph("Requisitos de Acceso y Compatibilidad Tecnica", table_cell_style), Paragraph(str(page_map.get("sec_2", 3)), table_cell_style)],
        [Paragraph("3", table_cell_style), Paragraph("Navegacion y Busqueda en el Catalogo Bibliografico", table_cell_style), Paragraph(str(page_map.get("sec_3", 4)), table_cell_style)],
        [Paragraph("4", table_cell_style), Paragraph("Lector Integrado de Documentos en Linea (Visor PDF)", table_cell_style), Paragraph(str(page_map.get("sec_4", 4)), table_cell_style)],
        [Paragraph("5", table_cell_style), Paragraph("Biblioteca Personal: Mis Lecturas Guardadas", table_cell_style), Paragraph(str(page_map.get("sec_5", 5)), table_cell_style)],
        [Paragraph("6", table_cell_style), Paragraph("Gestion de Perfil y Cuenta de Usuario", table_cell_style), Paragraph(str(page_map.get("sec_6", 5)), table_cell_style)],
        [Paragraph("7", table_cell_style), Paragraph("Autenticacion, Seguridad y Recuperacion de Acceso", table_cell_style), Paragraph(str(page_map.get("sec_7", 5)), table_cell_style)],
        [Paragraph("8", table_cell_style), Paragraph("Guia de Operacion para el Panel de Administracion", table_cell_style), Paragraph(str(page_map.get("sec_8", 6)), table_cell_style)],
        [Paragraph("9", table_cell_style), Paragraph("Accesibilidad, Modos Visuales y Sincronizacion", table_cell_style), Paragraph(str(page_map.get("sec_9", 7)), table_cell_style)],
        [Paragraph("10", table_cell_style), Paragraph("Preguntas Frecuentes y Asistencia al Usuario", table_cell_style), Paragraph(str(page_map.get("sec_10", 7)), table_cell_style)],
    ]
    index_table = Table(index_data, colWidths=[40, 400, 47])
    index_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(index_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Marco Institucional y Normativa de Uso", h2_style))
    story.append(Paragraph(
        "La implementacion de la plataforma DigiTeca responde a la necesidad de fortalecer el acceso equitativo a fuentes de consulta tecnica, cientifica y literaria para toda la comunidad de la Escuela Tecnica N° 29. Su utilizacion esta regida por las pautas de convivencia digital del establecimiento educativo, comprometiendose cada usuario a realizar un uso etico, responsable y estrictamente orientado al estudio y la investigacion academica.",
        body_style
    ))
    story.append(Paragraph(
        "El material incorporado en la plataforma ha sido seleccionado y revisado por el cuerpo docente y los departamentos de materias afines, respetando las normativas de propiedad intelectual y facilitando herramientas digitales de vanguardia.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 3: SECCIONES 1 Y 2
    # =========================================================================
    story.append(Paragraph("1. Introduccion y Proposito Institucional", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "DigiTeca centraliza el repositorio bibliografico institucional de la Escuela Tecnica N° 29 D.E. 6 'Reconquista de Buenos Aires'. Su objetivo prioritario es brindar soporte academico tanto en el ciclo basico como en el ciclo superior tecnico, vinculando textos teoricos con practicas de taller y laboratorio.",
        body_style
    ))

    story.append(Paragraph("1.1. Perfiles de Usuario del Sistema", h2_style))
    roles_data = [
        [Paragraph("<b>Rol</b>", table_header_style), Paragraph("<b>Descripcion y Alcances Operativos</b>", table_header_style)],
        [Paragraph("<b>Alumno</b>", table_cell_style), Paragraph("Consulta general de catalogo, lectura de textos de su ano de cursada, guardado de marcadores personales y envio de consultas institucionales.", table_cell_style)],
        [Paragraph("<b>Profesor</b>", table_cell_style), Paragraph("Acceso integral a textos tecnicos, asignacion de bibliografia curricular a sus divisiones y formulacion de sugerencias de material.", table_cell_style)],
        [Paragraph("<b>Preceptor</b>", table_cell_style), Paragraph("Supervision de la actividad escolar, asistencia a estudiantes en el uso de la plataforma y seguimiento de consultas.", table_cell_style)],
        [Paragraph("<b>Administrador</b>", table_cell_style), Paragraph("Gestion integral del catalogo (alta/baja de obras), control de usuarios institucionales, auditoria de metricas y mantenimiento de ranking.", table_cell_style)],
    ]
    roles_table = Table(roles_data, colWidths=[100, 387])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Requisitos de Acceso y Compatibilidad Tecnica", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "DigiTeca opera como una aplicacion web ligera (Web App) construida con estandares abiertos HTML5, CSS3 y JavaScript ES6+, funcionando de forma nativa sin requerir plugins de terceros.",
        body_style
    ))
    story.append(Paragraph("• <b>Navegadores compatibles:</b> Google Chrome (v100+), Mozilla Firefox (v100+), Microsoft Edge (v100+), Apple Safari (v15+) y navegadores moviles en Android e iOS.", bullet_style))
    story.append(Paragraph("• <b>Dispositivos admitidos:</b> Netbooks institucionales (Plan Sarmiento / Conectar Igualdad), computadoras portatiles, equipos de laboratorio, tablets y smartphones.", bullet_style))
    story.append(Paragraph("• <b>Conectividad:</b> Funciona tanto sobre la red local Wi-Fi escolar como mediante conexiones de banda ancha hogarenas.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(make_callout(
        "La consulta y visualizacion general del catalogo es de acceso libre. El inicio de sesion con credenciales institucionales es necesario para guardar marcadores personales y modificar el perfil.",
        "MODALIDAD DE ACCESO"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 4: SECCIONES 3 Y 4
    # =========================================================================
    story.append(Paragraph("3. Navegacion y Busqueda en el Catalogo Bibliografico", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "A traves de <code>catalogo.html</code> los usuarios exploran el acervo completo. El catalogo cuenta con un motor de busqueda dinamico y selectores especificos para acotar los resultados al instante.",
        body_style
    ))

    story.append(Paragraph("3.1. Criterios de Filtrado", h2_style))
    filtros_data = [
        [Paragraph("<b>Filtro</b>", table_header_style), Paragraph("<b>Valores</b>", table_header_style), Paragraph("<b>Finalidad</b>", table_header_style)],
        [Paragraph("<b>Ano Escolar</b>", table_cell_style), Paragraph("1° a 6° Ano y Otros", table_cell_style), Paragraph("Muestra exclusivamente bibliografia recomendada para el ano lectivo indicado.", table_cell_style)],
        [Paragraph("<b>Materia</b>", table_cell_style), Paragraph("Matematica, Fisica, Informatica, etc.", table_cell_style), Paragraph("Organiza los textos segun el departamento pedagogico correspondiente.", table_cell_style)],
        [Paragraph("<b>Tipo de Obra</b>", table_cell_style), Paragraph("Libro, Apunte, Guia", table_cell_style), Paragraph("Diferencia tratados extensos de guias de laboratorio o apuntes de catedra.", table_cell_style)],
    ]
    filtros_table = Table(filtros_data, colWidths=[90, 160, 237])
    filtros_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(filtros_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("4. Lector Integrado de Documentos en Linea (Visor PDF)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "Al presionar 'Leer en linea', el sistema traslada al usuario al lector embebido (<code>libro.html</code>), especialmente concebido para lecturas comodas y continuas.",
        body_style
    ))
    story.append(Paragraph("• <b>Navegacion:</b> Botones de pagina anterior, pagina siguiente, ingreso manual de pagina y barra de desplazamiento lateral fluida.", bullet_style))
    story.append(Paragraph("• <b>Zoom y Ajuste:</b> Controles de ampliacion, reduccion y ajuste automatico al ancho de ventana para mayor legibilidad en textos tecnicos.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(make_callout(
        "Por normativas de proteccion de derechos de autor, esta terminantemente prohibida la descarga fisica de archivos PDF. El sistema utiliza URLs temporales en memoria volatil (Blob URLs) y el servidor redirige cualquier intento de acceso directo al catalogo.",
        "LECTURA EXCLUSIVA EN LINEA"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 5: SECCIONES 5, 6 Y 7
    # =========================================================================
    story.append(Paragraph("5. Biblioteca Personal: Mis Lecturas Guardadas", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "En la vista <code>descargas.html</code> (denominada funcionalmente 'Lecturas Guardadas') cada usuario registrado gestiona su lista activa de consulta. Para agregar un libro, basta con presionar 'Guardar' en su tarjeta del catalogo. Cuando el usuario concluya la lectura, puede remover el ejemplar con el boton 'Remover de mi cuenta'.",
        body_style
    ))

    story.append(Paragraph("6. Gestion de Perfil y Cuenta de Usuario", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "Desde la vista <code>micuenta.html</code>, el usuario autenticado consulta sus datos institucionales (nombre, apellido, correo electronico y ano de cursada) y puede actualizar su clave de acceso para mayor seguridad.",
        body_style
    ))

    story.append(Paragraph("7. Autenticacion, Seguridad y Recuperacion de Acceso", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "El inicio de sesion se efectua en <code>login.html</code>. El sistema aplica politicas de seguridad para proteger las cuentas:",
        body_style
    ))
    story.append(Paragraph("• <b>Proteccion contra fuerza bruta:</b> Se restringe el numero maximo de intentos fallidos a 15 por minuto por direccion IP (Rate Limiter HTTP 429).", bullet_style))
    story.append(Paragraph("• <b>Recuperacion de clave:</b> Mediante el enlace 'Olvide mi contrasena' o solicitando el restablecimiento al preceptor o administrador escolar.", bullet_style))
    story.append(Paragraph("• <b>Cuentas restringidas:</b> Si una cuenta presenta irregularidades institucionales, pasara a estado 'restringido', requiriendo intervencion de secretaria.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 6: SECCION 8 (PARTE 1) - PANEL DE ADMINISTRACION
    # =========================================================================
    story.append(Paragraph("8. Guia de Operacion para el Panel de Administracion", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "El acceso a <code>admin.html</code> esta reservado para personal con roles de Administrador, Preceptor o Profesor. Centraliza la administracion del repositorio y el seguimiento operativo.",
        body_style
    ))

    admin_mods = [
        [Paragraph("<b>Modulo</b>", table_header_style), Paragraph("<b>Funcionalidades Principales</b>", table_header_style)],
        [Paragraph("<b>Gestion de Libros</b>", table_cell_style), Paragraph("Altas, modificaciones y bajas de libros. Carga de archivos PDF (hasta 50 MB) y portadas (hasta 10 MB) con almacenamiento optimizado en disco.", table_cell_style)],
        [Paragraph("<b>Gestion de Usuarios</b>", table_cell_style), Paragraph("Alta de cuentas escolares, reasignacion de roles (alumno, profesor, preceptor, admin), cambio de estados (activo/restringido) y blanqueo de contrasenas.", table_cell_style)],
        [Paragraph("<b>Ranking Destacado</b>", table_cell_style), Paragraph("Configuracion manual o automatica del Top 8 de obras destacadas en la pantalla de bienvenida.", table_cell_style)],
        [Paragraph("<b>Analitica y Metricas</b>", table_cell_style), Paragraph("Monitoreo de los 5 KPIs oficiales, distribucion de ingresos semanales y consultas por ano escolar.", table_cell_style)],
        [Paragraph("<b>Reportes en Texto</b>", table_cell_style), Paragraph("Generacion y descarga de informes estructurados en texto plano (.txt) para la direccion escolar.", table_cell_style)],
        [Paragraph("<b>Buzon de Mensajes</b>", table_cell_style), Paragraph("Gestion de solicitudes bibliograficas y consultas tecnicas remitidas por la comunidad.", table_cell_style)],
    ]
    admin_table = Table(admin_mods, colWidths=[130, 357])
    admin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(admin_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("8.1. Procedimiento de Carga de Nuevas Obras", h2_style))
    story.append(Paragraph("1. Ingresar a la pestana <b>'Libros'</b> en el panel de administracion.", bullet_style))
    story.append(Paragraph("2. Completar Titulo, Autor, Materia curricular y Tipo de documento.", bullet_style))
    story.append(Paragraph("3. Marcar los anos escolares destinatarios (ej: 4° y 5° ano de electromecanica o computacion).", bullet_style))
    story.append(Paragraph("4. Adjuntar el archivo PDF y la carátula mediante el formulario de subida.", bullet_style))
    story.append(Paragraph("5. Presionar <b>'Guardar libro'</b>. La obra quedara inmediatamente disponible sin recargar el sistema.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGINA 7: SECCIONES 9 Y 10
    # =========================================================================
    story.append(Paragraph("9. Accesibilidad, Modos Visuales y Sincronizacion", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    story.append(Paragraph(
        "DigiTeca incluye herramientas para optimizar la experiencia de lectura en diversos contextos educativos:",
        body_style
    ))
    story.append(Paragraph("• <b>Modo Claro:</b> Paleta con fondos claros y acentos institucionales, disenada para aulas iluminadas o uso diurno.", bullet_style))
    story.append(Paragraph("• <b>Modo Oscuro:</b> Esquema con tonos noche y contraste atenuado, ideal para reducir el cansancio visual en lecturas nocturnas.", bullet_style))
    story.append(Paragraph("• <b>Sincronizacion en tiempo real:</b> Mediante Pusher y BroadcastChannel, las altas de libros o cambios de estado se reflejan en simultaneo en todos los dispositivos conectados.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("10. Preguntas Frecuentes y Asistencia al Usuario", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=c_primary, spaceAfter=6, spaceBefore=2))

    faqs = [
        ("¿Por que no es posible descargar los libros en formato PDF?",
         "Para dar cumplimiento estricto a las normas de derechos de autor y preservacion de material institucional. DigiTeca garantiza acceso permanente y seguro en linea las 24 horas."),
        ("¿Que pasos debo seguir si perdi mi contrasena?",
         "Utilice la opcion 'Olvide mi contrasena' en login.html o solicite a su preceptor escolar la reasignacion de una nueva clave de acceso."),
        ("¿Como solicito la incorporacion de bibliografia tecnica adicional?",
         "A traves del formulario de contacto situado al pie del portal, indicando materia, ano y datos bibliograficos del texto."),
        ("¿Que debo hacer si mi cuenta figura 'restringida'?",
         "Presentese ante la preceptoría o secretaria del establecimiento para regularizar su situacion academica o administrativa.")
    ]

    for q, a in faqs:
        story.append(Paragraph(f"<b>P: {q}</b>", ParagraphStyle('FAQQuestion', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary, spaceBefore=3, spaceAfter=1.5)))
        story.append(Paragraph(f"<b>R:</b> {a}", ParagraphStyle('FAQAnswer', parent=body_style, leftIndent=10, spaceAfter=4.5)))

    story.append(Spacer(1, 6))
    story.append(make_callout(
        "Para asistencia tecnica o consultas institucionales, dirigirse al Departamento de Informatica de la Escuela Tecnica N° 29 D.E. 6 o enviar un mensaje mediante el buzon de contacto del sistema.",
        "SOPORTE Y ASISTENCIA"
    ))

    doc.build(story, canvasmaker=NumberedCanvas)


def get_section_pages(pdf_path):
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    sections = [
        ("sec_1", "1. Introduccion"),
        ("sec_2", "2. Requisitos"),
        ("sec_3", "3. Navegacion"),
        ("sec_4", "4. Lector Integrado"),
        ("sec_5", "5. Biblioteca Personal"),
        ("sec_6", "6. Gestion de Perfil"),
        ("sec_7", "7. Autenticacion"),
        ("sec_8", "8. Guia de Operacion"),
        ("sec_9", "9. Accesibilidad"),
        ("sec_10", "10. Preguntas Frecuentes"),
    ]
    mapping = {}
    for key, text_query in sections:
        for i, page in enumerate(reader.pages):
            content = page.extract_text()
            if text_query.lower() in content.lower():
                mapping[key] = i + 1
                break
    return mapping


if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), "MANUAL_DE_USUARIO.pdf")
    # Pasada 1: compilar preliminar
    build_manual_pdf(target)
    # Detectar paginas reales
    actual_pages = get_section_pages(target)
    # Pasada 2: compilar con indice de paginas 100% exacto
    build_manual_pdf(target, actual_pages)
    print(f"Manual compilado con exito. Mapeo de paginas: {actual_pages}")
