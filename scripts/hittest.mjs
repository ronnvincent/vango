import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto("http://localhost:4173/#fleet", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 1500));

const probe = await page.evaluate(() => {
  const btn = document.querySelector(".fleet-main");
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const stack = document.elementsFromPoint(cx, Math.min(cy, window.innerHeight - 5)).map(e =>
    `${e.tagName}${e.id ? "#" + e.id : ""}.${String(e.className).slice(0, 45)}|pe=${getComputedStyle(e).pointerEvents}|z=${getComputedStyle(e).zIndex}`
  );
  return { cx: Math.round(cx), cy: Math.round(Math.min(cy, window.innerHeight - 5)), rectTop: Math.round(r.top), stack };
});
console.log("TAP POINT:", probe.cx, ",", probe.cy);
console.log("ELEMENTS UNDER FINGER (top->bottom):");
probe.stack.forEach(s => console.log("   ", s));

// try a raw mouse click at that exact point
await page.mouse.click(probe.cx, probe.cy);
await new Promise(r => setTimeout(r, 400));
const after = await page.evaluate(() => ({
  open: !!document.querySelector(".fd-body"),
  expanded: document.querySelector(".fleet-main").getAttribute("aria-expanded"),
}));
console.log("AFTER RAW MOUSE CLICK:", JSON.stringify(after));
await browser.close();
