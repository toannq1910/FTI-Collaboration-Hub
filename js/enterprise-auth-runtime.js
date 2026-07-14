/* v10.8.0 Enterprise Authentication
   Client-side RBAC for static GitHub Pages/local portal.
   Note: this is UI-level authentication for a static portal, not server-side security.
*/
import { loadCms, saveCms, esc } from './cms/cms-core.js';

const AUTH_VERSION = 'v10.8.0';
const USERS_KEY = 'fti_auth_users';
const SESSION_KEY = 'fti_auth_session';
const AUDIT_KEY = 'fti_auth_audit';
const GROUPS_KEY = 'fti_auth_groups';
const CUSTOM_PERMISSIONS_KEY = 'fti_auth_custom_permissions';

const DEFAULT_PASSWORD = 'Admin!@#$%2020';

const ROLE_PERMISSIONS = {
  admin: {
    label: 'Admin',
    permissions: ['*'],
    description: 'Toàn quyền: user, role, CMS, product, document, API, audit, publish.'
  },
  editor: {
    label: 'Editor',
    permissions: [
      'cms.view','articles.view','articles.create','articles.update',
      'products.view','products.create','products.update',
      'assets.view','assets.create','assets.update',
      'documents.view','documents.create','documents.update',
      'api.view','api.update','knowledge.view','knowledge.update',
      'video.view','video.update','audit.view'
    ],
    description: 'Quản trị nội dung nhưng không quản lý user/role/system.'
  },
  viewer: {
    label: 'Viewer',
    permissions: [
      'cms.view','articles.view','products.view','assets.view',
      'documents.view','api.view','knowledge.view','video.view'
    ],
    description: 'Chỉ xem nội dung, không tạo/sửa/xóa/publish.'
  }
};

const MODULE_PERMISSIONS = [
  ['CMS','cms.view','cms.update','cms.publish'],
  ['Articles','articles.view','articles.create','articles.update','articles.delete','articles.publish'],
  ['Products','products.view','products.create','products.update','products.delete','products.publish'],
  ['Documents','documents.view','documents.create','documents.update','documents.delete','documents.publish'],
  ['Assets','assets.view','assets.create','assets.update','assets.delete'],
  ['API','api.view','api.create','api.update','api.delete'],
  ['Knowledge','knowledge.view','knowledge.create','knowledge.update','knowledge.delete'],
  ['Video Conference','video.view','video.create','video.update','video.delete'],
  ['Users','users.view','users.create','users.update','users.delete'],
  ['Roles','roles.view','roles.update'],
  ['Audit','audit.view']
];

const MODULE_ACCESS = [
  {id:'contact-center', label:'Contact Center', section:'Business modules', routes:['#oncallcx','#ccaas-vn','#ccaas-global','#api-reference','#ucpbx-vn','#oncallcx-product-center','#oncallcx-product-center-ccaas','#oncallcx-product-center-ucaas','#presentation-oncallcx','#presentation-oncallcx-ccaas','#presentation-oncallcx-ucaas'], permissions:['contact.view','contact.edit']},
  {id:'video-conference', label:'Video Conference', section:'Business modules', routes:['#video-conferencing','#vc-yealink','#vc-logitech','#vc-poly','#vc-cisco','#vc-jabra','#vc-crestron','#vc-huddle-room','#vc-medium-large-room'], permissions:['video.view','video.update']},
  {id:'integration', label:'Integration', section:'Business modules', routes:['#integration','#crm','#compliance'], permissions:['integration.view','integration.edit']},
  {id:'demo-sales', label:'Demo & Sales', section:'Business modules', routes:['#demo','#compare','#resources'], permissions:['demo.view','demo.edit']},
  {id:'cms-data', label:'CMS Data', section:'System modules', routes:['#cms'], permissions:['cms.view','cms.update','cms.publish']},
  {id:'system-security', label:'System & Security', section:'System modules', routes:['#users','#permissions','#audit-log'], permissions:['users.view','roles.view','audit.view']}
];

const BUSINESS_MODULE_IDS = ['contact-center','video-conference','integration','demo-sales'];

const ROUTE_PERMISSIONS = MODULE_ACCESS.reduce((acc,module)=>{
  module.routes.forEach(route=>{acc[route]=module.permissions[0]});
  return acc;
},{});

const AUTH_ONLY_ROUTES = new Set(['#users', '#permissions', '#audit-log', '#enterprise-cms', '#cms', '#cms-audit']);

function normalizeAuthRoute(route=''){
  const raw = String(route || '').trim();
  if(raw.startsWith('#api-folder:')) return '#api-reference';
  if(raw.startsWith('#oncallcx-product-center:prod-oncallcx-ucaas') || raw.startsWith('#oncallcx-product-centerprod-oncallcx-ucaas')) return '#oncallcx-product-center-ucaas';
  if(raw.startsWith('#oncallcx-product-center:prod-oncallcx-fpt') || raw.startsWith('#oncallcx-product-centerprod-oncallcx-fpt')) return '#oncallcx-product-center-ccaas';
  if(raw.startsWith('#oncallcx-product-center:')) return '#oncallcx-product-center';
  if(raw.startsWith('#presentation-oncallcx:prod-oncallcx-ucaas') || raw.startsWith('#presentation-oncallcxprod-oncallcx-ucaas')) return '#presentation-oncallcx-ucaas';
  if(raw.startsWith('#presentation-oncallcx:prod-oncallcx-fpt') || raw.startsWith('#presentation-oncallcxprod-oncallcx-fpt')) return '#presentation-oncallcx-ccaas';
  if(raw.startsWith('#presentation-oncallcx:')) return '#presentation-oncallcx';
  return raw;
}

function isAuthOnlyRoute(route=''){
  return AUTH_ONLY_ROUTES.has(normalizeAuthRoute(route));
}

function moveAuthOnlyRouteToLoginBase(){
  if(!isAuthOnlyRoute(location.hash || '')) return false;
  if(location.hash !== '#overview') location.hash = '#overview';
  return true;
}

const DEFAULT_GROUPS = [
  {id:'group-admin', name:'Administrators', description:'Full system access.', permissions:['*'], modules:MODULE_ACCESS.map(m=>m.id)},
  {id:'group-video-viewer', name:'Video Viewers', description:'Only view Video Conference.', permissions:['video.view'], modules:['video-conference']},
  {id:'group-oncallcx-editor', name:'OnCallCX Editors', description:'Edit Contact Center / OnCallCX / UCaaS.', permissions:['contact.view','contact.edit','cms.view','articles.view','articles.update','products.view','products.update'], modules:['contact-center','cms-data']},
  {id:'group-cms-editor', name:'CMS Editors', description:'Manage CMS content without system administration.', permissions:['cms.view','cms.update','articles.view','articles.create','articles.update','products.view','products.create','products.update','assets.view','assets.create','assets.update','contact.view','integration.view','demo.view'], modules:['cms-data','contact-center','integration','demo-sales']}
];

const DISPLAY_NAME_OVERRIDES = {
  admin: 'Administrators',
  toannq: 'Quốc Toản'
};

const ROLE_DEFAULT_GROUP = {
  admin: 'group-admin',
  editor: 'group-cms-editor',
  viewer: 'group-video-viewer'
};

function userDisplayName(user) {
  if (!user) return 'Guest';
  const username = String(user.username || '').trim();
  if (username && DISPLAY_NAME_OVERRIDES[username]) return DISPLAY_NAME_OVERRIDES[username];
  return user.displayName || username || 'Guest';
}

function moduleRowsForPermissionUi(){
  const business = BUSINESS_MODULE_IDS
    .map(id => MODULE_ACCESS.find(module => module.id === id))
    .filter(Boolean);
  const system = MODULE_ACCESS.filter(module => !BUSINESS_MODULE_IDS.includes(module.id));
  return [...business, ...system];
}

function groupHasPermission(group, permission){
  const permissions = group?.permissions || [];
  return permissions.includes('*') || permissions.includes(permission);
}

function deriveRoleFromGroups(groupIds=[]){
  const groups = readGroups().filter(group => groupIds.includes(group.id));
  const permissions = groups.flatMap(group => group.permissions || []);
  if (permissions.includes('*')) return 'admin';
  if (permissions.some(permission => /\.(create|update|edit|delete|publish)$/.test(permission))) return 'editor';
  return 'viewer';
}

function effectiveRoleLabel(user){
  const role = user?.role || deriveRoleFromGroups(user?.groupIds || []);
  return ROLE_PERMISSIONS[role]?.label || role || 'Chưa chọn';
}

function renderRoleOptions(selectedRole=''){
  const placeholder = `<option value="" ${selectedRole ? '' : 'selected'} disabled>Chọn quyền hiệu lực</option>`;
  const options = Object.entries(ROLE_PERMISSIONS)
    .map(([key, value]) => `<option value="${esc(key)}" ${selectedRole === key ? 'selected' : ''}>${esc(value.label)}</option>`)
    .join('');
  return `${placeholder}${options}`;
}

function renderGroupOptions(groups=[], selectedGroup=''){
  const placeholder = `<option value="" ${selectedGroup ? '' : 'selected'} disabled>Chọn group</option>`;
  const options = groups
    .map(group => `<option value="${esc(group.id)}" ${selectedGroup === group.id ? 'selected' : ''}>${esc(group.name)}</option>`)
    .join('');
  return `${placeholder}${options}`;
}

function setGroupModuleAccess(group, moduleId, enabled){
  const module = MODULE_ACCESS.find(item => item.id === moduleId);
  if (!group || !module) return;
  const modules = new Set(group.modules || []);
  const permissions = new Set(group.permissions || []);
  const [viewPermission, editPermission] = module.permissions || [];

  if (enabled) {
    modules.add(moduleId);
    if (viewPermission) permissions.add(viewPermission);
  } else {
    modules.delete(moduleId);
    if (viewPermission) permissions.delete(viewPermission);
    if (editPermission) permissions.delete(editPermission);
  }

  group.modules = Array.from(modules);
  group.permissions = Array.from(permissions);
}

function setGroupModuleEdit(group, moduleId, enabled){
  const module = MODULE_ACCESS.find(item => item.id === moduleId);
  if (!group || !module) return;
  const [viewPermission, editPermission] = module.permissions || [];
  if (!editPermission) return;
  const modules = new Set(group.modules || []);
  const permissions = new Set(group.permissions || []);

  if (enabled) {
    modules.add(moduleId);
    if (viewPermission) permissions.add(viewPermission);
    permissions.add(editPermission);
  } else {
    permissions.delete(editPermission);
  }

  group.modules = Array.from(modules);
  group.permissions = Array.from(permissions);
}

function normalizeUserAccess(user){
  if(!user) return false;
  const before = JSON.stringify({role:user.role, groupIds:user.groupIds});
  const role = ROLE_PERMISSIONS[user.role] ? user.role : deriveRoleFromGroups(user.groupIds || []);
  user.role = role;
  user.groupIds = Array.from(new Set(user.groupIds || []));

  if(user.role === 'admin') {
    if(!user.groupIds.includes('group-admin')) user.groupIds.unshift('group-admin');
  } else {
    user.groupIds = user.groupIds.filter(groupId => groupId !== 'group-admin');
  }

  if(!user.groupIds.length && ROLE_DEFAULT_GROUP[user.role]) {
    user.groupIds = [ROLE_DEFAULT_GROUP[user.role]];
  }

  return before !== JSON.stringify({role:user.role, groupIds:user.groupIds});
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function passwordHash(username, password) {
  return sha256(`${username}::fti-auth::${password}`);
}

function now() { return new Date().toISOString(); }

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  syncUsersToCms(users).catch(()=>{});
}

function normalizeGroup(group){
  const validModuleIds = new Set(MODULE_ACCESS.map(module => module.id));
  const obsoletePermissions = new Set(['oncallcx.view','oncallcx.edit','oncallcx.ucaas.view','oncallcx.ucaas.edit']);
  const normalized = {...group};
  normalized.modules = Array.from(new Set(normalized.modules || [])).filter(moduleId => validModuleIds.has(moduleId));
  normalized.permissions = Array.from(new Set(normalized.permissions || [])).filter(permission => !obsoletePermissions.has(permission));

  const permissions = new Set(normalized.permissions);
  normalized.modules.forEach(moduleId => {
    const module = MODULE_ACCESS.find(item => item.id === moduleId);
    const viewPermission = module?.permissions?.[0];
    if(viewPermission && !permissions.has('*')) permissions.add(viewPermission);
  });
  normalized.permissions = Array.from(permissions);
  return normalized;
}

function seedGroups(groups=[]){
  const byId = new Map(groups.map(g => [g.id, normalizeGroup(g)]));
  DEFAULT_GROUPS.forEach(group => {
    if(!byId.has(group.id)) byId.set(group.id, {...group});
  });
  return Array.from(byId.values()).map(normalizeGroup);
}

function readGroups() {
  try { return seedGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]')); }
  catch { return seedGroups([]); }
}

function writeGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(seedGroups(groups)));
  syncAuthConfigToCms().catch(()=>{});
}

function readCustomPermissions() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PERMISSIONS_KEY) || '[]'); }
  catch { return []; }
}

function writeCustomPermissions(items) {
  localStorage.setItem(CUSTOM_PERMISSIONS_KEY, JSON.stringify(items));
  syncAuthConfigToCms().catch(()=>{});
}

function readAudit() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); }
  catch { return []; }
}

function writeAudit(items) {
  const compact = items.slice(-120).map(item => ({
    id: item.id,
    at: item.at,
    actor: item.actor,
    role: item.role,
    action: item.action,
    detail: item.detail ? JSON.stringify(item.detail).slice(0, 600) : ''
  }));
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(compact));
  } catch {
    const tiny = compact.slice(-40).map(({detail, ...item}) => item);
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify(tiny)); }
    catch { try { localStorage.removeItem(AUDIT_KEY); } catch {} }
  }
  syncAuditToCms(compact).catch(()=>{});
}

function addAudit(action, detail = {}) {
  const session = getSession();
  const items = readAudit();
  items.push({
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: now(),
    actor: session?.username || 'anonymous',
    role: session?.role || 'guest',
    action,
    detail
  });
  writeAudit(items);
}

async function syncUsersToCms(users) {
  const cms = await loadCms().catch(()=>({}));
  cms.auth = cms.auth || {};
  cms.auth.version = AUTH_VERSION;
  cms.auth.roles = ROLE_PERMISSIONS;
  cms.auth.groups = readGroups();
  cms.auth.customPermissions = readCustomPermissions();
  cms.auth.moduleAccess = MODULE_ACCESS;
  cms.auth.users = users.map(({passwordHash, ...safe}) => safe);
  cms.auth.updatedAt = now();
  await saveCms(cms);
}

async function syncAuthConfigToCms() {
  const cms = await loadCms().catch(()=>({}));
  cms.auth = cms.auth || {};
  cms.auth.version = AUTH_VERSION;
  cms.auth.roles = ROLE_PERMISSIONS;
  cms.auth.groups = readGroups();
  cms.auth.customPermissions = readCustomPermissions();
  cms.auth.moduleAccess = MODULE_ACCESS;
  cms.auth.users = readUsers().map(({passwordHash, ...safe}) => safe);
  cms.auth.updatedAt = now();
  await saveCms(cms);
}

async function syncAuditToCms(audit) {
  const cms = await loadCms().catch(()=>({}));
  cms.auth = cms.auth || {};
  cms.auth.auditLogs = audit;
  cms.auth.updatedAt = now();
  await saveCms(cms);
}

async function ensureDefaultUsers() {
  const users = readUsers();
  if (!users.some(u => u.username === 'admin')) {
    users.push({
      id: 'user-admin',
      username: 'admin',
      displayName: 'Administrators',
      email: 'admin@local',
      role: 'admin',
      groupIds: ['group-admin'],
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
      passwordHash: await passwordHash('admin', DEFAULT_PASSWORD)
    });
    writeUsers(users);
    addAudit('system.seed_admin', {username:'admin'});
  }
  let migrated = false;
  users.forEach(user => {
    if(!Array.isArray(user.groupIds)){
      if(user.role === 'admin') user.groupIds = ['group-admin'];
      else if(user.role === 'editor') user.groupIds = ['group-cms-editor'];
      else user.groupIds = ['group-video-viewer'];
      migrated = true;
    }
    if(!user.role || !ROLE_PERMISSIONS[user.role]){
      user.role = deriveRoleFromGroups(user.groupIds || []);
      migrated = true;
    }
    if(normalizeUserAccess(user)) migrated = true;
  });
  if(migrated) writeUsers(users);
  writeGroups(readGroups());
  return readUsers();
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

function setSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  updateAuthUi();
}

function currentUser() {
  const session = getSession();
  if (!session) return null;
  const user = readUsers().find(u => u.username === session.username && u.status === 'active');
  if(!user) return null;
  const groups = readGroups().filter(group => (user.groupIds || []).includes(group.id));
  return {...user, groups, session};
}

function hasPermission(permission) {
  const user = currentUser();
  if (!user) return false;
  const groupPermissions = (user.groups || []).flatMap(group => group.permissions || []);
  const role = ROLE_PERMISSIONS[user.role];
  const rolePermissions = role?.permissions || [];
  const permissions = new Set([...rolePermissions, ...groupPermissions]);
  return permissions.has('*') || permissions.has(permission);
}

function requirePermission(permission) {
  if (hasPermission(permission)) return true;
  showToast(`Bạn không có quyền: ${permission}`, 'warning');
  return false;
}

function showToast(message, type='info') {
  const root = document.querySelector('#toastRoot');
  if (!root) {
    console.log(`[${type}] ${message}`);
    return;
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(()=>el.remove(), 3200);
}

function showLogin() {
  moveAuthOnlyRouteToLoginBase();
  const overlay = document.querySelector('#loginOverlay');
  if (overlay) overlay.hidden = false;
}

function hideLogin() {
  const overlay = document.querySelector('#loginOverlay');
  if (overlay) overlay.hidden = true;
}

async function login(username, password) {
  await ensureDefaultUsers();
  username = String(username || '').trim();
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    addAudit('auth.login_failed', {username, reason:'not_found'});
    throw new Error('User không tồn tại');
  }
  if (user.status !== 'active') {
    addAudit('auth.login_failed', {username, reason:'locked'});
    throw new Error('User đang bị khóa');
  }
  const hash = await passwordHash(username, password);
  if (hash !== user.passwordHash) {
    addAudit('auth.login_failed', {username, reason:'wrong_password'});
    throw new Error('Sai mật khẩu');
  }
  const session = {
    username: user.username,
    displayName: userDisplayName(user),
    role: user.role,
    groupIds: user.groupIds || [],
    loginAt: now(),
    expiresAt: new Date(Date.now() + 8*60*60*1000).toISOString()
  };
  setSession(session);
  addAudit('auth.login_success', {username, role:user.role, groupIds:user.groupIds || []});
  hideLogin();
  showToast(`Đã đăng nhập: ${userDisplayName(user)}`, 'success');
}

function logout() {
  const s = getSession();
  addAudit('auth.logout', {username:s?.username});
  setSession(null);
  moveAuthOnlyRouteToLoginBase();
  showLogin();
}

function isSessionValid() {
  const s = getSession();
  if (!s) return false;
  if (new Date(s.expiresAt).getTime() < Date.now()) {
    addAudit('auth.session_expired', {username:s.username});
    setSession(null);
    return false;
  }
  return true;
}

function markAppReady() {
  document.body.classList.add('auth-ui-ready', 'app-ready');
  document.body.classList.remove('app-booting');
}

function ensureHeaderLogoutButton() {
  const logoutBtn = document.querySelector('#logoutBtn');
  const actions = document.querySelector('.topbar-actions');
  if (!logoutBtn || !actions) return logoutBtn;
  logoutBtn.classList.add('topbar-logout');
  logoutBtn.setAttribute('title', 'Đăng xuất');
  logoutBtn.setAttribute('aria-label', 'Đăng xuất');
  logoutBtn.type = 'button';
  if (logoutBtn.parentElement !== actions) actions.appendChild(logoutBtn);
  return logoutBtn;
}

function updateAuthUi() {
  const user = currentUser();
  const logoutBtn = ensureHeaderLogoutButton();
  const chip = document.querySelector('#permissionChip');
  document.body.classList.toggle('auth-logged-in', !!user);
  document.body.classList.toggle('auth-logged-out', !user);
  if (chip) {
    chip.classList.toggle('login-on', !!user);
    chip.classList.toggle('login-off', !user);
    chip.textContent = user ? userDisplayName(user) : 'Login';
  }
  if (logoutBtn) logoutBtn.hidden = !user;
  markAppReady();
  const footerName = document.querySelector('.user-pill strong');
  const footerRole = document.querySelector('.user-pill span');
  if (footerName) footerName.textContent = user ? userDisplayName(user) : 'Guest';
  if (footerRole) {
    footerRole.textContent = '';
    footerRole.hidden = true;
  }

  document.querySelectorAll('[data-permission]').forEach(el => {
    const perm = el.getAttribute('data-permission');
    el.classList.toggle('auth-denied', !hasPermission(perm));
  });
  applyModuleVisibility();
}

function bindLoginForm() {
  const form = document.querySelector('#loginForm');
  if (!form || form.dataset.authBound) return;
  form.dataset.authBound = '1';
  form.onsubmit = null;
  form.addEventListener('submit', async evt => {
    evt.preventDefault();
    const username = document.querySelector('#loginEmail')?.value || '';
    const password = document.querySelector('#loginPassword')?.value || '';
    try { await login(username, password); }
    catch (err) { showToast(err.message || 'Đăng nhập thất bại', 'error'); }
  });

  const logoutBtn = ensureHeaderLogoutButton();
  if (logoutBtn) logoutBtn.onclick = null;
  logoutBtn?.addEventListener('click', evt => {
    evt.preventDefault();
    logout();
  });
}

function fixSidebarNavigation() {
  return;
  // Fix: sidebar links, especially VIDEO CONFERENCE, render with one click.
  const sidebar = document.querySelector('#sidebar');
  if (!sidebar || sidebar.dataset.singleClickFixed) return;
  sidebar.dataset.singleClickFixed = '1';

  sidebar.addEventListener('click', evt => {
    const groupHead = evt.target.closest('[data-toggle-group]');
    if (groupHead) {
      evt.preventDefault();
      const group = groupHead.closest('.nav-group');
      group?.classList.toggle('expanded');
      return;
    }

    const link = evt.target.closest('a.nav-item[href^="#"]');
    if (!link) return;

    const permission = link.getAttribute('data-permission');
    if (permission && !requirePermission(permission)) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    const href = link.getAttribute('href');
    if (!href) return;

    evt.preventDefault();
    evt.stopPropagation();

    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    link.classList.add('active');

    if (location.hash === href) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      location.hash = href;
    }
  }, true);
}

function setActiveNav() {
  const hash = location.hash || '#overview';
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === hash);
  });
  const active = document.querySelector(`.nav-item[href="${CSS.escape(hash)}"]`);
  active?.closest('.nav-group')?.classList.add('expanded');
}

function renderGuardedPage(message) {
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  root.innerHTML = `<section class="auth-page-hero"><span class="eyebrow">🔐 Access Control</span><h2>Không có quyền truy cập</h2><p>${esc(message)}</p><a class="btn btn-soft" href="#overview">Quay lại Tổng quan</a></section>`;
}

function moduleForRoute(route=''){
  const normalized = normalizeAuthRoute(route);
  return MODULE_ACCESS.find(module => module.routes.includes(normalized)) || null;
}

function hasWildcardPermission(user=currentUser()){
  if(!user) return false;
  const groupPermissions = (user.groups || []).flatMap(group => group.permissions || []);
  const rolePermissions = ROLE_PERMISSIONS[user.role]?.permissions || [];
  return rolePermissions.includes('*') || groupPermissions.includes('*');
}

function canAccessRoute(route=''){
  const user = currentUser();
  if(!user) return true;
  if(hasWildcardPermission(user)) return true;
  const normalized = normalizeAuthRoute(route);
  const module = moduleForRoute(normalized);
  if(!module) return true;
  const hasModule = (user.groups || []).some(group => (group.modules || []).includes(module.id));
  const required = ROUTE_PERMISSIONS[normalized] || module.permissions?.[0];
  return hasModule && (!required || hasPermission(required));
}

function moveCmsDataIntoSystemSecurity(){
  const cmsLink = document.querySelector('a.nav-item[href="#cms"]');
  const systemGroup = Array.from(document.querySelectorAll('.nav-group')).find(g => (g.textContent || '').toUpperCase().includes('SYSTEM & SECURITY'));
  const body = systemGroup?.querySelector('.nav-group-body');
  if(cmsLink && body && cmsLink.parentElement !== body) body.insertBefore(cmsLink, body.firstChild);
}

function applyModuleVisibility(){
  moveCmsDataIntoSystemSecurity();
  const user = currentUser();
  const loggedIn = !!user;
  const wildcard = hasWildcardPermission(user);

  document.querySelectorAll('a.nav-item[href^="#"]').forEach(link => {
    const href = link.getAttribute('href') || '';
    const normalizedHref = normalizeAuthRoute(href);
    const permission = link.getAttribute('data-permission');
    let visible = true;
    if(loggedIn && !wildcard){
      if(ROUTE_PERMISSIONS[normalizedHref]) visible = canAccessRoute(href);
      if(permission && !hasPermission(permission)) visible = false;
    }
    if(!loggedIn && permission) visible = false;
    link.hidden = !visible;
  });

  document.querySelectorAll('.nav-group').forEach(group => {
    const body = group.querySelector('.nav-group-body');
    if(!body) return;
    const hasVisibleChild = Array.from(body.querySelectorAll('a.nav-item')).some(a => !a.hidden);
    group.hidden = !hasVisibleChild;
  });
}

function guardProtectedRoutes() {
  const h = location.hash || '#overview';
  const normalized = normalizeAuthRoute(h);
  const map = {
    '#users': 'users.view',
    '#permissions': 'roles.view',
    '#audit-log': 'audit.view',
    '#enterprise-cms': 'cms.view',
    '#cms': 'cms.view',
    '#cms-audit': 'audit.view'
  };
  const perm = map[h];
  const routePerm = ROUTE_PERMISSIONS[normalized];
  if (routePerm && currentUser() && !canAccessRoute(h)) {
    renderGuardedPage(`Route ${esc(h)} chua duoc bat trong group/module cua user hien tai.`);
    return false;
  }
  if (perm && !hasPermission(perm)) {
    renderGuardedPage(`Route ${esc(h)} yêu cầu quyền ${esc(perm)}.`);
    return false;
  }
  return true;
}

function renderUsersPage() { return renderUsersPageV2(); }

function renderPermissionsPage() { return renderPermissionsPageV2(); }

function renderAuditPage() {
  if (location.hash !== '#audit-log') return;
  if (!requirePermission('audit.view')) return renderGuardedPage('Bạn cần quyền audit.view.');
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  const logs = readAudit().slice().reverse();
  document.querySelector('#pageTitle').textContent = 'Audit Log';
  document.querySelector('#pageSubtitle').textContent = 'Authentication and CMS activity logs';
  root.innerHTML = `<section class="auth-page-hero">
    <span class="eyebrow">📜 Audit</span>
    <h2>Audit Log</h2>
    <p>Ghi nhận login/logout, tạo user, khóa user, reset password và các thao tác hệ thống liên quan authentication.</p>
  </section>
  <section class="auth-card">
    <table class="auth-table"><thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Detail</th></tr></thead><tbody>
      ${logs.map(l => `<tr><td>${esc(l.at)}</td><td>${esc(l.actor)}</td><td>${esc(l.role)}</td><td>${esc(l.action)}</td><td><code>${esc(JSON.stringify(l.detail || {}))}</code></td></tr>`).join('')}
    </tbody></table>
  </section>`;
}

function allPermissionRows(){
  const custom = readCustomPermissions().map(p => ['Custom', p.id]);
  const moduleRows = MODULE_PERMISSIONS.flatMap(row => row.slice(1).map(perm => [row[0], perm]));
  const accessRows = MODULE_ACCESS.flatMap(module => module.permissions.map(perm => [module.label, perm]));
  const seen = new Set();
  return [...moduleRows, ...accessRows, ...custom].filter(([,perm]) => {
    if(seen.has(perm)) return false;
    seen.add(perm);
    return true;
  });
}

function renderUsersPageV2() {
  if (location.hash !== '#users') return;
  if (!requirePermission('users.view')) return renderGuardedPage('Bạn cần quyền users.view.');
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  const users = readUsers();
  const groups = readGroups();
  const canWrite = hasPermission('users.create') || hasPermission('users.update');
  document.querySelector('#pageTitle').textContent = 'Quản lý User';
  document.querySelector('#pageSubtitle').textContent = 'User · Group assignment';

  root.innerHTML = `<section class="auth-page-hero">
    <span class="eyebrow">User Management</span>
    <h2>Quản lý User theo Group</h2>
    <p>Tạo user, chọn quyền hiệu lực và gán vào group. Quyền hiệu lực quyết định cấp Admin/Editor/Viewer; group quyết định phạm vi module được thấy và thao tác.</p>
    ${canWrite ? `<form id="createUserFormV2" class="auth-form">
      <input name="username" placeholder="username" required>
      <input name="displayName" placeholder="Tên hiển thị" required>
      <input name="password" placeholder="Mật khẩu" type="password" required>
      <select name="role" required>${renderRoleOptions('')}</select>
      <select name="groupId" required>${renderGroupOptions(groups, '')}</select>
      <button class="btn btn-primary">+ Tạo user</button>
    </form>` : `<p><b>Read-only:</b> bạn không có quyền tạo/sửa user.</p>`}
  </section>
  <section class="auth-card">
    <h3>Danh sách User</h3>
    <table class="auth-table"><thead><tr><th>User</th><th>Quyền hiệu lực</th><th>Group</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${users.map(u => `<tr>
        <td><b>${esc(u.displayName || u.username)}</b><br><small>${esc(u.username)}</small></td>
        <td>${canWrite && u.username !== 'admin'
          ? `<select data-user-role="${esc(u.username)}">${renderRoleOptions(u.role || '')}</select>`
          : `<span class="auth-badge">${esc(effectiveRoleLabel(u))}</span>`}</td>
        <td>${groups.map(g=>`<label class="auth-inline-check"><input type="checkbox" data-user-group="${esc(u.username)}|${esc(g.id)}" ${((u.groupIds||[]).includes(g.id))?'checked':''} ${canWrite?'':'disabled'}> ${esc(g.name)}</label>`).join('')}</td>
        <td><span class="auth-badge ${u.status !== 'active' ? 'locked' : ''}">${esc(u.status)}</span></td>
        <td>${u.username === 'admin' ? 'Default admin' : `<button class="btn btn-soft" data-toggle-user="${esc(u.username)}">${u.status === 'active' ? 'Lock' : 'Unlock'}</button> <button class="btn btn-soft" data-reset-user="${esc(u.username)}">Reset Pass</button>`}</td>
      </tr>`).join('')}
    </tbody></table>
  </section>`;

  document.querySelector('#createUserFormV2')?.addEventListener('submit', async evt => {
    evt.preventDefault();
    if (!requirePermission('users.create')) return;
    const fd = new FormData(evt.currentTarget);
    const username = String(fd.get('username') || '').trim();
    const role = String(fd.get('role') || '').trim();
    const groupId = String(fd.get('groupId') || '').trim();
    const users = readUsers();
    if (!role || !ROLE_PERMISSIONS[role]) return showToast('Vui lòng chọn quyền hiệu lực.', 'warning');
    if (!groupId || !groups.some(group => group.id === groupId)) return showToast('Vui lòng chọn group.', 'warning');
    if (users.some(u => u.username === username)) return showToast('Username đã tồn tại', 'warning');
    const nextUser = {
      id: `user-${Date.now()}`,
      username,
      displayName: String(fd.get('displayName') || '').trim(),
      role,
      groupIds: [groupId],
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
      passwordHash: await passwordHash(username, String(fd.get('password') || ''))
    };
    normalizeUserAccess(nextUser);
    users.push(nextUser);
    writeUsers(users);
    addAudit('users.create', {username});
    showToast('Đã tạo user', 'success');
    renderUsersPageV2();
  });

  root.querySelectorAll('[data-user-group]').forEach(input => input.addEventListener('change', () => {
    if (!requirePermission('users.update')) return;
    const [username, groupId] = String(input.getAttribute('data-user-group') || '').split('|');
    const users = readUsers();
    const user = users.find(x => x.username === username);
    if(!user) return;
    const set = new Set(user.groupIds || []);
    if(input.checked) set.add(groupId); else set.delete(groupId);
    user.groupIds = Array.from(set);
    if(groupId === 'group-admin' && input.checked) user.role = 'admin';
    if(groupId === 'group-admin' && !input.checked && user.role === 'admin' && user.username !== 'admin') user.role = 'editor';
    normalizeUserAccess(user);
    user.updatedAt = now();
    writeUsers(users);
    addAudit('users.update_groups', {username, groupIds:user.groupIds});
    updateAuthUi();
    showToast('Đã cập nhật group cho user.', 'success');
    renderUsersPageV2();
  }));

  root.querySelectorAll('[data-user-role]').forEach(select => select.addEventListener('change', () => {
    if (!requirePermission('users.update')) return;
    const username = select.getAttribute('data-user-role');
    const role = String(select.value || '').trim();
    if (!role || !ROLE_PERMISSIONS[role]) return showToast('Quyền hiệu lực không hợp lệ.', 'warning');
    const users = readUsers();
    const user = users.find(x => x.username === username);
    if(!user || user.username === 'admin') return;
    user.role = role;
    normalizeUserAccess(user);
    user.updatedAt = now();
    writeUsers(users);
    addAudit('users.update_role', {username, role});
    updateAuthUi();
    showToast('Đã cập nhật quyền hiệu lực user.', 'success');
    renderUsersPageV2();
  }));

  root.querySelectorAll('[data-toggle-user]').forEach(btn => btn.addEventListener('click', () => {
    if (!requirePermission('users.update')) return;
    const username = btn.getAttribute('data-toggle-user');
    const users = readUsers();
    const u = users.find(x => x.username === username);
    if(!u) return;
    u.status = u.status === 'active' ? 'locked' : 'active';
    u.updatedAt = now();
    writeUsers(users);
    addAudit('users.toggle_status', {username, status:u.status});
    renderUsersPageV2();
  }));

  root.querySelectorAll('[data-reset-user]').forEach(btn => btn.addEventListener('click', async () => {
    if (!requirePermission('users.update')) return;
    const username = btn.getAttribute('data-reset-user');
    const newPass = prompt(`Nhập mật khẩu mới cho ${username}`);
    if(!newPass) return;
    const users = readUsers();
    const u = users.find(x => x.username === username);
    if(!u) return;
    u.passwordHash = await passwordHash(username, newPass);
    u.updatedAt = now();
    writeUsers(users);
    addAudit('users.reset_password', {username});
    showToast('Đã reset password', 'success');
  }));
}

function renderModuleAccessCell(group, module, canUpdate){
  const [viewPermission, editPermission] = module.permissions || [];
  const modules = group.modules || [];
  const viewChecked = modules.includes(module.id) && groupHasPermission(group, viewPermission);
  const editChecked = editPermission ? groupHasPermission(group, editPermission) : false;
  const disabled = canUpdate ? '' : 'disabled';
  return `<td>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <label class="auth-inline-check"><input type="checkbox" data-group-module="${esc(group.id)}|${esc(module.id)}" ${viewChecked ? 'checked' : ''} ${disabled}> Xem</label>
      ${editPermission ? `<label class="auth-inline-check"><input type="checkbox" data-group-module-edit="${esc(group.id)}|${esc(module.id)}" ${editChecked ? 'checked' : ''} ${disabled}> Sửa</label>` : ''}
    </div>
  </td>`;
}

function renderPermissionsPageV2() {
  if (location.hash !== '#permissions') return;
  if (!requirePermission('roles.view')) return renderGuardedPage('Bạn cần quyền roles.view.');
  const root = document.querySelector('#pageRoot');
  if (!root) return;
  const groups = readGroups();
  const permissions = allPermissionRows();
  const canUpdate = hasPermission('roles.update');
  document.querySelector('#pageTitle').textContent = 'Phân quyền';
  document.querySelector('#pageSubtitle').textContent = 'Group · Module · Custom permissions';

  root.innerHTML = `<section class="auth-page-hero">
    <span class="eyebrow">Group Permission</span>
    <h2>Phân quyền theo Group và Module</h2>
    <p>Tạo group, gán quyền theo từng module và tự thêm permission tùy biến. User nhận quyền từ group được gán.</p>
    ${canUpdate ? `<form id="createGroupForm" class="auth-form">
      <input name="name" placeholder="Tên group mới" required>
      <input name="description" placeholder="Mô tả group">
      <button class="btn btn-primary">+ Tạo group</button>
    </form>
    <form id="createPermissionForm" class="auth-form">
      <input name="id" placeholder="permission.custom.name" required>
      <input name="label" placeholder="Mô tả quyền">
      <button class="btn btn-soft">+ Tạo quyền tùy biến</button>
    </form>` : ''}
  </section>
  <section class="auth-grid">
    ${groups.map(g => `<article class="auth-card"><h3>${esc(g.name)}</h3><p>${esc(g.description || '')}</p><p><span class="auth-badge">${esc(g.id)}</span></p></article>`).join('')}
  </section>
  <section class="auth-card" style="margin-top:18px">
    <h3>Quyền theo module</h3>
    <p class="muted">Điều chỉnh nhanh quyền xem/sửa cho các module chính: Contact Center, Video Conference, Integration, Demo & Sales. Các module hệ thống vẫn nằm bên dưới để quản trị CMS và bảo mật.</p>
    <table class="auth-table"><thead><tr><th>Module</th>${groups.map(g=>`<th>${esc(g.name)}</th>`).join('')}</tr></thead><tbody>
      ${moduleRowsForPermissionUi().map(module => `<tr><td><b>${esc(module.label)}</b><br><small>${esc(module.section || '')}</small></td>${groups.map(g=>renderModuleAccessCell(g,module,canUpdate)).join('')}</tr>`).join('')}
    </tbody></table>
  </section>
  <section class="auth-card" style="margin-top:18px">
    <h3>Permission Matrix</h3>
    <table class="auth-table"><thead><tr><th>Permission</th>${groups.map(g=>`<th>${esc(g.name)}</th>`).join('')}</tr></thead><tbody>
      ${permissions.map(([module,perm]) => `<tr><td><b>${esc(module)}</b> · ${esc(perm)}</td>${groups.map(g=>`<td><label class="auth-inline-check"><input type="checkbox" data-group-permission="${esc(g.id)}|${esc(perm)}" ${((g.permissions||[]).includes('*')||(g.permissions||[]).includes(perm))?'checked':''} ${canUpdate?'':'disabled'}> Cho phép</label></td>`).join('')}</tr>`).join('')}
    </tbody></table>
  </section>`;

  document.querySelector('#createGroupForm')?.addEventListener('submit', evt => {
    evt.preventDefault();
    if(!requirePermission('roles.update')) return;
    const fd = new FormData(evt.currentTarget);
    const name = String(fd.get('name') || '').trim();
    if(!name) return;
    const id = `group-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || Date.now()}`;
    const groups = readGroups();
    if(groups.some(g => g.id === id)) return showToast('Group đã tồn tại.', 'warning');
    groups.push({id, name, description:String(fd.get('description') || '').trim(), permissions:[], modules:[]});
    writeGroups(groups);
    addAudit('roles.create_group', {id});
    renderPermissionsPageV2();
  });

  document.querySelector('#createPermissionForm')?.addEventListener('submit', evt => {
    evt.preventDefault();
    if(!requirePermission('roles.update')) return;
    const fd = new FormData(evt.currentTarget);
    const id = String(fd.get('id') || '').trim();
    if(!id) return;
    const custom = readCustomPermissions();
    if(custom.some(p => p.id === id)) return showToast('Permission đã tồn tại.', 'warning');
    custom.push({id, label:String(fd.get('label') || '').trim(), createdAt:now()});
    writeCustomPermissions(custom);
    addAudit('roles.create_permission', {id});
    renderPermissionsPageV2();
  });

  root.querySelectorAll('[data-group-module]').forEach(input => input.addEventListener('change', () => {
    if(!requirePermission('roles.update')) return;
    const [groupId, moduleId] = String(input.getAttribute('data-group-module') || '').split('|');
    const groups = readGroups();
    const group = groups.find(g => g.id === groupId);
    if(!group) return;
    setGroupModuleAccess(group, moduleId, input.checked);
    writeGroups(groups);
    addAudit('roles.update_group_module', {groupId, moduleId, enabled:input.checked});
    updateAuthUi();
    applyModuleVisibility();
    renderPermissionsPageV2();
  }));

  root.querySelectorAll('[data-group-module-edit]').forEach(input => input.addEventListener('change', () => {
    if(!requirePermission('roles.update')) return;
    const [groupId, moduleId] = String(input.getAttribute('data-group-module-edit') || '').split('|');
    const groups = readGroups();
    const group = groups.find(g => g.id === groupId);
    if(!group) return;
    setGroupModuleEdit(group, moduleId, input.checked);
    writeGroups(groups);
    addAudit('roles.update_group_module_edit', {groupId, moduleId, enabled:input.checked});
    updateAuthUi();
    applyModuleVisibility();
    renderPermissionsPageV2();
  }));

  root.querySelectorAll('[data-group-permission]').forEach(input => input.addEventListener('change', () => {
    if(!requirePermission('roles.update')) return;
    const [groupId, permission] = String(input.getAttribute('data-group-permission') || '').split('|');
    const groups = readGroups();
    const group = groups.find(g => g.id === groupId);
    if(!group) return;
    const set = new Set(group.permissions || []);
    if(input.checked) set.add(permission); else set.delete(permission);
    group.permissions = Array.from(set);
    writeGroups(groups);
    addAudit('roles.update_group_permission', {groupId, permission, enabled:input.checked});
    updateAuthUi();
    applyModuleVisibility();
  }));
}

function renderAuthRoutes() {
  if (!guardProtectedRoutes()) return;
  renderUsersPageV2();
  renderPermissionsPageV2();
  renderAuditPage();
  setActiveNav();
  updateAuthUi();
}

async function initAuth() {
  await ensureDefaultUsers();
  bindLoginForm();
  fixSidebarNavigation();

  if (!isSessionValid()) showLogin();
  else hideLogin();

  updateAuthUi();
  renderAuthRoutes();
}

window.addEventListener('DOMContentLoaded', () => setTimeout(initAuth, 150));
window.addEventListener('hashchange', () => setTimeout(renderAuthRoutes, 70));

window.FTIAuth = {
  login, logout, currentUser, hasPermission, readUsers, writeUsers, readAudit,
  runSeed: ensureDefaultUsers,
  roles: ROLE_PERMISSIONS
};


/* v10.8.1 Public Portal behavior override
   - Public users can browse customer-facing content without login.
   - Login is only required for CMS/edit/admin actions.
   - Sidebar expand/collapse and hamburger are fixed here without blocking default routers.
*/
(function(){
  const PUBLIC_ROUTES = new Set([
    '#overview','#oncallcx','#ccaas-vn','#ccaas-global','#api-reference','#ucpbx-vn',
    '#video-conferencing','#vc-yealink','#vc-logitech','#vc-poly','#vc-cisco','#vc-jabra','#vc-crestron',
    '#vc-huddle-room','#vc-medium-large-room','#integration','#crm','#compliance',
    '#demo','#compare','#resources'
  ]);
  const PROTECTED_ROUTES = {
    '#editor':'cms.view',
    '#vendor-editor':'cms.view',
    '#cms':'cms.view',
    '#enterprise-cms':'cms.view',
    '#cms-audit':'audit.view',
    '#users':'users.view',
    '#permissions':'roles.view',
    '#audit-log':'audit.view'
  };

  function session(){
    try{return JSON.parse(localStorage.getItem('fti_auth_session')||'null')}catch{return null}
  }
  function isLogged(){return !!session();}
  function hideLoginOverlay(){
    const overlay=document.querySelector('#loginOverlay');
    if(overlay) overlay.hidden=true;
  }
  function showLoginOverlay(){
    moveAuthOnlyRouteToLoginBase();
    const overlay=document.querySelector('#loginOverlay');
    if(overlay) overlay.hidden=false;
  }
  function setPublicUi(){
    const loggedIn = isLogged();
    document.body.classList.toggle('cms-locked', !loggedIn);
    document.body.classList.toggle('auth-logged-in', loggedIn);
    document.body.classList.toggle('auth-logged-out', !loggedIn);
    const chip=document.querySelector('#permissionChip');
    const logoutBtn=ensureHeaderLogoutButton();
    if(chip){
      if(loggedIn){
        const user=currentUser() || session();
        chip.textContent=userDisplayName(user);
        chip.classList.add('login-on');
        chip.classList.remove('login-guest','login-off');
      }else{
        chip.textContent='Login';
        chip.classList.add('login-guest');
        chip.classList.remove('login-on','login-off');
      }
      if(logoutBtn) logoutBtn.hidden=!loggedIn;
      if(!chip.dataset.publicLoginBound){
        chip.dataset.publicLoginBound='1';
        chip.addEventListener('click', e=>{
          e.preventDefault();
          if(isLogged()){
            if(confirm('Bạn muốn đăng xuất?')){
              localStorage.removeItem('fti_auth_session');
              moveAuthOnlyRouteToLoginBase();
              setPublicUi();
              showLoginOverlay();
            }
          }else showLoginOverlay();
        });
      }
    }
    markAppReady();

    const footerName=document.querySelector('.user-pill strong');
    const footerRole=document.querySelector('.user-pill span');
    if(loggedIn){
      const user=currentUser() || session();
      if(footerName) footerName.textContent=userDisplayName(user);
    }else{
      if(footerName) footerName.textContent='Public Visitor';
    }
    if(footerRole){
      footerRole.textContent='';
      footerRole.hidden=true;
    }
    applyModuleVisibility();
  }

  function openProtectedNotice(permission){
    const root=document.querySelector('#pageRoot');
    const title=document.querySelector('#pageTitle');
    const subtitle=document.querySelector('#pageSubtitle');
    if(title) title.textContent='Yêu cầu đăng nhập';
    if(subtitle) subtitle.textContent='CMS editing area';
    if(root){
      root.innerHTML=`<section class="auth-page-hero">
        <span class="eyebrow">🔐 Login Required</span>
        <h2>Khu vực chỉnh sửa cần đăng nhập</h2>
        <p>Website cho phép khách hàng xem nội dung công khai. Các chức năng CMS/chỉnh sửa cần đăng nhập với quyền phù hợp: <b>${permission}</b>.</p>
        <button class="btn btn-primary" id="openLoginFromProtected">Login để chỉnh sửa</button>
        <a class="btn btn-soft" href="#overview">Quay lại Tổng quan</a>
      </section>`;
      document.querySelector('#openLoginFromProtected')?.addEventListener('click', showLoginOverlay);
    }
  }

  function routeGuard(){
    const hash=location.hash||'#overview';
    const required=PROTECTED_ROUTES[hash];
    if(required && !isLogged()){
      openProtectedNotice(required);
      return false;
    }
    const routePermission=ROUTE_PERMISSIONS[normalizeAuthRoute(hash)];
    if(routePermission && isLogged() && !canAccessRoute(hash)){
      openProtectedNotice(routePermission);
      return false;
    }
    return true;
  }

  function fixSidebar(){
    const shell=document.querySelector('.app-shell');
    const sidebar=document.querySelector('#sidebar');
    if(!sidebar || sidebar.dataset.v1081Fixed) return;
    sidebar.dataset.v1081Fixed='1';

    // Group expand/collapse
    sidebar.querySelectorAll('[data-toggle-group]').forEach(btn=>{
      btn.onclick = null;
      btn.addEventListener('click', e=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        btn.closest('.nav-group')?.classList.toggle('expanded');
      }, true);
    });

    // One-click navigation, protected only for CMS/admin/edit.
    sidebar.querySelectorAll('a.nav-item[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        const href=a.getAttribute('href');
        const protectedPermission=a.getAttribute('data-permission') || PROTECTED_ROUTES[href];
        if(protectedPermission && !isLogged()){
          e.preventDefault();
          e.stopPropagation();
          location.hash=href;
          setTimeout(()=>openProtectedNotice(protectedPermission),30);
          return;
        }
        const routePermission = ROUTE_PERMISSIONS[normalizeAuthRoute(href)];
        if(routePermission && isLogged() && !canAccessRoute(href)){
          e.preventDefault();
          e.stopPropagation();
          openProtectedNotice(routePermission);
          return;
        }
        document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        a.closest('.nav-group')?.classList.add('expanded');
        if(PROTECTED_ROUTES[href] || routePermission){
          e.preventDefault();
          e.stopPropagation();
          if(location.hash===href) window.dispatchEvent(new HashChangeEvent('hashchange'));
          else location.hash=href;
          return;
        }
        // Let hash router run once; if hash unchanged, force event.
        if(location.hash===href){
          e.preventDefault();
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }, true);
    });

    // Desktop: collapse/expand sidebar. Mobile: open/close drawer only.
    const sidebarToggle=document.querySelector('#sidebarToggle');
    if(sidebarToggle && !sidebarToggle.dataset.v1081Bound){
      sidebarToggle.dataset.v1081Bound='1';
      sidebarToggle.addEventListener('click', e=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        shell?.classList.toggle('sidebar-collapsed');
        document.body.classList.toggle('sidebar-collapsed');
      }, true);
    }

    const mobileMenu=document.querySelector('#mobileMenu');
    if(mobileMenu && !mobileMenu.dataset.v1081Bound){
      mobileMenu.dataset.v1081Bound='1';
      mobileMenu.addEventListener('click', e=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        shell?.classList.remove('sidebar-collapsed');
        document.body.classList.remove('sidebar-collapsed');
        sidebar.classList.toggle('open');
      }, true);
    }
  }

  function markActive(){
    const hash=location.hash||'#overview';
    document.querySelectorAll('.nav-item').forEach(a=>{
      const active=a.getAttribute('href')===hash;
      a.classList.toggle('active', active);
      if(active) a.closest('.nav-group')?.classList.add('expanded');
    });
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(()=>{
      hideLoginOverlay();
      setPublicUi();
      fixSidebar();
      markActive();
    },260);
  });
  window.addEventListener('hashchange', ()=>{
    setTimeout(()=>{
      setPublicUi();
      routeGuard();
      markActive();
    },90);
  });

  // Keep public mode after original v10.8 init tries to show login.
  setTimeout(()=>{hideLoginOverlay();setPublicUi();fixSidebar();},600);
  setTimeout(()=>{hideLoginOverlay();setPublicUi();fixSidebar();},1400);
})();



/* v10.8.2 System & Security visibility + expand fix */
(function(){
  function isLoggedIn(){
    try{return !!JSON.parse(localStorage.getItem('fti_auth_session')||'null')}catch{return false}
  }

  function syncSystemSecurityVisibility(){
    const group = Array.from(document.querySelectorAll('.nav-group')).find(g => {
      const text = (g.textContent || '').toUpperCase();
      return text.includes('SYSTEM & SECURITY');
    });
    if(!group) return;

    group.classList.add('auth-system-group');

    if(!isLoggedIn()){
      group.style.display = 'none';
      document.body.classList.add('cms-locked');
      applyModuleVisibility();
      return;
    }

    group.style.display = '';
    document.body.classList.remove('cms-locked');
    applyModuleVisibility();
  }

  function fixSystemSecurityExpand(){
    const group = Array.from(document.querySelectorAll('.nav-group')).find(g => {
      const text = (g.textContent || '').toUpperCase();
      return text.includes('SYSTEM & SECURITY');
    });
    if(!group) return;

    group.classList.add('auth-system-group');
    // Expand/collapse is handled by fixSidebar(). Keeping a second
    // SYSTEM-only toggle here makes the group open and close in one click.
  }

  function init(){
    syncSystemSecurityVisibility();
    fixSystemSecurityExpand();

    const loginBtn = document.querySelector('#permissionChip');
    if(loginBtn && !loginBtn.dataset.v1082VisibilityBound){
      loginBtn.dataset.v1082VisibilityBound = '1';
      loginBtn.addEventListener('click', () => setTimeout(() => {
        syncSystemSecurityVisibility();
        fixSystemSecurityExpand();
      }, 250));
    }

    const logoutBtn = document.querySelector('#logoutBtn');
    if(logoutBtn && !logoutBtn.dataset.v1082VisibilityBound){
      logoutBtn.dataset.v1082VisibilityBound = '1';
      logoutBtn.addEventListener('click', () => setTimeout(() => {
        syncSystemSecurityVisibility();
        fixSystemSecurityExpand();
      }, 250));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 350);
    setTimeout(init, 1200);
    setTimeout(init, 2200);
  });

  window.addEventListener('hashchange', () => setTimeout(init, 120));

  // Watch login/logout changes from localStorage in same tab flow
  const rawSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value){
    rawSetItem.apply(this, arguments);
    if(key === 'fti_auth_session') setTimeout(init, 50);
  };
  const rawRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key){
    rawRemoveItem.apply(this, arguments);
    if(key === 'fti_auth_session') setTimeout(init, 50);
  };

  setTimeout(init, 500);
})();
