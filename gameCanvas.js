import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'




export function gameScreen(element) {

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGL1Renderer({
        canvas: element
    });

    renderer.setPixelRatio( window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    camera.position.set(0,0,30)




    const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: true})
    const torus = new THREE.Mesh( geometry, material);

    scene.add(torus)

    
    const ambiLight = new THREE.AmbientLight(0xffffff);
    ambiLight.position.add(5,5,5)
    scene.add(ambiLight)



    // helpers
    const gridHelper = new THREE.GridHelper(200, 50);
    // scene.add(gridHelper)
    
    function animate() {

        torus.rotateX(0.03)
        renderer.render(scene, camera)
        requestAnimationFrame( animate );
    } 

    animate()

}