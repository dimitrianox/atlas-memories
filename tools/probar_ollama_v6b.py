#!/usr/bin/env python3
"""Genera metadatos y una galería HTML para un álbum usando Ollama.

v6b: las imágenes se reducen antes de enviarse al modelo, no hay consultas
de geocodificación por foto y el contexto del viaje se configura una vez aquí.

Ejemplo:
    python probar_ollama_v6b.py "C:\\Fotos\\londres-2025"
"""

from __future__ import annotations

import argparse
import base64
import html
import io
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from PIL import Image, ImageOps, UnidentifiedImageError


# ---------------------------------------------------------------------------
# CONFIGURACIÓN DEL ÁLBUM: edita solo estos valores para cada viaje.
# ---------------------------------------------------------------------------
ALBUM = {
    "title": "Londres 2025",
    "city": "Londres",
    "country": "Inglaterra",
    "month": "Mayo",
    "year": 2025,
}

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5vl:7b"
MAX_IMAGE_DIMENSION = 1024
JPEG_QUALITY = 88
KEEP_ALIVE = "20m"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Identifica lugares de un álbum con Ollama y crea metadata.json y galeria.html."
    )
    parser.add_argument("input", type=Path, help="Carpeta con las fotografías")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Carpeta de salida (por defecto, resultados_v6b dentro del álbum)",
    )
    parser.add_argument("--model", default=MODEL, help=f"Modelo de Ollama (por defecto: {MODEL})")
    parser.add_argument("--force", action="store_true", help="Vuelve a analizar imágenes ya presentes en metadata.json")
    return parser.parse_args()


def image_files(folder: Path) -> list[Path]:
    return sorted(
        (path for path in folder.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS),
        key=lambda path: str(path).lower(),
    )


def exif_date(path: Path) -> str | None:
    """Devuelve la fecha EXIF si está disponible; no usa GPS ni red."""
    try:
        with Image.open(path) as image:
            exif = image.getexif()
            raw = exif.get(36867) or exif.get(306)  # DateTimeOriginal / DateTime
        if raw:
            return datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S").isoformat(sep=" ")
    except (OSError, UnidentifiedImageError, ValueError):
        pass
    return None


def image_to_base64(path: Path) -> tuple[str, tuple[int, int], tuple[int, int]]:
    """Codifica una versión JPEG de máximo 1024 px por lado, manteniendo proporción."""
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source)
        original_size = image.size
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)

        # JPEG no admite transparencia ni algunos modos de color de cámaras.
        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, "white")
            alpha = image.getchannel("A")
            background.paste(image.convert("RGB"), mask=alpha)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return encoded, original_size, image.size


def compact_prompt() -> str:
    location = ", ".join(value for value in (ALBUM["city"], ALBUM["country"]) if value)
    date = " ".join(str(value) for value in (ALBUM["month"], ALBUM["year"]) if value)
    return (
        "Identifica el lugar, monumento o punto de interés de esta fotografía.\n"
        f"Álbum: {ALBUM['title']}. Contexto del viaje: {location}. Fecha: {date}.\n"
        "Usa el nombre oficial del sitio y no traduzcas nombres propios. "
        "Si no se puede identificar con seguridad, usa un título descriptivo breve.\n"
        'Responde únicamente JSON válido: {"title":"", "location":""}'
    )


def ollama_request(image_b64: str, model: str) -> dict[str, str]:
    """Envía la imagen reducida a la API HTTP de Ollama y normaliza su JSON."""
    payload = {
        "model": model,
        "prompt": compact_prompt(),
        "images": [image_b64],
        "stream": False,
        "format": "json",
        "keep_alive": KEEP_ALIVE,
        "options": {"temperature": 0, "num_predict": 100, "num_ctx": 4096},
    }
    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=600) as response:
            body = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama respondió HTTP {error.code}: {detail}") from error
    except URLError as error:
        raise RuntimeError("No se pudo conectar a Ollama. Comprueba que esté iniciado.") from error

    answer = str(body.get("response", "")).strip()
    return normalise_model_json(answer)


def normalise_model_json(answer: str) -> dict[str, str]:
    """Acepta JSON puro o JSON dentro de una respuesta accidentalmente decorada."""
    candidate = answer
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*|\s*```$", "", candidate, flags=re.IGNORECASE)
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", answer, flags=re.DOTALL)
        if not match:
            raise RuntimeError(f"Ollama no devolvió JSON válido: {answer[:250]}")
        value = json.loads(match.group(0))
    if not isinstance(value, dict):
        raise RuntimeError("Ollama devolvió JSON que no es un objeto.")
    title = str(value.get("title") or value.get("name") or "Lugar sin identificar").strip()
    location = str(value.get("location") or value.get("city") or ALBUM["city"] or "").strip()
    return {"title": title, "location": location}


def load_previous(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {item["relative_path"]: item for item in data.get("items", []) if "relative_path" in item}
    except (OSError, json.JSONDecodeError, TypeError):
        print("Aviso: no se pudo reutilizar el metadata.json anterior; se creará uno nuevo.")
        return {}


def local_url(path: Path) -> str:
    """URL file:// compatible con Windows para que la galería abra imágenes locales."""
    return path.resolve().as_uri()


def generate_html(items: list[dict[str, Any]], output: Path) -> None:
    cards: list[str] = []
    for item in items:
        caption = item.get("title", "Lugar sin identificar")
        location = item.get("location", "")
        date = item.get("date", "")
        error = item.get("error")
        meta = " · ".join(part for part in (location, date) if part)
        status = f'<p class="error">{html.escape(error)}</p>' if error else ""
        cards.append(
            "<article class=\"card\">"
            f'<a href="{html.escape(item["source_url"], quote=True)}" target="_blank">'
            f'<img src="{html.escape(item["source_url"], quote=True)}" loading="lazy" alt="{html.escape(caption)}"></a>'
            f"<div class=\"copy\"><h2>{html.escape(caption)}</h2><p>{html.escape(meta)}</p>{status}</div></article>"
        )
    album_location = ", ".join(str(x) for x in (ALBUM["city"], ALBUM["country"]) if x)
    page = f"""<!doctype html>
<html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
<title>{html.escape(str(ALBUM['title']))}</title>
<style>
*{{box-sizing:border-box}} body{{margin:0;background:#101114;color:#f5f5f5;font-family:Arial,sans-serif}}
header{{padding:42px max(22px,calc((100% - 1400px)/2));background:#191b20}} h1{{margin:0;font-size:clamp(2rem,5vw,4rem)}}
header p{{color:#b9bdc8;margin:10px 0 0}} main{{max-width:1400px;margin:auto;padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}}
.card{{background:#1b1d23;border-radius:14px;overflow:hidden;box-shadow:0 5px 22px #0005}} .card a{{display:block;background:#080808;aspect-ratio:4/3}}
.card img{{display:block;width:100%;height:100%;object-fit:cover}} .copy{{padding:14px 15px 16px}} h2{{font-size:1rem;margin:0 0 7px}} .copy p{{font-size:.86rem;color:#aeb4c1;margin:0}} .error{{color:#ffafaf!important;margin-top:8px!important}}
</style></head><body><header><h1>{html.escape(str(ALBUM['title']))}</h1><p>{html.escape(album_location)} · {len(items)} fotografías</p></header><main>{''.join(cards)}</main></body></html>"""
    output.write_text(page, encoding="utf-8")


def main() -> int:
    args = parse_args()
    source = args.input.resolve()
    if not source.is_dir():
        print(f"Error: no existe la carpeta: {source}", file=sys.stderr)
        return 2
    destination = (args.output or source / "resultados_v6b").resolve()
    destination.mkdir(parents=True, exist_ok=True)
    metadata_path = destination / "metadata.json"
    files = image_files(source)
    if not files:
        print("No se encontraron imágenes compatibles.", file=sys.stderr)
        return 2

    previous = load_previous(metadata_path)
    items: list[dict[str, Any]] = []
    started = time.perf_counter()
    for index, path in enumerate(files, start=1):
        relative = str(path.relative_to(source))
        if relative in previous and not args.force:
            items.append(previous[relative])
            print(f"[{index}/{len(files)}] Reutilizado: {relative}")
            continue
        print(f"[{index}/{len(files)}] Analizando: {relative}")
        item: dict[str, Any] = {
            "relative_path": relative,
            "filename": path.name,
            "source_url": local_url(path),
            "date": exif_date(path),
            "title": "Lugar sin identificar",
            "location": ALBUM["city"],
            "album_context": ALBUM,
        }
        try:
            encoded, original, sent = image_to_base64(path)
            result = ollama_request(encoded, args.model)
            item.update(result)
            item["original_size"] = list(original)
            item["sent_size"] = list(sent)
        except (OSError, RuntimeError, UnidentifiedImageError) as error:
            item["error"] = str(error)
            print(f"  Aviso: {error}", file=sys.stderr)
        items.append(item)
        document = {"album": ALBUM, "model": args.model, "items": items}
        metadata_path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")

    document = {
        "album": ALBUM,
        "model": args.model,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "elapsed_seconds": round(time.perf_counter() - started, 2),
        "items": items,
    }
    metadata_path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
    gallery_path = destination / "galeria.html"
    generate_html(items, gallery_path)
    print(f"\nListo: {metadata_path}")
    print(f"Galería: {gallery_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
