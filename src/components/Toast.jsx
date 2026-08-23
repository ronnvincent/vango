export function toast(msg) {
  let el = document.getElementById("vango-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "vango-toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window._vangoToastTimer);
  window._vangoToastTimer = setTimeout(() => el.classList.remove("show"), 7000);
}