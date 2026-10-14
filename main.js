/* AgileTalent Associates Limited
   Shared script: responsive menu and enquiry form
*/

const SITE = {
  name: "AgileTalent Associates Limited",
  email: "agiletalents@outlook.com"
};

const GOOGLE_FORM = {
  action: "https://docs.google.com/forms/d/e/1FAIpQLScBjtHUMUPaBm4mpfFWOR3PKpIQIRRhUJvMGTyRaIfueTacQg/formResponse",
  entries: {
    name: "entry.557000281",
    company: "entry.604062627",
    email: "entry.950094608",
    phone: "entry.100862902",
    service: "entry.237728569",
    size: "entry.1170657527",
    message: "entry.1468914824",
    consent: "entry.1827230671"
  }
};

const CONSENT_TEXT =
  "I agree that AgileTalent Associates Limited may use my details to respond to this enquiry.";

const SERVICES = [
  {
    id: "recruitment",
    t: "Recruitment and Talent Acquisition",
    c: "Hiring takes managers away from their real work, and a poor hire is expensive to correct.",
    h: "We run recruitment on your behalf: sourcing, screening, interview scheduling, candidate communication and shortlisting. We support one-off roles, recurring hiring and volume recruitment, with activities agreed for each engagement.",
    b: "Less administrative load on your team, better coordination between you and candidates, and a clearer basis for hiring decisions.",
    n: "Share the roles and hiring context. We agree scope and responsibilities in writing before work begins.",
    s: "Recruitment outsourcing without a large internal team."
  },
  {
    id: "hr-consulting",
    t: "HR Consulting and People Operations",
    c: "Growing businesses often run on informal HR practice, which creates inconsistency and avoidable disputes.",
    h: "We design HR processes, write policies, procedures and employee handbooks, build documentation, and set up performance management and employee relations frameworks. We also support workforce planning and organisational structuring.",
    b: "Consistent people practices, clearer manager expectations and fewer avoidable people issues.",
    n: "An HR health check of what you have today, followed by a prioritised plan.",
    s: "Structured HR without a large in-house department."
  },
  {
    id: "payroll",
    t: "SME Payroll and HR Administration",
    c: "Late or inaccurate pay damages employee trust, and weak records make PAYE and other statutory obligations harder to manage.",
    h: "We support payroll administration and processing, employee records management, payroll reporting and reconciliation, and the HR documentation that sits behind them.",
    b: "Reliable, repeatable payroll cycles and records you can rely on.",
    n: "We review your current payroll process and agree what we take on. Statutory positions should be confirmed with your tax adviser or the relevant authority.",
    s: "Dependable payroll and records for growing teams."
  },
  {
    id: "performance",
    t: "Performance Management and Workforce Effectiveness",
    c: "When goals are unclear and feedback is rare, performance reviews become a yearly formality instead of a management tool.",
    h: "We design performance frameworks, support KPI and goal setting, build review processes, develop managers' capability, and help you report on workforce data.",
    b: "Clear accountability, better conversations between managers and teams, and people decisions backed by evidence.",
    n: "A short diagnostic of how performance is managed today, then a framework sized to your organisation.",
    s: "Performance management that drives business results."
  },
  {
    id: "learning",
    t: "Learning and Development",
    c: "Capability gaps, especially among first-time managers, slow teams down and are rarely fixed by generic training.",
    h: "We run training needs analysis, shape learning strategy, and deliver leadership, management and capability programmes. We evaluate whether training changes how work is done.",
    b: "Learning tied to real workplace gaps, with a way to judge whether it worked.",
    n: "We start with the capability gap, not a course catalogue.",
    s: "Practical learning with measurable workplace application."
  },
  {
    id: "advisory",
    t: "HR Advisory and Business Support",
    c: "Many businesses need senior HR judgement regularly but cannot yet justify a full-time hire.",
    h: "Ongoing advisory access to HR expertise, structured around your needs and the scope we agree with you.",
    b: "Informed decisions on people matters as they arise, without building a full function first.",
    n: "We agree the scope, working rhythm and contact points with you.",
    s: "Retained HR expertise, scaled to your business."
  }
];

/* RESPONSIVE NAVIGATION */

const nav = document.getElementById("nav");
const menu = document.getElementById("menu");

if (nav && menu) {
  menu.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.focus();
    }
  });
}

/* ENQUIRY FORM — CONTACT PAGE ONLY */

const initContactForm = () => {
  const box = document.getElementById("formbox");

  if (!box) return;

  const params = new URLSearchParams(window.location.search);
  const preselectedService = params.get("s");

  const serviceOptions = SERVICES.map(service => {
    const selected = service.id === preselectedService ? "selected" : "";
    return `<option value="${service.id}" ${selected}>${service.t}</option>`;
  }).join("") + `<option value="other">Other or not sure</option>`;

  box.innerHTML = `
    <form id="f" novalidate>
      <div class="hp" aria-hidden="true">
        <label for="website">Leave this field empty</label>
        <input id="website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <div class="row">
        <div>
          <label for="name">Your name</label>
          <input id="name" name="name" autocomplete="name" required>
          <div class="err" id="e-name"></div>
        </div>
        <div>
          <label for="company">Company name</label>
          <input id="company" name="company" autocomplete="organization" required>
          <div class="err" id="e-company"></div>
        </div>
      </div>

      <div class="row">
        <div>
          <label for="email">Business email</label>
          <input id="email" name="email" type="email" autocomplete="email" required>
          <div class="err" id="e-email"></div>
        </div>
        <div>
          <label for="phone">Telephone</label>
          <input id="phone" name="phone" type="tel" autocomplete="tel" required>
          <div class="err" id="e-phone"></div>
        </div>
      </div>

      <div class="row">
        <div>
          <label for="service">Service of interest</label>
          <select id="service" name="service" required>
            <option value="">Select a service</option>
            ${serviceOptions}
          </select>
          <div class="err" id="e-service"></div>
        </div>

        <div>
          <label for="size">Organisation size</label>
          <select id="size" name="size" required>
            <option value="">Select</option>
            <option value="1 to 10 staff">1 to 10 staff</option>
            <option value="11 to 50 staff">11 to 50 staff</option>
            <option value="51 - 200 staff">51–200 staff</option>
            <option value="201+ staff">201+ staff</option>
          </select>
          <div class="err" id="e-size"></div>
        </div>
      </div>

      <div>
        <label for="msg">Your requirement</label>
        <textarea id="msg" name="message" maxlength="1500" required></textarea>
        <div class="err" id="e-msg"></div>
      </div>

      <div>
        <label class="chk" for="consent">
          <input type="checkbox" id="consent" name="consent" required>
          <span>
            ${CONSENT_TEXT}
            <a href="contact.html">Read our privacy notice</a>.
          </span>
        </label>
        <div class="err" id="e-consent"></div>
      </div>

      <p class="note">
        We use the details submitted here to review and respond to your enquiry.
        Do not include sensitive personal information.
      </p>

      <div>
        <button class="btn" type="submit">Send enquiry</button>
      </div>

      <p id="sendErr" class="err" role="alert" hidden></p>
    </form>
  `;

  const form = document.getElementById("f");
  const value = id => document.getElementById(id).value.trim();

  const rules = {
    name: [
      () => value("name").length > 1,
      "Enter your name."
    ],
    company: [
      () => value("company").length > 1,
      "Enter your company name."
    ],
    email: [
      () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value("email")),
      "Enter a valid email address."
    ],
    phone: [
      () => /^[+\d\s()-]{7,20}$/.test(value("phone")),
      "Enter a valid telephone number."
    ],
    service: [
      () => value("service") !== "",
      "Select a service."
    ],
    size: [
      () => value("size") !== "",
      "Select your organisation size."
    ],
    msg: [
      () => value("msg").length >= 15,
      "Describe your requirement in at least 15 characters."
    ],
    consent: [
      () => document.getElementById("consent").checked,
      "Please confirm consent so we can respond."
    ]
  };

  const validateField = key => {
    const valid = rules[key][0]();
    const field = document.getElementById(key);
    const error = document.getElementById(`e-${key}`);

    error.textContent = valid ? "" : rules[key][1];

    if (valid) {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    } else {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", error.id);
    }

    return valid;
  };

  Object.keys(rules).forEach(key => {
    const field = document.getElementById(key);
    const eventName = field.type === "checkbox" || field.tagName === "SELECT"
      ? "change"
      : "input";

    field.addEventListener(eventName, () => {
      if (field.hasAttribute("aria-invalid")) {
        validateField(key);
      }
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (value("website")) return;

    const sendError = document.getElementById("sendErr");
    sendError.hidden = true;
    sendError.textContent = "";

    let firstInvalid = null;

    Object.keys(rules).forEach(key => {
      if (!validateField(key) && !firstInvalid) {
        firstInvalid = document.getElementById(key);
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const selectedService = document.getElementById("service");
    const serviceLabel =
      selectedService.options[selectedService.selectedIndex].text;

    const values = {
      name: value("name"),
      company: value("company"),
      email: value("email"),
      phone: value("phone"),
      service: serviceLabel,
      size: value("size"),
      message: value("msg"),
      consent: CONSENT_TEXT
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Submitting…";

    const showResult = html => {
      box.innerHTML = html;
      const result = document.getElementById("okbox");
      if (result) result.focus();
    };

    const allEntriesPresent = Object.keys(values).every(key =>
      Boolean(GOOGLE_FORM.entries[key])
    );

    if (GOOGLE_FORM.action && allEntriesPresent) {
      const formData = new URLSearchParams();

      Object.keys(values).forEach(key => {
        formData.append(GOOGLE_FORM.entries[key], values[key]);
      });

      try {
        await fetch(GOOGLE_FORM.action, {
          method: "POST",
          mode: "no-cors",
          body: formData
        });

        showResult(`
          <div class="ok" role="status" tabindex="-1" id="okbox">
            <h2>Enquiry submission attempted</h2>
            <p>
              Your browser has sent a submission request, but this website
              cannot verify whether Google Forms recorded it.
            </p>
            <p>
              If you do not receive a response, please email
              <a href="mailto:${SITE.email}">${SITE.email}</a> directly.
            </p>
            <p>
              <a class="btn" href="mailto:${SITE.email}?subject=${encodeURIComponent("Enquiry from " + values.company)}">
                Email AgileTalent
              </a>
            </p>
          </div>
        `);
      } catch (error) {
        button.disabled = false;
        button.textContent = "Send enquiry";
        sendError.hidden = false;
        sendError.textContent =
          "We could not submit your request. Please try again or email " +
          SITE.email + ".";
      }

      return;
    }

    const emailBody = [
      "Name: " + values.name,
      "Company: " + values.company,
      "Email: " + values.email,
      "Phone: " + values.phone,
      "Service: " + values.service,
      "Organisation size: " + values.size,
      "Consent: " + values.consent,
      "",
      "Requirement:",
      values.message
    ].join("\n");

    const emailLink =
      "mailto:" + SITE.email +
      "?subject=" + encodeURIComponent("Service enquiry: " + values.company) +
      "&body=" + encodeURIComponent(emailBody);

    showResult(`
      <div class="ok" role="status" tabindex="-1" id="okbox">
        <h2>Complete your enquiry</h2>
        <p>
          Your enquiry has been prepared as an email. It has not been sent yet.
          Select the button below and send it from your email application.
        </p>
        <p><a class="btn" href="${emailLink}">Open email to send enquiry</a></p>
      </div>
    `);
  });
};

if (document.getElementById("formbox")) {
  initContactForm();
}
