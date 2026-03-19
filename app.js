// Data and persistence helpers
const STORAGE_KEYS = { users:'mwd_users', files:'mwd_files', activity:'mwd_activity', session:'mwd_session'};
const findByEmail = (email)=>getUsers().find(user=>user.email===email.toLowerCase());
const getUsers=()=>JSON.parse(localStorage.getItem(STORAGE_KEYS.users)||'[]');
const getFiles=()=>JSON.parse(localStorage.getItem(STORAGE_KEYS.files)||'[]');
const getActivity=()=>JSON.parse(localStorage.getItem(STORAGE_KEYS.activity)||'[]');
const setUsers=(list)=>localStorage.setItem(STORAGE_KEYS.users,JSON.stringify(list));
const setFiles=(list)=>localStorage.setItem(STORAGE_KEYS.files,JSON.stringify(list));
const setActivity=(list)=>localStorage.setItem(STORAGE_KEYS.activity,JSON.stringify(list));
const setSession=(u)=>localStorage.setItem(STORAGE_KEYS.session,JSON.stringify(u));
const getSession=()=>JSON.parse(localStorage.getItem(STORAGE_KEYS.session)||'null');
const clearSession=()=>localStorage.removeItem(STORAGE_KEYS.session);

const toast=document.getElementById('toast');
function showToast(msg,type='success'){toast.textContent=msg;toast.className=`toast ${type}`;setTimeout(()=>toast.classList.add('show'),10);setTimeout(()=>toast.classList.remove('show'),2400);setTimeout(()=>toast.classList.add('hidden'),2600);}

const appEl=document.getElementById('app');
const authScreen=document.getElementById('auth-screen');
const authTitle=document.getElementById('auth-title');
const authSubmit=document.getElementById('auth-submit');
const switchText=document.getElementById('switch-text');
const switchBtn=document.getElementById('switch-btn');
const authForm=document.getElementById('auth-form');
const pageTitle=document.getElementById('page-title');
const profileInfo=document.getElementById('profile-info');
const logoutBtn=document.getElementById('logout-btn');
const darkModeBtn=document.getElementById('dark-mode-toggle');
const navLinks=document.querySelectorAll('.nav-link');

const dashboardSection=document.getElementById('dashboard');
const fileSection=document.getElementById('filemgmt');
const reportsSection=document.getElementById('reports');
const adminSection=document.getElementById('admin');
const totalFilesEl=document.getElementById('total-files');
const totalUsersEl=document.getElementById('total-users');
const totalActivityEl=document.getElementById('total-activity');
const activityList=document.getElementById('activity-list');
const filesTable=document.getElementById('files-table');
const fileSearch=document.getElementById('file-search');
const newFileBtn=document.getElementById('new-file-btn');
const reportsFrom=document.getElementById('report-from');
const reportsTo=document.getElementById('report-to');
const reportGenerated=document.getElementById('report-generated');
const reportFiles=document.getElementById('report-files');
const reportsTable=document.getElementById('reports-table');
const usersTable=document.getElementById('users-table');

const fileModal=document.getElementById('file-modal');
const fileForm=document.getElementById('file-form');
const fileModalTitle=document.getElementById('file-modal-title');
const fileNameInput=document.getElementById('file-name');
const fileTypeInput=document.getElementById('file-type');
const fileCancelBtn=document.getElementById('file-cancel');

let authMode='login';
let editingFileId=null;

if(!getUsers().length){
  setUsers([{name:'Admin User',email:'admin@example.com',password:'admin123',role:'admin'}]);
}

function formatDate(ts){return new Date(ts).toLocaleDateString();}
function addActivity(text){const activity=getActivity();activity.unshift({id:Date.now(), text, date:new Date().toLocaleString(), user:getSession()?.email||'system'});setActivity(activity.slice(0,50));}

const showScreen=(screen)=>{
  [dashboardSection,fileSection,reportsSection,adminSection].forEach(sec=>sec.classList.add('hidden'));
  if(screen==='dashboard') dashboardSection.classList.remove('hidden');
  if(screen==='filemgmt') fileSection.classList.remove('hidden');
  if(screen==='reports') reportsSection.classList.remove('hidden');
  if(screen==='admin') adminSection.classList.remove('hidden');
  pageTitle.textContent=screen.charAt(0).toUpperCase()+screen.slice(1);
  navLinks.forEach(link=>link.classList.toggle('active',link.dataset.screen===screen));
}

function updateStats(){
  const files=getFiles();
  const users=getUsers();
  totalFilesEl.textContent=files.length;
  totalUsersEl.textContent=users.length;
  totalActivityEl.textContent=getActivity().length;
  activityList.innerHTML=getActivity().slice(0,5).map(it=>`<li>${it.date} – ${it.user}: ${it.text}</li>`).join('')||'<li>No activity yet.</li>';
  filesTable.innerHTML=files.map(file=>`<tr><td>${file.name}</td><td>${file.type}</td><td>${formatDate(file.created)}</td><td><button class='btn btn-secondary small' data-id='${file.id}' data-action='edit'>Edit</button><button class='btn btn-secondary small' data-id='${file.id}' data-action='delete'>Delete</button></td></tr>`).join('')||'<tr><td colspan="4">No files saved.</td></tr>';
  usersTable.innerHTML=users.map(user=>`<tr><td>${user.name || 'No name'}</td><td>${user.email}</td><td>${user.role}</td><td><button class='btn btn-secondary small' data-email='${user.email}' data-action='role'>Toggle Role</button><button class='btn btn-secondary small' data-email='${user.email}' data-action='delete'>Delete</button></td></tr>`).join('');
}

function routeFromHash(){const hash=location.hash.slice(1)||'dashboard'; if(authScreen.classList.contains('hidden')) showScreen(hash);}
window.addEventListener('hashchange',routeFromHash);

function makeModalOpen(edit=null){fileModal.classList.remove('hidden');fileModalTitle.textContent=edit?'Edit File':'Add File';if(edit){fileNameInput.value=edit.name;fileTypeInput.value=edit.type;editingFileId=edit.id;}else{fileNameInput.value='';fileTypeInput.value='';editingFileId=null;}}
function closeModal(){fileModal.classList.add('hidden');editingFileId=null;}

fileCancelBtn.addEventListener('click',closeModal);
fileModal.addEventListener('click',e=>{if(e.target===fileModal) closeModal();});

fileForm.addEventListener('submit',e=>{e.preventDefault(); const name=fileNameInput.value.trim();const type=fileTypeInput.value.trim();if(!name||!type){showToast('Name and type required','error');return;} let files=getFiles(); if(editingFileId){files=files.map(f=>f.id===editingFileId?{...f,name,type}:f);showToast('File updated');addActivity(`Updated file ${name}`);} else {files.unshift({id:Date.now(),name,type,created:Date.now()});showToast('File added');addActivity(`Added file ${name}`);} setFiles(files); updateStats(); closeModal();});

newFileBtn.addEventListener('click',()=>makeModalOpen());
filesTable.addEventListener('click',e=>{const btn=e.target.closest('button'); if(!btn) return; const id=Number(btn.dataset.id); if(btn.dataset.action==='edit'){const file=getFiles().find(f=>f.id===id); if(file) makeModalOpen(file);} if(btn.dataset.action==='delete'){if(confirm('Delete this file?')){let files=getFiles().filter(f=>f.id!==id);setFiles(files);showToast('File deleted');addActivity('Deleted file');updateStats();}}});

fileSearch.addEventListener('input',e=>{const q=e.target.value.toLowerCase();const files=getFiles().filter(f=>f.name.toLowerCase().includes(q)||f.type.toLowerCase().includes(q));filesTable.innerHTML=files.map(file=>`<tr><td>${file.name}</td><td>${file.type}</td><td>${formatDate(file.created)}</td><td><button class='btn btn-secondary small' data-id='${file.id}' data-action='edit'>Edit</button><button class='btn btn-secondary small' data-id='${file.id}' data-action='delete'>Delete</button></td></tr>`).join('')||'<tr><td colspan="4">No matching files.</td></tr>';});

reportGenerated.textContent='0';reportFiles.textContent='0';

document.getElementById('generate-report-btn').addEventListener('click',()=>{const from=reportsFrom.value?new Date(reportsFrom.value).getTime():0;const to=reportsTo.value?new Date(reportsTo.value).getTime():Date.now();const files=getFiles().filter(f=>f.created>=from&&f.created<=to);reportGenerated.textContent='1';reportFiles.textContent=files.length;reportsTable.innerHTML=files.map(f=>`<tr><td>${formatDate(f.created)}</td><td>File ${f.name}</td><td>${getSession()?.email||'unknown'}</td></tr>`).join('')||'<tr><td colspan="3">No rows</td></tr>';addActivity('Generated report');showToast('Report generated');});

usersTable.addEventListener('click',e=>{const btn=e.target.closest('button'); if(!btn) return; const email=btn.dataset.email; if(btn.dataset.action==='role'){let users=getUsers();users=users.map(u=>u.email===email?{...u,role:u.role==='admin'?'user':'admin'}:u);setUsers(users);showToast('Role toggled');addActivity(`Role toggled for ${email}`);updateStats();}
 if(btn.dataset.action==='delete'){if(confirm('Delete user?')){let users=getUsers().filter(u=>u.email!==email);setUsers(users);clearSession();showToast('User deleted');addActivity(`Deleted user ${email}`);reloadApp();}}});

function checkAuth(){const user=getSession();if(!user){authScreen.classList.remove('hidden');appEl.classList.add('hidden');} else {authScreen.classList.add('hidden');appEl.classList.remove('hidden');profileInfo.textContent=`${user.name || user.email}`;updateStats();routeFromHash();}}

logoutBtn.addEventListener('click',()=>{clearSession();showToast('Logged out');addActivity('User logged out');checkAuth();});

authForm.addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('email').value.trim().toLowerCase();const password=document.getElementById('password').value; if(!email||!password){showToast('Fill in fields','error');return;} if(authMode==='login'){const user=findByEmail(email);if(!user||user.password!==password){showToast('Invalid credentials','error');return;} setSession(user);showToast('Welcome back');addActivity(`User logged in: ${email}`);checkAuth();} else {if(findByEmail(email)){showToast('Email exists','error');return;} const users=getUsers();const newUser={name:email.split('@')[0],email,password,role:'user'};users.push(newUser);setUsers(users);setSession(newUser);showToast('Registration successful');addActivity(`Registered ${email}`);checkAuth();}});

switchBtn.addEventListener('click',()=>{authMode=authMode==='login'?'register':'login';authTitle.textContent=authMode==='login'?'Login':'Register';authSubmit.textContent=authMode==='login'?'Login':'Register';switchText.textContent=authMode==='login'?'Don’t have an account?':'Already have an account?';switchBtn.textContent=authMode==='login'?'Sign Up':'Login';});

let darkMode=false;
darkModeBtn.addEventListener('click',()=>{darkMode=!darkMode;document.body.className=darkMode?'theme-dark':'theme-light';darkModeBtn.textContent=darkMode?'☀️ Light Mode':'🌙 Dark Mode';});

function reloadApp(){location.hash='dashboard';checkAuth();}

checkAuth();
