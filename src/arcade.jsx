import React from 'react';
import { Html, Environment, PresentationControls, useGLTF } from "@react-three/drei";


export default function Arcade() {
    const arcade = useGLTF(
        "/model9.glb"
        )

    return (
        <>
        <Environment preset="warehouse" />

        <PresentationControls >
            <primitive object={arcade.scene} position-y={-2}>
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
        </PresentationControls>
       </>
    )
};

