/* Shared GitHub publisher for static GitHub Pages data/files. */
const SETTINGS_KEY = 'fti_github_publish_settings_v1';
const TOKEN_KEY = 'fti_github_publish_token_session_v1';

const DEFAULT_SETTINGS = {
  owner: 'toannq1910',
  repo: 'FTI-Collaboration-Hub',
  branch: 'develop'
};

function $(selector, root = document){
  return root.querySelector(selector);
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}

function toast(message){
  if(typeof window.toast === 'function') return window.toast(message);
  const root = $('#toastRoot') || document.body;
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => item.remove(), 6400);
}

function loadSettings(){
  try{
    return {...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')};
  }catch{
    return {...DEFAULT_SETTINGS};
  }
}

function saveSettings(settings){
  const safe = {
    owner: settings.owner || DEFAULT_SETTINGS.owner,
    repo: settings.repo || DEFAULT_SETTINGS.repo,
    branch: settings.branch || DEFAULT_SETTINGS.branch
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
}

function bytesToBase64(bytes){
  let binary = '';
  const chunkSize = 0x8000;
  for(let i = 0; i < bytes.length; i += chunkSize){
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function textToBase64(text){
  return bytesToBase64(new TextEncoder().encode(text));
}

async function blobToBase64(blob){
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function encodeRepoPath(path){
  return String(path || '').split('/').map(encodeURIComponent).join('/');
}

function ensureStyle(){
  if($('#githubPublishStyle')) return;
  const style = document.createElement('style');
  style.id = 'githubPublishStyle';
  style.textContent = `
    .github-publish-modal{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:22px}
    .github-publish-backdrop{position:absolute;inset:0;background:rgba(2,6,23,.78);backdrop-filter:blur(8px);border:0}
    .github-publish-panel{position:relative;width:min(720px,calc(100vw - 32px));max-height:calc(100vh - 44px);overflow:auto;background:#111c31;border:1px solid rgba(96,165,250,.32);border-radius:22px;box-shadow:0 22px 80px rgba(0,0,0,.45);padding:20px;color:#e5f0ff}
    .github-publish-panel h3{margin:0 0 6px;font-size:22px}
    .github-publish-panel p{margin:0 0 16px;color:#a9bbd6;line-height:1.55}
    .github-publish-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
    .github-publish-grid label,.github-publish-full label{display:grid;gap:6px;font-size:12px;font-weight:900;color:#c7d7ef}
    .github-publish-grid input,.github-publish-full input{height:42px;border:1px solid #30476d;background:#050a18;color:#fff;border-radius:12px;padding:0 12px;outline:none}
    .github-publish-full{display:grid;gap:12px;margin-top:12px}
    .github-publish-note{margin-top:12px;border:1px solid rgba(249,115,22,.28);background:rgba(249,115,22,.10);border-radius:14px;padding:10px 12px;color:#ffd6b0;font-size:12px;line-height:1.5}
    .github-publish-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
    .github-publish-status{margin-top:12px;color:#93c5fd;font-size:12px;min-height:18px}
    .github-publish-inline{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    @media(max-width:760px){.github-publish-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function githubPublishErrorMessage(error){
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  if(lower.includes('resource not accessible by personal access token')){
    return 'Token GitHub chưa có quyền ghi repo. Hãy revoke token đã lộ, tạo token mới cho repo FTI-Collaboration-Hub với Contents = Read and write, Metadata = Read.';
  }
  if(lower.includes('bad credentials')){
    return 'GitHub token sai, hết hạn hoặc đã bị revoke. Hãy tạo token mới và thử lại.';
  }
  if(lower.includes('not found')){
    return 'Không tìm thấy repo/branch/file hoặc token không được cấp quyền vào repo này. Kiểm tra owner, repo, branch và Repository access của token.';
  }
  if(lower.includes('protected branch')){
    return 'Branch đang được bảo vệ hoặc token không đủ quyền ghi vào branch này. Hãy publish lên develop trước.';
  }
  return raw || 'Không rõ lý do thất bại từ GitHub API.';
}

function openPublishDialog(options){
  ensureStyle();
  const settings = loadSettings();
  const modal = document.createElement('div');
  modal.className = 'github-publish-modal';
  modal.innerHTML = `
    <button class="github-publish-backdrop" type="button" data-gh-cancel aria-label="Close"></button>
    <section class="github-publish-panel" role="dialog" aria-modal="true">
      <h3>${esc(options.title || 'Publish lên GitHub')}</h3>
      <p>${esc(options.description || 'Ghi thay đổi hiện tại vào repository để GitHub Pages và các trình duyệt khác đọc cùng một dữ liệu.')}</p>
      <div class="github-publish-grid">
        <label>Owner<input id="ghOwner" value="${esc(settings.owner)}"></label>
        <label>Repo<input id="ghRepo" value="${esc(settings.repo)}"></label>
        <label>Branch<input id="ghBranch" value="${esc(options.branch || settings.branch)}"></label>
      </div>
      <div class="github-publish-full">
        <label>Đường dẫn file trong repo<input id="ghPath" value="${esc(options.path || '')}"></label>
        <label>Commit message<input id="ghMessage" value="${esc(options.message || 'Publish CMS update')}"></label>
        <label>GitHub token<input id="ghToken" type="password" value="${esc(sessionStorage.getItem(TOKEN_KEY) || '')}" placeholder="Fine-grained token có quyền Contents: Read and write"></label>
      </div>
      <div class="github-publish-note">
        Token chỉ lưu trong session của trình duyệt để publish, không ghi vào code. Không chụp hoặc gửi token lên chat.
        Fine-grained token cần chọn repo <b>FTI-Collaboration-Hub</b>, quyền <b>Contents: Read and write</b> và <b>Metadata: Read</b>.
        Nên publish lên <b>develop</b> để test, sau đó merge sang <b>main</b>.
      </div>
      <div class="github-publish-status" id="ghPublishStatus"></div>
      <div class="github-publish-actions">
        <button class="btn btn-soft" type="button" data-gh-cancel>Hủy</button>
        <button class="btn btn-primary" type="button" id="ghPublishConfirm">Publish</button>
      </div>
    </section>
  `;
  document.body.appendChild(modal);

  return new Promise(resolve => {
    const close = result => {
      modal.remove();
      resolve(result);
    };
    modal.querySelectorAll('[data-gh-cancel]').forEach(btn => btn.addEventListener('click', () => close(null)));
    $('#ghPublishConfirm', modal).addEventListener('click', () => {
      const next = {
        owner: $('#ghOwner', modal).value.trim(),
        repo: $('#ghRepo', modal).value.trim(),
        branch: $('#ghBranch', modal).value.trim(),
        path: $('#ghPath', modal).value.trim().replace(/^\/+/, ''),
        message: $('#ghMessage', modal).value.trim(),
        token: $('#ghToken', modal).value.trim(),
        statusEl: $('#ghPublishStatus', modal)
      };
      if(!next.owner || !next.repo || !next.branch || !next.path || !next.message || !next.token){
        next.statusEl.textContent = 'Vui lòng nhập đủ owner, repo, branch, path, message và token.';
        return;
      }
      saveSettings(next);
      sessionStorage.setItem(TOKEN_KEY, next.token);
      close(next);
    });
  });
}

async function getExistingFileSha(settings){
  const url = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${encodeRepoPath(settings.path)}?ref=${encodeURIComponent(settings.branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${settings.token}`,
      Accept: 'application/vnd.github+json'
    }
  });
  if(res.status === 404) return '';
  const body = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(body.message || `Cannot read ${settings.path}`);
  return body.sha || '';
}

async function putGithubFile(settings, contentBase64){
  const sha = await getExistingFileSha(settings);
  const url = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${encodeRepoPath(settings.path)}`;
  const payload = {
    message: settings.message,
    content: contentBase64,
    branch: settings.branch
  };
  if(sha) payload.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${settings.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(body.message || `Cannot publish ${settings.path}`);
  return body;
}

export async function publishJsonToGithub({data, path, message, title, description, branch}){
  const settings = await openPublishDialog({path, message, title, description, branch});
  if(!settings) return null;
  try{
    toast('Đang publish JSON lên GitHub...');
    const content = JSON.stringify(data, null, 2) + '\n';
    const result = await putGithubFile(settings, textToBase64(content));
    toast(`Đã publish ${settings.path} lên ${settings.branch}.`);
    return result;
  }catch(err){
    console.error(err);
    toast(`Publish thất bại: ${githubPublishErrorMessage(err)}`);
    return null;
  }
}

export async function publishBlobToGithub({blob, path, message, title, description, branch}){
  if(!blob) {
    toast('Không có file để publish.');
    return null;
  }
  const settings = await openPublishDialog({path, message, title, description, branch});
  if(!settings) return null;
  try{
    toast('Đang upload file lên GitHub...');
    const result = await putGithubFile(settings, await blobToBase64(blob));
    toast(`Đã publish ${settings.path} lên ${settings.branch}.`);
    return result;
  }catch(err){
    console.error(err);
    toast(`Publish thất bại: ${githubPublishErrorMessage(err)}`);
    return null;
  }
}

export async function publishFilesToGithub({files, message, title, description, branch}){
  const validFiles = (files || []).filter(file => file && file.path && (file.blob || file.text || file.contentBase64));
  if(!validFiles.length){
    toast('Không có file để publish.');
    return null;
  }
  const settings = await openPublishDialog({
    path: validFiles[0].path,
    message,
    title,
    description,
    branch
  });
  if(!settings) return null;
  validFiles[0].path = settings.path;

  try{
    toast(`Đang publish ${validFiles.length} file lên GitHub...`);
    const results = [];
    for(const file of validFiles){
      const contentBase64 = file.contentBase64 || (file.blob ? await blobToBase64(file.blob) : textToBase64(file.text));
      results.push(await putGithubFile({...settings, path: file.path}, contentBase64));
    }
    toast(`Đã publish ${validFiles.length} file lên ${settings.branch}.`);
    return results;
  }catch(err){
    console.error(err);
    toast(`Publish thất bại: ${githubPublishErrorMessage(err)}`);
    return null;
  }
}

export function defaultAssetPath(asset){
  const type = asset?.type || 'other';
  const product = asset?.product || 'shared';
  const fileName = String(asset?.fileName || asset?.title || `asset-${Date.now()}`).replace(/[\\/:*?"<>|]+/g, '-');
  if(type === 'presentation') return `assets/presentation/${fileName}`;
  if(type === 'userGuide') return `assets/user-guide/${product}/${fileName}`;
  if(type === 'api') return `assets/api/oncallcx/${fileName}`;
  if(type === 'image' || type === 'logo') return `assets/images/${product}/${fileName}`;
  if(type === 'video') return `assets/video/${product}/${fileName}`;
  return `assets/documents/${product}/${fileName}`;
}

window.FTIGithubPublisher = {
  publishJsonToGithub,
  publishBlobToGithub,
  publishFilesToGithub,
  defaultAssetPath
};
