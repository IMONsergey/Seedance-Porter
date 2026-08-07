const $ = (id) => document.getElementById(id);
const project = $("project");
const result = $("result");
const video = $("video");
const provider = $("provider");
const token = $("token");

const sample = {
  project: "studio-demo",
  label: "hero-shot",
  model: "seedance-2.0",
  duration: 6,
  resolution: "720p",
  aspectRatio: "16:9",
  generateAudio: true,
  outputPolicy: {
    generatedText: "forbid",
    generatedLogo: "forbid",
    generatedWatermark: "forbid"
  },
  brief: {
    objective: "Create a controlled premium hero shot.",
    subject: "A matte green product bottle",
    action: "The bottle slowly rises two centimeters and settles completely still",
    environment: "Minimal dark studio with warm stone plinth",
    camera: "Slow 20-degree clockwise orbit that settles centered",
    lighting: "Large soft source camera-left and subtle warm edge light",
    colorTone: "Deep neutral green with warm stone highlights",
    sound: "Low restrained pulse and one soft impact at the final settle",
    endpoint: "Bottle upright, centered, stable three-quarter view",
    style: "Contemporary premium commercial product photography with matte realistic materials",
    imageQuality: "HD, rich fine details, stable geometry, natural colors and coherent material texture",
    constraints: ["frame remains text-free", "product geometry remains unchanged"],
    beats: []
  },
  references: [],
  shots: []
};

project.value = JSON.stringify(sample, null, 2);
token.value = sessionStorage.getItem("porterStudioToken") || "";
token.addEventListener("input", () => sessionStorage.setItem("porterStudioToken", token.value));

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token.value) headers.Authorization = `Bearer ${token.value}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP ${response.status}`);
    error.details = data.details || data;
    throw error;
  }
  return data;
}

function parsedProject() {
  return JSON.parse(project.value);
}

function show(data) {
  result.textContent = JSON.stringify(data, null, 2);
  const url = data?.task?.videoUrl || data?.videoUrl || data?.output?.videoUrl;
  if (url) {
    video.src = url;
    video.hidden = false;
  } else {
    video.removeAttribute("src");
    video.hidden = true;
  }
}

async function run(label, fn) {
  result.textContent = `${label}…`;
  try { show(await fn()); }
  catch (error) {
    result.textContent = `${error.name}: ${error.message}${error.details ? `\n\n${JSON.stringify(error.details, null, 2)}` : ""}`;
  }
}

$("example").onclick = () => { project.value = JSON.stringify(sample, null, 2); };
$("models").onclick = () => run("Loading models", () => api("/api/models"));
$("validate").onclick = () => run("Validating against BOS-2026-07-17", async () => {
  const compiled = await api("/api/compile", { method: "POST", body: JSON.stringify({ project: parsedProject(), provider: provider.value }) });
  return compiled.officialCompliance;
});
$("compile").onclick = () => run("Compiling + official compliance", () => api("/api/compile", { method: "POST", body: JSON.stringify({ project: parsedProject(), provider: provider.value }) }));
$("generate").onclick = () => {
  if (!confirm("This can spend provider credits. Porter will block generation if the official ByteDance compliance gate fails. Generate now?")) return;
  run("Validating + generating", () => api("/api/generate", { method: "POST", body: JSON.stringify({ project: parsedProject(), provider: provider.value, wait: true }) }));
};

api("/api/health").then(() => { $("health").textContent = "local API online · BOS gate active"; }).catch(() => { $("health").textContent = token.value ? "API unavailable / token rejected" : "API unavailable / token may be required"; });
