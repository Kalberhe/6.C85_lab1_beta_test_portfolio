import { fetchJSON } from "./global.js";

async function init() {
  const container = document.getElementById("latest-projects");
  const statsBox = document.getElementById("stats");

  // 1. Fetch Projects
  try {
    const projects = await fetchJSON("./lib/projects.json");
    
    if (container && Array.isArray(projects) && projects.length > 0) {
      // Top 3 latest
      const latest = projects.slice(0, 3);
      
      container.innerHTML = latest.map(p => `
        <article class="card">
          <h3>${p.title}</h3>
          <div class="meta">${p.year}</div>
          <p>${p.description}</p>
          <div class="links">
             ${(p.links||[]).map(l => `<a href="${l.href}" target="_blank">${l.label}</a>`).join("")}
          </div>
        </article>
      `).join("");
    } else if (container) {
      container.innerHTML = `<p>No projects found.</p>`;
    }
  } catch (err) {
    console.error("Project fetch failed:", err);
    if(container) container.innerHTML = `<p>Error loading projects.</p>`;
  }

  // 2. Stats
  try {
    const stats = await fetchJSON("https://api.github.com/users/Kalberhe");
    if (statsBox && stats.public_repos) {
      statsBox.innerHTML = `
        <div class="stat-box"><dt>Repos</dt><dd>${stats.public_repos}</dd></div>
        <div class="stat-box"><dt>Followers</dt><dd>${stats.followers}</dd></div>
        <div class="stat-box"><dt>Gists</dt><dd>${stats.public_gists}</dd></div>
        <div class="stat-box"><dt>Following</dt><dd>${stats.following}</dd></div>
      `;
    }
  } catch (e) {
    console.warn("GitHub stats failed", e);
  }
}
init();