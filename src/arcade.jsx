import {useState, useRef} from 'react';
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

    return (
        <>
        
        <spotLight position={[0, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        
        
        <primitive
        object={arcade.scene} 
        position-y={-2}
        ref={markerRef}
        onPointerOver={() => setHovered(true)}
            >

            <Html 
            occlude
            wrapperClass='arcade' 
            position={[0, 2.83, 0.7]} 
            transform 
            distanceFactor={1.12}
            rotation-x={-0.75}
            >
            <iframe src="https://www.nytimes.com/games/wordle"/>
            </Html>
        </primitive>
       
       </>
    )
};

