const state = {
  analysis: null,
  section: "overview",
  filter: "all",
  recent: [],
  theme: "dark",
  resourceChart: null,
  severityChart: null,
  scoreCharts: []
};

const elements = {
  urlInput: document.getElementById("urlInput"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  cmdBtn: document.getElementById("cmdBtn"),
  sidebarCmdBtn: document.getElementById("sidebarCmdBtn"),
  themeBtn: document.getElementById("themeBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportHtmlBtn: document.getElementById("exportHtmlBtn"),
  welcomeState: document.getElementById("welcomeState"),
  resultsState: document.getElementById("resultsState"),
  siteTitle: document.getElementById("siteTitle"),
  siteUrl: document.getElementById("siteUrl"),
  overallGrade: document.getElementById("overallGrade"),
  analysisDuration: document.getElementById("analysisDuration"),
  issueCountSummary: document.getElementById("issueCountSummary"),
  qualitySignal: document.getElementById("qualitySignal"),
  statsGrid: document.getElementById("statsGrid"),
  scoresGrid: document.getElementById("scoresGrid"),
  recommendationsList: document.getElementById("recommendationsList"),
  signalList: document.getElementById("signalList"),
  performanceGrid: document.getElementById("performanceGrid"),
  performanceTips: document.getElementById("performanceTips"),
  headingList: document.getElementById("headingList"),
  imageList: document.getElementById("imageList"),
  a11ySummary: document.getElementById("a11ySummary"),
  metaList: document.getElementById("metaList"),
  linkList: document.getElementById("linkList"),
  seoChecklist: document.getElementById("seoChecklist"),
  domTree: document.getElementById("domTree"),
  domNodeCount: document.getElementById("domNodeCount"),
  scriptList: document.getElementById("scriptList"),
  domLinkSummary: document.getElementById("domLinkSummary"),
  issuesList: document.getElementById("issuesList"),
  recentList: document.getElementById("recentList"),
  inspectorBody: document.getElementById("inspectorBody"),
  toast: document.getElementById("toast"),
  toastTitle: document.getElementById("toastTitle"),
  toastMessage: document.getElementById("toastMessage"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  statusUrl: document.getElementById("statusUrl"),
  statusTime: document.getElementById("statusTime"),
  resourceChartCanvas: document.getElementById("resourceChart"),
  severityChartCanvas: document.getElementById("severityChart")
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function createAnalysis(url) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const issueTemplates = [
    {
      severity: "critical",
      title: "Images missing alt attributes",
      description: () => `${randomInt(3, 10)} image elements are missing helpful alt text.`,
      category: "Accessibility",
      recommendation: "Add descriptive alt text for meaningful media and empty alt values for decorative images."
    },
    {
      severity: "critical",
      title: "Missing meta description",
      description: () => "The page is missing a meta description for search result previews.",
      category: "SEO",
      recommendation: "Add a concise meta description around 150-160 characters."
    },
    {
      severity: "warning",
      title: "Render-blocking JavaScript",
      description: () => `${randomInt(2, 6)} scripts are loading before the page can paint.`,
      category: "Performance",
      recommendation: "Use defer or async on non-critical scripts and move non-essential work later."
    },
    {
      severity: "warning",
      title: "Heading hierarchy skips levels",
      description: () => "The content outline jumps from H2 to H4 in at least one section.",
      category: "Accessibility",
      recommendation: "Keep heading levels in order so assistive tech can follow the content structure."
    },
    {
      severity: "info",
      title: "Canonical tag missing",
      description: () => "No canonical URL was detected for the page.",
      category: "SEO",
      recommendation: "Add a canonical link element to reduce duplicate-content ambiguity."
    },
    {
      severity: "info",
      title: "Third-party domains could use preconnect",
      description: () => `${randomInt(2, 5)} external origins are loaded without preconnect hints.`,
      category: "Performance",
      recommendation: "Add preconnect for the most expensive third-party origins."
    }
  ];

  const issues = issueTemplates.map((template, index) => ({
    id: `${template.severity}-${index}`,
    severity: template.severity,
    title: template.title,
    description: template.description(),
    category: template.category,
    count: template.severity === "info" ? 1 : randomInt(1, 8),
    recommendation: template.recommendation
  }));

  const scores = {
    performance: randomInt(55, 94),
    accessibility: randomInt(60, 96),
    seo: randomInt(58, 97),
    bestPractices: randomInt(63, 95)
  };

  const images = Array.from({ length: randomInt(7, 18) }, (_, index) => ({
    src: `/assets/image-${index + 1}.jpg`,
    alt: index % 3 === 0 ? "" : `Image description ${index + 1}`,
    sizeKb: randomInt(40, 420),
    lazy: index % 2 === 0
  }));

  const headings = [
    { tag: "H1", text: `${domain} home`, valid: true },
    { tag: "H2", text: "Features", valid: true },
    { tag: "H3", text: "Core product", valid: true },
    { tag: "H4", text: "Enterprise details", valid: false },
    { tag: "H2", text: "Pricing", valid: true }
  ];

  const links = [
    { text: "Home", href: "/", external: false },
    { text: "Pricing", href: "/pricing", external: false },
    { text: "Docs", href: "/docs", external: false },
    { text: "GitHub", href: `https://github.com/${domain}`, external: true }
  ];

  const scripts = Array.from({ length: randomInt(4, 9) }, (_, index) => ({
    name: index % 3 === 0 ? "inline script" : `bundle-${index + 1}.js`,
    type: index % 2 === 0 ? "module" : "classic",
    blocking: index % 3 === 0,
    sizeKb: randomInt(18, 240)
  }));

  return {
    url,
    domain,
    title: `${domain} audit snapshot`,
    analyzedAt: new Date().toISOString(),
    duration: randomInt(900, 2600),
    scores,
    stats: {
      totalElements: randomInt(220, 860),
      domDepth: randomInt(10, 24),
      images: images.length,
      scripts: randomInt(4, 12),
      stylesheets: randomInt(2, 7),
      links: links.length + randomInt(16, 50),
      forms: randomInt(0, 4),
      iframes: randomInt(0, 2)
    },
    performance: {
      fcp: (randomInt(9, 24) / 10).toFixed(1),
      lcp: (randomInt(20, 45) / 10).toFixed(1),
      cls: (randomInt(1, 18) / 100).toFixed(2),
      tbt: randomInt(120, 780),
      ttfb: randomInt(90, 540),
      requestCount: randomInt(18, 90),
      resourceSizeKb: randomInt(500, 2800)
    },
    issues,
    headings,
    images,
    links,
    scripts,
    meta: {
      viewport: true,
      charset: true,
      description: randomInt(0, 1) === 1,
      canonical: false,
      ogTitle: randomInt(0, 1) === 1,
      ogImage: randomInt(0, 1) === 1,
      robots: true,
      lang: "en"
    },
    domNodes: [
      "<html>",
      "  <head>",
      "    <meta charset=\"UTF-8\">",
      "    <title>...</title>",
      "  <body>",
      "    <header class=\"site-header\">",
      "    <main id=\"content\">",
      "      <section class=\"hero\">",
      "      <section class=\"features\">",
      "    <footer class=\"site-footer\">"
    ]
  };
}

function getAverageScore(scores) {
  const values = Object.values(scores);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}

function getGradeClass(grade) {
  return `grade-${grade.toLowerCase()}`;
}

function getSeverityClass(severity) {
  return `severity-${severity}`;
}

function icon(name) {
  return `<svg class="ui-icon"><use href="#icon-${name}"></use></svg>`;
}

function createStackItem(iconName, title, meta, statusHtml = "") {
  return `
    <div class="stack-item">
      <div class="issue-topline">
        <div class="stack-title">
          <span class="stat-icon-wrap">${icon(iconName)}</span>
          <strong>${title}</strong>
        </div>
        ${statusHtml}
      </div>
      ${meta ? `<div class="stack-meta">${meta}</div>` : ""}
    </div>
  `;
}

function setStatus(text, url = "No analysis", loading = false) {
  elements.statusText.textContent = text;
  elements.statusUrl.textContent = url;
  elements.statusTime.textContent = new Date().toLocaleTimeString();
  elements.statusDot.classList.toggle("loading", loading);
}

function showToast(title, message) {
  elements.toastTitle.textContent = title;
  elements.toastMessage.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2800);
}

function setButtonContent(button, iconName, label) {
  button.innerHTML = `${icon(iconName)}${label}`;
}

function setIconButton(button, iconName) {
  button.innerHTML = icon(iconName);
}

function renderStats(analysis) {
  const cards = [
    ["layers", "DOM nodes", analysis.stats.totalElements, `Depth ${analysis.stats.domDepth}`],
    ["image", "Images", analysis.stats.images, `${analysis.images.filter((image) => !image.alt).length} missing alt`],
    ["code", "Scripts", analysis.stats.scripts, `${analysis.performance.requestCount} requests`],
    ["link", "Links", analysis.stats.links, `${analysis.links.filter((link) => link.external).length} external`]
  ];

  elements.statsGrid.innerHTML = cards.map(([iconName, label, value, subtitle]) => `
    <div class="stat-card">
      <div class="stat-head">
        <div class="eyebrow">${label}</div>
        <span class="stat-icon-wrap">${icon(iconName)}</span>
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-subtitle">${subtitle}</div>
    </div>
  `).join("");
}

function renderScores(analysis) {
  state.scoreCharts.forEach((chart) => chart.destroy());
  state.scoreCharts = [];

  const scoreEntries = [
    ["performance", "Performance", "gauge"],
    ["accessibility", "Accessibility", "accessibility"],
    ["seo", "SEO", "search"],
    ["bestPractices", "Best Practices", "check"]
  ];

  elements.scoresGrid.innerHTML = scoreEntries.map(([key, label, iconName]) => `
    <div class="score-card">
      <div class="score-head">
        <span class="score-icon-wrap">${icon(iconName)}</span>
      </div>
      <canvas class="score-ring" id="score-${key}" width="96" height="96"></canvas>
      <div class="score-label">${label}</div>
      <div class="stat-value">${analysis.scores[key]}</div>
    </div>
  `).join("");

  scoreEntries.forEach(([key]) => {
    const score = analysis.scores[key];
    const chart = new Chart(document.getElementById(`score-${key}`), {
      type: "doughnut",
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [getChartColor(score), "rgba(255,255,255,0.08)"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: false,
        cutout: "78%",
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        events: []
      }
    });
    state.scoreCharts.push(chart);
  });
}

function renderOverviewPanels(analysis) {
  const topIssues = analysis.issues.slice().sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity)).slice(0, 3);
  elements.recommendationsList.innerHTML = topIssues.map((issue) =>
    createStackItem(
      issue.category === "Performance" ? "gauge" : issue.category === "SEO" ? "search" : "accessibility",
      issue.title,
      issue.recommendation,
      `<span class="severity ${getSeverityClass(issue.severity)}">${issue.severity}</span>`
    )
  ).join("");

  const avg = getAverageScore(analysis.scores);
  elements.qualitySignal.textContent = avg >= 85 ? "Strong signal" : avg >= 70 ? "Mixed signal" : "Needs work";

  const signals = [
    ["globe", "Scanned domain", analysis.domain, `<span class="severity severity-info">Live</span>`],
    ["spark", "Overall score", `${avg}/100 average across major categories`, `<span class="severity ${avg >= 75 ? "severity-info" : "severity-warning"}">${getGrade(avg)}</span>`],
    ["alert", "Highest risk", `${analysis.issues.filter((issue) => issue.severity === "critical").length} critical issues detected`, `<span class="severity severity-critical">Priority</span>`]
  ];

  elements.signalList.innerHTML = signals.map(([iconName, title, meta, statusHtml]) =>
    createStackItem(iconName, title, meta, statusHtml)
  ).join("");
}

function severityWeight(severity) {
  return { critical: 0, warning: 1, info: 2 }[severity] ?? 3;
}

function getChartColor(score) {
  if (score >= 90) return "#59e390";
  if (score >= 75) return "#5fd0ff";
  if (score >= 60) return "#ffd166";
  return "#ff7a7a";
}

function renderOverviewCharts(analysis) {
  if (state.resourceChart) state.resourceChart.destroy();
  if (state.severityChart) state.severityChart.destroy();

  state.resourceChart = new Chart(elements.resourceChartCanvas, {
    type: "bar",
    data: {
      labels: ["Images", "Scripts", "Styles", "Links", "Forms", "Iframes"],
      datasets: [{
        data: [
          analysis.stats.images,
          analysis.stats.scripts,
          analysis.stats.stylesheets,
          analysis.stats.links,
          analysis.stats.forms,
          analysis.stats.iframes
        ],
        backgroundColor: ["#5fd0ff", "#1ca3ff", "#59e390", "#ffb86b", "#ffd166", "#ff7a7a"],
        borderRadius: 10
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#99aeca" }, grid: { display: false } },
        y: { ticks: { color: "#99aeca" }, grid: { color: "rgba(255,255,255,0.08)" }, beginAtZero: true }
      }
    }
  });

  const severities = {
    critical: analysis.issues.filter((issue) => issue.severity === "critical").length,
    warning: analysis.issues.filter((issue) => issue.severity === "warning").length,
    info: analysis.issues.filter((issue) => issue.severity === "info").length
  };

  state.severityChart = new Chart(elements.severityChartCanvas, {
    type: "doughnut",
    data: {
      labels: ["Critical", "Warning", "Info"],
      datasets: [{
        data: [severities.critical, severities.warning, severities.info],
        backgroundColor: ["#ff7a7a", "#ffd166", "#5fd0ff"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: {
          labels: { color: "#99aeca" }
        }
      }
    }
  });
}

function renderPerformance(analysis) {
  const metrics = [
    ["First Contentful Paint", `${analysis.performance.fcp}s`],
    ["Largest Contentful Paint", `${analysis.performance.lcp}s`],
    ["Cumulative Layout Shift", analysis.performance.cls],
    ["Total Blocking Time", `${analysis.performance.tbt}ms`],
    ["Time to First Byte", `${analysis.performance.ttfb}ms`],
    ["Transfer Size", `${analysis.performance.resourceSizeKb}KB`],
    ["Requests", analysis.performance.requestCount],
    ["DOM Depth", analysis.stats.domDepth]
  ];

  elements.performanceGrid.innerHTML = metrics.map(([label, value]) => `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </div>
  `).join("");

  const tips = [
    ["gauge", "Defer non-critical JavaScript", `${analysis.scripts.filter((script) => script.blocking).length} blocking scripts should move off the critical path.`],
    ["download", "Trim transfer size", `${analysis.performance.resourceSizeKb}KB total payload could be reduced with image compression and code splitting.`],
    ["spark", "Improve server response", `${analysis.performance.ttfb}ms TTFB suggests backend or caching headroom.`]
  ];

  elements.performanceTips.innerHTML = tips.map(([iconName, title, meta]) => createStackItem(iconName, title, meta)).join("");
}

function renderAccessibility(analysis) {
  elements.headingList.innerHTML = analysis.headings.map((heading) => `
    ${createStackItem("layers", heading.tag, heading.text, `<span class="severity ${heading.valid ? "severity-info" : "severity-warning"}">${heading.valid ? "Valid" : "Review"}</span>`)}
  `).join("");

  elements.imageList.innerHTML = analysis.images.map((image) => `
    ${createStackItem("image", image.src, `${image.sizeKb}KB | ${image.lazy ? "Lazy loaded" : "Eager loaded"}`, `<span class="severity ${image.alt ? "severity-info" : "severity-critical"}">${image.alt ? "Tagged" : "Missing alt"}</span>`)}
  `).join("");

  const emptyAltCount = analysis.images.filter((image) => !image.alt).length;
  const invalidHeadings = analysis.headings.filter((heading) => !heading.valid).length;
  elements.a11ySummary.innerHTML = [
    ["accessibility", "Alt text coverage", `${analysis.images.length - emptyAltCount}/${analysis.images.length} images are tagged.`],
    ["layers", "Heading order", invalidHeadings ? `${invalidHeadings} heading transitions need attention.` : "Heading order looks consistent."],
    ["check", "Keyboard-safe controls", "Interactive controls are modeled with clear labels and button semantics."]
  ].map(([iconName, title, meta]) => createStackItem(iconName, title, meta)).join("");
}

function renderSeo(analysis) {
  const metaEntries = [
    ["Viewport", analysis.meta.viewport],
    ["Charset", analysis.meta.charset],
    ["Meta description", analysis.meta.description],
    ["Canonical", analysis.meta.canonical],
    ["Open Graph title", analysis.meta.ogTitle],
    ["Open Graph image", analysis.meta.ogImage],
    ["Robots", analysis.meta.robots]
  ];

  elements.metaList.innerHTML = metaEntries.map(([label, present]) => `
    ${createStackItem("search", label, "", `<span class="severity ${present ? "severity-info" : "severity-warning"}">${present ? "Present" : "Missing"}</span>`)}
  `).join("");

  elements.linkList.innerHTML = analysis.links.map((link) => `
    ${createStackItem("link", link.text, `<span class="mono">${link.href}</span>`, `<span class="severity ${link.external ? "severity-warning" : "severity-info"}">${link.external ? "External" : "Internal"}</span>`)}
  `).join("");

  elements.seoChecklist.innerHTML = [
    ["search", "Title and description", analysis.meta.description ? "Description is available for search previews." : "Meta description is missing from the preview metadata."],
    ["globe", "Canonical handling", analysis.meta.canonical ? "Canonical URL detected." : "Add a canonical URL to reduce duplicate-content ambiguity."],
    ["image", "Social cards", analysis.meta.ogImage ? "Open Graph image present." : "Social preview image is missing."]
  ].map(([iconName, title, meta]) => createStackItem(iconName, title, meta)).join("");
}

function renderDom(analysis) {
  elements.domNodeCount.textContent = `${analysis.stats.totalElements} nodes`;
  elements.domTree.innerHTML = analysis.domNodes.map((node) => `
    <div class="dom-node"><code>${escapeHtml(node)}</code></div>
  `).join("");

  elements.scriptList.innerHTML = analysis.scripts.map((script) =>
    createStackItem(
      "code",
      script.name,
      `${script.type} | ${script.sizeKb}KB`,
      `<span class="severity ${script.blocking ? "severity-warning" : "severity-info"}">${script.blocking ? "Blocking" : "Deferred"}</span>`
    )
  ).join("");

  const textlessLinks = randomInt(0, 3);
  elements.domLinkSummary.innerHTML = [
    ["link", "External links", `${analysis.links.filter((link) => link.external).length} outbound destinations detected.`],
    ["alert", "Textless links", textlessLinks ? `${textlessLinks} links should get clearer visible labels.` : "Visible link labels look healthy."],
    ["layers", "DOM depth", `Tree reaches ${analysis.stats.domDepth} levels at its deepest point.`]
  ].map(([iconName, title, meta]) => createStackItem(iconName, title, meta)).join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getFilteredIssues() {
  if (!state.analysis) return [];
  if (state.filter === "all") return state.analysis.issues;
  return state.analysis.issues.filter((issue) => issue.severity === state.filter);
}

function renderIssues() {
  const issues = getFilteredIssues();
  elements.issuesList.innerHTML = issues.map((issue) => `
    <button class="issue-card" type="button" data-issue-id="${issue.id}">
      <div class="issue-topline">
        <div class="stack-title">
          <span class="stat-icon-wrap">${icon(issue.category === "Performance" ? "gauge" : issue.category === "SEO" ? "search" : "alert")}</span>
          <strong>${issue.title}</strong>
        </div>
        <span class="severity ${getSeverityClass(issue.severity)}">${issue.severity}</span>
      </div>
      <p>${issue.description}</p>
      <div class="stack-meta">${issue.category} | ${issue.count} occurrence${issue.count === 1 ? "" : "s"}</div>
    </button>
  `).join("");

  if (issues[0]) {
    renderInspector(issues[0].id);
  }
}

function renderInspector(issueId) {
  const issue = state.analysis?.issues.find((entry) => entry.id === issueId);
  if (!issue) return;

  elements.inspectorBody.innerHTML = `
    <div class="inspector-group">
      <div class="eyebrow">Issue</div>
      <h4>${issue.title}</h4>
      <p>${issue.description}</p>
    </div>
    <div class="inspector-group">
      <div class="inspector-row"><span>Severity</span><strong>${issue.severity}</strong></div>
      <div class="inspector-row"><span>Category</span><strong>${issue.category}</strong></div>
      <div class="inspector-row"><span>Occurrences</span><strong>${issue.count}</strong></div>
    </div>
    <div class="inspector-group">
      <div class="eyebrow">Recommendation</div>
      <p>${issue.recommendation}</p>
    </div>
  `;
}

function renderRecent() {
  if (!state.recent.length) {
    elements.recentList.innerHTML = `<div class="empty-copy mono-copy">No history yet</div>`;
    return;
  }

  elements.recentList.innerHTML = state.recent.map((item) => `
    <button class="plain-action" type="button" data-recent-url="${item.url}">
      ${icon("globe")}${item.domain}
    </button>
  `).join("");
}

function renderAnalysis(analysis) {
  state.analysis = analysis;
  elements.welcomeState.classList.add("hidden");
  elements.resultsState.classList.remove("hidden");

  elements.siteTitle.textContent = analysis.title;
  elements.siteUrl.textContent = analysis.url;
  elements.analysisDuration.textContent = `Completed in ${(analysis.duration / 1000).toFixed(1)}s`;
  elements.issueCountSummary.textContent = `${analysis.issues.length} issues found`;

  const averageScore = getAverageScore(analysis.scores);
  const grade = getGrade(averageScore);
  elements.overallGrade.textContent = grade;
  elements.overallGrade.className = `grade-chip ${getGradeClass(grade)}`;

  renderStats(analysis);
  renderScores(analysis);
  renderOverviewPanels(analysis);
  renderOverviewCharts(analysis);
  renderPerformance(analysis);
  renderAccessibility(analysis);
  renderSeo(analysis);
  renderDom(analysis);
  renderIssues();
  switchSection(state.section);
}

function switchSection(section) {
  state.section = section;
  document.querySelectorAll(".section-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `section-${section}`);
  });
  document.querySelectorAll(".nav-link[data-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
}

async function runAnalysis() {
  const url = normalizeUrl(elements.urlInput.value);
  if (!url) {
    showToast("Missing URL", "Enter a domain or URL before analyzing.");
    return;
  }

  elements.analyzeBtn.disabled = true;
  setButtonContent(elements.analyzeBtn, "spark", "Analyzing...");
  setStatus("Running analysis", url, true);

  await new Promise((resolve) => setTimeout(resolve, randomInt(900, 1500)));

  const analysis = createAnalysis(url);
  state.recent = [{ url: analysis.url, domain: analysis.domain }, ...state.recent.filter((item) => item.url !== analysis.url)].slice(0, 5);
  renderRecent();
  renderAnalysis(analysis);

  elements.analyzeBtn.disabled = false;
  setButtonContent(elements.analyzeBtn, "spark", "Analyze");
  setStatus("Analysis complete", url, false);
  showToast("Analysis complete", `${analysis.issues.length} issues found for ${analysis.domain}.`);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportJson() {
  if (!state.analysis) {
    showToast("Nothing to export", "Run an analysis first.");
    return;
  }

  downloadFile(`devlens-${state.analysis.domain}.json`, JSON.stringify(state.analysis, null, 2), "application/json");
  showToast("Export ready", "JSON report downloaded.");
}

function exportHtml() {
  if (!state.analysis) {
    showToast("Nothing to export", "Run an analysis first.");
    return;
  }

  const report = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DevLens Report - ${state.analysis.domain}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; background: #0b1220; color: #eaf2ff; }
    .card { border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; margin-bottom: 16px; background: rgba(255,255,255,0.04); }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(95,208,255,0.15); margin-right: 8px; }
  </style>
</head>
<body>
  <h1>DevLens Report</h1>
  <p>${state.analysis.url}</p>
  <div class="card">
    <h2>Scores</h2>
    <div class="row">
      ${Object.entries(state.analysis.scores).map(([key, value]) => `<div class="pill">${key}: ${value}</div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h2>Issues</h2>
    ${state.analysis.issues.map((issue) => `<p><strong>${issue.title}</strong> - ${issue.description}</p>`).join("")}
  </div>
</body>
</html>`.trim();

  downloadFile(`devlens-${state.analysis.domain}.html`, report, "text/html");
  showToast("Export ready", "HTML report downloaded.");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.body.classList.toggle("light-theme", state.theme === "light");
  showToast("Theme updated", state.theme === "light" ? "Light mode enabled." : "Dark mode enabled.");
}

function openCommandPalette() {
  showToast("Command palette", "Shortcut actions are available via Ctrl+K.");
}

function handleDocumentClick(event) {
  const issueCard = event.target.closest("[data-issue-id]");
  if (issueCard) {
    renderInspector(issueCard.dataset.issueId);
    return;
  }

  const recentButton = event.target.closest("[data-recent-url]");
  if (recentButton) {
    elements.urlInput.value = recentButton.dataset.recentUrl.replace(/^https?:\/\//i, "");
    runAnalysis();
  }
}

function updateClock() {
  elements.statusTime.textContent = new Date().toLocaleTimeString();
}

function updateMobileHeaderState() {
  const isMobileWidth = window.innerWidth <= 760;
  const shouldCompact = isMobileWidth && window.scrollY > 32;
  document.body.classList.toggle("mobile-header-compact", shouldCompact);
}

document.querySelectorAll(".nav-link[data-section]").forEach((button) => {
  button.addEventListener("click", () => switchSection(button.dataset.section));
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderIssues();
  });
});

elements.analyzeBtn.addEventListener("click", runAnalysis);
elements.cmdBtn.addEventListener("click", openCommandPalette);
elements.sidebarCmdBtn.addEventListener("click", openCommandPalette);
elements.themeBtn.addEventListener("click", toggleTheme);
elements.exportJsonBtn.addEventListener("click", exportJson);
elements.exportHtmlBtn.addEventListener("click", exportHtml);
elements.urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runAnalysis();
});

document.addEventListener("click", handleDocumentClick);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runAnalysis();
  }
});

window.addEventListener("scroll", updateMobileHeaderState, { passive: true });
window.addEventListener("resize", updateMobileHeaderState);

setStatus("Ready");
setButtonContent(elements.analyzeBtn, "spark", "Analyze");
setIconButton(elements.themeBtn, "moon");
setIconButton(elements.cmdBtn, "command");
setIconButton(elements.exportJsonBtn, "download");
updateMobileHeaderState();
updateClock();
setInterval(updateClock, 1000);
