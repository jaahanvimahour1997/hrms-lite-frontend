import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { api } from "./api";

function App() {
  const [tab, setTab] = useState("employees");

  // auth
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loginEmail, setLoginEmail] = useState("admin@test.com");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [authMsg, setAuthMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isAuthed = !!token;

  // dashboard stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    leavesPending: 0,
  });

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

  // edit mode
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

      // after login, refresh protected data
      await Promise.all([fetchAttendance(), fetchLeaves(), fetchStats()]);
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
  };

  // ---------- EMPLOYEES ----------
  const fetchEmployees = async () => {
    try {
      setEmpLoading(true);
      setEmpError("");
      const res = await api.get("/api/employees");
      setEmployees(res.data);
    } catch (err) {
      setEmpError("Failed to load employees.");
    } finally {
      setEmpLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  // Save employee (Add or Update)
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

      // reset form
      setEditId(null);
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setDepartment("Engineering");

      await fetchEmployees();
      await fetchStats();
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
      await fetchStats();
    } catch (err) {
      setEmpError("Failed to delete employee.");
    }
  };

  // ---------- ATTENDANCE ----------
  const fetchAttendance = async () => {
    try {
      setAttLoading(true);
      setAttError("");
      const res = await api.get("/api/attendance");
      setAttendance(res.data);
    } catch (err) {
      setAttError(err?.response?.data?.message || "Failed to load attendance.");
    } finally {
      setAttLoading(false);
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
      await fetchStats();
    } catch (err) {
      setAttError(err?.response?.data?.message || "Failed to mark attendance.");
    }
  };

  // ---------- LEAVES ----------
  const fetchLeaves = async () => {
    try {
      setLvLoading(true);
      setLvError("");
      const res = await api.get("/api/leaves");
      setLeaves(res.data);
    } catch (err) {
      setLvError(err?.response?.data?.message || "Failed to load leaves.");
    } finally {
      setLvLoading(false);
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
      await fetchStats();
    } catch (err) {
      setLvError(err?.response?.data?.message || "Failed to apply leave.");
    }
  };

  const updateLeaveStatus = async (id, status) => {
    try {
      setLvError("");
      await api.put(`/api/leaves/${id}`, { status });
      await fetchLeaves();
      await fetchStats();
    } catch (err) {
      setLvError(err?.response?.data?.message || "Failed to update leave status.");
    }
  };

  // ---------- STATS ----------
  const fetchStats = async () => {
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        api.get("/api/employees"),
        isAuthed ? api.get("/api/attendance") : Promise.resolve({ data: [] }),
        isAuthed ? api.get("/api/leaves") : Promise.resolve({ data: [] }),
      ]);

      const today = new Date().toISOString().slice(0, 10);

      const presentToday = (attRes.data || []).filter(
        (a) => String(a.date).slice(0, 10) === today && a.status === "Present"
      ).length;

      const leavesPending = (leaveRes.data || []).filter((l) => l.status === "Pending").length;

      setStats({
        totalEmployees: (empRes.data || []).length,
        presentToday,
        leavesPending,
      });
    } catch (err) {
      console.log("Stats fetch error:", err?.message);
    }
  };

  useEffect(() => {
    if (tab === "attendance" && isAuthed) fetchAttendance();
    if (tab === "leaves" && isAuthed) fetchLeaves();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAuthed]);

  // ✅ INTERACTIVE LOGIN PAGE
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

  // ---------- UI ----------
  return (
    <>
      <div className="navbar">
        <div className="nav-inner">
          <div className="brand">
            HRMS Lite <span className="badge">Admin Dashboard</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge">JWT: Saved</span>
            <button className="secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {authMsg && (
          <div className={`toast ${authMsg.includes("❌") ? "error" : ""}`}>
            {authMsg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button className={tab === "employees" ? "" : "secondary"} onClick={() => setTab("employees")}>
            Employees
          </button>
          <button className={tab === "attendance" ? "" : "secondary"} onClick={() => setTab("attendance")}>
            Attendance
          </button>
          <button className={tab === "leaves" ? "" : "secondary"} onClick={() => setTab("leaves")}>
            Leaves
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {tab === "employees" && (
              <input
                style={{ width: 260 }}
                placeholder="Search employees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
            {tab === "employees" && (
              <button className="secondary" onClick={fetchEmployees} disabled={empLoading}>
                {empLoading ? "Refreshing..." : "Refresh"}
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p>{stats.totalEmployees}</p>
          </div>
          <div className="stat-card">
            <h3>Present Today</h3>
            <p>{stats.presentToday}</p>
          </div>
          <div className="stat-card">
            <h3>Leaves Pending</h3>
            <p>{stats.leavesPending}</p>
          </div>
        </div>

        {/* EMPLOYEES PAGE */}
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
                      </select>
                    </div>

                    <button type="submit" disabled={savingEmp}>
                      {savingEmp ? "Saving..." : editId ? "Update Employee" : "Add Employee"}
                    </button>

                    {editId && (
                      <button type="button" className="secondary" onClick={cancelEdit} style={{ marginTop: 10 }}>
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

        {/* ATTENDANCE PAGE */}
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
                      <input value={attEmployeeId} onChange={(e) => setAttEmployeeId(e.target.value)} placeholder="EMP001" required />
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

                  <div style={{ marginTop: 12 }}>
                    <button className="secondary" onClick={fetchAttendance}>
                      Refresh Attendance
                    </button>
                  </div>
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
                              <td>{String(a.date).slice(0, 10)}</td>
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

        {/* LEAVES PAGE */}
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
                      <input value={lvEmployeeId} onChange={(e) => setLvEmployeeId(e.target.value)} placeholder="EMP001" required />
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

                  <div style={{ marginTop: 12 }}>
                    <button className="secondary" onClick={fetchLeaves}>
                      Refresh Leaves
                    </button>
                  </div>
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
                              <td>{String(l.fromDate).slice(0, 10)}</td>
                              <td>{String(l.toDate).slice(0, 10)}</td>
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
          Tip: Render free backend may sleep. If a protected page shows error once, login and refresh.
        </div>
      </div>
    </>
  );
}

export default App;
