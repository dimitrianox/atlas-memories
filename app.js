"use strict";

//==========================================================
// ATLAS MEMORIES
//==========================================================

const Atlas = {

    config:{

        defaultAlbum:"londres-2025",

        animation:500

    },

    state:{

        current:0,

        target:0,

        busy:false,

        opened:false

    },

    data:{

        album:null,

        metadata:{},

        pages:[]

    },

    ui:{},

    cache:{},

    touch:{

        startX:0,

        startY:0,

        currentX:0,

        moving:false

    }

};

//==========================================================

document.addEventListener(

    "DOMContentLoaded",

    inicializar

);

//==========================================================

async function inicializar()
{

    capturarUI();

    registrarEventos();

    await iniciar();

}

//==========================================================

function capturarUI()
{

    Atlas.ui.app=document.getElementById("app");

    Atlas.ui.book=document.getElementById("book");

    Atlas.ui.page=document.getElementById("page");

    Atlas.ui.media=document.getElementById("media");

    Atlas.ui.primary=document.getElementById("primaryImage");

    Atlas.ui.secondary=document.getElementById("secondaryImage");

    Atlas.ui.video=document.getElementById("video");

    Atlas.ui.overlay=document.getElementById("overlay");

    Atlas.ui.title=document.getElementById("title");

    Atlas.ui.location=document.getElementById("location");

    Atlas.ui.date=document.getElementById("date");

    Atlas.ui.fade=document.getElementById("fade");

}

//==========================================================
// INICIO
//==========================================================

async function iniciar()
{

    const albumId=obtenerAlbum();

    await cargarAlbum(albumId);

    await cargarMetadata(albumId);

    construirPaginas();

    mostrarPagina(0);

    abrirLibro();

}

//==========================================================

function obtenerAlbum()
{

    const params=new URLSearchParams(

        window.location.search

    );

    return(

        params.get("album")

        ||

        Atlas.config.defaultAlbum

    );

}

//==========================================================

async function cargarAlbum(albumId)
{

    const response=await fetch(

        `albums/${albumId}/album.json`

    );

    Atlas.data.album=

        await response.json();

    Atlas.data.albumId=albumId;

}

//==========================================================

async function cargarMetadata(albumId)
{

    try
    {

        const response=await fetch(

            `albums/${albumId}/metadata.json`

        );

        Atlas.data.metadata=

            await response.json();

    }

    catch
    {

        Atlas.data.metadata={};

    }

}

//==========================================================

function construirPaginas()
{

    Atlas.data.pages=[];

    for(const item of Atlas.data.album.items)
    {

        const extra=

            Atlas.data.metadata[item.file]

            ||

            {};

        Atlas.data.pages.push({

            type:item.type,

            file:item.file,

            date:item.date,

            title:extra.title||"",

            location:extra.location||"",

            description:extra.description||"",

            visible:extra.visible!==false

        });

    }

}

//==========================================================
// PÁGINA
//==========================================================

function mostrarPagina(index)
{

    if(index<0)return;

    if(index>=Atlas.data.pages.length)return;

    Atlas.state.current=index;

    const page=Atlas.data.pages[index];

    actualizarOverlay(page);

    if(page.type==="photo")
    {

        mostrarImagen(page);

    }
    else
    {

        mostrarVideo(page);

    }

}

//==========================================================

function actualizarOverlay(page)
{

    if(page.visible===false)
    {

        Atlas.ui.title.textContent="";

        Atlas.ui.location.textContent="";

        Atlas.ui.date.textContent="";

        return;

    }

    Atlas.ui.title.textContent=

        page.title;

    Atlas.ui.location.textContent=

        page.location;

    Atlas.ui.date.textContent=

        convertirFecha(page.date);

}

//==========================================================

function mostrarImagen(page)
{

    Atlas.ui.video.pause();

    Atlas.ui.video.style.display="none";

    Atlas.ui.primary.style.display="block";

    Atlas.ui.secondary.style.display="none";

    Atlas.ui.primary.src=

        `albums/${Atlas.data.albumId}/media/${page.file}`;

}

//==========================================================

function mostrarVideo(page)
{

    Atlas.ui.primary.style.display="none";

    Atlas.ui.secondary.style.display="none";

    Atlas.ui.video.style.display="block";

    Atlas.ui.video.src=

        `albums/${Atlas.data.albumId}/media/${page.file}`;

    Atlas.ui.video.play();

}

//==========================================================
// NAVEGACIÓN
//==========================================================

function cambiarPagina(direccion)
{

    if(Atlas.state.busy)return;

    const destino=

        Atlas.state.current+direccion;

    if(destino<0)return;

    if(destino>=Atlas.data.pages.length)
    {

        cerrarLibro();

        return;

    }

    Atlas.state.busy=true;

    mostrarPagina(destino);

    setTimeout(()=>{

        Atlas.state.busy=false;

    },Atlas.config.animation);

}

//==========================================================

function registrarEventos()
{

    document.addEventListener(

        "click",

        e=>{

            if(e.clientX>

                window.innerWidth/2)

            {

                cambiarPagina(1);

            }
            else
            {

                cambiarPagina(-1);

            }

        }

    );

}

//==========================================================

function abrirLibro()
{

    requestAnimationFrame(()=>{

        document.body.classList.add("ready");

        Atlas.state.opened=true;

    });

}

//==========================================================

function cerrarLibro()
{

    document.body.classList.remove("ready");

}

//==========================================================

function convertirFecha(fecha)
{

    if(!fecha)return"";

    const meses=[

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

    const p=fecha.split(":");

    if(p.length<2)return fecha;

    return`${meses[parseInt(p[1])-1]} · ${p[0]}`;

}