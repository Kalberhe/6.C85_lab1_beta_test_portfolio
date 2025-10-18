// global.js  (load this on EVERY page with type="module")
console.log("IT’S ALIVE!");

// tiny helper from the lab
function $$(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

// --- Step 3: build the nav automatically on every page ---
// Detect local dev vs GitHub Pages (set your repo folder name below)
const REPO = "6.C85_lab1_beta_test_portfolio";  // <-- change if different
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                                  // local server
  : `/${REPO}/`;                          // GitHub Pages subfolder

// Site pages (relative to site root)
const pages = [
  { url: "",              title: "Home" },
  { url: "projects/",     title: "Projects" },
  { url: "contact/",      title: "Contact" },
  { url: "resume/",       title: "Resume" },
  { url: "https://github.com/Kalberhe", title: "GitHub" }, // external
];

// Make a <nav> and prepend it to <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// Create links
for (const p of pages) {
  // prefix BASE_PATH for internal (non-http) links
  const href = p.url.startsWith("http") ? p.url : BASE_PATH + p.url;

  const a = document.createElement("a");
  a.href = href;
  a.textContent = p.title;

  // current-page highlight
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // open external in new tab
  a.toggleAttribute("target", a.host !== location.host);
  if (a.target) a.rel = "noopener";

  nav.append(a);
}

// --- Step 4: Dark mode switcher (3 modes: Auto / Light / Dark) ---

// 4.1: allow light + dark by default (CSS also sets this)
document.documentElement.style.setProperty("color-scheme", getComputedStyle(document.documentElement).colorScheme || "light dark");

// Insert switcher UI at top-right
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme" style="position:absolute;top:1rem;right:1rem;font-size:80%">
    Theme:
    <select id="theme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector("#theme");

// init from localStorage if present
if ("colorScheme" in localStorage) {
  document.documentElement.style.setProperty("color-scheme", localStorage.colorScheme);
  select.value = localStorage.colorScheme;
}

// react to user changes
select.addEventListener("input", (e) => {
  const val = e.target.value; // "light dark" | "light" | "dark"
  document.documentElement.style.setProperty("color-scheme", val);
  localStorage.colorScheme = val; // persist
});
