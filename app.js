let startY = 0;

const CITY = "london";

async function iniciar() {

    const respuesta = await fetch(`cities/${CITY}/city.json`);

    const datos = await respuesta.json();

    console.log(datos);

    const fotos = datos.items.filter(i => i.type === "photo");

let ultimaPortada = localStorage.getItem("ultimaPortada");

let disponibles = fotos;

if (fotos.length > 1 && ultimaPortada) {

    disponibles = fotos.filter(f => f.file !== ultimaPortada);

}

const portada =
    disponibles[Math.floor(Math.random() * disponibles.length)];

if (portada) {

    document.getElementById("cover-image").src =
        `cities/${CITY}/media/${portada.file}`;

    localStorage.setItem("ultimaPortada", portada.file);

}

const gallery = document.getElementById("gallery");

datos.items.forEach(item => {

    const slide = document.createElement("section");

    slide.className = "slide";

    if (item.type === "photo") {

        const img = document.createElement("img");

        img.src = `cities/${CITY}/media/${item.file}`;

        slide.appendChild(img);

    } else {

        const video = document.createElement("video");

        video.src = `cities/${CITY}/media/${item.file}`;

        video.preload = "metadata";

        video.controls = true;

        slide.appendChild(video);

    }

    gallery.appendChild(slide);

});

}

iniciar();

document.addEventListener("touchstart", e=>{

    startY = e.touches[0].clientY;

});

document.addEventListener("touchend", e=>{

    const endY = e.changedTouches[0].clientY;

    const diff = startY - endY;

if(diff > 80){

    document.body.classList.add("open");

    setTimeout(() => {

        const gallery = document.getElementById("gallery");

        gallery.scrollTop = 0;

    },700);

}

});
