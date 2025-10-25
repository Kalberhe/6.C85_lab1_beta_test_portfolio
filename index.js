// index.js
import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js?v=2";

async function main() {

  const all = await fetchJSON("./lib/projects.json");
  const latest = (Array.isArray(all) ? all : [])
    .slice(0, 3)

    .map(p => ({ ...p, image: p.image?.startsWith("projects/") ? p.image : `projects/${p.image}` }));

  const projContainer = document.querySelector(".projects");
  if (projContainer) renderProjects(latest, projContainer, "h3");

 
  const stats = await fetchGitHubData();
  const box = document.querySelector("#profile-stats");
  if (box && stats) {
    box.innerHTML = `
      <h2>GitHub Snapshot</h2>
      <dl class="gh-grid">
        <dt>Repos</dt><dd>${stats.public_repos}</dd>
        <dt>Gists</dt><dd>${stats.public_gists}</dd>
        <dt>Followers</dt><dd>${stats.followers}</dd>
        <dt>Following</dt><dd>${stats.following}</dd>
      </dl>
    `;
  }

  console.log("Home wired: latest projects + GitHub stats loaded");
}
main();
