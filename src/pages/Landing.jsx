import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TERMINALS = ["City Center", "Airport", "N. Station", "Harbor", "Stadium", "Tech Park"];
const KM = [
  [0, 28, 42, 12, 9, 17],
  [28, 0, 51, 31, 26, 35],
  [42, 51, 0, 47, 50, 58],
  [12, 31, 47, 0, 8, 21],
  [9, 26, 50, 8, 0, 14],
  [17, 35, 58, 21, 14, 0],
];
const VANS = {
  shuttle: { label: "Shuttle", cap: 7, rate: 1.2, blurb: "Compact van for small groups and airport runs." },
  cruiser: { label: "Cruiser", cap: 12, rate: 1.5, blurb: "The workhorse — weddings, teams, conferences." },
  mover: { label: "Mover", cap: 19, rate: 2.0, blurb: "Max capacity for crews and cargo." },
};

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false);
  const [from, setFrom] = useState("0");
  const [to, setTo] = useState("1");
  const [vClass, setVClass] = useState("cruiser");
  const [pax, setPax] = useState(4);
  const [qDate, setQDate] = useState("");
  const [qTime, setQTime] = useState("09:00");

  const overCap = pax > VANS[vClass].cap;
  const km = from === to ? 12 : KM[+from][+to];
  const fare = 10 + km * VANS[vClass].rate;

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Subtle reveal-on-scroll with a failsafe so nothing stays hidden.
  useEffect(() => {
    const els = [...document.querySelectorAll(".rv")];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        e.target.classList.add("on");
        io.unobserve(e.target);
      }
    }), { threshold: 0.05 });
    els.forEach(el => io.observe(el));
    const failsafe = setTimeout(() => {
      els.forEach(el => el.classList.add("on"));
      io.disconnect();
    }, 2500);
    return () => { clearTimeout(failsafe); io.disconnect(); };
  }, []);

  const pickVan = id => {
    setVClass(id);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };

  const saveQuote = () => {
    sessionStorage.setItem("vango_quote", JSON.stringify({
      fromName: TERMINALS[from], toName: TERMINALS[to], vClass, pax, date: qDate, time: qTime,
    }));
  };

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <Link to="/" className="wordmark"><img src="/logo.png" alt="VanGo" /></Link>
          <nav aria-label="Main" className="nav-links-wrap">
            <ul className="nav-links">
              <li><a href="#fleet">Fleet</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#book">Book</a></li>
              <li><Link to="/apply">Drive</Link></li>
            </ul>
          </nav>
          <Link className="btn btn-solid" to="/signup">Book a van</Link>
          <button className="burger" onClick={() => setNavOpen(v => !v)} aria-label={navOpen ? "Close menu" : "Open menu"} aria-expanded={navOpen}>
            {navOpen ? <X size={20} /> : <><span /><span /><span /></>}
          </button>
        </div>
        {navOpen && (
          <div className="wrap">
            <nav className="m-drop" aria-label="Mobile menu">
              <a href="#fleet" onClick={() => setNavOpen(false)}>Fleet</a>
              <a href="#how" onClick={() => setNavOpen(false)}>How it works</a>
              <a href="#book" onClick={() => setNavOpen(false)}>Book</a>
              <Link to="/apply" onClick={() => setNavOpen(false)}>Drive with us</Link>
              <Link className="btn btn-solid m-book" to="/signup">Book a van</Link>
            </nav>
          </div>
        )}
      </header>

      <main id="top" className="lp">
        {/* ---- HERO ---- */}
        <section className="hero wrap">
          <h1 className="rv">Book the whole van.</h1>
          <p className="hero-sub rv">
            Point-to-point group transport across the metro.
            Flat fare from <b>$10</b> — no surge pricing, ever.
          </p>
          <div className="hero-cta rv">
            <a className="btn btn-solid" href="#book">Get an instant quote</a>
            <a className="btn" href="#fleet">See the fleet</a>
          </div>
          <div className="stat-strip rv">
            <div className="stat-cell"><b>48</b><span>Vans in service</span></div>
            <div className="stat-cell"><b>98%</b><span>On-time arrival</span></div>
            <div className="stat-cell"><b>$10</b><span>Flat base fare</span></div>
          </div>
        </section>

        {/* ---- HOW IT WORKS ---- */}
        <section id="how" className="landing-section wrap">
          <h2 className="rv">How it works</h2>
          <div className="steps rv">
            <div className="step">
              <b>1</b>
              <h3>Pick your route</h3>
              <p>Six fixed terminals across the city.</p>
            </div>
            <div className="step">
              <b>2</b>
              <h3>Pick your van</h3>
              <p>7, 12 or 19 seats — the price updates as you choose.</p>
            </div>
            <div className="step">
              <b>3</b>
              <h3>Ride</h3>
              <p>Driver arrives within a 5-minute window. Pay online or cash.</p>
            </div>
          </div>
        </section>

        {/* ---- FLEET ---- */}
        <section id="fleet" className="landing-section wrap">
          <h2 className="rv">The fleet</h2>
          <div className="fleet-list rv">
            {Object.entries(VANS).map(([id, v]) => (
              <div key={id} className="fleet-row">
                <div className="fleet-info">
                  <h3>{v.label} <span className="fleet-cap">/{v.cap} seats</span></h3>
                  <p>{v.blurb}</p>
                </div>
                <div className="fleet-rate">${v.rate.toFixed(2)}/km</div>
                <button className="btn" onClick={() => pickVan(id)}>Select</button>
              </div>
            ))}
          </div>
        </section>

        {/* ---- BOOK / QUOTE ---- */}
        <section id="book" className="landing-section wrap">
          <h2 className="rv">Get your fare</h2>
          <form className="quote-grid rv" onSubmit={e => e.preventDefault()}>
            <div className="quote-fields">
              <div className="duo">
                <div className="field">
                  <label htmlFor="q-from">From</label>
                  <select id="q-from" value={from} onChange={e => setFrom(e.target.value)}>
                    {TERMINALS.map((t, i) => <option key={i} value={i}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="q-to">To</label>
                  <select id="q-to" value={to} onChange={e => setTo(e.target.value)}>
                    {TERMINALS.map((t, i) => <option key={i} value={i} disabled={i === +from}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="duo">
                <div className="field">
                  <label htmlFor="q-date">Date</label>
                  <input id="q-date" type="date" value={qDate} onChange={e => setQDate(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="q-time">Time</label>
                  <input id="q-time" type="time" value={qTime} onChange={e => setQTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Van</label>
                <div className="van-pick">
                  {Object.entries(VANS).map(([id, v]) => (
                    <span key={id} style={{ flex: 1, display: "flex" }}>
                      <input type="radio" id={`v-${id}`} name="van" value={id} checked={vClass === id} onChange={() => setVClass(id)} />
                      <label htmlFor={`v-${id}`}>{v.label} /{v.cap}</label>
                    </span>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Passengers</label>
                <div className="stepper">
                  <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}>−</button>
                  <output>{pax}</output>
                  <button type="button" onClick={() => setPax(Math.min(19, pax + 1))}>+</button>
                </div>
                {overCap && <p className="overcap show">Too many passengers — pick a bigger van</p>}
              </div>
            </div>

            <aside className="panel quote-card" aria-live="polite">
              <div className="info-row"><span>Route</span><b>{TERMINALS[from]} → {TERMINALS[to]}</b></div>
              <div className="info-row"><span>Distance</span><b>{km} km</b></div>
              <div className="info-row"><span>Van</span><b>{VANS[vClass].label} /{VANS[vClass].cap}</b></div>
              <div className="info-row"><span>Passengers</span><b>{pax}</b></div>
              <div className="info-row"><span>Depart</span><b>{qDate ? `${qDate} · ${qTime}` : "—"}</b></div>
              <div className="quote-total">
                <span>Total fare</span>
                <b>{overCap ? "—" : `$${fare.toFixed(2)}`}</b>
              </div>
              <Link
                to="/signup"
                className="btn btn-solid quote-cta"
                onClick={saveQuote}
              >Create account to book</Link>
              <p className="quote-note">Free cancellation up to 4 hours before departure.</p>
            </aside>
          </form>
        </section>

        {/* ---- DRIVE WITH US ---- */}
        <section id="drive" className="landing-section wrap">
          <div className="drive-panel rv">
            <div>
              <h2>Drive with us</h2>
              <p>Flat pay per trip, weekly payouts, 24/7 dispatch support.</p>
            </div>
            <Link to="/apply" className="btn btn-solid">Apply to drive</Link>
          </div>
        </section>
      </main>

      <footer id="contact">
        <div className="wrap foot-grid">
          <div className="foot-col">
            <h3>Contact</h3>
            <ul>
              <li><a href="tel:+15550000000">+1 (555) 000-0000</a></li>
              <li><a href="mailto:dispatch@vango.co">dispatch@vango.co</a></li>
              <li>Open 24 / 7</li>
            </ul>
          </div>
          <div className="foot-col">
            <h3>Explore</h3>
            <ul>
              <li><a href="#fleet">Fleet</a></li>
              <li><a href="#book">Book a van</a></li>
              <li><Link to="/apply">Drive with us</Link></li>
            </ul>
          </div>
          <div className="foot-col">
            <h3>Depot</h3>
            <ul>
              <li>123 Roadrunner Ave</li>
              <li>Bay 4, City Center</li>
            </ul>
          </div>
        </div>
        <div className="wrap foot-bar">
          <span>© 2025 VanGo Transport Co.</span>
        </div>
      </footer>
    </>
  );
}
