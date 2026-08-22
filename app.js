import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/controls/OrbitControls.js";

/*
  عناصر الواجهة
*/
const sceneContainer = document.getElementById("sceneContainer");
const locationText = document.getElementById("locationText");
const prayerList = document.getElementById("prayerList");

const nextPrayerName = document.getElementById("nextPrayerName");
const nextPrayerTime = document.getElementById("nextPrayerTime");
const countdown = document.getElementById("countdown");

const locationButton = document.getElementById("locationButton");
const manualLocationButton = document.getElementById("manualLocationButton");

const latitudeInput = document.getElementById("latitudeInput");
const longitudeInput = document.getElementById("longitudeInput");

const methodSelect = document.getElementById("methodSelect");

const adhanFileInput = document.getElementById("adhanFileInput");
const adhanAudio = document.getElementById("adhanAudio");
const audioStatus = document.getElementById("audioStatus");

const enableAdhanButton = document.getElementById("enableAdhanButton");
const testAdhanButton = document.getElementById("testAdhanButton");

/*
  إعدادات وأسماء الصلوات
*/
const prayers = [
  { key: "Fajr", label: "الفجر" },
  { key: "Dhuhr", label: "الظهر" },
  { key: "Asr", label: "العصر" },
  { key: "Maghrib", label: "المغرب" },
  { key: "Isha", label: "العشاء" }
];

let prayerTimes = {};
let currentLatitude = null;
let currentLongitude = null;
let adhanEnabled = false;
let customAudioUrl = null;
let lastPrayerKey = "";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/*
  المشهد ثلاثي الأبعاد
*/
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x06233c, 20, 58);

const camera = new THREE.PerspectiveCamera(
  45,
  sceneContainer.clientWidth / sceneContainer.clientHeight,
  0.1,
  100
);

camera.position.set(10, 6, 14);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

sceneContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI / 2.05;
controls.target.set(0, 0.5, 0);

/*
  الإضاءة
*/
const ambientLight = new THREE.HemisphereLight(
  0x9edcff,
  0x06223d,
  2.1
);

scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xb9e6ff, 2.7);
moonLight.position.set(-8, 12, 8);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);

scene.add(moonLight);

const lanternLight = new THREE.PointLight(0xffb84d, 24, 14);
lanternLight.position.set(0, 3.5, 1);

scene.add(lanternLight);

/*
  القمر
*/
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1.15, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffd978,
    emissiveIntensity: 0.35,
    roughness: 0.8
  })
);

moon.position.set(-8, 8, -12);
scene.add(moon);

const moonGlow = new THREE.PointLight(0x93dfff, 12, 24);
moonGlow.position.copy(moon.position);
scene.add(moonGlow);

/*
  نجوم
*/
const starsGeometry = new THREE.BufferGeometry();
const starPositions = [];

for (let index = 0; index < 800; index += 1) {
  starPositions.push(
    THREE.MathUtils.randFloatSpread(60),
    THREE.MathUtils.randFloat(2, 30),
    THREE.MathUtils.randFloatSpread(60)
  );
}

starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({
    color: 0xdaf3ff,
    size: 0.06,
    transparent: true,
    opacity: 0.85
  })
);

scene.add(stars);

/*
  البحر
*/
const oceanGeometry = new THREE.PlaneGeometry(80, 80, 90, 90);
oceanGeometry.rotateX(-Math.PI / 2);

const oceanMaterial = new THREE.MeshStandardMaterial({
  color: 0x075985,
  roughness: 0.25,
  metalness: 0.25,
  transparent: true,
  opacity: 0.92
});

const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.receiveShadow = true;

scene.add(ocean);

const oceanBasePositions = oceanGeometry.attributes.position.array.slice();

/*
  السفينة
*/
const ship = new THREE.Group();
ship.position.set(0, 0.5, 0);
scene.add(ship);

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x5c2c11,
  roughness: 0.62,
  metalness: 0.05
});

const goldMaterial = new THREE.MeshStandardMaterial({
  color: 0xeab75f,
  roughness: 0.34,
  metalness: 0.62
});

const sailMaterial = new THREE.MeshStandardMaterial({
  color: 0xf7e2b5,
  roughness: 0.8,
  side: THREE.DoubleSide
});

const darkWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b1208,
  roughness: 0.7
});

/* بدن السفينة */
const hull = new THREE.Mesh(
  new THREE.BoxGeometry(5.8, 1.2, 2.35),
  woodMaterial
);

hull.scale.set(1, 1, 0.85);
hull.position.y = 0.25;
hull.castShadow = true;
hull.receiveShadow = true;

ship.add(hull);

/* الجزء السفلي */
const hullBottom = new THREE.Mesh(
  new THREE.ConeGeometry(2.6, 1.4, 4),
  darkWoodMaterial
);

hullBottom.rotation.z = Math.PI / 4;
hullBottom.rotation.x = Math.PI / 2;
hullBottom.scale.set(1.1, 1, 1.2);
hullBottom.position.y = -0.42;
hullBottom.castShadow = true;

ship.add(hullBottom);

/* سطح السفينة */
const deck = new THREE.Mesh(
  new THREE.BoxGeometry(5.3, 0.18, 2.05),
  goldMaterial
);

deck.position.y = 0.92;
deck.castShadow = true;

ship.add(deck);

/* غرفة القبطان */
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.82, 1.55),
  woodMaterial
);

cabin.position.set(-1.4, 1.4, 0);
cabin.castShadow = true;

ship.add(cabin);

/* مئذنة صغيرة رمزية فوق السفينة */
const minaretBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.29, 1.5, 16),
  goldMaterial
);

minaretBase.position.set(1.25, 1.82, 0);
minaretBase.castShadow = true;

ship.add(minaretBase);

const minaretTop = new THREE.Mesh(
  new THREE.ConeGeometry(0.38, 0.7, 16),
  goldMaterial
);

minaretTop.position.set(1.25, 2.9, 0);
minaretTop.castShadow = true;

ship.add(minaretTop);

/* الصاري */
const mast = new THREE.Mesh(
  new THREE.CylinderGeometry(0.09, 0.12, 5.7, 16),
  darkWoodMaterial
);

mast.position.set(0.35, 3.2, 0);
mast.castShadow = true;

ship.add(mast);

/* الشراع */
const sailShape = new THREE.Shape();
sailShape.moveTo(0, 0);
sailShape.lineTo(0, 3.8);
sailShape.lineTo(2.2, 0.65);
sailShape.lineTo(0, 0);

const sailGeometry = new THREE.ShapeGeometry(sailShape);

const sail = new THREE.Mesh(sailGeometry, sailMaterial);
sail.position.set(0.45, 1.8, 0.05);
sail.rotation.y = 0.08;
sail.castShadow = true;

ship.add(sail);

/* هلال أعلى الصاري */
const crescent = new THREE.Mesh(
  new THREE.TorusGeometry(0.34, 0.08, 12, 32, Math.PI * 1.5),
  goldMaterial
);

crescent.position.set(0.35, 6.1, 0);
crescent.rotation.z = 0.55;

ship.add(crescent);

/* فوانيس مضيئة */
function createLantern(x, z) {
  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffd66b,
      emissive: 0xff9a22,
      emissiveIntensity: 2
    })
  );

  lantern.position.set(x, 1.3, z);
  ship.add(lantern);

  const light = new THREE.PointLight(0xffa12e, 2.5, 4);
  light.position.copy(lantern.position);
  ship.add(light);
}

createLantern(-2.25, 0.95);
createLantern(2.25, 0.95);
createLantern(-2.25, -0.95);
createLantern(2.25, -0.95);

/*
  أدوات الوقت
*/
function getDateForApi() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}-${month}-${year}`;
}

function normalizeTime(value) {
  return value.replace(/\s*\(.+\)/, "").trim();
}

function parsePrayerTime(timeValue) {
  const [hours, minutes] = normalizeTime(timeValue)
    .split(":")
    .map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function formatArabicTime(timeValue) {
  const [hours, minutes] = normalizeTime(timeValue).split(":");

  return `${hours}:${minutes}`;
}

function formatRemaining(milliseconds) {
  if (milliseconds <= 0) {
    return "حان الآن";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `متبقي ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/*
  جلب مواقيت الصلاة
*/
async function loadPrayerTimes(latitude, longitude) {
  const date = getDateForApi();
  const method = methodSelect.value;

  locationText.textContent = "جارٍ تحميل مواقيت الصلاة...";

  const endpoint =
    `https://api.aladhan.com/v1/timings/${date}` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&method=${method}` +
    `&timezonestring=${encodeURIComponent(timezone)}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("تعذر الاتصال بخدمة المواقيت.");
    }

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error("لم يتم الحصول على مواقيت صحيحة.");
    }

    prayerTimes = result.data.timings;

    renderPrayerTimes();
    updateNextPrayerUI();

    const cityName = result.data.meta?.timezone || timezone;

    locationText.textContent = `تم تحديث المواقيت — ${cityName}`;

    localStorage.setItem(
      "adhanShipLocation",
      JSON.stringify({
        latitude,
        longitude
      })
    );
  } catch (error) {
    locationText.textContent = "تعذر تحميل المواقيت.";

    console.error(error);

    alert(
      "تعذر جلب مواقيت الصلاة. تحقق من اتصال الإنترنت والإحداثيات ثم حاول مجددًا."
    );
  }
}

/*
  عرض جدول الصلوات
*/
function renderPrayerTimes() {
  prayerList.innerHTML = prayers
    .map((prayer) => {
      const time = prayerTimes[prayer.key]
        ? formatArabicTime(prayerTimes[prayer.key])
        : "--:--";

      return `
        <div class="prayer-row" data-prayer="${prayer.key}">
          <span>${prayer.label}</span>
          <strong>${time}</strong>
        </div>
      `;
    })
    .join("");
}

/*
  تحديد الصلاة القادمة
*/
function getNextPrayer() {
  if (!prayerTimes.Fajr) {
    return null;
  }

  const now = new Date();

  for (const prayer of prayers) {
    const prayerDate = parsePrayerTime(prayerTimes[prayer.key]);

    if (prayerDate > now) {
      return {
        ...prayer,
        date: prayerDate,
        time: prayerTimes[prayer.key]
      };
    }
  }

  return {
    key: "Fajr",
    label: "الفجر",
    date: null,
    time: prayerTimes.Fajr,
    tomorrow: true
  };
}

function updateNextPrayerUI() {
  const nextPrayer = getNextPrayer();

  if (!nextPrayer) {
    return;
  }

  let targetDate = nextPrayer.date;

  if (nextPrayer.tomorrow) {
    targetDate = parsePrayerTime(nextPrayer.time);
    targetDate.setDate(targetDate.getDate() + 1);
  }

  nextPrayerName.textContent = nextPrayer.label;
  nextPrayerTime.textContent = formatArabicTime(nextPrayer.time);
  countdown.textContent = formatRemaining(targetDate - new Date());

  document.querySelectorAll(".prayer-row").forEach((row) => {
    row.classList.toggle(
      "active",
      row.dataset.prayer === nextPrayer.key
    );
  });
}

/*
  تشغيل الأذان
*/
async function playAdhan(prayerLabel) {
  if (!adhanEnabled) {
    return;
  }

  if (!adhanAudio.src) {
    audioStatus.textContent = "لا يوجد ملف أذان محمّل حاليًا.";
    return;
  }

  try {
    adhanAudio.currentTime = 0;
    await adhanAudio.play();

    audioStatus.textContent = `يتم الآن تشغيل أذان ${prayerLabel}.`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`حان وقت صلاة ${prayerLabel}`, {
        body: "سفينة الأذان تذكّرك بالصلاة."
      });
    }
  } catch (error) {
    console.error(error);

    audioStatus.textContent =
      "منع المتصفح تشغيل الصوت. اضغط زر تفعيل الأذان مرة أخرى.";
  }
}

/*
  التحقق من دخول وقت الصلاة
*/
function checkPrayerTime() {
  if (!prayerTimes.Fajr) {
    return;
  }

  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, "0");
  const currentMinute = String(now.getMinutes()).padStart(2, "0");

  for (const prayer of prayers) {
    const prayerTime = normalizeTime(prayerTimes[prayer.key]);

    if (`${currentHour}:${currentMinute}` === prayerTime) {
      const dayKey = `${getDateForApi()}-${prayer.key}`;

      if (lastPrayerKey !== dayKey) {
        lastPrayerKey = dayKey;

        localStorage.setItem("lastPrayerKey", dayKey);

        playAdhan(prayer.label);
      }
    }
  }
}

/*
  اختيار ملف أذان مخصص (يستبدل الملف الافتراضي المرفق)
*/
adhanFileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  if (customAudioUrl) {
    URL.revokeObjectURL(customAudioUrl);
  }

  customAudioUrl = URL.createObjectURL(file);
  adhanAudio.src = customAudioUrl;

  audioStatus.textContent = `تم استبدال الملف الافتراضي بـ: ${file.name}`;
});

enableAdhanButton.addEventListener("click", async () => {
  adhanEnabled = true;

  /*
    نحاول تهيئة عنصر الصوت بعد تفاعل المستخدم
    لتقليل احتمال أن يمنع المتصفح التشغيل لاحقًا.
  */
  try {
    if (adhanAudio.src) {
      adhanAudio.muted = true;
      await adhanAudio.play();
      adhanAudio.pause();
      adhanAudio.currentTime = 0;
      adhanAudio.muted = false;
    }

    if ("Notification" in window) {
      await Notification.requestPermission();
    }

    enableAdhanButton.textContent = "✓ الأذان مفعّل";
    audioStatus.textContent =
      "تم تفعيل الأذان. اترك التطبيق مفتوحًا للحصول على أفضل نتيجة.";
  } catch (error) {
    console.error(error);

    audioStatus.textContent =
      "تم التفعيل، لكن قد يطلب المتصفح السماح بالصوت عند وقت الأذان.";
  }
});

testAdhanButton.addEventListener("click", () => {
  playAdhan("اختبار");
});

/*
  الموقع الجغرافي
*/
function setLocation(latitude, longitude) {
  currentLatitude = Number(latitude);
  currentLongitude = Number(longitude);

  latitudeInput.value = currentLatitude.toFixed(4);
  longitudeInput.value = currentLongitude.toFixed(4);

  loadPrayerTimes(currentLatitude, currentLongitude);
}

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
    return;
  }

  locationText.textContent = "جارٍ طلب إذن الموقع...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      setLocation(latitude, longitude);
    },
    (error) => {
      console.error(error);

      locationText.textContent = "تعذر الوصول إلى الموقع.";

      alert(
        "تعذر تحديد الموقع. اسمح للموقع باستخدام GPS أو أدخل الإحداثيات يدويًا."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
});

manualLocationButton.addEventListener("click", () => {
  const latitude = Number(latitudeInput.value);
  const longitude = Number(longitudeInput.value);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    alert("أدخل إحداثيات صحيحة: خط العرض بين -90 و90، وخط الطول بين -180 و180.");
    return;
  }

  setLocation(latitude, longitude);
});

methodSelect.addEventListener("change", () => {
  if (currentLatitude !== null && currentLongitude !== null) {
    loadPrayerTimes(currentLatitude, currentLongitude);
  }
});

/*
  تحريك البحر والسفينة
*/
function animateOcean(time) {
  const positions = oceanGeometry.attributes.position.array;

  for (let index = 0; index < positions.length; index += 3) {
    const x = oceanBasePositions[index];
    const z = oceanBasePositions[index + 2];

    positions[index + 1] =
      Math.sin(x * 0.38 + time * 0.0014) * 0.22 +
      Math.cos(z * 0.28 + time * 0.001) * 0.16;
  }

  oceanGeometry.attributes.position.needsUpdate = true;
  oceanGeometry.computeVertexNormals();
}

function animate(time) {
  requestAnimationFrame(animate);

  animateOcean(time);

  ship.position.y = 0.55 + Math.sin(time * 0.0015) * 0.22;
  ship.rotation.z = Math.sin(time * 0.0012) * 0.055;
  ship.rotation.x = Math.cos(time * 0.001) * 0.035;

  ship.position.x = Math.sin(time * 0.00025) * 1.6;
  ship.position.z = Math.cos(time * 0.0002) * 0.7;

  sail.rotation.y = 0.08 + Math.sin(time * 0.0008) * 0.08;

  controls.update();
  renderer.render(scene, camera);
}

animate(0);

/*
  إعادة حجم المشهد
*/
window.addEventListener("resize", () => {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

/*
  تحديث الوقت والتحقق من الصلاة كل ثانية.
*/
setInterval(() => {
  updateNextPrayerUI();
  checkPrayerTime();

  /*
    عند بداية يوم جديد، نعيد تحميل مواقيت اليوم الجديد.
  */
  const now = new Date();

  if (
    now.getHours() === 0 &&
    now.getMinutes() === 1 &&
    now.getSeconds() === 0 &&
    currentLatitude !== null
  ) {
    loadPrayerTimes(currentLatitude, currentLongitude);
  }
}, 1000);

/*
  استعادة آخر موقع مستخدم.
*/
function restoreSavedLocation() {
  const savedLocation = localStorage.getItem("adhanShipLocation");
  const savedPrayerKey = localStorage.getItem("lastPrayerKey");

  if (savedPrayerKey) {
    lastPrayerKey = savedPrayerKey;
  }

  if (!savedLocation) {
    return;
  }

  try {
    const { latitude, longitude } = JSON.parse(savedLocation);

    setLocation(latitude, longitude);
  } catch {
    localStorage.removeItem("adhanShipLocation");
  }
}

restoreSavedLocation();
