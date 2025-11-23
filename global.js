// global.js — load on every page with type="module"
console.log("global.js loaded");

// ---------- Correct base path handling for GitHub Pages ----------
const REPO = "Portfolio";

// TRUE when running on local machine (VS Code Live Server, local file, localhost)
const IS_LOCAL =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.protocol === "file:";

// BASE is "/" locally, but "/Portfolio/" on GitHub Pages
const BASE = IS_LOCAL ? "/" : `/${REPO}/`;

// ---------- Pages used in navbar ----------
const pages = [
  { url: "",          title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/",  title: "Contact" },
  { url: "resume/",   title: "Resume" },
  { url: "Meta/",     title: "Meta" },
  { url: "https://github.com/Kalberhe", title: "GitHub", external: true },
];

// ---------- Build the navbar ----------
const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
  // Full URL
  const href = p.url.startsWith("http") ? p.url : BASE + p.url;

  const a = document.createElement("a");
  a.href = href;
  a.textContent = p.title;

  // External links → new tab
  if (p.external || new URL(href, location.href).host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener";
  }

  // ---------- Highlight current page ----------
  // Normalize paths (“/Portfolio/projects” → “/Portfolio/projects/”)
  const linkPath = new URL(a.href, location.href).pathname.replace(/\/+$/, "/");
  const herePath = location.pathname.replace(/\/+$/, "/");

  // Both on same domain & same path
  if (!p.external && linkPath === herePath) {
    a.classList.add("current");
  }

  nav.append(a);
}

// ---------- Theme switcher ----------
document.body.insertAdjacentHTML(
  "afterbegin",
  `
<label style="position:absolute;top:1rem;right:1rem;font-size:.9rem">
  Theme:
  <select id="theme">
    <option value="auto">Automatic</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>`
);

const select = document.querySelector("#theme");

function applyTheme(mode) {
  const html = document.documentElement;
  if (mode === "light") {
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";
  } else if (mode === "dark") {
    html.setAttribute("data-theme", "dark");
    html.style.colorScheme = "dark";
  } else {
    // Auto → match OS
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    html.style.colorScheme = prefersDark ? "dark" : "light";
  }
}

// Initial theme
const saved = localStorage.getItem("colorScheme") || "auto";
select.value = saved;
applyTheme(saved);

// On change
select.addEventListener("input", (e) => {
  const mode = e.target.value;
  localStorage.setItem("colorScheme", mode);
  applyTheme(mode);
});

// Listen to OS theme if auto
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if ((localStorage.getItem("colorScheme") || "auto") === "auto") {
        applyTheme("auto");
      }
    });
}

// ---------- helper functions ----------
export async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("fetchJSON error for", url, err);
    return null;
  }
}

export async function fetchGitHubData() {
  return fetchJSON("https://api.github.com/users/Kalberhe");
}

export function renderProjects(projects, container, headingLevel = "h2") {
  if (!container) return;
  container.innerHTML = "";

  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = "<p>No projects available yet.</p>";
    return;
  }

  for (const p of projects) {
    const article = document.createElement("article");
    article.classList.add("card");

    const buttons = Array.isArray(p.links)
      ? p.links.map(l => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join(" ")
      : "";

    article.innerHTML = `
      <${headingLevel}>${p.title}</${headingLevel}>
      <img src="${p.image}" alt="${p.title}">
      <p>${p.description}</p>
      ${buttons}
    `;

    container.appendChild(article);
  }
}

export function renderProject(p) {
  const card = document.createElement("article");
  card.className = "project";
  card.innerHTML = `
    <img alt="${p.title}" src="${p.image}">
    <div class="meta">
      <h2>${p.title}</h2>
      <p class="desc">${p.description}</p>
      <p class="year" aria-label="Project year">${p.year ?? ""}</p>
    </div>
  `;
  return card;
}
