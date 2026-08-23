import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function SplitText({ text, className = "", delay = 0 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span className={className} aria-label={text} style={{ display: "inline-block" }}>
      {text.split(" ").map((w, wi) => (
        <span key={wi} className="split-word">
          {[...w].map((c, ci) => (
            <span key={ci} className="split-char" style={{ animationDelay: `${delay + ci * 30}ms` }}>
              {c}
            </span>
          ))}
          {wi < text.split(" ").length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

function HeroTitle() {
  return (
    <h1>
      <SplitText text="GET THE" delay={100} /><br />
      <SplitText text="whole van." className="serif" delay={280} /><br />
      <SplitText text="TO YOURSELF." delay={460} />
    </h1>
  );
}

function DecryptedText({ text, speed = 36 }) {
  const CHARS = "!<>-_\\/[]{}—=+*^?#";
  const [out, setOut] = useState(text);
  useLayoutEffect(() => {
    if (reduced()) return;
    let i = 0, timer;
    const step = () => {
      i += 1;
      let s = "", done = 0;
      for (let j = 0; j < text.length; j++) {
        if (text[j] === " " || i >= j * 2 + 6) { s += text[j]; done++; } 
        else s += CHARS[(Math.random() * CHARS.length) | 0];
      }
      setOut(s);
      if (done < text.length) timer = setTimeout(step, speed);
    };
    step();
    return () => clearTimeout(timer);
  }, [text]);
  return <span aria-label={text}><span aria-hidden="true">{out}</span></span>;
}

function CountUp({ to, duration = 1600 }) {
  const ref = useRef(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    let raf, started = false;
    const obs = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting || started) return;
      started = true;
      obs.disconnect();
      setV(0);
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{v}</span>;
}

function RotatingText({ words, interval = 2200 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setI(v => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words]);
  return (
    <span className="rx-rot">
      <span key={i} className={reduced() ? "" : "rx-rot-in"}>{words[i]}</span>
    </span>
  );
}

function Magnet({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const onMove = e => {
    const el = ref.current;
    if (!el || reduced()) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width/2)*strength}px, ${(e.clientY - r.top - r.height/2)*strength}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return <div ref={ref} className="rx-magnet" onMouseMove={onMove} onMouseLeave={onLeave}>{children}</div>;
}

function ClickSpark({ color = "#FF4400" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    const canvas = ref.current, ctx = canvas.getContext("2d");
    let parts = [], raf = null;
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter(p => p.t < 1);
      for (const p of parts) {
        p.t += 0.02;
        const d = 8 + p.t * 34, s = 12 * (1 - p.t);
        const cx = p.x + Math.cos(p.a)*d, cy = p.y + Math.sin(p.a)*d;
        ctx.strokeStyle = color; ctx.globalAlpha = 1 - p.t; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx-s/2, cy); ctx.lineTo(cx+s/2, cy); ctx.moveTo(cx, cy-s/2); ctx.lineTo(cx, cy+s/2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(loop) : null;
    };
    const onClick = e => {
      for (let i=0; i<8; i++) parts.push({ x: e.clientX, y: e.clientY, a: Math.PI*2*i/8, t: 0 });
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("click", onClick);
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("click", onClick); if(raf) cancelAnimationFrame(raf); };
  }, [color]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:400}} />;
}

function TextPressure({ text = "VAN\u2014GO" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    const chars = [...ref.current.querySelectorAll("span")];
    const pos = { x: -99999, y: -99999 };
    const move = e => { pos.x = e.clientX; pos.y = e.clientY; };
    window.addEventListener("mousemove", move);
    let raf;
    const tick = () => {
      for (const c of chars) {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(pos.x - (r.left + r.width/2), pos.y - (r.top + r.height/2));
        let p = Math.max(0, 1 - d/240); p = p*p*(3-2*p);
        c.style.fontVariationSettings = `'wght' ${150 + 750*p}, 'wdth' ${68 + 57*p}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, []);
  return (
    <div ref={ref} className="foot-word" aria-hidden="true">
      {[...text].map((c, i) => <span key={i} style={{ fontVariationSettings: "'wght' 150, 'wdth' 68" }}>{c}</span>)}
    </div>
  );
}

export default function Landing() {
  const [time, setTime] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [openFleet, setOpenFleet] = useState(null);
  
  // Quote form state
  const [from, setFrom] = useState("0");
  const [to, setTo] = useState("1");
  const [vClass, setVClass] = useState("cruiser");
  const [pax, setPax] = useState(4);
  const [qDate, setQDate] = useState("");
  const [qTime, setQTime] = useState("09:00");
  const [fare, setFare] = useState(0);

  const KM = [
    [0, 28, 42, 12, 9, 17],
    [28, 0, 51, 31, 26, 35],
    [42, 51, 0, 47, 50, 58],
    [12, 31, 47, 0, 8, 21],
    [9, 26, 50, 8, 0, 14],
    [17, 35, 58, 21, 14, 0],
  ];
  const SHORT = ["City Center", "Airport", "N. Station", "Harbor", "Stadium", "Tech Park"];
  const VANS = { shuttle: { name: "SHUTTLE /7", rate: 1.2, cap: 7 }, cruiser: { name: "CRUISER /12", rate: 1.5, cap: 12 }, mover: { name: "MOVER /19", rate: 2.0, cap: 19 } };
  
  const overCap = pax > VANS[vClass].cap;

  useEffect(() => {
    const d = (from === to) ? 12 : KM[+from][+to];
    setFare(10 + d * VANS[vClass].rate);
  }, [from, to, vClass]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
    return () => document.body.classList.remove("nav-open");
  }, [navOpen]);

  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".rv").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleSpotlight = (e, ref) => {
    const r = ref.getBoundingClientRect();
    ref.style.setProperty("--mx", e.clientX - r.left + "px");
    ref.style.setProperty("--my", e.clientY - r.top + "px");
  };

  const navLinkClick = () => setNavOpen(false);

  return (
    <>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {Array(8).fill(`VANGO<span style="color:var(--accent)">®</span> POINT-TO-POINT VAN SERVICE <b>●</b> FLAT BASE FARE $10 <b>●</b> NO SURGE <b>●</b> 24/7 DISPATCH <b>●</b> `).map((t, i) => (
            <span key={i} dangerouslySetInnerHTML={{ __html: t }} />
          ))}
        </div>
      </div>

      <header className="nav">
        <div className="wrap nav-in">
          <a href="#top" className="wordmark">VAN<i>—</i>GO<sup style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.5em" }}>®</sup></a>
          <nav aria-label="Main">
            <ul className="nav-links">
              <li><a href="#fleet"><sup>01</sup>Fleet</a></li>
              <li><a href="#rates"><sup>02</sup>Rates</a></li>
              <li><a href="#manifest"><sup>03</sup>Manifest</a></li>
              <li><a href="#contact"><sup>04</sup>Contact</a></li>
            </ul>
          </nav>
          <Link className="btn btn-solid" to="/signup">Book a van →</Link>
          <button className="burger" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className="m-menu">
        <button className="m-close" onClick={() => setNavOpen(false)}>[ CLOSE ]</button>
        <a href="#fleet" onClick={navLinkClick}>Fleet</a>
        <a href="#rates" onClick={navLinkClick}>Rates</a>
        <a href="#manifest" onClick={navLinkClick}>Manifest</a>
        <a href="#contact" onClick={navLinkClick}>Contact</a>
      </div>

      <main id="top">
        <div className="hero wrap">
          <div className="meta-row lbl">
            <span><span className="dot-live" /><DecryptedText text="DISPATCH OPEN" speed={30} /> — local time <span>{time || "00:00:00"}</span></span>
            <span><DecryptedText text="ROUTES IN SERVICE: 06" speed={20} /></span>
          </div>

          <div className="hero-grid">
            <div>
              <HeroTitle />
              <p className="hero-sub">Point-to-point van service. Flat base fare. Live dispatch. No surge pricing — ever.</p>
              <p className="hero-sub" style={{ marginTop: "0.6rem" }}>Built for&nbsp;<RotatingText words={["CREWS", "WEDDINGS", "AIRPORT RUNS", "CARGO", "GAME DAY", "TOUR GROUPS"]} /></p>
              <div className="hero-cta">
                <Magnet><a className="btn btn-solid" href="#manifest">Start a manifest ↓</a></Magnet>
                <Magnet strength={0.22}><a className="btn" href="#fleet">Inspect the fleet</a></Magnet>
              </div>
            </div>

            <div className="bp-wrap">
              <svg className="bp" viewBox="0 0 480 240" width="100%" role="img" aria-label="Technical drawing of a VanGo van">
                <line className="dim" x1="10" y1="10" x2="30" y2="10" />
                <line className="dim" x1="20" y1="0" x2="20" y2="20" />
                <line className="dim" x1="450" y1="230" x2="470" y2="230" />
                <line className="dim" x1="460" y1="220" x2="460" y2="240" />
                <path className="draw" d="M70 178 L70 92 Q70 58 108 56 L330 56 Q352 58 372 84 L398 118 Q404 126 404 138 L404 178 Z" />
                <path className="draw" d="M96 96 Q98 74 122 72 L196 72 L196 116 L96 116 Z" />
                <rect className="draw" x="212" y="72" width="88" height="44" />
                <rect className="draw" x="316" y="72" width="62" height="44" />
                <line className="draw" x1="204" y1="66" x2="204" y2="176" />
                <rect className="draw" x="182" y="128" width="14" height="4" />
                <line className="draw" x1="70" y1="146" x2="404" y2="146" />
                <circle className="fill" cx="398" cy="160" r="4" />
                <g className="wheel"><circle className="draw" cx="150" cy="180" r="26" /><circle className="draw" cx="150" cy="180" r="10" /></g>
                <g className="wheel"><circle className="draw" cx="340" cy="180" r="26" /><circle className="draw" cx="340" cy="180" r="10" /></g>
                <line className="draw" x1="30" y1="208" x2="450" y2="208" />
                <line className="dim" x1="70" y1="222" x2="404" y2="222" />
                <line className="dim" x1="70" y1="216" x2="70" y2="228" />
                <line className="dim" x1="404" y1="216" x2="404" y2="228" />
                <text className="tag-txt" x="215" y="236">5.9 M</text>
                <text className="tag-txt" x="380" y="46">FIG.01</text>
              </svg>
              <div className="fig-cap lbl"><span>VG cruiser /12</span><span>wheelbase 3.2 m</span></div>
            </div>
          </div>

          <div className="stat-strip">
            <div className="stat-cell"><b><CountUp to={48} /><em>.</em></b><span className="lbl">Vans in service</span></div>
            <div className="stat-cell"><b><CountUp to={98} /><em>%</em></b><span className="lbl">On-time arrival</span></div>
            <div className="stat-cell"><b><em>$</em><CountUp to={10} /><em>.</em></b><span className="lbl">Flat base fare</span></div>
          </div>
        </div>

        <section id="fleet" className="landing-section wrap">
          <div className="sec-head rv">
            <div><span className="idx">01</span><h2>Fleet</h2></div>
            <span className="sec-note lbl">Select a row to inspect<br />Live availability</span>
          </div>
          <div className="fleet-list">
            {[
              { id: 'shuttle', no: '01', name: 'Shuttle Seven', sub: 'The city runabout. Quick crews, hotel runs.', pax: '7 pax', rate: '$1.20/km', status: 'Available', desc: 'Compact high-roof van for small groups and luggage-heavy airport transfers. Fits standard city parking. Rear climate zone.', specs: ['7 seats','4 large bags','A/C','USB-C ×6'] },
              { id: 'cruiser', no: '02', name: 'Cruiser Twelve', sub: 'The workhorse. Most-booked van on the road.', pax: '12 pax', rate: '$1.50/km', status: '3 left today', low: true, desc: 'Full-size window van. Wedding parties, sports teams, conference shuttles. Dual A/C, onboard entertainment, tow hitch on request.', specs: ['12 seats','8 large bags','Dual A/C','Entertainment'] },
              { id: 'mover', no: '03', name: 'Mover Nineteen', sub: 'Max capacity. Crews, cargo, or both.', pax: '19 pax', rate: '$2.00/km', status: 'Available', desc: 'Minibus platform with cargo partition option. Moves nineteen people — or twelve people and five hundred kilos of equipment.', specs: ['19 seats','500 kg cargo','Climate ctrl','PA system'] }
            ].map(f => (
              <div key={f.id} className={`fleet-row rv ${openFleet === f.id ? 'open' : ''}`}>
                <button className="fleet-main" aria-expanded={openFleet === f.id} onClick={() => setOpenFleet(openFleet === f.id ? null : f.id)} onMouseMove={e => handleSpotlight(e, e.currentTarget)}>
                  <span className="f-no">/{f.no}</span>
                  <span className="f-name">{f.name}<small>{f.sub}</small></span>
                  <span className="f-col">{f.pax}</span>
                  <span className="f-col f-rate">{f.rate}</span>
                  <span className="f-col f-status"><span className={`status ${f.low ? 'low' : ''}`}>{f.status}</span></span>
                  <span className="f-plus">+</span>
                </button>
                <div className="fleet-detail">
                  <div className="fd-in">
                    <div className="fd-body">
                      <div>
                        <p className="fd-desc">{f.desc}</p>
                        <p className="fd-specs">{f.specs.map((s,i) => <span key={i}>{s}</span>)}</p>
                      </div>
                      <button className="btn btn-solid" onClick={() => { setVClass(f.id); document.getElementById('manifest').scrollIntoView({behavior:'smooth'}); }}>Select →</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="rates" className="landing-section wrap">
          <div className="sec-head rv">
            <div><span className="idx">02</span><h2>How it runs</h2></div>
            <span className="sec-note lbl">Three steps<br />No app required</span>
          </div>
          {[
            { no: 'A', title: 'Call the route', desc: 'Pickup and destination, date and time. Six fixed terminals across the metro — flat distances, no guessing games with meters.' },
            { no: 'B', title: 'Size the van', desc: 'Seven, twelve or nineteen seats. The manifest prices itself as you choose. What you see issued is what you pay.' },
            { no: 'C', title: 'Board & go', desc: 'Your driver arrives inside a 5-minute window with the plate texted ahead. Pay online or cash on board. Receipts automatic.' }
          ].map(r => (
            <div key={r.no} className="proc-row rv">
              <span className="proc-no">{r.no}</span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
            </div>
          ))}
        </section>

        <section id="manifest" className="landing-section wrap">
          <div className="sec-head rv">
            <div><span className="idx">03</span><h2>The manifest</h2></div>
            <span className="sec-note lbl">Instant quote<br />Cancel free up to 4h before</span>
          </div>
          
          <form className="manifest" onSubmit={e => { e.preventDefault(); }}>
            <div>
              <div className="duo">
                <div className="field">
                  <label>Departure Terminal</label>
                  <select value={from} onChange={e => setFrom(e.target.value)}>
                    {SHORT.map((s, i) => <option key={i} value={i}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Arrival Terminal</label>
                  <select value={to} onChange={e => setTo(e.target.value)}>
                    {SHORT.map((s, i) => <option key={i} value={i} disabled={i == from}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="duo">
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={qDate} onChange={e => setQDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>Time</label>
                  <input type="time" value={qTime} onChange={e => setQTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Van class</label>
                <div className="van-pick">
                  {['shuttle','cruiser','mover'].map(c => (
                    <div key={c} style={{flex:1, display:'flex'}}>
                      <input type="radio" id={`v-${c}`} name="van" value={c} checked={vClass === c} onChange={() => setVClass(c)} />
                      <label htmlFor={`v-${c}`} style={{width:'100%'}}>{VANS[c].name.split(' ')[0]} /{VANS[c].cap}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Passengers</label>
                <div className="stepper">
                  <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}>−</button>
                  <output>{String(pax).padStart(2, "0")}</output>
                  <button type="button" onClick={() => setPax(Math.min(19, pax + 1))}>+</button>
                </div>
                {overCap && <p className="overcap show">Over capacity — size up the van class</p>}
              </div>
              <div className="duo">
                <div className="field">
                  <label>Name on manifest</label>
                  <input type="text" placeholder="J. DOE" />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input type="tel" placeholder="+1 555 000 0000" />
                </div>
              </div>
            </div>

            <aside className="ticket landing-ticket" aria-live="polite">
              <div className="tk-head"><span className="lbl">VanGo — Trip manifest</span><span className="tk-ref">REF ————</span></div>
              <div className="tk-body">
                <div className="tk-row"><span className="lbl">Route</span><span className="lead"></span><b>{SHORT[from]} → {SHORT[to]}</b></div>
                <div className="tk-row"><span className="lbl">Distance</span><span className="lead"></span><b>{from === to ? 12 : KM[+from][+to]} KM</b></div>
                <div className="tk-row"><span className="lbl">Class</span><span className="lead"></span><b>{VANS[vClass].name}</b></div>
                <div className="tk-row"><span className="lbl">Passengers</span><span className="lead"></span><b>{String(pax).padStart(2, "0")}</b></div>
                <div className="tk-row"><span className="lbl">Depart</span><span className="lead"></span><b>{qDate ? `${qDate} · ${qTime}` : "—"}</b></div>
                <div className="tk-total"><span className="lbl">Total fare</span><b>{overCap ? "$0.00" : `$${fare.toFixed(2)}`}</b></div>
                {overCap && <p className="overcap show">▲ Fare withheld — fix capacity first</p>}
              </div>
              <div className="tk-stub">
                <div className="barcode" aria-hidden="true" />
                <Link to="/signup" className="btn issue-btn" style={{ display: 'block', textAlign: 'center' }}>CREATE ACCOUNT TO BOOK</Link>
              </div>
            </aside>
          </form>
        </section>

        <section className="wrap">
          <div className="sec-head rv">
            <div><span className="idx">04</span><h2>Field notes</h2></div>
            <span className="sec-note lbl">Unedited<br />From the trip log</span>
          </div>
          <div className="notes rv">
            <div className="note">
              <p>"Two vans, eleven bridesmaids, zero drama. The driver had the AC running before we even loaded."</p>
              <cite>— Manifest №2147 · Wedding charter</cite>
            </div>
            <div className="note">
              <p>"4 AM airport run. Plate texted at 3:40, wheels rolling at 4:02. It's that boring, which is the point."</p>
              <cite>— Manifest №1988 · Weekly commuter</cite>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact">
        <div className="wrap"><TextPressure text="VAN—GO" /></div>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-col">
              <span className="lbl" style={{ color: "var(--accent)" }}>Dispatch</span>
              <ul>
                <li><a href="tel:+15550000000">+1 (555) 000-0000</a></li>
                <li><a href="mailto:dispatch@vango.co">dispatch@vango.co</a></li>
                <li>Open 24 / 7 / 365</li>
              </ul>
            </div>
            <div className="foot-col">
              <span className="lbl" style={{ color: "var(--accent)" }}>Index</span>
              <ul>
                <li><a href="#fleet">01 — Fleet</a></li>
                <li><a href="#rates">02 — How it runs</a></li>
                <li><a href="#manifest">03 — Manifest</a></li>
              </ul>
            </div>
            <div className="foot-col">
              <span className="lbl" style={{ color: "var(--accent)" }}>Registered depot</span>
              <ul>
                <li>123 Roadrunner Ave</li>
                <li>Bay 4, City Center</li>
                <li>Fleet lic. VG-2025-048</li>
              </ul>
            </div>
          </div>
          <div className="foot-bar lbl">
            <span>© 2025 VanGo Transport Co.</span>
            <span>Local time — <span>{time || "00:00:00"}</span></span>
          </div>
        </div>
      </footer>
      <ClickSpark />
    </>
  );
}
