from pathlib import Path


# Carpeta donde está este archivo
BASE_DIR = Path(__file__).resolve().parent

# Carpeta de álbumes
ALBUMS_DIR = BASE_DIR / "albums"


def buscar_albums():
    """
    Busca todas las carpetas dentro de albums
    """

    if not ALBUMS_DIR.exists():
        print()
        print(f"ERROR: No existe la carpeta:")
        print(ALBUMS_DIR)
        print()
        return []

    albums = []

    for item in ALBUMS_DIR.iterdir():

        if item.is_dir():
            albums.append(item)

    albums.sort(key=lambda x: x.name.lower())

    return albums


def seleccionar_album(albums):

    print()
    print("========================================")
    print("ATLAS MEMORIES")
    print("Analizador de álbumes")
    print("========================================")
    print()

    for indice, album in enumerate(albums, start=1):
        print(f"{indice}) {album.name}")

    print()

    while True:

        opcion = input("Selecciona un álbum: ").strip()

        try:

            numero = int(opcion)

            if 1 <= numero <= len(albums):
                return albums[numero - 1]

        except ValueError:
            pass

        print("Opción no válida.")
        print()


def main():

    albums = buscar_albums()

    if not albums:
        return

    album = seleccionar_album(albums)

    media_dir = album / "media"

    if not media_dir.exists():

        print()
        print("ERROR: no existe la carpeta media")
        print(media_dir)
        print()

        return

    extensiones = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".tif",
        ".tiff"
    }

    fotos = []

    for archivo in media_dir.rglob("*"):

        if (
            archivo.is_file()
            and archivo.suffix.lower() in extensiones
        ):
            fotos.append(archivo)

    fotos.sort()

    print()
    print(f"Álbum seleccionado: {album.name}")
    print(f"Fotos encontradas: {len(fotos)}")
    print()

    for foto in fotos[:10]:
        print(f" - {foto.name}")

    if len(fotos) > 10:
        print("...")


if __name__ == "__main__":
    main()