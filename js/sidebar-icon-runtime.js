/* Sidebar icon manager - upload, preview, export config for GitHub Pages */
import { publishJsonToGithub } from './cms/github-publish.js';

(function(){
  const STORAGE_KEY = 'fti_sidebar_icon_config_v1';
  const DB_NAME = 'fti_sidebar_icon_db';
  const DB_STORE = 'configs';
  const DB_KEY = 'sidebar-icons';
  const CONFIG_URL = 'data/sidebar-icons.json';

  const targets = [
    {id:'overview', type:'Bài viết', label:'Tổng quan', route:'#overview', page:'overview', fallback:'🏠'},
    {id:'group-contact-center', type:'Nhóm', label:'CONTACT CENTER', subtitle:'UCaaS · CCaaS · AI', group:'CONTACT CENTER', fallback:'🎧'},
    {id:'oncallcx', type:'Bài viết', label:'OnCallCX', route:'#oncallcx', page:'oncallcx', fallback:'📞'},
    {id:'ccaas-vn', type:'Bài viết', label:'CCaaS Việt Nam', route:'#ccaas-vn', page:'ccaas-vn', fallback:'🇻🇳'},
    {id:'ccaas-global', type:'Bài viết', label:'CCaaS Global', route:'#ccaas-global', page:'ccaas-global', fallback:'☁️'},
    {id:'api-reference', type:'Bài viết', label:'API Reference', route:'#api-reference', page:'api-reference', fallback:'📗'},
    {id:'ucpbx-vn', type:'Bài viết', label:'UC/PBX Việt Nam', route:'#ucpbx-vn', page:'ucpbx-vn', fallback:'🏁'},
    {id:'group-video-conference', type:'Nhóm', label:'VIDEO CONFERENCE', subtitle:'Room · Endpoint', group:'VIDEO CONFERENCE', fallback:'🎥'},
    {id:'video-conferencing', type:'Bài viết', label:'Tổng quan Video Conference', route:'#video-conferencing', page:'video-conferencing', fallback:'📹'},
    {id:'vc-yealink', type:'Bài viết', label:'Yealink Meeting Bar', route:'#vc-yealink', page:'vc-yealink', fallback:'🖥️'},
    {id:'vc-logitech', type:'Bài viết', label:'Logitech Rally Bar', route:'#vc-logitech', page:'vc-logitech', fallback:'📷'},
    {id:'vc-poly', type:'Bài viết', label:'HP Poly Studio X52', route:'#vc-poly', page:'vc-poly', fallback:'🎙️'},
    {id:'vc-cisco', type:'Bài viết', label:'Cisco Webex Devices', route:'#vc-cisco', page:'vc-cisco', fallback:'🗄️'},
    {id:'vc-jabra', type:'Bài viết', label:'Jabra PanaCast', route:'#vc-jabra', page:'vc-jabra', fallback:'🎧'},
    {id:'vc-crestron', type:'Bài viết', label:'Crestron Flex', route:'#vc-crestron', page:'vc-crestron', fallback:'🎛️'},
    {id:'vc-huddle-room', type:'Bài viết', label:'Huddle Room', route:'#vc-huddle-room', page:'vc-huddle-room', fallback:'👥'},
    {id:'vc-medium-large-room', type:'Bài viết', label:'Medium / Large Room', route:'#vc-medium-large-room', page:'vc-medium-large-room', fallback:'🏢'},
    {id:'group-integration', type:'Nhóm', label:'INTEGRATION', subtitle:'CRM · ERP · BYOC', group:'INTEGRATION', fallback:'🔌'},
    {id:'integration', type:'Bài viết', label:'Integration Playbook', route:'#integration', page:'integration', fallback:'🔁'},
    {id:'crm', type:'Bài viết', label:'CRM/ERP Việt Nam', route:'#crm', page:'crm', fallback:'🧩'},
    {id:'compliance', type:'Bài viết', label:'Tuân thủ VN', route:'#compliance', page:'compliance', fallback:'🛡️'},
    {id:'group-demo-sales', type:'Nhóm', label:'DEMO & SALES', subtitle:'Khách hàng đọc hiểu', group:'DEMO & SALES', fallback:'🚀'},
    {id:'demo', type:'Bài viết', label:'Demo sản phẩm', route:'#demo', page:'demo', fallback:'▶️'},
    {id:'compare', type:'Bài viết', label:'Bảng so sánh', route:'#compare', page:'compare', fallback:'📊'},
    {id:'resources', type:'Bài viết', label:'Nguồn tài liệu', route:'#resources', page:'resources', fallback:'📚'},
    {id:'cms', type:'Bài viết', label:'CMS Data', route:'#cms', page:'cms', fallback:'🧩'},
    {id:'group-system-security', type:'Nhóm', label:'SYSTEM & SECURITY', subtitle:'User · Role · Audit', group:'SYSTEM & SECURITY', fallback:'🔐'},
    {id:'users', type:'Bài viết', label:'Quản lý User', route:'#users', page:'users', fallback:'👤'},
    {id:'permissions', type:'Bài viết', label:'Phân quyền', route:'#permissions', page:'permissions', fallback:'🛡️'},
    {id:'audit-log', type:'Bài viết', label:'Audit Log', route:'#audit-log', page:'audit-log', fallback:'📜'},
    {id:'sidebar-icons', type:'Bài viết', label:'Sidebar Icons', route:'#sidebar-icons', page:'sidebar-icons', fallback:'🖼️'},
    {id:'prod-oncallcx-fpt', type:'Logo card', label:'OnCallCX CCaaS card logo', route:'#oncallcx-product-center-ccaas', fallback:'📞'},
    {id:'prod-oncallcx-ucaas-inherited', type:'Logo card', label:'OnCallCX UCaaS card logo', route:'#oncallcx-product-center-ucaas', fallback:'🏢'}
  ];

  let remoteConfig = {icons:{}};
  let localConfig = {icons:{}};
  let iconObserver = null;
  let dynamicTargets = [];
  let activeManagerRoot = null;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slug = value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  function iconTargetFromRoute(route='', title=''){
    const raw = String(route || '').trim();
    if(raw.startsWith('#')) return `card-${slug(raw.replace(/^#/, '').replace(/[:/]+/g, '-'))}`;
    return `card-${slug(title || raw || 'card')}`;
  }

  function addDynamicTarget(map, target){
    if(!target?.id || map.has(target.id)) return;
    map.set(target.id, {
      type: 'Logo card',
      fallback: '📄',
      ...target
    });
  }

  function domCardTargets(){
    const map = new Map();
    $$('[data-icon-target]').forEach(host => {
      const id = host.getAttribute('data-icon-target');
      if(!id) return;
      const card = host.closest('article,.wp-card,.resource-card,.compliance-card') || host.parentElement;
      const label = card?.querySelector('h3,h4,b,strong')?.textContent?.trim() || host.title || id;
      addDynamicTarget(map, {id, label, route:id, fallback:host.textContent?.trim() || '📄'});
    });
    return Array.from(map.values());
  }

  function allTargets(){
    const map = new Map();
    [...targets, ...dynamicTargets, ...domCardTargets()].forEach(target => {
      if(!target?.id) return;
      if(map.has(target.id)){
        map.set(target.id, {...target, ...map.get(target.id)});
      }else{
        map.set(target.id, target);
      }
    });
    return Array.from(map.values());
  }

  function toast(message){
    if(typeof window.toast === 'function') return window.toast(message);
    const root = $('#toastRoot');
    if(!root) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    root.appendChild(item);
    setTimeout(() => item.remove(), 2600);
  }

  function openIconDb(){
    return new Promise((resolve, reject) => {
      if(!window.indexedDB){
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Cannot open IndexedDB'));
    });
  }

  function dbGet(key){
    return openIconDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Cannot read IndexedDB'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    }));
  }

  function dbPut(key, value){
    return openIconDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const req = tx.objectStore(DB_STORE).put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Cannot write IndexedDB'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    }));
  }

  async function loadLocalConfig(){
    try{
      const saved = await dbGet(DB_KEY);
      if(saved && typeof saved === 'object'){
        localConfig = saved;
      }else{
        const legacy = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localConfig = legacy && typeof legacy === 'object' ? legacy : {icons:{}};
        if(Object.keys(localConfig.icons || {}).length) await dbPut(DB_KEY, localConfig);
      }
    }catch(err){
      console.warn('Cannot load sidebar icon config', err);
      localConfig = {icons:{}};
    }
    try{ localStorage.removeItem(STORAGE_KEY); }catch{}
  }

  function readLocalConfig(){
    return localConfig && typeof localConfig === 'object' ? localConfig : {icons:{}};
  }

  function writeLocalConfig(config){
    localConfig = {
      version: '20260708-1',
      updatedAt: new Date().toISOString(),
      icons: config.icons || {}
    };
    dbPut(DB_KEY, localConfig).catch(err => {
      console.error('Cannot save sidebar icons to IndexedDB', err);
      toast('Không lưu được icon. Trình duyệt đang chặn IndexedDB.');
    });
    try{ localStorage.removeItem(STORAGE_KEY); }catch{}
  }

  function rerenderManager(){
    if(activeManagerRoot && document.contains(activeManagerRoot)){
      renderManager({root: activeManagerRoot});
      return;
    }
    renderManager();
  }

  function mergedConfig(){
    const local = readLocalConfig();
    return {
      version: local.version || remoteConfig.version || '20260708-1',
      updatedAt: local.updatedAt || remoteConfig.updatedAt || '',
      icons: {
        ...(remoteConfig.icons || {}),
        ...(local.icons || {})
      }
    };
  }

  function findIconHost(target){
    if(target.page){
      const nav = $(`.nav-item[data-page="${CSS.escape(target.page)}"]`);
      return nav ? $('span:first-child', nav) : null;
    }
    if(target.group){
      const heads = $$('.nav-group-head');
      const head = heads.find(btn => ($('b', btn)?.textContent || '').trim() === target.group);
      return head ? $('span:first-child', head) : null;
    }
    return null;
  }

  function findCardIconHosts(target){
    const aliases = {
      'prod-oncallcx-fpt': ['prod-oncallcx-fpt', 'oncallcx'],
      'prod-oncallcx-ucaas-inherited': ['prod-oncallcx-ucaas-inherited', 'oncallcx-ucaas', 'prod-oncallcx-uc', 'oncallcx-as7-ucaas']
    };
    return (aliases[target.id] || [target.id])
      .flatMap(id => $$(`[data-icon-target="${CSS.escape(id)}"]`));
  }

  function renderIconMarkup(icon, fallback, label){
    if(icon?.src){
      return `<img class="sidebar-custom-icon" src="${esc(icon.src)}" alt="${esc(label)}">`;
    }
    return esc(fallback || '•');
  }

  function applyIconToHost(host, icon, fallback, label, mode){
    host.classList.toggle('sidebar-icon-slot', mode === 'sidebar');
    host.classList.toggle('product-logo-slot', mode === 'card');
    const markup = renderIconMarkup(icon, fallback, label);
    if(host.innerHTML !== markup) host.innerHTML = markup;
    host.title = icon?.fileName ? `${label}: ${icon.fileName}` : label;
  }

  function applyIcons(){
    const config = mergedConfig();
    allTargets().forEach(target => {
      const icon = config.icons[target.id];
      const sidebarHost = findIconHost(target);
      if(sidebarHost) applyIconToHost(sidebarHost, icon, target.fallback, target.label, 'sidebar');
      findCardIconHosts(target).forEach(host => applyIconToHost(host, icon, target.fallback, target.label, 'card'));
    });
  }

  async function loadRemoteConfig(){
    try{
      const res = await fetch(`${CONFIG_URL}?v=${Date.now()}`, {cache:'no-store'});
      if(res.ok){
        const json = await res.json();
        remoteConfig = json && typeof json === 'object' ? json : {icons:{}};
      }
    }catch{
      remoteConfig = {icons:{}};
    }
    applyIcons();
  }

  async function fetchJson(url){
    try{
      const res = await fetch(`${url}?v=${Date.now()}`, {cache:'no-store'});
      return res.ok ? await res.json() : null;
    }catch{
      return null;
    }
  }

  async function loadDynamicTargets(){
    const map = new Map();
    const cms = await fetchJson('data/cms-content.json');
    (cms?.products || []).forEach(product => {
      addDynamicTarget(map, {
        id: product.id,
        label: product.title || product.name || product.id,
        route: product.route || product.id,
        fallback: product.icon || '📦'
      });
    });
    (cms?.articles || []).forEach(article => {
      (article.cards || []).forEach(card => {
        const route = card.url || card.route || article.route || '';
        addDynamicTarget(map, {
          id: card.id || iconTargetFromRoute(route, card.title),
          label: card.title || route || article.title || 'CMS card',
          route,
          fallback: card.icon || '📄'
        });
      });
    });
    const catalog = await fetchJson('data/partner-product-catalog.json');
    Object.values(catalog || {}).forEach(group => {
      (group.products || []).forEach(product => {
        addDynamicTarget(map, {
          id: product.id,
          label: product.name || product.title || product.id,
          route: product.link || product.id,
          fallback: product.icon || '📦'
        });
      });
    });
    dynamicTargets = Array.from(map.values());
  }

  function fileToDataUrl(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function setIcon(targetId, file){
    if(!file) return;
    if(!/^image\//i.test(file.type || '')){
      toast('Chỉ nhận file ảnh PNG, JPG, SVG hoặc WebP.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const local = readLocalConfig();
    local.icons = local.icons || {};
    local.icons[targetId] = {
      src: dataUrl,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      updatedAt: new Date().toISOString()
    };
    writeLocalConfig(local);
    applyIcons();
    rerenderManager();
    toast('Đã đổi icon sidebar.');
  }

  function resetIcon(targetId){
    const local = readLocalConfig();
    local.icons = local.icons || {};
    delete local.icons[targetId];
    writeLocalConfig(local);
    applyIcons();
    rerenderManager();
    toast('Đã khôi phục icon mặc định.');
  }

  function resetAll(){
    if(!confirm('Khôi phục toàn bộ icon sidebar về mặc định?')) return;
    writeLocalConfig({icons:{}});
    applyIcons();
    rerenderManager();
    toast('Đã khôi phục toàn bộ icon.');
  }

  function exportConfig(){
    const config = mergedConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sidebar-icons.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function saveConfig(){
    const config = mergedConfig();
    writeLocalConfig({icons: config.icons || {}});
    applyIcons();
    rerenderManager();
    toast('Đã lưu cấu hình icon sidebar.');
  }

  function publishIcons(){
    const config = mergedConfig();
    publishJsonToGithub({
      data: {
        version: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
        updatedAt: new Date().toISOString(),
        icons: config.icons || {}
      },
      path: 'data/sidebar-icons.json',
      message: 'Publish sidebar icon config',
      title: 'Publish Sidebar Icons',
      description: 'Ghi cau hinh icon sidebar vao data/sidebar-icons.json de GitHub Pages va moi trinh duyet doc dung icon da upload.'
    });
  }

  async function importConfig(file){
    if(!file) return;
    try{
      const text = await file.text();
      const json = JSON.parse(text);
      if(!json || typeof json !== 'object' || !json.icons) throw new Error('Invalid sidebar icon config');
      writeLocalConfig({icons: json.icons || {}});
      applyIcons();
      rerenderManager();
      toast('Đã import cấu hình icon.');
    }catch(err){
      console.error(err);
      toast('File cấu hình không hợp lệ.');
    }
  }

  function styles(){
    if($('#sidebarIconRuntimeStyle')) return;
    const style = document.createElement('style');
    style.id = 'sidebarIconRuntimeStyle';
    style.textContent = `
      .sidebar-icon-slot{width:20px;min-width:20px;height:20px;display:inline-grid;place-items:center;line-height:1}
      .sidebar-custom-icon{width:20px;height:20px;object-fit:contain;border-radius:5px;display:block}
      .product-logo-slot img{width:44px;height:44px;max-width:44px;max-height:44px;object-fit:contain;border-radius:12px;display:block}
      .partner-icon.product-logo-slot,.vendor-icon.product-logo-slot,.solution-icon.product-logo-slot{font-size:0}
      .sidebar-icon-page{display:grid;gap:18px}
      .sidebar-icon-hero{background:linear-gradient(135deg,rgba(249,115,22,.16),rgba(16,185,129,.08));border:1px solid rgba(249,115,22,.28);border-radius:24px;padding:26px}
      .sidebar-icon-hero h2{font-size:32px;margin:10px 0}
      .sidebar-icon-hero p{color:#c4d3ea;max-width:980px;line-height:1.6}
      .sidebar-icon-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px}
      .sidebar-icon-toolbar input,.sidebar-icon-toolbar select{height:42px;border:1px solid var(--line);background:#050a18;color:#fff;border-radius:12px;padding:0 12px;outline:none}
      .sidebar-icon-toolbar input[type="search"]{min-width:280px;flex:1}
      .sidebar-icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:14px}
      .sidebar-icon-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;display:grid;gap:12px}
      .sidebar-icon-preview{height:104px;border:1px solid rgba(255,255,255,.08);background:#0b1020;border-radius:14px;display:grid;place-items:center;font-size:34px;overflow:hidden}
      .sidebar-icon-preview img{max-width:76px;max-height:76px;object-fit:contain}
      .sidebar-icon-meta h3{margin:0;font-size:15px}.sidebar-icon-meta p{margin:5px 0 0;color:#94a3b8;font-size:12px}
      .sidebar-icon-badge{display:inline-flex;width:max-content;border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.12);color:#93c5fd;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:900}
      .sidebar-icon-actions{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
      .sidebar-icon-actions input{width:100%;border:1px solid var(--line);background:#050a18;color:#dbeafe;border-radius:12px;padding:9px}
      .sidebar-icon-empty{border:1px dashed var(--line);border-radius:18px;padding:28px;text-align:center;color:#94a3b8}
    `;
    document.head.appendChild(style);
  }

  function card(target, config){
    const icon = config.icons[target.id];
    const preview = icon?.src ? `<img src="${esc(icon.src)}" alt="${esc(target.label)}">` : `<span>${esc(target.fallback)}</span>`;
    return `<article class="sidebar-icon-card" data-sidebar-icon-card="${esc(target.id)}">
      <div class="sidebar-icon-preview">${preview}</div>
      <div class="sidebar-icon-meta">
        <span class="sidebar-icon-badge">${esc(target.type)}</span>
        <h3>${esc(target.label)}</h3>
        <p>${esc(target.route || target.subtitle || target.group || '')}</p>
        ${icon?.fileName ? `<p>Đang dùng: <b>${esc(icon.fileName)}</b></p>` : `<p>Đang dùng icon mặc định.</p>`}
      </div>
      <div class="sidebar-icon-actions">
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-sidebar-icon-upload="${esc(target.id)}">
        <button class="btn btn-soft" data-sidebar-icon-reset="${esc(target.id)}">Reset</button>
      </div>
    </article>`;
  }

  function renderManager(options = {}){
    const embeddedRoot = options.root || null;
    if(embeddedRoot){
      activeManagerRoot = embeddedRoot;
    }else if(location.hash === '#sidebar-icons'){
      activeManagerRoot = null;
    }else if(activeManagerRoot && document.contains(activeManagerRoot)){
      renderManager({root: activeManagerRoot});
      return;
    }else{
      return;
    }
    styles();
    const root = embeddedRoot || $('#pageRoot');
    if(!root) return;
    if(!embeddedRoot){
    const title = $('#pageTitle');
    const subtitle = $('#pageSubtitle');
    if(title) title.textContent = 'Sidebar Icons';
    if(subtitle) subtitle.textContent = 'Upload icon nhóm và bài viết';

    }
    const query = sessionStorage.getItem('sidebar_icon_query') || '';
    const type = sessionStorage.getItem('sidebar_icon_type') || 'all';
    const config = mergedConfig();
    const availableTargets = allTargets();
    const filtered = availableTargets.filter(target => {
      const typeOk = type === 'all' || target.type === type;
      const q = query.trim().toLowerCase();
      const text = [target.label, target.route, target.group, target.type].join(' ').toLowerCase();
      return typeOk && (!q || text.includes(q));
    });

    root.innerHTML = `<section class="sidebar-icon-page">
      <div class="sidebar-icon-hero">
        <span class="eyebrow">🖼️ Sidebar Icon Manager</span>
        <h2>Thay icon mặc định của sidebar</h2>
        <p>Upload ảnh cho nhóm cha hoặc bài viết con. Icon đổi ngay trong sidebar và có thể export cấu hình để publish lên GitHub Pages.</p>
      </div>
      <div class="sidebar-icon-toolbar">
        <input type="search" id="sidebarIconSearch" value="${esc(query)}" placeholder="Tìm nhóm, bài viết, route...">
        <select id="sidebarIconType">
          <option value="all" ${type === 'all' ? 'selected' : ''}>Tất cả</option>
          <option value="Nhóm" ${type === 'Nhóm' ? 'selected' : ''}>Nhóm sidebar</option>
          <option value="Bài viết" ${type === 'Bài viết' ? 'selected' : ''}>Bài viết</option>
          <option value="Logo card" ${type === 'Logo card' ? 'selected' : ''}>Logo card</option>
        </select>
        <button class="btn btn-primary" id="sidebarIconSaveBtn">Lưu cấu hình</button>
        <button class="btn btn-primary" id="sidebarIconPublishBtn">Publish Icons</button>
        <button class="btn btn-soft" id="sidebarIconImportBtn">Import JSON</button>
        <button class="btn btn-soft" id="sidebarIconExportBtn">Export JSON</button>
        <button class="btn btn-ghost" id="sidebarIconResetAllBtn">Reset tất cả</button>
        <input id="sidebarIconImportFile" type="file" accept="application/json" hidden>
      </div>
      <div class="sidebar-icon-grid">${filtered.map(item => card(item, config)).join('') || `<div class="sidebar-icon-empty">Không có icon phù hợp.</div>`}</div>
    </section>`;
    bindManager(root);
  }

  function bindManager(root=document){
    $('#sidebarIconSearch', root)?.addEventListener('input', event => {
      sessionStorage.setItem('sidebar_icon_query', event.target.value || '');
      rerenderManager();
    });
    $('#sidebarIconType', root)?.addEventListener('change', event => {
      sessionStorage.setItem('sidebar_icon_type', event.target.value || 'all');
      rerenderManager();
    });
    $('#sidebarIconSaveBtn', root)?.addEventListener('click', saveConfig);
    $('#sidebarIconPublishBtn', root)?.addEventListener('click', publishIcons);
    $('#sidebarIconExportBtn', root)?.addEventListener('click', exportConfig);
    $('#sidebarIconResetAllBtn', root)?.addEventListener('click', resetAll);
    $('#sidebarIconImportBtn', root)?.addEventListener('click', () => $('#sidebarIconImportFile', root)?.click());
    $('#sidebarIconImportFile', root)?.addEventListener('change', event => importConfig(event.target.files?.[0]));
    $$('[data-sidebar-icon-upload]', root).forEach(input => {
      input.addEventListener('change', event => setIcon(input.dataset.sidebarIconUpload, event.target.files?.[0]));
    });
    $$('[data-sidebar-icon-reset]', root).forEach(btn => {
      btn.addEventListener('click', () => resetIcon(btn.dataset.sidebarIconReset));
    });
  }

  async function boot(){
    styles();
    await loadDynamicTargets();
    await loadLocalConfig();
    await loadRemoteConfig();
    startIconObserver();
    setTimeout(applyIcons, 250);
    setTimeout(applyIcons, 900);
    renderManager();
  }

  function startIconObserver(){
    if(iconObserver || !window.MutationObserver || !document.body) return;
    let scheduled = false;
    iconObserver = new MutationObserver(() => {
      if(scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyIcons();
      });
    });
    iconObserver.observe(document.body, {childList:true, subtree:true});
  }

  window.SidebarIconRuntime = {
    targets: () => allTargets().slice(),
    apply: applyIcons,
    renderCmsPanel: root => renderManager({root}),
    exportConfig,
    saveConfig,
    importConfig,
    publishIcons,
    resetIcon,
    resetAll
  };

  window.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('hashchange', () => {
    setTimeout(applyIcons, 80);
    setTimeout(renderManager, 100);
  });
})();
