import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//SCENE SET UP ----------------------------------------------------------------------------

//SCENE
const scene = new THREE.Scene();

//SIZES FOR WINDOW RESIZING
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

//LIGHTS
const light = new THREE.PointLight(0xffffff, 130, 100);
light.position.set(0, 10, 10)
scene.add(light);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.7);
scene.add(hemiLight);

//CAMERA
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 13;
camera.position.y = 7;
camera.position.x = 9;
scene.add(camera);

//RENDERER
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(2);
renderer.setClearColor(0x000000, 0)
renderer.render(scene, camera);

//ORBIT CONTROLS
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.2
controls.minDistance = 5;
controls.maxDistance = 30;
//controls.enablePan = false
//controls.enableZoom = false
console.log(controls);


//BACKGROUND --------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const blurAmount = 80;  // Fixed blur value
    const spots = [
        { top: "8%", left: "30%", size: 300 },  // Position and size for spot 1
        { top: "30%", left: "65%", size: 260 },  // Position and size for spot 2
        { top: "60%", left: "40%", size: 250 },  // Position and size for spot 3
        { top: "50%", left: "15%", size: 230 },  // Position and size for spot 4
        { top: "80%", left: "65%", size: 300 },  // Position and size for spot 5
        { top: "5%", left: "90%", size: 240 },  // Position and size for spot 6
    ];

    // Loop through each spot and create the corresponding element
    spots.forEach((spot) => {
        let div = document.createElement("div");
        div.classList.add("blurred-spot");

        // Set individual spot's styles
        div.style.top = spot.top;
        div.style.left = spot.left;
        div.style.width = `${spot.size}px`;
        div.style.height = `${spot.size}px`;
        div.style.filter = `blur(${blurAmount}px)`;  // Apply the blur

        // Append the spot to the body
        body.appendChild(div);
    });
});

//IMPORT MODEL --------------------------------------------------------------------------------

let model;
const loader = new GLTFLoader();
loader.load(
    '/models/PyramidsOfGiza6.glb', 
    function (gltf) {
        model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
            console.log("object in model:", child.name)
        })
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error(error);
    }

);


//RAYCASTING & POPUP ---------------------------------------------------------------------------

//POP UP INFO

const popupTexts = {
    "Pyramid_L": `
    <h2>The Great Pyramid of Giza</h2>
    <ul>
        <li>The Great Pyramid was built for Pharaoh Khufu and was completed around 2560 BC, used 2.3 million blocks of stone and took 27 years to build.</li>
        <li>It is also the oldest and tallest of all of the ancient wonders, remaining the tallest man made structure for 3,800 years as well as the only wonder that can still be seen today.</li>
        <li>Pharaoh Khufu was the second king in the 4th dynasty and it is thought he ruled from around 2500 - 2480 BC.</li>
    </ul>
    `,
    "Pyramid_M": `
    <h2>Pyramid of Khafre</h2>
    <ul>
        <li>This Pyramid is the tomb for Pharaoh Khafre and was completed at around 2570 BC.</li>
        <li>It is slightly smaller than the Great Pyramid.</li>
        <li>Khafre was another king in the 4th dynasty, and the son of Khufu, who may have ruled for 25 years from around 2475 - 2450 BC.</li>
        </ul>
    `,
    "Pyramid_S": `
    <h2>Pyramid of Menkaure</h2>
    <ul>
        <li>This is the smallest pyramid and constructed for Pharaoh Menkaure at around 2510 BC.</li>
        <li>Menkaure was the fifth or sixth king in the 4th dynasty who may have ruled for around 25 years in the 24th century. He was the son of Khafre and grandson of Khufu. </li>
    </ul>
    `,
    "West Cemetery": `
    <h2>Pyramid of Menkaure</h2>
    <ul>
        <li>This is the smallest pyramid and constructed for Pharaoh Menkaure at around 2510 BC.</li>
    </ul>
    `,
    "water": `
    <h2>The River Nile</h2>
    <ul>
        <li>At the time of building, there was another branch of The River Nile that was much closer to the pyramids than it is today, this is called the Khufu branch.</li>
        <li>There is debate as to how the pyramids were constructed but there is a strong theory that this branch of the river was used to move the 2.3 ton stone blocks used as building materials from the quarries to the site of the pyramids.</li>
    </ul>
    `,
    "burials": `
    <h2>Other Burial Sites</h2>
    <ul>
        <li>There were additional, smaller pyramids used for burying Queens and other members of the royal family near the Pharaoh's pyramid.</li>
        <li>There is also the Western Cemetery between The Great Pyramid and the Pyramid of Khafre, which was used to bury lesser nobles and members of the royal family.</li>
    </ul>
    `,
    "extra_bits": `
    <h2>Mortuary and Valley Temples</h2>
    <ul>
        <li>There are <span class="clickable-word" data-word="Mortuary Temple">mortuary temples</span> located near the pyramids which were used by priests to worship the dead Pharaohs.</li>
        <li>These were connected to a Valley Temple at the edge of the Nile floodplain.</li>
    </ul>
    `,
    "Sphinx": `
    <h2>The Sphinx</h2>
    <ul>
        <li>The Sphinx was built during the reign of Khafre and is known the be a portrait of the king.</li>
        <li>Famously, it has the body of a lion and the face of a man and was carved directly into the limestone bedrock, then covered in plaster.</li>
    </ul>
    `,
};

//POP UP FUNCTIONALITY 

const allowedParts = ["Pyramid_L", "Pyramid_M", "Pyramid_S", "burials", "Sphinx", "extra_bits", "water"]                                 //list of the items named in blender which are selectable / will produce a pop up when the ray intersects on mouse down

const hoverColours = {
    "water": 0x088F8F
}

const coords = new THREE.Vector2()                                                           //this needs to be delcared here outside of the onMouseDown function so it can be accessed globally by the showPopup function
const raycaster = new THREE.Raycaster()                                                      //defining the raycaster
let lastHovered = null                                                                       //empty now but used later 

let popup = document.querySelector('.popup')                                                 //the popup is an HTML element made in that file so it needs to be referenced here so that it can be manipulated with JS
document.addEventListener('mousedown', onMouseDown)                                          //Mouse event handler -> listenes to 'mousedown' and 'onMouseDown' is the name of a function
document.addEventListener('mousemove', onMouseMove)

//CLICK MODEL & MAKE POP UP
function onMouseDown(event){                                                                 //defining and calculating the mouse coordinates
    coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
    coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  
 
    raycaster.setFromCamera(coords, camera)                                                  //projects a ray from the camera to the coordinates of the mouse click position in 3D space

    if(model) {                                                                              //checking for intersections in the ray with objects & returns an array of what has been intersected
        const intersects = raycaster.intersectObject(model, true)                            //true = check all children of the model -> this is what lets you select specific parts of the model bc without it, the ray only checks the top level object and ignores the inner meshes 

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object                                      //intersects[0] is the array that's returned which includes everything that was intersected and [0] just means the first item in that array so if there are multiple parts of a model, only the closest one is selected -> now 'selectedObject' is storing whatever mesh was clicked
            
            if(allowedParts.includes(selectedObject.name)) {                                 //checks if the selected object is in the list of allowed parts and if it is, run the pop up function
                showPopup(selectedObject)                                                    //calls the pop up function
                return
            }                                          
        }
    }
    if(!popup.contains(event.target) && !event.target.classList.contains("clickable-word")){ //stops the pop up from closing if you click a clickable word that's within that pop up
        popup.style.display = 'none' 
    }
}

//HOVER STATE GLOW FUNCTION
function onMouseMove(event){                                                            
    coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
    coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  

raycaster.setFromCamera(coords, camera)                                             

if(model) {                                                                         
    const intersects = raycaster.intersectObject(model, true)                       

    if (intersects.length > 0) {
        let hoveredObject = intersects[0].object                                 
        
        if(allowedParts.includes(hoveredObject.name)) {                                      //hoveredObject = name for selectedObject in this function and it checks to see if that object is in the allowed objects list
            document.body.style.cursor = "pointer"

            if (lastHovered && lastHovered !== hoveredObject) {                              //if it's a new object being hovered, resest the last one to have no glow
                lastHovered.material.emissive.set(0x000000)                                  //remove glow from previous object
            }

            const hoverColour = hoverColours[hoveredObject.name] || 0xFFF8DC               //use the colour assigned to that hovered object detailed in the list under 'hoverColours' or if none are available, use this colour
            hoveredObject.material.emissive.set(hoverColour)                                 //apply glow effect
            hoveredObject.material.emissiveIntensity = 0.5
            lastHovered = hoveredObject                                                      //update lastHovered to be the same as what is hovered -> need this so that when the checking line runs again, lastHovered has value of whatever was just hovered over  STORE THE HOVERED OBJECT
        
        } else {                                                                             //removes the glow from a hovered object that isn't in the allowed list
            document.body.style.cursor = "default"
            if (lastHovered){
                lastHovered.material.emissive.set(0x000000)
                lastHovered = null 
            }                                                              
        }                                                
    } else {                                                                                 //removes the glow if the user isn't hovering over anything
        document.body.style.cursor = "default"
        if (lastHovered){ 
            lastHovered.material.emissive.set(0x000000)
            lastHovered = null 
        }                                                                
    }
}
}

//POP UP POSITION FUNCTION
 function showPopup(part){                                                                   //in this function 'part' is = to 'selectedObject' -> doesn't have to be different for this function, it's just because it's easier to write and read
    const text = popupTexts[part.name] || "Nothing here"                                     //either display the text that is assigned to the allowed object that's been selected or display 'nothing here'
    
    popup.innerHTML = text                                                                   //controls the text that's displayed in the pop up
    popup.style.display = 'block'
 }



 //RENDER ANIMATION LOOP ---------------------------------------------------------------------------

//RESIZE WINDOW
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})
                                                                                            //idk why but you need this to be able to see the imported model even though you can see a sphere in the scene - there must be something in the code above that needs this to work but idk what that would be
const loop = () => {                                                                        //loop makes it keep rendering and updating position based on window size
    controls.update()                                                                       //the camera movement keeps going after you let go, works with damping and orbit controls
    renderer.render(scene, camera)                                                          //this line and the one below are the ones that are needed to see the imported model
    window.requestAnimationFrame(loop)                                                      //I think this is what keeps updating the animation part and it's calling on the 'loop' thing
}


//DEFINITION POP UPS ---------------------------------------------------------------------------

const definitions = {
    "Giza Necropolis": [
        { title: "Giza Necropolis", text: "Archaeological site made up of pyramids, temples, tombs, and cemeteries." },
        { title: "Necropolis", text: "The <strong>4th dynasty</strong> was from around 2610 - 2490 BC." }
    ],
    "Pharaoh": [{ title: "Pharaoh", text: "A king in ancient Egypt." }],
    "4th dynasty": [
        { title: "Dynasty", text: "Archaeological site made up of pyramids, temples, tombs, and cemeteries." },
        { title: "4th Dynasty", text: "The 4th dynasty was from around 2610 - 2490 BC." }
    ], 
    "Tomb": [{ title: "Tomb", text: "An underground vault or large stone structure used for burying someone, usually an important person."}],
    "Mortuary Temple": [{ title: "Mortuary Temple", text: "An ancient Egyptian place of worship for a deceased Pharaoh where food and objects would be offered to him. Priests would perform regular ceremonies and present the offerings to the Pharaoh’s spirit."}],
}

//function shows the definition pop up
function showDefinitionPopup(word, x, y, isInPopup) {
    //remove any existing definition pop ups
    const existingDefPopup = document.querySelector(".definition-popup")                                 
    if (existingDefPopup) {
        existingDefPopup.remove()
    }

    //create new pop up
    const definitionPopup = document.createElement("div")
    definitionPopup.classList.add("definition-popup")

    //turns single definition words into an array or turns the single word clickable word into an array
    const definitionsArray = Array.isArray(definitions[word]) ? definitions[word] : [{ title: "Definition", text: definitions[word] }];

    //joins the multiple definitions with line breaks
    const definitionsHTML = definitionsArray.map(def => `                               
        <div class="popup-section">
            <p class="popup-title">${def.title}</p>
            <p class="popup-text">${def.text}</p>
        </div>
    `).join("");   
    
    
    definitionPopup.innerHTML = `   
    <div class="popup-content">
            ${definitionsHTML}
        </div>
    `;

    //position pop up wherever was clicked - if it was in the information pop up then put it on the left of the mouse, but if it was anywhere else then put it on the right
    if (isInPopup) {
        definitionPopup.style.left = `${x - 200}px`   //this number won't work if the size of the pop up changes and replacing left 
    } else {
        definitionPopup.style.left = `${x}px`
    }
    definitionPopup.style.top = `${y}px`

    //append (add?) popup to the HTML body
    document.body.appendChild(definitionPopup)  

    //close pop up if click outside of it
    document.addEventListener("click", (event) => {
        if (!definitionPopup.contains(event.target) && !event.target.classList.contains("clickable-word")) {
            definitionPopup.remove()
        }
    }, { once: true })   //ensures only one event listener is added 
}

// function that listens for clicks on the clickable words
document.addEventListener("click", (event) => {
    //check if the thing that was clicked has the "clickable-word" class
    if (event.target && event.target.classList.contains("clickable-word")) {
        event.stopPropagation()

        const word = event.target.getAttribute("data-word")
        const { clientX: x, clientY: y } = event
        const isInPopup = popup.contains(event.target)

        //if the word is in the definitions list show the word 
        if (definitions[word]) {
            showDefinitionPopup(word, x, y, isInPopup)
        }
    }
})


//MODAL ---------------------------------------------------------------------------

const modal = document.getElementById("modal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");

// open when click button
openModal.addEventListener("click", () => {
    modal.style.display = "flex";
    openModal.classList.add("active")
});

// close when click button
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    openModal.classList.remove("active")
});

// blose when click outside modal
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        openModal.classList.remove("active")
    }
});


loop()





























