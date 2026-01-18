let user = "";
let trainings = JSON.parse(localStorage.getItem("trainings")) || [];

// Initiera träningsobjekt
trainings.forEach(t => {
  t.drivers = t.drivers || [];
  t.kids = t.kids || [];
  t.drivers.forEach(d => {
    d.canDrive = d.canDrive || false;
    d.canPickup = d.canPickup || false;
    d.driveKids = d.driveKids || [];
    d.pickupKids = d.pickupKids || [];
    d.seats = d.seats || 4; // Default 4 platser
  });
  t.kids.forEach(k => {
    k.needDrive = k.needDrive !== false;
    k.needPickup = k.needPickup !== false;
  });
});

function save() { localStorage.setItem("trainings", JSON.stringify(trainings)); }

function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Skriv ditt namn");
  user = name;
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  render();
}

// ---------- Reload ----------
function reloadTrainings() {
  trainings = JSON.parse(localStorage.getItem("trainings")) || [];
  render();
}

// ---------- TRÄNING ----------
function addTraining() {
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const place = document.getElementById("place").value.trim();
  if(!date || !startTime || !endTime || !place) return alert("Fyll i alla fält");
  if(startTime >= endTime) return alert("Sluttid måste vara senare än starttid.");
  const conflict = trainings.some(t=>t.date===date && t.startTime===startTime);
  if(conflict) return alert("Det finns redan en träning med samma starttid.");
  trainings.push({ date, startTime, endTime, place, drivers: [], kids: [] });
  save(); render();
  document.getElementById("date").value = "";
  document.getElementById("place").value = "";
}

function editTrainingInline(i){
  const t = trainings[i];
  const newDate = prompt("Datum:", t.date);
  if(!newDate) return;
  const newStart = prompt("Starttid:", t.startTime);
  if(!newStart) return;
  const newEnd = prompt("Sluttid:", t.endTime);
  if(!newEnd) return;
  const newPlace = prompt("Plats:", t.place);
  if(!newPlace) return;
  t.date = newDate;
  t.startTime = newStart;
  t.endTime = newEnd;
  t.place = newPlace;
  save();
  render();
}

function deleteTraining(i) {
  if(!confirm("Ta bort denna träning?")) return;
  trainings.splice(i,1);
  save(); render();
}

function removePastTrainings(){
  const now = new Date();
  trainings = trainings.filter(t=>{
    const tEnd = new Date(t.date+"T"+t.endTime+":00");
    return tEnd >= now;
  });
  save(); render();
}

// ---------- BARN ----------
function addKidRow(ti){
  trainings[ti].kids.push({name:"", needDrive:true, needPickup:true});
  save(); render();
}

function deleteKid(ti,ki){
  const removedName = trainings[ti].kids[ki].name;
  trainings[ti].drivers.forEach(d => {
    d.driveKids = d.driveKids.filter(x => x !== removedName);
    d.pickupKids = d.pickupKids.filter(x => x !== removedName);
  });
  trainings[ti].kids.splice(ki,1); 
  save(); render();
}

function toggleKidNeed(ti,ki,type){
  const k = trainings[ti].kids[ki];
  if(type==="drive") k.needDrive = !k.needDrive;
  else k.needPickup = !k.needPickup;
  save(); render();
}

function updateKidName(ti,ki,el){
  const oldName = trainings[ti].kids[ki].name;
  const newName = el.value.trim();
  trainings[ti].kids[ki].name = newName;

  trainings[ti].drivers.forEach(d => {
    if(d.driveKids.includes(oldName)){
      d.driveKids = d.driveKids.map(x => x===oldName ? newName : x);
    }
    if(d.pickupKids.includes(oldName)){
      d.pickupKids = d.pickupKids.map(x => x===oldName ? newName : x);
    }
  });

  save(); render();
}

// Kopiera barn
function copyKidsFromPrev(ti){
  if(ti===0) return alert("Ingen föregående träning att kopiera från.");
  const prevKids = trainings[ti-1].kids;
  if(prevKids.length===0) return alert("Föregående träning har inga barn.");
  let html = prevKids.map((k,i)=>`<label><input type="checkbox" id="copyKid${i}">${k.name}</label><br>`).join("");
  const container = document.createElement("div");
  container.className="copy-dialog";
  container.innerHTML = `<h3>Kopiera barn från föregående träning</h3>${html}
<button id="doCopy">Kopiera</button>
<button onclick="document.body.removeChild(this)">Avbryt</button>`;
  document.body.appendChild(container);
  document.getElementById("doCopy").onclick = function(){
    prevKids.forEach((k,i)=>{
      const cb = document.getElementById(`copyKid${i}`);
      if(cb.checked) trainings[ti].kids.push({...k});
    });
    save(); render();
    document.body.removeChild(container);
  }
}

// ---------- FÖRÄLDER ----------
function getDriver(ti){
  let driver = trainings[ti].drivers.find(d=>d.name===user);
  if(!driver){
    driver = {name:user, canDrive:false, canPickup:false, driveKids:[], pickupKids:[], seats:4};
    trainings[ti].drivers.push(driver);
    save();
  }
  return driver;
}

function toggleDriverAbility(ti,type){
  const d = getDriver(ti);
  if(type==="drive") d.canDrive = !d.canDrive;
  else d.canPickup = !d.canPickup;
  save(); render();
}

function updateSeats(ti){
  const d = getDriver(ti);
  const sel = document.getElementById("seats"+ti);
  d.seats = parseInt(sel.value);
  save(); render();
}

function toggleAssignKid(ti,kidName,type){
  const d = getDriver(ti);
  let list = type==="drive"? d.driveKids : d.pickupKids;
  let newCount = list.includes(kidName)? list.length-1 : list.length+1;
  if(type==="drive" && newCount>d.seats){
    alert("Du försöker boka fler barn än antal lediga platser!");
    return;
  }
  const otherAssigned = trainings[ti].drivers.some(dr=>{
    if(dr.name===d.name) return false;
    if(type==="drive") return dr.driveKids.includes(kidName);
    else return dr.pickupKids.includes(kidName);
  });
  if(list.includes(kidName)) list = list.filter(x=>x!==kidName);
  else{
    if(otherAssigned){ alert("Barnet har redan sin transport täckt av annan förälder."); return; }
    list.push(kidName);
  }
  if(type==="drive") d.driveKids=list; else d.pickupKids=list;
  save(); render();
}

function removeDriver(ti){
  const idx = trainings[ti].drivers.findIndex(d=>d.name===user);
  if(idx!==-1) trainings[ti].drivers.splice(idx,1);
  save(); render();
}

// ---------- RENDER ----------
function render(){
  const div=document.getElementById("trainings"); if(!div) return;
  document.getElementById("loggedInParent").textContent = `Du är inloggad som: ${user}`;
  div.innerHTML="";
  trainings.sort((a,b)=>{
    const da=a.date.localeCompare(b.date);
    if(da!==0) return da;
    return a.startTime.localeCompare(b.startTime);
  });
  const now = new Date();
  let firstTodayIndex = -1;

  trainings.forEach((t,ti)=>{
    const me = t.drivers.find(d=>d.name===user);
    const tEndDate = new Date(t.date+"T"+t.endTime+":00");
    const isPast = tEndDate<now;
    const today = t.date === now.toISOString().slice(0,10);
    if(today && firstTodayIndex===-1) firstTodayIndex=ti;
    const bgColor = isPast ? "#ddd" : (today?"#ffffcc":"#e9f5ee");

    // ---------- Barn
    let kidsHTML = `<table style="table-layout:fixed; width:100%; border-collapse:collapse;">
<tr>
<th style="width:250px;">Barn</th>
<th style="width:80px;">Behöver skjuts</th>
<th style="width:80px;">Behöver hämtning</th>
<th style="width:100px;">Du skjutsar</th>
<th style="width:100px;">Du hämtar</th>
<th style="width:60px;">Ta bort</th>
</tr>`;
    t.kids.forEach((k,ki)=>{
      const driveCovered = t.drivers.some(d=>d.driveKids?.includes(k.name));
      const pickupCovered = t.drivers.some(d=>d.pickupKids?.includes(k.name));
      const driveOk = !k.needDrive || driveCovered;
      const pickupOk = !k.needPickup || pickupCovered;
      const rowClass = (driveOk && pickupOk) ? "success" : "warning";
      const meDriver = me || {};
      const myDriveChecked = meDriver.driveKids?.includes(k.name)?"checked":"";
      const myPickupChecked = meDriver.pickupKids?.includes(k.name)?"checked":"";
      const driveDisabled = me ? false : driveCovered;
      const pickupDisabled = me ? false : pickupCovered;

      kidsHTML += `<tr class="${rowClass}">
<td><input type="text" value="${k.name}" style="width:100%; font-weight:bold;" onblur="updateKidName(${ti},${ki},this)"></td>
<td><input type="checkbox" ${k.needDrive?"checked":""} onclick="toggleKidNeed(${ti},${ki},'drive')"></td>
<td><input type="checkbox" ${k.needPickup?"checked":""} onclick="toggleKidNeed(${ti},${ki},'pickup')"></td>
<td><input type="checkbox" ${myDriveChecked} onclick="toggleAssignKid(${ti},'${k.name}','drive')" ${!me?.canDrive||driveDisabled?"disabled":""}></td>
<td><input type="checkbox" ${myPickupChecked} onclick="toggleAssignKid(${ti},'${k.name}','pickup')" ${!me?.canPickup||pickupDisabled?"disabled":""}></td>
<td><button onclick="deleteKid(${ti},${ki})">🗑️</button></td>
</tr>`;
    });
    kidsHTML += `</table><button onclick="addKidRow(${ti})">➕ Lägg till barn</button>`;
    if(ti>0) kidsHTML += ` <button onclick="copyKidsFromPrev(${ti})">📋 Kopiera barn från föregående</button>`;

    // ---------- Föräldrar
    let driversHTML = `<table style="table-layout:fixed; width:100%; border-collapse:collapse;"><tr>
<th>Förälder</th><th>Kan skjutsa</th><th>Kan hämta</th><th>Skjutsar</th><th>Hämtar</th><th>Platser</th></tr>`;
    t.drivers.forEach(d=>{
      const driveKids=Array.isArray(d.driveKids)?d.driveKids:[]; 
      const pickupKids=Array.isArray(d.pickupKids)?d.pickupKids:[]; 
      driversHTML += `<tr style="${d.name===user?'background:#ccf2ff':''}">
<td>${d.name}</td><td>${d.canDrive?"✅":"❌"}</td>
<td>${d.canPickup?"✅":"❌"}</td>
<td>${driveKids.join(", ")||"—"}</td>
<td>${pickupKids.join(", ")||"—"}</td>
<td>${d.seats||4}</td>
</tr>`;
    });
    driversHTML += `</table>`;

    div.innerHTML += `<div class="training" style="background:${bgColor}; padding:10px; margin-bottom:10px;">
<div class="training-header">
<span>${t.date} ${t.startTime}-${t.endTime}</span>
<span>
<button onclick="editTrainingInline(${ti})">✏️</button>
<button onclick="deleteTraining(${ti})">🗑️</button>
</span>
</div>
<div>📍 ${t.place}</div>
<div class="sections">
<div class="section"><h3>🚗 Föräldrar</h3>${driversHTML || "Ingen anmäld"}
${me?`<button onclick="removeDriver(${ti})">🗑️ Ta bort mig</button>`:""}
<div style="margin-top:5px;">
<label><input type="checkbox" ${me?.canDrive?"checked":""} onclick="toggleDriverAbility(${ti},'drive')"> Jag kan skjutsa</label><br>
<label><input type="checkbox" ${me?.canPickup?"checked":""} onclick="toggleDriverAbility(${ti},'pickup')"> Jag kan hämta</label><br>
<label>Lediga platser:
<select id="seats${ti}" onchange="updateSeats(${ti})">
${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${me?.seats===n?'selected':''}>${n}</option>`).join('')}
</select>
</label>
</div>
</div>
<div class="section"><h3>⚽ Barn</h3>${kidsHTML}</div>
</div></div>`;
  });

  if(firstTodayIndex!==-1){
    const el = document.getElementById(`training-${firstTodayIndex}`);
    if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  }
}
