// ── GTB 3D LOGO SCENE — "3" as centerpiece ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // ── SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01010a, 0.007);

    // ── CAMERA ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 60;

    // ── RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── LIGHTS ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x080820, 1.5));

    const keyLight = new THREE.PointLight(0x7c6fff, 8, 200);
    keyLight.position.set(15, 20, 30);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x00e5a0, 4, 150);
    fillLight.position.set(-20, -15, 20);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x1a6aff, 3, 120);
    rimLight.position.set(0, 0, -40);
    scene.add(rimLight);

    // ── STAR FIELD ───────────────────────────────────────────────
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 1000 : 2500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const r = 120 + Math.random() * 350;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPos[i3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xdde0ff,
        size: 0.3,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    })));

    // ── SHOOTING STARS ───────────────────────────────────────────
    const shooters = [];
    const SHOOTER_COUNT = isMobile ? 4 : 8;

    function spawnShooter() {
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(8 + Math.random() * 14, 0, 0)
        ]);
        const mat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const line = new THREE.Line(geo, mat);
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.6;
        line.rotation.z = angle;
        line.position.set(
            (Math.random() - 0.5) * 180,
            20 + Math.random() * 50,
            (Math.random() - 0.5) * 60
        );
        line.userData = {
            speed: 0.7 + Math.random() * 1.3,
            opacity: 0,
            phase: 'wait',
            wait: Math.random() * 10,
            traveled: 0,
            maxDist: 25 + Math.random() * 50,
            dx: Math.cos(angle) * -0.9,
            dy: Math.sin(angle) * -0.9
        };
        scene.add(line);
        return line;
    }

    for (let i = 0; i < SHOOTER_COUNT; i++) shooters.push(spawnShooter());

    function tickShooter(s) {
        const d = s.userData;
        if (d.phase === 'wait') {
            d.wait -= 0.016;
            if (d.wait <= 0) d.phase = 'appear';
        } else if (d.phase === 'appear') {
            d.opacity = Math.min(d.opacity + 0.08, 1);
            s.material.opacity = d.opacity;
            if (d.opacity >= 1) d.phase = 'travel';
        } else if (d.phase === 'travel') {
            s.position.x += d.dx * d.speed;
            s.position.y += d.dy * d.speed;
            d.traveled += d.speed;
            if (d.traveled >= d.maxDist) d.phase = 'fade';
        } else {
            d.opacity = Math.max(d.opacity - 0.12, 0);
            s.material.opacity = d.opacity;
            if (d.opacity <= 0) {
                // Reset
                const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.6;
                s.rotation.z = angle;
                s.position.set((Math.random() - 0.5) * 180, 20 + Math.random() * 50, (Math.random() - 0.5) * 60);
                Object.assign(d, {
                    speed: 0.7 + Math.random() * 1.3, opacity: 0, phase: 'wait',
                    wait: 2 + Math.random() * 8, traveled: 0, maxDist: 25 + Math.random() * 50,
                    dx: Math.cos(angle) * -0.9, dy: Math.sin(angle) * -0.9
                });
            }
        }
    }

    // ── 3D "3" — THE MAIN OBJECT ─────────────────────────────────
    // We hold the group here and populate once font loads
    const threeGroup = new THREE.Group();
    scene.add(threeGroup);

    // Orbit rings around the "3" (visible immediately while font loads)
    const ringMats = [
        new THREE.MeshStandardMaterial({ color: 0x7c6fff, emissive: 0x7c6fff, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.85 }),
        new THREE.MeshStandardMaterial({ color: 0x00e5a0, emissive: 0x00e5a0, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.7 })
    ];
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(18, 0.45, 16, 100), ringMats[0]);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(13, 0.25, 16, 80), ringMats[1]);
    innerRing.rotation.x = Math.PI / 2;
    threeGroup.add(outerRing);
    threeGroup.add(innerRing);

    // Satellite orbs
    const satellites = [
        { radius: 22, speed: 0.5, color: 0x7c6fff, phase: 0 },
        { radius: 26, speed: 0.3, color: 0x00e5a0, phase: 2.1 },
        { radius: 20, speed: 0.7, color: 0xffffff, phase: 4.2 }
    ].map(cfg => {
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 12, 12),
            new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.3 })
        );
        m.userData = cfg;
        threeGroup.add(m);
        return m;
    });

    // Load font and build 3D "3"
    let textMesh = null;
    let wireText = null;

    const loader = new THREE.FontLoader();
    loader.load(
        'https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json',
        (font) => {
            const textGeo = new THREE.TextGeometry('3', {
                font,
                size: 18,
                height: 5,
                curveSegments: 20,
                bevelEnabled: true,
                bevelThickness: 1.2,
                bevelSize: 0.6,
                bevelOffset: 0,
                bevelSegments: 10
            });

            // Center it
            textGeo.computeBoundingBox();
            const centerOffset = -(textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2;
            const centerOffsetY = -(textGeo.boundingBox.max.y - textGeo.boundingBox.min.y) / 2;

            // Main metallic material
            const textMat = new THREE.MeshStandardMaterial({
                color: 0x0a0a18,
                metalness: 1.0,
                roughness: 0.08,
                emissive: 0x1a0844,
                emissiveIntensity: 0.4
            });

            textMesh = new THREE.Mesh(textGeo, textMat);
            textMesh.position.x = centerOffset;
            textMesh.position.y = centerOffsetY;
            textMesh.position.z = 0;
            threeGroup.add(textMesh);

            // Glowing wireframe overlay
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x7c6fff,
                wireframe: true,
                transparent: true,
                opacity: 0.12
            });
            wireText = new THREE.Mesh(textGeo, wireMat);
            wireText.position.copy(textMesh.position);
            wireText.scale.set(1.02, 1.02, 1.02);
            threeGroup.add(wireText);
        },
        undefined,
        (err) => {
            // Fallback if font fails: show icosahedron
            const geo = new THREE.IcosahedronGeometry(10, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, metalness: 1.0, roughness: 0.1 });
            textMesh = new THREE.Mesh(geo, mat);
            threeGroup.add(textMesh);
        }
    );

    // Nebula dust behind
    const nebPos = new Float32Array((isMobile ? 200 : 600) * 3);
    for (let i = 0; i < nebPos.length / 3; i++) {
        const i3 = i * 3;
        nebPos[i3] = (Math.random() - 0.5) * 100;
        nebPos[i3 + 1] = (Math.random() - 0.5) * 80;
        nebPos[i3 + 2] = -40 + Math.random() * -80;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({
        color: 0x7c6fff, size: 0.55, transparent: true, opacity: 0.07,
        blending: THREE.AdditiveBlending, depthWrite: false
    })));

    // ── MOUSE PARALLAX ───────────────────────────────────────────
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    // ── ANIMATION LOOP ───────────────────────────────────────────
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Rotate the whole group (the "3" and its rings)
        threeGroup.rotation.y = Math.sin(t * 0.2) * 0.6;  // gentle sway
        threeGroup.rotation.x = Math.sin(t * 0.1) * 0.15;

        // Rings orbit
        outerRing.rotation.y = t * 0.15;
        outerRing.rotation.x = Math.sin(t * 0.08) * 0.4;
        innerRing.rotation.z = t * 0.2;

        // Satellites orbit in 3D
        satellites.forEach(s => {
            const cfg = s.userData;
            const a = t * cfg.speed + cfg.phase;
            s.position.x = Math.cos(a) * cfg.radius;
            s.position.y = Math.sin(a * 0.6) * cfg.radius * 0.5;
            s.position.z = Math.sin(a) * cfg.radius * 0.3;
        });

        // Pulsing lights
        keyLight.intensity = 7 + Math.sin(t * 1.4) * 2;
        fillLight.intensity = 3.5 + Math.sin(t * 1.1 + 1) * 1;

        // Stars slow drift
        scene.children[1] && (scene.children[1].rotation.y = t * 0.006);

        // Shooting stars
        shooters.forEach(tickShooter);

        // Mouse parallax
        camera.position.x += (mx * 5 - camera.position.x) * 0.02;
        camera.position.y += (-my * 4 - camera.position.y) * 0.02;

        // Scroll drift
        scene.position.y = -scrollY * 0.01;

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }
    animate();

    // ── RESIZE ───────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
