
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
  sidebarToggleBtn: document.getElementById("sidebarToggleBtn"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  commandPalette: document.getElementById("commandPalette"),
  commandInput: document.getElementById("commandInput"),
  commandList: document.getElementById("commandList"),
  closeCommandBtn: document.getElementById("closeCommandBtn"),
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

const PAGE_SPEED_API_KEY_STORAGE = "devlensPageSpeedApiKey";
const THEME_STORAGE = "devlensTheme";
let commandSelection = 0;

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchPageSpeedAnalysis(url) {
  const endpoint = new URL("https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("locale", "en");
  const apiKey = getStoredPageSpeedApiKey();
  if (apiKey) endpoint.searchParams.set("key", apiKey);
  ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"].forEach((category) => {
    endpoint.searchParams.append("category", category);
  });

  const response = await fetch(endpoint.toString());
  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "PageSpeed Insights could not analyze this URL.";
    throw new Error(message);
  }

  if (data?.lighthouseResult?.runtimeError) {
    throw new Error(data.lighthouseResult.runtimeError.message);
  }

  return transformPageSpeedResult(url, data);
}

function getStoredPageSpeedApiKey() {
  const configKey = window.DEVLENS_CONFIG?.PAGESPEED_API_KEY?.trim() || "";
  if (configKey) {
    localStorage.setItem(PAGE_SPEED_API_KEY_STORAGE, configKey);
    return configKey;
  }

  return localStorage.getItem(PAGE_SPEED_API_KEY_STORAGE) || "";
}

function savePageSpeedApiKey(apiKey) {
  localStorage.setItem(PAGE_SPEED_API_KEY_STORAGE, apiKey.trim());
}

function isQuotaError(error) {
  return /quota|rate limit|limit/i.test(error.message);
}

function requestPageSpeedApiKey() {
  const apiKey = window.prompt("PageSpeed quota was reached. Paste your Google PageSpeed Insights API key to run real audits from your own quota.");
  if (!apiKey || !apiKey.trim()) return false;
  savePageSpeedApiKey(apiKey);
  showToast("API key saved", "The key is stored only in this browser using localStorage.");
  return true;
}

function transformPageSpeedResult(requestedUrl, data) {
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse.audits || {};
  const categories = lighthouse.categories || {};
  const finalUrl = lighthouse.finalDisplayedUrl || lighthouse.finalUrl || requestedUrl;
  const domain = new URL(finalUrl).hostname.replace(/^www\./, "");
  const resourceSummary = getResourceSummary(audits["resource-summary"]);
  const networkRequests = getAuditItems(audits["network-requests"]);
  const totalElements = Math.round(getNumericAuditValue(audits["dom-size"], 0));

  const issues = buildIssuesFromLighthouse(categories, audits);

  return {
    url: finalUrl,
    requestedUrl,
    domain,
    title: `${domain} Lighthouse audit`,
    analyzedAt: lighthouse.fetchTime || new Date().toISOString(),
    duration: Math.round(lighthouse.timing?.total || 0),
    scores: {
      performance: scoreToPercent(categories.performance?.score),
      accessibility: scoreToPercent(categories.accessibility?.score),
      seo: scoreToPercent(categories.seo?.score),
      bestPractices: scoreToPercent(categories["best-practices"]?.score)
    },
    stats: {
      totalElements,
      domDepth: Math.round(getNumericAuditValue(audits["dom-size"], 0)),
      images: resourceSummary.image?.count || 0,
      scripts: resourceSummary.script?.count || 0,
      stylesheets: resourceSummary.stylesheet?.count || 0,
      links: 0,
      forms: 0,
      iframes: resourceSummary.other?.count || 0
    },
    performance: {
      fcp: millisecondsToSeconds(getNumericAuditValue(audits["first-contentful-paint"], 0)),
      lcp: millisecondsToSeconds(getNumericAuditValue(audits["largest-contentful-paint"], 0)),
      cls: formatMetric(getNumericAuditValue(audits["cumulative-layout-shift"], 0), 2),
      tbt: Math.round(getNumericAuditValue(audits["total-blocking-time"], 0)),
      ttfb: Math.round(getNumericAuditValue(audits["server-response-time"], 0)),
      requestCount: networkRequests.length,
      resourceSizeKb: bytesToKb(getNumericAuditValue(audits["total-byte-weight"], 0))
    },
    issues,
    headings: buildHeadingData(audits["heading-order"]),
    images: buildImageData(audits["image-alt"], resourceSummary.image?.count || 0),
    links: [],
    scripts: buildScriptData(networkRequests),
    meta: {
      viewport: auditPassed(audits.viewport),
      charset: true,
      description: auditPassed(audits["meta-description"]),
      canonical: auditPassed(audits.canonical),
      ogTitle: auditPassed(audits["document-title"]),
      ogImage: auditPassed(audits["crawlable-anchors"]),
      robots: auditPassed(audits["robots-txt"]),
      lang: auditPassed(audits["html-has-lang"]) ? "en" : null
    },
    domNodes: buildDomSummary(lighthouse, audits),
    source: "Google PageSpeed Insights API",
    rawPageSpeedResult: data
  };
}

function scoreToPercent(score) {
  return typeof score === "number" ? Math.round(score * 100) : 0;
}

function getNumericAuditValue(audit, fallback) {
  return typeof audit?.numericValue === "number" ? audit.numericValue : fallback;
}

function auditPassed(audit) {
  return audit?.score === 1;
}

function formatMetric(value, digits) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "0";
}

function millisecondsToSeconds(value) {
  return formatMetric(value / 1000, 1);
}

function bytesToKb(value) {
  return Math.round((value || 0) / 1024);
}

function getAuditItems(audit) {
  return Array.isArray(audit?.details?.items) ? audit.details.items : [];
}

function getResourceSummary(audit) {
  return getAuditItems(audit).reduce((summary, item) => {
    const type = item.resourceType || "other";
    summary[type] = {
      count: Number(item.requestCount || 0),
      transferSize: Number(item.transferSize || 0)
    };
    return summary;
  }, {});
}

function buildIssuesFromLighthouse(categories, audits) {
  const categoryLabels = {
    performance: "Performance",
    accessibility: "Accessibility",
    seo: "SEO",
    "best-practices": "Best Practices"
  };

  const issueMap = new Map();
  Object.entries(categories).forEach(([categoryKey, category]) => {
    (category.auditRefs || []).forEach((ref) => {
      const audit = audits[ref.id];
      if (!shouldShowAuditIssue(audit)) return;
      issueMap.set(ref.id, {
        id: ref.id,
        severity: getSeverityFromAudit(audit),
        title: audit.title || ref.id,
        description: audit.description || audit.displayValue || "Review this Lighthouse audit.",
        category: categoryLabels[categoryKey] || category.title || "Audit",
        count: getAuditIssueCount(audit),
        recommendation: audit.displayValue || audit.description || "Review the Lighthouse recommendation for this audit.",
        score: audit.score
      });
    });
  });

  return Array.from(issueMap.values())
    .sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity))
    .slice(0, 30);
}

function shouldShowAuditIssue(audit) {
  if (!audit) return false;
  if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "manual") return false;
  if (audit.score === null || audit.score === undefined) return false;
  return audit.score < 1;
}

function getSeverityFromAudit(audit) {
  if (audit.score === 0) return "critical";
  if (audit.score < 0.9) return "warning";
  return "info";
}

function getAuditIssueCount(audit) {
  const itemCount = getAuditItems(audit).length;
  return itemCount || 1;
}

function buildHeadingData(audit) {
  const items = getAuditItems(audit);
  if (!items.length) {
    return [{ tag: "Headings", text: auditPassed(audit) ? "Heading order passed Lighthouse checks." : "No detailed heading rows were returned.", valid: auditPassed(audit) }];
  }

  return items.slice(0, 10).map((item, index) => ({
    tag: item.node?.nodeLabel?.match(/^h[1-6]/i)?.[0]?.toUpperCase() || `Item ${index + 1}`,
    text: item.node?.snippet || item.node?.nodeLabel || "Heading issue detected",
    valid: false
  }));
}

function buildImageData(audit, totalImageCount) {
  const failedImages = getAuditItems(audit);
  if (!failedImages.length) {
    return Array.from({ length: Math.min(totalImageCount, 1) }, (_, index) => ({
      src: index === 0 ? "Lighthouse image audit" : `Image ${index + 1}`,
      alt: "Passed",
      sizeKb: 0,
      lazy: true
    }));
  }

  return failedImages.slice(0, 20).map((item, index) => ({
    src: item.node?.snippet || item.url || `Image ${index + 1}`,
    alt: "",
    sizeKb: 0,
    lazy: Boolean(item.node)
  }));
}

function buildScriptData(networkRequests) {
  const scripts = networkRequests
    .filter((item) => (item.url || "").includes(".js") || item.resourceType === "Script")
    .slice(0, 12)
    .map((item) => ({
      name: getUrlFileName(item.url) || "JavaScript resource",
      type: "network",
      blocking: Number(item.resourceSize || item.transferSize || 0) > 100000,
      sizeKb: bytesToKb(Number(item.transferSize || item.resourceSize || 0))
    }));

  return scripts.length ? scripts : [{ name: "No script resources exposed", type: "Lighthouse", blocking: false, sizeKb: 0 }];
}

function getUrlFileName(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").filter(Boolean).pop() || url;
  } catch {
    return url || "";
  }
}

function buildDomSummary(lighthouse, audits) {
  return [
    `<html lang="${lighthouse.configSettings?.locale || "en"}">`,
    `  <url>${lighthouse.finalDisplayedUrl || lighthouse.finalUrl || "Analyzed URL"}</url>`,
    `  <form-factor>${lighthouse.configSettings?.formFactor || "mobile"}</form-factor>`,
    `  <nodes>${Math.round(getNumericAuditValue(audits["dom-size"], 0))}</nodes>`,
    `  <fetch-time>${lighthouse.fetchTime || "Unknown"}</fetch-time>`
  ];
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
    ["link", "Links", analysis.stats.links, analysis.stats.links ? `${analysis.links.filter((link) => link.external).length} external` : "Not exposed by API"]
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
  const chartTheme = getChartTheme();

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
          backgroundColor: [getChartColor(score), chartTheme.track],
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

function getChartTheme() {
  const isLightTheme = document.body.classList.contains("light-theme");
  return {
    label: isLightTheme ? "#576884" : "#99aeca",
    grid: isLightTheme ? "rgba(73, 95, 130, 0.12)" : "rgba(255,255,255,0.08)",
    track: isLightTheme ? "rgba(24, 35, 53, 0.1)" : "rgba(255,255,255,0.08)"
  };
}

function renderOverviewCharts(analysis) {
  if (state.resourceChart) state.resourceChart.destroy();
  if (state.severityChart) state.severityChart.destroy();
  const chartTheme = getChartTheme();

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
        x: { ticks: { color: chartTheme.label }, grid: { display: false } },
        y: { ticks: { color: chartTheme.label }, grid: { color: chartTheme.grid }, beginAtZero: true }
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
          labels: { color: chartTheme.label }
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

  elements.domLinkSummary.innerHTML = [
    ["link", "External links", analysis.links.length ? `${analysis.links.filter((link) => link.external).length} outbound destinations detected.` : "PageSpeed Insights does not return a full link inventory."],
    ["alert", "Anchor audit", auditPassed(analysis.rawPageSpeedResult?.lighthouseResult?.audits?.["crawlable-anchors"]) ? "Crawlable anchor checks passed." : "Review crawlable anchor recommendations in the SEO section."],
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
  if (!issues.length) {
    elements.issuesList.innerHTML = `<div class="empty-copy">No issues returned for this filter.</div>`;
    elements.inspectorBody.innerHTML = `<div class="empty-copy">Select another filter or review the overview for passing audits.</div>`;
    return;
  }

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

  try {
    const analysis = await fetchPageSpeedAnalysis(url);
    state.recent = [{ url: analysis.url, domain: analysis.domain }, ...state.recent.filter((item) => item.url !== analysis.url)].slice(0, 5);
    renderRecent();
    renderAnalysis(analysis);
    setStatus("Analysis complete", url, false);
    showToast("Analysis complete", `${analysis.issues.length} Lighthouse issues found for ${analysis.domain}.`);
  } catch (error) {
    if (isQuotaError(error) && requestPageSpeedApiKey()) {
      try {
        const analysis = await fetchPageSpeedAnalysis(url);
        state.recent = [{ url: analysis.url, domain: analysis.domain }, ...state.recent.filter((item) => item.url !== analysis.url)].slice(0, 5);
        renderRecent();
        renderAnalysis(analysis);
        setStatus("Analysis complete", url, false);
        showToast("Analysis complete", `${analysis.issues.length} Lighthouse issues found for ${analysis.domain}.`);
        return;
      } catch (retryError) {
        setStatus("Analysis failed", url, false);
        showToast("Analysis failed", retryError.message);
        return;
      }
    }
    setStatus("Analysis failed", url, false);
    showToast("Analysis failed", error.message);
  } finally {
    elements.analyzeBtn.disabled = false;
    setButtonContent(elements.analyzeBtn, "spark", "Analyze");
  }
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
  localStorage.setItem(THEME_STORAGE, state.theme);
  document.body.classList.toggle("light-theme", state.theme === "light");
  if (state.analysis) {
    renderScores(state.analysis);
    renderOverviewCharts(state.analysis);
  }
  showToast("Theme updated", state.theme === "light" ? "Light mode enabled." : "Dark mode enabled.");
}

function getCommands() {
  const sectionCommands = [
    ["layout", "Go to Overview", "Open the score summary and recommendations.", "1", () => switchSection("overview")],
    ["code", "Go to DOM Inspector", "Open DOM and script diagnostics.", "2", () => switchSection("dom")],
    ["spark", "Go to Performance", "Open Core Web Vitals and opportunities.", "3", () => switchSection("performance")],
    ["accessibility", "Go to Accessibility", "Open heading and image checks.", "4", () => switchSection("accessibility")],
    ["search", "Go to SEO", "Open metadata and search checks.", "5", () => switchSection("seo")],
    ["alert", "Go to Issues", "Open filtered Lighthouse findings.", "6", () => switchSection("issues")]
  ];

  return [
    ["spark", "Analyze URL", "Run PageSpeed analysis for the current input.", "Ctrl+Enter", runAnalysis],
    ["search", "Focus URL Bar", "Jump straight to the website input.", "F", () => elements.urlInput.focus()],
    ["moon", "Toggle Theme", "Switch between dark and light mode.", "T", toggleTheme],
    ["download", "Export JSON", "Download the current audit as JSON.", "JSON", exportJson],
    ["download", "Export HTML Report", "Download the current audit as HTML.", "HTML", exportHtml],
    ...sectionCommands
  ].map(([iconName, title, description, shortcut, action]) => ({ iconName, title, description, shortcut, action }));
}

function openCommandPalette() {
  commandSelection = 0;
  elements.commandInput.value = "";
  elements.commandPalette.hidden = false;
  document.body.classList.add("command-open");
  setSidebarOpen(false);
  renderCommandList();
  setTimeout(() => elements.commandInput.focus(), 0);
}

function closeCommandPalette() {
  elements.commandPalette.hidden = true;
  document.body.classList.remove("command-open");
}

function getFilteredCommands() {
  const query = elements.commandInput.value.trim().toLowerCase();
  const commands = getCommands();
  if (!query) return commands;
  return commands.filter((command) => {
    return command.title.toLowerCase().includes(query) || command.description.toLowerCase().includes(query);
  });
}

function renderCommandList() {
  const commands = getFilteredCommands();
  commandSelection = Math.min(commandSelection, Math.max(commands.length - 1, 0));

  if (!commands.length) {
    elements.commandList.innerHTML = `<div class="command-empty">No commands found.</div>`;
    return;
  }

  elements.commandList.innerHTML = commands.map((command, index) => `
    <button class="command-item ${index === commandSelection ? "active" : ""}" type="button" data-command-index="${index}" aria-selected="${index === commandSelection}">
      <span class="stat-icon-wrap">${icon(command.iconName)}</span>
      <span class="command-copy">
        <span class="command-title">${command.title}</span>
        <span class="command-desc">${command.description}</span>
      </span>
      <span class="command-meta">
        <span class="shortcut-chip">${command.shortcut}</span>
        <span class="shortcut-chip">Enter</span>
      </span>
    </button>
  `).join("");
}

function runSelectedCommand(index = commandSelection) {
  const commands = getFilteredCommands();
  const command = commands[index];
  if (!command) return;
  closeCommandPalette();
  command.action();
}

function setSidebarOpen(isOpen) {
  document.body.classList.toggle("sidebar-open", isOpen);
  elements.sidebarToggleBtn.setAttribute("aria-expanded", String(isOpen));
  elements.sidebarToggleBtn.setAttribute("aria-label", isOpen ? "Close analysis navigation" : "Open analysis navigation");
  elements.sidebarBackdrop.hidden = !isOpen;
}

function toggleSidebar() {
  setSidebarOpen(!document.body.classList.contains("sidebar-open"));
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
    setSidebarOpen(false);
    runAnalysis();
  }

  const commandButton = event.target.closest("[data-command-index]");
  if (commandButton) {
    runSelectedCommand(Number(commandButton.dataset.commandIndex));
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
  button.addEventListener("click", () => {
    switchSection(button.dataset.section);
    setSidebarOpen(false);
  });
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderIssues();
  });
});

elements.analyzeBtn.addEventListener("click", runAnalysis);
elements.sidebarToggleBtn.addEventListener("click", toggleSidebar);
elements.sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
elements.cmdBtn.addEventListener("click", openCommandPalette);
elements.sidebarCmdBtn.addEventListener("click", openCommandPalette);
elements.closeCommandBtn.addEventListener("click", closeCommandPalette);
elements.commandPalette.addEventListener("click", (event) => {
  if (event.target === elements.commandPalette) closeCommandPalette();
});
elements.commandInput.addEventListener("input", () => {
  commandSelection = 0;
  renderCommandList();
});
elements.commandInput.addEventListener("keydown", (event) => {
  const commands = getFilteredCommands();
  if (event.key === "ArrowDown") {
    event.preventDefault();
    commandSelection = Math.min(commandSelection + 1, Math.max(commands.length - 1, 0));
    renderCommandList();
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    commandSelection = Math.max(commandSelection - 1, 0);
    renderCommandList();
  }
  if (event.key === "Enter") {
    event.preventDefault();
    runSelectedCommand();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeCommandPalette();
  }
});
elements.themeBtn.addEventListener("click", toggleTheme);
elements.exportJsonBtn.addEventListener("click", exportJson);
elements.exportHtmlBtn.addEventListener("click", exportHtml);
elements.urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runAnalysis();
});

document.addEventListener("click", handleDocumentClick);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCommandPalette();
    setSidebarOpen(false);
    return;
  }

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

state.theme = localStorage.getItem(THEME_STORAGE) === "light" ? "light" : "dark";
document.body.classList.toggle("light-theme", state.theme === "light");
setStatus("Ready");
setButtonContent(elements.analyzeBtn, "spark", "Analyze");
setIconButton(elements.themeBtn, "moon");
setIconButton(elements.cmdBtn, "command");
setIconButton(elements.exportJsonBtn, "download");
updateMobileHeaderState();
updateClock();
setInterval(updateClock, 1000);
