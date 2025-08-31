// Firebase config (thay bằng của bạn)
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Login Google
document.getElementById("loginBtn")?.addEventListener("click",()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click",()=>auth.signOut());

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById("uploadBtn")?.style.display="inline-block";
    document.getElementById("logoutBtn")?.style.display="inline-block";
    document.getElementById("loginBtn")?.style.display="none";
    document.getElementById("copyBtn")?.style.display="inline-block";
    document.getElementById("likeBtn")?.style.display="inline-block";
    document.getElementById("starContainer")?.style.display="block";
  }else{
    document.getElementById("uploadBtn")?.style.display="none";
    document.getElementById("logoutBtn")?.style.display="none";
    document.getElementById("loginBtn")?.style.display="inline-block";
    document.getElementById("copyBtn")?.style.display="none";
    document.getElementById("likeBtn")?.style.display="none";
    document.getElementById("starContainer")?.style.display="none";
  }
});

// Upload script
const form = document.getElementById("uploadForm");
form?.addEventListener("submit", async e=>{
  e.preventDefault();
  const title = document.getElementById("title").value;
  const code = document.getElementById("code").value;
  const desc = document.getElementById("desc").value;
  const user = auth.currentUser;
  if(!user){alert("Bạn phải đăng nhập!"); return;}
  await db.collection("scripts").add({
    name:title,
    code:code,
    description:desc,
    author:user.uid,
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    likes:0,
    ratings:[]
  });
  alert("Upload thành công!");
  form.reset();
});

// Load danh sách script (index.html)
const listDiv = document.getElementById("script-list");
const searchInput = document.getElementById("searchInput");
async function loadScripts(){
  if(!listDiv) return;
  const snapshot = await db.collection("scripts").orderBy("createdAt","desc").get();
  listDiv.innerHTML="";
  snapshot.forEach(doc=>{
    const data = doc.data();
    const card = document.createElement("div");
    card.className="card";
    card.innerHTML = `<h3>${data.name}</h3><p>${data.description}</p>
      <button onclick="location.href='script-detail.html?id=${doc.id}'">Xem chi tiết</button>`;
    listDiv.appendChild(card);
  });
}
loadScripts();

// Search filter
searchInput?.addEventListener("input",()=>{
  const val = searchInput.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card=>{
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(val)?"block":"none";
  });
});

// Chi tiết script (script-detail.html)
const params = new URLSearchParams(location.search);
const scriptId = params.get("id");
if(scriptId){
  const docRef = db.collection("scripts").doc(scriptId);
  docRef.get().then(docSnap=>{
    if(docSnap.exists){
      const data = docSnap.data();
      document.getElementById("title").innerText = data.name;
      document.getElementById("desc").innerText = data.description;
      document.getElementById("code").innerText = data.code;
      document.getElementById("likeCount").innerText = data.likes || 0;
    }
  });

  // Copy script
  document.getElementById("copyBtn")?.addEventListener("click",()=>{
    navigator.clipboard.writeText(document.getElementById("code").innerText);
    alert("Đã copy script!");
  });

  // Like
  document.getElementById("likeBtn")?.addEventListener("click",()=>{
    const user = auth.currentUser;
    if(!user){alert("Bạn phải đăng nhập!"); return;}
    docRef.update({likes: firebase.firestore.FieldValue.increment(1)});
    const countEl = document.getElementById("likeCount");
    countEl.innerText = parseInt(countEl.innerText)+1;
  });

  // Đánh giá sao
  document.querySelectorAll(".star").forEach(star=>{
    star.addEventListener("click",()=>{
      const user = auth.currentUser;
      if(!user){alert("Bạn phải đăng nhập!"); return;}
      const rate = parseInt(star.dataset.rate);
      docRef.update({
        ratings: firebase.firestore.FieldValue.arrayUnion(rate)
      });
      alert("Cảm ơn đã đánh giá " + rate + " sao!");
    });
  });
}
