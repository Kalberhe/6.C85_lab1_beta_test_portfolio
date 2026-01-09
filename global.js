console.log("Global loaded");

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "Resume" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/Kalberhe", title: "GitHub", external: true },
];

const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const REPO_NAME = "Portfolio"; 
const BASE_PATH = IS_LOCAL ? "/" : `/${REPO_NAME}/`;

// 1. Create the new Dynamic Nav
const nav = document.createElement("nav");
const ul = document.createElement("ul");
nav.appendChild(ul);

for (const p of pages) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  
  if (p.external) {
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener";
  } else {
    const rawPath = p.url === "" ? "" : p.url; 
    a.href = new URL(rawPath, new URL(BASE_PATH, location.origin)).href;
  }
  
  a.textContent = p.title;

  const currentPath = location.pathname.replace(/\/$/, "") || "/";
  const linkPath = new URL(a.href).pathname.replace(/\/$/, "") || "/";
  if (currentPath === linkPath) a.classList.add("current");

  li.appendChild(a);
  ul.appendChild(li);
}

// 2. THE FIX: Remove any existing nav first to prevent duplicates
const existingNav = document.querySelector("nav");
if (existingNav) {
  existingNav.remove();
}

document.body.prepend(nav);

// 3. Theme Switcher
if (!document.getElementById("theme-switch")) {
  const themeHTML = `
    <label style="position:absolute; top:1rem; right:1.5rem; font-size:0.8rem; color:var(--text-muted);">
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
}

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