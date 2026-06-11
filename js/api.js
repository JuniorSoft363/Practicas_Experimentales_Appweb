export class HttpError extends Error {
  constructor(status, statusText, servicio) {
    super(`${servicio}: ${status} ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.servicio = servicio;
  }
}

const NASA_KEY    = 'omVTC25hm9VTfRxuTninsIHPzybF0Xoqr2itqQJN';          // o 'DEMO_KEY' para pruebas
const GOOGLE_WEATHER_KEY = 'AQ.Ab8RN6IqkgRCz0u6czfrE9IrnTuOatPHObihf23Lm1s54_OhAw';
const LAT = -2.1894;
const LON = -79.8891;


export async function fetchCoffee() {

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ file: `https://coffee.alexflipnote.dev/random?t=${Date.now()}` });
    }, 500);
  });
}


export async function fetchNASA(date = null) {
  let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`;
  if (date) {
    url += `&date=${date}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, 'NASA APOD');
  }
  const data = await res.json();
  if (data && data.url) {
    data.url = data.url.replace('http://', 'https://');
  }
  return data;
}


export async function fetchPhrase() {
  const url = `https://www.positive-api.online/phrase/esp`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, 'Frase Positiva');
  }
  return res.json();
}
