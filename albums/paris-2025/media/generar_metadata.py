import json
from pathlib import Path
from PIL import Image
from google import genai

# ==========================
# CONFIG
# ==========================

ROOT = Path(__file__).resolve().parent.parent

with open(ROOT / "tools" / "config.json", encoding="utf-8") as f:
    config = json.load(f)

client = genai.Client(api_key=config["apiKey"])

# ==========================
# ÁLBUM
# ==========================

album = input("Álbum: ").strip()

media = ROOT / "albums" / album / "media"

metadata = {}

# ==========================
# PROCESAR
# ==========================

for file in sorted(media.iterdir()):

    if file.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
        continue

    print("Analizando:", file.name)

    img = Image.open(file)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            """
Responde únicamente JSON.

{
"title":"",
"location":""
}

title:
Nombre del lugar o monumento.

location:
Ciudad, País.

No agregues explicaciones.
No uses markdown.
""",
            img
        ]
    )

    data = json.loads(response.text)

    metadata[file.name] = {
        "title": data["title"],
        "location": data["location"],
        "visible": True
    }

# ==========================
# GUARDAR
# ==========================

with open(ROOT / "albums" / album / "metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=4, ensure_ascii=False)

print("Listo.")