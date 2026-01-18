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

function toggleDriver(i) {
  const list = trainings[i].drivers;
  if (list.includes(user)) {
    trainings[i].drivers = list.filter(n => n !== user);
  } else {
    list.push(user);
  }
  save();
  render();
}

function toggleKid(i) {
  const list = trainings[i].kids;
  if (list.includes(user)) {
    trainings[i].kids = list.filter(n => n !== user);
  } else {
    list.push(user);
  }
  save();
  render();
}

function render() {
  const div = document.getElementById("trainings");
  div.innerHTML = "";

  trainings.forEach((t, i) => {
    const cars = t.drivers.length;
    const kids = t.kids.length;

    div.innerHTML += `
      <div class="training">
        <strong>${t.date} – ${t.time}</strong><br>
        📍 ${t.place}<br><br>

        🚗 Skjutsar (${cars}):<br>
        ${t.drivers.join(", ") || "Ingen än"}<br>
        <button onclick="toggleDriver(${i})">Jag kan skjutsa/hämta</button>

        <br><br>
        ⚽ Behöver skjuts (${kids}):<br>
        ${t.kids.join(", ") || "Ingen än"}<br>
        <button onclick="toggleKid(${i})">Mitt barn behöver skjuts</button>

        <br><br>
        ${kids > cars ? "❗ Fler barn än bilar!" : "✅ Tillräckligt med bilar"}
      </div>
    `;
  });
}
