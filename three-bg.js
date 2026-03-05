// ── GTB LOGO — 3D MEDALLION CENTERPIECE ─────────────────────────
// Loads gtb-logo.png as a glowing 3D disc / medallion with orbit rings,
// space star field and shooting stars.
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // ── SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01010a, 0.005);

    // ── CAMERA ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 55;

    // ── RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── LIGHTS ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x060620, 2));

    const keyLight = new THREE.PointLight(0xffffff, 6, 200);
    keyLight.position.set(10, 15, 30);
    scene.add(keyLight);

    const purpleLight = new THREE.PointLight(0x7c6fff, 8, 150);
    purpleLight.position.set(-20, 10, 10);
    scene.add(purpleLight);

    const greenLight = new THREE.PointLight(0x00e5a0, 5, 120);
    greenLight.position.set(20, -15, 10);
    scene.add(greenLight);

    const backLight = new THREE.PointLight(0x4466ff, 3, 100);
    backLight.position.set(0, 0, -30);
    scene.add(backLight);

    // ── STAR FIELD ───────────────────────────────────────────────
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 1200 : 2800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3, r = 120 + Math.random() * 380,
            t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
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
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.7;
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(8 + Math.random() * 16, 0, 0)
        ]);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        line.rotation.z = angle;
        line.position.set((Math.random() - 0.5) * 180, 25 + Math.random() * 55, (Math.random() - 0.5) * 60);
        line.userData = {
            speed: 0.8 + Math.random() * 1.4, opacity: 0, phase: 'wait',
            wait: Math.random() * 9, traveled: 0, maxDist: 30 + Math.random() * 55,
            dx: Math.cos(angle) * -0.85, dy: Math.sin(angle) * -0.85
        };
        scene.add(line); return line;
    }
    for (let i = 0; i < (isMobile ? 4 : 9); i++) shooters.push(spawnShooter());

    function tickShooter(s) {
        const d = s.userData;
        if (d.phase === 'wait') { d.wait -= 0.016; if (d.wait <= 0) d.phase = 'appear'; }
        else if (d.phase === 'appear') { d.opacity = Math.min(d.opacity + 0.09, 1); s.material.opacity = d.opacity; if (d.opacity >= 1) d.phase = 'travel'; }
        else if (d.phase === 'travel') { s.position.x += d.dx * d.speed; s.position.y += d.dy * d.speed; d.traveled += d.speed; if (d.traveled >= d.maxDist) d.phase = 'fade'; }
        else {
            d.opacity = Math.max(d.opacity - 0.13, 0); s.material.opacity = d.opacity;
            if (d.opacity <= 0) { const a = -Math.PI / 4 + (Math.random() - 0.5) * 0.7; s.rotation.z = a; s.position.set((Math.random() - 0.5) * 180, 25 + Math.random() * 55, (Math.random() - 0.5) * 60); Object.assign(d, { speed: 0.8 + Math.random() * 1.4, opacity: 0, phase: 'wait', wait: 2 + Math.random() * 8, traveled: 0, maxDist: 30 + Math.random() * 55, dx: Math.cos(a) * -0.85, dy: Math.sin(a) * -0.85 }); }
        }
    }

    // ── GTB LOGO MEDALLION ───────────────────────────────────────
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // Floating duplicate logo instances (populated after texture loads)
    const floatingDupes = [];

    // Load the logo texture
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
        // Try relative path (works when served via GitHub Pages or local server)
        'gtb-logo.png',
        (logoTex) => {
            logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

            // ── FRONT FACE (logo) ─────────────────────────────
            const frontGeo = new THREE.CircleGeometry(12, 64);
            const frontMat = new THREE.MeshStandardMaterial({
                map: logoTex,
                metalness: 0.5,
                roughness: 0.25,
                emissiveMap: logoTex,
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 0.4,
                transparent: true,
                alphaTest: 0.05,
                side: THREE.FrontSide
            });
            const frontFace = new THREE.Mesh(frontGeo, frontMat);
            frontFace.position.z = 1.6;
            logoGroup.add(frontFace);

            // ── BACK FACE (mirrored) ─────────────────────────
            const backFace = frontFace.clone();
            backFace.position.z = -1.6;
            backFace.rotation.y = Math.PI;
            logoGroup.add(backFace);

            // ── MEDALLION BODY (cylinder for thickness) ───────
            const bodyGeo = new THREE.CylinderGeometry(12, 12, 3.2, 64, 1, true);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x08081a,
                metalness: 1.0,
                roughness: 0.08,
                emissive: 0x180840,
                emissiveIntensity: 0.3,
                side: THREE.BackSide
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.rotation.x = Math.PI / 2;
            logoGroup.add(body);

            // EDGE TRIM — thin bright ring on the medallion edge
            const edgeTrimGeo = new THREE.TorusGeometry(12, 0.18, 12, 80);
            const edgeTrimMat = new THREE.MeshStandardMaterial({
                color: 0x7c6fff, emissive: 0x7c6fff, emissiveIntensity: 1.2,
                metalness: 0.6, roughness: 0.15
            });
            const edgeFront = new THREE.Mesh(edgeTrimGeo, edgeTrimMat);
            edgeFront.position.z = 1.6;
            logoGroup.add(edgeFront);
            const edgeBack = edgeFront.clone();
            edgeBack.position.z = -1.6;
            logoGroup.add(edgeBack);

            // ── GLOW DISC (soft halo behind front face) ────────
            const glowGeo = new THREE.CircleGeometry(15, 64);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0x7c6fff,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const glowDisc = new THREE.Mesh(glowGeo, glowMat);
            glowDisc.position.z = -0.5;
            logoGroup.add(glowDisc);

            // ── FLOATING DUPLICATES ─────────────────────────
            // Config: [scale, x, y, z, rotX, rotY, driftSpeed, driftAmp, floatPhase]
            const dupeConfigs = [
                { s: 0.22, x: -55, y: 28, z: -30, rx: 0.3, ry: 0.8, ds: 0.6, da: 3.5, fp: 0.0, op: 0.55 },
                { s: 0.14, x: 58, y: -22, z: -20, rx: -0.2, ry: -0.5, ds: 0.9, da: 2.5, fp: 1.2, op: 0.45 },
                { s: 0.30, x: 40, y: 35, z: -50, rx: 0.5, ry: 0.2, ds: 0.4, da: 4.0, fp: 2.1, op: 0.35 },
                { s: 0.10, x: -38, y: -32, z: -15, rx: 0.1, ry: 1.2, ds: 1.2, da: 2.0, fp: 3.5, op: 0.5 },
                { s: 0.18, x: 12, y: 48, z: -35, rx: -0.4, ry: 0.6, ds: 0.7, da: 3.0, fp: 0.8, op: 0.4 },
                { s: 0.25, x: -60, y: -10, z: -55, rx: 0.6, ry: -0.3, ds: 0.5, da: 4.5, fp: 4.2, op: 0.3 },
                { s: 0.12, x: 65, y: 15, z: -25, rx: -0.1, ry: 0.9, ds: 1.0, da: 2.2, fp: 1.8, op: 0.5 },
            ];

            dupeConfigs.forEach(cfg => {
                const dupe = new THREE.Group();

                // Front face
                const dFront = new THREE.Mesh(
                    new THREE.CircleGeometry(12, 48),
                    new THREE.MeshStandardMaterial({
                        map: logoTex,
                        metalness: 0.4,
                        roughness: 0.3,
                        emissiveMap: logoTex,
                        emissive: new THREE.Color(0xffffff),
                        emissiveIntensity: 0.35,
                        transparent: true,
                        alphaTest: 0.05,
                        opacity: cfg.op
                    })
                );
                dFront.position.z = 1.2;
                dupe.add(dFront);

                // Back face
                const dBack = dFront.clone();
                dBack.position.z = -1.2;
                dBack.rotation.y = Math.PI;
                dupe.add(dBack);

                // Thin edge ring
                const dEdge = new THREE.Mesh(
                    new THREE.TorusGeometry(12, 0.15, 8, 60),
                    new THREE.MeshStandardMaterial({
                        color: 0x7c6fff, emissive: 0x7c6fff,
                        emissiveIntensity: 0.9, transparent: true, opacity: cfg.op * 0.9
                    })
                );
                dEdge.position.z = 1.2;
                dupe.add(dEdge);

                dupe.scale.setScalar(cfg.s);
                dupe.position.set(cfg.x, cfg.y, cfg.z);
                dupe.rotation.set(cfg.rx, cfg.ry, 0);

                // Store drift metadata for animation
                dupe.userData = { driftSpeed: cfg.ds, driftAmp: cfg.da, floatPhase: cfg.fp, baseY: cfg.y };
                scene.add(dupe);
                floatingDupes.push(dupe);
            });
        },
        undefined,
        () => {
            // Fallback — plain disc if image fails to load
            const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(12, 12, 3.2, 64),
                new THREE.MeshStandardMaterial({ color: 0x0a0a28, metalness: 1.0, roughness: 0.1 })
            );
            disc.rotation.x = Math.PI / 2;
            logoGroup.add(disc);
        }
    );

    // ── ORBIT RINGS ───────────────────────────────────────────────
    const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(20, 0.4, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0x7c6fff, emissive: 0x7c6fff, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.9 })
    );
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(26, 0.25, 16, 120),
        new THREE.MeshStandardMaterial({ color: 0x00e5a0, emissive: 0x00e5a0, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.7 })
    );
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    const ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(16, 0.2, 12, 80),
        new THREE.MeshStandardMaterial({ color: 0x4466ff, emissive: 0x4466ff, emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.6 })
    );
    ring3.rotation.y = Math.PI / 4;
    ring3.rotation.x = Math.PI / 6;
    scene.add(ring3);

    // ── SATELLITES ────────────────────────────────────────────────
    const satConfigs = [
        { radius: 22, speed: 0.5, color: 0x7c6fff, phase: 0, size: 0.6 },
        { radius: 27, speed: 0.3, color: 0x00e5a0, phase: 2.1, size: 0.5 },
        { radius: 17, speed: 0.8, color: 0xffffff, phase: 4.2, size: 0.35 },
        { radius: 24, speed: 0.4, color: 0x4488ff, phase: 1.0, size: 0.45 }
    ];
    const satellites = satConfigs.map(cfg => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(cfg.size, 12, 12),
            new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 1.5 })
        );
        mesh.userData = cfg;
        scene.add(mesh);
        return mesh;
    });

    // ── NEBULA ────────────────────────────────────────────────────
    const nebCount = isMobile ? 300 : 700;
    const nebPos = new Float32Array(nebCount * 3);
    for (let i = 0; i < nebCount; i++) {
        const i3 = i * 3;
        nebPos[i3] = (Math.random() - 0.5) * 120;
        nebPos[i3 + 1] = (Math.random() - 0.5) * 100;
        nebPos[i3 + 2] = -50 + Math.random() * -100;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({
        color: 0x7c6fff, size: 0.5, transparent: true, opacity: 0.06,
        blending: THREE.AdditiveBlending, depthWrite: false
    })));

    // ── MOUSE & SCROLL ────────────────────────────────────────────
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    // ── ANIMATION LOOP ────────────────────────────────────────────
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Logo medallion: gentle tilt/sway, always facing camera mostly
        logoGroup.rotation.y = Math.sin(t * 0.25) * 0.7;
        logoGroup.rotation.x = Math.sin(t * 0.15) * 0.15;

        // Orbit rings spin
        ring1.rotation.y = t * 0.18;
        ring1.rotation.x = Math.sin(t * 0.1) * 0.3;
        ring2.rotation.z = t * 0.12;
        ring3.rotation.y = -t * 0.22;
        ring3.rotation.z = t * 0.08;

        // Satellites orbit
        satellites.forEach(s => {
            const cfg = s.userData;
            const a = t * cfg.speed + cfg.phase;
            s.position.x = Math.cos(a) * cfg.radius;
            s.position.y = Math.sin(a * 0.65) * cfg.radius * 0.45;
            s.position.z = Math.sin(a) * cfg.radius * 0.3;
        });

        // Floating duplicates — independent sine-wave drift
        floatingDupes.forEach(d => {
            const ud = d.userData;
            d.position.y = ud.baseY + Math.sin(t * ud.driftSpeed + ud.floatPhase) * ud.driftAmp;
            d.rotation.y += 0.003 * ud.driftSpeed;
            d.rotation.x = Math.sin(t * 0.3 + ud.floatPhase) * 0.1;
        });

        // Pulsing lights
        purpleLight.intensity = 7 + Math.sin(t * 1.3) * 2;
        greenLight.intensity = 4 + Math.sin(t * 1.1 + 1) * 1.5;

        // Star field slow rotation
        starField.rotation.y = t * 0.005;

        // Shooting stars
        shooters.forEach(tickShooter);

        // Mouse parallax
        camera.position.x += (mx * 4 - camera.position.x) * 0.02;
        camera.position.y += (-my * 3 - camera.position.y) * 0.02;
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
