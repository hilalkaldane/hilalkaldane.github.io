import React, { useEffect, useState } from "react";
import { merchantProtectedApi } from "../services/merchantProtectedApi";

/* ---------- UI Helpers ---------- */

const Section = ({ title, children }) => (
  <section className="bg-card-light dark:bg-card-dark rounded-lg p-5 shadow-sm">
    <h2 className="text-base font-semibold text-text-main-light dark:text-white text-gray-800 mb-4">
      {title}
    </h2>
    {children}
  </section>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right break-all text-text-main-light dark:text-white">
      {value ?? "-"}
    </span>
  </div>
);

/* 🔒 Rule: frontend shows DATE ONLY */
const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/* ---------- Validation ---------- */

const USERNAME_REGEX = /^[a-zA-Z]+(-[a-zA-Z]+)?$/;

const isValidUsername = (u) => {
  const v = u.trim();
  return v.length >= 3 && v.length <= 15 && USERNAME_REGEX.test(v);
};

/* ---------- Main Component ---------- */

export default function MerchantProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createUserError, setCreateUserError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    userName: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    merchantProtectedApi
      .getProfile()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setCreateUserError(null); // 🔥 clear error on any change
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Failed to load</div>;

  const { loggedInUser, business, employees = [] } = data;
  const isOwner = loggedInUser.merchantUserRole === "OWNER";

  // 🔒 Rule 3.3: max 2 employees
  const canAddEmployee = isOwner && employees.length < 2;

  const formValid =
    form.name.trim().length >= 3 &&
    isValidUsername(form.userName) &&
    form.phone.trim().length > 0 &&
    form.password.length >= 6;

  const createEmployee = async () => {
    if (!formValid) return;

    setCreating(true);
    try {
      await merchantProtectedApi.createEmployee({
        name: form.name.trim(),
        userName: form.userName.trim(),
        phone: form.phone.trim(),
        password: form.password,
        // 🔒 role NOT sent — backend enforces EMPLOYEE
      });

      const refreshed = await merchantProtectedApi.getProfile();
      setData(refreshed);
      setShowAddForm(false);
      setForm({ name: "", userName: "", phone: "", password: "" });
    } catch (error) {
      setCreateUserError(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 dark:bg-background-dark">
      {/* ---------- FULL WIDTH HERO ---------- */}
      {isOwner &&
        business && (
          <div
            className="w-full h-56 bg-cover bg-center bg-slate-100 dark:bg-white/5"
            style={{
              backgroundImage: `url(https://faydapoint-media-dev.s3.ap-south-1.amazonaws.com/${business.heroImage})`,
            }}
          />
        )}
      {/* Logged-in User */}
      <Section title="Logged-in User">
        <Row label="Name" value={loggedInUser.merchantUserName} />
        <Row label="User ID" value={loggedInUser.merchantUserNameId} />
        <Row label="Phone" value={loggedInUser.merchantUserPhone} />
        <Row label="Role" value={loggedInUser.merchantUserRole} />
      </Section>

      {/* Business Info */}
      {isOwner && business && (
        <Section title="Business Information">
          <Row label="Business Name" value={business.name} />
          <Row label="Business ID" value={business.merchantNameId} />
          <Row label="Phone" value={business.phone} />
          <Row label="Category" value={business.category} />
          <Row label="Subcategory" value={business.subcategory} />
          <Row label="Offerings" value={business.offerings.join(" , ")} />
          <Row label="Status" value={business.status} />
          <Row label="Address" value={business.address} />
          <Row label="Created At" value={formatDate(business.createdAt)} />
          <Row label="Updated At" value={formatDate(business.updatedAt)} />
        </Section>
      )}

      {/* Employees */}
      {isOwner && (
        <Section title="Employees">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-text-main-light dark:text-white">
            {employees.map((emp) => (
              <div
                key={emp.merchantUserNameId}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="font-medium">{emp.merchantUserName}</div>
                <div className="text-sm text-gray-600">
                  {emp.merchantUserEmail}
                </div>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 dark:text-black">
                  {emp.merchantUserRole}
                </span>
              </div>
            ))}
          </div>

          {canAddEmployee && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm px-4 py-2 border rounded bg-white hover:bg-gray-50"
            >
              + Add Employee
            </button>
          )}

          {canAddEmployee && showAddForm && (
            <div className="mt-4 border rounded p-4 space-y-3 bg-gray-50">
              <input
                className="w-full border p-2 rounded"
                placeholder="Name (min 3 chars)"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Username (e.g. john-doe)"
                value={form.userName}
                onChange={(e) => updateForm("userName", e.target.value)}
              />
              {!isValidUsername(form.userName) && form.userName && (
                <div className="text-xs text-red-600">
                  Invalid username format
                </div>
              )}

              <input
                className="w-full border p-2 rounded"
                placeholder="Phone (required)"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
              />

              {/* 🔒 password field */}
              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  disabled={!formValid || creating}
                  onClick={createEmployee}
                  className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {createUserError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {createUserError}
            </div>
          )}

          {!canAddEmployee && (
            <div className="text-sm text-gray-500">
              Employee limit reached (max 2)
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
