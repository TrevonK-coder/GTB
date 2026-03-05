// ── GTB SPACE SCENE — Logo as 3D plane + custom cursor ──────────
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // ── SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01010a, 0.005);

    const isMobile = window.innerWidth < 768;

    // ── CAMERA ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 55;

    // ── RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── LIGHTS ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x060620, 1.5));

    const keyLight = new THREE.PointLight(0xffffff, 5, 200); keyLight.position.set(15, 20, 35); scene.add(keyLight);
    const purpleLight = new THREE.PointLight(0x7c6fff, 9, 160); purpleLight.position.set(-18, 10, 15); scene.add(purpleLight);
    const greenLight = new THREE.PointLight(0x00e5a0, 5, 130); greenLight.position.set(22, -15, 12); scene.add(greenLight);
    const backLight = new THREE.PointLight(0x3355ff, 3, 100); backLight.position.set(0, 0, -35); scene.add(backLight);

    // ── STAR FIELD ───────────────────────────────────────────────
    const starCount = isMobile ? 1200 : 2800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3, r = 120 + Math.random() * 400;
        const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
        starPos[i3] = r * Math.sin(p) * Math.cos(t);
        starPos[i3 + 1] = r * Math.sin(p) * Math.sin(t);
        starPos[i3 + 2] = r * Math.cos(p);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xdde4ff, size: 0.3, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    }));
    scene.add(starField);

    // ── SHOOTING STARS ───────────────────────────────────────────
    const shooters = [];
    function spawnShooter() {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.8;
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(8 + Math.random() * 18, 0, 0)
        ]);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        line.rotation.z = angle;
        line.position.set((Math.random() - 0.5) * 200, 25 + Math.random() * 60, (Math.random() - 0.5) * 60);
        line.userData = {
            speed: 0.8 + Math.random() * 1.4, opacity: 0, phase: 'wait',
            wait: Math.random() * 10, traveled: 0, maxDist: 30 + Math.random() * 60,
            dx: Math.cos(angle) * -0.9, dy: Math.sin(angle) * -0.9
        };
        scene.add(line); return line;
    }
    for (let i = 0; i < (isMobile ? 5 : 10); i++) shooters.push(spawnShooter());

    function tickShooter(s) {
        const d = s.userData;
        if (d.phase === 'wait') { d.wait -= 0.016; if (d.wait <= 0) d.phase = 'appear'; }
        else if (d.phase === 'appear') { d.opacity = Math.min(d.opacity + 0.08, 1); s.material.opacity = d.opacity; if (d.opacity >= 1) d.phase = 'travel'; }
        else if (d.phase === 'travel') { s.position.x += d.dx * d.speed; s.position.y += d.dy * d.speed; d.traveled += d.speed; if (d.traveled >= d.maxDist) d.phase = 'fade'; }
        else {
            d.opacity = Math.max(d.opacity - 0.14, 0); s.material.opacity = d.opacity;
            if (d.opacity <= 0) { const a = -Math.PI / 4 + (Math.random() - 0.5) * 0.7; s.rotation.z = a; s.position.set((Math.random() - 0.5) * 200, 25 + Math.random() * 60, (Math.random() - 0.5) * 60); Object.assign(d, { speed: 0.8 + Math.random() * 1.5, opacity: 0, phase: 'wait', wait: 2 + Math.random() * 9, traveled: 0, maxDist: 30 + Math.random() * 60, dx: Math.cos(a) * -0.9, dy: Math.sin(a) * -0.9 }); }
        }
    }

    // ── HELPER: build a logo plane (PlaneGeometry + alpha texture) ─
    // key insight: PlaneGeometry respects the PNG alpha channel fully,
    // so the logo silhouette shows — not a circle/ball.
    function buildLogoMesh(tex, size, opacity = 1) {
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            alphaTest: 0.01,   // clip fully transparent pixels
            depthWrite: false,
            blending: THREE.NormalBlending,
            opacity
        });
        return new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    }

    // ── GTB LOGO GROUP ────────────────────────────────────────────
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // Orbit rings (visible immediately)
    const ringDefs = [
        { r: 18, tube: 0.38, color: 0x7c6fff, emissive: 0x7c6fff, ei: 0.85, rX: 0, rY: 0 },
        { r: 23, tube: 0.22, color: 0x00e5a0, emissive: 0x00e5a0, ei: 0.6, rX: Math.PI / 3, rY: 0 },
        { r: 15, tube: 0.18, color: 0x4466ff, emissive: 0x4466ff, ei: 0.5, rX: Math.PI / 6, rY: Math.PI / 4 },
    ];
    const orbitRings = ringDefs.map(d => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(d.r, d.tube, 16, 100),
            new THREE.MeshStandardMaterial({ color: d.color, emissive: d.emissive, emissiveIntensity: d.ei, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.88 })
        );
        ring.rotation.x = d.rX; ring.rotation.y = d.rY;
        scene.add(ring);
        return ring;
    });

    // Satellites
    const satCfgs = [
        { radius: 22, speed: 0.5, color: 0x7c6fff, phase: 0, size: 0.6 },
        { radius: 27, speed: 0.32, color: 0x00e5a0, phase: 2.1, size: 0.5 },
        { radius: 17, speed: 0.8, color: 0xffffff, phase: 4.2, size: 0.35 },
        { radius: 25, speed: 0.4, color: 0x4488ff, phase: 1.0, size: 0.45 },
    ];
    const sats = satCfgs.map(cfg => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 10, 10),
            new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 1.5 }));
        m.userData = cfg; scene.add(m); return m;
    });

    // Floating duplicates (populated after texture loads)
    const floatingDupes = [];

    // ── LOAD LOGO TEXTURE ────────────────────────────────────────
    const texLoader = new THREE.TextureLoader();
    texLoader.load('gtb-logo.png', (tex) => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // ── MAIN LOGO — large plane ───────────────────────────
        const main = buildLogoMesh(tex, 28, 1);
        logoGroup.add(main);

        // Depth duplicate — slightly offset back for pseudo-3D extrusion look
        for (let d = 1; d <= 6; d++) {
            const layer = buildLogoMesh(tex, 28, 0.08);
            layer.position.z = -d * 0.6;
            // Tint layers purple for depth
            layer.material.color = new THREE.Color(0x7c6fff);
            logoGroup.add(layer);
        }

        // Glow: large slightly bigger plane behind, blurred/additive
        const glowMat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, opacity: 0.14, alphaTest: 0.01,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), glowMat);
        glow.position.z = -2;
        logoGroup.add(glow);

        // Edge strips (left/right/top/bottom thin bars for 3D coin effect)
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x7c6fff, emissive: 0x7c6fff, emissiveIntensity: 1.4 });
        [
            [0.3, 28, 0, -1.5, 0, 0], // bottom
            [0.3, 28, 0, 1.5, 0, 0], // top (slight positions off center)
        ] // Not adding edges since PlaneGeometry doesn't need them — keeps it clean

        // ── FLOATING DUPLICATES ───────────────────────────────
        const dupeCfgs = [
            { s: 7, x: -55, y: 22, z: -35, rx: 0.25, ry: 0.8, ds: 0.55, da: 3.5, fp: 0.0, op: 0.55 },
            { s: 4, x: 60, y: -20, z: -22, rx: -0.18, ry: -0.5, ds: 0.9, da: 2.5, fp: 1.2, op: 0.5 },
            { s: 9, x: 42, y: 38, z: -55, rx: 0.4, ry: 0.2, ds: 0.38, da: 4.0, fp: 2.1, op: 0.4 },
            { s: 3, x: -40, y: -30, z: -18, rx: 0.1, ry: 1.2, ds: 1.2, da: 2.0, fp: 3.5, op: 0.55 },
            { s: 5, x: 14, y: 50, z: -38, rx: -0.35, ry: 0.6, ds: 0.65, da: 3.2, fp: 0.8, op: 0.45 },
            { s: 8, x: -62, y: -8, z: -60, rx: 0.55, ry: -0.3, ds: 0.45, da: 4.5, fp: 4.2, op: 0.35 },
            { s: 3.5, x: 68, y: 18, z: -28, rx: -0.1, ry: 0.9, ds: 0.95, da: 2.2, fp: 1.8, op: 0.5 },
        ];

        dupeCfgs.forEach(cfg => {
            const dupe = new THREE.Group();
            const face = buildLogoMesh(tex, cfg.s * 2, cfg.op); // size * 2 because plane is in units
            dupe.add(face);

            // Depth layers for each dupe
            for (let d = 1; d <= 3; d++) {
                const dl = buildLogoMesh(tex, cfg.s * 2, cfg.op * 0.06);
                dl.position.z = -d * 0.3;
                dl.material.color = new THREE.Color(0x7c6fff);
                dupe.add(dl);
            }

            dupe.position.set(cfg.x, cfg.y, cfg.z);
            dupe.rotation.set(cfg.rx, cfg.ry, 0);
            dupe.userData = { driftSpeed: cfg.ds, driftAmp: cfg.da, floatPhase: cfg.fp, baseY: cfg.y };
            scene.add(dupe);
            floatingDupes.push(dupe);
        });

    }, undefined, () => {
        // Fallback: wireframe icosahedron if logo fails
        logoGroup.add(new THREE.Mesh(
            new THREE.IcosahedronGeometry(10, 1),
            new THREE.MeshStandardMaterial({ color: 0x0a0a28, wireframe: true, transparent: true, opacity: 0.4 })
        ));
    });

    // ── NEBULA DUST ───────────────────────────────────────────────
    const nebCount = isMobile ? 300 : 700;
    const nebPos = new Float32Array(nebCount * 3);
    for (let i = 0; i < nebCount; i++) {
        const i3 = i * 3;
        nebPos[i3] = (Math.random() - 0.5) * 130;
        nebPos[i3 + 1] = (Math.random() - 0.5) * 100;
        nebPos[i3 + 2] = -55 + Math.random() * -100;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({
        color: 0x7c6fff, size: 0.5, transparent: true, opacity: 0.06,
        blending: THREE.AdditiveBlending, depthWrite: false
    })));

    // ── MOUSE + CURSOR ────────────────────────────────────────────
    let mx = 0, my = 0;
    // Raw pixel coords for the scene cursor dot
    let rawX = window.innerWidth / 2, rawY = window.innerHeight / 2;

    document.addEventListener('mousemove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        rawX = e.clientX;
        rawY = e.clientY;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    // ── ANIMATION LOOP ────────────────────────────────────────────
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Main logo gentle sway
        logoGroup.rotation.y = Math.sin(t * 0.22) * 0.5;
        logoGroup.rotation.x = Math.sin(t * 0.13) * 0.12;

        // Orbit rings
        orbitRings[0].rotation.y = t * 0.18;
        orbitRings[0].rotation.x = Math.sin(t * 0.1) * 0.35;
        orbitRings[1].rotation.z = t * 0.14;
        orbitRings[2].rotation.y = -t * 0.2;
        orbitRings[2].rotation.z = t * 0.09;

        // Satellites
        sats.forEach(s => {
            const c = s.userData, a = t * c.speed + c.phase;
            s.position.set(Math.cos(a) * c.radius, Math.sin(a * 0.6) * c.radius * 0.45, Math.sin(a) * c.radius * 0.3);
        });

        // Floating dupes
        floatingDupes.forEach(d => {
            const ud = d.userData;
            d.position.y = ud.baseY + Math.sin(t * ud.driftSpeed + ud.floatPhase) * ud.driftAmp;
            d.rotation.y += 0.0025 * ud.driftSpeed;
            d.rotation.x = Math.sin(t * 0.28 + ud.floatPhase) * 0.12;
        });

        // Pulsing lights
        purpleLight.intensity = 8 + Math.sin(t * 1.4) * 2.5;
        greenLight.intensity = 4.5 + Math.sin(t * 1.1 + 1) * 1.5;

        // Stars drift
        starField.rotation.y = t * 0.005;

        // Shooting stars
        shooters.forEach(tickShooter);

        // Mouse parallax
        camera.position.x += (mx * 4 - camera.position.x) * 0.022;
        camera.position.y += (-my * 3.5 - camera.position.y) * 0.022;
        scene.position.y = -scrollY * 0.01;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    // ── RESIZE ────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
