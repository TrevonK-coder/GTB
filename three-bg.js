// ── GTB SPACE SCENE — Thick Medallion + Iced Diamond Chain ──────
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // ── SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01010a, 0.004);

    const isMobile = window.innerWidth < 768;

    // ── CAMERA ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 60;

    // ── RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // ── LIGHTS ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x080820, 2.5));

    const keyLight = new THREE.PointLight(0xffffff, 5, 200); keyLight.position.set(20, 30, 45); scene.add(keyLight);
    const purpleLight = new THREE.PointLight(0x7755ee, 8, 160); purpleLight.position.set(-22, 14, 18); scene.add(purpleLight);
    const greenLight = new THREE.PointLight(0x00c490, 4, 140); greenLight.position.set(26, -18, 14); scene.add(greenLight);
    const backLight = new THREE.PointLight(0x1133cc, 2, 110); backLight.position.set(0, 0, -40); scene.add(backLight);
    const rimLight = new THREE.PointLight(0x8866dd, 5, 70); rimLight.position.set(0, 0, 20); scene.add(rimLight);

    // ── STAR FIELD ───────────────────────────────────────────────
    const starCount = isMobile ? 1400 : 3200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3, r = 130 + Math.random() * 450;
        const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
        starPos[i3] = r * Math.sin(p) * Math.cos(t);
        starPos[i3 + 1] = r * Math.sin(p) * Math.sin(t);
        starPos[i3 + 2] = r * Math.cos(p);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xdde8ff, size: 0.28, transparent: true, opacity: 0.75,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    }));
    scene.add(starField);

    // ── SHOOTING STARS ───────────────────────────────────────────
    const shooters = [];
    function spawnShooter() {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.8;
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(10 + Math.random() * 22, 0, 0)
        ]);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        line.rotation.z = angle;
        line.position.set((Math.random() - 0.5) * 220, 28 + Math.random() * 65, (Math.random() - 0.5) * 65);
        line.userData = {
            speed: 1 + Math.random() * 1.6, opacity: 0, phase: 'wait',
            wait: Math.random() * 11, traveled: 0, maxDist: 35 + Math.random() * 65,
            dx: Math.cos(angle) * -0.95, dy: Math.sin(angle) * -0.95
        };
        scene.add(line); return line;
    }
    for (let i = 0; i < (isMobile ? 6 : 12); i++) shooters.push(spawnShooter());

    function tickShooter(s) {
        const d = s.userData;
        if (d.phase === 'wait') {
            d.wait -= 0.016; if (d.wait <= 0) d.phase = 'appear';
        } else if (d.phase === 'appear') {
            d.opacity = Math.min(d.opacity + 0.09, 1); s.material.opacity = d.opacity;
            if (d.opacity >= 1) d.phase = 'travel';
        } else if (d.phase === 'travel') {
            s.position.x += d.dx * d.speed; s.position.y += d.dy * d.speed;
            d.traveled += d.speed; if (d.traveled >= d.maxDist) d.phase = 'fade';
        } else {
            d.opacity = Math.max(d.opacity - 0.16, 0); s.material.opacity = d.opacity;
            if (d.opacity <= 0) {
                const a = -Math.PI / 4 + (Math.random() - 0.5) * 0.7;
                s.rotation.z = a;
                s.position.set((Math.random() - 0.5) * 220, 28 + Math.random() * 65, (Math.random() - 0.5) * 65);
                Object.assign(d, {
                    speed: 1 + Math.random() * 1.7, opacity: 0, phase: 'wait',
                    wait: 2 + Math.random() * 10, traveled: 0, maxDist: 35 + Math.random() * 65,
                    dx: Math.cos(a) * -0.95, dy: Math.sin(a) * -0.95
                });
            }
        }
    }

    // ── SPIRAL GALAXIES ───────────────────────────────────────────
    function makeGalaxy(cfg) {
        const count = isMobile ? 1000 : 2400;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorInner = new THREE.Color(cfg.colorIn);
        const colorOuter = new THREE.Color(cfg.colorOut);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = Math.random() * cfg.radius;
            const spinAngle = radius * cfg.spin;
            const branchAngle = ((i % cfg.branches) / cfg.branches) * Math.PI * 2;
            const rand = (v) => (Math.random() - 0.5) * v;
            const rX = rand(cfg.spread) * (1 - radius / cfg.radius);
            const rY = rand(cfg.spread * 0.25);
            const rZ = rand(cfg.spread) * (1 - radius / cfg.radius);
            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rX;
            positions[i3 + 1] = rY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rZ;
            const mixedColor = colorInner.clone().lerp(colorOuter, radius / cfg.radius);
            colors[i3] = mixedColor.r; colors[i3 + 1] = mixedColor.g; colors[i3 + 2] = mixedColor.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: cfg.particleSize, vertexColors: true, transparent: true, opacity: cfg.opacity,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        });
        const points = new THREE.Points(geo, mat);
        points.position.set(...cfg.position);
        points.rotation.set(...cfg.rotation);
        points.userData.rotSpeedY = cfg.rotSpeedY;
        points.userData.rotSpeedZ = cfg.rotSpeedZ;
        scene.add(points);
        return points;
    }

    const galaxies = [
        makeGalaxy({ radius: 30, spin: 1.8, branches: 3, spread: 6, particleSize: 0.26, opacity: 0.7, colorIn: 0x9b7fff, colorOut: 0x00e5a0, position: [5, -2, -8], rotation: [0.5, 0, 0], rotSpeedY: 0.06, rotSpeedZ: 0.01 }),
        makeGalaxy({ radius: 22, spin: 2.2, branches: 2, spread: 5, particleSize: 0.2, opacity: 0.55, colorIn: 0x00e5a0, colorOut: 0x4488ff, position: [-8, 3, -12], rotation: [-0.4, 0.6, 0.2], rotSpeedY: -0.08, rotSpeedZ: 0.015 }),
        makeGalaxy({ radius: 16, spin: 1.5, branches: 4, spread: 4, particleSize: 0.16, opacity: 0.45, colorIn: 0xffffff, colorOut: 0x7c6fff, position: [2, 6, -5], rotation: [1.2, 0.3, 0], rotSpeedY: 0.10, rotSpeedZ: -0.02 }),
    ];

    // ── NEBULA CLOUDS ─────────────────────────────────────────────
    function makeCloud(color, cx, cy, cz, spread, count, size, opacity) {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = spread * Math.cbrt(Math.random());
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            pos[i3] = cx + r * Math.sin(ph) * Math.cos(th);
            pos[i3 + 1] = cy + r * Math.sin(ph) * Math.sin(th) * 0.5;
            pos[i3 + 2] = cz + r * Math.cos(ph) * 0.4;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color, size, transparent: true, opacity,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        });
        const cloud = new THREE.Points(geo, mat);
        scene.add(cloud);
        return cloud;
    }

    const clouds = [
        makeCloud(0x7c6fff, -30, 16, -20, 18, isMobile ? 280 : 650, 1.5, 0.06),
        makeCloud(0x00e5a0, 32, -20, -15, 14, isMobile ? 190 : 480, 1.3, 0.048),
        makeCloud(0x4488ff, 5, -32, -28, 22, isMobile ? 240 : 580, 1.9, 0.042),
        makeCloud(0xffffff, -16, 28, -32, 10, isMobile ? 140 : 320, 1.0, 0.038),
    ];

    // ══════════════════════════════════════════════════════════════
    // ── THICK 3D MEDALLION BUILDER ────────────────────────────────
    // ══════════════════════════════════════════════════════════════

    /**
     * Build a thick extruded logo medallion from a PNG texture.
     * @param {THREE.Texture} tex  - logo texture
     * @param {number}  faceSize  - diameter of the main face
     * @param {number}  layers    - number of depth layers
     * @param {number}  layerStep - z-offset between layers (total thickness = layers * layerStep)
     * @param {number}  faceOpacity - front face opacity
     * @param {boolean} addRim    - whether to add TorusGeometry edge ring
     * @returns {THREE.Group}
     */
    function buildMedallion(tex, faceSize = 28, layers = 18, layerStep = 0.28, faceOpacity = 1) {
        const grp = new THREE.Group();

        // ── FRONT FACE ────────────────────────────────────────────
        const frontMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            alphaTest: 0.02,
            depthWrite: false,
            opacity: faceOpacity,
        });
        const frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(faceSize, faceSize), frontMat);
        frontMesh.position.z = layers * layerStep * 0.5;
        grp.add(frontMesh);

        // ── DEPTH LAYERS — neutral dark, very low opacity ─────────
        for (let d = 1; d <= layers; d++) {
            const pct = d / layers;
            const layerOpacity = faceOpacity * 0.04 * (1 - pct * 0.9);
            const mat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                alphaTest: 0.02,
                depthWrite: false,
                opacity: layerOpacity,
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(faceSize, faceSize), mat);
            mesh.position.z = (layers * 0.5 - d) * layerStep;
            grp.add(mesh);
        }

        // ── SCAN LINE ─────────────────────────────────────────────
        const scanMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false,
            side: THREE.DoubleSide
        });
        const scanLine = new THREE.Mesh(
            new THREE.PlaneGeometry(faceSize * 0.95, faceSize * 0.018),
            scanMat
        );
        scanLine.position.z = layers * layerStep * 0.5 + 0.1;
        scanLine.userData.isScanLine = true;
        grp.add(scanLine);
        grp.userData.scanLine = scanLine;
        grp.userData.scanPhase = 0;
        grp.userData.faceSize = faceSize;
        grp.userData.medalThick = layers * layerStep;

        return grp;
    }


    // ── GTB LOGO GROUP ────────────────────────────────────────────
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);



    // Floating duplicates populated after texture loads
    const floatingDupes = [];

    // ── LOAD LOGO TEXTURE ─────────────────────────────────────────
    const texLoader = new THREE.TextureLoader();
    texLoader.load('gtb-logo.png', (tex) => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // ── MAIN HERO MEDALLION ───────────────────────────────────
        const medallion = buildMedallion(tex, 28, 40, 0.28, 1, true);
        logoGroup.add(medallion);
        logoGroup.userData.medallion = medallion;

        // ── FLOATING MINI MEDALLIONS ──────────────────────────────
        const dupeCfgs = [
            { s: 8, x: -55, y: 22, z: -38, rx: 0.25, ry: 0.8, ds: 0.55, da: 3.5, fp: 0.0, op: 0.75 },
            { s: 5, x: 62, y: -20, z: -24, rx: -0.18, ry: -0.5, ds: 0.9, da: 2.5, fp: 1.2, op: 0.7 },
            { s: 10, x: 44, y: 40, z: -58, rx: 0.4, ry: 0.2, ds: 0.38, da: 4.0, fp: 2.1, op: 0.6 },
            { s: 4, x: -42, y: -32, z: -20, rx: 0.1, ry: 1.2, ds: 1.2, da: 2.0, fp: 3.5, op: 0.7 },
            { s: 6, x: 16, y: 52, z: -40, rx: -0.35, ry: 0.6, ds: 0.65, da: 3.2, fp: 0.8, op: 0.65 },
            { s: 9, x: -65, y: -8, z: -65, rx: 0.55, ry: -0.3, ds: 0.45, da: 4.5, fp: 4.2, op: 0.55 },
            { s: 4, x: 72, y: 20, z: -30, rx: -0.1, ry: 0.9, ds: 0.95, da: 2.2, fp: 1.8, op: 0.65 },
        ];

        dupeCfgs.forEach(cfg => {
            // Fewer layers for perf on dupes (still looks thick)
            const dupe = buildMedallion(tex, cfg.s * 2, 18, 0.22, cfg.op, cfg.s > 5);
            dupe.position.set(cfg.x, cfg.y, cfg.z);
            dupe.rotation.set(cfg.rx, cfg.ry, 0);
            dupe.userData.driftSpeed = cfg.ds;
            dupe.userData.driftAmp = cfg.da;
            dupe.userData.floatPhase = cfg.fp;
            dupe.userData.baseY = cfg.y;
            scene.add(dupe);
            floatingDupes.push(dupe);
        });

    }, undefined, () => {
        // Fallback: glowing icosahedron if logo fails
        const fallback = new THREE.Mesh(
            new THREE.IcosahedronGeometry(12, 2),
            new THREE.MeshStandardMaterial({ color: 0x3322aa, wireframe: true, transparent: true, opacity: 0.5 })
        );
        logoGroup.add(fallback);
    });

    // ══════════════════════════════════════════════════════════════
    // ── ICED DIAMOND CHAIN — subtle, fewer gems
    // ══════════════════════════════════════════════════════════════
    const diamondChain = new THREE.Group();
    const chainDiamonds = [];
    const CHAIN_COUNT = 18;          // reduced from 36
    const CHAIN_RADIUS = 19.5;

    // Shared diamond geometries (detail=1 for less faceted look)
    const smallDiaGeoA = new THREE.OctahedronGeometry(0.42, 1);  // smaller
    const largeDiaGeoA = new THREE.OctahedronGeometry(0.8, 1);   // smaller pendant

    // Dim, near-white — barely-there ice
    const iceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xd0d8ee),
        emissive: new THREE.Color(0x334466),
        emissiveIntensity: 0.18,
        roughness: 0.05,
        metalness: 1.0,
        transparent: true,
        opacity: 0.7,
        envMapIntensity: 2.5,
    });
    // Soft violet for pendants
    const pendantMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xccbbff),
        emissive: new THREE.Color(0x553399),
        emissiveIntensity: 0.25,
        roughness: 0.05,
        metalness: 1.0,
        transparent: true,
        opacity: 0.75,
        envMapIntensity: 2.5,
    });

    // Link bar (very thin)
    const linkMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8878cc),
        emissive: new THREE.Color(0x334488), // Kept emissive for consistency, but it's muted
        emissiveIntensity: 0.0, // Muted
        roughness: 0.2,
        metalness: 1.0,
        transparent: true,
        opacity: 0.35,
    });

    for (let i = 0; i < CHAIN_COUNT; i++) {
        const angle = (i / CHAIN_COUNT) * Math.PI * 2;
        const isPendant = i % 3 === 0;         // large gold pendant every 3rd
        const geo = isPendant ? largeDiaGeoA : smallDiaGeoA;
        const mat = isPendant ? pendantMat : iceMat;

        const dia = new THREE.Mesh(geo, mat);
        dia.position.x = Math.cos(angle) * CHAIN_RADIUS;
        dia.position.y = Math.sin(angle) * CHAIN_RADIUS * 0.18; // slight oval for perspective
        dia.position.z = 0;
        // Rotate each diamond on its own axis for facet sparkle
        dia.rotation.x = Math.random() * Math.PI;
        dia.rotation.z = Math.random() * Math.PI;

        // Very faint glow — pendant only
        if (isPendant) {
            const haloMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x9977ff),
                transparent: true, opacity: 0.07,
                blending: THREE.AdditiveBlending, depthWrite: false,
                side: THREE.DoubleSide
            });
            const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), haloMat);
            halo.position.copy(dia.position);
            diamondChain.add(halo);
        }

        // Link bar between this and next diamond
        const nextAngle = ((i + 1) / CHAIN_COUNT) * Math.PI * 2;
        const nx = Math.cos(nextAngle) * CHAIN_RADIUS;
        const ny = Math.sin(nextAngle) * CHAIN_RADIUS * 0.18;
        // Midpoint and distance
        const mx2 = (dia.position.x + nx) / 2;
        const my2 = (dia.position.y + ny) / 2;
        const dist = Math.sqrt((nx - dia.position.x) ** 2 + (ny - dia.position.y) ** 2);
        const linkGeo = new THREE.CylinderGeometry(0.045, 0.045, dist, 4);
        const link = new THREE.Mesh(linkGeo, linkMat);
        link.position.set(mx2, my2, 0);
        link.rotation.z = Math.atan2(ny - dia.position.y, nx - dia.position.x) + Math.PI / 2;
        diamondChain.add(link);

        diamondChain.add(dia);
        chainDiamonds.push({ mesh: dia, baseAngle: angle, isPendant });
    }

    // Add chain to logo group so it moves with the medallion
    logoGroup.add(diamondChain);

    // ── NEBULA DUST ───────────────────────────────────────────────
    const nebCount = isMobile ? 300 : 700;
    const nebPos = new Float32Array(nebCount * 3);
    for (let i = 0; i < nebCount; i++) {
        const i3 = i * 3;
        nebPos[i3] = (Math.random() - 0.5) * 140;
        nebPos[i3 + 1] = (Math.random() - 0.5) * 110;
        nebPos[i3 + 2] = -60 + Math.random() * -110;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    scene.add(new THREE.Points(nebGeo, new THREE.PointsMaterial({
        color: 0x7c6fff, size: 0.6, transparent: true, opacity: 0.07,
        blending: THREE.AdditiveBlending, depthWrite: false
    })));

    // ── MOUSE TRACKING ────────────────────────────────────────────
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    // ── ANIMATION LOOP ────────────────────────────────────────────
    const clock = new THREE.Clock();

    function tickScanLine(grp, t) {
        if (!grp.userData.scanLine) return;
        const scan = grp.userData.scanLine;
        const half = grp.userData.faceSize * 0.5;
        const speed = 0.6; // full sweep every ~3.3s
        const cycle = (t * speed) % 1;        // 0→1
        const yPos = -half + cycle * half * 2; // -half → +half

        // Fade in at bottom, full in middle, fade out at top
        const fadeEdge = 0.18;
        let alpha;
        if (cycle < fadeEdge) alpha = cycle / fadeEdge;
        else if (cycle > 1 - fadeEdge) alpha = (1 - cycle) / fadeEdge;
        else alpha = 1;

        scan.position.y = yPos;
        scan.material.opacity = alpha * 0.55;
    }

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // ── Main logo group gentle floating sway ──────────────────
        logoGroup.rotation.y = Math.sin(t * 0.20) * 0.35;
        logoGroup.rotation.x = Math.sin(t * 0.12) * 0.10;

        // ── Energy rings orbit ────────────────────────────────────


        // ── Scan line on hero medallion ───────────────────────────
        if (logoGroup.userData.medallion) {
            tickScanLine(logoGroup.userData.medallion, t);
        }

        // ── Floating dupes update ─────────────────────────────────
        floatingDupes.forEach(d => {
            const ud = d.userData;
            d.position.y = ud.baseY + Math.sin(t * ud.driftSpeed + ud.floatPhase) * ud.driftAmp;
            d.rotation.y += 0.003 * ud.driftSpeed;
            d.rotation.x = Math.sin(t * 0.25 + ud.floatPhase) * 0.14;
            // Scan lines on dupes
            tickScanLine(d, t + ud.floatPhase);
        });

        // ── Diamond chain slow orbit ──────────────────────────────
        // Entire chain group rotates on its Y axis slowly
        diamondChain.rotation.y = t * 0.055;
        diamondChain.rotation.z = Math.sin(t * 0.09) * 0.04;

        // Individual diamond sparkle — very slow, subtle
        chainDiamonds.forEach((d, i) => {
            const spd = d.isPendant ? 0.25 : 0.45;
            d.mesh.rotation.y += spd * 0.008;
            d.mesh.rotation.x += spd * 0.005;
            // Gentle emissive flicker
            const pulse = 0.5 + Math.sin(t * 1.4 + i * 0.4) * 0.5;
            d.mesh.material.emissiveIntensity = d.isPendant
                ? 0.15 + pulse * 0.18
                : 0.08 + pulse * 0.12;
        });


        galaxies.forEach(g => {
            g.rotation.y += g.userData.rotSpeedY * 0.006;
            g.rotation.z += g.userData.rotSpeedZ * 0.006;
        });

        // ── Clouds drift ──────────────────────────────────────────
        clouds.forEach((c, i) => {
            c.rotation.y = t * 0.01 * (i % 2 === 0 ? 1 : -1);
            c.position.y += Math.sin(t * 0.12 + i * 1.2) * 0.003;
        });

        // ── Pulsing lights — softer
        purpleLight.intensity = 7 + Math.sin(t * 1.4) * 2;
        greenLight.intensity = 3.5 + Math.sin(t * 1.1 + 1) * 1.2;
        rimLight.intensity = 4 + Math.sin(t * 2.2 + 0.5) * 1.5;

        // ── Stars drift ───────────────────────────────────────────
        starField.rotation.y = t * 0.004;

        // ── Shooting stars ────────────────────────────────────────
        shooters.forEach(tickShooter);

        // ── Mouse parallax — intensified tilt for medallion feel ──
        const targetX = mx * 6;
        const targetY = -my * 5;
        camera.position.x += (targetX - camera.position.x) * 0.028;
        camera.position.y += (targetY - camera.position.y) * 0.028;
        scene.position.y = -scrollY * 0.012;
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
