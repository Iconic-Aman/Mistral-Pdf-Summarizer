"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Background3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const scene = new THREE.Scene();
        let w = window.innerWidth, h = window.innerHeight;
        const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
        cam.position.z = 6.5;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const defs = [
            { G: new THREE.IcosahedronGeometry(2.0, 0), color: 0x00e5ff, op: 0.28, p: [1.2, 0.3, -1.5], rs: [0.003, 0.005, 0.002] },
            { G: new THREE.OctahedronGeometry(1.1), color: 0xf0a500, op: 0.26, p: [4.5, 1.8, -2.2], rs: [0.004, 0.002, 0.006] },
            { G: new THREE.TetrahedronGeometry(1.0), color: 0x00e5ff, op: 0.24, p: [-4.2, -1.2, -1.5], rs: [0.006, 0.003, 0.004] },
            { G: new THREE.IcosahedronGeometry(0.55, 0), color: 0xf0a500, op: 0.32, p: [-2.8, 2.8, -0.5], rs: [0.008, 0.004, 0.005] },
            { G: new THREE.TorusGeometry(0.85, 0.2, 6, 10), color: 0xf0a500, op: 0.28, p: [3.2, -2.8, 0], rs: [0.005, 0.003, 0.007] },
            { G: new THREE.OctahedronGeometry(0.65), color: 0x00e5ff, op: 0.28, p: [-3.5, 1.2, 0.5], rs: [0.003, 0.007, 0.004] },
            { G: new THREE.TetrahedronGeometry(0.5), color: 0x00e5ff, op: 0.2, p: [0.5, 3.5, -1], rs: [0.007, 0.005, 0.003] },
            { G: new THREE.IcosahedronGeometry(0.4, 0), color: 0xf0a500, op: 0.28, p: [-1.5, -3, 0.5], rs: [0.004, 0.008, 0.006] },
        ];

        const meshes = defs.map(d => {
            const mat = new THREE.MeshBasicMaterial({ color: d.color, wireframe: true, transparent: true, opacity: d.op });
            const m = new THREE.Mesh(d.G, mat);
            m.position.set(d.p[0], d.p[1], d.p[2]);
            m.userData.rs = d.rs;
            scene.add(m);
            return m;
        });

        let mx = 0, my = 0;
        const onMove = (e: MouseEvent) => {
            mx = (e.clientX / w - 0.5) * 2;
            my = (e.clientY / h - 0.5) * 1.5;
        };
        window.addEventListener("mousemove", onMove);

        let raf: number;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            meshes.forEach(m => {
                m.rotation.x += m.userData.rs[0];
                m.rotation.y += m.userData.rs[1];
                m.rotation.z += m.userData.rs[2];
            });
            cam.position.x += (mx * 0.25 - cam.position.x) * 0.035;
            cam.position.y += (-my * 0.2 - cam.position.y) * 0.035;
            cam.lookAt(0, 0, 0);
            renderer.render(scene, cam);
        };
        tick();

        const onResize = () => {
            w = window.innerWidth; h = window.innerHeight;
            cam.aspect = w / h; cam.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
        };
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-aurora" />
            <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-grid-pattern" />
        </>
    );
}
