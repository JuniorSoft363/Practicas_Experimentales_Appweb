// js/app.js — Orquestador principal
// Importa los módulos y coordina eventos + carga de APIs.

import { fetchCoffee, fetchNASA, fetchPhrase } from './api.js';
import { guardarRegistro, obtenerRegistros, limpiarTodo, guardarUbicacion } from './storage.js';
import {
  toggleSpinner, mostrarError,
  renderCoffee, renderNASA, renderPhrase,
  renderTablaRegistros, clasificarError,
  initMap, renderUbicaciones
} from './ui.js';

// ── Cargar APIs al iniciar ──────────────────────────────────────────────────

async function cargarAPIs() {
  // Coffee
  toggleSpinner('widget-coffee', true);
  try {
    const coffee = await fetchCoffee();
    renderCoffee(coffee);
  } catch (err) {
    const msg = clasificarError(err);
    mostrarError('widget-coffee', msg);
    console.error(err);
  }

  // NASA APOD
  toggleSpinner('widget-nasa', true);
  try {
    const nasa = await fetchNASA();
    renderNASA(nasa);
  } catch (err) {
    const msg = clasificarError(err);
    mostrarError('widget-nasa', msg);
    console.error(err);
  }

  // Frase Positiva
  toggleSpinner('widget-phrase', true);
  try {
    const frase = await fetchPhrase();
    renderPhrase(frase);
  } catch (err) {
    const msg = clasificarError(err);
    mostrarError('widget-phrase', msg);
    console.error(err);
  }
}

// ── Slider nivel — actualizar output en tiempo real ─────────────────────────

function initSlider() {
  const slider = document.getElementById('nivel');
  const output = document.getElementById('nivel-valor');
  if (!slider || !output) return;
  slider.addEventListener('input', () => { output.textContent = slider.value; });
}

// ── Formulario — envío y validación ─────────────────────────────────────────

function validarCampo(input) {
  const descripcion = input.getAttribute('aria-describedby');
  if (!descripcion) return true;

  const errorId = descripcion.split(' ').find(id => id.endsWith('-error'));
  if (!errorId) return true;

  const errorSpan = document.getElementById(errorId);
  if (!errorSpan) return true;

  if (input.validity.valid) {
    errorSpan.textContent = '';
    input.classList.remove('is-invalid');
    input.setAttribute('aria-invalid', 'false');
    return true;
  }

  let mensaje = 'Campo inválido.';

  if (input.validity.valueMissing) {
    mensaje = 'Este campo es obligatorio.';
  } else if (input.validity.tooShort) {
    mensaje = `Debe tener al menos ${input.minLength} caracteres.`;
  } else if (input.validity.tooLong) {
    mensaje = `No puede superar los ${input.maxLength} caracteres.`;
  } else if (input.validity.typeMismatch && input.type === 'email') {
    mensaje = 'Por favor, ingrese un correo electrónico válido.';
  } else if (input.validity.patternMismatch) {
    if (input.id === 'password') {
      mensaje = 'Mínimo 8 caracteres, una mayúscula y un número.';
    } else if (input.id === 'telefono') {
      mensaje = 'El teléfono debe contener entre 7 y 15 números.';
    } else {
      mensaje = 'Formato incorrecto.';
    }
  } else if (input.validity.rangeUnderflow) {
    mensaje = `El valor mínimo es ${input.min}.`;
  } else if (input.validity.rangeOverflow) {
    if (input.id === 'fecha-nacimiento') {
      mensaje = 'Debes ser mayor de edad (nacido antes del 2008-01-01).';
    } else {
      mensaje = `El valor máximo es ${input.max}.`;
    }
  } else {
    mensaje = input.validationMessage;
  }

  errorSpan.textContent = mensaje;
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  return false;
}

function initFormulario() {
  const form = document.getElementById('form-registro');
  if (!form) return;

  const campos = form.querySelectorAll('input, select, textarea');

  // Validación interactiva en tiempo real
  campos.forEach(campo => {
    campo.addEventListener('input', () => {
      validarCampo(campo);
    });
    campo.addEventListener('change', () => {
      validarCampo(campo);
    });
  });

  // Limpiar clases y mensajes de error al resetear
  form.addEventListener('reset', () => {
    campos.forEach(campo => {
      campo.classList.remove('is-invalid');
      campo.setAttribute('aria-invalid', 'false');
      const descripcion = campo.getAttribute('aria-describedby');
      if (descripcion) {
        const errorId = descripcion.split(' ').find(id => id.endsWith('-error'));
        if (errorId) {
          const errorSpan = document.getElementById(errorId);
          if (errorSpan) errorSpan.textContent = '';
        }
      }
    });
    document.getElementById('nivel-valor').textContent = '5';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let formValido = true;
    let primerInvalido = null;

    // Validar todos los campos antes de enviar
    campos.forEach(campo => {
      const valido = validarCampo(campo);
      if (!valido) {
        formValido = false;
        if (!primerInvalido) {
          primerInvalido = campo;
        }
      }
    });

    if (!formValido) {
      if (primerInvalido) {
        primerInvalido.focus();
      }
      return;
    }

    const datos = Object.fromEntries(new FormData(form));
    guardarRegistro(datos);
    renderTablaRegistros(obtenerRegistros());
    form.reset();

    // Anunciar éxito a lectores de pantalla
    const aviso = document.createElement('div');
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    aviso.textContent = 'Registro guardado correctamente.';
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3000);
  });
}

// ── Limpiar todos los registros ─────────────────────────────────────────────

function initBtnLimpiar() {
  const btn = document.getElementById('btn-limpiar-registros');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('¿Eliminar todos los registros?')) {
      renderTablaRegistros(limpiarTodo());
    }
  });
}

// ── Theme Toggle ────────────────────────────────────────────────────────────

function initThemeToggle() {
  const btnTheme = document.getElementById('btn-theme');
  if (!btnTheme) return;

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  btnTheme.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (!theme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// ── Mapa de ubicaciones — guardar y cerrar panel ────────────────────────────

function initMapaEventos() {
  const btnClose = document.getElementById('close-marker-panel');
  const btnSave = document.getElementById('saveMarker');
  const panel = document.getElementById('marked-container');
  const inputName = document.getElementById('markerName');

  if (btnClose && panel) {
    btnClose.addEventListener('click', () => {
      panel.style.display = 'none';
      if (inputName) inputName.value = '';
    });
  }

  if (btnSave && panel) {
    btnSave.addEventListener('click', () => {
      if (!inputName) return;
      const name = inputName.value.trim();
      const lat = document.getElementById('latitude').value;
      const lng = document.getElementById('longitude').value;

      if (!name) {
        alert('Por favor, ingrese un nombre para el área.');
        inputName.focus();
        return;
      }

      const nuevaUbi = { name, lat, lng };
      const actualizadas = guardarUbicacion(nuevaUbi);
      renderUbicaciones(actualizadas);

      panel.style.display = 'none';
      inputName.value = '';
    });
  }
}

// ── Inicio ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  renderTablaRegistros(obtenerRegistros()); // cargar registros previos
  initSlider();
  initFormulario();
  initBtnLimpiar();
  initMap();         // Iniciar mapa interactivo Leaflet
  initMapaEventos();  // Iniciar eventos del panel de marcador
  cargarAPIs();
});

// ── Event Delegation para widgets ───────────────────────────────────────
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'btn-cambiar-nasa') {
    // Generar fecha aleatoria entre 1995-06-16 (fecha inicio APOD) y hoy
    const start = new Date(1995, 5, 16).getTime();
    const end = new Date().getTime();
    const randomDate = new Date(start + Math.random() * (end - start));
    const yyyy = randomDate.getFullYear();
    const mm = String(randomDate.getMonth() + 1).padStart(2, '0');
    const dd = String(randomDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    toggleSpinner('widget-nasa', true);
    try {
      const nasa = await fetchNASA(dateStr);
      renderNASA(nasa);
    } catch (err) {
      const msg = clasificarError(err);
      mostrarError('widget-nasa', msg);
      console.error(err);
    }
  }

  if (e.target && e.target.id === 'btn-cambiar-coffee') {
    toggleSpinner('widget-coffee', true);
    try {
      const coffee = await fetchCoffee();
      renderCoffee(coffee);
    } catch (err) {
      mostrarError('widget-coffee', `No se pudo cargar el café: ${err.message}`);
    }
  }
});
