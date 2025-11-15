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
controls.minDistance = 3;
controls.maxDistance = 30;
controls.update
//controls.enableZoom = false

//BACKGROUND --------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const blurAmount = 80;  // Fixed blur value
    const spots = [
        { top: "8%", left: "30%", size: 300 },  // Position and size for spot 1
        { top: "30%", left: "65%", size: 260 },  // Position and size for spot 2
        { top: "80%", left: "40%", size: 250 },  // Position and size for spot 3
        { top: "50%", left: "15%", size: 230 },  // Position and size for spot 4
        { top: "75%", left: "75%", size: 300 },  // Position and size for spot 5
        { top: "5%", left: "90%", size: 240 },  // Position and size for spot 6
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
    '/models/Zeus3.glb', 
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

const allowedParts = ["Zeus", "robe", "beard_2", "hair", "crown", "sandles_R", "sandles_L", 
    "Nike", "Nike_dress", "Nike_hair", "Nike_wings", "Nike_wreath", 
    "staff", 
    "chair", "chair_statues", "chair_orange", "chair_blue", "chair_white", "chair_decs_gold", "chair_decs_white"]

const popupGroups = {}
const popupGroupings = {
    "ZeusPop" : ["Zeus", "robe", "beard_2", "hair", "crown", "sandles_R", "sandles_L"],
    "NikePop" : ["Nike", "Nike_dress", "Nike_hair", "Nike_wings", "Nike_wreath"],
    "StaffPop" : ["staff"],
    "ChairPop" : ["chair", "chair_statues", "chair_orange", "chair_blue", "chair_white", "chair_decs_gold", "chair_decs_white"]
}
Object.entries(popupGroupings).forEach(([popup, objects]) => {
    objects.forEach(obj => popupGroups[obj] = popup)
})

const popupTexts = {
    "ZeusPop": `
    <h2>The Statue</h2>
    <ul>
        <li>The figure of Zeus was made of ivory and gold which was shaped over a wooden core; the robe and sandals, for example, were known to be made from gold.</li>
        <li>Zeus is shown to be sitting on a decorated throne while holding a figure of Nike (the goddess of victory) in one hand and a <span class="clickable-word" data-word="Scepter">scepter</span> in the other.</li>
    </ul>
    `,
    "NikePop": `
    <h2>The Goddess Nike</h2>
    <ul>
        <li>In his right hand, Zeus held a figure of Nike (the goddess of victory), which was made from ivory and gold.</li>
        <li>Nike is usually winged and seen carrying a wreath or palm leaf as a symbol of victory.</li>
        <li>She is also commonly seen as a small figure, carried by sculptures of Zeus or Athena, (the goddess of war).</li>
    </ul>
    `,
    "StaffPop": `
    <h2>Zeus's Sceptre</h2>
    <ul>
        <li>In his left hand, Zeus held a decorated scepter with an eagle perched on the top.</li>
        <li>The eagle is a frequent symbol associated with Zeus and can represent victory, power and kingship.</li>
    </ul>
    `,
    "ChairPop": `
    <h2>Zeus's Throne</h2>
    <ul>
        <li>The throne was made from cedarwood and elaborately decorated with ebony, ivory, gold, glass and precious stones - diamonds, rubies and emeralds, etc.</li>
        <li>It was also covered with carvings that showed a range of figures from Greek mythology including Zeus’s children.</li>
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
    if (!popup.contains(event.target) && !event.target.classList.contains("clickable-word")) {
        popup.style.display = 'none';
    }
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
    "Zeus": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "robe": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "beard_2": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "hair": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "crown": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "sandles_R": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "sandles_L": [
        { name: "Zeus", color: 0xFFF8DC},
        { name: "robe", color: 0xFFBF00},
    ],
    "Nike": [
        { name: "Nike", color: 0xFFF8DC},
        { name: "Nike_dress", color: 0xFFBF00},
    ],
    "Nike_dress": [
        { name: "Nike", color: 0xFFF8DC},
        { name: "Nike_dress", color: 0xFFBF00},
    ],
    "Nike_hair": [
        { name: "Nike", color: 0xFFF8DC},
        { name: "Nike_dress", color: 0xFFBF00},
    ],
    "Nike_wings": [
        { name: "Nike", color: 0xFFF8DC},
        { name: "Nike_dress", color: 0xFFBF00},
    ],
    "Nike_wreath": [
        { name: "Nike", color: 0xFFF8DC},
        { name: "Nike_dress", color: 0xFFBF00},
    ],
    "chair": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_statues": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_orange": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_blue": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_white": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_decs_gold": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
    ],
    "chair_decs_white": [
        { name: "chair", color: 0x954535},             //brown
        { name: "chair_statues", color: 0xFFBF00},     //gold
        { name: "chair_orange", color: 0xFF5F1F},      //orange
        { name: "chair_blue", color: 0x0096FF},        //blue
        { name: "chair_white", color: 0xFFF8DC},       //white
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

//POP UP POSITION FUNCTION
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
    "Scepter": [{ title: "Scepter", text: "A decorated staff carried by rulers as a symbol of their authority, usually in ceremonial occasions." }],
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



