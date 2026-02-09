import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { api } from "./api";

function App() {
  const [tab, setTab] = useState("dashboard");

  // auth
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loginEmail, setLoginEmail] = useState("admin@test.com");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [authMsg, setAuthMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isAuthed = !!token;

  // employees
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [empError, setEmpError] = useState("");
  const [query, setQuery] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [savingEmp, setSavingEmp] = useState(false);
  const [editId, setEditId] = useState(null);

  // attendance
  const [attEmployeeId, setAttEmployeeId] = useState("");
  const [attDate, setAttDate] = useState("");
  const [attStatus, setAttStatus] = useState("Present");
  const [attendance, setAttendance] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState("");

  // leaves
  const [lvEmployeeId, setLvEmployeeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [lvLoading, setLvLoading] = useState(false);
  const [lvError, setLvError] = useState("");

  // ---------- HELPERS ----------
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const toYMD = (d) => String(d).slice(0, 10);

  const inRange = (d, start, end) => {
    if (!d || !start || !end) return false;
    return d >= start && d <= end;
  };

  // ---------- AUTH ----------
  const login = async (e) => {
    e.preventDefault();
    try {
      setAuthMsg("");
      setAuthLoading(true);

      const res = await api.post("/api/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setAuthMsg("Login successful ✅");

      await Promise.all([fetchEmployees(), fetchAttendance(), fetchLeaves()]);
      setTab("dashboard");
    } catch (err) {
      setAuthMsg(err?.response?.data?.message || "Login failed ❌");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setAuthMsg("Logged out ✅");
    setTab("dashboard");
  };

  // ---------- EMPLOYEES ----------
  const fetchEmployees = async () => {
    try {
      setEmpLoading(true);
      setEmpError("");
      const res = await api.get("/api/employees");
      setEmployees(res.data || []);
    } catch (err) {
      setEmpError("Failed to load employees.");
    } finally {
      setEmpLoading(false);
    }
  };

  // ---------- ATTENDANCE ----------
  const fetchAttendance = async () => {
    try {
      setAttLoading(true);
      setAttError("");
      const res = await api.get("/api/attendance");
      setAttendance(res.data || []);
    } catch (err) {
      setAttError(err?.response?.data?.message || "Failed to load attendance.");
    } finally {
      setAttLoading(false);
    }
  };

  // ---------- LEAVES ----------
  const fetchLeaves = async () => {
    try {
      setLvLoading(true);
      setLvError("");
      const res = await api.get("/api/leaves");
      setLeaves(res.data || []);
    } catch (err) {
      setLvError(err?.response?.data?.message || "Failed to load leaves.");
    } finally {
      setLvLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchEmployees();
    if (isAuthed) {
      fetchAttendance();
      fetchLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tab-specific refresh
  useEffect(() => {
    if (!isAuthed) return;
    if (tab === "attendance") fetchAttendance();
    if (tab === "leaves") fetchLeaves();
    if (tab === "dashboard") {
      fetchEmployees();
      fetchAttendance();
      fetchLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthed]);

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      return (
        (e.employeeId || "").toLowerCase().includes(q) ||
        (e.fullName || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

  const saveEmployee = async (e) => {
    e.preventDefault();
    try {
      setSavingEmp(true);
      setEmpError("");

      const payload = {
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
      };

      if (editId) {
        await api.put(`/api/employees/${editId}`, payload);
      } else {
        await api.post("/api/employees", payload);
      }

      setEditId(null);
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setDepartment("Engineering");

      await fetchEmployees();
    } catch (err) {
      setEmpError(err?.response?.data?.message || "Failed to save employee.");
    } finally {
      setSavingEmp(false);
    }
  };

  const startEdit = (emp) => {
    setEditId(emp._id);
    setEmployeeId(emp.employeeId || "");
    setFullName(emp.fullName || "");
    setEmail(emp.email || "");
    setDepartment(emp.department || "Engineering");
    setTab("employees");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEmployeeId("");
    setFullName("");
    setEmail("");
    setDepartment("Engineering");
  };

  const deleteEmployee = async (id) => {
    const ok = window.confirm("Delete this employee?");
    if (!ok) return;

    try {
      setEmpError("");
      await api.delete(`/api/employees/${id}`);
      await fetchEmployees();
    } catch (err) {
      setEmpError("Failed to delete employee.");
    }
  };

  const markAttendance = async (e) => {
    e.preventDefault();
    try {
      setAttError("");
      await api.post("/api/attendance", {
        employeeId: attEmployeeId.trim(),
        date: attDate,
        status: attStatus,
      });

      setAttEmployeeId("");
      setAttDate("");
      setAttStatus("Present");

      await fetchAttendance();
    } catch (err) {
      setAttError(err?.response?.data?.message || "Failed to mark attendance.");
    }
  };

  const applyLeave = async (e) => {
    e.preventDefault();
    try {
      setLvError("");
      await api.post("/api/leaves", {
        employeeId: lvEmployeeId.trim(),
        fromDate,
        toDate,
        reason: reason.trim(),
      });

      setLvEmployeeId("");
      setFromDate("");
      setToDate("");
      setReason("");

      await fetchLeaves();
    } catch (err) {
      setLvError(err?.response?.data?.message || "Failed to apply leave.");
    }
  };

  const updateLeaveStatus = async (id, status) => {
    try {
      setLvError("");
      await api.put(`/api/leaves/${id}`, { status });
      await fetchLeaves();
    } catch (err) {
      setLvError(
        err?.response?.data?.message || "Failed to update leave status."
      );
    }
  };

  // ---------- DASHBOARD COMPUTED ----------
  const dashboard = useMemo(() => {
    const totalEmployees = employees.length;

    const presentToday = attendance.filter(
      (a) => toYMD(a.date) === todayStr && a.status === "Present"
    ).length;

    const onLeaveToday = leaves.filter((l) => {
      const status = (l.status || "").toLowerCase();
      const approved = status === "approved";
      const start = toYMD(l.fromDate);
      const end = toYMD(l.toDate);
      return approved && inRange(todayStr, start, end);
    }).length;

    const leavesPending = leaves.filter((l) => (l.status || "") === "Pending")
      .length;

    const deptMap = {};
    for (const e of employees) {
      const d = (e.department || "Unknown").trim();
      deptMap[d] = (deptMap[d] || 0) + 1;
    }
    const departments = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEmployees,
      presentToday,
      onLeaveToday,
      leavesPending,
      departments,
    };
  }, [employees, attendance, leaves, todayStr]);

  // ---------- MINI GRAPH (SVG) ----------
  const DeptBarChart = ({ data }) => {
    const top = (data || []).slice(0, 6);
    const max = Math.max(1, ...top.map((d) => d.count));
    const w = 520;
    const h = 180;
    const padL = 16;
    const padR = 16;
    const padT = 18;
    const padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const gap = 14;
    const barW = top.length
      ? (innerW - gap * (top.length - 1)) / top.length
      : innerW;

    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Departments (Top)</h2>
          <p className="card-subtitle">Employee distribution by department</p>
        </div>
        <div className="card-body">
          {top.length === 0 ? (
            <div className="toast">No department data yet.</div>
          ) : (
            <svg
              width="100%"
              viewBox={`0 0 ${w} ${h}`}
              role="img"
              aria-label="Department bar chart"
            >
              <line
                x1={padL}
                y1={padT + innerH}
                x2={padL + innerW}
                y2={padT + innerH}
                stroke="rgba(17,24,39,0.15)"
                strokeWidth="2"
              />

              {top.map((d, i) => {
                const x = padL + i * (barW + gap);
                const barH = (d.count / max) * innerH;
                const y = padT + (innerH - barH);

                return (
                  <g key={d.name}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="10"
                      fill="rgba(17,24,39,0.85)"
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(17,24,39,0.75)"
                    >
                      {d.count}
                    </text>
                    <text
                      x={x + barW / 2}
                      y={padT + innerH + 18}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(17,24,39,0.65)"
                    >
                      {d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    );
  };

  // ---------- MONTHLY ATTENDANCE LINE GRAPH (SVG) ----------
  const MonthlyAttendanceLineChart = ({ attendance }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const pad2 = (n) => String(n).padStart(2, "0");
    const monthLabel = now.toLocaleString(undefined, { month: "long", year: "numeric" });

    // Build counts per day: Present count (you can also track Absent if you want)
    const counts = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      present: 0,
    }));

    for (const a of attendance || []) {
      const d = toYMD(a.date);
      if (!d) continue;
      const [yy, mm, dd] = d.split("-");
      if (!yy || !mm || !dd) continue;

      const isThisMonth =
        Number(yy) === year && Number(mm) === month + 1;

      if (!isThisMonth) continue;

      const dayIndex = Number(dd) - 1;
      if (dayIndex < 0 || dayIndex >= daysInMonth) continue;

      if (String(a.status) === "Present") {
        counts[dayIndex].present += 1;
      }
    }

    const maxY = Math.max(1, ...counts.map((c) => c.present));

    // SVG sizing
    const w = 920;
    const h = 260;
    const padL = 44;
    const padR = 18;
    const padT = 22;
    const padB = 34;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    // map functions
    const xFor = (day) => {
      if (daysInMonth === 1) return padL + innerW / 2;
      return padL + ((day - 1) / (daysInMonth - 1)) * innerW;
    };

    const yFor = (val) => padT + (1 - val / maxY) * innerH;

    // line path
    const pathD = counts
      .map((c, i) => {
        const x = xFor(c.day);
        const y = yFor(c.present);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    // ticks (show 1, 8, 15, 22, 29-ish)
    const tickDays = [1, 8, 15, 22, 29].filter((d) => d <= daysInMonth);

    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Monthly Attendance (Present)</h2>
          <p className="card-subtitle">{monthLabel} · Daily present count</p>
        </div>
        <div className="card-body">
          {counts.every((c) => c.present === 0) ? (
            <div className="toast">
              No attendance marked for {now.toLocaleString(undefined, { month: "long" })} yet.
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Monthly attendance line chart">
              {/* axes */}
              <line
                x1={padL}
                y1={padT + innerH}
                x2={padL + innerW}
                y2={padT + innerH}
                stroke="rgba(17,24,39,0.15)"
                strokeWidth="2"
              />
              <line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={padT + innerH}
                stroke="rgba(17,24,39,0.15)"
                strokeWidth="2"
              />

              {/* y labels (0 and max) */}
              <text x={padL - 10} y={padT + innerH + 4} textAnchor="end" fontSize="12" fill="rgba(17,24,39,0.55)">
                0
              </text>
              <text x={padL - 10} y={padT + 4} textAnchor="end" fontSize="12" fill="rgba(17,24,39,0.55)">
                {maxY}
              </text>

              {/* x ticks */}
              {tickDays.map((d) => {
                const x = xFor(d);
                return (
                  <g key={d}>
                    <line
                      x1={x}
                      y1={padT + innerH}
                      x2={x}
                      y2={padT + innerH + 6}
                      stroke="rgba(17,24,39,0.25)"
                    />
                    <text
                      x={x}
                      y={padT + innerH + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(17,24,39,0.55)"
                    >
                      {d}
                    </text>
                  </g>
                );
              })}

              {/* line */}
              <path d={pathD} fill="none" stroke="rgba(17,24,39,0.85)" strokeWidth="3" />

              {/* points */}
              {counts.map((c) => {
                const x = xFor(c.day);
                const y = yFor(c.present);
                return (
                  <circle
                    key={c.day}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="rgba(17,24,39,0.85)"
                    opacity={c.present === 0 ? 0.25 : 1}
                  />
                );
              })}
            </svg>
          )}

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="status">
              Month Total Present:{" "}
              {counts.reduce((sum, c) => sum + c.present, 0)}
            </span>
            <span className="status">
              Max Daily Present: {maxY}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ LOGIN PAGE
  if (!isAuthed) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-head">
            <h1>HRMS Lite</h1>
            <p>Admin Panel Login</p>
          </div>

          {authMsg && (
            <div className={`login-alert ${authMsg.includes("❌") ? "err" : "ok"}`}>
              {authMsg}
            </div>
          )}

          <form onSubmit={login} className="login-form">
            <label>Email</label>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@test.com"
              type="email"
              required
            />

            <label>Password</label>
            <div className="pass-wrap">
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                type={showPass ? "text" : "password"}
                required
              />
              <button type="button" className="pass-btn" onClick={() => setShowPass((s) => !s)}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>

            <button className="login-btn" type="submit" disabled={authLoading}>
              {authLoading ? "Logging in..." : "Login"}
            </button>

            <div className="login-footer">Demo: admin@test.com / 123456</div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- APP (SIDEBAR) ----------
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-head">
          <div className="side-title">HRMS Lite</div>
          <span className="badge" style={{ width: "fit-content" }}>
            Admin Dashboard
          </span>
        </div>

        <div className="side-section">
          <div className="side-label">Navigation</div>
          <div className="side-nav">
            <button className={`side-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
              <span>Dashboard</span>
              <span className="side-pill">{dashboard.totalEmployees}</span>
            </button>

            <button className={`side-btn ${tab === "employees" ? "active" : ""}`} onClick={() => setTab("employees")}>
              <span>Employees</span>
              <span className="side-pill">{employees.length}</span>
            </button>

            <button className={`side-btn ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>
              <span>Attendance</span>
              <span className="side-pill">{dashboard.presentToday}</span>
            </button>

            <button className={`side-btn ${tab === "leaves" ? "active" : ""}`} onClick={() => setTab("leaves")}>
              <span>Leaves</span>
              <span className="side-pill">{dashboard.leavesPending}</span>
            </button>
          </div>
        </div>

        <div className="side-footer">
          <div className="badge">JWT: Saved</div>
          <button className="secondary" style={{ width: "100%" }} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          {authMsg && <div className={`toast ${authMsg.includes("❌") ? "error" : ""}`}>{authMsg}</div>}

          <div className="page-top">
            <div className="page-title">
              {tab === "dashboard" ? "Dashboard" : tab === "employees" ? "Employees" : tab === "attendance" ? "Attendance" : "Leaves"}
            </div>

            <div className="page-actions">
              {tab === "employees" && (
                <>
                  <input
                    style={{ width: 280 }}
                    placeholder="Search employees..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button className="secondary" onClick={fetchEmployees} disabled={empLoading}>
                    {empLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </>
              )}
              {tab === "dashboard" && (
                <button
                  className="secondary"
                  onClick={() => {
                    fetchEmployees();
                    fetchAttendance();
                    fetchLeaves();
                  }}
                >
                  Refresh Dashboard
                </button>
              )}
              {tab === "attendance" && (
                <button className="secondary" onClick={fetchAttendance}>
                  Refresh Attendance
                </button>
              )}
              {tab === "leaves" && (
                <button className="secondary" onClick={fetchLeaves}>
                  Refresh Leaves
                </button>
              )}
            </div>
          </div>

          {/* ================= DASHBOARD PAGE ================= */}
          {tab === "dashboard" && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Employees</h3>
                  <p>{dashboard.totalEmployees}</p>
                </div>
                <div className="stat-card">
                  <h3>Present Today</h3>
                  <p>{dashboard.presentToday}</p>
                </div>
                <div className="stat-card">
                  <h3>On Leave (Today)</h3>
                  <p>{dashboard.onLeaveToday}</p>
                </div>
                <div className="stat-card">
                  <h3>Pending Leaves</h3>
                  <p>{dashboard.leavesPending}</p>
                </div>
              </div>

              {/* Monthly Attendance Line Graph */}
              <div style={{ marginTop: 18 }}>
                <MonthlyAttendanceLineChart attendance={attendance} />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {/* Departments list */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Departments</h2>
                    <p className="card-subtitle">Total unique: {dashboard.departments.length}</p>
                  </div>
                  <div className="card-body">
                    {dashboard.departments.length === 0 ? (
                      <div className="toast">No employees yet.</div>
                    ) : (
                      <div className="table-wrap" style={{ minWidth: "unset" }}>
                        <table style={{ minWidth: 0 }}>
                          <thead>
                            <tr>
                              <th>Department</th>
                              <th>Employees</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboard.departments.map((d) => (
                              <tr key={d.name}>
                                <td>{d.name}</td>
                                <td>
                                  <span className="status">{d.count}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Graph */}
                <DeptBarChart data={dashboard.departments} />
              </div>

              <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12 }}>
                Today: <b>{todayStr}</b> · Present is calculated from attendance records. On Leave counts only{" "}
                <b>Approved</b> leaves.
              </div>
            </>
          )}

          {/* ================= EMPLOYEES PAGE ================= */}
          {tab === "employees" && (
            <>
              {empError && <div className="toast error">{empError}</div>}
              {!empError && empLoading && <div className="toast">Loading employees…</div>}

              <div className="grid">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{editId ? "Edit Employee" : "Add Employee"}</h2>
                    <p className="card-subtitle">
                      {editId ? "Update employee record." : "Create a new employee record."}
                    </p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={saveEmployee}>
                      <div className="row">
                        <label>Employee ID</label>
                        <input
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          placeholder="EMP001"
                          required
                          disabled={!!editId}
                        />
                      </div>

                      <div className="row">
                        <label>Full Name</label>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>

                      <div className="row">
                        <label>Email</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@gmail.com"
                          required
                          type="email"
                        />
                      </div>

                      <div className="row">
                        <label>Department</label>
                        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                          <option>Engineering</option>
                          <option>HR</option>
                          <option>Sales</option>
                          <option>Marketing</option>
                          <option>Finance</option>
                          <option>Operations</option>
                          <option>IT</option>
                        </select>
                      </div>

                      <button type="submit" disabled={savingEmp}>
                        {savingEmp ? "Saving..." : editId ? "Update Employee" : "Add Employee"}
                      </button>

                      {editId && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={cancelEdit}
                          style={{ marginTop: 10 }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>

                    <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                      <span className="status">Total: {employees.length}</span>
                      <span className="status">Showing: {filteredEmployees.length}</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Employee Directory</h2>
                    <p className="card-subtitle">Live data from MongoDB.</p>
                  </div>

                  <div className="card-body">
                    {!empLoading && filteredEmployees.length === 0 ? (
                      <div className="toast">No employees found. Add your first employee.</div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee ID</th>
                              <th>Full Name</th>
                              <th>Email</th>
                              <th>Department</th>
                              <th style={{ width: 220 }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEmployees.map((emp) => (
                              <tr key={emp._id}>
                                <td>{emp.employeeId || "-"}</td>
                                <td>{emp.fullName || "-"}</td>
                                <td>{emp.email}</td>
                                <td>{emp.department || "-"}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button className="secondary" onClick={() => startEdit(emp)}>
                                      Edit
                                    </button>
                                    <button className="danger" onClick={() => deleteEmployee(emp._id)}>
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= ATTENDANCE PAGE ================= */}
          {tab === "attendance" && (
            <>
              {attError && <div className="toast error">{attError}</div>}
              {attLoading && <div className="toast">Loading attendance…</div>}

              <div className="grid">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Mark Attendance</h2>
                    <p className="card-subtitle">Create a new attendance entry.</p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={markAttendance}>
                      <div className="row">
                        <label>Employee ID</label>
                        <input
                          value={attEmployeeId}
                          onChange={(e) => setAttEmployeeId(e.target.value)}
                          placeholder="EMP001"
                          required
                        />
                      </div>

                      <div className="row">
                        <label>Date</label>
                        <input value={attDate} onChange={(e) => setAttDate(e.target.value)} type="date" required />
                      </div>

                      <div className="row">
                        <label>Status</label>
                        <select value={attStatus} onChange={(e) => setAttStatus(e.target.value)}>
                          <option>Present</option>
                          <option>Absent</option>
                        </select>
                      </div>

                      <button type="submit">Save Attendance</button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Attendance Records</h2>
                    <p className="card-subtitle">All records from database.</p>
                  </div>
                  <div className="card-body">
                    {!attLoading && attendance.length === 0 ? (
                      <div className="toast">No attendance records yet.</div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee ID</th>
                              <th>Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((a) => (
                              <tr key={a._id}>
                                <td>{a.employeeId}</td>
                                <td>{toYMD(a.date)}</td>
                                <td>
                                  <span className="status">{a.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= LEAVES PAGE ================= */}
          {tab === "leaves" && (
            <>
              {lvError && <div className="toast error">{lvError}</div>}
              {lvLoading && <div className="toast">Loading leaves…</div>}

              <div className="grid">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Apply Leave</h2>
                    <p className="card-subtitle">Create a leave request (default: Pending).</p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={applyLeave}>
                      <div className="row">
                        <label>Employee ID</label>
                        <input
                          value={lvEmployeeId}
                          onChange={(e) => setLvEmployeeId(e.target.value)}
                          placeholder="EMP001"
                          required
                        />
                      </div>

                      <div className="row">
                        <label>From</label>
                        <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} type="date" required />
                      </div>

                      <div className="row">
                        <label>To</label>
                        <input value={toDate} onChange={(e) => setToDate(e.target.value)} type="date" required />
                      </div>

                      <div className="row">
                        <label>Reason</label>
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Family function" required />
                      </div>

                      <button type="submit">Submit Leave</button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Leave Requests</h2>
                    <p className="card-subtitle">Approve/Reject as admin.</p>
                  </div>

                  <div className="card-body">
                    {!lvLoading && leaves.length === 0 ? (
                      <div className="toast">No leave requests yet.</div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee ID</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Reason</th>
                              <th>Status</th>
                              <th style={{ width: 220 }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaves.map((l) => (
                              <tr key={l._id}>
                                <td>{l.employeeId}</td>
                                <td>{toYMD(l.fromDate)}</td>
                                <td>{toYMD(l.toDate)}</td>
                                <td>{l.reason}</td>
                                <td>
                                  <span className="status">{l.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button className="secondary" onClick={() => updateLeaveStatus(l._id, "Approved")}>
                                      Approve
                                    </button>
                                    <button className="danger" onClick={() => updateLeaveStatus(l._id, "Rejected")}>
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12 }}>
            Tip: Render free backend may sleep. If something fails once, refresh dashboard.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

