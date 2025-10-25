// projects/projects.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from "../global.js";

// === Your existing card template (kept) ===
function cardHTML(p, heading = "h2") {
  const links = Array.isArray(p.links)
    ? p.links.map(l => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join(" ")
    : "";
  return `
    <article class="card">
      <${heading}>${p.title}</${heading}>
      <img src="${p.image}" alt="${p.title}">
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
const titleEl = document.querySelector('.projects-title'); // optional

const mainEl = document.querySelector('main.projects-wrap');
if (mainEl && titleEl && mainEl.firstElementChild !== titleEl) {
  mainEl.prepend(titleEl);
}

// --- Global state (supports extra-credit combined filters) ---
let allProjects = [];
let query = '';
let selectedYear = null; // null => no selection

// Colors + generators
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGen = d3.arc().innerRadius(0).outerRadius(50);
const sliceGen = d3.pie().value(d => d.value);

// Helpers
function toYearCounts(projects) {
  const rolled = d3.rollups(projects, v => v.length, d => String(d.year ?? 'Unknown'));
  rolled.sort((a, b) => b[0].localeCompare(a[0])); // newest first
  return rolled.map(([year, count]) => ({ label: year, value: count }));
}

function clearViz() {
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();
}

function renderList(projects) {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = projects.map(p => cardHTML(p, "h3")).join("");
  if (titleEl) titleEl.textContent = `My Projects (${projects.length})`;
}

function renderPieChart(projects) {
  clearViz();
  const data = toYearCounts(projects);
  if (data.length === 0) return;

  const arcData = sliceGen(data);
  const arcs = arcData.map(d => arcGen(d));

  // draw wedges
  const paths = svg.selectAll('path')
    .data(arcs.map((d, i) => ({ d, i })))
    .enter()
    .append('path')
    .attr('d', d => d.d)
    .attr('fill', d => colors(d.i))
    .attr('class', d => (selectedYear !== null && data[d.i].label === selectedYear) ? 'selected' : '');

  // click to select/deselect
  paths.on('click', (_, item) => {
    const year = data[item.i].label;
    selectedYear = (selectedYear === year) ? null : year;
    syncAndRender();
  });

  // legend
  legend.selectAll('li')
    .data(data.map((d, i) => ({ ...d, i })))
    .enter()
    .append('li')
    .attr('style', d => `--color:${colors(d.i)}`)
    .attr('class', d => (selectedYear !== null && d.label === selectedYear) ? 'selected' : '')
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (_, d) => {
      selectedYear = (selectedYear === d.label) ? null : d.label;
      syncAndRender();
    });
}

function computeFiltered() {
  let filtered = allProjects;

  // query filter (case-insensitive across all fields)
  if (query.trim() !== '') {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => {
      const values = Object.values(p).join('\n').toLowerCase();
      return values.includes(q);
    });
  }

  // year filter
  if (selectedYear !== null) {
    filtered = filtered.filter(p => String(p.year ?? 'Unknown') === String(selectedYear));
  }
  return filtered;
}

function syncAndRender() {
  const filtered = computeFiltered();
  renderList(filtered);
  renderPieChart(filtered);
}

// events
if (searchInput) {
  searchInput.addEventListener('input', (ev) => {
    query = ev.target.value;
    syncAndRender();
  });
}

// init
(async function main() {
  const data = await fetchJSON("../lib/projects.json");
  allProjects = Array.isArray(data) ? data : [];
  syncAndRender();
})();
