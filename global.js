console.log("Global loaded");

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "Resume" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/Kalberhe", title: "GitHub", external: true },
];

const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
// Change "Portfolio" below to your actual repository name if different
const REPO_NAME = "Portfolio"; 
const BASE_PATH = IS_LOCAL ? "/" : `/${REPO_NAME}/`;

const nav = document.createElement("nav");
const ul = document.createElement("ul");
nav.appendChild(ul);

// 1. Build Nav
for (const p of pages) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  
  if (p.external) {
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener";
  } else {
    // Correctly constructs path whether on localhost or GitHub Pages
    const rawPath = p.url === "" ? "" : p.url; 
    a.href = new URL(rawPath, new URL(BASE_PATH, location.origin)).href;
  }
  
  a.textContent = p.title;

  // Highlight Current
  const currentPath = location.pathname.replace(/\/$/, "") || "/";
  const linkPath = new URL(a.href).pathname.replace(/\/$/, "") || "/";
  if (currentPath === linkPath) a.classList.add("current");

  li.appendChild(a);
  ul.appendChild(li);
}

document.body.prepend(nav);

// 2. Theme Switcher
const themeHTML = `
  <label style="position:absolute; top:1.5rem; right:1.5rem; font-size:0.85rem; color:var(--text-muted);">
    Theme: 
    <select id="theme-switch" style="background:transparent; border:none; color:inherit; font-family:inherit; cursor:pointer;">
      <option value="auto">Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`;
document.body.insertAdjacentHTML("afterbegin", themeHTML);

const themeSelect = document.getElementById("theme-switch");
const savedTheme = localStorage.getItem("theme") || "auto";

function applyTheme(t) {
  const root = document.documentElement;
  if(t === "auto") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", t);
  }
}

themeSelect.value = savedTheme;
applyTheme(savedTheme);

themeSelect.addEventListener("change", (e) => {
  localStorage.setItem("theme", e.target.value);
  applyTheme(e.target.value);
});

export async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error("Failed");
    return await res.json();
  } catch (e) {
    console.warn("Fetch failed", e);
    return [];
  }
}