// Alen Ovalles
// Last Update: 04/21/2026
// Web application that tracks my intial computer login time each day with calander view

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// A distinct color per month (feel free to swap these out)
const MONTH_COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
  "#008080", "#e6beff",
];

const API_URL = import.meta.env.VITE_API_URL;

// ---------------- SCATTER PLOT ----------------
function timeToMinutes(t) {
// "10:30 AM" -> 630
  const [time, modifier] = t.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesToLabel(mins) {
  // 630 -> "10:30 AM"
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

function getDayIndex(dateStr) {
  return new Date(dateStr + "T00:00:00").getDay(); // 0 = Sun ... 6 = Sat
}

function LoginTimeScatter({ data }) {
  // Determine the Y-axis range based on data, with a fallback
  const FALLBACK_START = 6;
  const FALLBACK_END = 22;

  let startHour = FALLBACK_START;
  let endHour = FALLBACK_END;

  if (data.length > 0) {
    const allMinutes = data.map((d) => d.minutes);
    const dataMinHour = Math.floor(Math.min(...allMinutes) / 60);
    const dataMaxHour = Math.ceil(Math.max(...allMinutes) / 60);
    startHour = Math.min(FALLBACK_START, dataMinHour);
    endHour = Math.max(FALLBACK_END, dataMaxHour);
  }

  const hourTicks = [];
  for (let h = startHour; h <= endHour; h++) {
    hourTicks.push(h * 60);
  }

  // Group data points by month (0-11)
  const byMonth = {};
  data.forEach((point) => {
    const month = new Date(point.date + "T00:00:00").getMonth();
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(point);
  });

  const monthKeys = Object.keys(byMonth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div style={{ width: "100%", maxWidth: 900, marginBottom: 40 }}>
      <div style={{ height: 550 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="day"
              domain={[-0.5, 6.5]}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(i) =>
                ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]
              }
              tick={{ fontSize: 14 }}
              height={50}
            />
            <YAxis
              type="number"
              dataKey="minutes"
              domain={[startHour * 60 - 15, endHour * 60 + 15]}
              reversed
              ticks={hourTicks}
              tickFormatter={minutesToLabel}
              tick={{ fontSize: 14 }}
              width={80}
              interval={0}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload;
                return (
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 14,
                    }}
                  >
                    <div>date: "{point.date}"</div>
                    <div>time: "{minutesToLabel(point.minutes)}"</div>
                  </div>
                );
              }}
            />
            {monthKeys.map((monthIndex) => (
              <Scatter
                key={monthIndex}
                name={MONTH_NAMES[monthIndex]}
                data={byMonth[monthIndex]}
                fill={MONTH_COLORS[monthIndex]}
                r={7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* CUSTOM LEGEND - guaranteed calendar order */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        {monthKeys.map((monthIndex) => (
          <div
            key={monthIndex}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: MONTH_COLORS[monthIndex],
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 14 }}>{MONTH_NAMES[monthIndex]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  
  const { loginWithRedirect, logout, isAuthenticated, isLoading } = useAuth0();

  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const today = new Date().toLocaleDateString("en-CA");

  // ---------------- SAFE FETCH ----------------
  useEffect(() => {
  async function fetchEntries() {
    try {
      console.log("API_URL:", API_URL);

      const res = await fetch(`${API_URL}/api/all`);

      // safer parse
      const raw = await res.json();
      console.log("API response:", raw);

      // ALWAYS expect { entries: [...] }
      const list = raw?.entries ?? [];

      setEntries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setEntries([]); // fail-safe so UI doesn't break
    } finally {
      setLoadingData(false);
    }
  }

  fetchEntries();
}, []);

  const scatterData = (Array.isArray(entries) ? entries : [])
    .filter((e) => e?.date && e?.time)
    .map((e) => ({
      day: getDayIndex(e.date),
      minutes: timeToMinutes(e.time),
      date: e.date,
    }));

  if (isLoading) return <div>Loading...</div>;
  
  // ---------------- DELETE (temp button) ----------------
  const handleTempDelete = async () => {
    await fetch(`${API_URL}/api/time/today`, {
      method: "DELETE",
    });

    const res = await fetch(`${API_URL}/api/all`);
    const data = await res.json();

    setEntries(Array.isArray(data.entries) ? data.entries : []);
  };

  // ---------------- ADMIN CLICK ----------------
  const handleAdminClick = async (date) => {
    if (date !== today) return;

    const formattedTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    await fetch(`${API_URL}/api/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        time: formattedTime,
      }),
    });

    const res = await fetch(`${API_URL}/api/all`);
    const data = await res.json();
    setEntries(Array.isArray(data.entries) ? data.entries : []);
    // Auto sign out after logging today's time
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  // ---------------- CALENDAR ----------------
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const renderCalendar = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const safeEntries = Array.isArray(entries) ? entries : [];
    const todayEntry = safeEntries.find((e) => e.date === today);
    

    const cells = [];

    for (let i = 0; i < startDayIndex; i++) {
      cells.push(<div key={"empty-" + i} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const entry = safeEntries.find((e) => e?.date === date);

      cells.push(
        <button
          key={day}
          onClick={() => {
            if (!isAuthenticated) {
              if (entry) setSelectedEntry(entry);
              return;
            }

            // ADMIN MODE
            handleAdminClick(date);
          }}
          style={{
            padding: 10,
            background: entry ? "rgba(170, 59, 255, 0.12)" : "#f4f3f7",
            color: entry ? "#aa3bff" : "#6b6375",
            border: "1px solid #e5e4e7",
            borderRadius: "6px",
            cursor: entry ? "pointer" : "default",
          }}
        >
          {day}
        </button>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 5,
        }}
      >
        {cells}
      </div>
    );
  };

  // ---------------- UI ----------------
  return (
    
    <div style={{ padding: 20 }}>
      <h1>Initial Computer Login Time</h1>

      {!isAuthenticated && (
        <button onClick={() => loginWithRedirect()} style={{ marginBlock: 30 }}>
          Admin Login
        </button>
      )}

      {isAuthenticated && (
        <button
          style={{ marginBlock: 30 }}
          onClick={() =>
            logout({
              logoutParams: {
                returnTo: window.location.origin,
              },
            })
          }
        >
          Sign Out
        </button>
      )}

      
      {/* WEEKDAY HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 5,
          marginBottom: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      {renderCalendar()}

      {/* SCATTER CHART */}
      <div style={{ marginTop: 20, padding: 10 }}>
        <LoginTimeScatter data={scatterData} />
      </div>

      {/* POPUP */}
      {selectedEntry && (
        <div style={{ marginTop: 20, border: "1px solid black", padding: 10 }}>
          {/* <p>Date: {selectedEntry.date}</p> */}
          <p>Time: {selectedEntry.time}</p>
          <button onClick={() => setSelectedEntry(null)}>Close</button>
        </div>
      )}

      {/* TEMP DELETE BUTTON (for testing only, not in final UI) */}
      {/* {isAuthenticated && (
        <button
          style={{ marginTop: 20, marginLeft: 10 }}
          onClick={handleTempDelete}
        >
          🗑 Delete Today (Test)
        </button>
      )} */}
    </div>
  );
}