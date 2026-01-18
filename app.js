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

  if (!dateEl || !startEl || !endEl || !placeEl) { alert("Formuläret laddades inte korrekt."); return; }

  const date = dateEl.value;
  const startTime = startEl.value;
  const endTime = endEl.value;
  const place = placeEl.value.trim();
  if(!date || !startTime || !endTime || !place) { alert("Fyll i alla fält"); return; }
  if(startTime >= endTime){ alert("Sluttid måste vara senare än starttid."); return; }

  // Kontrollera att det inte redan finns träning på samma dag och starttid
  const conflict = trainings.some(t=>t.date===date && t.startTime===startTime);
  if(conflict){ alert("Det finns redan en träning med samma starttid."); return; }

  trainings.push({ date, startTime, endTime, place, drivers: [], kids: [] });
  save();
  render();
  dateEl.value=""; placeEl.value="";
}

function editTraining(i) {
  const t = trainings[i];
  const date = prompt("Datum:", t.date);
  const startTime = prompt("Starttid:", t.startTime);
  const endTime = prompt("Sluttid:", t.endTime);
  const place = prompt("Plats:", t.place);
  if(!date || !startTime || !endTime || !place) return;
  if(startTime >= endTime){ alert("Sluttid måste vara senare än starttid."); return; }

  const conflict = trainings.some((x, idx)=>idx!==i && x.date===date && x.startTime===startTime);
  if(conflict){ alert("Det finns redan en träning med samma starttid."); return; }

  t.date = date; t.startTime = startTime; t.endTime = endTime; t.place = place;
  save(); render();
}

function deleteTraining(i) { if(!confirm("Ta bort denna träning?")) return; trainings.splice(i,1); save(); render(); }

function removePastTrainings(){
  const now = new Date();
  trainings = trainings.filter(t=>{
    const tDate = new Date(t.date+"T"+t.endTime+":00");
    return tDate >= now;
  });
  save();
  render();
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

    let kidsHTML="";
    t.kids.forEach((k,ki)=>{
      const driveChecked=k.needDrive?"checked":"";
      const pickupChecked=k.needPickup?"checked":"";
      const myDriveChecked=me?.driveKids?.includes(k.name)?"checked":"";
      const myPickupChecked=me?.pickupKids?.includes(k.name)?"checked":"";

      // Färgkodning per barn: röd om saknar skjuts/hämtning, grön annars
      let missing = false;
      t.drivers.forEach(d=>{
        if((k.needDrive && !d.driveKids.includes(k.name)) || (k.needPickup && !d.pickupKids.includes(k.name))) missing=true;
      });
      const colorClass = missing ? "label-red" : "label-green";

      kidsHTML+=`⚽ <strong class="${colorClass}">${k.name}</strong><br>
        Behöver: <label><input type="checkbox" ${driveChecked} onclick="toggleKidNeed(${ti},${ki},'drive')"> Skjuts</label>
        <label><input type="checkbox" ${pickupChecked} onclick="toggleKidNeed(${ti},${ki},'pickup')"> Hämtning</label><br>
        Du: <label><input type="checkbox" ${myDriveChecked} onclick="toggleAssignKid(${ti},'${k.name}','drive')" ${!me?.canDrive?"disabled":""}> Skjutsa</label>
        <label><input type="checkbox" ${myPickupChecked} onclick="toggleAssignKid(${ti},'${k.name}','pickup')" ${!me?.canPickup?"disabled":""}> Hämta</label>
        <br><button onclick="editKid(${ti},${ki})">✏️</button>
        <button onclick="deleteKid(${ti},${ki})">🗑️</button><br><br>`;
    });

    // Föräldrar
    let driversHTML="";
    t.drivers.forEach(d=>{
      const driveKids=Array.isArray(d.driveKids)?d.driveKids:[]; 
      const pickupKids=Array.isArray(d.pickupKids)?d.pickupKids:[]; 
      driversHTML+=`🚗 <strong>${d.name}</strong><br>Kan skjutsa: ${d.canDrive?"✅":"❌"} | Kan hämta: ${d.canPickup?"✅":"❌"}<br>Skjutsar: ${driveKids.join(", ")||"—"}<br>Hämtar: ${pickupKids.join(", ")||"—"}<br><br>`;
    });

    const bgColor = isPast ? "#ddd" : "#e9f5ee";

    div.innerHTML+=`<div class="training" style="background:${bgColor}">
      <strong>${t.date} ${t.startTime}-${t.endTime}</strong><br>📍 ${t.place}<br><br>
      <button onclick="editTraining(${ti})">✏️ Redigera träning</button>
      <button onclick="deleteTraining(${ti})">🗑️ Ta bort träning</button><br><br>
      <strong>🚗 Din tillgänglighet</strong><br>
      <label><input type="checkbox" ${me?.canDrive?"checked":""} onclick="toggleDriverAbility(${ti},'drive')"> Jag kan skjutsa</label>
      <label><input type="checkbox" ${me?.canPickup?"checked":""} onclick="toggleDriverAbility(${ti},'pickup')"> Jag kan hämta</label><br>
      ${me?`<button onclick="removeDriver(${ti})">🗑️ Ta bort mig</button>`:""}<br><br>
      <strong>🚗 Alla föräldrar</strong><br>${driversHTML || "Ingen anmäld än"}<br>
      <strong>⚽ Barn</strong><br>${kidsHTML || "Inga barn inlagda än"}<br>
      <button onclick="addKid(${ti})">➕ Lägg till barn</button>
    </div>`;
  });
}
