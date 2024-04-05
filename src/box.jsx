import { Float, useCubeTexture, useTexture } from '@react-three/drei';
import React from 'react';



export default function Box(){

    const texture = useTexture("/media/cube.png")

    function myBox(xPosition, yPosition=2) {
        const max = 0.7
        const min = 0.1
       const randomNum = Math.random() * (max - min) + min;

        return (
        <Float speed={6} rotationIntensity={0}>
            <mesh position={[xPosition, yPosition, 2]} rotation-y={randomNum} >
                <meshStandardMaterial map={texture}/>  
                <boxGeometry args={[1,1,1]}/>            
            </mesh>
        </Float>
        )
    }

    const boxes = [
        myBox(-2, 3),
        myBox(2.5, )
    ];


    return (
        <>
            {boxes}        
        </> 
        )
    };