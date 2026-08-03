// ==========================================================
// ATLAS MEMORIES
// Motor v2
// ==========================================================

// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const DEFAULT_ALBUM = "londres-2025";

// ==========================================================
// ESTADO GLOBAL
// ==========================================================

const Atlas = {

    albumId: null,

    album: null,

    metadata: {},

    pages: [],

    current: 0

};

// ==========================================================
// INICIO
// ==========================================================

document.addEventListener("DOMContentLoaded", iniciar);

// ==========================================================
// INICIAR
// ==========================================================

async function iniciar()
{

    Atlas.albumId = obtenerAlbum();

    await cargarDatos();

    prepararPaginas();

    render();

}

// ==========================================================
// OBTENER ALBUM
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
// CARGAR DATOS
// ==========================================================

async function cargarDatos()
{

    const albumResponse =
        await fetch(

            `albums/${Atlas.albumId}/album.json`

        );

    Atlas.album =
        await albumResponse.json();

    try
    {

        const metadataResponse =
            await fetch(

                `albums/${Atlas.albumId}/metadata.json`

            );

        Atlas.metadata =
            await metadataResponse.json();

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

        const extra =
            Atlas.metadata[item.file] || {};

        Atlas.pages.push({

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
// RENDER
// ==========================================================

function render()
{

    const app =
        document.getElementById("app");

    app.innerHTML = "";

    const book =
        document.createElement("div");

    book.id = "book";

    app.appendChild(book);

    mostrarPagina(Atlas.current);

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

    const page =
        Atlas.pages[index];

    const book =
        document.getElementById("book");

    book.innerHTML = "";

    const container =
        document.createElement("div");

    container.className = "page fade-in";

    // ======================================================
    // FOTO / VIDEO
    // ======================================================

    if(page.type === "photo")
    {

        const img =
            document.createElement("img");

        img.src =
            `albums/${Atlas.albumId}/media/${page.file}`;

        img.alt =
            page.title || page.file;

        container.appendChild(img);

    }
    else
    {

        const video =
            document.createElement("video");

        video.src =
            `albums/${Atlas.albumId}/media/${page.file}`;

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

        location.className = "location";

        location.textContent =
            page.location;

        const date =
            document.createElement("div");

        date.className = "date";

        date.textContent =
            convertirFecha(page.date);

        info.appendChild(title);

        info.appendChild(location);

        info.appendChild(date);

        container.appendChild(info);

    }

    book.appendChild(container);

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

    const partes = fecha.split(":");

    if(partes.length < 2)
    {

        return fecha;

    }

    const año = partes[0];

    const mes = meses[parseInt(partes[1]) - 1];

    return `${mes} · ${año}`;

}

// ==========================================================
// MANEJO DE ERRORES
// ==========================================================

window.addEventListener("error", e => {

    mostrarError(e.message);

});

window.addEventListener("unhandledrejection", e => {

    mostrarError(e.reason);

});

function mostrarError(error)
{

    const app =
        document.getElementById("app");

    app.innerHTML = `

        <div
            style="
                width:100%;
                height:100%;
                display:flex;
                flex-direction:column;
                justify-content:center;
                align-items:center;
                background:#000;
                color:#fff;
                font-family:Manrope,sans-serif;
                padding:32px;
                text-align:center;
            ">

            <h2
                style="
                    font-weight:300;
                    margin-bottom:18px;
                ">
                Atlas Memories
            </h2>

            <p
                style="
                    opacity:.75;
                    line-height:1.6;
                    max-width:420px;
                ">

                No fue posible cargar el álbum.

            </p>

            <br>

            <code
                style="
                    opacity:.55;
                    font-size:13px;
                    word-break:break-word;
                ">

                ${error}

            </code>

        </div>

    `;

}