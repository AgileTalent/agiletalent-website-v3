"use strict";

/* =========================================================
   SALARYSENSE AI
   AgileTalent Associates Limited
   Frontend integration with the SalarySense FastAPI backend
   ========================================================= */

const API = (
  window.SALARYSENSE_API_BASE ||
  "https://agiletalent-salarysense-ai.onrender.com"
).replace(/\/+$/, "");

let lastResult = null;

const $ = id => document.getElementById(id);

const money = value => {
  const amount = Number(value);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
};

const pensionNames = new Set([
  "basic",
  "basic salary",
  "basic pay",
  "housing",
  "housing allowance",
  "house allowance",
  "accommodation allowance",
  "transport",
  "transport allowance",
  "transportation allowance"
]);

function toggle(id, show) {
  const element = $(id);

  if (element) {
    element.classList.toggle("hidden", !show);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function monthlyGross() {
  const amount = Number($("gross").value || 0);

  return $("frequency").value === "annual"
    ? amount / 12
    : amount;
}

/* =========================================================
   SALARY COMPONENTS
   ========================================================= */

function addComponent(data = {}) {
  const div = document.createElement("div");

  div.className = "component-row";

  const componentName = escapeHTML(data.name || "");
  const fixedAmount = Number(data.fixed_amount || 0);
  const percentage = Number(data.percentage || 0);

  div.innerHTML = `
    <div class="component-fields">
      <div class="component-grid">

        <label>
          Component name
          <input
            class="c-name"
            value="${componentName}"
            placeholder="e.g. Basic Salary"
          >
        </label>

        <label>
          Component type
          <select class="c-type">
            <option value="cash">Cash paid to me</option>
            <option value="benefit_in_kind">Benefit in kind</option>
            <option value="reimbursement">Expense reimbursement</option>
          </select>
        </label>

        <label>
          Fixed amount (₦)
          <input
            class="c-fixed"
            type="number"
            min="0"
            step="0.01"
            value="${fixedAmount}"
          >
        </label>

        <label>
          Percentage (%)
          <input
            class="c-pct"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value="${percentage}"
          >
        </label>

      </div>

      <label class="check">
        <input class="c-tax" type="checkbox" checked>
        Include as taxable income
      </label>
    </div>

    <button
      type="button"
      class="remove-component"
      aria-label="Remove salary component"
      title="Remove component"
    >
      ×
    </button>
  `;

  div.querySelector(".c-type").value = data.type || "cash";

  div.querySelector(".c-tax").checked = data.taxable !== false;

  div.querySelector(".remove-component").addEventListener("click", () => {
    div.remove();
    refreshPensionGuidance();
  });

  div.querySelectorAll("input, select").forEach(element => {
    element.addEventListener("input", refreshPensionGuidance);
    element.addEventListener("change", refreshPensionGuidance);
  });

  $("components").appendChild(div);

  refreshPensionGuidance();
}

function collectComponents() {
  return [...document.querySelectorAll(".component-row")].map(element => ({
    name:
      element.querySelector(".c-name").value.trim() ||
      "Unnamed component",

    type: element.querySelector(".c-type").value,

    fixed_amount: Number(
      element.querySelector(".c-fixed").value || 0
    ),

    percentage: Number(
      element.querySelector(".c-pct").value || 0
    ),

    taxable: element.querySelector(".c-tax").checked
  }));
}

function componentPensionBase() {
  if ($("structureMode").value !== "custom") {
    return 0;
  }

  const components = collectComponents();
  const gross = monthlyGross();

  const fixedTotal = components.reduce(
    (sum, component) => sum + component.fixed_amount,
    0
  );

  const remaining = Math.max(0, gross - fixedTotal);

  return components.reduce((sum, component) => {
    const name = component.name
      .trim()
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ");

    const isPensionable =
      component.type === "cash" &&
      pensionNames.has(name);

    if (!isPensionable) {
      return sum;
    }

    return sum +
      component.fixed_amount +
      remaining * component.percentage / 100;

  }, 0);
}

/* =========================================================
   FORM GUIDANCE
   ========================================================= */

function refreshPensionGuidance() {
  if (!$("pensionEnabled").checked) {
    toggle("pensionFields", false);
    return;
  }

  toggle("pensionFields", true);

  const autoBase = componentPensionBase();
  const hasAutomaticBase = autoBase > 0;

  toggle("pensionAutoMessage", hasAutomaticBase);
  toggle("pensionBaseChoice", !hasAutomaticBase);

  if (
    hasAutomaticBase &&
    $("pensionBaseMode").value !== "manual"
  ) {
    $("pensionBaseMode").value = "";
  }

  toggle(
    "pensionManualWrap",
    $("pensionBaseMode").value === "manual"
  );
}

$("addComponent").addEventListener("click", () => {
  addComponent();
});

$("structureMode").addEventListener("change", event => {
  toggle("componentsWrap", event.target.value === "custom");
  refreshPensionGuidance();
});

$("pensionEnabled").addEventListener(
  "change",
  refreshPensionGuidance
);

$("pensionBaseMode").addEventListener("change", () => {
  toggle(
    "pensionManualWrap",
    $("pensionBaseMode").value === "manual"
  );
});

$("gross").addEventListener("input", refreshPensionGuidance);

$("frequency").addEventListener("change", refreshPensionGuidance);

$("nhfEnabled").addEventListener("change", event => {
  toggle("nhfAmountWrap", event.target.checked);
});

$("nhiaEnabled").addEventListener("change", event => {
  toggle("nhiaAmountWrap", event.target.checked);
});

/* =========================================================
   API HELPERS
   ========================================================= */

async function apiRequest(endpoint, payload) {
  const response = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unexpected response. Please try again."
    );
  }

  if (!response.ok) {
    const detail = data.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : "We couldn't complete your request. Please check your entries."
    );
  }

  return data;
}

/* =========================================================
   BUILD PAYROLL REQUEST
   ========================================================= */

function buildPayrollPayload() {
  const custom = $("structureMode").value === "custom";

  const automaticBase = componentPensionBase();

  let baseMode = "";
  let manualBase = null;

  if ($("pensionEnabled").checked && automaticBase <= 0) {
    baseMode = $("pensionBaseMode").value;

    if (!baseMode) {
      throw new Error(
        "Please select how your pensionable salary should be estimated. " +
        "If you don't know the amount, you can choose to continue without estimating pension."
      );
    }

    if (baseMode === "manual") {
      manualBase = Number($("pensionBase").value);

      if (!Number.isFinite(manualBase) || manualBase <= 0) {
        throw new Error(
          "Please enter the monthly salary amount used for pension."
        );
      }
    }
  }

  if (
    $("pensionEnabled").checked &&
    automaticBase > 0 &&
    $("pensionBaseMode").value === "manual"
  ) {
    manualBase = Number($("pensionBase").value);

    if (!Number.isFinite(manualBase) || manualBase <= 0) {
      throw new Error(
        "Please enter the monthly salary amount used for pension."
      );
    }

    baseMode = "manual";
  }

  const overrideValue = Number(
    $("pensionBaseOverride").value || 0
  );

  if ($("pensionEnabled").checked && overrideValue > 0) {
    manualBase = overrideValue;
    baseMode = "manual";
  }

  return {
    gross_salary: Number($("gross").value),

    frequency: $("frequency").value,

    components: custom ? collectComponents() : [],

    pension: {
      enabled: $("pensionEnabled").checked,

      employee_rate: Number($("employeeRate").value),

      employer_rate: Number($("employerRate").value),

      pensionable_emoluments_monthly: manualBase,

      base_mode: baseMode
    },

    nhf: {
      enabled: $("nhfEnabled").checked,

      monthly_amount: Number($("nhfAmount").value || 0)
    },

    nhia: {
      enabled: $("nhiaEnabled").checked,

      monthly_amount: Number($("nhiaAmount").value || 0)
    },

    reliefs: {
      annual_rent_paid: Number($("rent").value || 0)
    },

    other_deductions: {
      monthly_amount: Number(
        $("otherDeductions").value || 0
      )
    }
  };
}

/* =========================================================
   DISPLAY PAYROLL RESULT
   ========================================================= */

function renderBreakdown(data) {
  const rows = [
    ["Monthly gross salary", data.monthly_gross],
    ["Estimated monthly PAYE", data.monthly_paye_estimate],
    ["Employee pension contribution", data.employee_pension_monthly],
    ["NHF contribution", data.nhf_monthly],
    ["Health insurance contribution", data.nhia_monthly],
    ["Other deductions", data.other_deductions_monthly]
  ];

  if (
    Number(data.employee_pension_monthly) > 0 ||
    Number(data.monthly_pensionable_emoluments) > 0
  ) {
    rows.splice(2, 0, [
      "Salary used for pension",
      data.monthly_pensionable_emoluments
    ]);
  }

  const breakdownRows = rows.map(([label, value]) => `
    <div class="breakdown-row">
      <span>${escapeHTML(label)}</span>
      <strong>${money(value)}</strong>
    </div>
  `).join("");

  const components = Array.isArray(data.monthly_components)
    ? data.monthly_components
    : [];

  const componentRows = components.map(component => `
    <div class="breakdown-row">
      <span>${escapeHTML(component.name)}</span>
      <strong>${money(component.amount)}</strong>
    </div>
  `).join("");

  $("breakdown").innerHTML = `
    ${breakdownRows}

    <div class="breakdown-row total">
      <span>Estimated monthly take-home</span>
      <strong>${money(data.monthly_net_cash_estimate)}</strong>
    </div>

    <div class="breakdown-row">
      <span>Estimated annual take-home</span>
      <strong>${money(data.annual_net_cash_estimate)}</strong>
    </div>

    <div class="breakdown-row">
      <span>Employer pension contribution (additional)</span>
      <strong>${money(data.employer_pension_monthly_separate)}</strong>
    </div>

    <h3>Salary components</h3>

    ${componentRows || "<p>No individual salary components were supplied.</p>"}
  `;

  const notes = Array.isArray(data.notes) ? data.notes : [];

  $("notesList").innerHTML = notes.map(note => `
    <li>${escapeHTML(note)}</li>
  `).join("");

  toggle("calculationNotes", notes.length > 0);
}

/* =========================================================
   CALCULATE SALARY
   ========================================================= */

$("salaryForm").addEventListener("submit", async event => {
  event.preventDefault();

  $("error").textContent = "";
  $("net").textContent = "Calculating…";

  $("breakdown").innerHTML = `
    <p>Processing your payroll calculation. Please wait.</p>
  `;

  $("aiAnswer").textContent = "";

  lastResult = null;

  const calculateButton = $("salaryForm").querySelector(
    'button[type="submit"]'
  );

  calculateButton.disabled = true;
  calculateButton.textContent = "Calculating…";

  try {
    const payload = buildPayrollPayload();

    if (
      !Number.isFinite(payload.gross_salary) ||
      payload.gross_salary <= 0
    ) {
      throw new Error("Please enter a valid gross salary.");
    }

    const data = await apiRequest(
      "/api/payroll/calculate",
      payload
    );

    lastResult = data;

    $("net").textContent = money(
      data.monthly_net_cash_estimate
    );

    renderBreakdown(data);

    $("breakdown").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });

  } catch (error) {
    $("net").textContent = "₦—";

    $("breakdown").innerHTML = `
      <p>Your result could not be displayed.</p>
    `;

    $("error").textContent =
      error.message ||
      "We couldn't complete the calculation. Please try again.";

  } finally {
    calculateButton.disabled = false;
    calculateButton.textContent = "Calculate my take-home pay";
  }
});

/* =========================================================
   AI EXPLANATION
   ========================================================= */

$("askAI").addEventListener("click", async () => {
  if (!lastResult) {
    $("aiAnswer").textContent =
      "Please calculate your salary first before requesting an explanation.";

    return;
  }

  const question =
    $("question").value.trim() ||
    "Explain my salary result in simple terms.";

  const button = $("askAI");

  button.disabled = true;
  button.textContent = "Preparing explanation…";

  $("aiAnswer").textContent =
    "SalarySense AI is reviewing your completed calculation.";

  try {
    const data = await apiRequest(
      "/api/assistant/explain",
      {
        question,
        result: lastResult
      }
    );

    $("aiAnswer").textContent =
      data.answer ||
      "No explanation was returned. Please try again.";

  } catch (error) {
    $("aiAnswer").textContent =
      "Your salary calculation is still available, but the AI explanation service is temporarily unavailable.";
  } finally {
    button.disabled = false;
    button.textContent = "Explain my result";
  }
});

/* =========================================================
   INITIALISE
   ========================================================= */

toggle("componentsWrap", false);
toggle("pensionFields", false);
toggle("nhfAmountWrap", false);
toggle("nhiaAmountWrap", false);
toggle("pensionManualWrap", false);

refreshPensionGuidance();
