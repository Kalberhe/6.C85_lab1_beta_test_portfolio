// global.js — load on every page with type="module"
console.log("IT’S ALIVE!");

// ---------- Paths (GitHub Pages vs local) ----------
const REPO = "Portfolio";
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const BASE = IS_LOCAL ? "/" : `/${REPO}/`;

// ---------- Nav pages (Meta included) ----------
const pages = [
  { url: "",          title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/",  title: "Contact" },
  { url: "resume/",   title: "Resume" },
  { url: "Meta/",     title: "Meta" },
  { url: "https://github.com/Kalberhe", title: "GitHub", external: true },
];

// ---------- Build navbar (no inline styles; let your CSS handle the look) ----------
const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
  const href = p.url.startsWith("http") ? p.url : BASE + p.url;
  const a = document.createElement("a");
  a.href = href;
  a.textContent = p.title;

  // External links in a new tab
  if (p.external || new URL(href, location.href).host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener";
  }

  // Highlight current page
  const linkPath = new URL(a.href, location.href).pathname.replace(/\/+$/, "");
  const herePath = location.pathname.replace(/\/+$/, "");
  if (a.host === location.host && linkPath === herePath) {
    a.classList.add("current");
  }

  nav.append(a);
}

// ---------- Theme switcher (id="theme" — matches your CSS/markup expectations) ----------
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

// Apply theme using data-theme (your CSS can target [data-theme="dark"] / [data-theme="light"])
// Automatic removes the attribute so prefers-color-scheme works.
function applyTheme(mode) {
  const html = document.documentElement;

  if (mode === "light") {
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";
  } else if (mode === "dark") {
    html.setAttribute("data-theme", "dark");
    html.style.colorScheme = "dark";
  } else {
    // Automatic = match OS
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    html.style.colorScheme = prefersDark ? "dark" : "light";
  }
}

// Initialize theme
const saved = localStorage.getItem("colorScheme") || "auto";
select.value = saved;
applyTheme(saved);

// On change
select.addEventListener("input", (e) => {
  const mode = e.target.value;
  localStorage.setItem("colorScheme", mode);
  applyTheme(mode);
});

// Listen to OS changes if set to auto
if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if ((localStorage.getItem("colorScheme") || "auto") === "auto") {
      applyTheme("auto");
    }
  });
}

// ---------- Optional helpers you already use ----------
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
