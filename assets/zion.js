
(function () {
  const brief = document.getElementById("brief");
  if (brief) {
    const out = document.getElementById("brief-out");
    const saved = localStorage.getItem("zion-discovery-brief");
    if (saved) out.textContent = saved;
    brief.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(brief).entries());
      const json = JSON.stringify(data, null, 2);
      localStorage.setItem("zion-discovery-brief", json);
      out.textContent = json;
    });
  }
  const sla = document.getElementById("sla");
  const qty = document.getElementById("qty");
  const est = document.getElementById("est");
  function field() {
    if (!sla || !qty || !est) return;
    const n = Math.max(1, Number(qty.value) || 1);
    est.textContent = "$" + (Number(sla.value) * n).toLocaleString();
  }
  if (sla) { sla.addEventListener("change", field); qty.addEventListener("input", field); field(); }

  function roi() {
    const people = Number(document.getElementById("people")?.value || 0);
    const hours = Number(document.getElementById("hours")?.value || 0);
    const rate = Number(document.getElementById("rate")?.value || 0);
    const cover = Number(document.getElementById("cover")?.value || 0);
    const weekly = people * hours * rate * (cover / 100);
    const yearly = weekly * 48;
    const w = document.getElementById("weekly");
    if (!w) return;
    w.textContent = "$" + Math.round(weekly).toLocaleString();
    document.getElementById("yearly").textContent = "$" + Math.round(yearly).toLocaleString();
    document.getElementById("payback").textContent = yearly ? (2500 / (yearly / 12)).toFixed(1) : "—";
  }
  ["people","hours","rate","cover"].forEach((id) => document.getElementById(id)?.addEventListener("input", roi));
  roi();
  function finops() {
    const idle = document.getElementById("idle");
    if (!idle) return;
    const spend = Number(document.getElementById("spend").value || 0);
    const waste = Number(document.getElementById("waste").value || 0);
    idle.textContent = "$" + Math.round(spend * waste / 100).toLocaleString();
  }
  ["spend","waste"].forEach((id) => document.getElementById(id)?.addEventListener("input", finops));
  finops();

  const form = document.getElementById("ticket");
  const box = document.getElementById("tickets");
  function render() {
    if (!box) return;
    const items = JSON.parse(localStorage.getItem("zion-portal-tickets") || "[]");
    box.innerHTML = items.length
      ? items.map((t) => `<article class="card"><h3>${t.title}</h3><p>${t.body || ""}</p><p class="mono">${t.created}</p></article>`).join("")
      : `<article class="card"><h3>No tickets yet</h3><p>Create a note. It will not leave this browser.</p></article>`;
  }
  if (form) {
    render();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const items = JSON.parse(localStorage.getItem("zion-portal-tickets") || "[]");
      items.unshift({ ...data, created: new Date().toISOString() });
      localStorage.setItem("zion-portal-tickets", JSON.stringify(items));
      form.reset();
      render();
    });
  }
})();
