import * as d3mod from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = d3mod;

const W = 900, H = 420, M = {t:30,r:30,b:40,l:60};
const innerW = W - M.l - M.r, innerH = H - M.t - M.b;

const svg = d3.select("#scatter");
const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);

const tooltip = d3.select("#tooltip");
const fmtTime = d3.timeFormat("%b %d, %Y %I:%M %p");

d3.csv("loc.csv", d3.autoType).then(raw => {
  // expected columns (from elocuent --git):
  // commit, author, date, path, language, added, deleted, total
  // If your columns differ, tell me and I’ll adapt the parsing.

  // --- preprocess ---
  const data = raw.map(d => {
    const when = new Date(d.date);
    return {
      ...d,
      when,
      hour: when.getHours() + when.getMinutes()/60,
      totalLines: (d.total ?? (d.added || 0) + (d.deleted || 0))
    };
  });

  // --- summary stats (Step 1) ---
  const totalCommits = data.length;
  const totalLines = d3.sum(data, d => d.totalLines);
  const uniqueFiles = new Set(data.map(d => d.path)).size;

d3.select("#stats").html(`
  <dt>Total files analyzed</dt><dd>${data.length}</dd>
  <dt>Total lines of code</dt><dd>${d3.sum(data, d => d.totalLines)}</dd>
  <dt>File types included</dt><dd>${new Set(data.map(d => d.language)).size}</dd>
`);

  // --- scales & axes (Step 2) ---
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.when))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0,24]).nice()
    .range([innerH, 0]);

  const r = d3.scaleSqrt()               // Step 4: sqrt for area perception
    .domain(d3.extent(data, d => d.totalLines))
    .range([2, 12]);

  g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).ticks(13).tickFormat(h => `${String(h).padStart(2,"0")}:00`));

  // grid lines
  g.append("g")
    .attr("class","grid")
    .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""))
    .selectAll("line").attr("opacity", 0.6);

  // --- dots, sorted big→small so small sit on top (Step 4.3) ---
  const dots = g.append("g").attr("class","dots")
    .selectAll("circle")
    .data([...data].sort((a,b) => d3.descending(a.totalLines, b.totalLines)))
    .join("circle")
      .attr("cx", d => x(d.when))
      .attr("cy", d => y(d.hour))
      .attr("r", d => r(d.totalLines))
      .attr("fill", "#4682b4")
      .attr("fill-opacity", 0.75);

  // --- tooltip (Step 3) ---
  dots.on("mouseenter", (e,d) => {
      tooltip.attr("hidden", null).html(
        `<strong>${d.author ?? "unknown"}</strong><br>${fmtTime(d.when)}<br>${d.path}<br>± ${d.totalLines} lines`
      );
    })
    .on("mousemove", (e) => {
      tooltip.style("left", (e.clientX + 12) + "px").style("top", (e.clientY + 12) + "px");
    })
    .on("mouseleave", () => tooltip.attr("hidden", true));

  // --- brushing (Step 5) ---
  const brush = d3.brush()
    .extent([[0,0],[innerW, innerH]])
    .on("brush end", ({selection}) => {
      if (!selection) { updateSelection([]); return; }
      const [[x0,y0],[x1,y1]] = selection;
      const picked = data.filter(d =>
        x0 <= x(d.when) && x(d.when) <= x1 && y0 <= y(d.hour) && y(d.hour) <= y1
      );
      updateSelection(picked);
    });

  const brushLayer = g.append("g").attr("class","brush").call(brush);
  brushLayer.raise(); // make sure brush sits on top so you can drag

  function updateSelection(picked){
    d3.select("#selection-count").text(`Selected: ${picked.length} commits`);
    // language breakdown example
    const byLang = d3.rollups(picked, v => d3.sum(v, d => d.totalLines), d => d.language ?? "unknown")
                     .sort((a,b) => d3.descending(a[1], b[1]));
    d3.select("#selection-breakdown").html(
      byLang.map(([lang,lines]) => `<div>${lang}: ${lines} lines</div>`).join("")
    );
    dots.attr("stroke", d => picked.includes(d) ? "black" : null)
        .attr("stroke-width", d => picked.includes(d) ? 1 : null)
        .attr("fill-opacity", d => picked.includes(d) ? 1 : 0.35);
  }
});
