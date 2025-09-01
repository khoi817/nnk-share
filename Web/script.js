// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5TtQYbKXDfQNXFJdbKvZ7sec12RKKTpE",
  authDomain: "nnk-share-script.firebaseapp.com",
  projectId: "nnk-share-script",
  storageBucket: "nnk-share-script.firebasestorage.app",
  messagingSenderId: "475699956536",
  appId: "1:475699956536:web:d4a85dcc451e81785bcfcd",
  measurementId: "G-0VZSK2HCGM"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- COMMON DOM ---
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");

// --- AUTH ---
if(loginBtn) loginBtn.onclick = ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(console.error);
};
if(logoutBtn) logoutBtn.onclick = ()=>auth.signOut();
auth.onAuthStateChanged(user=>{
  if(user){
    if(loginBtn) loginBtn.style.display="none";
    if(logoutBtn) logoutBtn.style.display="inline-block";
    if(uploadBtn) uploadBtn.style.display="inline-block";
  }else{
    if(loginBtn) loginBtn.style.display="inline-block";
    if(logoutBtn) logoutBtn.style.display="none";
    if(uploadBtn) uploadBtn.style.display="none";
  }
});

// --- INDEX ---
const scriptList = document.getElementById("script-list");
const searchInput = document.getElementById("searchInput");
if(scriptList){
  function renderScripts(scripts){
    scriptList.innerHTML="";
    scripts.forEach(s=>{
      const div = document.createElement("div");
      div.className="card";
      div.innerHTML=`<h2>${s.title}</h2><p>${s.desc}</p>`;
      div.onclick=()=>{window.location="script-detail.html?id="+s.id;}
      scriptList.appendChild(div);
    });
  }

  db.collection("scripts").orderBy("createdAt","desc").onSnapshot(snap=>{
    let scripts = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    renderScripts(scripts);
  });

  if(searchInput){
    searchInput.oninput = ()=> {
      db.collection("scripts").get().then(snap=>{
        let scripts = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
        const filtered = scripts.filter(s=>s.title.toLowerCase().includes(searchInput.value.toLowerCase()));
        renderScripts(filtered);
      });
    };
  }
}

// --- UPLOAD ---
const uploadForm = document.getElementById("uploadForm");
const statusMsg = document.getElementById("statusMsg");
if(uploadForm){
  uploadForm.onsubmit = e=>{
    e.preventDefault();
    const title = document.getElementById("scriptTitle").value.trim();
    const content = document.getElementById("scriptContent").value.trim();
    const desc = document.getElementById("scriptDesc").value.trim();
    if(!auth.currentUser){
      statusMsg.innerText="Bạn cần đăng nhập để upload.";
      return;
    }
    db.collection("scripts").add({
      title, content, desc,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      author: auth.currentUser.displayName
    }).then(()=>{
      statusMsg.innerText="Upload thành công!";
      uploadForm.reset();
    }).catch(err=>statusMsg.innerText="Upload lỗi: "+err.message);
  };
}

// --- SCRIPT DETAIL ---
const detailTitle = document.getElementById("detailTitle");
const detailScript = document.getElementById("detailScript");
const detailDesc = document.getElementById("detailDesc");
const commentInput = document.getElementById("commentInput");
const submitComment = document.getElementById("submitComment");
const commentsList = document.getElementById("commentsList");

if(detailTitle && detailScript && detailDesc){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(id){
    const docRef = db.collection("scripts").doc(id);
    docRef.get().then(doc=>{
      if(doc.exists){
        const data = doc.data();
        detailTitle.innerText = data.title;
        detailScript.innerText = data.content;
        detailDesc.innerText = data.desc;
      }
    });

    // Bình luận
    submitComment.onclick = ()=>{
      if(!auth.currentUser){alert("Đăng nhập mới bình luận được!"); return;}
      const text = commentInput.value.trim();
      if(!text) return;
      docRef.collection("comments").add({
        text,
        author: auth.currentUser.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(()=>commentInput.value="");
    };

    // Hiển thị bình luận
    docRef.collection("comments").orderBy("createdAt","asc").onSnapshot(snap=>{
      commentsList.innerHTML="";
      snap.docs.forEach(doc=>{
        const data = doc.data();
        const div = document.createElement("div");
        div.innerText = data.author+": "+data.text;
        div.style.borderBottom="1px solid #444"; div.style.padding="5px 0";
        commentsList.appendChild(div);
      });
    });
  }
}
