const ITEMS_KEY="findly_items_v1";
const USERS_KEY="findly_users_v1";
const SESSION_KEY="findly_session_v1";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function addEvent(selector,event,handler){
  const el=$(selector);
  if(el) el.addEventListener(event,handler);
}

function inputValue(selector){
  const el=$(selector);
  return el ? el.value : "";
}

const ZONE_GROUPS=[
  ["Main Gate","Admin Block","Parking"],
  ["Academic Block","Library","Cafeteria"],
  ["Sports Complex","Hostel A","Hostel B"]
];

function getItems(){
  const data=localStorage.getItem(ITEMS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveItems(items){
  localStorage.setItem(ITEMS_KEY,JSON.stringify(items));
}

function getUsers(){
  const data=localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function getSession(){
  const data=localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

const session=getSession();
if(!session) location.href="index.html";

const currentUsers=getUsers().filter(user=>user.id===session.userId);
const currentUser=currentUsers[0]||{
  id:"unknown",
  name:"Student",
  email:session.email
};

if($("#userName")){
  $("#userName").textContent=currentUser.name;
  $("#userEmail").textContent=currentUser.email;
  $("#userAvatar").textContent=currentUser.name.charAt(0).toUpperCase();
}

function daysBetween(a,b){
  const first=a.split("-");
  const second=b.split("-");

  const n1=Number(first[0])*365+Number(first[1])*30+Number(first[2]);
  const n2=Number(second[0])*365+Number(second[1])*30+Number(second[2]);

  const diff=n1-n2;
  return diff<0 ? -diff : diff;
}

function zoneGroupLevel(start,end){
  if(start===end) return 0;

  for(const group of ZONE_GROUPS){
    let startFound=false;
    let endFound=false;

    for(const zone of group){
      if(zone===start) startFound=true;
      if(zone===end) endFound=true;
    }

    if(startFound&&endFound) return 1;
  }

  return 2;
}

function textSimilarity(a,b){
  const first=a.toLowerCase().split(" ");
  const second=b.toLowerCase().split(" ");
  let common=0;

  for(const word1 of first){
    if(word1.length>3){
      for(const word2 of second){
        if(word1===word2){
          common++;
          break;
        }
      }
    }
  }

  const largest=first.length>second.length ? first.length : second.length;
  return largest===0 ? 0 : common/largest;
}

function roundNumber(number){
  return parseInt(number+0.5);
}

function scorePair(a,b){
  if(a.type===b.type) return null;

  const category=a.category===b.category ? 1 : 0;

  let color=0;
  if(a.color===b.color) color=1;
  else if(a.color==="Multicolor"||b.color==="Multicolor") color=0.55;

  const zd=zoneGroupLevel(a.zone,b.zone);
  let zone=0;

  if(zd===0) zone=1;
  else if(zd===1) zone=0.75;
  else if(zd===2) zone=0.45;

  const dd=daysBetween(a.date,b.date);
  let date=0;

  if(dd<=1) date=1;
  else if(dd<=3) date=0.8;
  else if(dd<=7) date=0.5;
  else if(dd<=14) date=0.2;

  const description=textSimilarity(
    `${a.title} ${a.description}`,
    `${b.title} ${b.description}`
  );

  const raw=category*.30+color*.20+zone*.20+date*.15+description*.15;

  return{
    score:roundNumber(raw*100),
    signals:{
      category:roundNumber(category*100),
      color:roundNumber(color*100),
      zone:roundNumber(zone*100),
      date:roundNumber(date*100),
      description:roundNumber(description*100)
    },
    zoneLevel:zd,
    dayDifference:dd
  };
}

function getAllPairs(items=getItems()){
  const lost=items.filter(x=>x.type==="lost"&&x.status==="open");
  const found=items.filter(x=>x.type==="found"&&x.status==="open");
  const pairs=[];

  lost.forEach(l=>{
    found.forEach(f=>{
      const result=scorePair(l,f);
      pairs.push({lost:l,found:f,...result});
    });
  });

  return pairs.sort((a,b)=>b.score-a.score);
}

/* No Regular Expression */
function esc(text=""){
  let safe="";

  for(const ch of text){
    if(ch==="&") safe+="&amp;";
    else if(ch==="<") safe+="&lt;";
    else if(ch===">") safe+="&gt;";
    else if(ch==='"') safe+="&quot;";
    else if(ch==="'") safe+="&#039;";
    else safe+=ch;
  }

  return safe;
}

function formatDate(date){
  return date;
}

function relativeDate(date){
  return formatDate(date);
}

function itemIcon(category){
  const icons={
    "Electronics":"⌁",
    "Bag":"▣",
    "ID / Cards":"▤",
    "Keys":"⚿",
    "Books":"▥",
    "Clothing":"◇",
    "Accessories":"◈",
    "Bottle":"♙",
    "Other":"•"
  };

  return icons[category]||"•";
}

function confidenceLabel(score){
  if(score>=80) return "Excellent match";
  if(score>=70) return "Strong match";
  if(score>=55) return "Possible match";
  return "Weak match";
}

function toast(message){
  const el=$("#toast");
  if(!el) return;

  el.textContent=message;
  el.classList.add("show");
}

function seedData(){
  const existing=getItems();

  if(existing.length){
    const ok=confirm("Sample data will be added to your current reports. Continue?");
    if(!ok) return;
  }

  const samples=[
    {
      id:"s1",type:"lost",category:"Bag",color:"Black",
      zone:"Library",date:"2026-08-18",
      title:"Black HP laptop backpack",
      description:"Black laptop backpack with small HP logo blue bottle and coding club sticker",
      contact:"Contact through registered email",
      reportedBy:"demo-user",reporterName:"Demo Student",
      status:"open",createdAt:1
    },
    {
      id:"s2",type:"found",category:"Bag",color:"Black",
      zone:"Academic Block",date:"2026-08-19",
      title:"Black backpack found near Lab 2",
      description:"Black laptop backpack with HP logo blue bottle and coding club sticker",
      contact:"Meet at campus security desk",
      reportedBy:"sample-2",reporterName:"Riya",
      status:"open",createdAt:2
    },
    {
      id:"s3",type:"lost",category:"Electronics",color:"White",
      zone:"Cafeteria",date:"2026-08-17",
      title:"White wireless earbuds case",
      description:"White earbuds charging case with scratch near hinge",
      contact:"Contact through registered email",
      reportedBy:"sample-3",reporterName:"Kabir",
      status:"open",createdAt:3
    },
    {
      id:"s4",type:"found",category:"Electronics",color:"White",
      zone:"Library",date:"2026-08-18",
      title:"Wireless earbud charging case",
      description:"White earbuds charging case with scratch near hinge",
      contact:"Contact through registered email",
      reportedBy:"sample-4",reporterName:"Meera",
      status:"open",createdAt:4
    },
    {
      id:"s5",type:"found",category:"Keys",color:"Silver",
      zone:"Parking",date:"2026-08-20",
      title:"Bike keys with red keychain",
      description:"Two silver keys on red keychain",
      contact:"Meet at campus security desk",
      reportedBy:"sample-5",reporterName:"Arjun",
      status:"open",createdAt:5
    },
    {
      id:"s6",type:"lost",category:"ID / Cards",color:"Blue",
      zone:"Main Gate",date:"2026-08-15",
      title:"Blue college ID card holder",
      description:"Blue card holder with student ID and metro card",
      contact:"Contact through registered email",
      reportedBy:"sample-6",reporterName:"Naina",
      status:"open",createdAt:6
    }
  ];

  const newSamples=samples.filter(sample=>
    existing.filter(item=>item.id===sample.id).length===0
  );

  saveItems([...existing,...newSamples]);
  refreshAll();
  toast("Sample campus reports loaded.");
}

function switchView(view){
  $$(".view").forEach(v=>v.classList.remove("active-view"));

  $$(".nav-item").forEach(nav=>{
    if(nav.dataset.view===view) nav.classList.add("active");
    else nav.classList.remove("active");
  });

  const target=$(`#${view}View`);
  if(target) target.classList.add("active-view");

  const titles={
    overview:"Overview",
    report:"Report an item",
    browse:"Browse reports",
    matches:"Smart matches",
    myreports:"My reports"
  };

  $("#pageTitle").textContent=titles[view]||"Findly";
  document.body.classList.remove("menu-open");

  if(view==="browse") renderBrowse();
  if(view==="matches") renderMatches();
  if(view==="myreports") renderMyReports();
}

$$(".nav-item").forEach(nav=>{
  nav.addEventListener("click",e=>{
    e.preventDefault();
    switchView(nav.dataset.view);
  });
});

$$("[data-jump]").forEach(btn=>{
  btn.addEventListener("click",()=>switchView(btn.dataset.jump));
});

addEvent("#mobileMenuBtn","click",()=>{
  document.body.classList.toggle("menu-open");
});

$$(".type-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    $$(".type-btn").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    $("#itemType").value=btn.dataset.type;
  });
});

addEvent("#description","input",()=>{
  $("#charCount").textContent=$("#description").value.length;
  updateQuality();
});

["#category","#color","#zone","#itemDate","#title"].forEach(selector=>{
  addEvent(selector,"input",updateQuality);
});

function updateQuality(){
  let q=20;

  if(inputValue("#category")) q+=20;
  if(inputValue("#color")) q+=10;
  if(inputValue("#zone")) q+=15;
  if(inputValue("#itemDate")) q+=10;
  if(inputValue("#title").trim().length>8) q+=10;

  const desc=inputValue("#description").trim();

  if(desc.length>25) q+=8;
  if(desc.length>80) q+=7;
  if(q>100) q=100;

  if($("#qualityValue")) $("#qualityValue").textContent=q;
  if($("#qualityRing")) $("#qualityRing").style.setProperty("--q",`${q*3.6}deg`);

  if($("#qualityText")){
    if(q>=85) $("#qualityText").textContent="Excellent detail — strong matching potential.";
    else if(q>=65) $("#qualityText").textContent="Good report. Add one more unique clue.";
    else $("#qualityText").textContent="Start adding specific clues.";
  }
}

addEvent("#itemForm","submit",e=>{
  e.preventDefault();

  const item={
    id:"item-"+(getItems().length+1),
    type:$("#itemType").value,
    category:$("#category").value,
    color:$("#color").value,
    zone:$("#zone").value,
    date:$("#itemDate").value,
    title:$("#title").value.trim(),
    description:$("#description").value.trim(),
    contact:$("#contact").value,
    reportedBy:currentUser.id,
    reporterName:currentUser.name,
    status:"open",
    createdAt:getItems().length+1
  };

  const items=getItems();
  items.unshift(item);
  saveItems(items);

  const ranked=items
    .filter(x=>x.id!==item.id&&x.type!==item.type&&x.status==="open")
    .map(x=>({item:x,...scorePair(item,x)}))
    .sort((a,b)=>b.score-a.score);

  e.target.reset();
  $("#itemType").value="lost";

  $$(".type-btn").forEach((btn,index)=>{
    if(index===0) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  $("#charCount").textContent="0";
  updateQuality();
  refreshAll();

  if(ranked.length){
    toast(`Report saved. Best match: ${ranked[0].score}%`);
    switchView("matches");
  }else{
    toast("Report saved. No opposite-type reports yet.");
    switchView("overview");
  }
});

function reportRow(item){
  return `<article class="report-row">
    <div class="report-thumb ${item.type}">${itemIcon(item.category)}</div>
    <div class="report-main">
      <div class="report-title-line">
        <strong>${esc(item.title)}</strong>
        <span class="type-pill ${item.type}">${item.type}</span>
      </div>
      <p>${esc(item.category)} · ${esc(item.color)} · ${esc(item.zone)}</p>
    </div>
    <time>${relativeDate(item.date)}</time>
  </article>`;
}

function renderOverview(){
  const items=getItems().filter(x=>x.status==="open");
  const lost=items.filter(x=>x.type==="lost").length;
  const found=items.filter(x=>x.type==="found").length;
  const pairs=getAllPairs(items);
  const high=pairs.filter(x=>x.score>=70).length;

  let potential=items.length ? roundNumber((high*2/items.length)*100) : 0;
  if(potential>99) potential=99;

  $("#statLost").textContent=lost;
  $("#statFound").textContent=found;
  $("#statMatches").textContent=high;
  $("#statRecovery").textContent=potential+"%";
  $("#heroMatchCount").textContent=items.length;

  if(items.length){
    $("#recentList").innerHTML=[...items]
      .sort((a,b)=>b.createdAt-a.createdAt)
      .slice(0,5)
      .map(reportRow)
      .join("");
  }else{
    $("#recentList").innerHTML=emptyState(
      "No reports yet",
      "Add a report or load sample data with the ✦ button."
    );
  }
}

function emptyState(title,text){
  return `<div class="empty-state">
    <div>✦</div>
    <strong>${title}</strong>
    <p>${text}</p>
  </div>`;
}

function itemCard(item,owner=false){
  let controls="";

  if(owner){
    controls=`<div class="owner-actions">
      <button class="delete-report-btn" data-delete-id="${item.id}" type="button">
        Delete report
      </button>
    </div>`;
  }

  return `<article class="item-card">
    <div class="card-top">
      <div class="item-symbol ${item.type}">${itemIcon(item.category)}</div>
      <span class="type-pill ${item.type}">${item.type}</span>
    </div>

    <span class="card-category">${esc(item.category)} · ${esc(item.color)}</span>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.description)}</p>

    <div class="card-meta">
      <span>⌖ ${esc(item.zone)}</span>
      <span>◷ ${formatDate(item.date)}</span>
    </div>

    <div class="card-foot">
      <span>Reported by ${esc(item.reporterName||"Student")}</span>
      <b>${item.status}</b>
    </div>

    ${controls}
  </article>`;
}

function renderBrowse(){
  let items=getItems().filter(x=>x.status==="open");

  const search=inputValue("#searchInput").toLowerCase();
  const type=inputValue("#filterType")||"all";
  const category=inputValue("#filterCategory")||"all";
  const zone=inputValue("#filterZone")||"all";

  items=items.filter(item=>{
    const text=(item.title+" "+item.description).toLowerCase();

    return(
      (type==="all"||item.type===type)&&
      (category==="all"||item.category===category)&&
      (zone==="all"||item.zone===zone)&&
      (!search||text.indexOf(search)>=0)
    );
  });

  $("#browseGrid").innerHTML=items.length
    ? items.map(itemCard).join("")
    : emptyState("No matching reports","Try changing your filters or create a new report.");
}

["#searchInput","#filterType","#filterCategory","#filterZone"].forEach(selector=>{
  addEvent(selector,"input",renderBrowse);
});

function populateFilters(){
  const categories=[
    "Electronics","Bag","ID / Cards","Keys","Books",
    "Clothing","Accessories","Bottle","Other"
  ];

  const zones=[
    "Main Gate","Admin Block","Academic Block","Library",
    "Cafeteria","Sports Complex","Hostel A","Hostel B","Parking"
  ];

  if($("#filterCategory")){
    $("#filterCategory").innerHTML=
      '<option value="all">All categories</option>'+
      categories.map(x=>`<option>${x}</option>`).join("");
  }

  if($("#filterZone")){
    $("#filterZone").innerHTML=
      '<option value="all">All zones</option>'+
      zones.map(x=>`<option>${x}</option>`).join("");
  }
}

function signalBar(label,value,weight){
  return `<div class="signal-row">
    <span>${label}<small>${weight}% weight</small></span>
    <div class="signal-track"><i style="width:${value}%"></i></div>
    <b>${value}%</b>
  </div>`;
}

function renderMatches(){
  const pairs=getAllPairs();
  const meaningful=pairs.filter(x=>x.score>=30).slice(0,12);

  if(!meaningful.length){
    $("#matchPairs").innerHTML=emptyState(
      "No smart matches yet",
      "Add both lost and found reports, or load sample data to demonstrate ranking."
    );
    return;
  }

  $("#matchPairs").innerHTML=meaningful.map((p,i)=>`
    <article class="match-card">
      <div class="match-score-ring" style="--score:${p.score*3.6}deg">
        <div><b>${p.score}%</b><span>${confidenceLabel(p.score)}</span></div>
      </div>

      <div class="pair-side">
        <span class="type-pill lost">lost</span>
        <strong>${esc(p.lost.title)}</strong>
        <p>${esc(p.lost.zone)} · ${formatDate(p.lost.date)}</p>
      </div>

      <div class="pair-connector">
        <span>✦</span><i></i><small>weighted match</small>
      </div>

      <div class="pair-side">
        <span class="type-pill found">found</span>
        <strong>${esc(p.found.title)}</strong>
        <p>${esc(p.found.zone)} · ${formatDate(p.found.date)}</p>
      </div>

      <button class="explain-btn" data-match-index="${i}">
        Explain score →
      </button>
    </article>
  `).join("");

  $$(".explain-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      openMatchModal(meaningful[Number(btn.dataset.matchIndex)]);
    });
  });
}

function openMatchModal(p){
  $("#modalMatchTitle").textContent=
    `${p.score}% match — ${confidenceLabel(p.score)}`;

  let zoneText="in different campus groups";
  if(p.zoneLevel===0) zoneText="the same";
  else if(p.zoneLevel===1) zoneText="in the same campus group";

  $("#modalMatchBody").innerHTML=`
    <div class="compare-box">
      <div>
        <span>LOST</span>
        <strong>${esc(p.lost.title)}</strong>
        <small>${esc(p.lost.zone)} · ${formatDate(p.lost.date)}</small>
      </div>

      <div class="compare-arrow">↔</div>

      <div>
        <span>FOUND</span>
        <strong>${esc(p.found.title)}</strong>
        <small>${esc(p.found.zone)} · ${formatDate(p.found.date)}</small>
      </div>
    </div>

    <div class="signals">
      ${signalBar("Category",p.signals.category,30)}
      ${signalBar("Color",p.signals.color,20)}
      ${signalBar("Zone proximity",p.signals.zone,20)}
      ${signalBar("Date window",p.signals.date,15)}
      ${signalBar("Description similarity",p.signals.description,15)}
    </div>

    <div class="explanation-note">
      Zones are <b>${zoneText}</b> and report dates differ by
      <b>${roundNumber(p.dayDifference)} day(s)</b>.
      The description score compares common words using loops and arrays.
    </div>
  `;

  $("#matchModal").classList.remove("hidden");
}

addEvent("#closeMatchModal","click",()=>{
  $("#matchModal").classList.add("hidden");
});

addEvent("#matchModal","click",e=>{
  if(e.target.id==="matchModal") e.currentTarget.classList.add("hidden");
});

function deleteReport(id){
  const items=getItems();
  const found=items.filter(x=>x.id===id);
  const item=found[0];

  if(!item||item.reportedBy!==currentUser.id){
    toast("You can only delete your own reports.");
    return;
  }

  const ok=confirm(`Delete "${item.title}"?`);
  if(!ok) return;

  saveItems(items.filter(x=>x.id!==id));
  refreshAll();
  toast("Report deleted successfully.");
}

function renderMyReports(){
  const items=getItems().filter(x=>x.reportedBy===currentUser.id);

  $("#myReportsGrid").innerHTML=items.length
    ? items.map(x=>itemCard(x,true)).join("")
    : emptyState("You have not posted yet","Create your first lost or found report.");

  $$(".delete-report-btn").forEach(btn=>{
    btn.addEventListener("click",()=>deleteReport(btn.dataset.deleteId));
  });
}

function refreshAll(){
  renderOverview();
  renderBrowse();
  renderMatches();
  renderMyReports();
}

addEvent("#seedBtn","click",seedData);

addEvent("#logoutBtn","click",()=>{
  localStorage.removeItem(SESSION_KEY);
  location.href="index.html";
});

function initDate(){
  if($("#itemDate")) $("#itemDate").value="2026-08-20";
}

populateFilters();
initDate();
updateQuality();
refreshAll();

if(!getItems().length){
  toast("Tip: click ✦ in the top bar to load sample demo reports.");
}
