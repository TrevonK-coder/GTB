// ── LUXURY 3D BACKGROUND (THREE.JS) ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060609, 0.0015);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent bg to let css color show (or dark color)
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize performance

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x7c6fff, 2, 100); // Purple GTB Accent
    pointLight1.position.set(20, 20, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00e5a0, 1.5, 100); // Green GTB Accent
    pointLight2.position.set(-20, -20, 10);
    scene.add(pointLight2);

    // MATERIALS - Luxury Glass/Dark Metal
    const luxuryMaterial = new THREE.MeshStandardMaterial({
        color: 0x111120,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: false,
        envMapIntensity: 1.0
    });

    const wireframeMaterial = new THREE.MeshStandardMaterial({
        color: 0x7c6fff, // Purple
        metalness: 0.1,
        roughness: 0.8,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    // GEOMETRY - Main Objects
    const objects = [];

    // 1. Center Icosahedron (Complex Geometric Shape)
    const icoGeo = new THREE.IcosahedronGeometry(8, 0);
    const centerObj = new THREE.Mesh(icoGeo, luxuryMaterial);
    scene.add(centerObj);
    objects.push(centerObj);

    // 1b. Center Wireframe Overlay
    const centerWire = new THREE.Mesh(icoGeo, wireframeMaterial);
    centerWire.scale.set(1.05, 1.05, 1.05);
    scene.add(centerWire);
    objects.push(centerWire);

    // 2. Slow rotating Torus Knot (Elegant complexity)
    const torusGeo = new THREE.TorusKnotGeometry(14, 0.8, 128, 16);
    const torusKnot = new THREE.Mesh(torusGeo, luxuryMaterial);
    torusKnot.position.z = -15;
    scene.add(torusKnot);
    objects.push(torusKnot);

    // PARTICLES (Dust / Stars)
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = window.innerWidth < 768 ? 400 : 900; // Less on mobile
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100; // Spread -50 to 50
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xe8e8f0,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const particleMesh = new THREE.Points(particlesGeo, particlesMaterial);
    scene.add(particleMesh);

    // INTERACTIVITY (Mouse Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // INTERACTIVITY (Scroll Parallax)
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // ANIMATION LOOP
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 1. Smoothly move camera based on mouse (Parallax)
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Gentle bounds and smooth damping
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // 2. Rotate Main Objects
        centerObj.rotation.y = elapsedTime * 0.1;
        centerObj.rotation.x = elapsedTime * 0.05;

        centerWire.rotation.y = elapsedTime * 0.1;
        centerWire.rotation.x = elapsedTime * 0.05;

        torusKnot.rotation.z = elapsedTime * 0.02;
        torusKnot.rotation.y = elapsedTime * 0.03;

        // 3. Move Objects based on Scroll (Scroll Parallax)
        // Move the center object slightly up/down as we scroll down
        const scrollOffset = scrollY * 0.01;
        centerObj.position.y = -scrollOffset * 0.5;
        centerWire.position.y = -scrollOffset * 0.5;
        torusKnot.position.y = scrollOffset * 0.2;

        // 4. Rotate Particles slowly
        particleMesh.rotation.y = elapsedTime * 0.02;
        // Subtle drift
        particleMesh.position.y = -scrollY * 0.005;

        // Render
        renderer.render(scene, camera);
    }

    animate();

    // RESIZE HANDLER
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
