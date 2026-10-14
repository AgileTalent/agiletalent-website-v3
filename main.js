/* AgileTalent Associates Limited
   Shared script: responsive navigation and enquiry form
*/

"use strict";

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
  { id: "recruitment", t: "Recruitment and Talent Acquisition" },
  { id: "hr-consulting", t: "HR Consulting and People Operations" },
  { id: "payroll", t: "SME Payroll and HR Administration" },
  { id: "performance", t: "Performance Management and Workforce Effectiveness" },
  { id: "learning", t: "Learning and Development" },
  { id: "advisory", t: "HR Advisory and Business Support" }
];

/* RESPONSIVE NAVIGATION */

function initNavigation() {
  const nav = document.getElementById("nav");
  const menu = document.getElementById("menu");

  if (!nav || !menu) return;

  menu.setAttribute("aria-expanded", "false");

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

/* ENQUIRY FORM */

function initContactForm() {
  const box = document.getElementById("formbox");
  if (!box) return;

  try {
    const params = new URLSearchParams(window.location.search);
    const preselectedService = params.get("s");

    const serviceOptions = SERVICES.map(service => {
      const selected =
        service.id === preselectedService ? " selected" : "";

      return `<option value="${service.id}"${selected}>${service.t}</option>`;
    }).join("");

    box.innerHTML = `
      <form id="agiletalent-enquiry-form" novalidate>
        <div class="hp" aria-hidden="true">
          <label for="website">Leave this field empty</label>
          <input id="website" name="website"
                 tabindex="-1" autocomplete="off">
        </div>

        <div class="row">
          <div>
            <label for="name">Your name</label>
            <input id="name" name="name" autocomplete="name" required>
            <div class="err" id="e-name"></div>
          </div>
          <div>
            <label for="company">Company name</label>
            <input id="company" name="company"
                   autocomplete="organization" required>
            <div class="err" id="e-company"></div>
          </div>
        </div>

        <div class="row">
          <div>
            <label for="email">Business email</label>
            <input id="email" name="email" type="email"
                   autocomplete="email" required>
            <div class="err" id="e-email"></div>
          </div>
          <div>
            <label for="phone">Telephone</label>
            <input id="phone" name="phone" type="tel"
                   autocomplete="tel" required>
            <div class="err" id="e-phone"></div>
          </div>
        </div>

        <div class="row">
          <div>
            <label for="service">Service of interest</label>
            <select id="service" name="service" required>
              <option value="">Select a service</option>
              ${serviceOptions}
              <option value="other">Other or not sure</option>
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
          <textarea id="msg" name="message"
                    maxlength="1500" required></textarea>
          <div class="err" id="e-msg"></div>
        </div>

        <div>
          <label class="chk" for="consent">
            <input type="checkbox" id="consent"
                   name="consent" required>
            <span>
              ${CONSENT_TEXT}
              <a href="contact.html">Read our privacy notice</a>.
            </span>
          </label>
          <div class="err" id="e-consent"></div>
        </div>

        <p class="note">
          We use the details submitted here to review and respond to your
          enquiry. Do not include sensitive personal information.
        </p>

        <div>
          <button class="btn" type="submit">Send enquiry</button>
        </div>

        <p id="sendErr" class="err" role="alert" hidden></p>
      </form>
    `;

    const form = document.getElementById("agiletalent-enquiry-form");
    if (!form) throw new Error("The enquiry form could not be created.");

    const getField = id => form.querySelector(`#${id}`);
    const value = id => getField(id).value.trim();

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
        () => getField("consent").checked,
        "Please confirm consent so we can respond."
      ]
    };

    function validateField(key) {
      const valid = rules[key][0]();
      const field = getField(key);
      const error = getField(`e-${key}`);

      error.textContent = valid ? "" : rules[key][1];

      if (valid) {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      } else {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", error.id);
      }

      return valid;
    }

    Object.keys(rules).forEach(key => {
      const field = getField(key);
      const eventName =
        field.type === "checkbox" || field.tagName === "SELECT"
          ? "change"
          : "input";

      field.addEventListener(eventName, () => {
        if (field.hasAttribute("aria-invalid")) {
          validateField(key);
        }
      });
    });

    function showMessage(title, message, linkHref, linkText) {
      box.innerHTML = `
        <div class="ok" role="status" tabindex="-1" id="okbox">
          <h2>${title}</h2>
          <p>${message}</p>
          <p>
            <a class="btn" href="${linkHref}">${linkText}</a>
          </p>
        </div>
      `;

      const result = document.getElementById("okbox");
      if (result) result.focus();
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (value("website")) return;

      const sendError = getField("sendErr");
      sendError.hidden = true;
      sendError.textContent = "";

      let firstInvalid = null;

      Object.keys(rules).forEach(key => {
        if (!validateField(key) && !firstInvalid) {
          firstInvalid = getField(key);
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const selectedService = getField("service");
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

      const allEntriesPresent = Object.keys(values).every(key =>
        Boolean(GOOGLE_FORM.entries[key])
      );

      if (!GOOGLE_FORM.action || !allEntriesPresent) {
        button.disabled = false;
        button.textContent = "Send enquiry";
        sendError.hidden = false;
        sendError.textContent =
          "The enquiry form is not configured correctly. Please email " +
          SITE.email + " directly.";
        return;
      }

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

        showMessage(
          "Enquiry submission attempted",
          "Your submission request has been sent. This website cannot verify that Google Forms recorded it. If you do not receive a response, please contact us directly.",
          "mailto:" + SITE.email +
            "?subject=" +
            encodeURIComponent("Service enquiry: " + values.company),
          "Email AgileTalent"
        );
      } catch (error) {
        button.disabled = false;
        button.textContent = "Send enquiry";
        sendError.hidden = false;
        sendError.textContent =
          "We could not submit your request. Please try again or email " +
          SITE.email + ".";
      }
    });
  } catch (error) {
    console.error("AgileTalent enquiry form initialisation failed:", error);

    box.innerHTML = `
      <div class="ok" role="alert">
        <h2>Enquiry form temporarily unavailable</h2>
        <p>Please email us directly to discuss your requirements.</p>
        <p>
          <a class="btn" href="mailto:${SITE.email}">
            Email ${SITE.email}
          </a>
        </p>
      </div>
    `;
  }
}

/* INITIALISE AFTER THE PAGE HAS LOADED */

function initAgileTalentSite() {
  initNavigation();
  initContactForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAgileTalentSite);
} else {
  initAgileTalentSite();
}
