import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/* ---- Sizing ---- */
const W = 900, H = 420, M = { t:30, r:28, b:44, l:56 };
const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

/* ---- SVG ---- */
const svg = d3.select("#scatter").attr("width", W).attr("height", H);

/* Solid white background INSIDE the SVG so it’s white in all themes */
svg.insert("rect", ":first-child")
  .attr("x", 0).attr("y", 0)
  .attr("width", W).attr("height", H)
  .attr("fill", "#fff");

const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);

const tooltip = d3.select("#tooltip");
const fmtInt = d3.format(",");
const fmtTimeLong = d3.timeFormat("%b %d, %Y %I:%M %p");

/* ---- Load CSV ---- */
const raw = await d3.csv("./loc.csv", d3.autoType);

/* One dot per commit */
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
      hour: when.getHours() + when.getMinutes()/60,
      linesTouched: v.length,
      filesTouched: new Set(v.map(d => d.file)).size,
      longestLine: d3.max(v, d => +d.length || 0),
      sampleFile: head.file
    };
  },
  d => d.commit
).map(d => d[1]).sort((a,b)=>d3.ascending(a.when,b.when));

/* ---- Summary ---- */
const stats = {
  commits: commits.length,
  files: new Set(raw.map(d => d.file)).size,
  totalLoc: raw.length,
  maxDepth: d3.max(raw, d => +d.depth || 0) ?? 0,
  longestLine: d3.max(raw, d => +d.length || 0) ?? 0,
  maxLines: d3.max(d3.rollups(raw, v => v.length, d => d.file).map(d => d[1])) ?? 0
};

/* Render as a single-row grid (no <dl> stacking) */
d3.select("#stats").html([
  ["Commits", stats.commits],
  ["Files", stats.files],
  ["Total LOC", stats.totalLoc],
  ["Max Depth", stats.maxDepth],
  ["Longest Line", stats.longestLine],
  ["Max Lines", stats.maxLines],
].map(([k,v]) => `
  <div class="stat">
    <span class="k">${k}</span>
    <span class="v">${fmtInt(v)}</span>
  </div>
`).join(""));

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
  .range([2, 10]);

g.append("g")
  .attr("class","x axis")
  .attr("transform", `translate(0,${innerH})`)
  .call(d3.axisBottom(x).ticks(10));

g.append("g")
  .attr("class","y axis")
  .call(d3.axisLeft(y)
        .ticks(13)
        .tickFormat(h => `${String(h).padStart(2,"0")}:00`));

/* grid lines on white */
g.append("g")
  .attr("class","grid")
  .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""));

/* ---- Dots (theme blue via CSS var) ---- */
const dots = g.append("g").selectAll("circle")
  .data(commits)
  .join("circle")
    .attr("class","dot")
    .attr("cx", d => x(d.when))
    .attr("cy", d => y(d.hour))
    .attr("r",  d => r(d.linesTouched))
    .attr("fill", "var(--accent)")
    .attr("fill-opacity", .95)
    .on("mouseenter", (e,d) => {
      tooltip
        .style("left", (e.clientX + 12) + "px")
        .style("top",  (e.clientY + 12) + "px")
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

/* ---- Brush selection ---- */
const brush = d3.brush()
  .extent([[0,0],[innerW, innerH]])
  .on("brush end", ({selection}) => {
    if (!selection){ updateSelection(commits); return; }
    const [[x0,y0],[x1,y1]] = selection;
    const picked = commits.filter(d =>
      x0 <= x(d.when) && x(d.when) <= x1 &&
      y0 <= y(d.hour) && y(d.hour) <= y1
    );
    updateSelection(picked);
  });

g.append("g").attr("class","brush").call(brush);

/* Initial selection = all */
updateSelection(commits);

function updateSelection(arr){
  d3.select("#selection-count").text(`Selected: ${fmtInt(arr.length)} commits`);
  const byAuthor = d3.rollups(arr, v => v.length, d => d.author ?? "unknown")
                     .sort((a,b) => d3.descending(a[1], b[1]))
                     .slice(0,5);
  d3.select("#selection-breakdown").html(
    `<h4>Top authors</h4>` +
    byAuthor.map(([k,v]) => `<div>${k}: ${fmtInt(v)}</div>`).join("")
  );

  const pickedSet = new Set(arr.map(d => d.commit));
  dots.attr("opacity", d => pickedSet.has(d.commit) ? 1 : 0.25)
      .attr("stroke", d => pickedSet.has(d.commit) ? "#000" : null)
      .attr("stroke-width", d => pickedSet.has(d.commit) ? 1 : null);
}
