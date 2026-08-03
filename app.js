const CITY = "london";

let cityData = null;

async function loadCity(){

    const response = await fetch(`cities/${CITY}/city.json`);

    if(!response.ok){

        throw new Error("No pude cargar city.json");

    }

    cityData = await response.json();

}

function randomCover(){

    const photos = cityData.items.filter(item => item.type === "photo");

    if(photos.length === 0) return;

    const lastCover = localStorage.getItem("atlas-last-cover");

    let candidates = photos;

    if(lastCover && photos.length > 1){

        candidates = photos.filter(photo => photo.file !== lastCover);

    }

    const cover =
        candidates[Math.floor(Math.random()*candidates.length)];

    document.getElementById("cover-image").src =
        `cities/${CITY}/media/${cover.file}`;

    localStorage.setItem("atlas-last-cover",cover.file);

}

function buildGallery(){

    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    cityData.items.forEach(item => {

        const slide = document.createElement("section");

        slide.className = "slide";

        if(item.type === "photo"){

            const img = document.createElement("img");

            img.src =
                `cities/${CITY}/media/${item.file}`;

            img.loading = "lazy";

            img.draggable = false;

            slide.appendChild(img);

        }
        else{

            const video = document.createElement("video");

            video.src =
                `cities/${CITY}/media/${item.file}`;

            video.preload = "metadata";

            video.controls = true;

            video.playsInline = true;

            slide.appendChild(video);

        }

        gallery.appendChild(slide);

    });

    console.log(
        `Atlas: ${cityData.items.length} elementos cargados.`
    );

}

function bindEvents(){

    let startY = 0;

    document.addEventListener("touchstart", e => {

        startY = e.touches[0].clientY;

    }, { passive:true });

    document.addEventListener("touchend", e => {

        const endY = e.changedTouches[0].clientY;

        const deltaY = startY - endY;

        /*
            De momento el swipe vertical
            SOLO abre el visor.

            El carrusel horizontal lo hará
            el navegador mediante Scroll Snap.
        */

        if(deltaY > 80){

            document.body.classList.add("viewer");

        }

    }, { passive:true });

}

async function init(){

    try{

        await loadCity();

        randomCover();

        buildGallery();

        bindEvents();

        console.log("Atlas iniciado correctamente.");

    }
    catch(error){

        console.error(error);

        alert("No pude cargar la ciudad.");

    }

}

init();
