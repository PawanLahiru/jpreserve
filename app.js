// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";

// ====== Firebase Config ======
const firebaseConfig = {
  apiKey: "AIzaSyCfbOyIH09CeMxRF68St9IUKizd7rKBEqg",
  authDomain: "jpreserve-91f24.firebaseapp.com",
  projectId: "jpreserve-91f24",
  storageBucket: "jpreserve-91f24.firebasestorage.app",
  messagingSenderId: "1099334593386",
  appId: "1:1099334593386:web:f45bbed89bf22f6ba59313",
  measurementId: "G-KK0G7VN4NR"
};

// ====== Initialize Firebase ======
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ====== UI Elements ======
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const formTitle = document.getElementById('formTitle');

const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');

const authCard = document.getElementById('authCard');
const dashboard = document.getElementById('dashboard');
const displayName = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');
const displayRole = document.getElementById('displayRole');

// ====== Functions ======
function switchToRegister() {
  loginForm.classList.remove('active');
  registerForm.classList.add('active');
  formTitle.innerText = 'Register';
}

function switchToLogin() {
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
  formTitle.innerText = 'Login';
}

async function registerUser() {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const pw = regPassword.value;
  if (!name || !email || pw.length < 6) {
    alert('Enter name, email, password (min 6 chars)');
    return;
  }
  registerBtn.disabled = true;
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pw);
    const uid = userCred.user.uid;
    // Save user to Firestore
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role: 'staff', // default role
      assignedHotels: [],
      createdAt: serverTimestamp()
    });
    alert('Account created successfully!');
  } catch (e) {
    console.error(e);
    alert('Register error: ' + e.message);
  } finally {
    registerBtn.disabled = false;
  }
}

async function loginUser() {
    const email = loginEmail.value.trim();
    const pw = loginPassword.value;
    if (!email || !pw) {
      alert('Enter email/password');
      return;
    }
    loginBtn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      // Redirect to dashboard page
      window.location.href = "dashboard.html";
    } catch (e) {
      console.error(e);
      alert('Login failed: ' + e.message);
    } finally {
      loginBtn.disabled = false;
    }
  }

async function logoutUser() {
  await signOut(auth);
}

// Update dashboard info
async function updateDashboard(user) {
  try {
    const udoc = await getDoc(doc(db, 'users', user.uid));
    const data = udoc.exists() ? udoc.data() : null;
    displayName.innerText = data?.name || 'Unknown';
    displayEmail.innerText = data?.email || '';
    displayRole.innerText = data?.role || 'staff';
  } catch (e) {
    console.error(e);
    displayName.innerText = user.email || 'User';
    displayEmail.innerText = user.email || '';
    displayRole.innerText = 'staff';
  }
}

// ====== Event Listeners ======
showRegister.addEventListener('click', switchToRegister);
showLogin.addEventListener('click', switchToLogin);
registerBtn.addEventListener('click', registerUser);
loginBtn.addEventListener('click', loginUser);
logoutBtn.addEventListener('click', logoutUser);

// ====== Auth State Listener ======
onAuthStateChanged(auth, (user) => {
  if (user) {
    authCard.style.display = 'none';
    dashboard.style.display = 'block';
    updateDashboard(user);
  } else {
    authCard.style.display = 'block';
    dashboard.style.display = 'none';
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    formTitle.innerText = 'Login';
  }
});