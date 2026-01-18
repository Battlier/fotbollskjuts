let user = "";
let trainings = JSON.parse(localStorage.getItem("trainings")) || [];

function save() {
  localStorage.setItem("trainings", JSON.stringify(trainings));
}

function login() {
  const name = document.getElementById("username").value;
  if (!name) return alert("Skriv ditt namn");
  user = name;
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  render();
}

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
    drivers: [], 
    kids: []     
  });

  save();
  render();
}

// ------------------ BARN ------------------

function addKid(i) {
  const name = prompt("Barnets namn:");
  if (!name) return;

  const need = prompt("Behöver barnet:\nskjuts\nhämtning\nbåda", "båda");
  const valid = ["skjuts", "hämtning", "båda"];

  if (!valid.includes(need.toLowerCase())) {
    alert("Skriv: skjuts, hämtning eller båda");
    return;
  }

  trainings[i].kids.push({
    name,
    need: need.toLowerCase()
  });

  save();
  render();
}

// ------------------ FÖRÄLDRAR ------------------

function getDriver(i) {
  let d = trainings[i].drivers.find(x => x.name === user);
  if (!d) {
    d = { name: user, drive: [], pickup: [] };
    trainings[i].drivers.push(d);
  }
  return d;
}

function toggleDrive(i, kidName) {
  const d = getDriver(i);
  if (d.drive.includes(kidName)) {
    d.drive = d.drive.filter(k => k !== kidName);
  } else {
    d.drive.push(kidName);
  }
  save();
  render();
}

function togglePickup(i, kidName) {
  const d = getDriver(i);
  if (d.pickup.includes(kidName)) {
    d.pickup = d.pickup.filter(k => k !== kidName);
  } else {
    d.pickup.push(kidName);
  }
  save();
  render();
}

// ------------------ VISNING ------------------

function render() {
  const div = document.getElementById("trainings");
  div.innerHTML = "";

  trainings.forEach((t, i) => {
    let driversHTML = "";
    t.drivers.forEach(d => {
      driversHTML += `
        🚗 <strong>${d.name}</strong><br>
        Skjutsar: ${d.drive.join(", ") || "—"}<br>
        Hämtar: ${d.pickup.join(", ") || "—"}<br><br>
      `;
    });

    let kidsHTML = "";
    t.kids.forEach(k => {
      const d = t.drivers.find(x => x.name === user) || { drive: [], pickup: [] };
      const driveChecked = d.drive.includes(k.name) ? "checked" : "";
      const pickupChecked = d.pickup.includes(k.name) ? "checked" : "";

      kidsHTML += `
        ⚽ ${k.name} (${k.need})<br>
        <label>
          <input type="checkbox" ${driveChecked}
            onclick="toggleDrive(${i}, '${k.name}')">
          Skjutsa
        </label>
        <label>
          <input type="checkbox" ${pickupChecked}
            onclick="togglePickup(${i}, '${k.name}')">
          Hämta
        </label>
        <br><br>
      `;
    });

    div.innerHTML += `
      <div class="training">
        <strong>${t.date} – ${t.time}</strong><br>
        📍 ${t.place}<br><br>

        <strong>🚗 Föräldrar & deras barn</strong><br>
        ${driversHTML || "Ingen har anmält sig än"}<br>

        <strong>⚽ Barn (klicka för att välja vilka du kör)</strong><br>
        ${kidsHTML || "Inga barn inlagda än"}<br>

        <button onclick="addKid(${i})">Lägg till barn</button>
      </div>
    `;
  });
}
