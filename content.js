// Time Watch - Content Script
// Injects a year-progress circle widget on every page.

(function () {
  "use strict";

  // Prevent double-injection (e.g. if script runs twice)
  if (document.getElementById("tw-root")) return;

  // ─── Progress calculations ───────────────────────────────────

  function calcProgress() {
    const now = new Date();

    // Year progress
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearTotal = yearEnd - yearStart;
    const yearElapsed = now - yearStart;
    const yearPct = (yearElapsed / yearTotal) * 100;

    // Month progress
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthTotal = monthEnd - monthStart;
    const monthElapsed = now - monthStart;
    const monthPct = (monthElapsed / monthTotal) * 100;

    // Week progress (Monday = start)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    const weekTotal = 7 * 24 * 60 * 60 * 1000;
    const weekElapsed = now - weekStart;
    const weekPct = (weekElapsed / weekTotal) * 100;

    // Day progress
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayTotal = 24 * 60 * 60 * 1000;
    const dayElapsed = now - dayStart;
    const dayPct = (dayElapsed / dayTotal) * 100;

    // Day of year
    const diff = now - yearStart;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.ceil(yearTotal / (1000 * 60 * 60 * 24));

    return {
      yearPct: Math.min(yearPct, 100),
      monthPct: Math.min(monthPct, 100),
      weekPct: Math.min(weekPct, 100),
      dayPct: Math.min(dayPct, 100),
      dayOfYear,
      totalDays,
      year: now.getFullYear(),
    };
  }

  // ─── Build the widget DOM ────────────────────────────────────

  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function createWidget() {
    const root = document.createElement("div");
    root.id = "tw-root";

    root.innerHTML = `
      <div id="tw-circle">
        <svg viewBox="0 0 52 52">
          <circle class="tw-center" cx="26" cy="26" r="18" />
          <circle class="tw-track" cx="26" cy="26" r="${RADIUS}" />
          <circle class="tw-progress" cx="26" cy="26" r="${RADIUS}"
            stroke-dasharray="${CIRCUMFERENCE}"
            stroke-dashoffset="${CIRCUMFERENCE}"
            transform="rotate(-90 26 26)" />
          <text class="tw-pct" x="26" y="26">0%</text>
        </svg>
      </div>
      <div id="tw-tooltip"></div>
      <div id="tw-panel">
        <div id="tw-panel-title">Time Progress</div>
        <div class="tw-row" data-key="year">
          <div class="tw-row-header">
            <span class="tw-row-label">Year</span>
            <span class="tw-row-value">0%</span>
          </div>
          <div class="tw-bar-track"><div class="tw-bar-fill tw-year"></div></div>
        </div>
        <div class="tw-row" data-key="month">
          <div class="tw-row-header">
            <span class="tw-row-label">Month</span>
            <span class="tw-row-value">0%</span>
          </div>
          <div class="tw-bar-track"><div class="tw-bar-fill tw-month"></div></div>
        </div>
        <div class="tw-row" data-key="week">
          <div class="tw-row-header">
            <span class="tw-row-label">Week</span>
            <span class="tw-row-value">0%</span>
          </div>
          <div class="tw-bar-track"><div class="tw-bar-fill tw-week"></div></div>
        </div>
        <div class="tw-row" data-key="day">
          <div class="tw-row-header">
            <span class="tw-row-label">Day</span>
            <span class="tw-row-value">0%</span>
          </div>
          <div class="tw-bar-track"><div class="tw-bar-fill tw-day"></div></div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    return root;
  }

  // ─── Update the UI with current progress ─────────────────────

  function updateUI(root) {
    const p = calcProgress();

    // Update SVG arc
    const arc = root.querySelector(".tw-progress");
    const offset = CIRCUMFERENCE - (p.yearPct / 100) * CIRCUMFERENCE;
    arc.style.strokeDashoffset = offset;

    // Update center text
    const pctText = root.querySelector(".tw-pct");
    pctText.textContent = p.yearPct.toFixed(1) + "%";

    // Update tooltip
    const tooltip = root.querySelector("#tw-tooltip");
    tooltip.textContent = `Day ${p.dayOfYear} / ${p.totalDays} of ${p.year}`;

    // Update expanded panel bars
    const rows = { year: p.yearPct, month: p.monthPct, week: p.weekPct, day: p.dayPct };
    for (const [key, val] of Object.entries(rows)) {
      const row = root.querySelector(`.tw-row[data-key="${key}"]`);
      row.querySelector(".tw-row-value").textContent = val.toFixed(1) + "%";
      row.querySelector(".tw-bar-fill").style.width = val + "%";
    }
  }

  // ─── Drag logic ──────────────────────────────────────────────

  function setupDrag(root) {
    const circle = root.querySelector("#tw-circle");
    let isDragging = false;
    let wasDragged = false;
    let startX, startY, startLeft, startBottom;

    circle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      wasDragged = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = root.getBoundingClientRect();
      startLeft = rect.left;
      startBottom = window.innerHeight - rect.bottom;

      root.classList.add("tw-dragging");
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        wasDragged = true;
      }

      let newLeft = startLeft + dx;
      let newBottom = startBottom - dy;

      // Clamp to viewport
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 52));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - 52));

      root.style.left = newLeft + "px";
      root.style.bottom = newBottom + "px";
      root.style.right = "auto";
      root.style.top = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      root.classList.remove("tw-dragging");

      if (wasDragged) {
        savePosition(root);
      }
    });

    // Click = toggle panel (only if not dragged)
    circle.addEventListener("click", () => {
      if (wasDragged) {
        wasDragged = false;
        return;
      }
      const panel = root.querySelector("#tw-panel");
      panel.classList.toggle("tw-open");
    });
  }

  // ─── Position persistence ────────────────────────────────────

  function savePosition(root) {
    const pos = {
      left: root.style.left,
      bottom: root.style.bottom,
    };
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tw_position: pos });
      }
    } catch (_) {
      // storage unavailable, ignore
    }
  }

  function loadPosition(root) {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get("tw_position", (result) => {
          if (result && result.tw_position) {
            root.style.left = result.tw_position.left;
            root.style.bottom = result.tw_position.bottom;
            root.style.right = "auto";
            root.style.top = "auto";
          }
        });
      }
    } catch (_) {
      // storage unavailable, ignore
    }
  }

  // ─── Close panel when clicking outside ───────────────────────

  function setupOutsideClick(root) {
    document.addEventListener("mousedown", (e) => {
      if (!root.contains(e.target)) {
        const panel = root.querySelector("#tw-panel");
        if (panel.classList.contains("tw-open")) {
          panel.classList.remove("tw-open");
        }
      }
    });
  }

  // ─── Initialize ──────────────────────────────────────────────

  const root = createWidget();
  loadPosition(root);
  setupDrag(root);
  setupOutsideClick(root);
  updateUI(root);

  // Refresh every 30 seconds
  setInterval(() => updateUI(root), 30000);
})();
