// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== DOM Elements =====
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");
const scriptList = document.getElementById("script-list");
const searchInput = document.getElementById("searchInput");
const uploadForm = document.getElementById("uploadForm");
const titleEl = document.getElementById("script-title");
const descEl = document.getElementById("script-description");
const codeEl = document.getElementById("script-code");
const copyBtn = document.getElementById("copyBtn");
const ratingEl = document.getElementById("rating");
const rateBtn = document.getElementById("rateBtn");

// ===== Auth =====
if (loginBtn) loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

if (logoutBtn) logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (uploadBtn) uploadBtn.style.display = "inline-block";
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (uploadBtn) uploadBtn.style.display = "none";
  }
});

// ===== Upload Script =====
if (uploadForm) {
  uploadForm.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const code = document.getElementById("code").value;

    await db.collection("scripts").add({
      title,
      description,
      code,
      rating: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Upload thành công!");
    uploadForm.reset();
  });
}

// ===== Load Scripts (Index) =====
if (scriptList) {
  db.collection("scripts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    scriptList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p>`;
      card.addEventListener("click", () => {
        window.location.href = `script-detail.html?id=${doc.id}`;
      });
      scriptList.appendChild(card);
    });
  });
}

// ===== Search =====
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const filter = e.target.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(filter) ? "block" : "none";
    });
  });
}

// ===== Script Detail Page =====
const urlParams = new URLSearchParams(window.location.search);
const scriptId = urlParams.get("id");

if (scriptId && titleEl && descEl && codeEl) {
  db.collection("scripts").doc(scriptId).get().then(doc => {
    if (!doc.exists) { alert("Script không tồn tại!"); return; }
    const data = doc.data();
    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    codeEl.textContent = data.code;
    if (ratingEl) ratingEl.textContent = data.rating || 0;
  });

  if (copyBtn) copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeEl.textContent);
    alert("Đã copy script!");
  });

  if (rateBtn) rateBtn.addEventListener("click", async () => {
    const docRef = db.collection("scripts").doc(scriptId);
    await db.runTransaction(async t => {
      const docSnap = await t.get(docRef);
      const currentRating = docSnap.data().rating || 0;
      t.update(docRef, { rating: currentRating + 1 });
    });
    const newRating = parseInt(ratingEl.textContent || "0") + 1;
    ratingEl.textContent = newRating;
    alert("Đã đánh giá!");
  });
}
