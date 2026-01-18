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

function editTrainingInline(i) {
  const t = trainings[i];
  const container = document.getElementById(`training-${i}`);
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; flex-wrap:wrap; gap:5px; align-items:center;">
      <input type="date" id="editDate${i}" value="${t.date}">
      <select id="editStart${i}"></select>
      <select id="editEnd${i}"></select>
      <input type="text" id="editPlace${i}" value="${t.place}" placeholder="Plats">
      <button onclick="saveEditTraining(${i})">💾 Spara</button>
      <button onclick="render()">❌ Avbryt</button>
    </div>
  `;
  generateEditTimeOptions(i, t.startTime, t.endTime);
}

function generateEditTimeOptions(i, startValue, endValue){
  const times = [];
  for(let h=0; h<24; h++){
    [0,15,30,45].forEach(m=>{
      let hh = h.toString().padStart(2,'0');
      let mm = m.toString().padStart(2,'0');
      times.push(`${hh}:${mm}`);
    });
  }
  const startSel = document.getElementById(`editStart${i}`);
  const endSel = document.getElementById(`editEnd${i}`);
  startSel.innerHTML = times.map(t=>`<option value="${t}" ${t===startValue?'selected':''}>${t}</option>`).join('');
  endSel.innerHTML = times.map(t=>`<option value="${t}" ${t===endValue?'selected':''}>${t}</option>`).join('');
}

function saveEditTraining(i){
  const date = document.getElementById(`editDate${i}`).value;
  const startTime = document.getElementById(`editStart${i}`).value;
  const endTime = document.getElementById(`editEnd${i}`).value;
  const place = document.getElementById(`editPlace${i}`).value.trim();
  if(!date || !startTime || !endTime || !place) return alert("Fyll i alla fält");
  if(startTime >= endTime) return alert("Sluttid måste vara senare än starttid.");
  const conflict = trainings.some((x, idx)=>idx!==i && x.date===date && x.startTime===startTime);
  if(conflict) return alert("Det finns redan en träning med samma starttid.");

  trainings[i].date = date;
  trainings[i].startTime = startTime;
  trainings[i].endTime = endTime;
  trainings[i].place = place;
  save(); render();
}

function deleteTraining(i) { if(!confirm("Ta bort denna träning?")) return; trainings.splice(i,1); save(); render(); }

function removePastTrainings(){
  const now = new Date();
  trainings = trainings.filter(t=>new Date(t.date+"T"+t.endTime+":00") >= now);
  save(); render();
}

// ---------- BARN ----------
function addKidRow(ti){
  trainings[ti].kids.push({name:"", needDrive:true, needPickup:true});
  save(); render();
}
function deleteKid(ti,ki){ 
  if(!confirm("Ta bort detta barn?")) return; 
  const kidName=trainings[ti].kids[ki].name; 
  trainings[ti].drivers.forEach(d=>{
    d.driveKids=(d.driveKids||[]).filter(x=>x!==kidName); 
    d.pickupKids=(d.pickupKids||[]).filter(x=>x!==kidName); 
  }); 
  trainings[ti].kids.splice(ki,1); 
  save(); render();
}
function toggleKidNeed(ti,ki,type){ const k=trainings[ti].kids[ki]; if(type==="drive") k.needDrive=!k.needDrive; if(type==="pickup") k.needPickup=!k.needPickup; save(); render();}
function updateKidName(ti,ki,el){ trainings[ti].kids[ki].name = el.value; save(); render(); }

// ---------- FÖRÄLDER ----------
function getDriver(ti){ let d=trainings[ti].drivers.find(x=>x.name===user); if(!d){ d={ name:user, canDrive:false, canPickup:false, driveKids:[], pickupKids:[] }; trainings[ti].drivers.push(d);} return d;}
function toggleDriverAbility(ti,type){ const d=getDriver(ti); if(type==="drive") d.canDrive=!d.canDrive; if(type==="pickup") d.canPickup=!d.canPickup; if(!d.canDrive) d.driveKids=[]; if(!d.canPickup)d.pickupKids=[]; save(); render();}
function toggleAssignKid(ti,kidName,type){
  const d=getDriver(ti); 
  let list=type==="drive"? (d.driveKids||[]) : (d.pickupKids||[]); 
  // --- Kontroll: ingen annan får bocka samma barn ---
  const otherAssigned = trainings[ti].drivers.some(dr=>{
    if(dr.name===d.name) return false;
    if(type==="drive") return dr.driveKids.includes(kidName);
    else return dr.pickupKids.includes(kidName);
  });
  if(list.includes(kidName)){
    list=list.filter(x=>x!==kidName);
  }else{
    if(otherAssigned){ alert("Barnet har redan sin transport täckt av annan förälder."); return; }
    list.push(kidName);
  }
  if(type==="drive") d.driveKids=list; else d.pickupKids=list;
  save(); render();
}
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
  let firstTodayIndex = -1;

  trainings.forEach((t,ti)=>{
    const me=t.drivers.find(d=>d.name===user);
    const tEndDate = new Date(t.date+"T"+t.endTime+":00");
    const isPast = tEndDate<now;
    const today = t.date === now.toISOString().slice(0,10);
    if(today && firstTodayIndex===-1) firstTodayIndex=ti;
    const bgColor = isPast ? "#ddd" : (today?"#ffffcc":"#e9f5ee");

    // ---------- Barn
    let kidsHTML = `<table style="table-layout:fixed;"><tr><th style="width:200px;">Barn</th><th>Behöver skjuts</th><th>Behöver hämtning</th><th>Du skjutsar</th><th>Du hämtar</th><th>Ta bort</th></tr>`;
    t.kids.forEach((k,ki)=>{
      // --- Kontrollera om behov uppfyllt ---
      const driveCovered = t.drivers.some(d=>d.driveKids?.includes(k.name));
      const pickupCovered = t.drivers.some(d=>d.pickupKids?.includes(k.name));
      const driveChecked = k.needDrive?"checked":"";
      const pickupChecked = k.needPickup?"checked":"";

      const myDriveChecked = me?.driveKids?.includes(k.name)?"checked":"";
      const myPickupChecked = me?.pickupKids?.includes(k.name)?"checked":"";

      // Grön om behov uppfyllt
      const driveOk = !k.needDrive || driveCovered;
      const pickupOk = !k.needPickup || pickupCovered;
      const colorClass = (driveOk && pickupOk) ? "label-green" : "label-red";

      kidsHTML += `<tr style="background:${colorClass==='label-green'?'#e6ffe6':'#ffe6e6'};">
        <td><input type="text" value="${k.name}" class="${colorClass}" style="width:100%; font-weight:bold;" onblur="updateKidName(${ti},${ki},this)"></td>
        <td><input type="checkbox" ${driveChecked} onclick="toggleKidNeed(${ti},${ki},'drive')"></td>
        <td><input type="checkbox" ${pickupChecked} onclick="toggleKidNeed(${ti},${ki},'pickup')"></td>
        <td><input type="checkbox" ${myDriveChecked} onclick="toggleAssignKid(${ti},'${k.name}','drive')" ${!me?.canDrive||driveCovered?"disabled":""}></td>
        <td><input type="checkbox" ${myPickupChecked} onclick="toggleAssignKid(${ti},'${k.name}','pickup')" ${!me?.canPickup||pickupCovered?"disabled":""}></td>
        <td><button onclick="deleteKid(${ti},${ki})">🗑️</button></td>
      </tr>`;
    });
    kidsHTML += `</table><button onclick="addKidRow(${ti})">➕ Lägg till barn</button>`;

    // ---------- Föräldrar
    let driversHTML = `<table style="table-layout:fixed;"><tr><th>Förälder</th><th>Kan skjutsa</th><th>Kan hämta</th><th>Skjutsar</th><th>Hämtar</th></tr>`;
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
    
    // ---------- Render med föräldrar vänster, barn höger
    div.innerHTML += `<div class="training" id="training-${ti}" style="background:${bgColor}">
      <div class="training-header">
        <span class="training-time">${t.date} ${t.startTime}-${t.endTime}</span>
        <span>
          <button onclick="editTrainingInline(${ti})">✏️</button>
          <button onclick="deleteTraining(${ti})">🗑️</button>
        </span>
      </div>
      <div>📍 ${t.place}</div>
      <div class="sections">
        <div class="section">
          <h3>🚗 Föräldrar</h3>
          ${driversHTML || "Ingen anmäld"}
          ${me?`<button onclick="removeDriver(${ti})">🗑️ Ta bort mig</button>`:""}
          <div style="margin-top:5px;">
            <label><input type="checkbox" ${me?.canDrive?"checked":""} onclick="toggleDriverAbility(${ti},'drive')"> Jag kan skjutsa</label><br>
            <label><input type="checkbox" ${me?.canPickup?"checked":""} onclick="toggleDriverAbility(${ti},'pickup')"> Jag kan hämta</label>
          </div>
        </div>
        <div class="section">
          <h3>⚽ Barn</h3>
          ${kidsHTML}
        </div>
      </div>
    </div>`;
  });

  // Scrolla till första dagens träning
  if(firstTodayIndex!==-1){
    const el = document.getElementById(`training-${firstTodayIndex}`);
    if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  }
}
