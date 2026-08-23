import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:4173";

const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();

const logs = [];
page.on("console", m => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on("pageerror", e => logs.push(`[PAGEERROR] ${e.message}`));
page.on("requestfailed", r => logs.push(`[reqfail] ${r.url().slice(0, 90)} ${r.failure()?.errorText}`));

async function audit(label, url, { deepLink = false } = {}) {
  console.log("\n=========================================");
  console.log(`SCENARIO: ${label}`);
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, deepLink ? 2500 : 1200));

  const scan = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll("body *").forEach(el => {
      if (el.closest(".m-menu")) return;
      const r = el.getBoundingClientRect();
      if ((r.right > w + 1 || r.left < -1) && r.width > 8 && r.height > 0 && el.children.length < 30) {
        out.push(`${el.tagName}.${String(el.className).slice(0, 40)} | left=${Math.round(r.left)} right=${Math.round(r.right)} width=${Math.round(r.width)} text="${(el.textContent || "").trim().slice(0, 25)}"`);
      }
    });
    return {
      clientWidth: w,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
      offenders: out.slice(0, 15),
      offenderCount: out.length,
    };
  });
  console.log(`viewport=${scan.innerWidth} docScrollW=${scan.scrollWidth} clientW=${scan.clientWidth} bodyScrollW=${scan.bodyScrollWidth} => HORIZONTAL OVERFLOW: ${scan.scrollWidth > scan.clientWidth ? "YES" : "no"}`);
  scan.offenders.forEach(o => console.log("  OFFENDER:", o));

  // Fleet interaction
  await page.evaluate(() => document.querySelector("#fleet")?.scrollIntoView());
  await new Promise(r => setTimeout(r, 900));
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll(".fleet-row")].map(el => ({
      name: el.querySelector(".f-name")?.childNodes[0]?.textContent?.trim(),
      opacity: getComputedStyle(el).opacity,
      h: Math.round(el.getBoundingClientRect().height),
      top: Math.round(el.getBoundingClientRect().top),
    }))
  );
  console.log("FLEET ROWS:", JSON.stringify(rows));

  await page.evaluate(() => document.querySelector(".fleet-main")?.scrollIntoView({ block: "center" }));
  await new Promise(r => setTimeout(r, 400));
  await page.tap(".fleet-main");
  await new Promise(r => setTimeout(r, 400));
  let detail = await page.evaluate(() => {
    const d = document.querySelector(".fd-body");
    if (!d) return { exists: false };
    const r = d.getBoundingClientRect();
    return { exists: true, w: Math.round(r.width), h: Math.round(r.height), opacity: getComputedStyle(d).opacity, color: getComputedStyle(d).color, bg: getComputedStyle(d).backgroundColor, overflow: getComputedStyle(d).overflow, text: d.textContent.trim().slice(0, 50) };
  });
  console.log("FLEET DETAIL AFTER TOUCH-TAP:", JSON.stringify(detail));

  // retry with a plain mouse click
  await page.click(".fleet-main");
  await new Promise(r => setTimeout(r, 400));
  detail = await page.evaluate(() => {
    const d = document.querySelector(".fd-body");
    const btn = document.querySelector(".fleet-main");
    return { exists: !!d, ariaExpanded: btn?.getAttribute("aria-expanded"), text: d ? d.textContent.trim().slice(0, 40) : null };
  });
  console.log("FLEET DETAIL AFTER MOUSE CLICK:", JSON.stringify(detail));

  // retry bypassing hit-testing entirely
  await page.evaluate(() => {
    const rows = document.querySelectorAll(".fleet-row");
    rows[2].querySelector(".fleet-main").click();
  });
  await new Promise(r => setTimeout(r, 400));
  detail = await page.evaluate(() => {
    const bodies = document.querySelectorAll(".fd-body");
    const open = [...document.querySelectorAll(".fleet-row")].map(el => el.className);
    return { count: bodies.length, rows: open, lastText: bodies[bodies.length - 1]?.textContent.trim().slice(0, 40) };
  });
  console.log("AFTER JS .click() ON ROW 3:", JSON.stringify(detail));
}

await audit("normal load", BASE + "/");
await audit("deep link #fleet", BASE + "/#fleet", { deepLink: true });

console.log("\n========= PAGE LOGS =========");
logs.slice(0, 40).forEach(l => console.log(l));
await browser.close();
