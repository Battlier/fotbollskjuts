let user = "";
let trainings = JSON.parse(localStorage.getItem("trainings")) || [];

function save() {
  localStorage.setItem("trainings", JSON.stringify(trainings));
}

function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Skriv ditt namn");
  user = name;
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  render();
}

// ---------------- TRÄNING ----------------

function addTraining() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const place = document.getElementById("place").value;

  if (!date || !time || !place) {
    alert("Fyll i alla fält");
    return;
  }

  trainings.push({
    date,
    time,
    place,
    drivers: [], // {name, canDrive, canPickup, driveKids[], pickupKids[]}
    kids: []     // {name, needDrive, needPickup}
  });

  save();
  render();
}

function editTraining(i) {
  const t = trainings[i];
  const date = prompt("Datum:", t.date);
  const time = prompt("Tid:", t.time);
  const place = prompt("Plats:", t.place);

  if (!date || !time || !place) return;

  t.date = date;
  t.time = time;
  t.place = place;
  save();
  render();
}

function deleteTraining(i) {
  if (!confirm("Ta bort denna träning?")) return;
  trainings.splice(i, 1);
  save();
  render();
}

// ---------------- BARN ----------------

function addKid(i) {
  const name = prompt("Barnets namn:");
  if (!name) return;

  trainings[i].kids.push({
    name,
    needDrive: true,
    needPickup: true
  });

  save();
  render();
}

function editKid(ti, ki) {
  const kid = trainings[ti].kids[ki];
  const name = prompt("Barnets namn:", kid.name);
  if (!name) return;

  kid.name = name;
  save();
  render();
}

function deleteKid(ti, ki) {
  if (!confirm("Ta bort detta barn?")) return;

  const kidName = trainings[ti].kids[ki].name;

  trainings[ti].drivers.forEach(d => {
    d.driveKids = d.driveKids.filter(k => k !== kidName);
    d.pickupKids = d.pickupKids.filter(k => k !== kidName);
  });

  trainings[ti].kids.splice(ki, 1);
  save();
  render();
}

function toggleKidNeed(ti, ki, type) {
  const kid = trainings[ti].kids[ki];
  if (type === "drive") kid.needDrive = !kid.needDrive;
  if (type === "pickup") kid.needPickup = !kid.needPickup;
  save();
  render();
}

// ---------------- FÖRÄLDER ----------------

function getDriver(ti) {
  let d = trainings[ti].drivers.find(x => x.name === user);
  if (!d) {
    d = {
      name: user,
      canDrive: false,
      canPickup: false,
      driveKids: [],
      pickupKids: []
    };
    trainings[ti].drivers.push(d);
  }
  return d;
}

function toggleDriverAbility(ti, type) {
  const d = getDriver(ti);

  if (type === "drive") d.canDrive = !d.canDrive;
  if (type === "pickup") d.canPickup = !d.canPickup;

  if (!d.canDrive) d.driveKids = [];
  if (!d.canPickup) d.pickupKids = [];

  save();
  render();
}

function toggleAssignKid(ti, kidName, type) {
  const d = getDriver(ti);
  let list = type === "drive" ? d.driveKids : d.pickupKids;

  if (list.includes(kidName)) {
    list = list.filter(k => k !== kidName);
  } else {
    list.push(kidName);
  }

  if (type === "drive") d.driveKids = list;
  else d.pickupKids = list;

  save();
  render();
}

function removeDriver(ti) {
  if (!confirm("Ta bort din anmälan?")) return;
  trainings[ti].drivers = trainings[ti].drivers.filter(d => d.name !== user);
  save();
  render();
}

// ---------------- VISNING ----------------

function render() {
  const div = document.getElementById("trainings");
  div.innerHTML = "";

  trainings.forEach((t, ti) => {
    const me = t.drivers.find(d => d.name === user);

    let driversHTML = "";
    t.drivers.forEach(d => {
      driversHTML += `
        🚗 <strong>${d.name}</strong><br>
        Kan skjutsa: ${d.canDrive ? "✅" : "❌"} |
        Kan hämta: ${d.canPickup ? "✅" : "❌"}<br>
        Skjutsar: ${d.driveKids.join(", ") || "—"}<br>
        Hämtar: ${d.pickupKids.join(", ") || "—"}<br><br>
      `;
    });

    let kidsHTML = "";
    t.kids.forEach((k, ki) => {
      const driveChecked = k.needDrive ? "checked" : "";
      const pickupChecked = k.needPickup ? "checked" : "";

      const myDriveChecked = me?.driveKids.includes(k.name) ? "checked" : "";
      const myPickupChecked = me?.pickupKids.includes(k.name) ? "checked" : "";

      kidsHTML += `
        ⚽ <strong>${k.name}</strong><br>
        Behöver:
        <label>
          <input type="checkbox" ${driveChecked}
            onclick="toggleKidNeed(${ti}, ${ki}, 'drive')">
          Skjuts
        </label>
        <label>
          <input type="checkbox" ${pickupChecked}
            onclick="toggleKidNeed(${ti}, ${ki}, 'pickup')">
          Hämtning
        </label>
        <br>

        Du:
        <label>
          <input type="checkbox" ${myDriveChecked}
            onclick="toggleAssignKid(${ti}, '${k.name}', 'drive')"
            ${!me?.canDrive ? "disabled" : ""}>
          Skjutsa
        </label>
        <label>
          <input type="checkbox" ${myPickupChecked}
            onclick="toggleAssignKid(${ti}, '${k.name}', 'pickup')"
            ${!me?.canPickup ? "disabled" : ""}>
          Hämta
        </label>

        <br>
        <button onclick="editKid(${ti}, ${ki})">✏️</button>
        <button onclick="deleteKid(${ti}, ${ki})">🗑️</button>
        <br><br>
      `;
    });

    div.innerHTML += `
      <div class="training">
        <strong>${t.date} – ${t.time}</strong><br>
        📍 ${t.place}<br><br>

        <button onclick="editTraining(${ti})">✏️ Redigera träning</button>
        <button onclick="deleteTraining(${ti})">🗑️ Ta bort träning</button>

        <br><br>
        <strong>🚗 Din tillgänglighet</strong><br>
        <label>
          <input type="checkbox" ${me?.canDrive ? "checked" : ""}
            onclick="toggleDriverAbility(${ti}, 'drive')">
          Jag kan skjutsa
        </label>
        <label>
          <input type="checkbox" ${me?.canPickup ? "checked" : ""}
            onclick="toggleDriverAbility(${ti}, 'pickup')">
          Jag kan hämta
        </label>

        <br>
        ${me ? `<button onclick="removeDriver(${ti})">🗑️ Ta bort mig</button>` : ""}
        <br><br>

        <strong>🚗 Alla föräldrar</strong><br>
        ${driversHTML || "Ingen anmäld än"}<br>

        <strong>⚽ Barn</strong><br>
        ${kidsHTML || "Inga barn inlagda än"}<br>

        <button onclick="addKid(${ti})">➕ Lägg till barn</button>
      </div>
    `;
  });
}
