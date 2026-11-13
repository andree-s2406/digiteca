# Reporte Diagnóstico de Libros: Registros `"Z` y Títulos Duplicados

> **Modo solo lectura:** Este reporte es estrictamente diagnóstico. No se modificó ni eliminó ningún registro en `data/libros.json` ni en CockroachDB.

## Resumen

- **Total de registros en `data/libros.json`:** 4347
- **Registros cuyo título comienza con `"Z`:** 38
- **Grupos de títulos normalizados repetidos (2+ ocurrencias):** 74
- **Grupos duplicados que además comparten exactamente el mismo enlace `pdf`:** 1

---

## 1. Registros con título iniciado en `"Z` (38 registros)

| # | ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---:|---|---|---|---|
| 1 | 1210064064267157505 | "Zoom: Gran angular - 303" - Ed. Epublibre | Andrea Ferrari | Literatura | drive.google.com (1hDwiINZUxEMffQUHktsawdsCaBecFp61/preview) |
| 2 | 1210064168146796545 | "Z. Zona Cómic: Entrevistamos a Susanna Martín; José Luis Munuera; Carlos Pacheco; Cameron Stewart: Y también hablamos de muchos cómics más...". Vol.1 _12_. | Ed. Laukatu | Literatura | drive.google.com (1cXLE244leR91uI2tC1YIF1fzxTGPjQnw/preview) |
| 3 | 1210064173351567361 | "Z. Zona Cómic: Angel Unzueta; Enrique Sánchez Abulí, Jordi Bernet". Vol.2 _6_. | Ed. Laukatu | Literatura | drive.google.com (1_5yrjXt6cvKrtZ8BazJpX00NovvEN5e3/preview) |
| 4 | 1210064177380229121 | "Z. Zona Cómic: Daniel Acuña; Pablo Ríos; Santiago García; Francis Portela". Vol.2 _3_. | Ed. Laukatu | Literatura | drive.google.com (1bBvilUiaReo8nPSi4e_uXnTfobxHC6fE/preview) |
| 5 | 1210064183042637825 | "Z. Zona Cómic: Especial Entrevistas: Milo Manara y otros". Vol.3 _5. | Ed. Laukatu | Literatura | drive.google.com (1y20CYTiRVLZtgnIuOc8aiqNRPHkyGuol/preview) |
| 6 | 1210064185252052993 | "Z. Zona Cómic". Vol.2 _12. | Ed. Laukatu | Literatura | drive.google.com (1MVJVEPXOn3q9tcz21IKXFmt8oPwllTDZ/preview) |
| 7 | 1210064189139353601 | "Z. Zona Cómic: Daniel Torres. Max. Álvaro Ortiz. Mahmud Asrar". Vol.3 _9. | Ed. Laukatu | Literatura | drive.google.com (18vPCaczagwZzDh4Ih7a3qwj5AnJoj1Do/preview) |
| 8 | 1210064192985333761 | "Z. Zona Cómic: Especial Noir: Víctor Santos; José Muñoz". Vol.2 _4_. | Ed. Laukatu | Literatura | drive.google.com (1dH0JomfGysF5V1BvbsqHQgI27NmzqcIg/preview) |
| 9 | 1210064197401608193 | "Z. Zona Cómic: David López. Miguel Gallardo". Vol.2 _11. | Ed. Laukatu | Literatura | drive.google.com (1dt91f2fDr_8AQrJJciwNhsg1DvCYYQ3E/preview) |
| 10 | 1210064198004375553 | "Z. Zona Cómic: Hablamos con Ana Miralles y Raquel Alzate". Vol.1 _6. | Ed. Laukatu | Literatura | drive.google.com (1axZ4aG2diaG2BkjgdhZO9M2AKWdQ5KF8/preview) |
| 11 | 1210064203000676353 | "Z. Zona Cómic: Frederik Peeters. Kaz. José Luis García-López". Vol.3 _2 | Ed. Laukatu | Literatura | drive.google.com (1L_bEAewLxad4rip2lMDagWiejkEy9wIp/preview) |
| 12 | 1210064203038916609 | "Z. Zona Cómic: Especial Entrevistas". Vol.2 _9. | Ed. Laukatu | Literatura | drive.google.com (19YBE2oHcgPDlRWg4l3PHjtOe0Hy3QmvK/preview) |
| 13 | 1210064206505410561 | "Z. Zona Cómic: Especial Ciencia Ficción". Vol.3 _4. | Ed. Laukatu | Literatura | drive.google.com (1KkoTTxlNtEIx7buACtnDQccOZ7r7AGuT/preview) |
| 14 | 1210064219709898753 | "Z. Zona Cómic: Hablamos con Javier Rodríguez; Juan Díaz Canales; Fernando Blanco; Raúl Arnáiz: Y también hablamos de muchos cómics más...". Vol.1 _11_. | Ed. Laukatu | Literatura | drive.google.com (1bQb_2fqcdn3osYB9_pzBm4UgvibdL2sv/preview) |
| 15 | 1210064221308977153 | "Z. Zona Cómic: Hablamos con Alfonso Zapico". Vol.1 _8_. | Ed. Laukatu | Literatura | drive.google.com (1uKWg0d4eNgVlGxRgz3H7RkRU2-o18hte/preview) |
| 16 | 1210064228924751873 | "Z. Zona Cómic: Hablamos con Salvador Larroca". Vol.1 _10_. | Ed. Laukatu | Literatura | drive.google.com (1BpZCiG7v-4Fb_SfbZu44BFmaRMafeYYi/preview) |
| 17 | 1210064230488735745 | "Z. Zona Cómic: Hablamos con Mikel Janín". Vol.1 _7_. | Ed. Laukatu | Literatura | drive.google.com (1oUG4wjnId_q25J8_40LSYP8qi6U00m-8/preview) |
| 18 | 1210064230490537985 | "Z. Zona Cómic: Hablamos con Emma Ríos". Vol.1 _0_. | Ed. Laukatu | Literatura | drive.google.com (1GhS8NHIX0bChY0fRl0TUDFyipfpRQzaH/preview) |
| 19 | 1210064235711594497 | "Z. Zona Cómic: Hablamos con Paco Roca". Vol.1 _9_. | Ed. Laukatu | Literatura | drive.google.com (1CSK47Kmpdf4VvLUpNvnTN_Kg9H8_xZMm/preview) |
| 20 | 1210064240439885825 | "Z. Zona Cómic: Hablamos con Juan Giménez". Vol.1 _3_. | Ed. Laukatu | Literatura | drive.google.com (1RRezSfls0Uc7JAgs7K9QLC0W-OHBcNBg/preview) |
| 21 | 1210064240720314369 | "Z. Zona Cómic: Hablamos con Richard Corben y Bryan Talbot". Vol.1 _4_. | Ed. Laukatu | Literatura | drive.google.com (1WepjRspF3mj3x9KHrueDu5hFXHJuctct/preview) |
| 22 | 1210064248072929281 | "Z. Zona Cómic: Javier De Isusi; Joe Sacco; Enrique V. Vegas". Vol.2 _2_. | Ed. Laukatu | Literatura | drive.google.com (1LK9K2vT_GFCiQ9F8GDxHSv7yOQwpetDh/preview) |
| 23 | 1210064248124637185 | "Z. Zona Cómic: Hablamos con David Rubín". Vol.1 _2_. | Ed. Laukatu | Literatura | drive.google.com (1e0FwqnKlf4LLh6LSpxGK-hnWMy3RaXpR/preview) |
| 24 | 1210064251606958081 | "Z. Zona Cómic: Jaime Calderón; Tyto Alba". Vol.2 _7_. | Ed. Laukatu | Literatura | drive.google.com (19KYrYejJSLek9FvcTloU-Vkiw11xfsFw/preview) |
| 25 | 1210064251965833217 | "Z. Zona Cómic: Humberto Ramos. Sento. Jesús Saiz". Vol.4 _5. | Ed. Laukatu | Literatura | drive.google.com (1vlmePlYj1HvcBi7rGcwpgLOiaIWNTgTR/preview) |
| 26 | 1210064254162763777 | "Z. Zona Cómic: Manuel García. Juan Berrio". Vol.2 _8. | Ed. Laukatu | Literatura | drive.google.com (1AeGaHevTZ6OYxFy9EF4r_uM-39QNLkFn/preview) |
| 27 | 1210064257457324033 | "Z. Zona Cómic: Hablamos con David Aja". Vol.1 _1_. | Ed. Laukatu | Literatura | drive.google.com (1KywvkO6LKQeZfG3LKgAjMr0IUPa15OBI/preview) |
| 28 | 1210064266902405121 | "Z. Zona Cómic: Ken Niimura; Javier Pulido; Juaco Vizuete". Vol.2 _5_. | Ed. Laukatu | Literatura | drive.google.com (1J14GV40cR2mF-_wpYoTVv579Knwwtss1/preview) |
| 29 | 1210064270618984449 | "Z. Zona Cómic: Raule. Gabor. Agustìn Comotto". Vol.4 _11. | Ed. Laukatu | Literatura | drive.google.com (1hQfHJXozALYiRlptjEppiW6IxlJ7prcr/preview) |
| 30 | 1210064272733175809 | "Z. Zona Cómic: Jeff Lemire & Dustin Nguyen. Mauro Entrialgo". Vol.3 _12. | Ed. Laukatu | Literatura | drive.google.com (1IfWWI09XKp7RilqpWEZgcNag6Y0StYPz/preview) |
| 31 | 1210064280521867265 | "Z. Zona Cómic: Paco Roca. Paul Pope & David Rubín. Julián M. Clemente". Vol.3 _8. | Ed. Laukatu | Literatura | drive.google.com (1xh-FKPMbDe31cYBTLewJK7nWIUGbOgko/preview) |
| 32 | 1210064283959132161 | "Z. Zona Cómic: Rubén Pellejero; Rafa Sandoval; Jaime Martín". Vol.2 _1_. | Ed. Laukatu | Literatura | drive.google.com (14gCzh4b6RjE-eKTftyLWYmJYcthvRzk6/preview) |
| 33 | 1210064288231817217 | "Z. Zona Cómic: Zidrou. Mai Egurza. Oriol". Vol.3 _1. | Ed. Laukatu | Literatura | drive.google.com (1NSttrzMKloUKvPo8FMm9X32zKTJqJ2vu/preview) |
| 34 | 1210064288248365057 | "Z. Zona Cómic: Rayco Pulido. Marcos Prior. Mary M. Talbot y Bryan Talbot". Vol.4 _7. | Ed. Laukatu | Literatura | drive.google.com (1bouBvV122YRbQUF8lforpZE0wwqyOAha/preview) |
| 35 | 1210064298622222337 | "Z. Zona Cómic: Matteo Scalera. José Domingo". Vol.3 _7. | Ed. Laukatu | Literatura | drive.google.com (1fiDgE9mvooRtuO-9tObhoGRCEOzGyofw/preview) |
| 36 | 1210064299718311937 | "Z. Zona Cómic: Natacha Bustos & Javier Rodríguez. Carlos Portela & Fernando Iglesias. Darko Macan". Vol.4 _6. | Ed. Laukatu | Literatura | drive.google.com (1dZDa6QUYP0eeeEbMUHp5RdArvChHiSmx/preview) |
| 37 | 1210064309668773889 | "Z. Zona Cómic: Pepe Larraz. José Robledo & Marcial Toledano". Vol.3 _10. | Ed. Laukatu | Literatura | drive.google.com (1Y3FlkBUOWs59beNH1ccl0s1GEt641SDW/preview) |
| 38 | 1210064315126022145 | "Z. Zona Cómic: Álvaro Martínez. Russell Dauterman. Iñaki G. Holgado". Vol.4 _10. | Ed. Laukatu | Literatura | drive.google.com (1VeUH-d-EdwMvG_m72aho60O7ZN-r2MNk/preview) |

---

## 2. Títulos duplicados (74 grupos)

Para cada grupo se muestran todas sus ocurrencias para distinguir entre **ediciones/tomos/materias distintas** y **duplicados accidentales (mismo autor y mismo PDF)**.

### 1. Ciencias naturales 1 (4 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065524290387969 | Ciencias naturales 1 | Tinta Fresca Nuevas Miradas | Ciencias Naturales | drive.google.com (1iBlarajjojw7_JfqISv-AILDwmoRwZpM/preview) |
| 1210065527779131393 | Ciencias Naturales 1 | SM. Conecta 2.0 | Ciencias Naturales | drive.google.com (1LsaRmyVAHcLW6R-Tm_CSc6dlfcfFOb-S/preview) |
| 1210065568846217217 | Ciencias naturales 1 | PyA | Ciencias Naturales | drive.google.com (1iK-oUckGXXHS7sZEGdeTlpL8uiySvm4i/preview) |
| 1210065572032839681 | Ciencias Naturales 1 | Mandioca Llaves | Ciencias Naturales | drive.google.com (12_Wvt65SueMzbhcapYcb686aPEv7UNB6/preview) |

### 2. Ciencias Sociales 1 (4 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065629637246977 | Ciencias Sociales 1 | Edelvives Convergente | Ciencias Sociales | drive.google.com (1FrXRNzlKlyWy_k7xuYr5V65aFhCYlZLS/preview) |
| 1210065630549835777 | Ciencias Sociales 1 | Santillana En Línea | Ciencias Sociales | drive.google.com (1HCL3seeYqwbHY85qhgCvEBo7O5m7t937/preview) |
| 1210065645747404801 | Ciencias Sociales 1 | Santillana Conocer + | Ciencias Sociales | drive.google.com (1Fjuek1wrCE43pHd5tmnmDO5woiBeF4tV/preview) |
| 1210065654863659009 | Ciencias Sociales 1 | Santillana saberes clave | Ciencias Sociales | drive.google.com (19XvkyIphUoadBNiX22TVlhxMkoAg7CQe/preview) |

### 3. El Eternauta (4 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064370356846593 | El Eternauta | H Oesterheld y Solano López Parte 1. H. Oesterheld | Literatura | drive.google.com (1yGw1RWT1xtwr4kZzdY1aAORkT2znsj5F/preview) |
| 1210064372701495297 | El Eternauta | H Oesterheld y Solano López Parte 2. H. Oesterheld | Literatura | drive.google.com (1ApEzEfqLzrCyrReOGbkZsulyoEM5fBaq/preview) |
| 1210064425151070209 | El Eternauta | H Oesterheld | Literatura | drive.google.com (1y8j6Gph65cYHl8GAztdyj3awW4mzFuN-/preview) |
| 1210076057552945153 | El Eternauta | Trillo; Saborido | Historietas | /libros/libro_comic_el_eternauta_1-OugaXe.pdf |

### 4. Emociones (4 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 222 | Emociones | aburrimiento | Literatura Infantil / Cuentos | github.com (libros-v1/libro_222_emociones.pdf) |
| 223 | Emociones | alegría | Literatura Infantil / Cuentos | github.com (libros-v2/libro_223_emociones.pdf) |
| 224 | Emociones | amor | Literatura Infantil / Cuentos | github.com (libros-v1/libro_224_emociones.pdf) |
| 225 | Emociones | miedo | Literatura Infantil / Cuentos | github.com (libros-v2/libro_225_emociones.pdf) |

### 5. Homero (4 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064757937799169 | Homero | "Odisea". Versión de Franco Vaccarini | Literatura | drive.google.com (1GHcLHj2pk1namsP9ToQnQwIy1z9rMjCp/preview) |
| 1210065170043076609 | Homero | "La Odisea" | Literatura | github.com (libros-v3/libro_1210065170043076609_homero.pdf) |
| 1210065181913022465 | Homero | "La Ilíada" | Literatura | github.com (libros-v3/libro_1210065181913022465_homero.pdf) |
| 1210065184951959553 | Homero | "La Odisea". Versión de Franco Vaccarini | Literatura | drive.google.com (1mrx6BYqKd_y0HEcCsXloa8hKxBRDmhFw/preview) |

### 6. "Administración de recursos humanos" (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034468770086913 | "Administración de recursos humanos" | R. Wayne Mondy | Administración de Recursos Humanos | github.com (libros-v1/libro_1210034468770086913_administraci_n_de_recursos_humanos.pdf) |
| 1210034469612748801 | "Administración de recursos humanos" | G. Bohlander y S. Snell | Administración de Recursos Humanos | github.com (libros-v1/libro_1210034469612748801_administraci_n_de_recursos_humanos.pdf) |
| 1210034488162549761 | "Administración de Recursos Humanos" | R. Mondy y R. Noe | Administración de Recursos Humanos | github.com (libros-v2/libro_1210034488162549761_administraci_n_de_recursos_humanos.pdf) |

### 7. "Administración" (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034369093697537 | "Administración" | M. Hitt; J. Black; L. Porter | Administración | github.com (libros-v2/libro_1210034369093697537_administraci_n.pdf) |
| 1210034381275725825 | "Administración" | Robbins, Stephen P. y Coulter, Mary. | Administración | github.com (libros-v1/libro_1210034381275725825_administraci_n.pdf) |
| 1210034387428540417 | "Administración" | Stephen P. Robbins y Mary Coulter | Administración | github.com (libros-v1/libro_1210034387428540417_administraci_n.pdf) |

### 8. "Biología 2" (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065386574282753 | "Biología 2" | Gama, María de los A.; Fernández, Diana | Biología | drive.google.com (1pi20j_J2CHC5XrZ6M1fRoZ7sGk7ddNsK/preview) |
| 1210065395704496129 | "Biología 2" | L. Mosso; Sergio H. Tedesco | Biología | drive.google.com (1dne_MU4raM3N5q9zxDYldba1WQtGCcJG/preview) |
| 1210065400596922369 | "Biología 2" | Ma. C. Coral de Dios; Mariana Rogolino y Silvina Rosa | Biología | drive.google.com (1i8Iyr3cFSc4MUpwxojbVl5Z4Daq4M1AL/preview) |

### 9. "Bioquímica" (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 52 | "Bioquímica" | C. Mathews; K.E. van Holde; K.G. Aherne | Química | github.com (libros-v2/libro_52_bioqu_mica.pdf) |
| 53 | "Bioquímica" | Denise R. | Química | github.com (libros-v2/libro_53_bioqu_mica.pdf) |
| 1210036377901891585 | "Bioquímica" | José M. Medina; Sánchez de Medina, Fermín; Vargas, Alberto | Química | github.com (libros-v1/libro_1210036377901891585_bioqu_mica.pdf) |

### 10. Administración de recursos humanos (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034429993910273 | Administración de recursos humanos | Rosángela Flores Villalpando | Administración de Recursos Humanos | github.com (libros-v1/libro_1210034429993910273_administraci_n_de_recursos_humanos.pdf) |
| 1210034436388093953 | Administración de Recursos Humanos | Jaime Maristany | Administración de Recursos Humanos | github.com (libros-v2/libro_1210034436388093953_administraci_n_de_recursos_humanos.pdf) |
| 1210034440628633601 | Administración de recursos humanos | Gary Dessler | Administración de Recursos Humanos | github.com (libros-v1/libro_1210034440628633601_administraci_n_de_recursos_humanos.pdf) |

### 11. Alicia en el país de las Maravillas (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064382068260865 | Alicia en el país de las Maravillas | Lewis Carrol Chauvel Collette | Literatura | drive.google.com (12KtHtRDDCAODJkHEgvrHTYrZdUHexNgF/preview) |
| 1210064825393643521 | Alicia en el País de las Maravillas | Lewis Carroll | Literatura | drive.google.com (19M53cu0vyb9hRU5ItPuAG6iVkyjubo6N/preview) |
| 1210064837962268673 | Alicia en el país de las maravillas | L Carroll | Literatura | drive.google.com (1k1zUf-T8UEUlz28J9NOSPhv4qh5-qM5w/preview) |

### 12. Cruz, Sor Juana Inés de la (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063569839489025 | Cruz, Sor Juana Inés de la | "Obras completas I: Lírica personal | Literatura | drive.google.com (15bL277O2ivCGUY_Ipb8jfXlaUmXjh8C8/preview) |
| 1210063575530242049 | Cruz, Sor Juana Inés de la | "Obras completas III: Autos y Loas | Literatura | drive.google.com (130OBxWXYsfY82-SXj7moEQSh2l80qhzj/preview) |
| 1210063576550244353 | Cruz, Sor Juana Inés de la | Sainetes y Prosa "Obras completas IV: Comedias | Literatura | drive.google.com (19YBxdtc768LbaNtdoPszkYq7Shu7HyJK/preview) |

### 13. Cuentos (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063693675560961 | Cuentos | Hans Christian Andersen | Literatura Infantil / Cuentos | drive.google.com (1pPNIWy5UJ7-AdhFLAmdoRsbwvJyRt37z/preview) |
| 1210063762537676801 | Cuentos | F Dostoievski | Literatura Infantil / Cuentos | drive.google.com (1drVtXfIIVmwKvW1N6ETSSouwob9cab_q/preview) |
| 1210063824783147009 | Cuentos | Horacio Quiroga | Literatura Infantil / Cuentos | drive.google.com (1BPe1kwiy3eVn9X2exs1GxlPIAwb-MuxV/preview) |

### 14. El extraño caso del Dr. Jekyll y Mr. Hyde (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063843708862465 | El extraño caso del Dr. Jekyll y Mr. Hyde | Robert L Stevenson | Literatura Infantil / Cuentos | drive.google.com (1h1iRc8W3zu6C0sfDbImlJMXRXIfTieRX/preview) |
| 1210063853620592641 | El extraño caso del  Dr. Jekyll y Mr. Hyde | Stevenson, Robert, L | Literatura Infantil / Cuentos | drive.google.com (12YqvVhSUeFeaMuAB_B6-ncFGmKS0WnqE/preview) |
| 1210063866026065921 | El extraño caso del Dr. Jekyll y Mr. Hyde | R Stevenson (Novela gráfica) | Literatura Infantil / Cuentos | drive.google.com (1TtfIMgMhwFWZrHW3bNsOfxOvSPCmfamH/preview) |

### 15. Historia 2 (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210066260019838977 | Historia 2 | Edelvives. Convergente | Historia | drive.google.com (1wqxATDFnZ3pxahTub32eM2w-hKQC-Zlz/preview) |
| 1210066265115033601 | Historia 2 | Mandioca | Historia | drive.google.com (1rc6o1oz_HCI3IhhlS9FMmgs3lSM6Vaue/preview) |
| 1210066271557582849 | Historia 2 | Ibañez | Historia | drive.google.com (19nMJjMwq4t-6sSbVYy3dbUayIrSZ6hGm/preview) |

### 16. Historia Universal (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210036273578967041 | Historia Universal | José Luis Gómez Navarro,María Teresa González Calvet | Revolución Industrial | github.com (libros-v2/libro_1210036273578967041_historia_universal.pdf) |
| 1210063180288163841 | Historia Universal | Humberto Sánchez Córdova | Historia | drive.google.com (1t6lWABL8oF9EkUkZz2cxRKXo89CTpDc7/preview) |
| 1210063189934800897 | Historia Universal | Rodriguez Arvisu; Ramírez Campos; Gómez Méndez | Historia | drive.google.com (1XcC4MDj0hs7C0A7IwwxTPArUab457MPj/preview) |

### 17. Primer Nivel de Transición (3 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034111712624641 | Primer Nivel de Transición | Laminas | Literatura Infantil / Cuentos | github.com (libros-v2/libro_1210034111712624641_primer_nivel_de_transici_n.pdf) |
| 1210034113304952833 | Primer Nivel de Transición | Guía didáctica de la educadora | Literatura Infantil / Cuentos | github.com (libros-v2/libro_1210034113304952833_primer_nivel_de_transici_n.pdf) |
| 1210034130783961089 | Primer Nivel de Transición | Texto del párvulo | Literatura Infantil / Cuentos | github.com (libros-v1/libro_1210034130783961089_primer_nivel_de_transici_n.pdf) |

### 18. "Cómo escribir un trabajo de fin de grado: Algunas experiencias y consejos prácticos" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210038140818063361 | "Cómo escribir un trabajo de fin de grado: Algunas experiencias y consejos prácticos" | J.M. González García; A. León Mejía; M. Peñalba Sotorrío, M. | Lengua y Literatura | github.com (libros-v1/libro_1210038140818063361_c_mo_escribir_un_trabajo_de_fin_de_.pdf) |
| 1210063469063569409 | "Cómo escribir un trabajo de fin de grado: Algunas experiencias y consejos prácticos" | J.M. González García; A. León Mejía; M. Peñalba Sotorrío | Lengua y Literatura | github.com (libros-v3/libro_1210063469063569409_c_mo_escribir_un_trabajo_de_fin_de_.pdf) |

### 19. "En torno a los orígenes de la Revolución Industrial" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210036256489897985 | "En torno a los orígenes de la Revolución Industrial" | E. Hobsbawn | Revolución Industrial | github.com (libros-v1/libro_1210036256489897985_en_torno_a_los_or_genes_de_la_revol.pdf) |
| 1210063194926743553 | "En torno a los orígenes de la Revolución Industrial" | (Ed. 1988) Eric Hobsbawm | Historia | drive.google.com (1YTep0z2Vm1DEz2ph1-p2qL1z9yMbtn2F/preview) |

### 20. "Historia (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210066664412479489 | "Historia | Argentina y el resto del Mundo: Primera mitad del siglo XX. | Historia | drive.google.com (1dZBQkjV_JaUpa_IHjE2PdwSOT5Q2T4by/preview) |
| 1210067525360451585 | "Historia | El mundo contemporáneo: Atlas histórico. (Polimodal)".  M. Alonso | Referencia: Diccionarios, Enciclopedias, Atlas y otros | github.com (libros-v3/libro_1210067525360451585_historia.pdf) |

### 21. "Historia argentina: 1955-1976" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210062864327311361 | "Historia argentina: 1955-1976" | E.C. Vázquez M.E. Alonso | Historia | drive.google.com (14sMIqUG_bT5btAGU94h55BB_ZC4xKYSt/preview) |
| 1210066538610851841 | "Historia Argentina: 1955-1976" | M.E. Alonso y E.C. Vázquez | Historia | drive.google.com (1dfukK1Kxnb64JgAmn41cUzVIrIH4NPJm/preview) |

### 22. "Historia de la Literatura Española: Época Barroca" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063441905221633 | "Historia de la Literatura Española: Época Barroca" | Juan L. Alborg | Literatura | drive.google.com (1tpFoxiNsEC0529Q_bDY4sDnhKEVWY3HM/preview) |
| 1210063449173819393 | "Historia de la literatura española: Época barroca" | J.L.Alborg | Literatura | drive.google.com (1lfM4VRT4h-MFawCrd4NguA9z5doWgH9N/preview) |

### 23. "Historia Moderna del Japón" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063012818321409 | "Historia Moderna del Japón" | (Cap.1 a 5). W. G. Beasley | Historia | drive.google.com (1uq4oZiYry1DL-MdA1of385UmDQuRJeO0/preview) |
| 1210063013884854273 | "Historia Moderna del Japón" | (Cap.12 al final). W. G. Beasley | Historia | drive.google.com (1uvOhNBDp8cdliuiWJH-OujiG6QTdxVJH/preview) |

### 24. "Jasón y los argonautas" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064362228449281 | "Jasón y los argonautas" | Mitología en cómic. | Literatura | drive.google.com (1SbOAyRrFJy4EFO59zDzTp2PEpR078HLy/preview) |
| 1210064539189313537 | "Jasón y los Argonautas" | Graciela. Montes | Literatura | drive.google.com (1DP31g9-nyWzMWX5vUpzT1G4kox4Gyy7t/preview) |

### 25. "La Revolución Rusa" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210036220675260417 | "La Revolución Rusa" | S. Fitzpatrick | Jhon Jairo Tumiri | github.com (libros-v1/libro_1210036220675260417_la_revoluci_n_rusa.pdf) |
| 1210036242777079809 | "La Revolución Rusa" | R. Pipes | Bibliografía sugerida | github.com (libros-v1/libro_1210036242777079809_la_revoluci_n_rusa.pdf) |

### 26. "Microeconomía" (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210036727397384193 | "Microeconomía" | Robert Pindyck y Daniel L. Rubinfeld | Economía | github.com (libros-v2/libro_1210036727397384193_microeconom_a.pdf) |
| 1210065822209277953 | "Microeconomía" | Robert S. Pinkdyck; Daniel L. Rubinfeld | Economía | drive.google.com (18XfRbLHHHMzkXxWJDC4-q-8dTsauieoX/preview) |

### 27. Aprendiendo sobre la trata de personas: Una guía para jóvenes (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034907985870849 | Aprendiendo sobre la trata de personas: Una guía para jóvenes | Ministerio de Educación de la pcia. de Córdoba | Trata de personas | github.com (libros-v2/libro_1210034907985870849_aprendiendo_sobre_la_trata_de_perso.pdf) |
| 1210038378961141761 | Aprendiendo sobre la trata de personas: Una guía para jóvenes | Ministerio de Educación. Provincia de Córdoba | Educación Sexual Integral (ESI) | github.com (libros-v1/libro_1210038378961141761_aprendiendo_sobre_la_trata_de_perso.pdf) |

### 28. Aventuras de Don Quijote (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 81 | Aventuras de Don Quijote | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v2/libro_81_aventuras_de_don_quijote.pdf) |
| 1210064741470535681 | Aventuras de Don Quijote | Miguel de Cervantes Saavedra Cristina | Literatura | drive.google.com (1tp63aQS6Vn-WGlobYyuIp-HmaGukX-8f/preview) |

### 29. Bestiario (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 86 | Bestiario | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v2/libro_86_bestiario.pdf) |
| 1210063836814508033 | Bestiario | Gustavo Roldán (Ilustrado) | Literatura Infantil / Cuentos | drive.google.com (1su4RlpE6fLenEj0OMXaihz4XauZULw6z/preview) |

### 30. Biofísica para el CBC: Parte I (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 57 | Biofísica para el CBC: Parte I | (Edición diferente) | Física | github.com (libros-v1/libro_57_biof_sica_para_el_cbc_parte_i.pdf) |
| 58 | Biofísica para el CBC: Parte I | Anibal | Física | github.com (libros-v1/libro_58_biof_sica_para_el_cbc_parte_i.pdf) |

### 31. Biología (2 ocurrencias — ⚠️ Mismo PDF detectado)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 5 | Biología | Curtis | Biología | (sin pdf) |
| 1210038674761121793 | Biología | Argentina. Ministerio de Educación. Dirección Nacional de Fortalecimiento y Ampliación de Derechos Educativos. Plan Finalización de estudios primarios y secundarios para jóvenes y adultos FINES | Biología | github.com (libros-v2/libro_1210038674761121793_biolog_a.pdf) |

### 32. Biología 2: Origen, evolución y continuidad de los sistemas biológicos (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065417598763009 | Biología 2: Origen, evolución y continuidad de los sistemas biológicos | Mandioca | Biología | drive.google.com (16ycBht-MpLr1HEHBU4oHr6-jaQX40NOW/preview) |
| 1210065449959325697 | Biología 2: Origen, evolución y continuidad de los sistemas biológicos | Santillana Vale Saber | Biología | drive.google.com (1iuINj5OdaPE1pBvctVgeKHPWgQUWwcw7/preview) |

### 33. Biología 3 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034153281683457 | Biología 3 | Doce Orcas Nueva Edición | Educación Física | github.com (libros-v1/libro_1210034153281683457_biolog_a_3.pdf) |
| 1210065444707663873 | Biología 3 | Tinta Fresca Nuevas Miradas | Biología | drive.google.com (18m9BIH-DZbr33-T8OF0FwgmhFgBS9hGf/preview) |

### 34. Biología: 2do. año: Evolución en la laguna de las ranas (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210037864432435201 | Biología: 2do. año: Evolución en la laguna de las ranas | 2018 | Biología | github.com (libros-v1/libro_1210037864432435201_biolog_a_2do_a_o_evoluci_n_en_la_la.pdf) |
| 1210037867159158785 | Biología: 2do. año: Evolución en la laguna de las ranas | 2019 | Biología | github.com (libros-v1/libro_1210037867159158785_biolog_a_2do_a_o_evoluci_n_en_la_la.pdf) |

### 35. Blancanieves (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 87 | Blancanieves | Jacinta | Literatura Infantil / Cuentos | github.com (libros-v1/libro_87_blancanieves.pdf) |
| 1210063963856273409 | Blancanieves | Jacob Grimm | Literatura Infantil / Cuentos | drive.google.com (1zKq7aBzSs2NaQm6-ACafp-4pKIhoUy1X/preview) |

### 36. Ciencias Exactas y Naturales: 1er. año: Decisiones políticas y natalidad (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210037907665518593 | Ciencias Exactas y Naturales: 1er. año: Decisiones políticas y natalidad | Gobierno de CABA. Serie Profundización NES | Educación | github.com (libros-v2/libro_1210037907665518593_ciencias_exactas_y_naturales_1er_a_.pdf) |
| 1210037907667386369 | Ciencias Exactas y Naturales: 1er. año: Decisiones políticas y natalidad | Gobierno de la Ciudad de Buenos Aires. Serie Profundización NES | Educación | github.com (libros-v1/libro_1210037907667386369_ciencias_exactas_y_naturales_1er_a_.pdf) |

### 37. Ciencias Sociales (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065632985219073 | Ciencias Sociales | Kapelusz Avanza | Ciencias Sociales | drive.google.com (1G1AiJv1R5SC-Dt0WJ6YQTqcqjfHIJ9ul/preview) |
| 1210065642725179393 | Ciencias sociales | ILOVEPDF.COM | Ciencias Sociales | drive.google.com (1OOdp6Am7a27HA1xahqDY3ZW4YjvFnRht/preview) |

### 38. Cuentos completos (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063569924030465 | Cuentos completos | Jorge L Borges | Literatura | drive.google.com (1A8Q3NiwuR7iPc5BiJU5tDZifWk8qitOJ/preview) |
| 1210063739842560001 | Cuentos Completos | Isaac Asimov | Literatura Infantil / Cuentos | drive.google.com (1r5ex2kJvCmP8rcksKnHqXRPb-F6Y-qxt/preview) |

### 39. Cuentos fantásticos argentinos (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063624105623553 | Cuentos fantásticos argentinos | Cántaro. Del Mirador | Literatura Infantil / Cuentos | drive.google.com (1ZUrWPfd-OL-J8A99f9aEcZyEUeFnlD69/preview) |
| 1210063626372579329 | Cuentos fantásticos argentinos | Golu | Literatura Infantil / Cuentos | drive.google.com (1RaXij-ViepCQ16oOtcLKSKQtM0zyoc1Q/preview) |

### 40. Cuentos Mapuches del Lago Escondido (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 159 | Cuentos Mapuches del Lago Escondido | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v2/libro_159_cuentos_mapuches_del_lago_escondido.pdf) |
| 1210064517957550081 | Cuentos mapuches del lago Escondido | Manuel Gallegos | Literatura | drive.google.com (17NbS-uhwiM1scuDFZe8RWgqVQU4XpDj2/preview) |

### 41. Cuentos raros e inquietantes (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063620378460161 | Cuentos raros e inquietantes | Buenos Aires Educación | Literatura Infantil / Cuentos | drive.google.com (1I1B4-dwMmDgCCzRS7fwOTbW9pskIuvTC/preview) |
| 1210063623143096321 | Cuentos raros e inquietantes | Educación de la provincia de Buenos Aires | Literatura Infantil / Cuentos | drive.google.com (1mqvpQVP7_ciiplCE1JAZCWujA98w4cT0/preview) |

### 42. Diccionario del diablo (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065267722977281 | Diccionario del diablo | Ambrose Gwinet Bierce | Literatura | drive.google.com (1veqbbtqMmCrPaxHIZG-2kGj6-70PPbgq/preview) |
| 1210067485148774401 | Diccionario del diablo | Bierce Ambrose Gwinet | Referencia: Diccionarios, Enciclopedias, Atlas y otros | github.com (libros-v3/libro_1210067485148774401_diccionario_del_diablo.pdf) |

### 43. Documento de Valeria Almada (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065093506531329 | Documento de Valeria Almada | Autor Institucional / Educativo | Literatura | drive.google.com (1FLleRHWyaMmxe5_LQez0zii7CJSppHOT/preview) |
| 1210065268791508993 | Documento de Valeria Almada | CamScanner | Literatura | drive.google.com (1JGaYpPQa8JWBTlO03Vmgnqbh3lPdO8V8/preview) |

### 44. Don Quijote de la Mancha (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064744010973185 | Don Quijote de la Mancha | Miguel de Cervantes El manga | Literatura | drive.google.com (1rTmFNjyVWe92kGYjkIHeDk2v751v4HKK/preview) |
| 1210064753367384065 | Don Quijote de la Mancha | Miguel de Cervantes | Literatura | drive.google.com (1ROjFtX_8mlUBAUajapI_92Oi0FUhPOYu/preview) |

### 45. Drácula (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064407045668865 | Drácula | Bram Stoker (Novela gráfica) | Literatura | drive.google.com (1R_F_3gxwpTnwuftZKI90af-5GwcZjCML/preview) |
| 1210065080789401601 | Drácula | Bram Stoker | Literatura | drive.google.com (1GczYIStHbYmEfQkMEnOirafOO5J3m-rv/preview) |

### 46. El cuervo (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 410 | El cuervo | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v1/libro_410_el_cuervo.pdf) |
| 1210065208376950785 | El Cuervo | Edgar Allan Poe (Ilustrado) | Literatura | drive.google.com (1vQuPE1bDTtNmHXvnBIr7F9co90zQ7avD/preview) |

### 47. El Diario de Ana Frank (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063866352959489 | El Diario de Ana Frank | Windows | Literatura | drive.google.com (1BthalY-LuoRK001rO6katX6XntVdE0AK/preview) |
| 1210063871240175617 | El diario de Ana Frank | Ana Frank | Literatura | drive.google.com (1bsa6JnVzOB432T2iXCpCAYy-BabOkA7f/preview) |

### 48. El flautista de Hamelin (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 415 | El flautista de Hamelin | Jacinta | Literatura Infantil / Cuentos | github.com (libros-v1/libro_415_el_flautista_de_hamelin.pdf) |
| 1210063770074808321 | El flautista de Hamelin | Wilhelm Grimm | Literatura Infantil / Cuentos | drive.google.com (1wCirbs0eDmox_N2fqTLOvaZO20N4JHa4/preview) |

### 49. Física y Química I (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065793090781185 | Física y Química I | Tinta Fresca Nuevas Miradas | Química | drive.google.com (15OSslCNzPwlEBglu9CZlr5bcaSnwW24y/preview) |
| 1210065804868747265 | Física y  Química I | SM Proyecto Nodos | Química | drive.google.com (1xw2WPqyVJEGaY3q6NPizz6Z2kBXuRMVc/preview) |

### 50. Geografía de América (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210065926824493057 | Geografía de América | Kapelusz. con textos digitales | Geografía | drive.google.com (1c4Nw0IkZ_V6bnfVpYmXdf6kgIKLbk2Au/preview) |
| 1210065958947323905 | Geografía de América | Echeverría; Capuz | Geografía | drive.google.com (1cCM0oHbcfrZh7mgWnjrxpfyH9UA5DXSI/preview) |

### 51. Geografía Mundial Contemporánea (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210038684523298817 | Geografía Mundial Contemporánea | Argentina. Ministerio de Educación. Dirección Nacional de Fortalecimiento y Ampliación de Derechos Educativos. Plan Finalización de estudios primarios y secundarios para jóvenes y adultos FINES | Geografía | github.com (libros-v2/libro_1210038684523298817_geograf_a_mundial_contempor_nea.pdf) |
| 1210066059002183681 | Geografía mundial contemporánea | FINES | Geografía | github.com (libros-v3/libro_1210066059002183681_geograf_a_mundial_contempor_nea.pdf) |

### 52. Guía de sensibilización sobre Convivencia Digital (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034836443561985 | Guía de sensibilización sobre Convivencia Digital | Gobierno de la Provincia de Buenos Aires. UNICEF | Convivencia | github.com (libros-v2/libro_1210034836443561985_gu_a_de_sensibilizaci_n_sobre_convi.pdf) |
| 1210034837338390529 | Guía de sensibilización sobre Convivencia Digital | UNICEF | Convivencia | github.com (libros-v2/libro_1210034837338390529_gu_a_de_sensibilizaci_n_sobre_convi.pdf) |

### 53. H2O Ciudades sustentables 2023 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210035204956749825 | H2O Ciudades sustentables 2023 | Estudiantes | Agua | github.com (libros-v2/libro_1210035204956749825_h2o_ciudades_sustentables_2023.pdf) |
| 1210035220839661569 | H2O Ciudades sustentables 2023 | Docentes | Agua | github.com (libros-v2/libro_1210035220839661569_h2o_ciudades_sustentables_2023.pdf) |

### 54. Historia argentina: una mirada crítica: (1806-2006) (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210036307934380033 | Historia argentina: una mirada crítica: (1806-2006) | Egger | Historia | github.com (libros-v1/libro_1210036307934380033_historia_argentina_una_mirada_cr_ti.pdf) |
| 1210062883104030721 | Historia argentina: una mirada crítica: (1806-2006) | Eggers Brass | Historia | drive.google.com (1QPsrspzL-i5RcFE03-6Uflq50dwZVzh9/preview) |

### 55. Jovenes Globales 2023 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210035198883758081 | Jovenes Globales 2023 | Estudiantes | Agua | github.com (libros-v2/libro_1210035198883758081_jovenes_globales_2023.pdf) |
| 1210035209607774209 | Jovenes Globales 2023 | Docentes | Agua | github.com (libros-v1/libro_1210035209607774209_jovenes_globales_2023.pdf) |

### 56. King, Stephen (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064997004115969 | King, Stephen | I: Primavera y verano " "Las cuatro estaciones | Literatura | drive.google.com (1kTaDqeb1aCHg8rcwMvcQGUceIkjCAXXb/preview) |
| 1210065027852926977 | King, Stephen | "It" | Literatura | drive.google.com (1wlNcV2Tdhfhv5B7dvGT5TKlZWSEbuDWD/preview) |

### 57. La chica pájaro (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064044529713153 | La chica pájaro | Paula Bombara | Literatura | drive.google.com (1VBhUm-4AvfX4VL3wLbwqwPxjVBPQnPoC/preview) |
| 1210064051965165569 | La chica pájaro | Paula Bompara | Literatura | drive.google.com (1eEQ8eF7_Bg8YwgC6v2Q-8NtenUb9YZy3/preview) |

### 58. La isla del tesoro (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064418964275201 | La isla del tesoro | Robert Louis Stevenson | Literatura | drive.google.com (1gyMaZYJaE8YvtWFKilA2nf5GOEjyUQQK/preview) |
| 1210064689255186433 | La isla del tesoro | R Stevenson | Literatura | drive.google.com (1Y5YppKaARrUPYo95U6es91r-FEwu3Tjk/preview) |

### 59. La Sirenita (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 252 | La Sirenita | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v1/libro_252_la_sirenita.pdf) |
| 1210063959536828417 | La sirenita | Hans Christian Andersen | Literatura Infantil / Cuentos | drive.google.com (10EURKtRZlYCfDv1RvwaCqDx2yS75VhA_/preview) |

### 60. Las chicas de alambre (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064123230191617 | Las chicas de alambre | Jordi Sierra i Fabbra | Literatura | drive.google.com (1MFbiaA4VjogL7mghwlsyyokNwa1ehOvT/preview) |
| 1210064127800377345 | Las chicas de alambre | Jordi Sierra I Fabra | Literatura | drive.google.com (1Oo73N6GoRuDurl01B57E0wLFMZhUMpHC/preview) |

### 61. Leyendas Argentinas (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063960388435969 | Leyendas Argentinas | Graciela Repún | Literatura | drive.google.com (1RyPXhaUwRygjEA1WzeTNc-6BcbDZu6Dr/preview) |
| 1210064547512385537 | Leyendas argentinas | Mirta | Literatura | drive.google.com (1aH2v69cjOAXBpCnOldPNbEks4k0hh4VQ/preview) |

### 62. Libro de Oro Patoruzú: 1946 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210075851695849473 | Libro de Oro Patoruzú: 1946 | Varios Autores | Historietas | /libros/libro_comic_libro_de_oro_patoruz___1946_1mSvxyEl.pdf |
| 1210075858616909825 | Libro de Oro Patoruzú: 1946 | (Completo) | Historietas | /libros/libro_comic_libro_de_oro_patoruz___1946_1KLDFdJw.pdf |

### 63. Libro de Oro Patoruzú: 1960 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210075869083435009 | Libro de Oro Patoruzú: 1960 | Leído | Historietas | /libros/libro_comic_libro_de_oro_patoruz___1960_1jzI3Q3M.pdf |
| 1210075873383710721 | Libro de Oro Patoruzú: 1960 | Varios Autores | Historietas | /libros/libro_comic_libro_de_oro_patoruz___1960_1U3gjqqO.pdf |

### 64. Matematica financiera (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210067176221114369 | Matematica financiera | José Enrique Giraldo Pacheco | Matemática Financiera | github.com (libros-v3/libro_1210067176221114369_matematica_financiera.pdf) |
| 1210067179501518849 | Matematica financiera | Cesar aching Guzman | Matemática Financiera | github.com (libros-v3/libro_1210067179501518849_matematica_financiera.pdf) |

### 65. Mitos clasificados 4: Latinoamérica precolombina (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064569566134273 | Mitos clasificados 4: Latinoamérica precolombina | Cántaro. Mirador | Literatura | drive.google.com (1GMA8jMmWIQeNfaSr3Zga2h18Q6wsKnVU/preview) |
| 1210064570385006593 | Mitos clasificados 4: Latinoamérica precolombina | Cántaro | Literatura | drive.google.com (1gZBjwm5PjnlPWa9SfyxVCaOEX5Ioqv5v/preview) |

### 66. Moby Dick (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064689826103297 | Moby Dick | Herman Melville El manga | Literatura | drive.google.com (1zFWIQmoxQSOqRBBKZ95VZLTwD901nPuU/preview) |
| 1210064696896618497 | Moby Dick | Hernan Melville | Literatura | drive.google.com (1MEdILHk-xQjjpCh3n4b3YvWjWODHADKt/preview) |

### 67. Pensar la Democracia: Treinta ejercicios para trabajar en el aula (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210038098330976257 | Pensar la Democracia: Treinta ejercicios para trabajar en el aula | Ministerio de Educación de la Nación | Historia | github.com (libros-v1/libro_1210038098330976257_pensar_la_democracia_treinta_ejerci.pdf) |
| 1210062791409860609 | Pensar la Democracia: Treinta ejercicios para trabajar en el aula | Argentina. Ministerio de Educación. Programa Educación y Memoria | Historia | drive.google.com (1LCQUJeSYeEi6HDjVpb1t3FYmFkIfgBf0/preview) |

### 68. Racismo y xenofobia: Hacia una Argentina intercultural (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034617985597441 | Racismo y xenofobia: Hacia una Argentina intercultural | INADI | Bullying, amenazas en internet | github.com (libros-v1/libro_1210034617985597441_racismo_y_xenofobia_hacia_una_argen.pdf) |
| 1210035175455752193 | Racismo y xenofobia: Hacia una Argentina intercultural | Ministerio de Justicia y Derechos Humanos. Presidencia de la Nación | Adolescencia y Niñez | github.com (libros-v2/libro_1210035175455752193_racismo_y_xenofobia_hacia_una_argen.pdf) |

### 69. Romeo y Julieta (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210064936785412097 | Romeo y Julieta | William Shakespeare | Literatura | drive.google.com (1ynWb_TecTL_Fim7iVh4xCD2iahzymO91/preview) |
| 1210064944513908737 | Romeo y Julieta | William Shakespearo (Novela gráfica) | Literatura | drive.google.com (1rPfsttNxalQoXCwBUmdxQQClzW2LFT7A/preview) |

### 70. Rosa Luxemburgo: La liberación femenina y la filosofía marxista (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210038645718614017 | Rosa Luxemburgo: La liberación femenina y la filosofía marxista | Raya Dunayevskaya | Filosofía | github.com (libros-v1/libro_1210038645718614017_rosa_luxemburgo_la_liberaci_n_femen.pdf) |
| 1210063307997839361 | Rosa Luxemburgo: La liberación femenina y la filosofía marxista | Daya Dunayevskaya | Historia | github.com (libros-v3/libro_1210063307997839361_rosa_luxemburgo_la_liberaci_n_femen.pdf) |

### 71. Salud y adolescencia 4 y 5 (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210034291701874689 | Salud y adolescencia 4 y 5 | Mandioca Llaves. pdf (1) | Educación Física | github.com (libros-v2/libro_1210034291701874689_salud_y_adolescencia_4_y_5.pdf) |
| 1210065475116204033 | Salud y adolescencia 4 y 5 | Mandioca Llaves | Adolescencia y Niñez | drive.google.com (1ibq5KwWaK1DkACfoZcgo6SJogSJdbMqL/preview) |

### 72. Teoría de la literatura de los formalistas rusos (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063453951950849 | Teoría de la literatura de los formalistas rusos | Antología preparada por Tzvetan Todorov | Literatura | drive.google.com (1C4dJxJxURFqzt3iTwCyomDjRZXvUUZxY/preview) |
| 1210063463315767297 | Teoría de la Literatura de los Formalistas Rusos | (Cap. sobre el Realismo Artístico de R. Jakobson). Antología de Tzvetan Todorov | Literatura | drive.google.com (1u38Tbof6IGU1eeT1GQI4AiZqhp2ZfASt/preview) |

### 73. Todos los cuentos (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 1210063778266775553 | Todos los cuentos | Gabriel García Márquez | Literatura Infantil / Cuentos | drive.google.com (1FV6BjPwVe4yrHsFamjsMOVwgQthfOK-2/preview) |
| 1210063811329228801 | Todos los cuentos | Clarice Lispector | Literatura Infantil / Cuentos | drive.google.com (1d56sLJS3PZcKk6wae5xlRsST2Nw4_65K/preview) |

### 74. Un puñado de semillas (2 ocurrencias — ℹ️ PDFs distintos)

| ID | Título | Autor | Materia | PDF (host / archivo) |
|---:|---|---|---|---|
| 305 | Un puñado de semillas | Autor Institucional / Educativo | Literatura Infantil / Cuentos | github.com (libros-v1/libro_305_un_pu_ado_de_semillas.pdf) |
| 1210063792481566721 | Un puñado de semillas | M Hughes | Literatura Infantil / Cuentos | drive.google.com (1M9AbBAisXLDd5ykj_Kjh-jcsy4WGe2hl/preview) |
