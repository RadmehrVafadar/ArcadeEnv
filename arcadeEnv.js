import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'


export function arcadeEnvironment(element) {

    const arcadeUrl = new URL('/model1.glb', import.meta.url);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, (window.innerHeight/window.innerHeight), 0.1, 1000);

    const renderer = new THREE.WebGL1Renderer({
        canvas: element 
    });

    renderer.setPixelRatio( window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight)
    camera.position.setZ(30)


    const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: true})
    const torus = new THREE.Mesh( geometry, material);

    // scene.add(torus)


    const assetLoader = new GLTFLoader();


    assetLoader.load(arcadeUrl.href, function(gltf) {
        const model = gltf.scene;
        scene.add(model)
    }, undefined, function(error) {
        console.error(error);
    });



 
    const ambiLight = new THREE.AmbientLight(0xffffff)
    ambiLight.position.add(5,5,5)

    scene.add(ambiLight)



   function animate() {
    requestAnimationFrame( animate );

    renderer.render(scene, camera)
   } 


   animate()

   window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight)
   })


}
   