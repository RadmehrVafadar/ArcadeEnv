import {useState, useRef, useEffect} from 'react';
import { useFrame } from '@react-three/fiber';
import React from 'react';
import { Html, Environment, PresentationControls, useGLTF, CameraControls } from "@react-three/drei";
import * as THREE from 'three'



export default function Arcade() {
    const [ hovered, setHovered ] = useState(false);
    const markerRef = useRef();
    const vec = new THREE.Vector3()

    useFrame(state => {
        state.camera.lookAt(0,1,1)
        
        if (hovered) {
            state.camera.position.lerp(vec.set(0,3,3), 0.05)
            state.camera.updateProjectionMatrix()
        }
        return null;
    })


    const arcade = useGLTF(
        "/model9.glb"
        )

    // Enable shadows on all meshes in the arcade model
    useEffect(() => {
        if (arcade.scene) {
            arcade.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    }, [arcade.scene]);

    return (
        <>
        
        
        
        <primitive
        object={arcade.scene} 
        position-y={-2}
        ref={markerRef}
        onPointerOver={() => setHovered(true)}
        castShadow
        receiveShadow
            >

            <Html 
            occlude
            wrapperClass='arcade' 
            position={[0, 2.83, 0.7]} 
            transform 
            distanceFactor={1.12}
            rotation-x={-0.75}
            >
            <iframe src="https://portfolio-website-omega-flame.vercel.app/"/>
            </Html>
        </primitive>
       
       </>
    )
};

