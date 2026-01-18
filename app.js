let user = "";
let trainings = JSON.parse(localStorage.getItem("trainings")) || [];

trainings.forEach(t => {
  t.drivers = t.drivers || [];
  t.kids = t.kids || [];
  t.drivers.forEach(d => {
    d.canDrive = d.canDrive || false;
    d.canPickup = d.canPickup || false;
    d.driveKids = d.driveKids || [];
    d.pickupKids = d.pickupKids || [];
    d.seats = d.seats || 1;
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
function addTraining() { /* samma som tidigare */ }
function editTrainingInline(i) { /* inline-edit */ }
function generateEditTimeOptions(i, startValue, endValue){ /* samma */ }
function saveEditTraining(i){ /* samma */ }
function deleteTraining(i) { if(!confirm("Ta bort denna träning?")) return; trainings.splice(i,1); save(); render(); }
function removePastTrainings(){ /* samma */ }

// ---------- BARN ----------
function addKidRow(ti){ trainings[ti].kids.push({name:"", needDrive:true, needPickup:true}); save(); render(); }
function deleteKid(ti,ki){ /* samma */ }
function toggleKidNeed(ti,ki,type){ /* samma */ }
function updateKidName(ti,ki,el){ trainings[ti].kids[ki].name = el.value; save(); render(); }

// Kopiera barn från föregående träning
function copyKidsFromPrev(ti){
  if(ti===0) return alert("Ingen föregående träning att kopiera från.");
  const prevKids = trainings[ti-1].kids;
  if(prevKids.length===0) return alert("Föregående träning har inga barn.");
  let html = prevKids.map((k,i)=>`<label><input type="checkbox" id="copyKid${i}">${k.name}</label><br>`).join("");
  const container = document.createElement("div");
  container.innerHTML = `<div style="background:#fff; border:1px solid #aaa; padding:10px; position:fixed; top:20%; left:35%; z-index:1000;">
<h3>Kopiera barn från föregående träning</h3>${html}
<button id="doCopy">Kopiera</button>
<button onclick="document.body.removeChild(this.parentNode)">Avbryt</button>
</div>`;
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
function getDriver(ti){ /* samma */ }
function toggleDriverAbility(ti,type){ /* samma */ }
function updateSeats(ti){ /* samma */ }
function toggleAssignKid(ti,kidName,type){ /* med överbokningskontroll */ }
function removeDriver(ti){ /* samma */ }

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
    const me=t.drivers.find(d=>d.name===user);
    const tEndDate = new Date(t.date+"T"+t.endTime+":00");
    const isPast = tEndDate<now;
    const today = t.date === now.toISOString().slice(0,10);
    if(today && firstTodayIndex===-1) firstTodayIndex=ti;
    const bgColor = isPast ? "#ddd" : (today?"#ffffcc":"#e9f5ee");

    // ---------- Barn
    let kidsHTML = `<table style="table-layout:fixed; width:100%; border-collapse:collapse;">
<tr>
<th style="width:250px;">Barn</th>
<th style="width:80px; text-align:center;">Behöver skjuts</th>
<th style="width:80px; text-align:center;">Behöver hämtning</th>
<th style="width:100px; text-align:center;">Du skjutsar</th>
<th style="width:100px; text-align:center;">Du hämtar</th>
<th style="width:60px; text-align:center;">Ta bort</th>
</tr>`;

    t.kids.forEach((k,ki)=>{
      const driveCovered = t.drivers.some(d=>d.driveKids?.includes(k.name));
      const pickupCovered = t.drivers.some(d=>d.pickupKids?.includes(k.name));
      const driveOk = !k.needDrive || driveCovered;
      const pickupOk = !k.needPickup || pickupCovered;
      const colorClass = (driveOk && pickupOk) ? "label-green" : "label-red";
      const meDriver = me || {};
      const myDriveChecked = meDriver.driveKids?.includes(k.name)?"checked":"";
      const myPickupChecked = meDriver.pickupKids?.includes(k.name)?"checked":"";
      const driveDisabled = me ? false : driveCovered;
      const pickupDisabled = me ? false : pickupCovered;

      kidsHTML += `<tr style="background:${colorClass==='label-green'?'#e6ffe6':'#ffe6e6'};">
<td><input type="text" value="${k.name}" style="width:100%; font-weight:bold;" onblur="updateKidName(${ti},${ki},this)"></td>
<td style="text-align:center"><input type="checkbox" ${k.needDrive?"checked":""} onclick="toggleKidNeed(${ti},${ki},'drive')"></td>
<td style="text-align:center"><input type="checkbox" ${k.needPickup?"checked":""} onclick="toggleKidNeed(${ti},${ki},'pickup')"></td>
<td style="text-align:center"><input type="checkbox" ${myDriveChecked} onclick="toggleAssignKid(${ti},'${k.name}','drive')" ${!me?.canDrive||driveDisabled?"disabled":""}></td>
<td style="text-align:center"><input type="checkbox" ${myPickupChecked} onclick="toggleAssignKid(${ti},'${k.name}','pickup')" ${!me?.canPickup||pickupDisabled?"disabled":""}></td>
<td style="text-align:center"><button onclick="deleteKid(${ti},${ki})">🗑️</button></td>
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
<td>${d.name}</td><td style="text-align:center">${d.canDrive?"✅":"❌"}</td>
<td style="text-align:center">${d.canPickup?"✅":"❌"}</td>
<td>${driveKids.join(", ")||"—"}</td>
<td>${pickupKids.join(", ")||"—"}</td>
<td style="text-align:center">${d.seats||1}</td></tr>`;
    });
    driversHTML += `</table>`;

    div.innerHTML += `<div class="training" id="training-${ti}" style="background:${bgColor}; padding:10px; margin-bottom:10px;">
<div class="training-header">
<span class="training-time">${t.date} ${t.startTime}-${t.endTime}</span>
<span>
<button onclick="editTrainingInline(${ti})">✏️</button>
<button onclick="deleteTraining(${ti})">🗑️</button>
</span>
</div>
<div>📍 ${t.place}</div>
<div class="sections" style="display:flex; gap:20px;">
<div class="section" style="flex:1"><h3>🚗 Föräldrar</h3>${driversHTML || "Ingen anmäld"}
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
<div class="section" style="flex:1"><h3>⚽ Barn</h3>${kidsHTML}</div>
</div></div>`;
  });

  if(firstTodayIndex!==-1){
    const el = document.getElementById(`training-${firstTodayIndex}`);
    if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  }
}
