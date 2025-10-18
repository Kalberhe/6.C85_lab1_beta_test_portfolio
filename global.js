// global.js — load on every page with type="module"
console.log("IT’S ALIVE!");

// repo base (works locally + on GitHub Pages)
const REPO = "6.C85_lab1_beta_test_portfolio";
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const BASE = IS_LOCAL ? "/" : `/${REPO}/`;

// pages to show in the nav
const pages = [
  { url: "",          title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/",  title: "Contact" },
  { url: "resume/",   title: "Resume" },
  { url: "https://github.com/Kalberhe", title: "GitHub" },
];

// build nav
const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
  const href = p.url.startsWith("http") ? p.url : BASE + p.url;
  const a = document.createElement("a");
  a.href = href;
  a.textContent = p.title;

  // external links open in new tab
  if (a.host !== location.host) { a.target = "_blank"; a.rel = "noopener"; }

  // mark current page (normalize trailing slash)
  const linkPath = new URL(a.href).pathname.replace(/\/+$/, "");
  const herePath = location.pathname.replace(/\/+$/, "");
  if (a.host === location.host && linkPath === herePath) a.classList.add("current");

  nav.append(a);
}

// ---- Theme switcher (Auto / Light / Dark) ----
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
  html.setAttribute("data-theme", mode);            // our CSS vars
  html.style.colorScheme = mode === "auto"
    ? (osPrefersDark() ? "dark" : "light")
    : mode;                                         // built-in UI
}

// init from storage (default: auto)
const saved = localStorage.getItem("colorScheme") || "auto";
select.value = saved; applyTheme(saved);

// persist & apply on change
select.addEventListener("input", e => {
  const mode = e.target.value;                      // auto|light|dark
  localStorage.setItem("colorScheme", mode);
  applyTheme(mode);
});

// update if OS theme changes while in Auto
if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", () => {
    if (localStorage.getItem("colorScheme") === "auto") applyTheme("auto");
  });
}
