'use client';

import { Suspense, useRef } from 'react';
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';

const MODEL_URL = '/paramify-p.glb';

const SWAY_RADIANS = 0.1;
const SWAY_SPEED = 0.8;

function ParamifyP() {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * SWAY_SPEED) * SWAY_RADIANS;
    }
  });
  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function GlassLogoCanvas() {
  return (
    <Canvas camera={{ position: [-7.69, 8.62, 10.96], fov: 42, near: 0.1, far: 100 }}>
      <Suspense fallback={null}>
        <Environment preset="city" />
        <ParamifyP />
      </Suspense>
      <OrbitControls makeDefault enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
