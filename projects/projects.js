import { fetchJSON } from "../global.js";

async function init() {
  const projects = await fetchJSON("../lib/projects.json");
  const container = document.getElementById("projects-list");
  const input = document.querySelector(".search-bar");
  
  let query = "";

  function render(data) {
    if (!container) return;
    
    if (data.length === 0) {
      container.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:white; font-size:1.2rem;">No projects found matching that!</p>`;
      return;
    }

    container.innerHTML = data.map(p => `
      <article class="card">
        <h3>${p.title}</h3>
        <div class="meta">${p.year}</div>
        ${p.image ? `<img src="${p.image}" alt="${p.title}" onerror="this.style.display='none'">` : ''}
        <p>${p.description}</p>
        <div style="margin-top:auto">
           ${(p.links||[]).map(l => `<a href="${l.href}" target="_blank" style="margin-right:15px">🔗 ${l.label}</a>`).join("")}
        </div>
      </article>
    `).join("");
  }

  function filter() {
    let filtered = projects.filter(p => {
      return JSON.stringify(p).toLowerCase().includes(query.toLowerCase());
    });
    render(filtered);
  }

  // Search Listener
  if (input) {
    input.addEventListener("input", e => {
      query = e.target.value;
      filter();
    });
  }

  render(projects);
}

init();