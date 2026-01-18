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
    drivers: [], // {name, type}
    kids: []     // {name, need}
  });

  save();
  render();
}

function setDriver(i) {
  const type = prompt(
    "Skriv:\nskjutsa\nhämta\nbåda",
    "skjutsa"
  );

  if (!type) return;

  const valid = ["skjutsa", "hämta", "båda"];
  if (!valid.includes(type.toLowerCase())) {
    alert("Skriv: skjutsa, hämta eller båda");
    return;
  }

  trainings[i].drivers = trainings[i].drivers.filter(d => d.name !== user);
  trainings[i].drivers.push({
    name: user,
    type: type.toLowerCase()
  });

  save();
  render();
}

function addKid(i) {
  const name = prompt("Barnets namn:");
  if (!name) return;

  const need = prompt(
    "Behöver barnet:\nskjuts\nhämtning\nbåda",
    "skjuts"
  );

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

function render() {
  const div = document.getElementById("trainings");
  div.innerHTML = "";

  trainings.forEach((t, i) => {
    const driversList = t.drivers
      .map(d => `🚗 ${d.name} (${d.type})`)
      .join("<br>") || "Ingen än";

    const kidsList = t.kids
      .map(k => `⚽ ${k.name} (${k.need})`)
      .join("<br>") || "Inga än";

    const cars = t.drivers.length;
    const kids = t.kids.length;

    div.innerHTML += `
      <div class="training">
        <strong>${t.date} – ${t.time}</strong><br>
        📍 ${t.place}<br><br>

        <strong>🚗 Föräldrar</strong><br>
        ${driversList}<br>
        <button onclick="setDriver(${i})">
          Jag kan skjutsa / hämta
        </button>

        <br><br>
        <strong>⚽ Barn</strong><br>
        ${kidsList}<br>
        <button onclick="addKid(${i})">
          Lägg till barn
        </button>

        <br><br>
        ${
          kids > cars
            ? "❗ Fler barn än bilar"
            : "✅ Tillräckligt med bilar"
        }
      </div>
    `;
  });
}
