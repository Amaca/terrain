import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui';

/**
 * Debug
 */
 const gui = new dat.GUI();
 const parameters = {
    planeWidth: 5,
    planeHeight: 5,
    segmentsWidth: 20,
    segmentsHeight: 20,
    mountainHeight: 0.31,
    animate: true,
    bgColor: 0x000000,
    spin: 1,
    angle: 1,
    power: 1
 }

const guiMountainsSettings = gui.addFolder('Mountains Settings');
const guiLights = gui.addFolder('Lights');
const guiBackground = gui.addFolder('Background');

guiMountainsSettings.add(parameters, 'planeWidth').name('Plane Width').min(1).max(10).step(0.5).onChange(() => {
    generateMountain()
})
guiMountainsSettings.add(parameters, 'planeHeight').name('Plane Height').min(1).max(10).step(0.5).onChange(() => {
    generateMountain()
}) 
guiMountainsSettings.add(parameters, 'segmentsWidth').name('Segments Width').min(8).max(64).step(2).onChange(() => {
    generateMountain()
})
guiMountainsSettings.add(parameters, 'segmentsHeight').name('Segments Height').min(8).max(64).step(2).onChange(() => {
    generateMountain()
}) 
guiMountainsSettings.add(parameters, 'mountainHeight').name('Random height').min(0).max(0.7).step(0.01).onChange(() => {
    generateMountain()
})
guiBackground.add(parameters, 'animate').name('Animate');

/**
 * Texture Loader
 */
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)
const colorTexture = textureLoader.load('./textures/rock_06_diff_4k.jpg');
const heightTexture = textureLoader.load('./textures/rock_06_bump_4k.jpg');
const normalTexture = textureLoader.load('./textures/rock_06_nor_gl_4k.jpg');
const ambientOcclusionTexture = textureLoader.load('./textures/rock_06_ao_4k.jpg');
const roughnessTexture = textureLoader.load('./textures/rock_06_rough_4k.jpg');

colorTexture.generateMipmaps = false;
colorTexture.minFilter = THREE.NearestFilter
colorTexture.magFilter = THREE.NearestFilter

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
guiLights.add(ambientLight, 'intensity').name('Point Light intensity').min(0).max(1.2).step(0.001);
guiLights.addColor(ambientLight, 'color').name('Point Light Color')
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 0.8, 15, 1);
pointLight.position.set(0, 1, 0)
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.1;
pointLight.shadow.camera.far = 10;

guiLights.add(pointLight, 'intensity').name('Point Light intensity').min(0).max(1.2).step(0.001);
guiLights.addColor(pointLight, 'color').name('Point Light Color')
scene.add(pointLight)

/**
 * Object
 */

 let geometry = null;
 let material = null;
 let mesh = null;
 let changeColor;
 let changeWireframe;
 let changeDisplacement;

 const generateMountain = () => {

    /**
     * Destroy old Mountain
     */
    if(mesh !== null) {
        geometry.dispose();
        material.dispose();
        changeColor.destroy();
        changeWireframe.destroy();
        changeDisplacement.destroy();
        scene.remove(mesh);
    }

    geometry = new THREE.PlaneGeometry(
        parameters.planeWidth, 
        parameters.planeHeight, 
        parameters.segmentsWidth, 
        parameters.segmentsHeight
    )
    material = new THREE.MeshStandardMaterial({
        color: 0xababab,
        side: THREE.DoubleSide,
        alphaTest: 1,
        wireframe: false,
        map: colorTexture,
        transparent: true,
        aoMap: ambientOcclusionTexture,
        displacementMap: heightTexture,
        displacementScale: 0,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        roughness: 10
    })

    changeDisplacement = guiMountainsSettings.add(material, 'displacementScale').name('Displacement height').min(0).max(1).step(0.05)
    changeColor = guiMountainsSettings.addColor(material, 'color');
    changeWireframe = guiBackground.add(material, 'wireframe');
    
    mesh = new THREE.Mesh(geometry, material)
    
    geometry.rotateX(-(Math.PI / 2) + 0.5)

    const vertices = geometry.attributes.position.array;
    
    for( let i = 0; i <= vertices.length; i++) {
        const i3 = i * 3;
        vertices[i3 + 1] = Math.random() * parameters.mountainHeight //y 
    }

    mesh.castShadow = true;

    scene.add(mesh);
}

generateMountain();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.y = 1.05
camera.position.z = 1.1
camera.lookAt(geometry)
scene.add(camera)

scene.background = new THREE.Color( 0x000000 );

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    if(parameters.animate) {
        mesh.rotation.y = - elapsedTime * 0.1; 
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()