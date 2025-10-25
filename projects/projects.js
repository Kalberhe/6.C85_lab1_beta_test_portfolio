import { fetchJSON, renderProjects } from "../global.js";

function cardHTML(p, heading = "h2") {
  // optional link buttons if provided in JSON
  const links = Array.isArray(p.links)
    ? p.links.map(l => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join(" ")
    : "";
  return `
    <article class="card">
      <${heading}>${p.title}</${heading}>
      <img src="${p.image}" alt="${p.title}">
      <p>${p.description ?? ""}</p>
      ${links}
    </article>
  `;
}

async function main() {
  const data = await fetchJSON("../lib/projects.json");
  const container = document.querySelector(".projects");

  if (!Array.isArray(data) || !container) return;

  // render using your helper, but swap in our card template for nicer buttons
  container.innerHTML = data.map(p => cardHTML(p, "h3")).join("");

  // update count in the title
  const h1 = document.querySelector(".projects-title");
  if (h1) h1.textContent = `My Projects (${data.length})`;
}

main();

