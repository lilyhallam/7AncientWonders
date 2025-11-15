import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";


// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

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
camera.position.z = 15;  // back forwards
camera.position.y = 0;  //up
camera.position.x = 0;  //side 
scene.add(camera);

//RENDERER
// const canvas = document.querySelector(".webgl");
const canvas = document.querySelector(".webglLanding");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(2);
renderer.setClearColor(0x000000, 0)
renderer.render(scene, camera);

//STARS --------------------------------------------------------------------------------

const starCount = 900
const starGeometry = new THREE.BufferGeometry()
const starPositions = new Float32Array(starCount * 3)                                                     //* 3 = x y z

// for (let i = 0; i < starCount * 3; i++) {                                                              //random position in space    
//     starPositions[i] = (Math.random() - 0.5) * 100               //how far the stars spread 
//     if (i % 3 ===2) {
//         starPositions[i] -= 40                                  //push stars away from camera
//     }                                                       
// }

for (let i = 0; i < starCount * 3; i+= 3) {                                                               //random position in space    
    starPositions[i] = (Math.random() - 0.5) * 100  //x          //how far the stars spread on each axis
    starPositions[i + 1] = (Math.random() - 0.5) * 80  //y                                                 
    starPositions[i + 2] = (Math.random() * -15) - 20  //z                                                  
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

//star material 
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.25,
    sizeAttenuation: true
})

//points mesh
const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

//IMPORT MODEL --------------------------------------------------------------------------------

let model;
const loader = new GLTFLoader();
loader.load(
    '/models/Globe2.glb', 
    function (gltf) {
        model = gltf.scene;
        scene.add(model);
        model.rotation.y = Math.PI

        model.scale.set(0,0,0)

        gsap.to(model.rotation, {
            y: Math.PI + 2.7,
            //y: Math.PI + Math.PI, // Rotates 180 degrees as you scroll down
            scrollTrigger: {
                trigger: ".spacer",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        });

        // model.rotation.y = Math.PI

        //globe on the side animation position thing
        gsap.to(model.position, {
            x: 5, y: -3, // Move up to final position
            scrollTrigger: {
                trigger: ".spacer",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        });

        

        console.log(model.rotation.y);

        gsap.to(model.scale, {
            x: 1.7, y: 1.7, z: 1.7, // Makes the model bigger
            scrollTrigger: {
                trigger: ".spacer",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        });
    });



//SCROLL ANIMATION ---------------------------------------------------------------------------

//initialising lenis
const lenis = new Lenis({
    duration: 1.2, // Smoothness (higher = slower)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing function
    smooth: true, 
  });

// function checkScreenSize() {
//     if (window.innerWidth <= 1350) {
//         document.body.classList.add("disableScroll"); // Apply styles
//         lenis.stop(); // Stop smooth scrolling
//     } else {
//         document.body.classList.remove("disableScroll");
//         lenis.start(); // Restart smooth scrolling
//     }
// }

// // Run check on load and window resize
// window.addEventListener("resize", checkScreenSize);
// checkScreenSize();

//RAYCASTING ---------------------------------------------------------------------------

//MODEL SELECTION LINKS

const pageLinks = {
    "pin_pyramids": "pyramids.html", 
    "pin_artemis": "artemis.html", 
    "pin_halicarnassus": "halicarnassus.html", 
    "pin_lighthouse": "lighthouse.html", 
    "pin_rhodes": "rhodes.html", 
    "pin_zeus": "zues.html", 
    "pin_babylon": "babylon"
}

const modelParts = {
    "The Great Pyramid of Giza": "pin_pyramids", 
    "The Temple of Artemis": "pin_artemis", 
    "The Mausoleum of Halicarnassus": "pin_halicarnassus", 
    "The Lighthouse of Alexandria": "pin_lighthouse", 
    "The Colossus of Rhodes": "pin_rhodes", 
    "The Statue of Zeus at Olympia": "pin_zeus", 
     "The Hanging Gardens of Babylon": "pin_babylon"
}

const hoverColours = {
    "water": 0x088F8F
}

const coords = new THREE.Vector2()                                                           //this needs to be delcared here outside of the onMouseDown function so it can be accessed globally by the showPopup function
const raycaster = new THREE.Raycaster()                                                      //defining the raycaster
let lastHovered = null                                                                       //empty now but used later 

document.addEventListener('mousedown', onMouseDown)                                          //Mouse event handler -> listenes to 'mousedown' and 'onMouseDown' is the name of a function
document.addEventListener('mousemove', onMouseMove)

//CLICK MODEL & GO TO ANOTHER PAGE
function onMouseDown(event){                                                                 //defining and calculating the mouse coordinates
    coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
    coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  
 
    raycaster.setFromCamera(coords, camera)                                                  //projects a ray from the camera to the coordinates of the mouse click position in 3D space

    if(model) {                                                                              //checking for intersections in the ray with objects & returns an array of what has been intersected
        const intersects = raycaster.intersectObject(model, true)                            //true = check all children of the model -> this is what lets you select specific parts of the model bc without it, the ray only checks the top level object and ignores the inner meshes 

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object                                      //intersects[0] is the array that's returned which includes everything that was intersected and [0] just means the first item in that array so if there are multiple parts of a model, only the closest one is selected -> now 'selectedObject' is storing whatever mesh was clicked
            
            if(pageLinks[selectedObject.name]) {                                 //checks if the selected object is in the list of allowed parts and if it is, run the pop up function
                window.location.href = pageLinks[selectedObject.name]
            }                                          
        }
    }
}

const listItems = document.querySelectorAll('.globeText2 ul li')    //select all li elements
let glowingParts = {}

//ADD HOVER EFFECT TO LIST ITEMS
listItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        const modelPartName = modelParts[item.textContent.trim()];  // Match <li> to model part
        if (modelPartName && model) {
            const modelPart = model.getObjectByName(modelPartName);
            if (modelPart) {
                modelPart.material.emissive.set(hoverColours[modelPartName] || 0xFA5F55);  //FF3131
                modelPart.material.emissiveIntensity = 0.5;
                glowingParts[modelPartName] = modelPart
            }
        }
    });

    item.addEventListener('mouseleave', () => {
        const modelPartName = modelParts[item.textContent.trim()]
        if (modelPartName && glowingParts[modelPartName]) {
            glowingParts[modelPartName].material.emissive.set(0x000000);
            glowingParts[modelPartName].material.emissiveIntensity = 0;
            
            delete glowingParts[modelPartName];
        }
    });
});


//HOVER STATE GLOW FUNCTION
function onMouseMove(event){                                                            
    coords.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;                      
    coords.y = -((event.clientY / renderer.domElement.clientHeight) * 2 - 1);                  

raycaster.setFromCamera(coords, camera)                                             

if(model) {                                                                         
    const intersects = raycaster.intersectObject(model, true)                       

    if (intersects.length > 0) {
        let hoveredObject = intersects[0].object                                 
        
        if(pageLinks[hoveredObject.name]) {                                      //hoveredObject = name for selectedObject in this function and it checks to see if that object is in the allowed objects list
            
            if (lastHovered && lastHovered !== hoveredObject) {                              //if it's a new object being hovered, resest the last one to have no glow
                lastHovered.material.emissive.set(0x000000)                                  //remove glow from previous object
            }

            const hoverColour = hoverColours[hoveredObject.name] || 0xFA5F55               //use the colour assigned to that hovered object detailed in the list under 'hoverColours' or if none are available, use this colour
            hoveredObject.material.emissive.set(hoverColour)                                 //apply glow effect
            hoveredObject.material.emissiveIntensity = 1
            lastHovered = hoveredObject                                                      //update lastHovered to be the same as what is hovered -> need this so that when the checking line runs again, lastHovered has value of whatever was just hovered over  STORE THE HOVERED OBJECT
        
        } else {                                                                             //removes the glow from a hovered object that isn't in the allowed list
            if (lastHovered){
                lastHovered.material.emissive.set(0x000000)
                lastHovered = null 
            }                                                              
        }                                                
    } else {                                                                                 //removes the glow if the user isn't hovering over anything
        if (lastHovered){ 
            lastHovered.material.emissive.set(0x000000)
            lastHovered = null 
        }                                                                
    }
}
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
const loop = (time) => {   
    lenis.raf(time);  // Update Lenis smooth scrolling  
    // handleScroll();   // Your function to handle camera movement  
    renderer.render(scene, camera);  // Render the 3D scene  
    requestAnimationFrame(loop);  // Keep looping  
};

loop()




