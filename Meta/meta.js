import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/* ---- Sizing ---- */
const W = 900, H = 420, M = { t:30, r:28, b:44, l:56 };
const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

/* ---- SVG ---- */
const svg = d3.select("#scatter").attr("width", W).attr("height", H);

/* Solid white background INSIDE the SVG so it’s white in all themes */
svg.selectAll("*").remove();
svg.insert("rect", ":first-child")
  .attr("x", 0).attr("y", 0)
  .attr("width", W).attr("height", H)
  .attr("fill", "#fff");

const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);

/* Tooltip */
const tooltip = d3.select("#tooltip");
const fmtInt = d3.format(",");
const fmtPct = d3.format(".1~%");
const fmtTimeLong = d3.timeFormat("%b %d, %Y %I:%M %p");

/* theme accent */
function themeAccent() {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent");
  return (v && v.trim()) || "#4f79ff";
}
const ACCENT = themeAccent();
const SELECTED = "#ff6b6b";

/* ---- Load CSV ---- */
const raw = await d3.csv("./loc.csv", d3.autoType);

/* ---- Build commit objects ---- */
const commits = d3.rollups(
  raw,
  v => {
    const head = v[0];
    const when = head.datetime instanceof Date
      ? head.datetime
      : new Date(`${head.date}T${head.time}${head.timezone ?? ""}`);

    return {
      commit: head.commit,
      author: head.author,
      when,
      hour: when.getHours() + when.getMinutes() / 60,
      linesTouched: v.length,
      filesTouched: new Set(v.map(d => d.file)).size,
      longestLine: d3.max(v, d => +d.length || 0),
      sampleFile: head.file,
      lines: v
    };
  },
  d => d.commit
)
.map(d => d[1])
.sort((a, b) => d3.ascending(a.when, b.when));

/* --- Lab 8 Slider State --- */
let commitProgress = 100;

const timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.when))
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);
let filteredCommits = commits;

/* Summary stats */
const stats = {
  commits: commits.length,
  files: new Set(raw.map(d => d.file)).size,
  totalLoc: raw.length,
  maxDepth: d3.max(raw, d => +d.depth || 0) ?? 0,
  longestLine: d3.max(raw, d => +d.length || 0) ?? 0,
  maxLines: d3.max(
    d3.rollups(raw, v => v.length, d => d.file).map(d => d[1])
  ) ?? 0
};

d3.select("#stats").html(
  [
    ["Commits", stats.commits],
    ["Files", stats.files],
    ["Total LOC", stats.totalLoc],
    ["Max Depth", stats.maxDepth],
    ["Longest Line", stats.longestLine],
    ["Max Lines", stats.maxLines],
  ]
    .map(([k, v]) => `
      <div class="stat">
        <span class="k">${k}</span>
        <span class="v">${fmtInt(v)}</span>
      </div>
    `).join("")
);

/* ---- Scales & axes ---- */
const x = d3.scaleTime()
  .domain(d3.extent(commits, d => d.when))
  .range([0, innerW])
  .nice();

const y = d3.scaleLinear()
  .domain([0, 24])
  .range([innerH, 0]);

const r = d3.scaleSqrt()
  .domain([1, d3.max(commits, d => d.linesTouched) || 1])
  .range([3, 16]);

/* grid lines */
g.append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""));

/* axes */
g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${innerH})`)
  .call(d3.axisBottom(x).ticks(10));

g.append("g")
  .attr("class", "y axis")
  .call(
    d3.axisLeft(y)
      .ticks(13)
      .tickFormat(h => `${String(h % 24).padStart(2, "0")}:00`)
  );

/* ---- DOTS GROUP (important for updates) ---- */
g.append("g").attr("class", "dots");

/* ---- Initial draw ---- */
updateScatterPlot(commits);

/* ---- Slider callback ---- */
function onTimeSliderChange() {
  const slider = document.getElementById("commit-progress");
  commitProgress = +slider.value;

  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById("commit-time").textContent =
    commitMaxTime.toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short"
    });

  filteredCommits = commits.filter(d => d.when <= commitMaxTime);
  updateScatterPlot(filteredCommits);
}

/* Attach + init */
document.getElementById("commit-progress")
  .addEventListener("input", onTimeSliderChange);
onTimeSliderChange();

/* ---- UPDATE SCATTER PLOT ---- */
function updateScatterPlot(dataNow) {

  // 1. Update x-domain
  x.domain(d3.extent(dataNow, d => d.when));
  svg.select(".x.axis").call(d3.axisBottom(x));

  // 2. Sort data
  const sorted = d3.sort(dataNow, d => -d.linesTouched);

  // 3. Data join with key
  const circles = g.select("g.dots")
    .selectAll("circle")
    .data(sorted, d => d.commit);

  // Exit
  circles.exit().remove();

  // Enter
  const enter = circles.enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.when))
    .attr("cy", d => y(d.hour))
    .attr("r", d => r(d.linesTouched))
    .attr("fill", ACCENT)
    .attr("fill-opacity", .6)
    .on("mouseenter", (e, d) => {
      tooltip
        .style("left", (e.clientX + 12) + "px")
        .style("top", (e.clientY + 12) + "px")
        .attr("hidden", null)
        .html(
          `<strong>${d.author ?? "unknown"}</strong><br>` +
          `${fmtTimeLong(d.when)}<br>` +
          `Lines touched: ${fmtInt(d.linesTouched)}<br>` +
          `Files touched: ${fmtInt(d.filesTouched)}<br>` +
          `<code>${d.sampleFile ?? ""}</code>`
        );
    })
    .on("mouseleave", () => tooltip.attr("hidden", true));

  // Update + merged
  enter.merge(circles)
    .attr("cx", d => x(d.when))
    .attr("cy", d => y(d.hour))
    .attr("r", d => r(d.linesTouched));
}

/* ---- Brush ---- */
const brush = d3.brush()
  .extent([[0, 0], [innerW, innerH]])
  .on("brush end", ({ selection }) => {
    if (!selection) {
      updateSelection([]);
      return;
    }
    const [[x0, y0], [x1, y1]] = selection;
    const picked = commits.filter(d =>
      x0 <= x(d.when) && x(d.when) <= x1 &&
      y0 <= y(d.hour) && y(d.hour) <= y1
    );
    updateSelection(picked);
  });

g.append("g").attr("class", "brush").call(brush);

updateSelection([]);

/* ---- Language aggregator ---- */
function bucket(langRaw) {
  const s = String(langRaw ?? "").toLowerCase();
  if (/(html|htm|ejs|pug|twig)/.test(s)) return "HTML";
  if (/(css|scss|sass|less|stylus)/.test(s)) return "CSS";
  if (/(js|mjs|cjs|ts|tsx|jsx)/.test(s)) return "JS";
  return "Other";
}

/* ---- Selection updater ---- */
function updateSelection(picked) {
  const pickedSet = new Set(picked.map(d => d.commit));

  // Re-select dots fresh each time
  g.select("g.dots").selectAll("circle")
    .attr("fill", d => pickedSet.has(d.commit) ? SELECTED : ACCENT)
    .attr("fill-opacity", d => pickedSet.has(d.commit) ? 1 : 0.25)
    .attr("stroke", d => pickedSet.has(d.commit) ? "#000" : null)
    .attr("stroke-width", d => pickedSet.has(d.commit) ? 1 : null);

  /* text */
  const count = picked.length;
  d3.select("#selection-count")
    .text(`${count ? count : "No"} commits selected`);

  /* language breakdown */
  const container = d3.select("#language-breakdown");
  container.html("");

  const pool = count ? picked : commits;
  const lines = pool.flatMap(d => d.lines || []);
  if (!lines.length) return;

  const tallies = d3.rollups(
    lines,
    v => v.length,
    d => bucket(d.type ?? d.language ?? d.ext)
  );

  const main = tallies.filter(([k]) => k !== "Other");
  const other = tallies.find(([k]) => k === "Other");
  if (other) main.push(other);

  const total = d3.sum(main, d => d[1]);

  main.forEach(([lang, cnt]) => {
    container.append("dt").text(lang);
    container.append("dd")
      .text(`${fmtInt(cnt)} lines (${fmtPct(cnt / total)})`);
  });
}
