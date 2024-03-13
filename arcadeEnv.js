import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'


export function arcadeEnvironmentThree(element) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGL1Renderer({
        canvas: element 
    });

    renderer.setPixelRatio( window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    camera.position.setZ(10)
    camera.position.setY(6)


    const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF6347, wireframe: true})
    const torus = new THREE.Mesh( geometry, material);

    // scene.add(torus)





    // helpers
    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper)
    
    const controls = new OrbitControls(camera, renderer.domElement);
    




    const assetLoader = new GLTFLoader();

    assetLoader.load('/model4.glb', function(gltf) {
        const model = gltf.scene
        


        scene.add(model);
        model.rotateY(1.56)

        const object = model.getObjectByName('')

    }, undefined, function(error) {
        console.error(error);
    });


    const ambiLight = new THREE.AmbientLight(0xffffff);
    ambiLight.position.add(5,5,5)
    // scene.add(ambiLight)

    const pointLight = new THREE.PointLight(0xffffff, 2, 100);
    pointLight.position.set(0,5,2)
    scene.add(pointLight)

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1)
    scene.add(pointLightHelper)

    const pointLight1 = new THREE.PointLight(0xffffff, 5, 100);
    pointLight1.position.set(3,3,0)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xffffff, 5, 100);
    pointLight2.position.set(-3,3,0)
    scene.add(pointLight2)


    const pointLight3 = new THREE.PointLight(0xffffff, 1, 100);
    pointLight3.position.set(0,2, -3)
    scene.add(pointLight3)

    

   function animate() {
    requestAnimationFrame( animate );

    torus.rotateX(0.05)
    torus.rotateY(0.01)

    renderer.render(scene, camera)
   } 

   window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
   })



   animate()
}


   