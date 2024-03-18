import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

export function arcadeEnvironmentThree(element) {
    const scene = new THREE.Scene();
    // const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGL1Renderer({
        canvas: element 
    });

    renderer.setPixelRatio( window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    // camera.position.set(0,7,10)



    // helpers
    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper)
    
    
    const assetLoader = new GLTFLoader();

    assetLoader.load('/model8.glb', function(gltf) {
        const model = gltf.scene;   
        const camerFromGLTF = gltf.cameras[0]
         
        const controls = new OrbitControls(camerFromGLTF, renderer.domElement);
        
        
        
        // Creates a constant aspect ratio for environment
        camerFromGLTF.aspect = window.innerWidth / window.innerHeight;
        camerFromGLTF.fov = 75
        camerFromGLTF.updateProjectionMatrix()


        scene.add(model)


        // Find the camera animation clip
        const clip = THREE.AnimationClip.findByName( gltf.animations, 'MyCameraAction.007')


        // Create the animation mixer using the scene
        const mixer = new THREE.AnimationMixer(scene);
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;


 
        const raycaster = new THREE.Raycaster();
   
        document.addEventListener('click', onMouseDown);

        function onMouseDown(event) {
            const coords = new THREE.Vector2(
                ( event.clientX  / renderer.domElement.clientWidth ) * 2 - 1,
                -(( event.clientY  / renderer.domElement.clientHeight ) * 2 - 1),
            );
            raycaster.setFromCamera(coords, camerFromGLTF)

            const intersections = raycaster.intersectObject(model, true)
            
            if (intersections.length > 0) {
                // play the camera animation
                action.play() 
            }
        }

        const ambiLight = new THREE.AmbientLight(0xffffff);
        ambiLight.position.add(5,5,5)
        // scene.add(ambiLight)


        // Scene Lighting
        const pointLight = new THREE.PointLight(0xffffff, 2, 100);
        pointLight.position.set(0,3,3)
        scene.add(pointLight)

        const pointLight1 = new THREE.PointLight(0xffffff, 5, 100);
        pointLight1.position.set(3,3,0)
        scene.add(pointLight1)

        const pointLight2 = new THREE.PointLight(0xffffff, 5, 100);
        pointLight2.position.set(-3,3,0)
        scene.add(pointLight2)


        const pointLight3 = new THREE.PointLight(0xffffff, 1, 100);
        pointLight3.position.set(0,2, -3)
        // scene.add(pointLight3)



        // screen object
        const gameCanvas = document.getElementById('gameScreen');
        const gameTexture = new THREE.CanvasTexture(gameCanvas);

        const screenGeometry = new THREE.PlaneGeometry(2, 2.4, 1);
        const screenMaterial = new THREE.MeshBasicMaterial({ map: gameTexture });
        const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        screenMesh.position.set(0, 3, 0.6)
        screenMesh.rotateX(-0.75)
        scene.add(screenMesh);

    
        // Initialize the clock and call the animate function
        const clock = new THREE.Clock();
        animate();

        function animate() {
            gameTexture.needsUpdate = true;

        
            mixer.update(clock.getDelta())
            renderer.render(scene, camerFromGLTF)
            requestAnimationFrame( animate );


        } 

        window.addEventListener('resize', () => {
            camerFromGLTF.aspect = window.innerWidth / window.innerHeight;
            camerFromGLTF.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })

    }, 
    
        undefined, function(error) {
        console.error(error);
    });


} 