// ================= SCENE SETUP =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(18, 14, 24);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // mobile/HiDPI friendly
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.update();

// ================= LIGHTS =================
const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x222233, 0.7);
hemiLight.position.set(0, 60, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(20, 30, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// ================= FLOOR / SKY =================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8, metalness: 0.2 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(90, 60, 0x00aaff, 0x003355);
grid.position.y = 0.01;
scene.add(grid);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(250, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x02030a, side: THREE.BackSide })
);
scene.add(sky);

// ================= HUB + RING =================
const hub = new THREE.Mesh(
  new THREE.CylinderGeometry(6, 6, 1.2, 48),
  new THREE.MeshStandardMaterial({
    color: 0x141433,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x111144,
    emissiveIntensity: 0.4
  })
);
hub.position.set(0, 0.6, 0);
hub.castShadow = true;
hub.receiveShadow = true;
scene.add(hub);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(7.5, 0.12, 16, 64),
  new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.8,
    metalness: 0.7,
    roughness: 0.2
  })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.9;
scene.add(ring);

// ================= BACK WALL + VIDEO SCREEN =================
const wall = new THREE.Mesh(
  new THREE.BoxGeometry(20, 10, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x080818, metalness: 0.3, roughness: 0.6 })
);
wall.position.set(0, 5.5, -14);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

// Video element + texture
const video = document.createElement("video");
video.src = "assets/video.mp4";
video.loop = true;
video.muted = true;               // start muted; we unmute on click
video.playsInline = true;         // mobile-friendly
video.setAttribute('playsinline', '');
video.webkitPlaysInline = true;
video.crossOrigin = 'anonymous';
video.load();

const videoTexture = new THREE.VideoTexture(video);
// IMPORTANT: Fix video colour + filtering + aliasing for r140
videoTexture.colorSpace = THREE.sRGBColorSpace;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;
videoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
videoTexture.wrapS = THREE.ClampToEdgeWrapping;
videoTexture.wrapT = THREE.ClampToEdgeWrapping;

// True 16:9 plane for 1080p/4K content (adjust size if you like)
const mainScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(12.8, 7.2),  // 16:9 at smaller size
  new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide })
);
mainScreen.position.set(0, 6.25, -13.7);
scene.add(mainScreen);

// ================= AVATARS =================
function createAvatar(color) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 1.7, 18),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xffe0bd })
  );
  head.position.y = 2.0;
  head.castShadow = true;
  group.add(head);

  return group;
}

const attendees = [];
[
  0x3399ff, 0x55ff99, 0xff6666, 0xffcc33,
  0xaa88ff, 0x33ddff, 0x88ffcc, 0xff88aa
].forEach((c, i, arr) => {
  const avatar = createAvatar(c);
  const angle = (i / arr.length) * Math.PI * 2; // even spacing
  const radius = 11 + (i % 2) * 1.5;
  avatar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  avatar.lookAt(0, 1.5, 0);
  scene.add(avatar);
  attendees.push(avatar);
});

// ================= CTA TABS =================
function createCTATab(text, width = 7, height = 1.2) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = Math.round((height / width) * 2048);

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Flat rectangle (square corners), gradient for subtle depth
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2b74ff");
  gradient.addColorStop(1, "#1e5df8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // White text
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(canvas.height * 0.30)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;

  // Use Basic so UI looks crisp (not lit)
  const mat = new THREE.MeshBasicMaterial({ map: tex });

  // Thin box so it has real depth (not just a plane)
  const geo = new THREE.BoxGeometry(width, height, 0.12);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 999; // keep on top visually
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  return mesh;
}

function updateCTAIcon(mesh, isPlaying, label) {
  const canvas = mesh.material.map.image;
  const ctx = canvas.getContext("2d");

  // Redraw background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2b74ff");
  gradient.addColorStop(1, "#1e5df8");
  ctx.fillStyle = gradient;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text with icon
  ctx.fillStyle = "#fff";
  ctx.font = `${Math.round(canvas.height * 0.30)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const icon = isPlaying ? "❚❚" : "►";
  ctx.fillText(`${icon}  ${label}`, canvas.width / 2, canvas.height / 2);

  mesh.material.map.needsUpdate = true;
}

// Video CTA (below screen)
const ctaVideo = createCTATab("Find out more about Scientific Computing", 7, 1.2);
ctaVideo.position.set(0, 1.8, -13.6);
scene.add(ctaVideo);

// ================= LOAD 3D MODEL =================
const loader = new THREE.GLTFLoader();
let modelRoot = null;

loader.load(
  "assets/quantum-model-shaded.glb",
  (gltf) => {
    modelRoot = gltf.scene;
    modelRoot.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Auto-scale model to exactly ~6 units tall
    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = 6;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    modelRoot.scale.setScalar(scale);

    // Recompute box, place at chosen spot (center here; adjust as you like)
    const box2 = new THREE.Box3().setFromObject(modelRoot);
    const min = box2.min;
    modelRoot.position.set(0, -min.y + 2, 0);
    scene.add(modelRoot);

    // Soft ambient for visibility
    const modelAmbient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(modelAmbient);
  },
  undefined,
  (err) => {
    console.error("Failed to load model:", err);
  }
);

// Model CTA (positioned relative to model)
const ctaModel = createCTATab("Find out more about the quantum level", 7, 1.2);
ctaModel.position.set(0, 9.25, 0);
scene.add(ctaModel);

// Face-camera helper (video CTA fixed; model CTA Y-only billboard)
function faceCamera(mesh, allowYOnly = false) {
  const v = new THREE.Vector3();
  camera.getWorldPosition(v);
  if (allowYOnly) {
    mesh.lookAt(v.x, mesh.position.y, v.z);
  } else {
    mesh.rotation.set(0, 0, 0); // fixed orientation (for video CTA)
  }
}

// ================= VOICEOVER (MP3) =================
const voiceover = new Audio("assets/quantum-voiceover.mp3");
voiceover.preload = "auto";
voiceover.loop = false;
voiceover.muted = true;

// --- One‑time mobile unlock for media (iOS/Android) ---
function unlockMediaOnce() {
  const tryVideo = video.play().then(() => { video.pause(); }).catch(() => {});
  const tryVoice = voiceover.play().then(() => { voiceover.pause(); }).catch(() => {});
  Promise.allSettled([tryVideo, tryVoice]).finally(() => {
    window.removeEventListener('pointerdown', unlockMediaOnce);
    window.removeEventListener('touchend', unlockMediaOnce);
    window.removeEventListener('click', unlockMediaOnce);
  });
}
window.addEventListener('pointerdown', unlockMediaOnce, { once: true });
window.addEventListener('touchend',  unlockMediaOnce,  { once: true });
window.addEventListener('click',      unlockMediaOnce, { once: true });

// ================= RAYCAST / INTERACTION =================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function intersectAt(event, objects) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ( (event.clientX - rect.left) / rect.width ) * 2 - 1;
  const y = - ( (event.clientY - rect.top) / rect.height ) * 2 + 1;
  mouse.set(x, y);
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, false);
}

// Mutually exclusive playback helpers
function playVideoWithAudio() {
  if (!voiceover.paused) {
    voiceover.pause();
    updateCTAIcon(ctaModel, false, "Quantum Level");
  }
  video.muted = false;
  video.volume = 1.0;
  return video.play().then(() => {
    updateCTAIcon(ctaVideo, true, "Scientific Computing");
  }).catch(() => {
    updateCTAIcon(ctaVideo, false, "Scientific Computing");
  });
}
function pauseVideo() {
  if (!video.paused) {
    video.pause();
    updateCTAIcon(ctaVideo, false, "Scientific Computing");
  }
}
function playVoiceoverOnly() {
  if (!video.paused) {
    video.pause();
    updateCTAIcon(ctaVideo, false, "Scientific Computing");
  }
  voiceover.muted = false;
  voiceover.volume = 1.0;
  return voiceover.play().then(() => {
    updateCTAIcon(ctaModel, true, "Quantum Level");
  }).catch(() => {
    updateCTAIcon(ctaModel, false, "Quantum Level");
  });
}
function pauseVoiceover() {
  if (!voiceover.paused) {
    voiceover.pause();
    updateCTAIcon(ctaModel, false, "Quantum Level");
  }
}

// Use pointer events (good for mobile + desktop)
renderer.domElement.addEventListener("pointerdown", (e) => {
  const hits = intersectAt(e, [ctaVideo, ctaModel, mainScreen]);
  if (hits.length === 0) return;

  const obj = hits[0].object;

  // VIDEO: clicking screen or its CTA
  if (obj === ctaVideo || obj === mainScreen) {
    if (video.paused) {
      playVideoWithAudio();
    } else {
      pauseVideo();
    }
    return;
  }

  // VOICEOVER: clicking model CTA
  if (obj === ctaModel) {
    if (voiceover.paused) {
      playVoiceoverOnly();
    } else {
      pauseVoiceover();
    }
  }
});

// Reset icons when media ends
video.addEventListener('ended', () => updateCTAIcon(ctaVideo, false, "Scientific Computing"));
voiceover.addEventListener('ended', () => updateCTAIcon(ctaModel, false, "Quantum Level"));

// ================= ANIMATION LOOP =================
function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  ring.rotation.z = t * 0.4;

  attendees.forEach((a, i) => {
    a.position.y = Math.sin(t * 1.2 + i) * 0.05;
  });

  // CTAs: video fixed, model faces camera around Y
  faceCamera(ctaVideo, false);
  faceCamera(ctaModel, true);

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ================= RESIZE =================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
