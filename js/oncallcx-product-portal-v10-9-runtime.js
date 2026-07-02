/* v10.9.0 — OnCallCX Product Portal Refactor
   All phases in one runtime patch:
   1) Product Portal Hero
   2) Module Cards: UCaaS / CCaaS
   3) CMS Structure: Product -> Module -> Feature -> API -> Document -> Demo
   4) Routing: #oncallcx, #oncallcx-ucaas, #oncallcx-ccaas all render the same Product Portal and scroll/focus
   5) CMS Relationship
   6) Search metadata upgrade
   7) Contact Center product framework normalization
*/
import { loadCms, saveCms, esc } from './cms/cms-core.js';

const VERSION = 'v10.9.0-oncallcx-product-portal';

const ONCALLCX_PORTAL = {
  product: {
    id: 'oncallcx',
    title: 'OnCallCX',
    category: 'Contact Center',
    family: 'OnCallCX',
    type: 'product-portal',
    route: '#oncallcx',
    status: 'active',
    summary: 'OnCallCX là nền tảng Customer Experience Platform của FPT, bao gồm hai phân hệ độc lập: UCaaS cho tổng đài PBX và CCaaS cho Contact Center.',
    description: 'OnCallCX được tổ chức theo mô hình Product Portal. UCaaS tập trung vào telephony/PBX foundation, còn CCaaS tập trung vào vận hành Contact Center, AI Voicebot, Omnichannel, Recording, Analytics, Campaign và CRM/ERP Integration.',
    tags: ['oncallcx','product-portal','ucaas','ccaas','customer-experience','fpt'],
    modules: ['oncallcx-ucaas','oncallcx-ccaas'],
    apiLinks: [
      {method:'GET', path:'/ucaas/extensions', description:'UCaaS - danh sách extension'},
      {method:'POST', path:'/ucaas/extensions', description:'UCaaS - tạo extension'},
      {method:'GET', path:'/ucaas/cdr', description:'UCaaS - truy vấn CDR'},
      {method:'POST', path:'/ccaas/call/outbound', description:'CCaaS - khởi tạo outbound call'},
      {method:'POST', path:'/ccaas/webhook/incoming', description:'CCaaS - nhận event cuộc gọi realtime'},
      {method:'GET', path:'/ccaas/recording/{id}', description:'CCaaS - truy xuất ghi âm'}
    ],
    documents: ['presentation-oncallcx','datasheet-oncallcx-ucaas','datasheet-oncallcx-ccaas','demo-script-oncallcx','api-spec-oncallcx'],
    relationshipModel: 'Product -> Module -> Feature -> API -> Document -> Demo'
  },
  modules: [
    {
      id: 'oncallcx-ucaas',
      parent: 'oncallcx',
      title: 'OnCallCX UCaaS',
      label: 'UCaaS',
      route: '#oncallcx-ucaas',
      badge: 'PBX',
      icon: '☎️',
      subtitle: 'Cloud PBX · Enterprise Telephony',
      summary: 'Phân hệ tổng đài PBX cloud/hosted: Extension, User, SIP Trunk, Number Plan, Call Routing, IVR, Ring Group, Voicemail và API-ready integration.',
      scope: 'OnCallCX UCaaS chỉ thuần về tổng đài PBX và telephony foundation.',
      tags: ['PBX','Extension','SIP Trunk','Call Routing','API-ready'],
      features: [
        {title:'Cloud PBX', summary:'Tổng đài PBX cloud/hosted, quản lý extension và user tập trung.'},
        {title:'Extension / User', summary:'Tạo extension, user, voicemail, quyền gọi và nhóm người dùng.'},
        {title:'SIP Trunk', summary:'Kết nối đầu số, SIP trunk, DID, outbound/inbound route và prefix.'},
        {title:'IVR / Ring Group', summary:'Cấu hình lời chào, IVR, ring group và call distribution cơ bản.'},
        {title:'CDR / Call Log', summary:'Ghi nhận lịch sử cuộc gọi, trạng thái, thời lượng và metadata cơ bản.'},
        {title:'API-ready', summary:'API chờ tích hợp cho provisioning, CDR, click-to-call hoặc CRM extension.'}
      ],
      apiLinks: [
        {method:'GET', path:'/ucaas/extensions', description:'Danh sách extension'},
        {method:'POST', path:'/ucaas/extensions', description:'Tạo extension'},
        {method:'PATCH', path:'/ucaas/extensions/{id}', description:'Cập nhật extension'},
        {method:'GET', path:'/ucaas/cdr', description:'Truy vấn CDR UCaaS'},
        {method:'POST', path:'/ucaas/click-to-call', description:'Click-to-call từ hệ thống tích hợp'}
      ],
      documents: ['datasheet-oncallcx-ucaas','ucaas-api-spec','ucaas-deployment-checklist'],
      demo: ['ucaas-extension-provisioning','ucaas-call-routing-demo'],
      notIncluded: ['AI Voicebot','Omnichannel','Advanced Analytics','Recording QA/QC','Campaign','CRM workflow']
    },
    {
      id: 'oncallcx-ccaas',
      parent: 'oncallcx',
      title: 'OnCallCX CCaaS',
      label: 'CCaaS',
      route: '#oncallcx-ccaas',
      badge: 'Contact Center',
      icon: '🎧',
      subtitle: 'Contact Center · AI · Omnichannel',
      summary: 'Phân hệ Contact Center: AI Voicebot, Omnichannel, Analytics/Dashboard, Recording, Campaign/Outbound và CRM/ERP Integration.',
      scope: 'OnCallCX CCaaS là lớp vận hành chăm sóc khách hàng và contact center.',
      tags: ['AI Voicebot','Omnichannel','Analytics','Recording','CRM/ERP Integration'],
      features: [
        {title:'AI Voicebot', summary:'Tự động hóa cuộc gọi, kịch bản thoại, chuyển agent và ghi nhận kết quả.'},
        {title:'Omnichannel', summary:'Voice, Chat, Email, Social và digital channels trong cùng hàng đợi.'},
        {title:'Analytics / Dashboard', summary:'Realtime dashboard, agent performance, queue, SLA và campaign report.'},
        {title:'Recording', summary:'Ghi âm, tra soát, QA/QC và báo cáo lịch sử cuộc gọi.'},
        {title:'Campaign / Outbound', summary:'Telesales, gọi ra tự động, campaign list và tracking kết quả.'},
        {title:'CRM/ERP Integration', summary:'Screen pop, ticket, customer sync, call log và workflow CSKH.'}
      ],
      apiLinks: [
        {method:'POST', path:'/ccaas/call/outbound', description:'Khởi tạo outbound call'},
        {method:'POST', path:'/ccaas/webhook/incoming', description:'Nhận event cuộc gọi realtime'},
        {method:'POST', path:'/ccaas/campaign', description:'Tạo/cập nhật campaign'},
        {method:'GET', path:'/ccaas/queue/status', description:'Trạng thái queue/agent'},
        {method:'GET', path:'/ccaas/recording/{id}', description:'Truy xuất ghi âm'}
      ],
      documents: ['datasheet-oncallcx-ccaas','ccaas-api-spec','ccaas-crm-integration-guide'],
      demo: ['ccaas-inbound-screenpop','ccaas-outbound-campaign','ccaas-dashboard-demo'],
      included: ['AI Voicebot','Omnichannel','Analytics/Dashboard','Recording','Campaign','CRM/ERP Integration']
    }
  ],
  relations: [
    {from:'oncallcx', to:'oncallcx-ucaas', type:'has-module'},
    {from:'oncallcx', to:'oncallcx-ccaas', type:'has-module'},
    {from:'oncallcx-ucaas', to:'api-reference', type:'uses-api'},
    {from:'oncallcx-ccaas', to:'api-reference', type:'uses-api'},
    {from:'oncallcx-ccaas', to:'crm', type:'integrates-with'},
    {from:'oncallcx', to:'document-center', type:'has-document'},
    {from:'oncallcx', to:'demo', type:'has-demo'}
  ]
};

function mergeById(existing = [], seeds = []) {
  const map = new Map();
  (Array.isArray(existing) ? existing : []).forEach(x => { if (x?.id) map.set(x.id, x); });
  seeds.forEach(seed => map.set(seed.id, { ...(map.get(seed.id) || {}), ...seed }));
  return Array.from(map.values());
}

async function syncCms() {
  const cms = await loadCms().catch(() => ({}));

  cms.meta = cms.meta || {};
  cms.meta.version = 'v10.9.0';
  cms.meta.oncallcxProductPortal = VERSION;
  cms.meta.oncallcxProductPortalUpdatedAt = new Date().toISOString();

  const articleSeeds = [
    {
      id:'article-oncallcx',
      title:'OnCallCX',
      sidebarId:'oncallcx',
      route:'#oncallcx',
      type:'product-portal',
      status:'active',
      module:'OnCallCX',
      family:'oncallcx',
      summary:ONCALLCX_PORTAL.product.summary,
      tags:ONCALLCX_PORTAL.product.tags,
      productRefs:['oncallcx'],
      cards: ONCALLCX_PORTAL.modules.map(m => ({
        title:m.title,
        summary:m.summary,
        url:m.route,
        type:'product-module'
      }))
    },
    {
      id:'article-oncallcx-ucaas',
      title:'OnCallCX UCaaS',
      sidebarId:'oncallcx-ucaas',
      route:'#oncallcx-ucaas',
      type:'product-module',
      status:'active',
      module:'OnCallCX',
      family:'oncallcx',
      subCategory:'ucaas',
      summary:ONCALLCX_PORTAL.modules[0].summary,
      tags:ONCALLCX_PORTAL.modules[0].tags,
      productRefs:['oncallcx-ucaas'],
      cards:ONCALLCX_PORTAL.modules[0].features.map(f => ({title:f.title, summary:f.summary, url:'#oncallcx-ucaas'}))
    },
    {
      id:'article-oncallcx-ccaas',
      title:'OnCallCX CCaaS',
      sidebarId:'oncallcx-ccaas',
      route:'#oncallcx-ccaas',
      type:'product-module',
      status:'active',
      module:'OnCallCX',
      family:'oncallcx',
      subCategory:'ccaas',
      summary:ONCALLCX_PORTAL.modules[1].summary,
      tags:ONCALLCX_PORTAL.modules[1].tags,
      productRefs:['oncallcx'],
      cards:ONCALLCX_PORTAL.modules[1].features.map(f => ({title:f.title, summary:f.summary, url:'#oncallcx-ccaas'}))
    }
  ];

  const productSeeds = [
    {
      ...ONCALLCX_PORTAL.product,
      productModules: ONCALLCX_PORTAL.modules,
      relations: ONCALLCX_PORTAL.relations,
      knowledgeSections: [
        {title:'Product Portal Model', content:'OnCallCX là Product Portal. UCaaS và CCaaS là hai Product Module bên trong, không phải ba sản phẩm ngang hàng.'},
        {title:'UCaaS vs CCaaS', content:'UCaaS là PBX/telephony foundation. CCaaS là Contact Center/CX operation layer.'}
      ]
    },
    {
      id:'oncallcx-ucaas',
      title:'OnCallCX UCaaS',
      category:'OnCallCX',
      subCategory:'UCaaS',
      parent:'oncallcx',
      type:'product-module',
      route:'#oncallcx-ucaas',
      summary:ONCALLCX_PORTAL.modules[0].summary,
      tags:ONCALLCX_PORTAL.modules[0].tags,
      highlights:ONCALLCX_PORTAL.modules[0].tags,
      features:ONCALLCX_PORTAL.modules[0].features,
      apiLinks:ONCALLCX_PORTAL.modules[0].apiLinks,
      documents:ONCALLCX_PORTAL.modules[0].documents,
      demo:ONCALLCX_PORTAL.modules[0].demo,
      knowledgeSections:[
        {title:'Scope', content:ONCALLCX_PORTAL.modules[0].scope},
        {title:'Không thuộc UCaaS', content:ONCALLCX_PORTAL.modules[0].notIncluded.join(', ')}
      ]
    },
    {
      id:'oncallcx-ccaas',
      title:'OnCallCX CCaaS',
      category:'OnCallCX',
      subCategory:'CCaaS',
      parent:'oncallcx',
      type:'product-module',
      route:'#oncallcx-ccaas',
      summary:ONCALLCX_PORTAL.modules[1].summary,
      tags:ONCALLCX_PORTAL.modules[1].tags,
      highlights:ONCALLCX_PORTAL.modules[1].tags,
      features:ONCALLCX_PORTAL.modules[1].features,
      apiLinks:ONCALLCX_PORTAL.modules[1].apiLinks,
      documents:ONCALLCX_PORTAL.modules[1].documents,
      demo:ONCALLCX_PORTAL.modules[1].demo,
      knowledgeSections:[
        {title:'Scope', content:ONCALLCX_PORTAL.modules[1].scope},
        {title:'Thành phần thuộc CCaaS', content:ONCALLCX_PORTAL.modules[1].included.join(', ')}
      ]
    }
  ];

  cms.articles = mergeById(cms.articles, articleSeeds);
  cms.products = mergeById(cms.products, productSeeds);
  cms.productPortals = mergeById(cms.productPortals, [ONCALLCX_PORTAL.product]);
  cms.productModules = mergeById(cms.productModules, ONCALLCX_PORTAL.modules);
  cms.relationships = mergeById(cms.relationships, ONCALLCX_PORTAL.relations.map((r,i)=>({id:`rel-oncallcx-${i+1}`,...r})));

  cms.searchIndexHints = cms.searchIndexHints || {};
  cms.searchIndexHints.oncallcx = [
    ...ONCALLCX_PORTAL.product.tags,
    ...ONCALLCX_PORTAL.modules.flatMap(m => [m.title, m.label, ...m.tags, ...m.features.map(f=>f.title)]),
    ...ONCALLCX_PORTAL.modules.flatMap(m => m.apiLinks.map(a => `${a.method} ${a.path} ${a.description}`))
  ];

  cms.navigationCoverage = cms.navigationCoverage || {};
  cms.navigationCoverage.oncallcxProductPortal = {
    version: VERSION,
    parentRoute:'#oncallcx',
    moduleRoutes:['#oncallcx-ucaas','#oncallcx-ccaas'],
    behavior:'Routes render the OnCallCX Product Portal and focus the requested module.',
    relationshipModel:ONCALLCX_PORTAL.product.relationshipModel
  };

  await saveCms(cms);
  return cms;
}

function ensureStyle() {
  if (document.getElementById('ocxV109Style')) return;
  const style = document.createElement('style');
  style.id = 'ocxV109Style';
  style.textContent = `
  .ocx109-hero{background:linear-gradient(135deg,rgba(249,115,22,.16),rgba(59,130,246,.10));border:1px solid rgba(249,115,22,.30);border-radius:28px;padding:32px;margin-bottom:18px}
  .ocx109-hero h1{font-size:44px;line-height:1.08;margin:12px 0}.ocx109-hero p{color:#dbeafe;line-height:1.65;max-width:1150px}.ocx109-gradient{background:linear-gradient(90deg,#fb923c,#60a5fa,#22d3ee,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent}
  .ocx109-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.ocx109-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.ocx109-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:#93c5fd}.ocx109-chip.orange{background:rgba(249,115,22,.13);border-color:rgba(249,115,22,.28);color:#fdba74}.ocx109-chip.green{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.25);color:#86efac}
  .ocx109-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:22px}.ocx109-module{background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:24px;overflow:hidden}.ocx109-module.focus{border-color:#fb923c;box-shadow:0 0 0 2px rgba(249,115,22,.20),0 20px 80px rgba(249,115,22,.08)}
  .ocx109-module-head{display:flex;gap:16px;align-items:flex-start;padding:22px;border-bottom:1px solid rgba(148,163,184,.16)}.ocx109-icon{width:56px;height:56px;border-radius:18px;background:rgba(249,115,22,.12);display:grid;place-items:center;font-size:25px}.ocx109-module h2{margin:0;font-size:25px}.ocx109-module small{color:#93a4bd}.ocx109-module-body{padding:22px}.ocx109-module-body p,.ocx109-module li{color:#c4d3ea;line-height:1.65}.ocx109-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}.ocx109-feature{background:rgba(6,12,27,.45);border:1px solid rgba(148,163,184,.16);border-radius:14px;padding:12px}.ocx109-feature b{display:block;color:#e2e8f0;margin-bottom:4px}.ocx109-feature span{color:#93a4bd;font-size:12px;line-height:1.5}
  .ocx109-api{margin-top:16px;border:1px solid rgba(148,163,184,.16);border-radius:14px;overflow:hidden}.ocx109-api-row{display:grid;grid-template-columns:88px minmax(0,1fr) minmax(0,1.3fr);gap:10px;border-bottom:1px solid rgba(148,163,184,.12);padding:10px 12px;color:#c4d3ea}.ocx109-api-row:last-child{border-bottom:0}.ocx109-method{font-weight:900;color:#93c5fd}
  .ocx109-rel{background:#101827;border:1px solid rgba(148,163,184,.22);border-radius:22px;padding:20px;margin-bottom:22px}.ocx109-rel h2{margin-top:0}.ocx109-rel-flow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ocx109-node{background:#111d33;border:1px solid #31517a;border-radius:16px;padding:14px 16px;color:#e2e8f0;font-weight:900}.ocx109-arrow{color:#94a3b8;font-size:26px}
  .ocx109-note{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);border-radius:18px;padding:16px;margin-top:16px}.ocx109-warn{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:18px;padding:16px;margin-top:16px}
  @media(max-width:1200px){.ocx109-grid{grid-template-columns:1fr}.ocx109-feature-grid{grid-template-columns:1fr}.ocx109-api-row{grid-template-columns:1fr}.ocx109-hero h1{font-size:34px}}
  `;
  document.head.appendChild(style);
}

function setHeader(title, subtitle) {
  const t = document.querySelector('#pageTitle');
  const s = document.querySelector('#pageSubtitle');
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle;
}

function moduleCard(m, focusId) {
  const focus = m.id === focusId ? ' focus' : '';
  const apiRows = m.apiLinks.map(a => `<div class="ocx109-api-row"><span class="ocx109-method">${esc(a.method)}</span><code>${esc(a.path)}</code><span>${esc(a.description)}</span></div>`).join('');
  const features = m.features.map(f => `<article class="ocx109-feature"><b>${esc(f.title)}</b><span>${esc(f.summary)}</span></article>`).join('');
  const relationNote = m.id === 'oncallcx-ucaas'
    ? `<div class="ocx109-warn"><b>Không thuộc UCaaS:</b> ${m.notIncluded.map(esc).join(' · ')}</div>`
    : `<div class="ocx109-note"><b>Thuộc CCaaS:</b> ${m.included.map(esc).join(' · ')}</div>`;

  return `<article class="ocx109-module${focus}" id="${esc(m.id)}">
    <div class="ocx109-module-head">
      <div class="ocx109-icon">${esc(m.icon)}</div>
      <div>
        <div class="ocx109-chip-row"><span class="ocx109-chip ${m.id.includes('ccaas') ? 'orange' : ''}">${esc(m.badge)}</span></div>
        <h2>${esc(m.title)}</h2>
        <small>${esc(m.subtitle)}</small>
      </div>
    </div>
    <div class="ocx109-module-body">
      <p>${esc(m.summary)}</p>
      <div class="ocx109-chip-row">${m.tags.map((t,i)=>`<span class="ocx109-chip ${i%2?'orange':'green'}">${esc(t)}</span>`).join('')}</div>
      <h3>Tính năng chính</h3>
      <div class="ocx109-feature-grid">${features}</div>
      <h3>API / Integration</h3>
      <div class="ocx109-api">${apiRows}</div>
      ${relationNote}
      <div class="ocx109-actions">
        <a class="btn btn-soft" href="#api-reference">Xem API Reference</a>
        <a class="btn btn-soft" href="#document-center">Datasheet / Document</a>
        <a class="btn btn-primary" href="#demo">Demo</a>
      </div>
    </div>
  </article>`;
}

function renderPortal(focusId = null) {
  ensureStyle();
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  setHeader('OnCallCX', 'Product Portal · UCaaS + CCaaS');

  root.innerHTML = `<section class="ocx109-hero">
    <span class="ocx109-chip orange">📦 Product Portal</span>
    <h1>OnCallCX<br><span class="ocx109-gradient">UCaaS · CCaaS · Customer Experience Platform</span></h1>
    <p>${esc(ONCALLCX_PORTAL.product.description)}</p>
    <p><b>Phân biệt:</b> UCaaS là nền tảng PBX/telephony. CCaaS là lớp Contact Center/CX Operation.</p>
    <div class="ocx109-chip-row">
      <span class="ocx109-chip">☎️ UCaaS / PBX</span>
      <span class="ocx109-chip orange">🎧 CCaaS / Contact Center</span>
      <span class="ocx109-chip green">🔗 Shared API</span>
      <span class="ocx109-chip">📄 Shared Documents</span>
      <span class="ocx109-chip">🧩 CMS Relationship</span>
    </div>
    <div class="ocx109-actions">
      <a class="btn btn-primary" href="#oncallcx-ucaas">Đi tới UCaaS</a>
      <a class="btn btn-primary" href="#oncallcx-ccaas">Đi tới CCaaS</a>
      <a class="btn btn-soft" href="#api-reference">Xem API Reference</a>
      <a class="btn btn-soft" href="#document-center">Document Center</a>
    </div>
  </section>

  <section class="ocx109-grid">
    ${ONCALLCX_PORTAL.modules.map(m => moduleCard(m, focusId)).join('')}
  </section>

  <section class="ocx109-rel">
    <h2>Relationship CMS</h2>
    <p style="color:#c4d3ea">OnCallCX được quản lý theo cấu trúc Product Portal. UCaaS và CCaaS là Product Module kế thừa Product, API, Document, Presentation, Demo và Search.</p>
    <div class="ocx109-rel-flow">
      <span class="ocx109-node">Product<br><small>OnCallCX</small></span>
      <span class="ocx109-arrow">→</span>
      <span class="ocx109-node">Module<br><small>UCaaS / CCaaS</small></span>
      <span class="ocx109-arrow">→</span>
      <span class="ocx109-node">Feature</span>
      <span class="ocx109-arrow">→</span>
      <span class="ocx109-node">API</span>
      <span class="ocx109-arrow">→</span>
      <span class="ocx109-node">Document</span>
      <span class="ocx109-arrow">→</span>
      <span class="ocx109-node">Demo</span>
    </div>
  </section>`;

  if (focusId) {
    setTimeout(() => document.getElementById(focusId)?.scrollIntoView({behavior:'smooth', block:'start'}), 120);
  }
}

function route() {
  const hash = location.hash || '';
  if (hash === '#oncallcx') return renderPortal(null);
  if (hash === '#oncallcx-ucaas') return renderPortal('oncallcx-ucaas');
  if (hash === '#oncallcx-ccaas') return renderPortal('oncallcx-ccaas');
}

function patchSidebarLabels() {
  // Keep existing sidebar structure from v10.8.3 but make product module semantics clearer.
  const links = Array.from(document.querySelectorAll('a.nav-item[href^="#oncallcx"]'));
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#oncallcx') {
      const b = a.querySelector('b'); if (b) b.textContent = 'OnCallCX';
      const em = a.querySelector('em'); if (em) em.textContent = 'Portal';
    }
    if (href === '#oncallcx-ucaas') {
      const b = a.querySelector('b'); if (b) b.textContent = 'OnCallCX UCaaS';
      const em = a.querySelector('em'); if (em) em.textContent = 'PBX';
    }
    if (href === '#oncallcx-ccaas') {
      const b = a.querySelector('b'); if (b) b.textContent = 'OnCallCX CCaaS';
      const em = a.querySelector('em'); if (em) em.textContent = 'Contact Center';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(syncCms, 350);
  setTimeout(patchSidebarLabels, 500);
  setTimeout(route, 650);
});
window.addEventListener('hashchange', () => {
  setTimeout(patchSidebarLabels, 50);
  setTimeout(route, 90);
});

window.FTIOnCallCXProductPortal = { syncCms, renderPortal, ONCALLCX_PORTAL };
