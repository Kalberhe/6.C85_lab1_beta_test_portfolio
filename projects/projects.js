// projects/projects.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from "../global.js";

/* ---------- Card template (with placeholder image) ---------- */
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

/* ---------- DOM refs ---------- */
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const titleEl = document.querySelector('.projects-title');

/* ---------- Global state ---------- */
let allProjects = [];
let query = '';
let selectedYear = null;   // persistent via click
let hoveredIndex = -1;     // index of hovered slice/legend item
let hoveredYear = null;    // year to preview on hover
let lastPieData = [];      // current pie's [{label, value}] for class updates

/* ---------- D3 generators ---------- */
const colors  = d3.scaleOrdinal(d3.schemeTableau10);
const arcGen  = d3.arc().innerRadius(0).outerRadius(50);
const sliceGen = d3.pie().value(d => d.value);

/* ---------- Helpers ---------- */
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
  projectsContainer.innerHTML = projects.length
    ? projects.map(p => cardHTML(p, "h3")).join("")
    : `<p class="muted">No projects match your filters.</p>`;
  if (titleEl) titleEl.textContent = `My Projects (${projects.length})`;
}

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

/* Update classes only (don’t rebuild DOM) */
function updateHoverClasses() {
  svg.selectAll('path')
    .attr('class', function () {
      const bound = d3.select(this).datum(); // { d, i }
      return clsSlice(bound.i, lastPieData);
    });

  legend.selectAll('li')
    .attr('class', function () {
      const d = d3.select(this).datum(); // { label, value, i }
      return clsLegend(d.i, lastPieData);
    });
}

/* Render pie & legend from persistent dataset (search + selectedYear) */
function renderPieChart(projectsForPie) {
  clearViz();

  lastPieData = toYearCounts(projectsForPie);
  if (lastPieData.length === 0) return;

  const arcData = sliceGen(lastPieData);
  const arcs = arcData.map(d => arcGen(d));

  // PIE
  svg.selectAll('path')
    .data(arcs.map((d, i) => ({ d, i })))
    .enter().append('path')
    .attr('d', d => d.d)
    .attr('fill', d => colors(d.i))
    .attr('class', d => clsSlice(d.i, lastPieData))
    .on('pointerenter', (_, item) => {
      hoveredIndex = item.i;
      hoveredYear  = lastPieData[item.i].label;
      renderList(computeFilteredCards());   // update cards only
      updateHoverClasses();                 // just update classes
    })
    .on('pointerleave', () => {
      hoveredIndex = -1;
      hoveredYear  = null;
      renderList(computeFilteredCards());
      updateHoverClasses();
    })
    .on('click', (_, item) => {
      const y = lastPieData[item.i].label;
      selectedYear = (selectedYear === y) ? null : y;
      syncAndRender(true);                  // persistent change → rebuild pie
    });

  // LEGEND
  legend.selectAll('li')
    .data(lastPieData.map((d, i) => ({ ...d, i })))
    .enter().append('li')
    .attr('style', d => `--color:${colors(d.i)}`)
    .attr('class', d => clsLegend(d.i, lastPieData))
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('pointerenter', (_, d) => {
      hoveredIndex = d.i;
      hoveredYear  = d.label;
      renderList(computeFilteredCards());
      updateHoverClasses();
    })
    .on('pointerleave', () => {
      hoveredIndex = -1;
      hoveredYear  = null;
      renderList(computeFilteredCards());
      updateHoverClasses();
    })
    .on('click', (_, d) => {
      selectedYear = (selectedYear === d.label) ? null : d.label;
      syncAndRender(true);
    })
    .attr('role', 'button')
    .attr('tabindex', '0')
    .on('keydown', (ev, d) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        selectedYear = (selectedYear === d.label) ? null : d.label;
        syncAndRender(true);
      }
    });
}

/* --------- Combined filters ---------- */
/* Cards use: search + (hoveredYear ?? selectedYear)  */
function computeFilteredCards() {
  let filtered = allProjects;

  if (query.trim() !== '') {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => {
      const values = Object.values(p).join('\n').toLowerCase();
      return values.includes(q);
    });
  }

  const yearToUse = (hoveredYear !== null ? hoveredYear : selectedYear);
  if (yearToUse !== null) {
    filtered = filtered.filter(p => String(p.year ?? 'Unknown') === String(yearToUse));
  }

  return filtered;
}

/* Pie uses: search + selectedYear (NO hover) → stable DOM so pointerleave fires */
function computeProjectsForPie() {
  let filtered = allProjects;

  if (query.trim() !== '') {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => {
      const values = Object.values(p).join('\n').toLowerCase();
      return values.includes(q);
    });
  }

  if (selectedYear !== null) {
    filtered = filtered.filter(p => String(p.year ?? 'Unknown') === String(selectedYear));
  }

  return filtered;
}

/* ---------- Sync + render ---------- */
function syncAndRender(rebuildPie = true) {
  // Always refresh cards for current hover/selection/search
  renderList(computeFilteredCards());

  // Only rebuild pie for persistent changes (search or click), not hover
  if (rebuildPie) {
    renderPieChart(computeProjectsForPie());
  } else {
    updateHoverClasses();
  }
}

/* ---------- Events ---------- */
if (searchInput) {
  searchInput.addEventListener('input', (ev) => {
    query = ev.target.value;
    syncAndRender(true);  // persistent change
  });
}

/* ---------- Init ---------- */
(async function main() {
  const data = await fetchJSON("../lib/projects.json");
  allProjects = Array.isArray(data) ? data : [];

  // 🔹 Add your Bikewatching project here
  const bikewatchingProject = {
    title: "Bikewatching",
    year: 2025, // adjust if you want a different year bucket
    image: "assets/bikewatching-thumb.png", // or remove/NULL to use placeholder
    description:
      "Interactive map of Boston-area bike lanes and BlueBike station traffic built with Mapbox GL JS and D3.",
    links: [
      {
        href: "https://kalberhe.github.io/bikewatching/",
        label: "Live demo",
      },
      {
        href: "https://github.com/Kalberhe/bikewatching",
        label: "Source code",
      },
    ],
  };

  allProjects.push(bikewatchingProject);

  syncAndRender(true);
})();
