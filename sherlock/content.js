const TMDB_API_KEY = "c462d9a8feb2ed4ee786586e3c0961fa"; // Replace this with your real TMDB API key
let sherlockEnabled = true;
let lastHoveredTitle = "";

// Load toggle state
chrome.storage.sync.get(["sherlockEnabled"], (result) => {
  if (result.sherlockEnabled === false) sherlockEnabled = false;
});

document.addEventListener("mouseover", async (e) => {
  if (!sherlockEnabled) return;

  const title = smartTitleDetection(e.target);
  if (!title || title === lastHoveredTitle) return;
  lastHoveredTitle = title;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const json = await res.json();
    if (!json.results || json.results.length === 0) return;

    const item = json.results[0];
    const type = item.media_type;
    const id = item.id;

    const detailRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`);
    const details = await detailRes.json();

    const info = `
      <strong>${details.title || details.name}</strong><br>
      ⭐ ${details.vote_average} (${details.vote_count} votes)<br>
      Type: ${type}<br>
      ${type === "tv" ? `Seasons: ${details.number_of_seasons}<br>Episodes: ${details.number_of_episodes}<br>` : ""}
      Genre: ${details.genres.map(g => g.name).join(", ")}
    `;

    showTooltip(info, e.pageX + 15, e.pageY + 15);
  } catch (err) {
    console.error("Sherlock TMDB error:", err);
  }
});

document.addEventListener("mouseout", () => {
  const tooltip = document.getElementById("movie-info-tooltip");
  if (tooltip) tooltip.remove();
});

function showTooltip(info, x, y) {
  const old = document.getElementById("movie-info-tooltip");
  if (old) old.remove();

  const tooltip = document.createElement("div");
  tooltip.id = "movie-info-tooltip";
  tooltip.innerHTML = info;
  tooltip.className = "movie-tooltip";
  tooltip.style.top = `${y}px`;
  tooltip.style.left = `${x}px`;
  document.body.appendChild(tooltip);
}

function smartTitleDetection(el) {
  if (!el) return null;

  const ignoreKeywords = ["play", "episode", "trailer", "watch", "season", "mins", "min", "hr", "hours"];
  const text = el.innerText?.trim() || "";
  const aria = el.getAttribute("aria-label")?.trim();
  const alt = el.getAttribute("alt")?.trim();

  let candidate = text || aria || alt;
  if (!candidate || candidate.length < 2 || candidate.length > 100) return null;

  const lc = candidate.toLowerCase();
  if (ignoreKeywords.some(keyword => lc.includes(keyword))) return null;

  const computedStyle = window.getComputedStyle(el);
  const isBold = computedStyle.fontWeight >= 600;
  const isLarge = parseFloat(computedStyle.fontSize) > 16;
  const isHeading = ["H1", "H2", "H3", "STRONG", "B"].includes(el.tagName);

  const confidenceScore = (isBold ? 1 : 0) + (isLarge ? 1 : 0) + (isHeading ? 1 : 0);

  if (confidenceScore >= 1) {
    return candidate;
  }

  const parent = el.closest("div, span, section");
  if (parent) {
    const parentText = parent.innerText?.trim();
    if (parentText && parentText.length < 100 && !ignoreKeywords.some(k => parentText.toLowerCase().includes(k))) {
      return parentText;
    }
  }

  return null;
}

