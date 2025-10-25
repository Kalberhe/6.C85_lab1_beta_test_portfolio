// global.js — load on every page with type="module"
console.log("IT’S ALIVE!");

const REPO = "6.C85_lab1_beta_test_portfolio";
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const BASE = IS_LOCAL ? "/" : `/${REPO}/`;


const pages = [
  { url: "",          title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/",  title: "Contact" },
  { url: "resume/",   title: "Resume" },
  { url: "https://github.com/Kalberhe", title: "GitHub" },
];


const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
  const href = p.url.startsWith("http") ? p.url : BASE + p.url;
  const a = document.createElement("a");
  a.href = href;
  a.textContent = p.title;

  
  if (a.host !== location.host) { 
    a.target = "_blank"; 
    a.rel = "noopener"; 
  }

  
  const linkPath = new URL(a.href).pathname.replace(/\/+$/, "");
  const herePath = location.pathname.replace(/\/+$/, "");
  if (a.host === location.host && linkPath === herePath) a.classList.add("current");

  nav.append(a);
}


document.body.insertAdjacentHTML("afterbegin", `
  <label style="position:absolute;top:1rem;right:1rem;font-size:.9rem">
    Theme:
    <select id="theme">
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`);

const select = document.querySelector("#theme");

function osPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode) {
  const html = document.documentElement;
  html.setAttribute("data-theme", mode);
  html.style.colorScheme = mode === "auto"
    ? (osPrefersDark() ? "dark" : "light")
    : mode;
}


const saved = localStorage.getItem("colorScheme") || "auto";
select.value = saved; 
applyTheme(saved);


select.addEventListener("input", e => {
  const mode = e.target.value;
  localStorage.setItem("colorScheme", mode);
  applyTheme(mode);
});


if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", () => {
    if (localStorage.getItem("colorScheme") === "auto") applyTheme("auto");
  });
}


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
      ? p.links
          .map(
            (l) =>
              `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`
          )
          .join(" ")
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
