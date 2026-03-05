// ── GTB SPACE BACKGROUND (THREE.JS) ──────────────────────────────
// Space theme: nebula glow, star field, shooting stars & logo-inspired geometry
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // ── SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    // Deep space fog
    scene.fog = new THREE.FogExp2(0x010106, 0.006);

    // ── CAMERA ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 55;

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
    scene.add(new THREE.AmbientLight(0x0a0a28, 1));

    const purpleGlow = new THREE.PointLight(0x7c6fff, 4, 120);
    purpleGlow.position.set(0, 0, 20);
    scene.add(purpleGlow);

    const greenGlow = new THREE.PointLight(0x00e5a0, 2, 80);
    greenGlow.position.set(30, -20, 10);
    scene.add(greenGlow);

    const blueGlow = new THREE.PointLight(0x1a6aff, 1.5, 80);
    blueGlow.position.set(-30, 20, 5);
    scene.add(blueGlow);

    // ── STAR FIELD ───────────────────────────────────────────────
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 800 : 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Spread stars in a wide sphere
        const r = 100 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = r * Math.cos(phi);
        starSizes[i] = Math.random() * 1.5 + 0.3;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.PointsMaterial({
        color: 0xeeeeff,
        size: 0.35,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── SHOOTING STARS ───────────────────────────────────────────
    const shootingStars = [];
    const SHOOTING_COUNT = isMobile ? 4 : 8;

    function createShootingStar() {
        const geo = new THREE.BufferGeometry();
        // Each shooting star is a line with a head and a fading tail
        const headLength = 5 + Math.random() * 15;
        const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(headLength, 0, 0) // tail direction
        ];
        geo.setFromPoints(points);

        const mat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            linewidth: 1
        });

        const line = new THREE.Line(geo, mat);

        // Random start position off screen
        line.position.set(
            (Math.random() - 0.5) * 160,
            20 + Math.random() * 40,
            (Math.random() - 0.5) * 50
        );

        // Diagonal downward direction
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
        line.rotation.z = angle;

        line.userData = {
            speed: 0.6 + Math.random() * 1.2,
            opacity: 0,
            phase: 'wait',       // wait, appear, travel, fade
            waitTimer: Math.random() * 8, // random delay
            travelDist: 0,
            maxDist: 30 + Math.random() * 40,
            dirX: Math.cos(angle) * -0.8,
            dirY: Math.sin(angle) * -0.8,
        };

        scene.add(line);
        return line;
    }

    for (let i = 0; i < SHOOTING_COUNT; i++) {
        shootingStars.push(createShootingStar());
    }

    function updateShootingStar(star, delta) {
        const d = star.userData;
        if (d.phase === 'wait') {
            d.waitTimer -= delta;
            if (d.waitTimer <= 0) d.phase = 'appear';
        } else if (d.phase === 'appear') {
            d.opacity = Math.min(d.opacity + delta * 3, 1);
            star.material.opacity = d.opacity;
            if (d.opacity >= 1) d.phase = 'travel';
        } else if (d.phase === 'travel') {
            star.position.x += d.dirX * d.speed;
            star.position.y += d.dirY * d.speed;
            d.travelDist += d.speed;
            if (d.travelDist >= d.maxDist) d.phase = 'fade';
        } else if (d.phase === 'fade') {
            d.opacity = Math.max(d.opacity - delta * 5, 0);
            star.material.opacity = d.opacity;
            if (d.opacity <= 0) {
                // Reset shooting star
                star.position.set(
                    (Math.random() - 0.5) * 160,
                    20 + Math.random() * 40,
                    (Math.random() - 0.5) * 50
                );
                const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
                star.rotation.z = angle;
                Object.assign(star.userData, {
                    speed: 0.6 + Math.random() * 1.2,
                    opacity: 0,
                    phase: 'wait',
                    waitTimer: 2 + Math.random() * 6,
                    travelDist: 0,
                    maxDist: 30 + Math.random() * 40,
                    dirX: Math.cos(angle) * -0.8,
                    dirY: Math.sin(angle) * -0.8,
                });
            }
        }
    }

    // ── GTB LOGO-INSPIRED GEOMETRY ───────────────────────────────
    // The GTB logo has a circular/ring motif with inner geometry.
    // We'll create a dark metallic ring (Torus) + inner icosahedron, matching logo style.

    const logoMat = new THREE.MeshStandardMaterial({
        color: 0x0d0d1a,
        metalness: 1.0,
        roughness: 0.12,
        emissive: 0x1a0a3d,
        emissiveIntensity: 0.3
    });

    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x7c6fff,
        wireframe: true,
        transparent: true,
        opacity: 0.18
    });

    const accentRingMat = new THREE.MeshStandardMaterial({
        color: 0x7c6fff,
        metalness: 0.8,
        roughness: 0.15,
        emissive: 0x7c6fff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85
    });

    // Outer ring (Logo-inspired)
    const outerRingGeo = new THREE.TorusGeometry(14, 0.4, 16, 80);
    const outerRing = new THREE.Mesh(outerRingGeo, accentRingMat);
    scene.add(outerRing);

    // Inner ring (slightly smaller, perpendicular)
    const innerRingGeo = new THREE.TorusGeometry(10, 0.25, 16, 60);
    const innerRing = new THREE.Mesh(innerRingGeo, new THREE.MeshStandardMaterial({
        color: 0x00e5a0,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0x00e5a0,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
    }));
    innerRing.rotation.x = Math.PI / 2; // perpendicular
    scene.add(innerRing);

    // Center dark sphere (GTB inner core)
    const sphereGeo = new THREE.IcosahedronGeometry(6, 1);
    const sphere = new THREE.Mesh(sphereGeo, logoMat);
    scene.add(sphere);

    // Wireframe over sphere
    const sphereWire = new THREE.Mesh(sphereGeo, wireMat);
    sphereWire.scale.set(1.04, 1.04, 1.04);
    scene.add(sphereWire);

    // Small orbiting satellite rings for depth
    const satelliteGeo = new THREE.TorusGeometry(2, 0.12, 8, 30);
    const satellites = [];
    const satelliteAngles = [0, Math.PI * 0.6, Math.PI * 1.2];
    satelliteAngles.forEach((angle, i) => {
        const s = new THREE.Mesh(satelliteGeo, new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x7c6fff : 0x00e5a0,
            emissive: i % 2 === 0 ? 0x7c6fff : 0x00e5a0,
            emissiveIntensity: 0.9,
            metalness: 0.5,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        }));
        s.userData.orbitAngle = angle;
        s.userData.orbitSpeed = 0.4 + i * 0.15;
        s.userData.orbitRadius = 18 + i * 3;
        satellites.push(s);
        scene.add(s);
    });

    // ── NEBULA CLOUDS (particle planes) ─────────────────────────
    const nebulaCount = isMobile ? 200 : 500;
    const nebPos = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount; i++) {
        const i3 = i * 3;
        nebPos[i3] = (Math.random() - 0.5) * 80;
        nebPos[i3 + 1] = (Math.random() - 0.5) * 70;
        nebPos[i3 + 2] = -30 + Math.random() * -60;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    const nebMat = new THREE.PointsMaterial({
        color: 0x7c6fff,
        size: 0.6,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    scene.add(new THREE.Points(nebGeo, nebMat));

    // ── MOUSE PARALLAX ───────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    // ── ANIMATION LOOP ───────────────────────────────────────────
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const delta = clock.getDelta ? 0.016 : 0.016; // approx 60fps

        // Stars slowly rotate
        stars.rotation.y = t * 0.008;
        stars.rotation.x = t * 0.003;

        // Logo geometry slow rotation
        outerRing.rotation.y = t * 0.12;
        outerRing.rotation.x = Math.sin(t * 0.07) * 0.3;

        innerRing.rotation.z = t * 0.18;
        innerRing.rotation.x = Math.PI / 2 + Math.sin(t * 0.05) * 0.2;

        sphere.rotation.y = t * 0.08;
        sphere.rotation.x = t * 0.04;
        sphereWire.rotation.y = t * 0.08;
        sphereWire.rotation.x = t * 0.04;

        // Satellites orbit around center
        satellites.forEach(s => {
            s.userData.orbitAngle += 0.008 * s.userData.orbitSpeed;
            const ang = s.userData.orbitAngle;
            const r = s.userData.orbitRadius;
            s.position.x = Math.cos(ang) * r;
            s.position.y = Math.sin(ang * 0.7) * r * 0.6;
            s.position.z = Math.sin(ang) * r * 0.4;
            s.rotation.x = t * 0.5;
        });

        // Pulsing light
        purpleGlow.intensity = 3.5 + Math.sin(t * 1.5) * 1.5;
        greenGlow.intensity = 1.5 + Math.sin(t * 1.2 + 1) * 0.8;

        // Shooting stars
        shootingStars.forEach(s => updateShootingStar(s, 0.016));

        // Mouse parallax — gentle camera drift
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.025;
        camera.position.y += (-mouseY * 4 - camera.position.y) * 0.025;

        // Scroll moves the whole scene upward gently
        scene.position.y = -scrollY * 0.012;

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
