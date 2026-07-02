/* v10.8.3 OnCallCX UCaaS / CCaaS Reclassification
   - Moves OnCallCX UCaaS from UC/PBX Việt Nam into OnCallCX product family.
   - Keeps UCaaS and CCaaS as two separate modules.
   - CCaaS contains AI Voicebot, Omnichannel, Analytics, Recording.
   - UCaaS is pure PBX + API-ready integration.
*/
import { loadCms, saveCms, esc } from './cms/cms-core.js';

const VERSION = 'v10.8.3-oncallcx-family-reclass';

const ONCALLCX_ARTICLES = [
  {
    id: 'article-oncallcx-ucaas',
    title: 'OnCallCX UCaaS',
    sidebarId: 'oncallcx-ucaas',
    route: '#oncallcx-ucaas',
    type: 'product-family-module',
    status: 'active',
    module: 'OnCallCX',
    family: 'oncallcx',
    subCategory: 'ucaas',
    summary: 'OnCallCX UCaaS là phân hệ tổng đài PBX cloud/hosted, tập trung vào extension, user, SIP trunk, call routing, IVR, ring group, voicemail và API chờ tích hợp.',
    tags: ['oncallcx','ucaas','pbx','sip-trunk','extension','api-ready'],
    cards: [
      { title:'Tổng đài PBX', summary:'Quản lý extension, user, number plan, call routing, ring group, IVR và voicemail.', url:'#oncallcx-ucaas' },
      { title:'SIP Trunk / Call Routing', summary:'Kết nối SIP trunk, đầu số, outbound route, inbound route và prefix.', url:'#oncallcx-ucaas' },
      { title:'API chờ tích hợp', summary:'Chuẩn bị API cho provisioning, extension, CDR, click-to-call hoặc integration CRM.', url:'#api-reference' },
      { title:'Không bao gồm CCaaS', summary:'AI Voicebot, Omnichannel, Analytics, Recording thuộc OnCallCX CCaaS.', url:'#oncallcx-ccaas' }
    ],
    productRefs: ['oncallcx-ucaas']
  },
  {
    id: 'article-oncallcx-ccaas',
    title: 'OnCallCX CCaaS',
    sidebarId: 'oncallcx-ccaas',
    route: '#oncallcx-ccaas',
    type: 'product-family-module',
    status: 'active',
    module: 'OnCallCX',
    family: 'oncallcx',
    subCategory: 'ccaas',
    summary: 'OnCallCX CCaaS là phân hệ Contact Center, bao gồm AI Voicebot, Omnichannel, Analytics/Dashboard, Recording, Campaign/Outbound, API/Webhook và CRM/ERP Integration.',
    tags: ['oncallcx','ccaas','contact-center','ai-voicebot','omnichannel','recording','analytics'],
    cards: [
      { title:'AI Voicebot', summary:'Tự động hóa cuộc gọi, kịch bản thoại, chuyển tiếp agent và ghi nhận kết quả.', url:'#oncallcx-ccaas' },
      { title:'Omnichannel', summary:'Tập trung voice/chat/email/social vào hàng đợi chăm sóc khách hàng.', url:'#oncallcx-ccaas' },
      { title:'Analytics / Dashboard', summary:'Theo dõi realtime queue, agent, SLA, campaign và hiệu suất vận hành.', url:'#oncallcx-ccaas' },
      { title:'Recording', summary:'Ghi âm, tra soát, QA/QC và báo cáo lịch sử cuộc gọi.', url:'#oncallcx-ccaas' },
      { title:'CRM/ERP Integration', summary:'Screen pop, ticket, customer sync, call log và workflow chăm sóc khách hàng.', url:'#crm' }
    ],
    productRefs: ['oncallcx']
  }
];

const PRODUCT_UPDATES = [
  {
    id: 'oncallcx-ucaas',
    title: 'OnCallCX UCaaS',
    category: 'OnCallCX',
    subCategory: 'UCaaS',
    parent: 'oncallcx',
    route: '#oncallcx-ucaas',
    summary: 'Phân hệ tổng đài PBX cloud/hosted của OnCallCX, tập trung extension, SIP trunk, call routing, IVR, voicemail và API-ready integration.',
    tags: ['oncallcx','ucaas','pbx','extension','sip-trunk','api-ready'],
    highlights: ['Cloud PBX','Extension / User','SIP Trunk','Call Routing','API-ready'],
    knowledgeSections: [
      { title:'Scope', content:'OnCallCX UCaaS chỉ thuần về tổng đài PBX và API chờ tích hợp.' },
      { title:'Không thuộc scope', content:'AI Voicebot, Omnichannel, Analytics và Recording thuộc OnCallCX CCaaS.' }
    ],
    apiLinks: [
      { method:'GET', path:'/ucaas/extensions', description:'Danh sách extension' },
      { method:'POST', path:'/ucaas/extensions', description:'Tạo extension' },
      { method:'GET', path:'/ucaas/cdr', description:'Truy vấn CDR UCaaS' }
    ]
  },
  {
    id: 'oncallcx',
    title: 'OnCallCX CCaaS',
    category: 'OnCallCX',
    subCategory: 'CCaaS',
    parent: 'oncallcx',
    route: '#oncallcx-ccaas',
    summary: 'Phân hệ Contact Center của OnCallCX, gồm AI Voicebot, Omnichannel, Analytics, Recording, Campaign và CRM/ERP Integration.',
    tags: ['oncallcx','ccaas','ai-voicebot','omnichannel','analytics','recording','crm-integration'],
    highlights: ['AI Voicebot','Omnichannel','Analytics','Recording','Campaign','CRM/ERP Integration'],
    knowledgeSections: [
      { title:'Scope', content:'OnCallCX CCaaS bao gồm toàn bộ tính năng Contact Center: AI Voicebot, Omnichannel, Analytics, Recording và tích hợp CRM/ERP.' },
      { title:'Relationship', content:'Có thể dùng OnCallCX UCaaS làm PBX/telephony foundation nhưng UCaaS và CCaaS là hai phân hệ khác nhau.' }
    ]
  }
];

function mergeById(existing = [], seeds = []) {
  const map = new Map();
  (Array.isArray(existing) ? existing : []).forEach(x => { if (x?.id) map.set(x.id, x); });
  seeds.forEach(seed => map.set(seed.id, { ...(map.get(seed.id) || {}), ...seed }));
  return Array.from(map.values());
}

async function syncCms() {
  const cms = await loadCms().catch(() => ({}));
  cms.meta = cms.meta || {};
  cms.meta.version = cms.meta.version || 'v10.8.3';
  cms.meta.oncallcxReclass = VERSION;
  cms.meta.oncallcxReclassUpdatedAt = new Date().toISOString();

  cms.articles = mergeById(cms.articles, ONCALLCX_ARTICLES);
  cms.products = mergeById(cms.products, PRODUCT_UPDATES);

  // Move any legacy OnCallCX UCaaS product/article out of UC/PBX into OnCallCX family.
  if (Array.isArray(cms.products)) {
    cms.products = cms.products.map(p => {
      const text = [p.id, p.title, p.name].join(' ').toLowerCase();
      if (text.includes('oncallcx') && text.includes('ucaas')) {
        return { ...p, category:'OnCallCX', subCategory:'UCaaS', parent:'oncallcx', route:'#oncallcx-ucaas' };
      }
      return p;
    });
  }
  if (Array.isArray(cms.articles)) {
    cms.articles = cms.articles.map(a => {
      const text = [a.id, a.title, a.sidebarId].join(' ').toLowerCase();
      if (text.includes('oncallcx') && text.includes('ucaas')) {
        return { ...a, module:'OnCallCX', family:'oncallcx', subCategory:'ucaas', route:'#oncallcx-ucaas', sidebarId:'oncallcx-ucaas' };
      }
      return a;
    });
  }

  cms.navigationCoverage = cms.navigationCoverage || {};
  cms.navigationCoverage.oncallcxFamily = {
    version: VERSION,
    parent: '#oncallcx',
    children: ['#oncallcx-ucaas', '#oncallcx-ccaas'],
    note: 'OnCallCX UCaaS moved from UC/PBX Việt Nam into OnCallCX product family. UCaaS and CCaaS remain separate modules.'
  };

  await saveCms(cms);
  return cms;
}

function ensureStyle() {
  if (document.getElementById('oncallcxFamilyStyle')) return;
  const style = document.createElement('style');
  style.id = 'oncallcxFamilyStyle';
  style.textContent = `
  .ocx-hero{background:linear-gradient(135deg,rgba(249,115,22,.16),rgba(59,130,246,.10));border:1px solid rgba(249,115,22,.28);border-radius:28px;padding:30px;margin-bottom:18px}
  .ocx-hero h2{font-size:36px;margin:10px 0}.ocx-hero p{color:#c4d3ea;line-height:1.65;max-width:980px}
  .ocx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ocx-card{background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:20px;padding:18px}.ocx-card h3{margin-top:0}.ocx-card p,.ocx-card li{color:#c4d3ea;line-height:1.65}
  .ocx-tags{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ocx-tag{display:inline-flex;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:#93c5fd}
  .ocx-tag.orange{background:rgba(249,115,22,.13);border-color:rgba(249,115,22,.28);color:#fdba74}
  .ocx-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}
  .ocx-scope{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);border-radius:18px;padding:16px}
  .ocx-out{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:18px;padding:16px}
  @media(max-width:900px){.ocx-grid,.ocx-split{grid-template-columns:1fr}.ocx-hero h2{font-size:30px}}
  `;
  document.head.appendChild(style);
}

function setHeader(title, subtitle) {
  const t = document.querySelector('#pageTitle');
  const s = document.querySelector('#pageSubtitle');
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle;
}

function renderUcaas() {
  setHeader('OnCallCX UCaaS', 'OnCallCX Product Family · PBX');
  return `<section class="ocx-hero">
    <span class="eyebrow">☎️ OnCallCX / UCaaS</span>
    <h2>OnCallCX UCaaS<br><span style="color:#93c5fd">Cloud PBX · SIP Trunk · API-ready</span></h2>
    <p>OnCallCX UCaaS là phân hệ tổng đài PBX cloud/hosted. Phân hệ này tập trung vào thoại nền tảng: extension, user, SIP trunk, call routing, IVR, ring group, voicemail và API chờ tích hợp.</p>
    <div class="ocx-tags"><span class="ocx-tag">Cloud PBX</span><span class="ocx-tag">Extension</span><span class="ocx-tag">SIP Trunk</span><span class="ocx-tag">Call Routing</span><span class="ocx-tag orange">API-ready</span></div>
  </section>
  <section class="ocx-grid">
    <article class="ocx-card"><h3>Thành phần chính</h3><ul><li>Extension / User</li><li>Number plan</li><li>Inbound / Outbound routing</li><li>Ring group / IVR / Voicemail</li><li>SIP trunk / DID / Prefix</li></ul></article>
    <article class="ocx-card"><h3>API chờ tích hợp</h3><ul><li>Provisioning extension</li><li>CDR query</li><li>Click-to-call</li><li>CRM-ready integration</li><li>Webhook trạng thái cuộc gọi nếu được enable</li></ul></article>
  </section>
  <section class="ocx-split">
    <article class="ocx-scope"><h3>✅ Scope UCaaS</h3><p>Tổng đài PBX, telephony foundation, extension, SIP trunk, call routing và API nền tảng.</p></article>
    <article class="ocx-out"><h3>❌ Không nằm trong UCaaS</h3><p>AI Voicebot, Omnichannel, Analytics/Dashboard và Recording là thành phần của OnCallCX CCaaS.</p></article>
  </section>`;
}

function renderCcaas() {
  setHeader('OnCallCX CCaaS', 'OnCallCX Product Family · Contact Center');
  return `<section class="ocx-hero">
    <span class="eyebrow">🎧 OnCallCX / CCaaS</span>
    <h2>OnCallCX CCaaS<br><span style="color:#fdba74">Contact Center · AI · Omnichannel · Recording</span></h2>
    <p>OnCallCX CCaaS là phân hệ Contact Center. Các thành phần AI Voicebot, Omnichannel, Analytics, Recording, Campaign/Outbound và CRM/ERP Integration đều thuộc CCaaS.</p>
    <div class="ocx-tags"><span class="ocx-tag orange">AI Voicebot</span><span class="ocx-tag orange">Omnichannel</span><span class="ocx-tag orange">Analytics</span><span class="ocx-tag orange">Recording</span><span class="ocx-tag">CRM/ERP Integration</span></div>
  </section>
  <section class="ocx-grid">
    <article class="ocx-card"><h3>Customer Engagement</h3><ul><li>Voice queue</li><li>Omnichannel</li><li>AI Voicebot</li><li>Outbound campaign</li><li>CRM screen pop</li></ul></article>
    <article class="ocx-card"><h3>Operation & Quality</h3><ul><li>Realtime dashboard</li><li>Agent / queue analytics</li><li>Recording</li><li>QA/QC</li><li>Reporting</li></ul></article>
  </section>
  <section class="ocx-split">
    <article class="ocx-scope"><h3>✅ Scope CCaaS</h3><p>Contact Center, AI Voicebot, Omnichannel, Analytics, Recording, Campaign và CRM/ERP integration.</p></article>
    <article class="ocx-out"><h3>Phân biệt với UCaaS</h3><p>UCaaS là PBX/telephony foundation. CCaaS là lớp chăm sóc khách hàng và vận hành contact center.</p></article>
  </section>`;
}

function renderRoute() {
  const hash = location.hash || '';
  if (!['#oncallcx-ucaas','#oncallcx-ccaas'].includes(hash)) return;
  ensureStyle();
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  root.innerHTML = hash === '#oncallcx-ucaas' ? renderUcaas() : renderCcaas();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(syncCms, 500);
  setTimeout(renderRoute, 650);
});
window.addEventListener('hashchange', () => setTimeout(renderRoute, 80));

window.FTIOnCallCXReclass = { syncCms, ONCALLCX_ARTICLES, PRODUCT_UPDATES };
