import {useState, useRef, useEffect} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import React from 'react';
import { Html, Environment, PresentationControls, useGLTF, CameraControls } from "@react-three/drei";
import * as THREE from 'three'

// Mobile detection utility
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
};



// Fullscreen invisible mesh component for mobile clicks
function MobileClickHandler({ onMobileClick }) {
    const { size } = useThree();
    
    if (!isMobile()) return null;
    
    return (
        <mesh 
            position={[0, 0, 0]}
            onClick={onMobileClick}
            onPointerDown={onMobileClick} // Also handle touch events
        >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}

export default function Arcade() {
    const [ hovered, setHovered ] = useState(false);
    const markerRef = useRef();
    const vec = new THREE.Vector3()
    
    // Handler for mobile clicks
    const handleMobileClick = () => {
        if (isMobile()) {
            setHovered(true);
        }
    };

    useFrame(state => {
        state.camera.lookAt(0,1,1)
        
        if (hovered) {
            state.camera.position.lerp(vec.set(0,3,3), 0.05)
            state.camera.updateProjectionMatrix()
        }
        return null;
    })


    const arcade = useGLTF(
        import.meta.env.BASE_URL + "model9.glb"
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

    const isDev = import.meta.env.DEV;
    const iframeSrc = (import.meta.env.VITE_IFRAME_URL && String(import.meta.env.VITE_IFRAME_URL)) || "https://portfolio-website-omega-flame.vercel.app/";

    return (
        <>
        {/* Mobile click handler - invisible fullscreen mesh for mobile devices */}
        <MobileClickHandler onMobileClick={handleMobileClick} />
        
        <primitive
        object={arcade.scene} 
        position-y={-2}
        ref={markerRef}
        onPointerOver={() => !isMobile() && setHovered(true)}
        onPointerOut={() => !isMobile() && setHovered(false)}
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
            <iframe src={iframeSrc}/>
            </Html>
        </primitive>
       
       </>
    )
};

