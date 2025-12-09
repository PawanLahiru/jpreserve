const params = new URLSearchParams(window.location.search);

const hotelId = params.get("hotel");
const roomId = params.get("room");
const roomType = params.get("type");

// UNIQUE KEY for this hotel + room
const roomKey = `${hotelId}_${roomId}`;

// Load saved staff for this room
const savedStaff = localStorage.getItem(`cleanStaff_${roomKey}`);
document.getElementById("staffName").innerText = savedStaff || "Unknown Staff";

// Display
document.getElementById("roomTitle").textContent = `Room ${roomId}`;
document.getElementById("roomType").textContent = `${roomType} Room`;

// Load selected room image
const room = JSON.parse(localStorage.getItem("selectedRoom")) || {};
if (room.image) {
    document.getElementById("roomImage").src = room.image;
}

// Load saved state
let cleaningStatus = localStorage.getItem(`cleanStatus_${roomKey}`) || "Not Started";
let cleaning = localStorage.getItem(`isCleaning_${roomKey}`) === "true";
let startTime = parseInt(localStorage.getItem(`cleanStartTime_${roomKey}`)) || null;

document.getElementById("cleanStatus").innerText = cleaningStatus;

// Load history
let history = JSON.parse(localStorage.getItem(`cleanHistory_${roomKey}`)) || [];

const circle = document.getElementById("progressCircle");
const timeText = document.getElementById("progressTime");

function updateProgressCircle() {
    const now = Date.now();
    const diff = now - startTime;

    // 20 minutes = full circle (you can change)
    const maxTime = 20 * 60 * 1000;

    const percent = Math.min(diff / maxTime, 1);
    const offset = 339 - (339 * percent);

    circle.style.strokeDashoffset = offset;

    // Update time in center
    let min = Math.floor(diff / 60000);
    let sec = Math.floor((diff % 60000) / 1000);
    timeText.textContent =
        `${min.toString().padStart(2, "0")}:
         ${sec.toString().padStart(2, "0")}`;
}

// Timer
let timerInterval;

function updateTimer() {
    updateProgressCircle();
    
    const now = Date.now();
    const diff = now - startTime;

    let hrs = Math.floor(diff / 3600000);
    let min = Math.floor((diff % 3600000) / 60000);
    let sec = Math.floor((diff % 60000) / 1000);

    document.getElementById("timer").innerText =
        `${hrs.toString().padStart(2, '0')}:
         ${min.toString().padStart(2, '0')}:
         ${sec.toString().padStart(2, '0')}`;
}

// Restore timer if cleaning was active
if (cleaning && startTime) {
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

// Buttons
const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");

function updateButtons() {
    startBtn.disabled = cleaning;
    finishBtn.disabled = !cleaning;

    startBtn.style.opacity = cleaning ? "0.4" : "1";
    finishBtn.style.opacity = cleaning ? "1" : "0.4";
}
updateButtons();

/* -----------------------------------
       START CLEANING
----------------------------------- */
startBtn.addEventListener("click", () => {
    if (cleaning) return;

    cleaning = true;
    startTime = Date.now();
    cleaningStatus = "Cleaning In Progress";

    // 🔥 SAVE STAFF
    const staff = localStorage.getItem("loggedStaff") || "Unknown Staff";
    localStorage.setItem(`cleanStaff_${roomKey}`, staff);

    // Update UI
    document.getElementById("staffName").innerText = staff;

    // Save cleaning state
    localStorage.setItem(`cleanStatus_${roomKey}`, cleaningStatus);
    localStorage.setItem(`isCleaning_${roomKey}`, true);
    localStorage.setItem(`cleanStartTime_${roomKey}`, startTime);

    document.getElementById("cleanStatus").innerText = cleaningStatus;

    timerInterval = setInterval(updateTimer, 1000);

    updateButtons();
});

/* -----------------------------------
       FINISH CLEANING
----------------------------------- */
finishBtn.addEventListener("click", () => {
    if (!cleaning) return;

    clearInterval(timerInterval);

    cleaning = false;
    const end = Date.now();
    const duration = end - startTime;

    // Get LATEST STAFF saved in start cleaning
    const staff = localStorage.getItem(`cleanStaff_${roomKey}`) || "Unknown Staff";

    const record = {
        hotelId,
        roomId,
        staff,
        start: new Date(startTime).toLocaleString(),
        end: new Date(end).toLocaleString(),
        durationMs: duration
    };

    history.push(record);
    localStorage.setItem(`cleanHistory_${roomKey}`, JSON.stringify(history));

    cleaningStatus = "Cleaning Finished ✔";
    localStorage.setItem(`cleanStatus_${roomKey}`, cleaningStatus);
    localStorage.setItem(`isCleaning_${roomKey}`, false);
    localStorage.removeItem(`cleanStartTime_${roomKey}`);

    document.getElementById("cleanStatus").innerText = cleaningStatus;

    updateButtons();
});

/* -----------------------------------
       VIEW HISTORY
----------------------------------- */
document.getElementById("viewHistory").addEventListener("click", () => {
    const box = document.getElementById("historyList");
    box.style.display = box.style.display === "block" ? "none" : "block";

    box.innerHTML = history.map(h => `
        <div class="history-item">
            <b>Staff:</b> ${h.staff}<br>
            <b>Start:</b> ${h.start}<br>
            <b>End:</b> ${h.end}<br>
            <b>Duration:</b> ${(h.durationMs / 60000).toFixed(1)} min
        </div>
    `).join("");
});