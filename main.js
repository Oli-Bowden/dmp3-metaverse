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
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Load restart buttons
const restartVideoBtn = document.getElementById("restartVideoBtn");
const restartAudioBtn = document.getElementById("restartAudioBtn");

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
video.muted = true;
video.playsInline = true;
video.load();

const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.sRGBColorSpace;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;
videoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const mainScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(12.8, 7.2),
  new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide })
);
mainScreen.position.set(0, 6.25, -13.7);
scene.add(mainScreen);

// ================= SIDE PANELS =================
function createPanel(w, h, emissive) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    })
  );
}

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
  const angle = (i / arr.length) * Math.PI * 2;
  const radius = 11 + (i % 2) * 1.5;
  avatar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  avatar.lookAt(0, 1.5, 0);
  scene.add(avatar);
  attendees.push(avatar);
});

// ================= CTA BUTTON CREATOR =================
function createCTATab(text, width = 7, height = 1.2) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = Math.round((height / width) * 2048);

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2b74ff");
  gradient.addColorStop(1, "#1e5df8");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(canvas.height * 0.30)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    metalness: 0.3,
    roughness: 0.6
  });

  const geo = new THREE.BoxGeometry(width, height, 0.12);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 999;

  return mesh;
}

// ================= CTA UNDER VIDEO =================
const ctaVideo = createCTATab("Find out more about Scientific Computing", 6, 1);
ctaVideo.position.set(0, 1.8, -13.6);
scene.add(ctaVideo);
ctaVideo.userData.type = "video";

// CTA icon updater
function updateCTAIcon(mesh, isPlaying, label) {
  const canvas = mesh.material.map.image;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e5df8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = `${Math.round(canvas.height * 0.5)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const icon = isPlaying ? "❚❚" : "►";
  ctx.fillText(`${icon}  ${label}`, canvas.width / 2, canvas.height / 2);

  mesh.material.map.needsUpdate = true;
}

// ================= LOAD MODEL =================
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

    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);

    const targetHeight = 6;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    modelRoot.scale.setScalar(scale);

    modelRoot.position.set(0, 2, 0);
    scene.add(modelRoot);

    const modelAmbient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(modelAmbient);
  },
  undefined,
  (err) => console.error("Failed to load model:", err)
);

// ================= CTA UNDER MODEL =================
const ctaModel = createCTATab("Find out more about the quantum level", 6, 1);
ctaModel.position.set(0, 9.25, 0);
scene.add(ctaModel);
ctaModel.userData.type = "voice";

// Billboard control
function faceCamera(mesh, allowYOnly = false) {
  const v = new THREE.Vector3();
  camera.getWorldPosition(v);

  if (allowYOnly) {
    mesh.lookAt(v.x, mesh.position.y, v.z);
  } else {
    mesh.rotation.set(0, 0, 0);
  }
}

// ================= VOICEOVER =================
const voiceover = new Audio("assets/quantum-voiceover.mp3");
voiceover.preload = "auto";
voiceover.loop = false;
voiceover.muted = true;

// ================= RAYCASTING =================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoverTarget = null;

function setCursor(ptr) {
  renderer.domElement.style.cursor = ptr ? "pointer" : "default";
}

function highlightButton(btn, active) {
  if (!btn || !btn.material) return;
  btn.material.color.set(active ? "#3a7bff" : "#1e5df8");
}

function intersectAt(event, objects) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, false);
}

window.addEventListener("mousemove", (e) => {
  const hits = intersectAt(e, [ctaVideo, ctaModel, mainScreen]);
  hoverTarget = hits.length > 0 ? hits[0].object : null;
  highlightButton(ctaVideo, hoverTarget === ctaVideo);
  highlightButton(ctaModel, hoverTarget === ctaModel);
  setCursor(!!hoverTarget);
});

// ================= STOP ALL MEDIA =================
function stopAllMedia(except = null) {
  if (except !== "video" && !video.paused) {
    video.pause();
    updateCTAIcon(ctaVideo, false, "Scientific Computing");
  }

  if (except !== "voice" && !voiceover.paused) {
    voiceover.pause();
    updateCTAIcon(ctaModel, false, "Quantum Level");
  }
}

// ================= SHOW RESTART BUTTONS ON PLAY =================
video.addEventListener("play", () => {
  restartAudioBtn.style.display = "none";
  restartVideoBtn.style.display = "block";
});

voiceover.addEventListener("play", () => {
  restartVideoBtn.style.display = "none";
  restartAudioBtn.style.display = "block";
});

// ================= INTERACTION (CLICK HANDLER) =================
window.addEventListener("click", (e) => {
  const hits = intersectAt(e, [ctaVideo, ctaModel, mainScreen]);
  if (hits.length === 0) return;

  const obj = hits[0].object;

  // VIDEO CLICK
  if (obj === ctaVideo || obj === mainScreen) {
    stopAllMedia("video");

    if (video.paused) {
      video.muted = false;
      video.volume = 1.0;
      video.play().then(() => {
        updateCTAIcon(ctaVideo, true, "Scientific Computing");
      });
    } else {
      video.pause();
      updateCTAIcon(ctaVideo, false, "Scientific Computing");
    }

    return;
  }

  // AUDIO CLICK
  if (obj === ctaModel) {
    stopAllMedia("voice");

    if (voiceover.paused) {
      voiceover.muted = false;
      voiceover.play().then(() => {
        updateCTAIcon(ctaModel, true, "Quantum Level");
      });
    } else {
      voiceover.pause();
      updateCTAIcon(ctaModel, false, "Quantum Level");
    }
  }
});

// ================= RESTART BUTTONS =================
restartVideoBtn.addEventListener("click", () => {
  stopAllMedia(null);
  video.currentTime = 0;
  video.muted = false;
  video.play();
  updateCTAIcon(ctaVideo, true, "Scientific Computing");
});

restartAudioBtn.addEventListener("click", () => {
  stopAllMedia(null);
  voiceover.currentTime = 0;
  voiceover.muted = false;
  voiceover.play();
  updateCTAIcon(ctaModel, true, "Quantum Level");
});

// ================= MODEL MANIPULATION =================
let manipulatingModel = false;
let lastMouseX = 0;
let lastMouseY = 0;

function enterModelMode() {
  manipulatingModel = true;
  controls.enabled = false;
}

function exitModelMode() {
  manipulatingModel = false;
  controls.enabled = true;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") exitModelMode();
});

window.addEventListener("mousedown", (e) => {
  if (!modelRoot) return;

  const hits = intersectAt(e, [modelRoot]);
  if (hits.length > 0) {
    enterModelMode();
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

window.addEventListener("mousemove", (e) => {
  if (!manipulatingModel || !modelRoot) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;

  modelRoot.rotation.y -= dx * 0.01;

  modelRoot.rotation.x = THREE.MathUtils.clamp(
    modelRoot.rotation.x - dy * 0.01,
    -Math.PI / 4,
    Math.PI / 4
  );

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// ================= ANIMATION LOOP =================
function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  ring.rotation.z = t * 0.4;
  attendees.forEach((a, i) => {
    a.position.y = Math.sin(t * 1.2 + i) * 0.05;
  });

  faceCamera(ctaVideo, false);
  faceCamera(ctaModel, true);

  if (modelRoot && !manipulatingModel) {
    modelRoot.rotation.y += 0.002;
  }

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
