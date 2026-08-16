import os
import json
import time
from PIL import Image
from google import genai
from google.genai import types

# Inicializar cliente
client = genai.Client()

CARPETA_FOTOS = input("Ingresa la ruta de la carpeta donde están las fotos y videos: ").strip().strip('"').strip("'")
archivo_salida = input("Ingresa la ruta completa y nombre para el archivo final (ej. galeria.json): ").strip().strip('"').strip("'")

EXT_IMAGENES = ('.jpg', '.jpeg', '.png', '.webp', '.heic')
EXT_VIDEOS = ('.mp4', '.mov', '.avi', '.mkv', '.m4v')

resultado_final = {}

if not os.path.exists(CARPETA_FOTOS):
    print(f"\n❌ ERROR: La carpeta '{CARPETA_FOTOS}' no existe.")
    exit()

archivos_en_carpeta = os.listdir(CARPETA_FOTOS)
print(f"\n📁 Se encontraron {len(archivos_en_carpeta)} elementos en la carpeta.")

prompt_instrucciones = """
Identifica lo que hay en esta imagen. Devuelve ÚNICAMENTE un objeto JSON válido con los siguientes campos:
- "title": Nombre preciso del monumento, edificio, calle, parque o sitio (p. ej. "Big Ben / Parliament Square").
- "location": Ciudad y país (p. ej. "Londres, Inglaterra.").
- "description": Descripción breve o déjalo como string vacío "" si no hay nada relevante.
- "visible": Siempre debe ser true (booleano).
"""

archivos_procesados = 0

for archivo in sorted(archivos_en_carpeta):
    if archivo.startswith('.'):
        continue
        
    nombre_lower = archivo.lower()
    ruta_archivo = os.path.join(CARPETA_FOTOS, archivo)
    
    if os.path.isdir(ruta_archivo):
        continue

    # 1. IMÁGENES -> Analizar con Gemini
    if nombre_lower.endswith(EXT_IMAGENES):
        print(f"[IMAGEN] Analizando: {archivo}...")
        archivos_procesados += 1
        
        exito = False
        reintentos = 0
        
        while not exito and reintentos < 3:
            try:
                imagen = Image.open(ruta_archivo)
                if imagen.mode != 'RGB':
                    imagen = imagen.convert('RGB')
                    
                response = client.models.generate_content(
                    model='gemini-3.5-flash-lite',  # <--- Cambiado a 3.5 Lite
                    contents=[imagen, prompt_instrucciones],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                
                texto_limpio = response.text.strip()
                if texto_limpio.startswith("```json"):
                    texto_limpio = texto_limpio[7:]
                if texto_limpio.startswith("```"):
                    texto_limpio = texto_limpio[3:]
                if texto_limpio.endswith("```"):
                    texto_limpio = texto_limpio[:-3]
                
                datos_foto = json.loads(texto_limpio.strip())
                
                resultado_final[archivo] = {
                    "title": datos_foto.get("title", ""),
                    "location": datos_foto.get("location", ""),
                    "description": datos_foto.get("description", ""),
                    "visible": datos_foto.get("visible", True)
                }
                
                exito = True
                time.sleep(2) # Pausa ligera
                
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    print(f"  ⏳ Límite alcanzado temporalmente. Esperando 30 segundos...")
                    time.sleep(30)
                    reintentos += 1
                else:
                    print(f"  └─ Error al procesar {archivo}: {e}")
                    resultado_final[archivo] = {
                        "title": "",
                        "location": "",
                        "description": "",
                        "visible": True
                    }
                    break

    # 2. VIDEOS -> Registrar vacíos
    elif nombre_lower.endswith(EXT_VIDEOS):
        print(f"[VIDEO] Enlistando video: {archivo}...")
        archivos_procesados += 1
        resultado_final[archivo] = {
            "title": "",
            "location": "",
            "description": "",
            "visible": True
        }

if archivos_procesados > 0:
    carpeta_destino = os.path.dirname(archivo_salida)
    if carpeta_destino and not os.path.exists(carpeta_destino):
        os.makedirs(carpeta_destino, exist_ok=True)

    with open(archivo_salida, "w", encoding="utf-8") as f:
        json.dump(resultado_final, f, ensure_ascii=False, indent=2)

    print(f"\n¡Listo! Se procesaron los archivos y se guardó en: {archivo_salida}")