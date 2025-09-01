// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5TtQYbKXDfQNXFJdbKvZ7sec12RKKTpE",
  authDomain: "nnk-share-script.firebaseapp.com",
  projectId: "nnk-share-script",
  storageBucket: "nnk-share-script.appspot.com",
  messagingSenderId: "475699956536",
  appId: "1:475699956536:web:d4a85dcc451e81785bcfcd"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Lấy scriptId từ URL
const params = new URLSearchParams(window.location.search);
const scriptId = params.get("id");

// Hiển thị chi tiết script
const scriptTitle = document.getElementById("script-title");
const scriptDesc = document.getElementById("script-description");
const scriptCode = document.getElementById("script-code");

if (scriptId) {
  db.collection("scripts").doc(scriptId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      scriptTitle.textContent = data.title;
      scriptDesc.textContent = data.description;
      scriptCode.textContent = data.code;
    }
  });
}

// Copy code
const copyBtn = document.getElementById("copyBtn");
if (copyBtn) copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(scriptCode.textContent).then(() => {
    alert("Đã copy code!");
  });
});

// ===== Bình luận =====
const commentsList = document.getElementById("comments-list");
const commentInput = document.getElementById("comment-input");
const commentBtn = document.getElementById("comment-btn");
const commentFormContainer = document.getElementById("comment-form-container");
const loginPrompt = document.getElementById("login-prompt");

auth.onAuthStateChanged(user => {
  if (user) {
    // Hiện form bình luận
    if(commentFormContainer) commentFormContainer.style.display = "block";
    if(loginPrompt) loginPrompt.style.display = "none";
  } else {
    // Ẩn form, hiện thông báo đăng nhập
    if(commentFormContainer) commentFormContainer.style.display = "none";
    if(loginPrompt) loginPrompt.style.display = "block";
  }
});

if (scriptId && commentsList) {
  const commentsRef = db.collection("scripts").doc(scriptId).collection("comments").orderBy("createdAt", "asc");

  // Hiển thị comment real-time
  commentsRef.onSnapshot(snapshot => {
    commentsList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${data.user}</strong>: ${data.text}`;
      commentsList.appendChild(div);
    });
  });

  // Gửi comment
  if (commentBtn) commentBtn.addEventListener("click", async () => {
    if (!auth.currentUser) return alert("Bạn cần đăng nhập để bình luận!");
    const text = commentInput.value.trim();
    if (!text) return alert("Nhập bình luận!");
    
    await db.collection("scripts").doc(scriptId).collection("comments").add({
      text,
      user: auth.currentUser.displayName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    commentInput.value = "";
  });
}
