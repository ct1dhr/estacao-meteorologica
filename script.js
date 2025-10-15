const channelID = "3118227";
const campos = {
  temperatura: 1,
  humidade: 2,
  pressao: 3,
  iaq: 4,
  chuva: 5,
  vento: 6,
  direcao: 7
};

async function buscarDados(field, label) {
  const url = `https://api.thingspeak.com/channels/${channelID}/fields/${field}.json?results=40`;
  const res = await fetch(url);
  const data = await res.json();
  const labels = data.feeds.map(f => f.created_at.slice(11, 16));
  const valores = data.feeds.map(f => parseFloat(f[`field${field}`]));
  return { labels, valores, label };
}

function desenharGrafico(canvasId, dados, cor) {
  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: dados.labels,
      datasets: [{
        label: dados.label,
        data: dados.valores,
        borderColor: cor,
        backgroundColor: cor + "33",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function converterParaCardinal(graus) {
  const direcoes = [
    "Norte", "Norte-Nordeste", "Nordeste", "Este-Nordeste",
    "Este", "Este-Sudeste", "Sudeste", "Sul-Sudeste",
    "Sul", "Sul-Sudoeste", "Sudoeste", "Oeste-Sudoeste",
    "Oeste", "Oeste-Noroeste", "Noroeste", "Norte-Noroeste"
  ];
  const indice = Math.round(graus / 22.5) % 16;
  return direcoes[indice];
}

async function atualizarDirecaoVento() {
  const url = `https://api.thingspeak.com/channels/${channelID}/fields/${campos.direcao}.json?results=1`;
  const res = await fetch(url);
  const data = await res.json();
  const direcao = parseInt(data.feeds[0][`field${campos.direcao}`]);

  const seta = document.getElementById("arrow");
  seta.style.transform = `rotate(${direcao}deg) translate(-50%, -50%)`;

  const texto = converterParaCardinal(direcao);
  document.getElementById("direcaoTexto").textContent = `Direção do vento: ${texto} (${direcao}°)`;

  document.getElementById("card-direcao").textContent = `🧭 Direção: ${texto}`;
}

async function atualizarCards() {
  const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?results=1`;
  const res = await fetch(url);
  const data = await res.json();
  const feed = data.feeds[0];

  document.getElementById("card-temp").textContent = `🌡️ ${parseFloat(feed.field1).toFixed(1)} °C`;
  document.getElementById("card-hum").textContent = `💧 ${parseFloat(feed.field2).toFixed(1)} %`;
  document.getElementById("card-pres").textContent = `📈 ${parseFloat(feed.field3).toFixed(1)} hPa`;
  document.getElementById("card-iaq").textContent = `🌫️ ${parseFloat(feed.field4).toFixed(1)} IAQ`;
  document.getElementById("card-chuva").textContent = `🌧️ ${parseFloat(feed.field5).toFixed(2)} mm`;
  document.getElementById("card-vento").textContent = `💨 ${parseFloat(feed.field6).toFixed(1)} km/h`;
}

async function iniciar() {
  const temp = await buscarDados(campos.temperatura, "Temperatura (°C)");
  const hum = await buscarDados(campos.humidade, "Humidade (%)");
  const pres = await buscarDados(campos.pressao, "Pressão (hPa)");
  const iaq = await buscarDados(campos.iaq, "Qualidade do Ar (IAQ)");
  const chuva = await buscarDados(campos.chuva, "Chuva (mm)");
  const vento = await buscarDados(campos.vento, "Velocidade do Vento (km/h)");

  desenharGrafico("tempChart", temp, "red");
  desenharGrafico("humChart", hum, "blue");
  desenharGrafico("presChart", pres, "orange");
  desenharGrafico("iaqChart", iaq, "purple");
  desenharGrafico("chuvaChart", chuva, "teal");
  desenharGrafico("ventoChart", vento, "green");

  atualizarDirecaoVento();
  atualizarCards();
  setInterval(() => {
    atualizarDirecaoVento();
    atualizarCards();
  }, 30000);
}

iniciar();

