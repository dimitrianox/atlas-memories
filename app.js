// ==========================================================
// ATLAS MEMORIES
// Motor v3
// ==========================================================

const DEFAULT_ALBUM = "londres-2025";

const Atlas = {

    albumId: "",

    album: null,

    metadata: {},

    pages: [],

    current: 0,

    busy: false

};

document.addEventListener(

    "DOMContentLoaded",

    iniciar

);

// ==========================================================
// INICIO
// ==========================================================

async function iniciar()
{

    Atlas.albumId = obtenerAlbum();

    await cargarAlbum();

    prepararPaginas();

    construirLibro();

    mostrarPagina(0);

    registrarEventos();

}

// ==========================================================
// OBTENER ÁLBUM
// ==========================================================

function obtenerAlbum()
{

    const params = new URLSearchParams(

        location.search

    );

    return params.get("album")

        || DEFAULT_ALBUM;

}

// ==========================================================
// CARGAR DATOS
// ==========================================================

async function cargarAlbum()
{

    const respuesta = await fetch(

        `albums/${Atlas.albumId}/album.json`

    );

    Atlas.album = await respuesta.json();

    try
    {

        const extra = await fetch(

            `albums/${Atlas.albumId}/metadata.json`

        );

        Atlas.metadata = await extra.json();

    }

    catch
    {

        Atlas.metadata = {};

    }

}

// ==========================================================
// PREPARAR PÁGINAS
// ==========================================================

function prepararPaginas()
{

    Atlas.pages = [];

    Atlas.album.items.forEach(item => {

        const extra = Atlas.metadata[item.file] || {};

        Atlas.pages.push({

            type: item.type,

            file: item.file,

            date: item.date,

            title: extra.title || "",

            location: extra.location || "",

            description: extra.description || "",

            visible: extra.visible !== false

        });

    });

}

// ==========================================================
// CONSTRUIR LIBRO
// ==========================================================

function construirLibro()
{

    const app = document.getElementById("app");

    app.innerHTML = "";

    const page = document.createElement("div");

    page.id = "page";

    const media = document.createElement("div");

    media.id = "media";

    const info = document.createElement("div");

    info.id = "info";

    const title = document.createElement("h1");

    title.id = "title";

    const location = document.createElement("p");

    location.id = "location";

    const date = document.createElement("p");

    date.id = "date";

    info.appendChild(title);

    info.appendChild(location);

    info.appendChild(date);

    page.appendChild(media);

    page.appendChild(info);

    app.appendChild(page);

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

    if(index >= Atlas.pages.length)
    {

        return;

    }

    Atlas.current = index;

    const page = Atlas.pages[index];

    const media =
        document.getElementById("media");

    const title =
        document.getElementById("title");

    const location =
        document.getElementById("location");

    const date =
        document.getElementById("date");

    media.replaceChildren();

    if(page.type === "photo")
    {

        const img = new Image();

        img.src =
            `albums/${Atlas.albumId}/media/${page.file}`;

        img.alt = "";

        media.appendChild(img);

    }
    else
    {

        const video =
            document.createElement("video");

        video.src =
            `albums/${Atlas.albumId}/media/${page.file}`;

        video.playsInline = true;

        video.autoplay = true;

        video.controls = false;

        video.loop = false;

        media.appendChild(video);

    }

    title.textContent =
        page.title;

    location.textContent =
        page.location;

    date.textContent =
        convertirFecha(page.date);

}

// ==========================================================
// NAVEGACIÓN
// ==========================================================

function siguientePagina()
{

    if(Atlas.busy)
    {

        return;

    }

    if(Atlas.current >= Atlas.pages.length - 1)
    {

        return;

    }

    Atlas.busy = true;

    mostrarPagina(

        Atlas.current + 1

    );

    requestAnimationFrame(() => {

        Atlas.busy = false;

    });

}

function paginaAnterior()
{

    if(Atlas.busy)
    {

        return;

    }

    if(Atlas.current <= 0)
    {

        return;

    }

    Atlas.busy = true;

    mostrarPagina(

        Atlas.current - 1

    );

    requestAnimationFrame(() => {

        Atlas.busy = false;

    });

}

// ==========================================================
// EVENTOS
// ==========================================================

function registrarEventos()
{

    document.addEventListener(

        "click",

        e => {

            const mitad =

                window.innerWidth / 2;

            if(e.clientX > mitad)
            {

                siguientePagina();

            }
            else
            {

                paginaAnterior();

            }

        }

    );

}

// ==========================================================
// FECHA
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

    return `${meses[parseInt(partes[1])-1]} · ${partes[0]}`;

}

