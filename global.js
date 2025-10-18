// global.js  — load with: <script type="module" src="../global.js"></script>

/* ---------- Config ---------- */
const REPO = "6.C85_lab1_beta_test_portfolio"; // your GitHub Pages repo name
const PAGES = [
  { url: "",            title: "Home" },
  { url: "projects/",   title: "Projects" },
  { url: "contact/",    title: "Contact" },
  { url: "resume/",     title: "Resume" },
  { url: "https://github.com/Kalberhe", title: "GitHub" }, // external
];

/* ---------- Helpers ---------- */
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const BASE = isLocal ? "/" : `/${REPO}/`;

const normPath = p =>
  p.replace(/\/index\.html$/, "/").replace(/\/+$/, "/"); // normalize trailing slash

const makeHref = url => (url.startsWith("http") ? url : BASE + url);

/* ---------- NAV: build or reuse ---------- */
function buildNav() {
  // Reuse existing <nav>, or create one
  let nav = document.querySelector("nav");
  if (!nav) {
    nav = document.createElement("nav");
    // Put nav at top of body, but after any theme toggle label we inject later
    document.body.prepend(nav);
  } else {
    // Clear any hard-coded links so we don't get duplicate rows/styles
    nav.innerHTML = "";
  }

  // Build links
  for (const p of PAGES) {
    const a = document.createElement("a");
    a.href = makeHref(p.url);
    a.textContent = p.title;

    // External links open new tab
    if (a.host !== location.host) {
      a.target = "_blank";
      a.rel = "noopener";
    }

    // Current page highlight (only for same-host links)
    const sameHost = a.host === location.host;
    if (sameHost) {
      const isCurrent = normPath(a.pathname) === normPath(location.pathname);
      if (isCurrent) a.classList.add("current");
    }

    nav.append(a);
  }
}

/* ---------- THEME: Auto / Light / Dark ---------- */
// We drive site colors via CSS vars in :root[data-theme="..."]
// Also set color-scheme so native controls match.
function applyTheme(mode) {
  // mode: "auto" | "light" | "dark"
  const doc = document.documentElement;

  // color-scheme affects form controls, scrollbars, etc.
  const cs = mode === "auto" ? "light dark" : mode;
  doc.style.setProperty("color-scheme", cs);

  if (mode === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    doc.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    doc.setAttribute("data-theme", mode);
  }
}

function initThemeUI() {
  // Insert a compact select at top-right if not already present
  if (!document.querySelector("#theme")) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `
      <label class="color-scheme" style="position:absolute;top:1rem;right:1rem;font-size:80%">
        Theme:
        <select id="theme">
          <option value="auto">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      `
    );
  }

  const select = document.querySelector("#theme");

  // Initialize from storage or default to auto
  const saved = localStorage.getItem("theme") || "auto";
  select.value = saved;
  applyTheme(saved);

  // Update on change
  select.addEventListener("input", e => {
    const mode = e.target.value; // "auto" | "light" | "dark"
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  });

  // If user is in auto, follow system changes live
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", () => {
    if ((localStorage.getItem("theme") || "auto") === "auto") applyTheme("auto");
  });
}

/* ---------- Init ---------- */
buildNav();
initThemeUI();
