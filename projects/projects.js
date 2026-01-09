import { fetchJSON } from "../global.js";

async function init() {
  const projects = await fetchJSON("../lib/projects.json");
  const container = document.getElementById("projects-list");
  const input = document.querySelector(".search-bar");
  
  let query = "";

  function render(data) {
    if (!container) return;
    
    if (data.length === 0) {
      container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted)">No matching projects found.</p>`;
      return;
    }

    container.innerHTML = data.map(p => `
      <article class="card">
        <h3>${p.title}</h3>
        <div class="meta">${p.year}</div>
        <p>${p.description}</p>
        <div class="links">
           ${(p.links||[]).map(l => `<a href="${l.href}" target="_blank">🔗 ${l.label}</a>`).join("")}
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

  if (input) {
    input.addEventListener("input", e => {
      query = e.target.value;
      filter();
    });
  }

  render(projects);
}

init();