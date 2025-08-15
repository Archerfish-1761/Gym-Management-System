// Firebase SDKs (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyDzEjLFebn6pLWTh2SOPOJHVuN7hpCLvDU",
  authDomain: "gym-management-system-5eb58.firebaseapp.com",
  projectId: "gym-management-system-5eb58",
  storageBucket: "gym-management-system-5eb58.firebasestorage.app",
  messagingSenderId: "125306927800",
  appId: "1:125306927800:web:dfd8d146e13bac4b70d24d",
  measurementId: "G-8YV0J7H5SZ"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // optional
const auth = getAuth(app);
const db   = getFirestore(app);

// ====== UI: Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') { e.preventDefault(); return; }
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ====== UI: Fade-in on scroll
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, observerOptions);
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ====== Contact form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(contactForm);
    const name = fd.get('name'); const email = fd.get('email'); const message = fd.get('message');
    if (!name || !email || !message) { alert('Please fill in all required fields.'); return; }
    alert(`Thank you ${name}! Your message has been sent. We'll get back to you at ${email} soon.`);
    contactForm.reset();
  });
}

// ====== Auth overlay view control
function setAuthView(view) {
  const login = document.getElementById('authLoginForm');
  const reg   = document.getElementById('authRegisterForm');
  if (!login || !reg) return;
  login.classList.add('hidden');
  reg.classList.add('hidden');
  (view === 'register' ? reg : login).classList.remove('hidden');
}

function showAuthSystem(mode = 'login') {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.remove('active');
  setAuthView(mode);
  setTimeout(() => {
    const firstInput = document.querySelector('.auth-form-container:not(.hidden) .auth-form-input');
    if (firstInput) firstInput.focus();
  }, 100);
}

function hideAuthSystem() {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  document.body.style.overflow = 'auto';
  const loginForm = document.getElementById('authLoginFormElement');
  const regForm   = document.getElementById('authRegisterFormElement');
  if (loginForm) loginForm.reset();
  if (regForm) regForm.reset();
}
function showAuthRegisterForm(){ setAuthView('register'); }
function showAuthLoginForm(){ setAuthView('login'); }

// expose for inline handlers
window.showAuthSystem = showAuthSystem;
window.hideAuthSystem = hideAuthSystem;
window.showAuthRegisterForm = showAuthRegisterForm;
window.showAuthLoginForm = showAuthLoginForm;

// ====== Auth form field validation hints
function validateAuthEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validateAuthPassword(pw){ return (pw || '').length >= 6; }

const loginEmailEl = document.getElementById('authLoginEmail');
if (loginEmailEl) loginEmailEl.addEventListener('blur', function(){
  this.style.borderColor = validateAuthEmail(this.value) ? '#27ae60' : '#e74c3c';
});
const regEmailEl = document.getElementById('authRegisterEmail');
if (regEmailEl) regEmailEl.addEventListener('blur', function(){
  this.style.borderColor = validateAuthEmail(this.value) ? '#27ae60' : '#e74c3c';
});
const regPwEl = document.getElementById('authRegisterPassword');
if (regPwEl) regPwEl.addEventListener('blur', function(){
  this.style.borderColor = validateAuthPassword(this.value) ? '#27ae60' : '#e74c3c';
});

// Close overlay on backdrop click
const authOverlay = document.getElementById('authOverlay');
if (authOverlay) {
  authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) hideAuthSystem(); });
}

// Sidebar demo clicks
document.querySelectorAll('.auth-nav-item').forEach(item=>{
  item.addEventListener('click', ()=> alert(`${item.textContent.trim()} feature would open here in the full application!`));
});

// ====== Navbar state
let currentUser = null;
function updateNavigation(user = null) {
  const loginBtn = document.getElementById('navAuthBtn');
  const userMenu = document.getElementById('navUserMenu');
  const userName = document.getElementById('navUserName');

  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = user.name || (user.email ? user.email.split('@')[0] : 'User');
    currentUser = user;
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    currentUser = null;
  }
}
window.showUserMenu = function(){
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
};
window.showDashboard = function(){
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.add('hidden');
  if (currentUser) showMemberDashboard(currentUser.email);
};

// Close user dropdown when clicking outside
document.addEventListener('click', function(e){
  const userMenu = document.getElementById('navUserMenu');
  const dropdown = document.getElementById('userDropdown');
  if (userMenu && dropdown && !userMenu.contains(e.target)) dropdown.classList.add('hidden');
});

// ====== Firebase Auth handlers
async function registerUser() {
  const fullName   = document.getElementById('authFullName').value;
  const email      = document.getElementById('authRegisterEmail').value;
  const password   = document.getElementById('authRegisterPassword').value;
  const phone      = document.getElementById('authPhoneNumber').value;
  const role       = document.getElementById('authUserRole').value;
  const membership = document.getElementById('authMembershipType').value;

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    fullName, email, phone, role, membership, createdAt: Date.now()
  });
  showAuthLoginForm();
  document.getElementById('authLoginEmail').value = email;
}

async function loginUser() {
  const email    = document.getElementById('authLoginEmail').value;
  const password = document.getElementById('authLoginPassword').value;
  await signInWithEmailAndPassword(auth, email, password);
}

async function logoutUser(){ await signOut(auth); }
window.logout = () => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.add('hidden');
  logoutUser().catch(err => alert(err.message));
};

// Auth state → navbar + overlay
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const profile = snap.exists() ? snap.data() : { email: user.email };
      updateNavigation({ name: profile.fullName, email: user.email });
      hideAuthSystem();
    } catch { updateNavigation({ email: user.email }); hideAuthSystem(); }
  } else {
    updateNavigation(null);
  }
});

// Wire forms
const regFormEl = document.getElementById('authRegisterFormElement');
if (regFormEl) regFormEl.addEventListener('submit', (e)=>{
  e.preventDefault();
  const submitBtn = regFormEl.querySelector('.auth-submit-btn');
  const original = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) { submitBtn.textContent = 'CREATING ACCOUNT...'; submitBtn.classList.add('auth-loading'); submitBtn.disabled = true; }
  registerUser().catch(err => alert(err.message)).finally(()=>{
    if (submitBtn) { submitBtn.textContent = original; submitBtn.classList.remove('auth-loading'); submitBtn.disabled = false; }
  });
});

const loginFormEl = document.getElementById('authLoginFormElement');
if (loginFormEl) loginFormEl.addEventListener('submit', (e)=>{
  e.preventDefault();
  const submitBtn = loginFormEl.querySelector('.auth-submit-btn');
  const original = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) { submitBtn.textContent = 'SIGNING IN...'; submitBtn.classList.add('auth-loading'); submitBtn.disabled = true; }
  loginUser().catch(err => alert(err.message)).finally(()=>{
    if (submitBtn) { submitBtn.textContent = original; submitBtn.classList.remove('auth-loading'); submitBtn.disabled = false; }
  });
});

// ====== Member dashboard simulation
function showMemberDashboard(email) {
  const dashboard = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 3000; color: white;
                padding: 2rem; overflow-y: auto;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: var(--primary-color); margin-bottom: 2rem;">Member Dashboard</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="background: var(--primary-color); padding: 1.5rem; border-radius: 10px;">
            <h3>Welcome Back!</h3>
            <p>Email: ${email || ''}</p>
            <p>Membership: Premium</p>
          </div>
          <div style="background: #333; padding: 1.5rem; border-radius: 10px;">
            <h3>This Month</h3>
            <p>Workouts: 12</p>
            <p>Classes: 8</p>
          </div>
          <div style="background: #333; padding: 1.5rem; border-radius: 10px;">
            <h3>Next Class</h3>
            <p>Morning Yoga</p>
            <p>Tomorrow 6:00 AM</p>
          </div>
        </div>
        <div style="background: #333; padding: 2rem; border-radius: 10px; margin-bottom: 1rem;">
          <h3>Quick Actions</h3>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
            <button class="btn btn-primary" onclick="alert('Booking system would open here!')">Book Class</button>
            <button class="btn btn-primary" onclick="alert('Training scheduler would open here!')">Schedule Training</button>
            <button class="btn btn-primary" onclick="alert('Progress tracker would open here!')">View Progress</button>
            <button class="btn btn-outline" onclick="hideMemberDashboard()">Logout</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', dashboard);
}
function hideMemberDashboard() {
  const dashboard = document.querySelector('[style*="z-index: 3000"]');
  if (dashboard) dashboard.remove();
}
window.hideMemberDashboard = hideMemberDashboard;

// ====== Mobile menu
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) mobileMenu.addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.classList.toggle('active');
  });
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.remove('active');
    });
  });
});

// ====== Header scroll effect
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (!header) return;
  header.style.background = window.scrollY > 100 ? 'rgba(26, 26, 26, 0.98)' : 'rgba(26, 26, 26, 0.95)';
});

    function initSlider(id, interval=7000){
  const el = document.getElementById(id);
  if(!el) return;
  const slides = [...el.querySelectorAll('.slide')];
  const dotsWrap = el.querySelector('.slider-dots');

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    if(i===0) b.classList.add('active');
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = [...dotsWrap.children];
  let idx = 0, timer;

  function setActive(i){
    slides[idx].classList.remove('active'); dots[idx].classList.remove('active');
    idx = (i + slides.length) % slides.length;
    slides[idx].classList.add('active'); dots[idx].classList.add('active');
  }
  const next = () => setActive(idx+1);
  const prev = () => setActive(idx-1);
  const go   = (i) => setActive(i);

  el.querySelector('.next').addEventListener('click', ()=>{ next(); restart(); });
  el.querySelector('.prev').addEventListener('click', ()=>{ prev(); restart(); });

  function start(){ timer = setInterval(next, interval); }
  function stop(){ clearInterval(timer); }
  function restart(){ stop(); start(); }

  el.addEventListener('mouseenter', stop);
  el.addEventListener('mouseleave', start);
  let sx=0;
  el.addEventListener('touchstart', e=> sx = e.touches[0].clientX, {passive:true});
  el.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX - sx;
    if(Math.abs(dx) > 40){ dx<0 ? next() : prev(); restart(); }
  }, {passive:true});

  start();
}

document.addEventListener('DOMContentLoaded', () => {
  initSlider('aboutSlider');
});


// ====== Stagger animations
window.addEventListener('load', function() {
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, i) => { card.style.animationDelay = `${i * 0.1}s`; });
  const trainerCards = document.querySelectorAll('.trainer-card');
  trainerCards.forEach((card, i) => { card.style.animationDelay = `${i * 0.1}s`; });
});
