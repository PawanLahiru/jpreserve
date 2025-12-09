// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfbOyIH09CeMxRF68St9IUKizd7rKBEqg",
  authDomain: "jpreserve-91f24.firebaseapp.com",
  projectId: "jpreserve-91f24",
  storageBucket: "jpreserve-91f24.firebasestorage.app",
  messagingSenderId: "1099334593386",
  appId: "1:1099334593386:web:f45bbed89bf22f6ba59313",
  measurementId: "G-KK0G7VN4NR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI refs
const ddName = document.getElementById("ddName");
const ddEmail = document.getElementById("ddEmail");
const ddLogout = document.getElementById("ddLogout");
const profileIcon = document.getElementById("profileIcon");
const profileDropdown = document.getElementById("profileDropdown");
const cardsContainer = document.getElementById("cardsContainer");
const noHotelsTemplate = document.getElementById("no-hotels-template");

function showProfileDropdown(show) {
  profileDropdown.setAttribute("aria-hidden", (!show).toString());
}

// TOGGLE dropdown
profileIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = profileDropdown.getAttribute("aria-hidden") === "true";
  showProfileDropdown(isHidden);
});

// CLOSE dropdown when clicking outside
document.addEventListener("click", (e) => {
  const isOpen = profileDropdown.getAttribute("aria-hidden") === "false";

  if (
    isOpen &&
    !profileDropdown.contains(e.target) &&
    !profileIcon.contains(e.target)
  ) {
    showProfileDropdown(false);
  }
});

// Logout
ddLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// AUTH state → load hotels
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const udoc = await getDoc(doc(db, "users", user.uid));
    const userData = udoc.exists() ? udoc.data() : {};

    ddName.textContent = userData.name || user.displayName || "User";
    ddEmail.textContent = userData.email || user.email || "";

    await renderCardsForUser(userData);
  } catch (err) {
    console.error("Error loading user data", err);
  }
});

// LOAD guest house cards
async function renderCardsForUser(userData) {
  cardsContainer.innerHTML = "";

  let hotelIds = userData.assignedHotels || [];

  if (!hotelIds.length) {
    const allDocs = await getDocs(collection(db, "hotels"));
    allDocs.forEach((d) => hotelIds.push(d.id));
  }

  hotelIds = hotelIds.slice(0, 7);

  if (!hotelIds.length) {
    cardsContainer.appendChild(noHotelsTemplate.content.cloneNode(true));
    return;
  }

  const hotelDocs = await Promise.all(
    hotelIds.map((id) => getDoc(doc(db, "hotels", id)))
  );

  hotelDocs.forEach(async (snap, idx) => {
    if (!snap.exists()) return;

    const hotel = snap.data();
    const hotelId = snap.id;

    const card = document.createElement("div");
    card.className = "house-card";

    // COVER IMAGE
    let coverUrl = null;

    if (hotel.imageURL) coverUrl = hotel.imageURL;
    else if (hotel.imagePath) {
      try {
        coverUrl = await getDownloadURL(storageRef(storage, hotel.imagePath));
      } catch {}
    }

    if (coverUrl) {
      const cover = document.createElement("div");
      cover.className = "cover";
      cover.style.backgroundImage = `url('${coverUrl}')`;
      card.appendChild(cover);
    }

    // BADGE
    const badge = document.createElement("div");
    badge.className = "house-badge";
    badge.textContent = `Guest House ${idx + 1}`;
    card.appendChild(badge);

    // CARD INFO
    const info = document.createElement("div");
    info.className = "house-card-info";
    info.innerHTML = `
      <h3>${hotel.name || "Unnamed House"}</h3>
      <p>${hotel.address || ""}</p>
    `;
    card.appendChild(info);

    cardsContainer.appendChild(card);

    // TILT + GLOW
    attachTiltHandlers(card);

    // CLICK → Flash animation (later change to details page)
    card.addEventListener("click", () => {
      card.animate(
        [
          { transform: "scale(1.02)" },
          { transform: "scale(1)" }
        ],
        { duration: 200, easing: "ease-out" }
      );
    });
  });
}

function attachTiltHandlers(card) {
  const maxTilt = 14;

  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x - rect.width / 2) / (rect.width / 2);
    const py = (y - rect.height / 2) / (rect.height / 2);

    const rotateY = px * maxTilt;
    const rotateX = -py * maxTilt;

    card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    card.classList.add("tilt");
  }

  function onLeave() {
    card.style.transform = "none";
    card.classList.remove("tilt");
  }

  card.addEventListener("mousemove", onMove);
  card.addEventListener("mouseleave", onLeave);
  card.addEventListener("touchstart", () => card.classList.add("tilt"));
  card.addEventListener("touchend", () => card.classList.remove("tilt"));
}