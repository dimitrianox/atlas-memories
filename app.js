"use strict";

//==========================================================
// ATLAS MEMORIES
//==========================================================

const Atlas={

    config:{

        defaultAlbum:"londres-2025",

        animation:250

    },

    state:{

        current:0,

        busy:false,

        showingPrimary:true

    },

    data:{

        album:null,

        metadata:{},

        pages:[],

        albumId:""

    },

    ui:{}

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

    await cargarAlbum();

    construirPaginas();

    mostrarPagina(0);

    document.body.classList.add("ready");

}

//==========================================================

function capturarUI()
{

    Atlas.ui.primary=document.getElementById("primaryImage");

    Atlas.ui.secondary=document.getElementById("secondaryImage");

    Atlas.ui.video=document.getElementById("video");

    Atlas.ui.title=document.getElementById("title");

    Atlas.ui.location=document.getElementById("location");

    Atlas.ui.date=document.getElementById("date");

}

//==========================================================

async function cargarAlbum()
{

    const params=new URLSearchParams(location.search);

    Atlas.data.albumId=

        params.get("album")

        ||

        Atlas.config.defaultAlbum;

    const album=await fetch(

        `albums/${Atlas.data.albumId}/album.json`

    );

    Atlas.data.album=

        await album.json();

    try{

        const meta=await fetch(

            `albums/${Atlas.data.albumId}/metadata.json`

        );

        Atlas.data.metadata=

            await meta.json();

    }

    catch{

        Atlas.data.metadata={};

    }

}

//==========================================================
// CONSTRUIR PÁGINAS
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

            visible:extra.visible!==false,

            fit:extra.fit||"cover"

        });

    }

}

//==========================================================
// MOSTRAR PÁGINA
//==========================================================

function mostrarPagina(index)
{

    if(index<0)return;

    if(index>=Atlas.data.pages.length)return;

    Atlas.state.current=index;

    const page=

        Atlas.data.pages[index];

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
// OVERLAY
//==========================================================

function actualizarOverlay(page)
{

    if(!page.visible)
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
// IMÁGENES
//==========================================================

function mostrarImagen(page)
{

    Atlas.ui.video.pause();

    Atlas.ui.video.removeAttribute("src");

    Atlas.ui.video.load();

    Atlas.ui.video.style.display="none";

    const visible=

        Atlas.state.showingPrimary

        ? Atlas.ui.primary

        : Atlas.ui.secondary;

    const oculta=

        Atlas.state.showingPrimary

        ? Atlas.ui.secondary

        : Atlas.ui.primary;

    oculta.style.objectFit=page.fit;

    oculta.onload=()=>{

        oculta.style.display="block";

        oculta.style.opacity="1";

        visible.style.opacity="0";

        visible.style.display="none";

        Atlas.state.showingPrimary=

            !Atlas.state.showingPrimary;

        oculta.onload=null;

    };

    oculta.src=

        `albums/${Atlas.data.albumId}/media/${page.file}`;

}

//==========================================================
// VIDEO
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

    if(destino>=Atlas.data.pages.length)return;

    Atlas.state.busy=true;

    mostrarPagina(destino);

    setTimeout(()=>{

        Atlas.state.busy=false;

    },Atlas.config.animation);

}

//==========================================================
// EVENTOS
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
// FECHA
//==========================================================

function convertirFecha(fecha)
{

    if(!fecha)return"";

    const p=fecha.split(":");

    if(p.length<2)return fecha;

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

    return `${meses[parseInt(p[1])-1]} · ${p[0]}`;

}

//==========================================================
// SWIPE
//==========================================================

function activarSwipe()
{

    const zona=document.getElementById("media");

    let inicioX=0;
    let inicioY=0;

    let deltaX=0;

    zona.addEventListener("touchstart",touchStart,{passive:true});
    zona.addEventListener("touchmove",touchMove,{passive:true});
    zona.addEventListener("touchend",touchEnd,{passive:true});

    function touchStart(e)
    {

        if(Atlas.state.busy)return;

        const t=e.touches[0];

        inicioX=t.clientX;
        inicioY=t.clientY;

        deltaX=0;

    }

    function touchMove(e)
    {

        if(Atlas.state.busy)return;

        const t=e.touches[0];

        deltaX=t.clientX-inicioX;

        const img=

            Atlas.state.showingPrimary

            ? Atlas.ui.primary

            : Atlas.ui.secondary;

        img.style.transition="none";

        img.style.transform=

            `translateX(${deltaX}px)`;

    }

    function touchEnd()
    {

        if(Atlas.state.busy)return;

        const img=

            Atlas.state.showingPrimary

            ? Atlas.ui.primary

            : Atlas.ui.secondary;

        img.style.transition="transform .25s ease";

        img.style.transform="translateX(0)";

        if(Math.abs(deltaX)>90)
        {

            cambiarPagina(

                deltaX<0

                ?1

                :-1

            );

        }

    }

}

//==========================================================
// PRECARGA
//==========================================================

function precargarSiguiente()
{

    const siguiente=

        Atlas.state.current+1;

    if(siguiente>=Atlas.data.pages.length)
    {

        return;

    }

    const page=

        Atlas.data.pages[siguiente];

    if(page.type!=="photo")
    {

        return;

    }

    const img=new Image();

    img.src=

        `albums/${Atlas.data.albumId}/media/${page.file}`;

}

//==========================================================
// PRECARGA ANTERIOR
//==========================================================

function precargarAnterior()
{

    const anterior=

        Atlas.state.current-1;

    if(anterior<0)
    {

        return;

    }

    const page=

        Atlas.data.pages[anterior];

    if(page.type!=="photo")
    {

        return;

    }

    const img=new Image();

    img.src=

        `albums/${Atlas.data.albumId}/media/${page.file}`;

}

//==========================================================
// PRECARGAR ALREDEDOR
//==========================================================

function precargar()
{

    precargarAnterior();

    precargarSiguiente();

}

//==========================================================
// INICIAR MOTOR
//==========================================================

function iniciarMotor()
{

    activarSwipe();

    precargar();

}

//==========================================================
// RECARGAR MOTOR
//==========================================================

function actualizarMotor()
{

    precargar();

}

//==========================================================
// ESTADO
//==========================================================

function paginaActual()
{

    return Atlas.data.pages[

        Atlas.state.current

    ];

}

function paginaSiguiente()
{

    const i=

        Atlas.state.current+1;

    if(i>=Atlas.data.pages.length)
    {

        return null;

    }

    return Atlas.data.pages[i];

}

function paginaAnterior()
{

    const i=

        Atlas.state.current-1;

    if(i<0)
    {

        return null;

    }

    return Atlas.data.pages[i];

}

//==========================================================
// ARRANQUE DEL MOTOR
//==========================================================

window.addEventListener(

    "load",

    ()=>{

        iniciarMotor();

    }

);

//==========================================================
// OBSERVAR CAMBIO DE PÁGINA
//==========================================================

const mostrarPaginaOriginal=

    mostrarPagina;

mostrarPagina=function(index)
{

    mostrarPaginaOriginal(index);

    actualizarMotor();

};

//==========================================================
// LIMPIEZA
//==========================================================

window.addEventListener(

    "blur",

    ()=>{

        Atlas.ui.video.pause();

    }

);

window.addEventListener(

    "focus",

    ()=>{

        const page=

            paginaActual();

        if(page && page.type==="video")
        {

            Atlas.ui.video.play();

        }

    }

);

//==========================================================
// FIN APP
//==========================================================


