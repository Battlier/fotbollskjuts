let user = "";
let trainings = JSON.parse(localStorage.getItem("trainings")) || [];

// Säkerställ bakåtkompatibilitet
trainings.forEach(t => {
  t.drivers = t.drivers || [];
  t.kids = t.kids || [];
  t.drivers.forEach(d => {
    d.canDrive = d.canDrive || false;
    d.canPickup = d.canPickup || false;
    d.driveKids = d.driveKids || [];
    d.pickupKids = d.pickupKids || [];
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

// ---------- TRÄNING ----------
function addTraining() {
  const dateEl = document.getElementById("date");
  const startEl = document.getElementById("startTime");
  const endEl = document.getElementById("endTime");
  const placeEl = document.getElementById("place");

  if (!dateEl || !startEl || !endEl || !placeEl) return alert("Formuläret laddades inte korrekt.");

  const date = dateEl.value;
  const startTime = startEl.value;
  const endTime = endEl.value;
  const place = placeEl.value.trim();
  if(!date || !startTime || !endTime || !place) return alert("Fyll i alla fält");
  if(startTime >= endTime) return alert("Sluttid måste vara senare än starttid.");

  const conflict = trainings.some(t=>t.date===date && t.startTime===startTime);
  if(conflict) return alert("Det finns redan en träning med samma starttid.");

  trainings.push({ date, startTime, endTime, place, drivers: [], kids: [] });
  save(); render();
  dateEl.value=""; placeEl.value="";
}

function editTraining(i) {
  const t = trainings[i];
  const date = prompt("Datum:", t.date);
  const startTime = prompt("Starttid:", t.startTime);
  const endTime = prompt("Sluttid:", t.endTime);
  const place = prompt("Plats:", t.place);
  if(!date || !startTime || !endTime || !place) return;
  if(startTime >= endTime) return alert("Sluttid måste vara senare än starttid.");

  const conflict = trainings.some((x, idx)=>idx!==i && x.date===date && x.startTime===startTime);
  if(conflict) return alert("Det finns redan en träning med samma starttid.");

  t.date = date; t.startTime = startTime; t.endTime = endTime; t.place = place;
  save(); render();
}

function deleteTraining(i) { if(!confirm("Ta bort denna träning?")) return; trainings.splice(i,1); save(); render(); }

function removePastTrainings(){
  const now = new Date();
  trainings = trainings.filter(t=>new Date(t.date+"T"+t.endTime+":00") >= now);
  save(); render();
}

// ---------- BARN ----------
function addKid(ti) {
  const name = prompt("Barnets namn:"); if(!name) return;
  trainings[ti].kids.push({ name, needDrive:true, needPickup:true });
  save(); render();
}
function editKid(ti,ki){ const k=trainings[ti].kids[ki]; const name=prompt("Barnets namn:",k.name); if(!name) return; k.name=name; save(); render();}
function deleteKid(ti,ki){ if(!confirm("Ta bort detta barn?")) return; const kidName=trainings[ti].kids[ki].name; trainings[ti].drivers.forEach(d=>{ d.driveKids=(d.driveKids||[]).filter(x=>x!==kidName); d.pickupKids=(d.pickupKids||[]).filter(x=>x!==kidName); }); trainings[ti].kids.splice(ki,1); save(); render();}
function toggleKidNeed(ti,ki,type){ const k=trainings[ti].kids[ki]; if(type==="drive") k.needDrive=!k.needDrive; if(type==="pickup") k.needPickup=!k.needPickup; save(); render();}

// ---------- FÖRÄLDER ----------
function getDriver(ti){ let d=trainings[ti].drivers.find(x=>x.name===user); if(!d){ d={ name:user, canDrive:false, canPickup:false, driveKids:[], pickupKids:[] }; trainings[ti].drivers.push(d);} return d;}
function toggleDriverAbility(ti,type){ const d=getDriver(ti); if(type==="drive") d.canDrive=!d.canDrive; if(type==="pickup") d.canPickup=!d.canPickup; if(!d.canDrive) d.driveKids=[]; if(!d.canPickup)d.pickupKids=[]; save(); render();}
function toggleAssignKid(ti,kidName,type){ const d=getDriver(ti); let list=type==="drive"? (d.driveKids||[]) : (d.pickupKids||[]); if(list.includes(kidName)) list=list.filter(x=>x!==kidName); else list.push(kidName); if(type==="drive") d.driveKids=list; else d.pickupKids=list; save(); render();}
function removeDriver(ti){ if(!confirm("Ta bort din anmälan?")) return; trainings[ti].drivers=trainings[ti].drivers.filter(d=>d.name!==user); save(); render();}

// ---------- RENDER ----------
function render(){
  const div=document.getElementById("trainings"); if(!div) return;
  div.innerHTML="";

  trainings.sort((a,b)=>{
    const da=a.date.localeCompare(b.date);
    if(da!==0) return da;
    return a.startTime.localeCompare(b.startTime);
  });

  const now = new Date();

  trainings.forEach((t,ti)=>{
    const me=t.drivers.find(d=>d.name===user);
    const tEndDate = new Date(t.date+"T"+t.endTime+":00");
    const isPast = tEndDate<now;
    const bgColor = isPast ? "#ddd" : "#e9f5ee";

    // ---------- Barn (tabell-liknande kompakt)
    let kidsHTML = `<table><tr><th>Barn</th><th>Behöver skjuts</th><th>Behöver hämtning</th><th>Du skjutsar</th><th>Du hämtar</th><th>Redigera</th></tr>`;
    t.kids.forEach((k,ki)=>{
      const driveChecked = k.needDrive?"checked":"";
      const pickupChecked = k.needPickup?"checked":"";
      const myDriveChecked = me?.driveKids?.includes(k.name)?"checked":"";
      const myPickupChecked = me?.pickupKids?.includes(k.name)?"checked":"";

      const missing = t.drivers.every(d=>(k.needDrive && !d.driveKids.includes(k.name)) || (k.needPickup && !d.pickupKids.includes(k.name)));
      const colorClass = missing ? "label-red" : "label-green";

      kidsHTML += `<tr style="background:${missing?'#ffe6e6':'#e6ffe6'};">
        <td><strong class="${colorClass}">${k.name}</strong></td>
        <td><input type="checkbox" ${driveChecked} onclick="toggleKidNeed(${ti},${ki},'drive')"></td>
        <td><input type="checkbox" ${pickupChecked} onclick="toggleKidNeed(${ti},${ki},'pickup')"></td>
        <td><input type="checkbox" ${myDriveChecked} onclick="toggleAssignKid(${ti},'${k.name}','drive')" ${!me?.canDrive?"disabled":""}></td>
        <td><input type="checkbox" ${myPickupChecked} onclick="toggleAssignKid(${ti},'${k.name}','pickup')" ${!me?.canPickup?"disabled":""}></td>
        <td><button onclick="editKid(${ti},${ki})">✏️</button> <button onclick="deleteKid(${ti},${ki})">🗑️</button></td>
      </tr>`;
    });
    kidsHTML += `</table>`;

    // ---------- Föräldrar (tabell-liknande kompakt)
    let driversHTML = `<table><tr><th>Förälder</th><th>Kan skjutsa</th><th>Kan hämta</th><th>Skjutsar</th><th>Hämtar</th></tr>`;
    t.drivers.forEach(d=>{
      const driveKids=Array.isArray(d.driveKids)?d.driveKids:[]; 
      const pickupKids=Array.isArray(d.pickupKids)?d.pickupKids:[]; 
      driversHTML += `<tr>
        <td>${d.name}</td>
        <td>${d.canDrive?"✅":"❌"}</td>
        <td>${d.canPickup?"✅":"❌"}</td>
        <td>${driveKids.join(", ")||"—"}</td>
        <td>${pickupKids.join(", ")||"—"}</td>
      </tr>`;
    });
    driversHTML += `</table>`;

    div.innerHTML += `<div class="training" style="background:${bgColor}">
      <div class="training-header">
        <span class="training-time">${t.date} ${t.startTime}-${t.endTime}</span>
        <span>
          <button onclick="editTraining(${ti})">✏️</button>
          <button onclick="deleteTraining(${ti})">🗑️</button>
        </span>
      </div>
      <div>📍 ${t.place}</div>
      <div class="sections">
        <div class="section">
          <h3>⚽ Barn</h3>
          ${kidsHTML || "Inga barn inlagda"}
          <button onclick="addKid(${ti})">➕ Lägg till barn</button>
        </div>
        <div class="section">
          <h3>🚗 Föräldrar</h3>
          ${driversHTML || "Ingen anmäld"}
          ${me?`<button onclick="removeDriver(${ti})">🗑️ Ta bort mig</button>`:""}
          <div style="margin-top:5px;">
            <label><input type="checkbox" ${me?.canDrive?"checked":""} onclick="toggleDriverAbility(${ti},'drive')"> Jag kan skjutsa</label><br>
            <label><input type="checkbox" ${me?.canPickup?"checked":""} onclick="toggleDriverAbility(${ti},'pickup')"> Jag kan hämta</label>
          </div>
        </div>
      </div>
    </div>`;
  });
}
