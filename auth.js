const USERS_KEY="findly_users_v1";
const SESSION_KEY="findly_session_v1";
const RESET_KEY="findly_reset_v1";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function getUsers(){
  const data=localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users){
  localStorage.setItem(USERS_KEY,JSON.stringify(users));
}

function showMessage(text,type="error"){
  const el=$("#authMessage");
  if(!el) return;
  el.textContent=text;
  el.className=`form-message ${type}`;
}

function validPassword(pw){
  let upper=false,lower=false,number=false;

  for(const ch of pw){
    if(ch>="A"&&ch<="Z") upper=true;
    if(ch>="a"&&ch<="z") lower=true;
    if(ch>="0"&&ch<="9") number=true;
  }

  return pw.length>=8&&upper&&lower&&number;
}

function onlyDigit(input){
  const ch=input.value;

  if(ch<"0"||ch>"9") input.value="";
}

function generateOtp(){
  return "123456";
}

function ensureDemoUser(){
  const users=getUsers();
  const demo=users.filter(u=>u.email==="demo@campus.edu");

  if(demo.length===0){
    users.push({
      id:"demo-user",
      name:"Demo Student",
      email:"demo@campus.edu",
      password:"Demo@123",
      verified:true
    });
    saveUsers(users);
  }
}

ensureDemoUser();

/* SHOW/HIDE PASSWORD */
$$("[data-toggle-password]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const input=document.getElementById(btn.dataset.togglePassword);

    if(input.type==="password") input.type="text";
    else input.type="password";
  });
});

/* LOGIN */
const loginForm=$("#loginForm");

if(loginForm){
  loginForm.addEventListener("submit",e=>{
    e.preventDefault();

    const email=$("#loginEmail").value.trim().toLowerCase();
    const password=$("#loginPassword").value;
    const users=getUsers().filter(u=>u.email===email);
    const user=users[0];

    if(!user) return showMessage("No account found with this email.");
    if(!user.verified) return showMessage("Please verify this email before signing in.");
    if(user.password!==password) return showMessage("Incorrect password. Please try again.");

    localStorage.setItem(SESSION_KEY,JSON.stringify({
      userId:user.id,
      email:user.email
    }));

    showMessage("Signed in successfully.","success");
    location.href="dashboard.html";
  });
}

/* SIGNUP */
const signupForm=$("#signupForm");
let pendingUser=null;
let signupOtp=null;

if(signupForm){
  signupForm.addEventListener("submit",e=>{
    e.preventDefault();

    const name=$("#signupName").value.trim();
    const email=$("#signupEmail").value.trim().toLowerCase();
    const password=$("#signupPassword").value;
    const confirm=$("#signupConfirm").value;

    if(name.length<2)
      return showMessage("Please enter your full name.");

    if(email.indexOf("@")<1||email.indexOf(".")<3)
      return showMessage("Enter a valid email address.");

    if(getUsers().filter(u=>u.email===email).length>0)
      return showMessage("An account already exists for this email.");

    if(!validPassword(password))
      return showMessage("Password must have 8+ characters, uppercase, lowercase and a number.");

    if(password!==confirm)
      return showMessage("Passwords do not match.");

    pendingUser={
      id:"u-"+(getUsers().length+1),
      name:name,
      email:email,
      password:password,
      verified:false
    };

    signupOtp=generateOtp();

    $("#verifyCopy").textContent=`We generated a verification code for ${email}.`;
    $("#otpHint").textContent=`Demo verification code: ${signupOtp}`;
    $("#verifyModal").classList.remove("hidden");

    if($$(".otp")[0]) $$(".otp")[0].focus();
  });

  $$(".otp").forEach((input,i,arr)=>{
    input.addEventListener("input",()=>{
      onlyDigit(input);
      if(input.value&&arr[i+1]) arr[i+1].focus();
    });

    input.addEventListener("keydown",e=>{
      if(e.key==="Backspace"&&!input.value&&arr[i-1])
        arr[i-1].focus();
    });
  });

  if($("#verifyOtpBtn")){
    $("#verifyOtpBtn").addEventListener("click",()=>{
      const entered=$$(".otp").map(x=>x.value).join("");

      if(entered!==signupOtp)
        return showMessage("Incorrect verification code.");

      const users=getUsers();
      pendingUser.verified=true;
      users.push(pendingUser);
      saveUsers(users);

      $("#verifyModal").classList.add("hidden");
      showMessage("Email verified! Your account is ready.","success");
      location.href="index.html";
    });
  }
}

/* PASSWORD RESET */
let resetEmail="";
let resetOtp="";

function setResetStep(n){
  [1,2,3].forEach(x=>{
    const step=$(`#resetStep${x}`);

    if(step){
      if(x===n) step.classList.remove("hidden");
      else step.classList.add("hidden");
    }

    const indicator=document.querySelector(`[data-step-indicator="${x}"]`);

    if(indicator){
      if(x<=n) indicator.classList.add("active");
      else indicator.classList.remove("active");
    }
  });
}

/* VERIFY EMAIL */
const resetForm=$("#verifyResetEmailForm");

if(resetForm){
  resetForm.addEventListener("submit",e=>{
    e.preventDefault();

    const email=$("#resetEmail").value.trim().toLowerCase();
    const users=getUsers().filter(u=>u.email===email);
    const user=users[0];

    if(!user)
      return showMessage("This email is not registered.");

    if(!user.verified)
      return showMessage("This account is not verified.");

    resetEmail=email;
    resetOtp=generateOtp();

    localStorage.setItem(RESET_KEY,JSON.stringify({
      email:email,
      otp:resetOtp
    }));

    $("#resetOtpHint").textContent=`Demo verification code: ${resetOtp}`;
    showMessage("Email verified. Verification code generated.","success");
    setResetStep(2);
  });
}

/* RESET OTP */
$$(".reset-otp").forEach((input,i,arr)=>{
  input.addEventListener("input",()=>{
    onlyDigit(input);

    if(input.value&&arr[i+1])
      arr[i+1].focus();
  });
});

/* VERIFY RESET OTP */
if($("#verifyResetOtpBtn")){
  $("#verifyResetOtpBtn").addEventListener("click",()=>{
    const saved=localStorage.getItem(RESET_KEY);

    if(!saved)
      return showMessage("Start the password reset again.");

    const data=JSON.parse(saved);
    const entered=$$(".reset-otp").map(x=>x.value).join("");

    if(entered!==data.otp)
      return showMessage("Incorrect verification code.");

    resetEmail=data.email;

    showMessage("Identity verified. You can now reset your password.","success");
    setResetStep(3);
  });
}

/* NEW PASSWORD */
if($("#newPasswordForm")){
  $("#newPasswordForm").addEventListener("submit",e=>{
    e.preventDefault();

    const password=$("#newPassword").value;
    const confirm=$("#confirmNewPassword").value;

    if(!validPassword(password))
      return showMessage("Use 8+ characters with uppercase, lowercase and a number.");

    if(password!==confirm)
      return showMessage("Passwords do not match.");

    const saved=localStorage.getItem(RESET_KEY);

    if(!saved)
      return showMessage("Reset session not found.");

    const data=JSON.parse(saved);
    const users=getUsers();
    const found=users.filter(u=>u.email===(resetEmail||data.email));
    const user=found[0];

    if(!user)
      return showMessage("Account not found.");

    user.password=password;
    saveUsers(users);

    localStorage.removeItem(RESET_KEY);

    showMessage("Password reset successfully.","success");
    location.href="index.html";
  });
}
