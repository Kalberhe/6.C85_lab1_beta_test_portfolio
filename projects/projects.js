// projects/projects.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from "../global.js";

/* ---------- Card template ---------- */
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
      <div class="links">${links}</div>
      ${p.year ? `<p class="year" style="font-size:0.85em; margin-top:0.5em;">${p.year}</p>` : ""}
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
let selectedYear = null; 

/* ---------- D3 Configuration ---------- */
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGen = d3.arc().innerRadius(0).outerRadius(50);
const sliceGen = d3.pie().value(d => d.value);

function renderPieChart(projects) {
  // 1. Calculate data
  const rolled = d3.rollups(projects, v => v.length, d => String(d.year ?? 'Unknown'));
  const data = rolled.map(([year, count]) => ({ label: year, value: count }))
                     .sort((a, b) => b.label.localeCompare(a.label));

  const arcData = sliceGen(data);
  const arcs = svg.selectAll('path').data(arcData, d => d.data.label);

  // 2. Animate Exits (Old slices fade out)
  arcs.exit()
    .transition().duration(500)
    .attrTween('d', function(d) {
      const i = d3.interpolate(d.startAngle, d.endAngle);
      return t => { d.startAngle = i(t); return arcGen(d); };
    })
    .remove();

  // 3. Animate Updates (Existing slices resize)
  arcs.transition().duration(500)
    .attrTween('d', function(d) {
      const i = d3.interpolate(this._current || d, d);
      this._current = i(0);
      return t => arcGen(i(t));
    });

  // 4. Animate Entries (New slices grow in)
  arcs.enter().append('path')
    .attr('fill', (d, i) => colors(i))
    .attr('class', d => d.data.label === selectedYear ? 'selected' : '')
    .each(function(d) { this._current = d; }) // Store initial angles
    .transition().duration(500)
    .attrTween('d', function(d) {
      const i = d3.interpolate(d.startAngle, d.endAngle);
      return t => { d.endAngle = d.startAngle + i(t); return arcGen(d); }; // Grow effect
    });

  // 5. Re-attach events to all paths (new and old)
  svg.selectAll('path')
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      
      // Update styling without full re-render
      svg.selectAll('path').attr('class', p => p.data.label === selectedYear ? 'selected' : '');
      legend.selectAll('li').attr('class', p => p.label === selectedYear ? 'selected' : '');
      
      renderList(allProjects); // Filter cards
    });

  // 6. Render Legend
  const legItems = legend.selectAll('li').data(data, d => d.label);
  
  legItems.exit().remove();
  
  const newLeg = legItems.enter().append('li')
    .attr('class', d => d.label === selectedYear ? 'selected' : '')
    .on('click', (_, d) => {
      selectedYear = selectedYear === d.label ? null : d.label;
      svg.selectAll('path').attr('class', p => p.data.label === selectedYear ? 'selected' : '');
      legend.selectAll('li').attr('class', p => p.label === selectedYear ? 'selected' : '');
      renderList(allProjects);
    });

  newLeg.append('span')
    .className('swatch')
    .style('background-color', (d, i) => colors(i));
    
  newLeg.append('span')
    .className('text') // Placeholder for text, filled below
    
  // Update text for all legend items
  legend.selectAll('li').select('span.swatch').style('background-color', (d, i) => colors(i));
  legend.selectAll('li').each(function(d) {
    const el = d3.select(this);
    if(el.select('.label-text').empty()) el.append('span').attr('class', 'label-text');
    el.select('.label-text').html(` ${d.label} <em>(${d.value})</em>`);
  });
}

function renderList(projects) {
  // Filter Logic
  let filtered = projects;
  
  // 1. Apply Search
  if (query) {
    filtered = filtered.filter(p => Object.values(p).join(' ').toLowerCase().includes(query.toLowerCase()));
  }

  // 2. Apply Year Filter
  if (selectedYear) {
    filtered = filtered.filter(p => String(p.year) === selectedYear);
  }

  // Render
  projectsContainer.innerHTML = filtered.length
    ? filtered.map(p => cardHTML(p, "h3")).join("")
    : `<p class="muted">No projects found.</p>`;
    
  if (titleEl) titleEl.textContent = `My Projects (${filtered.length})`;
}

// Init
(async function main() {
  const data = await fetchJSON("../lib/projects.json");
  allProjects = Array.isArray(data) ? data : [];
  
  // Add manual project example
  allProjects.push({
    title: "Bikewatching",
    year: 2025,
    image: "https://via.placeholder.com/300x200?text=Map+Demo", // Placeholder
    description: "Interactive map of Boston-area bike lanes and BlueBike station traffic.",
    links: [{ href: "https://github.com/Kalberhe/bikewatching", label: "View Code" }]
  });

  renderPieChart(allProjects);
  renderList(allProjects);
  
  // Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      query = e.target.value;
      renderList(allProjects);
    });
  }
})();