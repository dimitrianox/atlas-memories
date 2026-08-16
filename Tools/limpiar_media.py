import json
import shutil
from pathlib import Path
from tkinter import Tk, filedialog, messagebox

# ==========================
# Seleccionar archivos
# ==========================

root = Tk()
root.withdraw()

album_path = filedialog.askopenfilename(
    title="Selecciona album.json",
    filetypes=[("JSON", "*.json")]
)

if not album_path:
    raise SystemExit

media_path = filedialog.askdirectory(
    title="Selecciona carpeta media"
)

if not media_path:
    raise SystemExit

album_path = Path(album_path)
media_path = Path(media_path)

# ==========================
# Leer album.json
# ==========================

try:

    with open(album_path, "r", encoding="utf-8") as f:
        data = json.load(f)

except Exception as e:

    messagebox.showerror(
        "Error",
        f"No se pudo leer el album.json\n\n{e}"
    )

    raise SystemExit

items = data.get("items", [])

# ==========================
# Obtener archivos permitidos
# ==========================

permitidos = set()

for item in items:

    nombre = (
        item.get("file")
        or item.get("filename")
        or item.get("relative_path")
        or item.get("media")
    )

    if nombre:
        permitidos.add(Path(nombre).name)

# ==========================
# Archivos reales en media
# ==========================

archivos_media = {
    f.name
    for f in media_path.iterdir()
    if f.is_file()
}

# ==========================
# Comparar
# ==========================

sobrantes = sorted(
    archivos_media - permitidos
)

# ==========================
# Estadísticas
# ==========================

print()
print("===================================")
print("RESUMEN")
print("===================================")
print("Items en album.json :", len(permitidos))
print("Archivos en media   :", len(archivos_media))
print("Sobrantes           :", len(sobrantes))
print()

# ==========================
# Guardar reporte
# ==========================

reporte = media_path / "sobrantes.txt"

with open(
    reporte,
    "w",
    encoding="utf-8"
) as f:

    if sobrantes:

        for nombre in sobrantes:
            f.write(nombre + "\n")

# ==========================
# Nada que borrar
# ==========================

if not sobrantes:

    messagebox.showinfo(
        "Atlas",
        "No hay archivos sobrantes.\n\n"
        "Se creó sobrantes.txt para verificación."
    )

    raise SystemExit

# ==========================
# Mostrar lista
# ==========================

texto = "\n".join(sobrantes[:50])

if len(sobrantes) > 50:

    texto += (
        f"\n\n... y {len(sobrantes)-50} más"
    )

accion = messagebox.askyesnocancel(
    "Archivos sobrantes",
    f"Encontrados {len(sobrantes)} archivos.\n\n"
    f"{texto}\n\n"
    f"También se creó:\n"
    f"sobrantes.txt\n\n"
    f"SI = mover a _papelera\n"
    f"NO = eliminar definitivamente\n"
    f"CANCELAR = salir"
)

if accion is None:
    raise SystemExit

# ==========================
# Procesar
# ==========================

log = []

if accion:

    papelera = media_path / "_papelera"
    papelera.mkdir(exist_ok=True)

    for nombre in sobrantes:

        origen = media_path / nombre
        destino = papelera / nombre

        try:

            shutil.move(
                str(origen),
                str(destino)
            )

            log.append(
                f"MOVIDO: {nombre}"
            )

        except Exception as e:

            log.append(
                f"ERROR: {nombre} -> {e}"
            )

else:

    for nombre in sobrantes:

        archivo = media_path / nombre

        try:

            archivo.unlink()

            log.append(
                f"ELIMINADO: {nombre}"
            )

        except Exception as e:

            log.append(
                f"ERROR: {nombre} -> {e}"
            )

# ==========================
# Guardar log
# ==========================

with open(
    media_path / "limpieza_log.txt",
    "w",
    encoding="utf-8"
) as f:

    f.write("\n".join(log))

# ==========================
# Final
# ==========================

messagebox.showinfo(
    "Atlas",
    f"Proceso terminado.\n\n"
    f"Archivos afectados: {len(log)}\n\n"
    f"Revisa:\n"
    f"sobrantes.txt\n"
    f"limpieza_log.txt"
)