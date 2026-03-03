// ================= SCENE SETUP =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(18, 14, 24);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding; // correct for r140
renderer.outputColorSpace = THREE.SRGBColorSpace || undefined; // optional fallback
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.update();

// ================= LIGHTS =================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(20, 30, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// ================= FLOOR / SKY =================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.8,
    metalness: 0.2
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(90, 60, 0x00aaff, 0x003355);
grid.position.y = 0.01;
scene.add(grid);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(250, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x02030a,
    side: THREE.BackSide
  })
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

// ================= BACK WALL =================
const wall = new THREE.Mesh(
  new THREE.BoxGeometry(20, 10, 0.6),
  new THREE.MeshStandardMaterial({
    color: 0x080818,
    metalness: 0.3,
    roughness: 0.6
  })
);
wall.position.set(0, 5.5, -14);
scene.add(wall);

// ================= VIDEO SETUP =================
const video = document.createElement("video");
video.src = "assets/video.mp4"; // FIXED NAME
video.loop = true;
video.muted = true;
video.playsInline = true;
video.setAttribute("playsinline", "");
video.setAttribute("webkit-playsinline", "");
video.load();

const videoTexture = new THREE.VideoTexture(video);
videoTexture.encoding = THREE.sRGBEncoding; // FOR r140
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;

const mainScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(12.8, 7.2),
  new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true
  })
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
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xffe0bd })
  );
  head.position.y = 2.0;
  group.add(head);

  return group;
}

const attendees = [];
[
  0x3399ff, 0x55ff99, 0xff6666, 0xffcc33,
  0xaa88ff, 0x33ddff, 0x88ffcc, 0xff88aa
].forEach((c, i, arr) => {
  const avatar = createAvatar(c);
  const angle = (i / arr.length) * Math.PI * 2;
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

  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#2b74ff");
  g.addColorStop(1, "#1e5df8");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(canvas.height * 0.30)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.12),
    new THREE.MeshBasicMaterial({ map: tex })
  );

  mesh.renderOrder = 999;
  return mesh;
}

function updateCTAIcon(mesh, isPlaying, label) {
  const canvas = mesh.material.map.image;
  const ctx = canvas.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#2b74ff");
  g.addColorStop(1, "#1e5df8");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = `${Math.round(canvas.height * 0.30)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const icon = isPlaying ? "❚❚" : "►";
  ctx.fillText(`${icon}  ${label}`, canvas.width / 2, canvas.height / 2);

  mesh.material.map.needsUpdate = true;
}

const ctaVideo = createCTATab(
  "Find out more about Scientific Computing",
  7,
  1.2
);
ctaVideo.position.set(0, 1.8, -13.6);
scene.add(ctaVideo);

// ================= MODEL LOADING =================
let modelRoot = null;
const loader = new THREE.GLTFLoader();

loader.load(
  "assets/quantum-model-shaded.glb",
  function (gltf) {
    modelRoot = gltf.scene;

    modelRoot.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);

    const scale = 6 / size.y;
    modelRoot.scale.setScalar(scale);

    const box2 = new THREE.Box3().setFromObject(modelRoot);
    const min = box2.min;
    modelRoot.position.set(0, -min.y + 2, 0);

    scene.add(modelRoot);

    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(amb);
  },
  undefined,
  function (err) {
    console.error("Model load error:", err);
  }
);

const ctaModel = createCTATab("Find out more about the quantum level", 7, 1.2);
ctaModel.position.set(0, 9.25, 0);
scene.add(ctaModel);

// ================= MEDIA =================
const voiceover = new Audio("assets/quantum-voiceover.mp3");
voiceover.muted = true;
voiceover.preload = "auto";

// ================= RAYCASTING =================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function intersectAt(e, objects) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, false);
}

// AUDIO/VIDEO CONTROL
function playVideo() {
  voiceover.pause();
  video.muted = false;
  return video.play().then(() => {
    updateCTAIcon(ctaVideo, true, "Scientific Computing");
  });
}

function pauseVideo() {
  video.pause();
  updateCTAIcon(ctaVideo, false, "Scientific Computing");
}

function playVoice() {
  video.pause();
  voiceover.muted = false;
  return voiceover.play().then(() => {
    updateCTAIcon(ctaModel, true, "Quantum Level");
  });
}

function pauseVoice() {
  voiceover.pause();
  updateCTAIcon(ctaModel, false, "Quantum Level");
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  const hits = intersectAt(e, [ctaVideo, ctaModel, mainScreen]);
  if (!hits.length) return;

  const obj = hits[0].object;

  if (obj === ctaVideo || obj === mainScreen) {
    video.paused ? playVideo() : pauseVideo();
    return;
  }

  if (obj === ctaModel) {
    voiceover.paused ? playVoice() : pauseVoice();
  }
});

// Restart Button Logic
restartVideoBtn.addEventListener("click", () => {
  video.currentTime = 0;
  playVideo();
});

restartAudioBtn.addEventListener("click", () => {
  voiceover.currentTime = 0;
  playVoice();
});

// Show restart button only on play
video.addEventListener("play", () => {
  restartAudioBtn.style.display = "none";
  restartVideoBtn.style.display = "block";
});

voiceover.addEventListener("play", () => {
  restartVideoBtn.style.display = "none";
  restartAudioBtn.style.display = "block";
});

// ================= ANIMATION LOOP =================
function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  ring.rotation.z = t * 0.4;
  attendees.forEach((a, i) => {
    a.position.y = Math.sin(t * 1.2 + i) * 0.05;
  });

  if (modelRoot) modelRoot.rotation.y += 0.002;

  ctaVideo.rotation.set(0, 0, 0);
  const v = new THREE.Vector3();
  camera.getWorldPosition(v);
  ctaModel.lookAt(v.x, ctaModel.position.y, v.z);

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
