import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./styles.css";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://hrms-lite-backend-yfmo.onrender.com";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  // form state
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      setError("Failed to load employees. Backend might be sleeping — refresh once.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const a = (e.employeeId || "").toLowerCase();
      const b = (e.fullName || "").toLowerCase();
      const c = (e.email || "").toLowerCase();
      const d = (e.department || "").toLowerCase();
      return [a, b, c, d].some((x) => x.includes(q));
    });
  }, [employees, query]);

  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      await axios.post(`${API_BASE}/api/employees`, {
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
      });

      // clear form
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setDepartment("Engineering");

      await fetchEmployees();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to add employee (duplicate Employee ID/email or invalid data)."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (id) => {
    const ok = window.confirm("Delete this employee?");
    if (!ok) return;

    try {
      setError("");
      await axios.delete(`${API_BASE}/api/employees/${id}`);
      await fetchEmployees();
    } catch (err) {
      setError("Failed to delete employee.");
    }
  };

  return (
    <>
      <div className="navbar">
        <div className="nav-inner">
          <div className="brand">
            HRMS Lite <span className="badge">Admin Dashboard</span>
          </div>
          <div className="badge">Live Backend Connected</div>
        </div>
      </div>

      <div className="container">
        <div className="actions">
          <div>
            <h1 style={{ margin: "0 0 6px" }}>Employees</h1>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Manage employees with add/delete actions. Search and refresh anytime.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              style={{ width: 260 }}
              placeholder="Search employees..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="secondary" onClick={fetchEmployees} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && <div className="toast error">{error}</div>}
        {!error && loading && <div className="toast">Loading employees…</div>}

        <div className="grid">
          {/* Add Employee */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Add Employee</h2>
              <p className="card-subtitle">Fill details and submit to create a new employee.</p>
            </div>
            <div className="card-body">
              <form onSubmit={addEmployee}>
                <div className="row">
                  <label>Employee ID</label>
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP001"
                    required
                  />
                </div>

                <div className="row">
                  <label>Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jaahanvi Mahour"
                    required
                  />
                </div>

                <div className="row">
                  <label>Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jaahanvi@gmail.com"
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

                <button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add Employee"}
                </button>
              </form>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <span className="status">Total: {employees.length}</span>
                <span className="status">Showing: {filteredEmployees.length}</span>
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Employee Directory</h2>
              <p className="card-subtitle">View all employees stored in MongoDB (live).</p>
            </div>

            <div className="card-body">
              {(!loading && filteredEmployees.length === 0) ? (
                <div className="toast">No employees found. Add your first employee from the left.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th style={{ width: 120 }}>Action</th>
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
                            <button className="danger" onClick={() => deleteEmployee(emp._id)}>
                              Delete
                            </button>
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

        <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12 }}>
          Tip: If the backend is on the free tier, it may sleep. Click “Refresh” once if data doesn’t load.
        </div>
      </div>
    </>
  );
}

export default App;
