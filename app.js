// ==========================================================
// ATLAS MEMORIES v2
// ==========================================================

// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const DEFAULT_ALBUM = "londres-2025";

// ==========================================================
// VARIABLES GLOBALES
// ==========================================================

let albumId = "";
let albumData = {};
let metadata = {};
let pages = [];

let currentPage = 0;

// ==========================================================
// INICIO
// ==========================================================

window.addEventListener("load", iniciar);

// ==========================================================
// INICIAR
// ==========================================================

async function iniciar()
{

    albumId = obtenerAlbum();

    await cargarAlbum();

    construirPaginas();

    mostrarPagina(0);

}

// ==========================================================
// OBTENER ÁLBUM
// ==========================================================

function obtenerAlbum()
{

    const params =
        new URLSearchParams(window.location.search);

    const album =
        params.get("album");

    if(album)
    {

        return album;

    }

    return DEFAULT_ALBUM;

}

// ==========================================================
// CARGAR ÁLBUM
// ==========================================================

async function cargarAlbum()
{

    const albumResponse =
        await fetch(`albums/${albumId}/album.json`);

    albumData =
        await albumResponse.json();

    try
    {

        const metadataResponse =
            await fetch(`albums/${albumId}/metadata.json`);

        metadata =
            await metadataResponse.json();

    }
    catch
    {

        metadata = {};

    }

}

// ==========================================================
// CONSTRUIR PÁGINAS
// ==========================================================

function construirPaginas()
{

    pages = [];

    albumData.items.forEach(item => {

        const extra =
            metadata[item.file] || {};

        pages.push({

            type: item.type,

            file: item.file,

            date: item.date,

            title:
                extra.title || "",

            location:
                extra.location || "",

            description:
                extra.description || "",

            visible:
                extra.visible !== false

        });

    });

}

// ==========================================================
// MOSTRAR PÁGINA
// ==========================================================

function mostrarPagina(index)
{

    if(index < 0)
    {

        return;

    }

    if(index >= pages.length)
    {

        return;

    }

    currentPage = index;

    const page = pages[index];

    const app =
        document.getElementById("app");

    app.innerHTML = "";

    const book =
        document.createElement("div");

    book.id = "book";

    const container =
        document.createElement("div");

    container.className =
        "page fade-in";

    // ======================================================
    // IMAGEN / VIDEO
    // ======================================================

    if(page.type === "photo")
    {

        const img =
            document.createElement("img");

        img.src =
            `albums/${albumId}/media/${page.file}`;

        img.alt =
            page.title || page.file;

        container.appendChild(img);

    }
    else
    {

        const video =
            document.createElement("video");

        video.src =
            `albums/${albumId}/media/${page.file}`;

        video.autoplay = true;

        video.controls = false;

        video.loop = false;

        video.playsInline = true;

        container.appendChild(video);

    }

    // ======================================================
    // INFORMACIÓN
    // ======================================================

    if(page.visible)
    {

        const info =
            document.createElement("div");

        info.className = "info";

        const title =
            document.createElement("div");

        title.className = "title";

        title.textContent =
            page.title;

        const location =
            document.createElement("div");

        location.className =
            "location";

        location.textContent =
            page.location;

        const date =
            document.createElement("div");

        date.className =
            "date";

        date.textContent =
            convertirFecha(page.date);

        info.appendChild(title);

        info.appendChild(location);

        info.appendChild(date);

        container.appendChild(info);

    }

    book.appendChild(container);

    app.appendChild(book);

}

// ==========================================================
// CONVERTIR FECHA
// ==========================================================

function convertirFecha(fecha)
{

    if(!fecha)
    {

        return "";

    }

    const meses = [

        "ENERO",
        "FEBRERO",
        "MARZO",
        "ABRIL",
        "MAYO",
        "JUNIO",
        "JULIO",
        "AGOSTO",
        "SEPTIEMBRE",
        "OCTUBRE",
        "NOVIEMBRE",
        "DICIEMBRE"

    ];

    const partes =
        fecha.split(":");

    if(partes.length < 2)
    {

        return fecha;

    }

    const año =
        partes[0];

    const mes =
        meses[parseInt(partes[1]) - 1];

    return `${mes} · ${año}`;

}

