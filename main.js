/* AgileTalent Associates: shared script (menu + enquiry form) */
const SITE={name:"AgileTalent Associates Limited",email:"agiletalents@outlook.com"};
const GOOGLE_FORM={
 action:"https://docs.google.com/forms/d/e/1FAIpQLScBjtHUMUPaBm4mpfFWOR3PKpIQIRRhUJvMGTyRaIfueTacQg/formResponse",
 entries:{name:"entry.557000281",company:"entry.604062627",email:"entry.950094608",phone:"entry.100862902",service:"entry.237728569",size:"entry.1170657527",message:"entry.1468914824",consent:"entry.1827230671"}
};
const CONSENT_TEXT="I agree that AgileTalent Associates Limited may use my details to respond to this enquiry.";
const gfReady=()=>Boolean(GOOGLE_FORM.action&&["name","company","email","phone","service","size","message","consent"].every(k=>GOOGLE_FORM.entries[k]));
const S=[
{id:"recruitment",t:"Recruitment and Talent Acquisition",c:"Hiring takes managers away from their real work, and a poor hire is expensive to correct.",h:"We run recruitment on your behalf: sourcing, screening, interview scheduling, candidate communication and shortlisting. We support one-off roles, recurring hiring and volume recruitment, with activities agreed for each engagement.",b:"Less administrative load on your team, better coordination between you and candidates, and a clearer basis for hiring decisions.",n:"Share the roles and hiring context. We agree scope and responsibilities in writing before work begins.",s:"Recruitment outsourcing without a large internal team."},
{id:"hr-consulting",t:"HR Consulting and People Operations",c:"Growing businesses often run on informal HR practice, which creates inconsistency and avoidable disputes.",h:"We design HR processes, write policies, procedures and employee handbooks, build documentation, and set up performance management and employee relations frameworks. We also support workforce planning and organisational structuring.",b:"Consistent people practices, clearer manager expectations and fewer avoidable people issues.",n:"An HR health check of what you have today, followed by a prioritised plan.",s:"Structured HR without a large in-house department."},
{id:"payroll",t:"SME Payroll and HR Administration",c:"Late or inaccurate pay damages employee trust, and weak records make PAYE and other statutory obligations harder to manage.",h:"We support payroll administration and processing, employee records management, payroll reporting and reconciliation, and the HR documentation that sits behind them.",b:"Reliable, repeatable payroll cycles and records you can rely on.",n:"We review your current payroll process and agree what we take on. Statutory positions should be confirmed with your tax adviser or the relevant authority.",s:"Dependable payroll and records for growing teams."},
{id:"performance",t:"Performance Management and Workforce Effectiveness",c:"When goals are unclear and feedback is rare, performance reviews become a yearly formality instead of a management tool.",h:"We design performance frameworks, support KPI and goal setting, build review processes, develop managers' capability, and help you report on workforce data.",b:"Clear accountability, better conversations between managers and teams, and people decisions backed by evidence.",n:"A short diagnostic of how performance is managed today, then a framework sized to your organisation.",s:"Performance management that drives business results."},
{id:"learning",t:"Learning and Development",c:"Capability gaps, especially among first-time managers, slow teams down and are rarely fixed by generic training.",h:"We run training needs analysis, shape learning strategy, and deliver leadership, management and capability programmes. We evaluate whether training changes how work is done.",b:"Learning tied to real workplace gaps, with a way to judge whether it worked.",n:"We start with the capability gap, not a course catalogue.",s:"Practical learning with measurable workplace application."},
{id:"advisory",t:"HR Advisory and Business Support",c:"Many businesses need senior HR judgement regularly but cannot yet justify a full-time hire.",h:"Ongoing advisory access to HR expertise, structured around your needs and the scope we agree with you.",b:"Informed decisions on people matters as they arise, without building a full function first.",n:"We agree the scope, working rhythm and contact points with you.",s:"Retained HR expertise, scaled to your business."}
];

const nav=document.getElementById("nav"),menu=document.getElementById("menu");
menu.addEventListener("click",()=>{const o=nav.classList.toggle("open");menu.setAttribute("aria-expanded",o)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.focus()}});

/* Enquiry form (contact page only) */
const initContactForm=()=>{
const q=new URLSearchParams((location.search.slice(1))||"");const pre=q.get("s");
const opts=S.map(s=>`<option value="${s.id}" ${s.id===pre?"selected":""}>${s.t}</option>`).join("")+`<option value="other">Others or not sure</option>`;
const box=document.getElementById("formbox");
box.innerHTML=`<form id="f" novalidate>
<div class="hp" aria-hidden="true"><label>Leave empty<input id="website" tabindex="-1" autocomplete="off"></label></div>
<div class="row"><div><label for="name">Your name</label><input id="name" autocomplete="name" required><div class="err" id="e-name"></div></div><div><label for="company">Company name</label><input id="company" autocomplete="organization" required><div class="err" id="e-company"></div></div></div>
<div class="row"><div><label for="email">Business email</label><input id="email" type="email" autocomplete="email" required><div class="err" id="e-email"></div></div><div><label for="phone">Telephone</label><input id="phone" type="tel" autocomplete="tel" required><div class="err" id="e-phone"></div></div></div>
<div class="row"><div><label for="service">Service of interest</label><select id="service" required><option value="">Select a service</option>${opts}</select><div class="err" id="e-service"></div></div><div><label for="size">Organisation size</label><select id="size" required><option value="">Select</option><option>1 to 10 staff</option><option>11 to 50 staff</option><option>51 - 200 staff</option><option>201+ staff</option></select><div class="err" id="e-size"></div></div></div>
<div><label for="msg">Your requirement</label><textarea id="msg" required maxlength="1500"></textarea><div class="err" id="e-msg"></div></div>
<div><label class="chk"><input type="checkbox" id="consent" required><span>${CONSENT_TEXT} <a href="contact.html">Read our privacy notice</a>.</span></label><div class="err" id="e-consent"></div></div>
<p class="note">We use the details submitted here to review and respond to your enquiry. Do not include sensitive personal information.</p>
<div><button class="btn" type="submit">Send request</button></div></form>`;
const f=document.getElementById("f"),v=id=>document.getElementById(id).value.trim();
const rules={name:[()=>v("name").length>1,"Enter your name."],company:[()=>v("company").length>1,"Enter your company name."],email:[()=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email")),"Enter a valid business email address."],phone:[()=>/^[+\d\s()-]{7,20}$/.test(v("phone")),"Enter a valid telephone number."],service:[()=>v("service")!=="","Select a service."],size:[()=>v("size")!=="","Select your organisation size."],msg:[()=>v("msg").length>=15,"Describe your requirement in at least 15 characters."],consent:[()=>document.getElementById("consent").checked,"Please confirm consent so we can respond."]};
f.addEventListener("submit",e=>{e.preventDefault();if(v("website"))return;let first=null;
for(const k in rules){const ok=rules[k][0]();const el=document.getElementById(k),er=document.getElementById("e-"+k);er.textContent=ok?"":rules[k][1];el.setAttribute("aria-invalid",ok?"false":"true");if(!ok)el.setAttribute("aria-describedby","e-"+k);if(!ok&&!first)first=el;}
if(first){first.focus();return}
const svc=document.getElementById("service"),svcLabel=svc.options[svc.selectedIndex].text;
const vals={name:v("name"),company:v("company"),email:v("email"),phone:v("phone"),service:svcLabel,size:v("size"),message:v("msg"),consent:CONSENT_TEXT};
const done=h=>{box.innerHTML=h;const o=document.getElementById("okbox");if(o)o.focus()};
if(gfReady()){
const btn=f.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Sending…";
const fd = new URLSearchParams();
for (const k in vals) {
    const id = GOOGLE_FORM.entries[k];
    if (id)
        fd.append(id, vals[k]);
}

fetch(GOOGLE_FORM.action, {
  method: "POST",
  mode: "no-cors",
  body: fd
})
.then(()=>done(`<div class="ok" role="status" tabindex="-1" id="okbox"><h2>Request sent</h2><p>Your enquiry has been passed to the form submission endpoint. Because the response collector does not provide you with a readable confirmation, please contact <a href="mailto:${SITE.email}">${SITE.email}</a> if you do not receive a response.</p></div>`))
.catch(()=>{btn.disabled=false;btn.textContent="Send request";let m=document.getElementById("sendErr");if(!m){m=document.createElement("p");m.id="sendErr";m.className="err";m.setAttribute("role","alert");f.appendChild(m)}m.textContent="We could not send your request. Please try again or email "+SITE.email+"."});
return;
}
const body=["Name: "+vals.name,"Company: "+vals.company,"Email: "+vals.email,"Phone: "+vals.phone,"Service: "+svcLabel,"Size: "+vals.size,"Consent: "+vals.consent,"","Requirement:",vals.message].join("\n");
const href="mailto:"+SITE.email+"?subject="+encodeURIComponent("Service request: "+vals.company)+"&body="+encodeURIComponent(body);
done(`<div class="ok" role="status" tabindex="-1" id="okbox"><h2>One more step</h2><p>Your request has been prepared as an email. It is not sent until you press Send in your email app.</p><p><a class="btn" href="${href}">Open the email</a></p></div>`);location.href=href;
});
};
if(document.getElementById("formbox"))initContactForm();
