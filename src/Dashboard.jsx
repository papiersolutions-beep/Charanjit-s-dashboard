import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Newspaper, Mail, MessageCircle, Calendar, Calculator as CalcIcon, Globe, Sparkles, RefreshCw, Plus, X, MapPin, Search } from "lucide-react";

// localStorage helpers
const lsGet = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [city, setCity] = useState("New York");
  const [coords, setCoords] = useState(lsGet("city") || { lat: 40.7128, lon: -74.006, name: "New York" });
  const [cityInput, setCityInput] = useState("");
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [emails, setEmails] = useState(lsGet("emails") || []);
  const [messages, setMessages] = useState(lsGet("messages") || []);
  const [events, setEvents] = useState(lsGet("events") || []);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrev, setCalcPrev] = useState(null);
  const [calcOp, setCalcOp] = useState(null);
  const [calcWaiting, setCalcWaiting] = useState(false);

  useEffect(() => {
    setCity(coords.name);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchWeather = async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=4&timezone=auto`);
      setWeather(await r.json());
    } catch { setWeatherError("Could not load weather"); }
    finally { setWeatherLoading(false); }
  };

  useEffect(() => { fetchWeather(coords.lat, coords.lon); }, [coords]);

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`);
      const d = await r.json();
      if (d.results && d.results[0]) {
        const c = { lat: d.results[0].latitude, lon: d.results[0].longitude, name: `${d.results[0].name}${d.results[0].admin1 ? ", " + d.results[0].admin1 : ""}` };
        setCoords(c); setCity(c.name); lsSet("city", c); setCityInput("");
      }
    } catch {}
  };

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const r = await fetch("<https://hacker-news.firebaseio.com/v0/topstories.json>");
      const ids = (await r.json()).slice(0, 10);
      const stories = await Promise.all(ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((x) => x.json())));
      setNews(stories.filter(Boolean));
    } catch { setNews([]); }
    finally { setNewsLoading(false); }
  };

  useEffect(() => { loadNews(); }, []);

  const wxInfo = (code) => {
    if (code === 0) return { icon: Sun, label: "Clear", color: "text-amber-400" };
    if (code <= 3) return { icon: Cloud, label: "Partly Cloudy", color: "text-slate-300" };
    if (code <= 48) return { icon: Cloud, label: "Foggy", color: "text-slate-400" };
    if (code <= 67) return { icon: CloudRain, label: "Rain", color: "text-blue-400" };
    if (code <= 77) return { icon: CloudSnow, label: "Snow", color: "text-cyan-200" };
    if (code <= 82) return { icon: CloudRain, label: "Showers", color: "text-blue-400" };
    return { icon: CloudRain, label: "Storm", color: "text-indigo-400" };
  };

  const addEmail = () => {
    const from = prompt("From:"); if (!from) return;
    const subject = prompt("Subject:"); if (!subject) return;
    const next = [{ from, subject, time: "now", id: Date.now() }, ...emails].slice(0, 5);
    setEmails(next); lsSet("emails", next);
  };
  const addMessage = () => {
    const app = prompt("App (WhatsApp, iMessage, etc.):"); if (!app) return;
    const from = prompt("From:"); if (!from) return;
    const text = prompt("Message:"); if (!text) return;
    const next = [{ app, from, text, id: Date.now() }, ...messages].slice(0, 5);
    setMessages(next); lsSet("messages", next);
  };
  const addEvent = () => {
    const time = prompt("Time (e.g., 2:30 PM):"); if (!time) return;
    const title = prompt("Event:"); if (!title) return;
    const next = [...events, { time, title, id: Date.now() }];
    setEvents(next); lsSet("events", next);
  };
  const removeItem = (list, setList, key, id) => {
    const next = list.filter((x) => x.id !== id);
    setList(next); lsSet(key, next);
  };

  const calcInput = (val) => {
    if (calcWaiting) { setCalcDisplay(val); setCalcWaiting(false); }
    else { setCalcDisplay(calcDisplay === "0" ? val : calcDisplay + val); }
  };
  const calcDot = () => {
    if (calcWaiting) { setCalcDisplay("0."); setCalcWaiting(false); return; }
    if (!calcDisplay.includes(".")) setCalcDisplay(calcDisplay + ".");
  };
  const calcClear = () => { setCalcDisplay("0"); setCalcPrev(null); setCalcOp(null); setCalcWaiting(false); };
  const compute = (a, b, op) => op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : op === "÷" ? (b === 0 ? 0 : a / b) : b;
  const calcOpClick = (op) => {
    const cur = parseFloat(calcDisplay);
    if (calcPrev === null) setCalcPrev(cur);
    else if (calcOp) { const result = compute(calcPrev, cur, calcOp); setCalcDisplay(String(result)); setCalcPrev(result); }
    setCalcOp(op); setCalcWaiting(true);
  };
  const calcEquals = () => {
    if (calcOp === null || calcPrev === null) return;
    const result = compute(calcPrev, parseFloat(calcDisplay), calcOp);
    setCalcDisplay(String(result)); setCalcPrev(null); setCalcOp(null); setCalcWaiting(true);
  };
  const calcPercent = () => setCalcDisplay(String(parseFloat(calcDisplay) / 100));
  const calcSign = () => setCalcDisplay(String(-parseFloat(calcDisplay)));

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const CurIcon = weather ? wxInfo(weather.current?.weather_code).icon : Sun;
  const curColor = weather ? wxInfo(weather.current?.weather_code).color : "text-amber-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Good {now.getHours() < 12 ? "Morning" : now.getHours() < 18 ? "Afternoon" : "Evening"}</h1>
            <p className="text-slate-400 text-sm mt-1">{dateStr} · {timeStr}</p>
          </div>
          <div className="flex gap-2">
            <a href="<https://www.google.com>" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition">
              <Globe size={16} /> Browser
            </a>
            <a href="<https://claude.ai>" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg transition">
              <Sparkles size={16} /> Claude
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={14} /> {city}</div>
              <div className="flex gap-1">
                <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCity()} placeholder="Change city..." className="px-3 py-1 text-xs bg-slate-800 rounded border border-slate-700 focus:outline-none focus:border-blue-500 w-32" />
                <button onClick={searchCity} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"><Search size={12} /></button>
              </div>
            </div>
            {weatherLoading && <div className="text-slate-400 py-8 text-center">Loading weather...</div>}
            {weatherError && <div className="text-red-400 py-8 text-center">{weatherError}</div>}
            {weather && !weatherLoading && (
              <>
                <div className="flex items-center gap-6 mb-6">
                  <CurIcon size={72} className={curColor} />
                  <div>
                    <div className="text-5xl font-light">{Math.round(weather.current.temperature_2m)}°F</div>
                    <div className="text-slate-400 mt-1">{wxInfo(weather.current.weather_code).label}</div>
                    <div className="text-xs text-slate-500 mt-1">Wind {Math.round(weather.current.wind_speed_10m)} mph · Humidity {weather.current.relative_humidity_2m}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {weather.daily.time.slice(1, 4).map((day, i) => {
                    const idx = i + 1; const info = wxInfo(weather.daily.weather_code[idx]); const Ic = info.icon;
                    return (
                      <div key={day} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">{new Date(day).toLocaleDateString("en-US", { weekday: "short" })}</div>
                        <Ic size={28} className={`${info.color} mx-auto mb-2`} />
                        <div className="text-sm"><span className="font-semibold">{Math.round(weather.daily.temperature_2m_max[idx])}°</span><span className="text-slate-500 ml-1">{Math.round(weather.daily.temperature_2m_min[idx])}°</span></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-3 text-slate-300"><CalcIcon size={16} /> <span className="font-semibold">Calculator</span></div>
            <div className="bg-slate-900 rounded-lg p-3 mb-3 text-right text-3xl font-light min-h-[60px] flex items-center justify-end overflow-hidden">{calcDisplay}</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: "C", fn: calcClear, c: "bg-slate-600 hover:bg-slate-500" },
                { l: "±", fn: calcSign, c: "bg-slate-600 hover:bg-slate-500" },
                { l: "%", fn: calcPercent, c: "bg-slate-600 hover:bg-slate-500" },
                { l: "÷", fn: () => calcOpClick("÷"), c: "bg-orange-500 hover:bg-orange-600" },
                { l: "7", fn: () => calcInput("7") }, { l: "8", fn: () => calcInput("8") }, { l: "9", fn: () => calcInput("9") },
                { l: "×", fn: () => calcOpClick("×"), c: "bg-orange-500 hover:bg-orange-600" },
                { l: "4", fn: () => calcInput("4") }, { l: "5", fn: () => calcInput("5") }, { l: "6", fn: () => calcInput("6") },
                { l: "-", fn: () => calcOpClick("-"), c: "bg-orange-500 hover:bg-orange-600" },
                { l: "1", fn: () => calcInput("1") }, { l: "2", fn: () => calcInput("2") }, { l: "3", fn: () => calcInput("3") },
                { l: "+", fn: () => calcOpClick("+"), c: "bg-orange-500 hover:bg-orange-600" },
                { l: "0", fn: () => calcInput("0"), span: true }, { l: ".", fn: calcDot },
                { l: "=", fn: calcEquals, c: "bg-orange-500 hover:bg-orange-600" },
              ].map((b, i) => (
                <button key={i} onClick={b.fn} className={`${b.c || "bg-slate-700 hover:bg-slate-600"} ${b.span ? "col-span-2" : ""} rounded-lg py-3 font-semibold transition`}>{b.l}</button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300"><Newspaper size={16} /> <span className="font-semibold">Top 10 Stories</span></div>
              <button onClick={loadNews} className="p-1.5 hover:bg-slate-700 rounded"><RefreshCw size={14} className={newsLoading ? "animate-spin" : ""} /></button>
            </div>
            {newsLoading && <div className="text-slate-500 text-sm py-4">Loading...</div>}
            <div className="space-y-1.5">
              {news.map((s, i) => (
                <a key={s.id} href={s.url || `https://news.ycombinator.com/item?id=${s.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-2 hover:bg-slate-700/50 rounded text-sm transition group">
                  <span className="text-slate-500 font-mono text-xs pt-0.5 w-5">{i + 1}</span>
                  <span className="flex-1 group-hover:text-blue-300">{s.title}</span>
                  <span className="text-slate-500 text-xs pt-0.5">{s.score}↑</span>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300"><Calendar size={16} /> <span className="font-semibold">Today</span></div>
              <button onClick={addEvent} className="p-1.5 hover:bg-slate-700 rounded"><Plus size={14} /></button>
            </div>
            {events.length === 0 ? <p className="text-slate-500 text-sm py-2">No events. Tap + to add.</p> : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 p-2 bg-slate-900/50 rounded group">
                    <div className="text-xs text-blue-400 font-mono pt-0.5 w-16 shrink-0">{ev.time}</div>
                    <div className="flex-1 text-sm">{ev.title}</div>
                    <button onClick={() => removeItem(events, setEvents, "events", ev.id)} className="opacity-0 group-hover:opacity-100 transition"><X size={12} className="text-slate-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300"><Mail size={16} /> <span className="font-semibold">Recent Emails</span></div>
              <button onClick={addEmail} className="p-1.5 hover:bg-slate-700 rounded"><Plus size={14} /></button>
            </div>
            {emails.length === 0 ? <p className="text-slate-500 text-sm py-2">No emails. Tap + to add.</p> : (
              <div className="space-y-1.5">
                {emails.map((e) => (
                  <div key={e.id} className="p-2 bg-slate-900/50 rounded group">
                    <div className="flex items-start justify-between">
                      <div className="text-xs text-slate-400">{e.from}</div>
                      <button onClick={() => removeItem(emails, setEmails, "emails", e.id)} className="opacity-0 group-hover:opacity-100 transition"><X size={12} className="text-slate-500" /></button>
                    </div>
                    <div className="text-sm truncate">{e.subject}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300"><MessageCircle size={16} /> <span className="font-semibold">Messages</span></div>
              <button onClick={addMessage} className="p-1.5 hover:bg-slate-700 rounded"><Plus size={14} /></button>
            </div>
            {messages.length === 0 ? <p className="text-slate-500 text-sm py-2">No messages. Tap + to add.</p> : (
              <div className="space-y-1.5">
                {messages.map((m) => (
                  <div key={m.id} className="p-2 bg-slate-900/50 rounded group">
                    <div className="flex items-start justify-between">
                      <div className="text-xs text-slate-400"><span className="text-emerald-400">{m.app}</span> · {m.from}</div>
                      <button onClick={() => removeItem(messages, setMessages, "messages", m.id)} className="opacity-0 group-hover:opacity-100 transition"><X size={12} className="text-slate-500" /></button>
                    </div>
                    <div className="text-sm truncate">{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">Weather & news live · Saved on this device</p>
      </div>
    </div>
  );
}
