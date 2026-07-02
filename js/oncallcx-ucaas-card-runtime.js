/* v10.8.6 — OnCallCX Product Document Metadata
   Correct behavior:
   - Keep the OnCallCX page as one landing page.
   - Keep two product cards ngang hàng: UCaaS and CCaaS.
   - Do NOT create presentation routes/pages.
   - Each product owns its own CMS document metadata.
   - View Presentation button reads product.documents.presentationUrl.
   - Admin can later update/upload a new file in CMS without code changes.
*/
import { loadCms, saveCms, esc } from './cms/cms-core.js';

const VERSION = 'v10.8.6-oncallcx-product-document-metadata';

const UCAAS_PRODUCT = {
  id: 'oncallcx-ucaas',
  title: 'OnCallCX - UCaaS',
  subtitle: 'Cloud PBX Platform',
  icon: '☎️',
  summary: 'OnCallCX UCaaS là phân hệ tổng đài Cloud PBX, tập trung vào Extension, SIP Trunk, Call Routing, IVR, Queue, Voicemail và API chờ tích hợp.',
  tags: ['ONCALLCX.VN','FPT','UCAAS','PBX','API READY'],
  features: [
    'Cloud PBX / Hosted PBX',
    'Extension / User / Device',
    'SIP Trunk / DID / Call Routing',
    'IVR / Ring Group / Queue',
    'Voicemail / Call Forward / Pickup',
    'REST API / Webhook chờ tích hợp'
  ],
  suitable: ['SME','Enterprise','Multi-branch','PBX Replacement'],
  documents: {
    presentation: 'OnCallCX UCaaS Presentation',
    presentationFile: 'OnCallCX_UCaaS_Presentation.pdf',
    presentationUrl: '#document-center',
    datasheet: 'OnCallCX_UCaaS_Datasheet.pdf',
    apiSpec: 'OnCallCX_UCaaS_API.yaml'
  },
  apiLinks: [
    {method:'GET', path:'/ucaas/extensions', description:'Danh sách extension'},
    {method:'POST', path:'/ucaas/extensions', description:'Tạo extension'},
    {method:'GET', path:'/ucaas/cdr', description:'Truy vấn CDR UCaaS'},
    {method:'POST', path:'/ucaas/click-to-call', description:'Click-to-call qua API'}
  ]
};

const CCAAS_PRODUCT = {
  id: 'oncallcx-ccaas',
  title: 'OnCallCX - Contact Center As A Service',
  subtitle: 'Cloud Contact Center Platform',
  icon: '📞',
  summary: 'OnCallCX CCaaS là phân hệ Contact Center as a Service do FPT Telecom phát triển, hỗ trợ doanh nghiệp triển khai tổng đài chăm sóc khách hàng trên Cloud, mở rộng linh hoạt và tích hợp với CRM/ERP/API Bot.',
  tags: ['ONCALLCX.VN','FPT','CCAAS','OMNICHANNEL'],
  features: [
    'Omnichannel Contact Center',
    'Voice / Chat / Email / Social',
    'AI Voicebot & Chatbot',
    'Call Recording',
    'Dashboard & Realtime Report',
    'CRM / ERP Integration'
  ],
  suitable: ['Enterprise','Banking','Finance','Retail','CSKH'],
  documents: {
    presentation: 'OnCallCX CCaaS Presentation',
    presentationFile: 'OnCallCX_CCaaS_Presentation.pdf',
    presentationUrl: '#document-center',
    datasheet: 'OnCallCX_CCaaS_Datasheet.pdf',
    apiSpec: 'OnCallCX_CCaaS_API.yaml'
  }
};

function mergeById(existing = [], seeds = []) {
  const map = new Map();
  (Array.isArray(existing) ? existing : []).forEach(x => { if (x?.id) map.set(x.id, x); });
  seeds.forEach(seed => map.set(seed.id, { ...(map.get(seed.id) || {}), ...seed }));
  return Array.from(map.values());
}

function getProduct(cms, id, fallback) {
  const p = (cms.products || []).find(x => x.id === id);
  return { ...fallback, ...(p || {}), documents: { ...(fallback.documents || {}), ...(p?.documents || {}) } };
}

async function syncCms() {
  const cms = await loadCms().catch(() => ({}));
  cms.meta = cms.meta || {};
  cms.meta.version = cms.meta.version || 'v10.8.6';
  cms.meta.oncallcxProductDocumentMetadata = VERSION;
  cms.meta.oncallcxProductDocumentMetadataUpdatedAt = new Date().toISOString();

  cms.products = mergeById(cms.products, [
    {
      id: UCAAS_PRODUCT.id,
      title: UCAAS_PRODUCT.title,
      category: 'OnCallCX',
      type: 'ucaas',
      parent: 'oncallcx',
      route: '#oncallcx',
      summary: UCAAS_PRODUCT.summary,
      tags: UCAAS_PRODUCT.tags,
      highlights: UCAAS_PRODUCT.features,
      suitable: UCAAS_PRODUCT.suitable,
      documents: UCAAS_PRODUCT.documents,
      apiLinks: UCAAS_PRODUCT.apiLinks
    },
    {
      id: CCAAS_PRODUCT.id,
      title: CCAAS_PRODUCT.title,
      category: 'OnCallCX',
      type: 'ccaas',
      parent: 'oncallcx',
      route: '#oncallcx',
      summary: CCAAS_PRODUCT.summary,
      tags: CCAAS_PRODUCT.tags,
      highlights: CCAAS_PRODUCT.features,
      suitable: CCAAS_PRODUCT.suitable,
      documents: CCAAS_PRODUCT.documents
    }
  ]);

  cms.documents = mergeById(cms.documents, [
    {
      id: 'doc-oncallcx-ucaas-presentation',
      title: UCAAS_PRODUCT.documents.presentation,
      type: 'presentation',
      productId: UCAAS_PRODUCT.id,
      fileName: UCAAS_PRODUCT.documents.presentationFile,
      url: UCAAS_PRODUCT.documents.presentationUrl,
      status: 'active'
    },
    {
      id: 'doc-oncallcx-ccaas-presentation',
      title: CCAAS_PRODUCT.documents.presentation,
      type: 'presentation',
      productId: CCAAS_PRODUCT.id,
      fileName: CCAAS_PRODUCT.documents.presentationFile,
      url: CCAAS_PRODUCT.documents.presentationUrl,
      status: 'active'
    }
  ]);

  cms.articles = mergeById(cms.articles, [{
    id: 'article-oncallcx',
    title: 'OnCallCX',
    sidebarId: 'oncallcx',
    route: '#oncallcx',
    type: 'product-family',
    status: 'active',
    module: 'OnCallCX',
    summary: 'Trang này hiển thị duy nhất các sản phẩm OnCallCX của FPT. OnCallCX gồm hai dòng sản phẩm ngang hàng: UCaaS cho Cloud PBX và CCaaS cho Contact Center.',
    tags: ['oncallcx','ucaas','ccaas','fpt'],
    productRefs: [UCAAS_PRODUCT.id, CCAAS_PRODUCT.id]
  }]);

  cms.relationships = mergeById(cms.relationships, [
    {id:'rel-oncallcx-family-ucaas', from:'oncallcx-family', to:UCAAS_PRODUCT.id, type:'has-product-line'},
    {id:'rel-oncallcx-family-ccaas', from:'oncallcx-family', to:CCAAS_PRODUCT.id, type:'has-product-line'},
    {id:'rel-oncallcx-ucaas-presentation', from:UCAAS_PRODUCT.id, to:'doc-oncallcx-ucaas-presentation', type:'has-presentation'},
    {id:'rel-oncallcx-ccaas-presentation', from:CCAAS_PRODUCT.id, to:'doc-oncallcx-ccaas-presentation', type:'has-presentation'}
  ]);

  await saveCms(cms);
  return cms;
}

function ensureStyle() {
  if (document.getElementById('ocxProductDocStyle')) return;
  const style = document.createElement('style');
  style.id = 'ocxProductDocStyle';
  style.textContent = `
  .ocx-card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
  .ocx-product-card{background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:22px;overflow:hidden}
  .ocx-product-card:hover{border-color:rgba(249,115,22,.45);box-shadow:0 20px 80px rgba(249,115,22,.08)}
  .ocx-product-head{display:flex;gap:16px;align-items:center;padding:22px;border-bottom:1px solid rgba(148,163,184,.16)}
  .ocx-product-icon{width:56px;height:56px;border-radius:18px;background:rgba(249,115,22,.13);display:grid;place-items:center;font-size:26px}
  .ocx-product-title h3{margin:0;font-size:23px}.ocx-product-title small{color:#93a4bd}
  .ocx-product-body{padding:22px}.ocx-product-body p{color:#dbeafe;line-height:1.65}
  .ocx-tags{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.ocx-tag{display:inline-flex;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:900;background:rgba(59,130,246,.13);border:1px solid rgba(59,130,246,.28);color:#bfdbfe}.ocx-tag.orange{background:rgba(249,115,22,.14);border-color:rgba(249,115,22,.30);color:#fdba74}
  .ocx-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.ocx-feature{background:rgba(16,185,129,.10);border:1px solid rgba(16,185,129,.24);border-radius:12px;padding:10px;color:#a7f3d0;font-weight:800;font-size:12px}
  .ocx-suitable{background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.25);border-radius:14px;padding:12px;margin-top:12px;color:#c4d3ea}
  .ocx-doc-line{font-size:12px;color:#93a4bd;margin-top:10px}.ocx-doc-line code{color:#fdba74}
  .ocx-actions{display:flex;gap:10px;flex-wrap:wrap;padding:18px 22px;border-top:1px solid rgba(148,163,184,.16)}
  .ocx-family-note{background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.22);border-radius:18px;padding:16px;margin:18px 0;color:#dbeafe;line-height:1.65}
  @media(max-width:1100px){.ocx-card-grid{grid-template-columns:1fr}.ocx-feature-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function openPresentation(product) {
  const url = product.documents?.presentationUrl || '#document-center';
  if (url.startsWith('#')) {
    location.hash = url;
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

function productCard(p, mode='ucaas') {
  const features = (p.features || p.highlights || []).map(f => `<div class="ocx-feature">✓ ${esc(f)}</div>`).join('');
  const tags = (p.tags || []).map((t,i) => `<span class="ocx-tag ${i%2?'orange':''}">${esc(t)}</span>`).join('');
  const suitable = (p.suitable || []).map(esc).join(' · ');
  const docFile = p.documents?.presentationFile || 'Chưa gắn file presentation';
  return `<article class="ocx-product-card" data-product="${esc(p.id)}">
    <div class="ocx-product-head">
      <div class="ocx-product-icon">${esc(p.icon || (mode === 'ucaas' ? '☎️' : '📞'))}</div>
      <div class="ocx-product-title">
        <h3>${esc(p.title)}</h3>
        <small>${esc(p.subtitle || '')}</small>
      </div>
    </div>
    <div class="ocx-product-body">
      <div class="ocx-tags">${tags}</div>
      <p>${esc(p.summary)}</p>
      <div class="ocx-feature-grid">${features}</div>
      <div class="ocx-suitable"><b>Phù hợp:</b> ${suitable}</div>
      <div class="ocx-doc-line"><b>Presentation:</b> <code>${esc(docFile)}</code></div>
    </div>
    <div class="ocx-actions">
      <button class="btn btn-soft">Chỉnh sửa</button>
      <button class="btn btn-danger">Xóa</button>
      ${mode === 'ucaas' ? '<a class="btn btn-soft" href="#api-reference">Xem API</a>' : ''}
      <button class="btn btn-primary" data-open-presentation="${esc(p.id)}">Xem Presentation</button>
    </div>
  </article>`;
}

async function renderOnCallCXCards() {
  if ((location.hash || '') !== '#oncallcx') return;
  ensureStyle();

  const cms = await loadCms().catch(() => ({}));
  const ucaas = getProduct(cms, 'oncallcx-ucaas', UCAAS_PRODUCT);
  const ccaas = getProduct(cms, 'oncallcx-ccaas', CCAAS_PRODUCT);

  const root = document.querySelector('#pageRoot');
  if (!root) return;

  const title = document.querySelector('#pageTitle');
  const subtitle = document.querySelector('#pageSubtitle');
  if (title) title.textContent = 'OnCallCX';
  if (subtitle) subtitle.textContent = 'Trang sản phẩm OnCallCX';

  root.innerHTML = `<section class="cms-article-hero">
    <span class="eyebrow">📦 Product Articles</span>
    <h1>OnCallCX</h1>
    <p>Trang này hiển thị duy nhất các sản phẩm OnCallCX của FPT. OnCallCX gồm hai dòng sản phẩm ngang hàng: <b>OnCallCX UCaaS</b> cho Cloud PBX và <b>OnCallCX CCaaS</b> cho Contact Center.</p>
    <div class="ocx-family-note">
      <b>Nguyên tắc CMS:</b> UCaaS và CCaaS có <b>file Presentation riêng</b>. Nút <b>Xem Presentation</b> đọc từ metadata <code>product.documents.presentationUrl</code>, không tạo route/page presentation mới.
    </div>
    <div class="hero-actions">
      <button class="btn btn-primary">+ Thêm bài viết sản phẩm</button>
      <a class="btn btn-soft" href="#api-reference">Xem API Reference</a>
    </div>
  </section>

  <section class="ocx-card-grid">
    ${productCard(ucaas, 'ucaas')}
    ${productCard(ccaas, 'ccaas')}
  </section>`;

  root.querySelectorAll('[data-open-presentation]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-presentation');
      const product = id === 'oncallcx-ucaas' ? ucaas : ccaas;
      openPresentation(product);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(syncCms, 350);
  setTimeout(renderOnCallCXCards, 650);
});
window.addEventListener('hashchange', () => setTimeout(renderOnCallCXCards, 80));

window.FTIOnCallCXProductDocuments = {
  syncCms,
  renderOnCallCXCards,
  UCAAS_PRODUCT,
  CCAAS_PRODUCT
};
