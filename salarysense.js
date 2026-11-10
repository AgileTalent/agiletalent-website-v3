"use strict";

const API = (
  window.SALARYSENSE_API_BASE ||
  "https://agiletalent-salarysense-ai.onrender.com"
).replace(/\/+$/, "");

let lastResult = null;

const $ = id => document.getElementById(id);

const money = value =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);

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
  if (element) element.classList.toggle("hidden", !show);
}

function monthlyGross() {
  const amount = Number($("gross")?.value || 0);
  return $("frequency")?.value === "annual" ? amount / 12 : amount;
}

function normaliseName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
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

function addComponent(data = {}) {
  const div = document.createElement("div");
  div.className = "component";

  const name = document.createElement("input");
  name.className = "c-name";
  name.placeholder = "e.g. Basic Salary";
  name.value = data.name || "";

  const type = document.createElement("select");
  type.className = "c-type";
  type.innerHTML = `
    <option value="cash">Cash paid to me</option>
    <option value="benefit_in_kind">Benefit provided to me</option>
    <option value="reimbursement">Work expense reimbursement</option>
  `;
  type.value = data.type || "cash";

  const fixed = document.createElement("input");
  fixed.className = "c-fixed";
  fixed.type = "number";
  fixed.min = "0";
  fixed.step = "0.01";
  fixed.value = data.fixed_amount || 0;

  const percentage = document.createElement("input");
  percentage.className = "c-pct";
  percentage.type = "number";
  percentage.min = "0";
  percentage.max = "100";
  percentage.step = "0.01";
  percentage.value = data.percentage || 0;

  const taxable = document.createElement("input");
  taxable.className = "c-tax";
  taxable.type = "checkbox";
  taxable.checked = data.taxable !== false;

  const pensionable = document.createElement("input");
  pensionable.className = "c-pensionable";
  pensionable.type = "checkbox";
  pensionable.checked = Boolean(data.pensionable);

  div.innerHTML = `
    <button type="button" class="remove">Remove</button>
    <div class="component-grid">
      <label>Salary component name</label>
      <label>Component type</label>
      <label>Fixed amount (₦)</label>
      <label>Percentage of remaining salary (%)</label>
    </div>
    <div class="component-grid component-inputs">
      <div class="component-name-slot"></div>
      <div class="component-type-slot"></div>
      <div class="component-fixed-slot"></div>
      <div class="component-pct-slot"></div>
    </div>
    <label class="check taxable-check">
      <span>Include as taxable income</span>
    </label>
    <label class="check pensionable-check">
      <span>Include as pensionable salary</span>
    </label>
  `;

  div.querySelector(".component-name-slot").appendChild(name);
  div.querySelector(".component-type-slot").appendChild(type);
  div.querySelector(".component-fixed-slot").appendChild(fixed);
  div.querySelector(".component-pct-slot").appendChild(percentage);
  div.querySelector(".taxable-check").prepend(taxable);
  div.querySelector(".pensionable-check").prepend(pensionable);

  div.querySelector(".remove").addEventListener("click", () => {
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
  return [...document.querySelectorAll(".component")].map(element => ({
    name: element.querySelector(".c-name").value.trim() || "Unnamed component",
    type: element.querySelector(".c-type").value,
    fixed_amount: Number(element.querySelector(".c-fixed").value || 0),
    percentage: Number(element.querySelector(".c-pct").value || 0),
    taxable: element.querySelector(".c-tax").checked,
    pensionable:
      element.querySelector(".c-pensionable").checked ||
      (
        element.querySelector(".c-type").value === "cash" &&
        pensionNames.has(normaliseName(element.querySelector(".c-name").value))
      )
  }));
}

function allocatedComponents() {
  const gross = monthlyGross();
  const rows = collectComponents();

  const fixedTotal = rows.reduce(
    (sum, component) => sum + component.fixed_amount,
    0
  );

  const percentageTotal = rows.reduce(
    (sum, component) => sum + component.percentage,
    0
  );

  const remaining = gross - fixedTotal;

  if (remaining < -0.01 || percentageTotal > 100.0001) {
    return [];
  }

  return rows.map(component => ({
    ...component,
    amount:
      component.fixed_amount +
      remaining * component.percentage / 100
  }));
}

function componentPensionBase() {
  if ($("structureMode").value !== "custom") return 0;

  return allocatedComponents().reduce((sum, component) => {
    if (
      component.type === "cash" &&
      component.pensionable
    ) {
      return sum + component.amount;
    }

    return sum;
  }, 0);
}

function refreshPensionGuidance() {
  if (!$("pensionEnabled").checked) {
    toggle("pensionFields", false);
    return;
  }

  toggle("pensionFields", true);

  const automaticBase = componentPensionBase();
  const hasAutomaticBase = automaticBase > 0;

  toggle("pensionAutoMessage", hasAutomaticBase);
  toggle("pensionBaseChoice", !hasAutomaticBase);

  if (hasAutomaticBase && $("pensionBaseMode").value !== "manual") {
    $("pensionBaseMode").value = "";
  }

  toggle(
    "pensionManualWrap",
    $("pensionBaseMode").value === "manual"
  );
}

async function readAPIResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const message = await response.text();
    throw new Error(
      message || `The server returned an unexpected response (${response.status}).`
    );
  }

  if (!response.ok) {
    const detail = data.detail;

    throw new Error(
      Array.isArray(detail)
        ? detail.map(item => item.msg).join("; ")
        : detail || `Request failed (${response.status}).`
    );
  }

  return data;
}

function setCalculationError(message) {
  $("net").textContent = "₦—";
  $("error").textContent = message;
}

function renderResults(data) {
  lastResult = data;

  $("net").textContent = money(data.monthly_net_cash_estimate);

  const rows = [
    ["Monthly gross salary", data.monthly_gross],
    ["Estimated monthly PAYE", data.monthly_paye_estimate],
    ["Employee pension contribution", data.employee_pension_monthly],
    ["NHF contribution", data.nhf_monthly],
    ["Health insurance contribution", data.nhia_monthly],
    ["Other deductions", data.other_deductions_monthly],
    ["Estimated annual take-home", data.annual_net_cash_estimate]
  ];

  if (Number(data.monthly_pensionable_emoluments) > 0) {
    rows.splice(3, 0, [
      "Salary used for pension",
      data.monthly_pensionable_emoluments
    ]);
  }

  const breakdown = $("breakdown");

  breakdown.replaceChildren();

  rows.forEach(([label, value]) => {
    const line = document.createElement("div");
    line.className = "line";

    const title = document.createElement("span");
    title.textContent = label;

    const amount = document.createElement("strong");
    amount.textContent = money(value);

    line.append(title, amount);
    breakdown.appendChild(line);
  });

  const employerLine = document.createElement("div");
  employerLine.className = "line employer-line";

  const employerLabel = document.createElement("span");
  employerLabel.textContent = "Employer pension contribution (additional)";

  const employerAmount = document.createElement("strong");
  employerAmount.textContent = money(
    data.employer_pension_monthly_separate
  );

  employerLine.append(employerLabel, employerAmount);
  breakdown.appendChild(employerLine);

  const heading = document.createElement("h3");
  heading.textContent = "Salary components";
  breakdown.appendChild(heading);

  (data.monthly_components || []).forEach(component => {
    const line = document.createElement("div");
    line.className = "line";

    const label = document.createElement("span");
    label.textContent = component.name || "Salary component";

    const amount = document.createElement("strong");
    amount.textContent = money(component.amount);

    line.append(label, amount);
    breakdown.appendChild(line);
  });

  const notesList = $("notesList");
  notesList.replaceChildren();

  (data.notes || []).forEach(note => {
    const item = document.createElement("li");
    item.textContent = note;
    notesList.appendChild(item);
  });

  toggle("calculationNotes", true);
}

async function calculateSalary(event) {
  event.preventDefault();

  $("error").textContent = "";
  $("net").textContent = "Calculating…";
  $("breakdown").innerHTML = "<p>Processing your payroll estimate…</p>";

  const gross = Number($("gross").value);

  if (!Number.isFinite(gross) || gross <= 0) {
    setCalculationError("Please enter a valid gross salary greater than zero.");
    return;
  }

  const custom = $("structureMode").value === "custom";
  const components = custom ? collectComponents() : [];

  if (custom) {
    const fixedTotal = components.reduce(
      (sum, component) => sum + component.fixed_amount,
      0
    );

    const percentageTotal = components.reduce(
      (sum, component) => sum + component.percentage,
      0
    );

    if (fixedTotal > monthlyGross() + 0.01) {
      setCalculationError("Your fixed component amounts exceed your gross salary.");
      return;
    }

    if (percentageTotal > 100.0001) {
      setCalculationError("Your percentage allocations cannot exceed 100%.");
      return;
    }

    const allocatedTotal = allocatedComponents().reduce(
      (sum, component) => sum + component.amount,
      0
    );

    if (Math.abs(allocatedTotal - monthlyGross()) > 0.02) {
      setCalculationError(
        "Your salary components must add up to your gross salary. Please review the fixed amounts and percentages."
      );
      return;
    }
  }

  const automaticPensionBase = componentPensionBase();

  let baseMode = "";
  let manualBase = null;

  if ($("pensionEnabled").checked && automaticPensionBase <= 0) {
    baseMode = $("pensionBaseMode").value;

    if (!baseMode) {
      setCalculationError(
        "Please choose how to estimate your pensionable salary."
      );
      return;
    }

    if (baseMode === "manual") {
      manualBase = Number($("pensionBase").value);

      if (!Number.isFinite(manualBase) || manualBase <= 0) {
        setCalculationError(
          "Please enter the monthly salary amount used for pension."
        );
        return;
      }
    }
  }

  if (
    $("pensionEnabled").checked &&
    $("pensionBaseMode").value === "manual"
  ) {
    manualBase = Number($("pensionBase").value);
    baseMode = "manual";

    if (!Number.isFinite(manualBase) || manualBase <= 0) {
      setCalculationError(
        "Please enter the monthly salary amount used for pension."
      );
      return;
    }
  }

  const overrideValue = Number($("pensionBaseOverride").value || 0);

  if ($("pensionEnabled").checked && overrideValue > 0) {
    manualBase = overrideValue;
    baseMode = "manual";
  }

  const payload = {
    gross_salary: gross,
    frequency: $("frequency").value,

    components,

    pension: {
      enabled: $("pensionEnabled").checked,
      employee_rate: Number($("employeeRate").value || 8),
      employer_rate: Number($("employerRate").value || 10),
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
      monthly_amount: Number($("otherDeductions").value || 0)
    }
  };

  try {
    const response = await fetch(`${API}/api/payroll/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await readAPIResponse(response);
    renderResults(data);

  } catch (error) {
    console.error("SalarySense calculation error:", error);

    if (error instanceof TypeError) {
      setCalculationError(
        "We could not connect to SalarySense. Please refresh the page and try again. If the problem continues, the website's API access configuration needs attention."
      );
    } else {
      setCalculationError(
        error.message || "We could not complete the calculation. Please try again."
      );
    }
  }
}

async function askSalarySense() {
  if (!lastResult) {
    $("aiAnswer").textContent = "Please calculate your salary first.";
    return;
  }

  const question =
    $("question").value.trim() ||
    "Explain my salary result in simple terms.";

  $("askAI").disabled = true;
  $("aiAnswer").textContent = "Preparing your explanation…";

  try {
    const response = await fetch(`${API}/api/assistant/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        question,
        result: lastResult
      })
    });

    const data = await readAPIResponse(response);

    $("aiAnswer").textContent =
      data.answer || "No explanation was returned.";

  } catch (error) {
    console.error("SalarySense AI explanation error:", error);

    $("aiAnswer").textContent =
      "Your calculation is available, but the AI explanation service could not be reached. Please try again later.";

  } finally {
    $("askAI").disabled = false;
  }
}

function initialiseSalarySense() {
  if (!$("salaryForm")) return;

  $("addComponent").addEventListener("click", () => addComponent());

  $("salaryForm").addEventListener("submit", calculateSalary);

  $("askAI").addEventListener("click", askSalarySense);

  $("structureMode").addEventListener("change", event => {
    toggle("componentsWrap", event.target.value === "custom");
    refreshPensionGuidance();
  });

  $("pensionEnabled").addEventListener("change", refreshPensionGuidance);

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

  refreshPensionGuidance();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseSalarySense);
} else {
  initialiseSalarySense();
}
