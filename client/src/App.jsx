// Alen Ovalles
// Last Update: 04/21/2026
// Web application that tracks my intial computer login time each day with calander view

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth0 } from "@auth0/auth0-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
        const raw = await res.json();

        console.log("API response:", raw);

        const list = Array.isArray(raw) ? raw : raw.entries;

        setEntries(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchEntries();
  }, []);

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