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

// Firestore & Auth
const db = firebase.firestore();
const auth = firebase.auth();

// ------------------- DOM Elements -------------------
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const uploadBtn = document.getElementById('uploadBtn');
const scriptList = document.getElementById('script-list');
const searchInput = document.getElementById('searchInput');

// ------------------- Auth -------------------
const provider = new firebase.auth.GoogleAuthProvider();

loginBtn.onclick = () => {
  loginBtn.disabled = true;
  loginBtn.innerText = 'Đang đăng nhập...';
  auth.signInWithPopup(provider)
    .then(() => {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      uploadBtn.style.display = 'inline-block';
    })
    .catch(err => {
      alert('Error login: ' + err.message);
      loginBtn.disabled = false;
      loginBtn.innerText = 'Login Google';
    });
};

logoutBtn.onclick = () => {
  auth.signOut().then(() => {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    uploadBtn.style.display = 'none';
  });
};

auth.onAuthStateChanged(user => {
  if(user){
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    uploadBtn.style.display = 'inline-block';
  }else{
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    uploadBtn.style.display = 'none';
  }
});

// ------------------- Load Scripts -------------------
function loadScripts(filter=''){
  scriptList.innerHTML = 'Loading...';
  db.collection("scripts").orderBy("createdAt","desc").get()
    .then(snapshot=>{
      scriptList.innerHTML = '';
      snapshot.forEach(doc=>{
        const data = doc.data();
        if(data.name.toLowerCase().includes(filter.toLowerCase()) || data.description.toLowerCase().includes(filter.toLowerCase())){
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description.substring(0,100)}...</p>
            <button onclick="viewScript('${doc.id}')">Xem chi tiết</button>
          `;
          scriptList.appendChild(card);
        }
      });
      if(scriptList.innerHTML==='') scriptList.innerHTML='Không có script nào';
    })
    .catch(err=>console.log(err));
}

searchInput.addEventListener('input', e=>{
  loadScripts(e.target.value);
});

// ------------------- View Script Detail -------------------
function viewScript(id){
  localStorage.setItem('viewScriptId', id);
  location.href='script-detail.html';
}

// ------------------- Upload Script -------------------
function uploadScript(name, code, description){
  const user = auth.currentUser;
  if(!user){alert('Bạn phải login trước'); return;}
  db.collection('scripts').add({
    name,
    code,
    description,
    author: user.displayName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    alert('Upload thành công');
    location.href='index.html';
  }).catch(err=>alert('Error: '+err.message));
}
