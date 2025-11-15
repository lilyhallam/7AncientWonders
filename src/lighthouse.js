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
camera.lookAt(new THREE.Vector3(0,5,0))
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
controls.target.set(0, 2, 0)
controls.enableDamping = true
controls.dampingFactor = 0.2
controls.minDistance = 2;
controls.maxDistance = 30;
controls.update
//controls.enableZoom = false

//BACKGROUND --------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const blurAmount = 80;  // Fixed blur value
    const spots = [
        { top: "8%", left: "40%", size: 300 },  // Position and size for spot 1
        { top: "30%", left: "65%", size: 260 },  // Position and size for spot 2
        { top: "80%", left: "50%", size: 250 },  // Position and size for spot 3
        { top: "50%", left: "20%", size: 230 },  // Position and size for spot 4
        { top: "65%", left: "80%", size: 300 },  // Position and size for spot 5
        { top: "80%", left: "5%", size: 240 },  // Position and size for spot 6
        { top: "5%", left: "5%", size: 240 },  // Position and size for spot 6
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
    '/models/Lighthouse8.glb', 
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

const allowedParts = ["lighthouse", "lighthouse_orange", "lighthouse_medium", "lighthouse_dark", "fort", "fort_orange", "fort_medium", "nest", "nest_orange", "poseidon"]

const popupGroups = {}
const popupGroupings = {
    "lighthousePop" : ["lighthouse", "lighthouse_orange", "lighthouse_medium", "lighthouse_dark"],
    "nestPop" : ["nest", "nest_orange"],
    "fortPop" : ["fort", "fort_orange", "fort_medium"],
    "poseidonPop" : ["poseidon"]
}
Object.entries(popupGroupings).forEach(([popup, objects]) => {
    objects.forEach(obj => popupGroups[obj] = popup)
})

const popupTexts = {
    "lighthousePop": `
    <h2>The Tower</h2>
    <ul>
        <li>It had three sections that all sloped inward slightly. The base was a square, the next was an octagon and the top was cylindrical.</li>
        <li>It also had an internal spiral staircase that led to the top of the tower to the light source.</li>
    </ul>
    `,
    "nestPop": `
    <h2>The Light Source</h2>
    <ul>
        <li>This lighthouse used a fire at the top of the tower to guide the ships into the harbour at night.</li>
        <li>This fire was also enhanced using a burnished bronze mirror.</li>
    </ul>
    `,
    "fortPop": `
    <h2>The Fortress</h2>
    <ul>
        <li>In 1447, the ruins of the base that surrounded the lighthouse were turned into a fortress by a Sultan.</li>
    </ul>
    `,
    "poseidonPop": `
    <h2>Zeus's Throne</h2>
    <ul>
        <li>Some descriptions of the lighthouse mention a statue at the top of the tower.</li>
        <li>It is thought that this was Poseidon , the ancient Greek god of the sea.</li>
        <li>Other possibilities include the ancient Greek god Zeus, Alexander the Great in the form of the sun god Helios or Ptolemy I.</li>
    </ul>
    `,
};

//POP UP FUNCTIONALITY 
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

    if(!model) return                                                                              //checking for intersections in the ray with objects & returns an array of what has been intersected
    const intersects = raycaster.intersectObject(model, true)                            //true = check all children of the model -> this is what lets you select specific parts of the model bc without it, the ray only checks the top level object and ignores the inner meshes 

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object 
            
       const popupId = popupGroups[selectedObject.name]
        if(popupId) {                                   
            showPopup(popupId)     
            return                                               
        }                                          
    }
    popup.style.display = 'none'
}

//POP UP POSITION FUNCTION
function showPopup(part){                                                                   //in this function 'part' is = to 'selectedObject' -> doesn't have to be different for this function, it's just because it's easier to write and read
    const text = popupTexts[part] || "Nothing here"                                     //either display the text that is assigned to the allowed object that's been selected or display 'nothing here'
    
    popup.innerHTML = text                                                                   //controls the text that's displayed in the pop up
    popup.style.display = 'block'
 }

 //HOVER STATE GLOW FUNCTION ---------------------------------------------------------------------------

//colours - 0xFFF8DC = white, 0xFFBF00 = gold, 
const hoverGroups = {
    "lighthouse": [
        { name: "lighthouse", color: 0xFFF8DC},
        { name: "lighthouse_orange", color: 0xFF5F1F},
        { name: "lighthouse_medium", color: 0xFFF8DC},
        { name: "lighthouse_dark", color: 0xFFF8DC},
    ],
    "lighthouse_orange": [
        { name: "lighthouse", color: 0xFFF8DC},
        { name: "lighthouse_orange", color: 0xFF5F1F},
        { name: "lighthouse_medium", color: 0xFFF8DC},
        { name: "lighthouse_dark", color: 0xFFF8DC},
    ],
    "lighthouse_medium": [
        { name: "lighthouse", color: 0xFFF8DC},
        { name: "lighthouse_orange", color: 0xFF5F1F},
        { name: "lighthouse_medium", color: 0xFFF8DC},
        { name: "lighthouse_dark", color: 0xFFF8DC},
    ],
    "lighthouse_dark": [
        { name: "lighthouse", color: 0xFFF8DC},
        { name: "lighthouse_orange", color: 0xFF5F1F},
        { name: "lighthouse_medium", color: 0xFFF8DC},
        { name: "lighthouse_dark", color: 0xFFF8DC},
    ],
    "fort": [
        { name: "fort", color: 0xFFF8DC},
        { name: "fort_medium", color: 0xFFF8DC},
        { name: "fort_orange", color: 0xFF5F1F},
    ],
    "fort_medium": [
        { name: "fort", color: 0xFFF8DC},
        { name: "fort_medium", color: 0xFFF8DC},
        { name: "fort_orange", color: 0xFF5F1F},
    ],
    "fort_orange": [
        { name: "fort", color: 0xFFF8DC},
        { name: "fort_medium", color: 0xFFF8DC},
        { name: "fort_orange", color: 0xFF5F1F},
    ],
    "nest": [
        { name: "nest", color: 0xFFF8DC},
        { name: "nest_orange", color: 0xFF5F1F},
    ],
    "nest_orange": [
        { name: "nest", color: 0xFFF8DC},
        { name: "nest_orange", color: 0xFF5F1F},
    ],
    "poseidon": [
        { name: "poseidon", color: 0xFFF8DC},
    ],
}

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

            if (lastHovered) {                              //if it's a new object being hovered, resest the last one to have no glow
                lastHovered.forEach(obj => obj.material.emissive.set(0x000000))                                  //remove glow from previous object
            }

            let group = hoverGroups[hoveredObject.name] || [{ name: hoveredObject.name, color: 0xFFBF00 }];

            lastHovered = group.map(({ name, color}) => {
                let obj = model.getObjectByName(name)
                if (obj) {
                    obj.material.emissive.set(color)
                    obj.material.emissiveIntensity = 0.5
                }
                return obj
            }).filter(Boolean)        
        } else {                                                                             //removes the glow from a hovered object that isn't in the allowed list
            document.body.style.cursor = "default"
            removeGlow()                                                            
        }                                                
    } else {                                                                                 //removes the glow if the user isn't hovering over anything
        document.body.style.cursor = "default"
        removeGlow()                                                               
    }
}
}

//REMOVE GLOW EFFECT
function removeGlow() {
    if (lastHovered){ 
        lastHovered.forEach(obj => obj.material.emissive.set(0x000000))
        lastHovered = null 
}
}




//RAYCASTING & POPUP ---------------------------------------------------------------------------

//POP UP INFO

// const popupTexts = {
//     "mirror": `
//     <h2>The Tower</h2>
//     <ul>
//     </ul>
//     `,
//     "mirror": `
//     <h2>The Light Source</h2>
//     <ul>
//     </ul>
//     `,
//     "posidon": `
//     <h2>Statue of Posidon</h2>
//     <ul>
//     </ul>
//     `,
//     "fort_beveled": `
//     <h2>The Fort</h2>
//     <ul>
//     </ul>
//     `,
// };

// //POP UP FUNCTIONALITY 

// const allowedParts = ["nest", "posidon", "fort", "lighthouse"]                                 //list of the items named in blender which are selectable / will produce a pop up when the ray intersects on mouse down

// const hoverColours = {
//     "water": 0x088F8F
// }

// const coords = new THREE.Vector2()                                                           //this needs to be delcared here outside of the onMouseDown function so it can be accessed globally by the showPopup function
// const raycaster = new THREE.Raycaster()                                                      //defining the raycaster
// let lastHovered = null                                                                       //empty now but used later 

// let popup = document.querySelector('.popup')                                                 //the popup is an HTML element made in that file so it needs to be referenced here so that it can be manipulated with JS
// document.addEventListener('mousedown', onMouseDown)                                          //Mouse event handler -> listenes to 'mousedown' and 'onMouseDown' is the name of a function
// document.addEventListener('mousemove', onMouseMove)

// //CLICK MODEL & MAKE POP UP
// function onMouseDown(event){                                                                 //defining and calculating the mouse coordinates
//         coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
//         coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  
 
//     raycaster.setFromCamera(coords, camera)                                                  //projects a ray from the camera to the coordinates of the mouse click position in 3D space

//     if(model) {                                                                              //checking for intersections in the ray with objects & returns an array of what has been intersected
//         const intersects = raycaster.intersectObject(model, true)                            //true = check all children of the model -> this is what lets you select specific parts of the model bc without it, the ray only checks the top level object and ignores the inner meshes 

//         if (intersects.length > 0) {
//             const selectedObject = intersects[0].object                                      //intersects[0] is the array that's returned which includes everything that was intersected and [0] just means the first item in that array so if there are multiple parts of a model, only the closest one is selected -> now 'selectedObject' is storing whatever mesh was clicked
            
//             if(allowedParts.includes(selectedObject.name)) {                                 //checks if the selected object is in the list of allowed parts and if it is, run the pop up function
//                 showPopup(selectedObject)                                                    //calls the pop up function
//                 return
//             }                                          
//         }
//     }
//     popup.style.display = 'none'
// }

// //HOVER STATE GLOW FUNCTION
// function onMouseMove(event){                                                            
//     coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
//     coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  

// raycaster.setFromCamera(coords, camera)                                             

// if(model) {                                                                         
//     const intersects = raycaster.intersectObject(model, true)                       

//     if (intersects.length > 0) {
//         let hoveredObject = intersects[0].object                                 
        
//         if(allowedParts.includes(hoveredObject.name)) {                                      //hoveredObject = name for selectedObject in this function and it checks to see if that object is in the allowed objects list
            
//             if (lastHovered && lastHovered !== hoveredObject) {                              //if it's a new object being hovered, resest the last one to have no glow
//                 lastHovered.material.emissive.set(0x000000)                                  //remove glow from previous object
//             }

//             const hoverColour = hoverColours[hoveredObject.name] || 0xFFF8DC               //use the colour assigned to that hovered object detailed in the list under 'hoverColours' or if none are available, use this colour
//             hoveredObject.material.emissive.set(hoverColour)                                 //apply glow effect
//             hoveredObject.material.emissiveIntensity = 0.5
//             lastHovered = hoveredObject                                                      //update lastHovered to be the same as what is hovered -> need this so that when the checking line runs again, lastHovered has value of whatever was just hovered over  STORE THE HOVERED OBJECT
        
//         } else {                                                                             //removes the glow from a hovered object that isn't in the allowed list
//             if (lastHovered){
//                 lastHovered.material.emissive.set(0x000000)
//                 lastHovered = null 
//             }                                                              
//         }                                                
//     } else {                                                                                 //removes the glow if the user isn't hovering over anything
//         if (lastHovered){ 
//             lastHovered.material.emissive.set(0x000000)
//             lastHovered = null 
//         }                                                                
//     }
// }
// }

// //POP UP POSITION FUNCTION
//  function showPopup(part){                                                                   //in this function 'part' is = to 'selectedObject' -> doesn't have to be different for this function, it's just because it's easier to write and read
//     const text = popupTexts[part.name] || "Nothing here"                                     //either display the text that is assigned to the allowed object that's been selected or display 'nothing here'
    
//     popup.innerHTML = text                                                                   //controls the text that's displayed in the pop up
//     popup.style.display = 'block'
//  }



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
    "Alexandria": [{ title: "Alexandria", text: "A city founded by Alexander the Great in 332 BC and a major Egyptian port/naval base that controlled the Mediterranean." }],
    "Ptolemy I": [
        { title: "Ptolemy I", text: "A Greek general who declared himself Pharaoh and stayed in Alexandria to rule after Alexander the Great had left. He started the Egyptian dynasty that took his name."},
        { title: "Pronunciation", text: "‘to-luh-mee’, the ‘P’ is silent."}
    ],
    "Blueprint": [{ title: "Blueprint", text: "A standard example or a plan that explains how something might be made or achieved." }],
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



