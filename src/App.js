import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://hrms-lite-backend-yfmo.onrender.com";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form state
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      setError("Failed to load employees. Check backend URL / CORS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await axios.post(`${API_BASE}/api/employees`, {
        employeeId,
        fullName,
        email,
        department,
      });

      // clear form
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setDepartment("");

      // refresh list
      fetchEmployees();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to add employee (maybe duplicate email/employeeId)."
      );
    }
  };

  const deleteEmployee = async (id) => {
    try {
      setError("");
      await axios.delete(`${API_BASE}/api/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      setError("Failed to delete employee.");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>HRMS Dashboard</h1>

      {/* Add Employee Form */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          maxWidth: 520,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add Employee</h2>

        <form onSubmit={addEmployee}>
          <div style={{ marginBottom: 10 }}>
            <label>Employee ID</label>
            <br />
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP001"
              style={{ width: "100%", padding: 8 }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Full Name</label>
            <br />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jaahanvi Mahour"
              style={{ width: "100%", padding: 8 }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Email</label>
            <br />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jaahanvi@gmail.com"
              style={{ width: "100%", padding: 8 }}
              required
              type="email"
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Department</label>
            <br />
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              style={{ width: "100%", padding: 8 }}
              required
            />
          </div>

          <button style={{ padding: 10, width: "100%" }} type="submit">
            Add Employee
          </button>
        </form>
      </div>

      <button onClick={fetchEmployees} style={{ padding: 8, marginBottom: 12 }}>
        Refresh Employees
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && employees.length === 0 && <p>No employees found.</p>}

      {!loading && !error && employees.length > 0 && (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.employeeId || "-"}</td>
                <td>{emp.fullName || "-"}</td>
                <td>{emp.email}</td>
                <td>{emp.department || "-"}</td>
                <td>
                  <button
                    onClick={() => deleteEmployee(emp._id)}
                    style={{ padding: 6 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;



