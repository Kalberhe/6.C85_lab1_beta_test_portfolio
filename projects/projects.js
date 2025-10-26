// projects/projects.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from "../global.js";

// === Card template with placeholder image ===
function cardHTML(p, heading = "h2") {
  const imgTag = p.image
    ? `<img src="${p.image}" alt="${p.title}">`
    : `<div class="placeholder-img">Image coming soon…</div>`;

  const links = Array.isArray(p.links)
    ? p.links.map(l => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join(" ")
    : "";

  return `
    <article class="card">
      <${heading}>${p.title}</${heading}>
      ${imgTag}
      <p>${p.description ?? ""}</p>
      ${links}
      ${p.year ? `<p class="year" aria-label="Project year">${p.year}</p>` : ""}
    </article>
  `;
}

// --- DOM refs ---
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const titleEl = document.querySelector('.projects-title');

// keep title at top if any old CSS reordered things
const mainEl = document.querySelector('main.projects-wrap');
if (mainEl && titleEl && mainEl.firstElementChild !== titleEl) {
  mainEl.prepend(titleEl);
}

// --- Global state (combined filters + hover preview) ---
let allProjects = [];
let query = '';
let selectedYear = null;   // persistent filter via click
let hoveredIndex = -1;     // which slice/legend index is hovered
let hoveredYear = null;    // hover "preview" year (filters live while hovering)

// Colors + generators
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGen = d3.arc().innerRadius(0).outerRadius(50);
const sliceGen = d3.pie().value(d => d.value);

// Helpers
function toYearCounts(projects) {
  const rolled = d3.rollups(projects, v => v.length, d => String(d.year ?? 'Unknown'));
  // sort by year descending (newest first)
  rolled.sort((a, b) => b[0].localeCompare(a[0]));
  return rolled.map(([year, count]) => ({ label: year, value: count }));
}

function clearViz() {
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();
}

function renderList(projects) {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = projects.length
    ? projects.map(p => cardHTML(p, "h3")).join("")
    : `<p class="muted">No projects match your filters.</p>`;
  if (titleEl) titleEl.textContent = `My Projects (${projects.length})`;
}

// class helpers (selected + hovered)
function clsSlice(i, data) {
  const yr = data[i].label;
  const isSel = (selectedYear !== null && yr === selectedYear);
  const isHov = (hoveredIndex === i);
  return `${isSel ? 'selected' : ''} ${isHov ? 'hovered' : ''}`.trim();
}
function clsLegend(i, data) {
  const yr = data[i].label;
  const isSel = (selectedYear !== null && yr === selectedYear);
  const isHov = (hoveredIndex === i);
  return `${isSel ? 'selected' : ''} ${isHov ? 'hovered' : ''}`.trim();
}

function renderPieChart(projects) {
  clearViz();

  const data = toYearCounts(projects);
  if (data.length === 0) return;

  const arcData = sliceGen(data);
  const arcs = arcData.map(d => arcGen(d));

  // --- PIE SLICES ---
  const paths = svg.selectAll('path')
    .data(arcs.map((d, i) => ({ d, i })))
    .enter()
    .append('path')
    .attr('d', d => d.d)
    .attr('fill', d => colors(d.i))
    .attr('class', d => clsSlice(d.i, data))
    // Hover = live preview filter (no click required)
    .on('pointerenter', (_, item) => {
      hoveredIndex = item.i;
      hoveredYear = data[item.i].label;
      syncAndRender(); // re-render cards + pie/legend with hover applied
    })
    .on('pointerleave', () => {
      hoveredIndex = -1;
      hoveredYear = null;
      syncAndRender();
    })
    // Click = persistent selection (works with search; hover still previews)
    .on('click', (_, item) => {
      const y = data[item.i].label;
      selectedYear = (selectedYear === y) ? null : y;
      syncAndRender();
    });

  // --- LEGEND ---
  legend.selectAll('li')
    .data(data.map((d, i) => ({ ...d, i })))
    .enter()
    .append('li')
    .attr('style', d => `--color:${colors(d.i)}`)
    .attr('class', d => clsLegend(d.i, data))
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    // Hover = live preview filter
    .on('pointerenter', (_, d) => {
      hoveredIndex = d.i;
      hoveredYear = d.label;
      syncAndRender();
    })
    .on('pointerleave', () => {
      hoveredIndex = -1;
      hoveredYear = null;
      syncAndRender();
    })
    // Click = persistent selection
    .on('click',  (_, d) => {
      selectedYear = (selectedYear === d.label) ? null : d.label;
      syncAndRender();
    })
    // A11y (keyboard activate)
    .attr('role', 'button')
    .attr('tabindex', '0')
    .on('keydown', (ev, d) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        selectedYear = (selectedYear === d.label) ? null : d.label;
        syncAndRender();
      }
    });
}

// Combined filters (search + hover preview + click selection) — EC fix
function computeFiltered() {
  let filtered = allProjects;

  // Search (case-insensitive across all fields)
  if (query.trim() !== '') {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => {
      const values = Object.values(p).join('\n').toLowerCase();
      return values.includes(q);
    });
  }

  // Year filter: hover preview takes precedence over clicked selection
  const yearToUse = (hoveredYear !== null ? hoveredYear : selectedYear);
  if (yearToUse !== null) {
    filtered = filtered.filter(p => String(p.year ?? 'Unknown') === String(yearToUse));
  }

  return filtered;
}

function syncAndRender() {
  const filtered = computeFiltered();
  renderList(filtered);
  renderPieChart(filtered);
}

// Search event (live)
if (searchInput) {
  searchInput.addEventListener('input', (ev) => {
    query = ev.target.value;
    syncAndRender();
  });
}

// Init
(async function main() {
  const data = await fetchJSON("../lib/projects.json");
  allProjects = Array.isArray(data) ? data : [];
  syncAndRender();
})();
