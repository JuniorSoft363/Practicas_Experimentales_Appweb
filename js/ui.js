import { eliminarRegistro, obtenerUbicaciones } from './storage.js';
import { HttpError } from './api.js';

/**
 * Clasifica un error de petición HTTP distinguiendo fallos de red (TypeError)
 * de respuestas de error de servidor (HttpError con código 4xx/5xx).
 * @param {Error} err - Objeto de error capturado.
 * @returns {string} Mensaje accesible para el usuario.
 */
export function clasificarError(err) {
  if (err.name === 'HttpError' || err instanceof HttpError) {
    const status = err.status;
    if (status >= 400 && status < 500) {
      return `Error de Solicitud (${status}): No se pudo obtener la información (Ej. recurso no encontrado o sin autorización).`;
    } else if (status >= 500) {
      return `Error de Servidor (${status}): El servidor de la API experimenta problemas. Intente más tarde.`;
    }
    return `Error HTTP (${status}): ${err.statusText}`;
  }
  if (err instanceof TypeError) {
    return 'Fallo de Red: No se pudo conectar al servidor. Verifique su conexión de red o restricciones CORS.';
  }
  return `Error inesperado: ${err.message}`;
}

// ── Utilidades de UI ────────────────────────────────────────────────────────

/** Muestra u oculta el spinner de carga dentro de un contenedor. */
export function toggleSpinner(contenedorId, mostrar) {
  const targetId = document.getElementById(`${contenedorId}-content`) ? `${contenedorId}-content` : contenedorId;
  const el = document.getElementById(targetId);
  if (!el) return;
  if (mostrar) {
    el.innerHTML = '<div class="spinner" role="status" aria-label="Cargando..."></div>';
  }
}

/** Muestra un mensaje de error accesible dentro de un contenedor. */
export function mostrarError(contenedorId, mensaje) {
  const targetId = document.getElementById(`${contenedorId}-content`) ? `${contenedorId}-content` : contenedorId;
  const el = document.getElementById(targetId);
  if (!el) return;
  if (contenedorId === 'widget-nasa') {
    const btnHTML = `<button id="btn-cambiar-nasa" style="display: block; margin: 0 auto var(--spacing-sm); padding: 0.3rem 0.8rem; font-size: 0.9rem;">Cambiar</button>`;
    el.innerHTML = `
      ${btnHTML}
      <p class="error-msg" role="alert" style="margin-top:var(--spacing-md); text-align:center;">⚠ ${mensaje}</p>
    `;
    return;
  }
  if (contenedorId === 'widget-coffee') {
    const btnHTML = `<button id="btn-cambiar-coffee" style="display: block; margin: 0 auto var(--spacing-sm); padding: 0.3rem 0.8rem; font-size: 0.9rem;">Cambiar</button>`;
    el.innerHTML = `
      ${btnHTML}
      <p class="error-msg" role="alert" style="margin-top:var(--spacing-md); text-align:center;">⚠ ${mensaje}</p>
    `;
    return;
  }
  el.innerHTML = `<p class="error-msg" role="alert">⚠ ${mensaje}</p>`;
}

// ── Renderizado de APIs ─────────────────────────────────────────────────────

/** Renderiza la imagen de café en #widget-coffee */
export function renderCoffee(datos) {
  const el = document.getElementById('widget-coffee-content') || document.getElementById('widget-coffee');
  if (!el) return;
  const btnHTML = `<button id="btn-cambiar-coffee" style="display: block; margin: 0 auto var(--spacing-sm); padding: 0.3rem 0.8rem; font-size: 0.9rem;">Cambiar</button>`;
  el.innerHTML = `
    ${btnHTML}
    <img src="${datos.file}" alt="Taza de café" style="width:100%;height:300px;object-fit:cover;border-radius:var(--radius-md);margin-top:var(--spacing-xs);" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400/1e1e1e/ffffff?text=Imagen+No+Disponible';" />
  `;
}

/** Renderiza la imagen NASA APOD en #widget-nasa */
export function renderNASA(datos) {
  const el = document.getElementById('widget-nasa-content') || document.getElementById('widget-nasa');
  if (!el) return;
  const btnHTML = `<button id="btn-cambiar-nasa" style="display: block; margin: 0 auto var(--spacing-sm); padding: 0.3rem 0.8rem; font-size: 0.9rem;">Cambiar</button>`;
  if (datos.media_type === 'image') {
    el.innerHTML = `
      ${btnHTML}
      <img src="${datos.url}" alt="${datos.title}" style="width:100%;border-radius:var(--radius-md);margin-top:var(--spacing-xs);" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400/1e1e1e/ffffff?text=Imagen+No+Disponible';" />
      <p style="margin-top:var(--spacing-xs);">${datos.explanation.slice(0, 200)}…</p>
    `;
  } else {
    el.innerHTML = `
      ${btnHTML}
      <p style="margin-top:var(--spacing-xs);">Hoy el contenido es un video. <a href="${datos.url}" target="_blank" rel="noopener">Ver en NASA</a></p>`;
  }
}

/** Renderiza la frase positiva en #widget-phrase */
export function renderPhrase(datos) {
  const el = document.getElementById('widget-phrase-content') || document.getElementById('widget-phrase');
  if (!el) return;
  const fraseTexto = typeof datos === 'string' ? datos : (datos.phrase || datos.text || datos.mensaje || JSON.stringify(datos));
  el.innerHTML = `
    <blockquote style="font-style: italic; border-left: 4px solid var(--color-primary); padding-left: var(--spacing-sm); margin-top: var(--spacing-md);">
      "${fraseTexto}"
    </blockquote>
  `;
}

// ── Gestión del Modal Accesible (Focus Trap) ────────────────────────────────

let registroAEliminarId = null;
let botonDisparador = null;
let releaseTrap = null;
let modalInitialized = false;

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

export function trapFocus(modal) {
  const els = Array.from(modal.querySelectorAll(FOCUSABLE));
  if (els.length === 0) return () => {};
  const first = els[0], last = els[els.length - 1];
  first.focus();

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault(); last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }
  function handleEscape(e) {
    if (e.key === 'Escape') {
      modal.dispatchEvent(new CustomEvent('modal:close'));
    }
  }
  modal.addEventListener('keydown', handleKeyDown);
  modal.addEventListener('keydown', handleEscape);
  return () => {
    modal.removeEventListener('keydown', handleKeyDown);
    modal.removeEventListener('keydown', handleEscape);
  };
}

export function abrirModal(modal, activador) {
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-modal', 'true');
  releaseTrap = trapFocus(modal);
}

export function cerrarModal(modal, activador) {
  if (releaseTrap) {
    releaseTrap();
    releaseTrap = null;
  }
  modal.setAttribute('hidden', '');
  if (activador && document.body.contains(activador)) {
    activador.focus();
  } else {
    const tabla = document.getElementById('tabla-registros');
    if (tabla) {
      tabla.focus();
    }
  }
}

function ocultarModalEliminar() {
  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    cerrarModal(modal, botonDisparador);
  }
}

function initModalListeners() {
  if (modalInitialized) return;
  modalInitialized = true;

  const btnConfirmar = document.getElementById('modal-btn-confirmar');
  const btnCancelar = document.getElementById('modal-btn-cancelar');
  const modal = document.getElementById('modal-confirmacion');

  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', () => {
      if (registroAEliminarId !== null) {
        const actualizados = eliminarRegistro(registroAEliminarId);
        renderTablaRegistros(actualizados);
      }
      ocultarModalEliminar();
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', ocultarModalEliminar);
  }

  if (modal) {
    modal.addEventListener('modal:close', ocultarModalEliminar);
  }
}

window.eliminar = (id) => {
  registroAEliminarId = id;
  botonDisparador = document.activeElement;

  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    abrirModal(modal, botonDisparador);
  }
};

// ── Tabla de registros ──────────────────────────────────────────────────────

/** Renderiza la tabla de registros. */
export function renderTablaRegistros(registros) {
  const tbody   = document.getElementById('tbody-registros');
  const vacio   = document.getElementById('estado-vacio');
  const contador = document.getElementById('contador-registros');

  contador.textContent = `${registros.length} registro${registros.length !== 1 ? 's' : ''}`;

  if (registros.length === 0) {
    tbody.innerHTML = '';
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;
  tbody.innerHTML = registros.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.nombre ?? '—'}</td>
      <td>${r.email ?? '—'}</td>
      <td>${r.telefono ?? '—'}</td>
      <td>${r.fecha_nacimiento ?? '—'}</td>
      <td>${r.provincia ?? '—'}</td>
      <td>${r.nivel ?? '—'}</td>
      <td>
        <button onclick="eliminar(${r.id})"
                aria-label="Eliminar registro de ${r.nombre}">
          🗑
        </button>
      </td>
    </tr>
  `).join('');

  // Asegurar que los listeners del modal estén registrados
  initModalListeners();
}

// ── Leaflet Map Integración ──────────────────────────────────────────────────
let map = null;
let currentCoords = null;
let leafletMarkers = [];

export function renderUbicaciones(ubicaciones) {
  const list = document.getElementById('markedLocations');
  if (!list) return;

  // Limpiar marcadores antiguos del mapa
  if (map) {
    leafletMarkers.forEach(m => map.removeLayer(m));
  }
  leafletMarkers = [];

  list.innerHTML = '';

  if (ubicaciones.length === 0) {
    list.innerHTML = '<li class="estado-vacio" style="text-align: center; width: 100%;">No hay ubicaciones registradas. Haz clic en el mapa para añadir una.</li>';
    return;
  }

  ubicaciones.forEach((ubicacion) => {
    const li = document.createElement('li');
    li.className = 'marked-location-item';

    li.innerHTML = `
      <span>📍 ${ubicacion.name}</span>
      <button class="btn-ver-ubicacion" data-lat="${ubicacion.lat}" data-lng="${ubicacion.lng}">Ver</button>
    `;
    list.appendChild(li);

    if (map) {
      const m = L.marker([ubicacion.lat, ubicacion.lng])
        .addTo(map)
        .bindPopup(`<b>${ubicacion.name}</b><br>Lat: ${parseFloat(ubicacion.lat).toFixed(4)} | Lng: ${parseFloat(ubicacion.lng).toFixed(4)}`);
      leafletMarkers.push(m);
    }
  });

  const botones = list.querySelectorAll('.btn-ver-ubicacion');
  botones.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lat = parseFloat(e.target.getAttribute('data-lat'));
      const lng = parseFloat(e.target.getAttribute('data-lng'));
      if (map) {
        map.panTo(new L.LatLng(lat, lng));
        leafletMarkers.forEach(m => {
          const latLng = m.getLatLng();
          if (Math.abs(latLng.lat - lat) < 0.00001 && Math.abs(latLng.lng - lng) < 0.00001) {
            m.openPopup();
          }
        });
      }
    });
  });
}

export function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Centro inicial en el Campus de la UTEQ en Quevedo (-1.0125, -79.4696)
  map = L.map('map').setView([-1.0125, -79.4696], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const ubicaciones = obtenerUbicaciones();
  renderUbicaciones(ubicaciones);

  map.on('click', (e) => {
    currentCoords = e.latlng;
    const panel = document.getElementById('marked-container');
    if (panel) {
      panel.style.display = 'block';
      document.getElementById('latitude').value = currentCoords.lat.toFixed(6);
      document.getElementById('longitude').value = currentCoords.lng.toFixed(6);
      document.getElementById('markerName').value = '';
      document.getElementById('markerName').focus();
    }
  });
}


