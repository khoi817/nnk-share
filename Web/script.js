// Firebase config
const firebaseConfig = {
  apiKey: "API_KEY_CỦA_BẠN",
  authDomain: "nnk-share-script.firebaseapp.com",
  projectId: "nnk-share-script",
  storageBucket: "nnk-share-script.appspot.com",
  messagingSenderId: "475699956536",
  appId: "1:475699956536:web:d4a85dcc451e81785bcfcd"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Đăng nhập / Đăng xuất =====
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");

loginBtn?.addEventListener("click", async () => {
  const email = prompt("Nhập email:");
  const password = prompt("Nhập mật khẩu:");
  try { await auth.signInWithEmailAndPassword(email,password); }
  catch(err){ alert(err.message); }
});

logoutBtn?.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(async user => {
  if(user){
    loginBtn?.style.display="none";
    logoutBtn?.style.display="inline-block";
    uploadBtn?.style.display="inline-block";
    const doc = await db.collection("users").doc(user.uid).get();
    if(!doc.exists || !doc.data().displayName){
      document.getElementById("namePopup").style.display="flex";
    }
  } else {
    loginBtn?.style.display="inline-block";
    logoutBtn?.style.display="none";
    uploadBtn?.style.display="none";
  }
});

// ===== Popup nhập tên =====
document.getElementById("saveNameBtn")?.addEventListener("click", async()=>{
  const user = auth.currentUser;
  const name = document.getElementById("displayNameInput").value.trim();
  if(user && name){
    await db.collection("users").doc(user.uid).set({displayName: name, avatar:"https://i.postimg.cc/3x3QzSGq/m.png"}, {merge:true});
    document.getElementById("namePopup").style.display="none";
  }
});

// ===== Index: Hiển thị danh sách script =====
const scriptList = document.getElementById("script-list");
if(scriptList){
  db.collection("scripts").orderBy("createdAt","desc").onSnapshot(snapshot=>{
    scriptList.innerHTML="";
    snapshot.forEach(doc=>{
      const data = doc.data();
      const card = document.createElement("div");
      card.className="card";
      card.innerHTML=`<h3>${data.title}</h3><p>${data.description}</p>`;
      card.addEventListener("click", ()=>{ window.location.href=`script-detail.html?id=${doc.id}`; });
      scriptList.appendChild(card);
    });
  });
}

// ===== Script-detail: load chi tiết & bình luận =====
const scriptTitle = document.getElementById("scriptTitle");
const scriptContent = document.getElementById("scriptContent");
const commentsList = document.getElementById("commentsList");
const commentSection = document.getElementById("commentSection");

async function loadScriptDetail(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(!id) return;
  const doc = await db.collection("scripts").doc(id).get();
  if(!doc.exists) return;
  const data = doc.data();
  scriptTitle && (scriptTitle.textContent=data.title);
  scriptContent && (scriptContent.textContent=data.content);

  db.collection("scripts").doc(id).collection("comments").orderBy("createdAt","asc").onSnapshot(snapshot=>{
    commentsList.innerHTML="";
    snapshot.forEach(c=>{
      const cdata=c.data();
      const div=document.createElement("div");
      div.className="comment";
      div.innerHTML=`<img src="${cdata.avatar||'https://i.postimg.cc/3x3QzSGq/m.png'}">
                       <div class="content"><strong>${cdata.displayName||cdata.email}</strong><p>${cdata.comment}</p></div>`;
      commentsList.appendChild(div);
    });
  });
}

// Hiển thị ô bình luận nếu đăng nhập
auth.onAuthStateChanged(user=>{
  if(user && commentSection) commentSection.style.display="block";
});

// Gửi bình luận
document.getElementById("sendCommentBtn")?.addEventListener("click", async()=>{
  const user = auth.currentUser;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const comment = document.getElementById("commentInput").value.trim();
  if(!user || !comment || !id) return;

  const userDoc = await db.collection("users").doc(user.uid).get();
  const displayName = userDoc.data()?.displayName || user.email;
  const avatar = userDoc.data()?.avatar || "https://i.postimg.cc/3x3QzSGq/m.png";

  await db.collection("scripts").doc(id).collection("comments").add({
    displayName,
    avatar,
    comment,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("commentInput").value="";
});

// ===== Upload script =====
document.getElementById("uploadScriptBtn")?.addEventListener("click", async()=>{
  const user = auth.currentUser;
  if(!user) return alert("Cần đăng nhập!");
  const title = document.getElementById("scriptTitleInput").value.trim();
  const content = document.getElementById("scriptContentInput").value.trim();
  if(!title||!content) return alert("Nhập đầy đủ thông tin!");

  await db.collection("scripts").add({
    title,
    content,
    description: content.substring(0,100)+"...",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("scriptTitleInput").value="";
  document.getElementById("scriptContentInput").value="";
  alert("Upload thành công!");
});

// Load detail nếu ở trang detail
if(scriptTitle && scriptContent) loadScriptDetail();
