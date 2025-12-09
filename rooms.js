// Updated room structure: each hotel has room objects with type
const hotelRooms = {
    1: [
        { number: 1, type: "single" },
        { number: 2, type: "double" },
        { number: 3, type: "triple" },
        { number: 4, type: "double" },
        { number: 5, type: "single" },
        { number: 6, type: "double" },
        { number: 7, type: "single" },
        { number: 8, type: "double" },
        { number: 9, type: "single" },
        { number: 10, type: "double" },
        { number: 11, type: "deluxe" },
        { number: 12, type: "double" },
        { number: 13, type: "single" },
        { number: 14, type: "double" },
        { number: 15, type: "single" }
    ],
    2: [
        { number: 1, type: "double" },
        { number: 2, type: "double" },
        { number: 3, type: "single" },
        { number: 4, type: "single" },
        { number: 5, type: "double" },
        { number: 6, type: "single" },
        { number: 7, type: "double" }
    ],
    3: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        type: i % 2 === 0 ? "single" : "double"
    })),
    4: Array.from({ length: 20 }, (_, i) => ({
        number: i + 1,
        type: i % 3 === 0 ? "double" : "single"
    })),
    5: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        type: i % 2 === 0 ? "double" : "single"
    })),
    6: Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        type: i % 2 === 0 ? "single" : "double"
    })),
    7: Array.from({ length: 15 }, (_, i) => ({
        number: i + 1,
        type: i % 3 === 0 ? "double" : "single"
    }))
};

// Read hotel ID from URL
const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get("hotel");

// Set title
document.getElementById("hotelTitle").textContent = `JPreserve ${hotelId} — Rooms`;

const rooms = hotelRooms[hotelId] || [];
const roomsContainer = document.getElementById("roomsContainer");


// ------------------------------
// Generate Room Cards
// ------------------------------
rooms.forEach(room => {
    const roomKey = `${hotelId}_${room.number}`;

    // Determine icon
    let icon = "";
    if (room.type === "single") icon = "🛏️";
    else if (room.type === "double") icon = "🛏️ 🛏️";
    else if (room.type === "triple") icon = "🛏️ 🛏️ 🛏️";
    else if (room.type === "deluxe") icon = "🛏️ 🛏️ 🛏️ 🛏️";

    // Determine card class
    let cardClass = "";
    if (room.type === "single") cardClass = "room-single";
    else if (room.type === "double") cardClass = "room-double";
    else if (room.type === "triple") cardClass = "room-triple";
    else if (room.type === "deluxe") cardClass = "room-deluxe";

    const card = document.createElement("div");
    card.className = `room-card ${cardClass}`;

    // ROOM CARD HTML + progress circle markup
    card.innerHTML = `
        <div class="room-icon">${icon}</div>
        <h3>Room ${room.number}</h3>
        <p>${room.type.toUpperCase()}</p>

        <span class="room-status" id="status_${roomKey}">Checking...</span>

        <div class="progress-wrapper hidden" id="prog_${roomKey}">
            <svg class="progress-svg">
                <circle cx="30" cy="30" r="26" class="bg"></circle>
                <circle cx="30" cy="30" r="26" class="progress" id="circle_${roomKey}"></circle>
            </svg>
            <div class="progress-text" id="ptext_${roomKey}">00:00</div>
        </div>
    `;

    // Click card → room detail page
    card.addEventListener("click", () => {
        localStorage.setItem("selectedRoom", JSON.stringify(room));
        window.location.href =
            `room-details.html?hotel=${hotelId}&room=${room.number}&type=${room.type}`;
    });

    roomsContainer.appendChild(card);

    // Update card status on load
    updateRoomCard(roomKey);
});


// ------------------------------
// Update card status (badge + timer + circle)
// ------------------------------
function updateRoomCard(roomKey) {
    const statusEl = document.getElementById(`status_${roomKey}`);
    const progWrap = document.getElementById(`prog_${roomKey}`);
    const circle = document.getElementById(`circle_${roomKey}`);
    const timeText = document.getElementById(`ptext_${roomKey}`);

    const isCleaning = localStorage.getItem(`isCleaning_${roomKey}`) === "true";
    const isFinished = localStorage.getItem(`cleanFinished_${roomKey}`) === "true";
    const startTime = parseInt(localStorage.getItem(`cleanStartTime_${roomKey}`));

    if (isCleaning && startTime) {
        statusEl.textContent = "Cleaning…";
        statusEl.className = "room-status yellow-status";
        progWrap.classList.remove("hidden");

        setInterval(() => updateProgress(roomKey, startTime), 1000);
    }
    else if (isFinished) {
        statusEl.textContent = "Cleaned ✔";
        statusEl.className = "room-status green-status";
        progWrap.classList.add("hidden");
    }
    else {
        statusEl.textContent = "Available";
        statusEl.className = "room-status green-status";
        progWrap.classList.add("hidden");
    }
}


// ------------------------------
// Progress Circle + Timer Logic
// ------------------------------
function updateProgress(roomKey, startTime) {
    const now = Date.now();
    const diff = now - startTime;

    const max = 20 * 60 * 1000; // 20 minutes
    const percent = Math.min(diff / max, 1);
    const offset = 163 - (163 * percent);

    const circle = document.getElementById(`circle_${roomKey}`);
    const text = document.getElementById(`ptext_${roomKey}`);

    if (circle) circle.style.strokeDashoffset = offset;

    let min = Math.floor(diff / 60000);
    let sec = Math.floor((diff % 60000) / 1000);

    if (text) text.textContent = 
        `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// ------------------------------
// GLOBAL TIMER — Updates all rooms every 1 sec
// ------------------------------
setInterval(() => {
    rooms.forEach(room => {
        const roomKey = `${hotelId}_${room.number}`;
        const startTime = parseInt(localStorage.getItem(`cleanStartTime_${roomKey}`));
        const isCleaning = localStorage.getItem(`isCleaning_${roomKey}`) === "true";

        if (isCleaning && startTime) {
            updateProgress(roomKey, startTime);
        }
    });
}, 1000);