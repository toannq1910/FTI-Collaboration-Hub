/* OnCallCX UCaaS API Reference v1.1
   Public API reference built from:
   - REST API_OncallCX_UCaaS.pdf
   - CTI API_OncallCX_UCaaS.pdf
   - Webhook_OncallCX_UCaaS.pdf
   No credentials are stored in this file.
*/
(function(){
  const API_META = {
    version: 'v1.1',
    updated: '07/07/2026',
    baseUrl: 'https://pbx.oncallcx.vn',
    auth: 'Basic Auth',
    pbxName: 'CCaaS_FTI',
    orgUnitId: '4657',
    verified: 'Đã gọi thử nhóm GET an toàn từ REST API trước đó',
    sources: [
      {title:'REST API OnCallCX UCaaS', type:'PDF', url:'assets/api/oncallcx/REST-API-OnCallCX-UCaaS.pdf', note:'REST objects, filter/sort/limit, CDR, extension, contact, terminal.'},
      {title:'CTI API OnCallCX UCaaS', type:'PDF', url:'assets/api/oncallcx/CTI-API-OnCallCX-UCaaS.pdf', note:'Pure CSTA, anCTI JavaScript Library, call control services/events.'},
      {title:'Webhook OnCallCX UCaaS', type:'PDF', url:'assets/api/oncallcx/Webhook-OnCallCX-UCaaS.pdf', note:'Webhook activation, CDR events, extension events.'}
    ],
    stats: [
      ['REST Objects', '18+', 'orgUnits, addresses, terminals, cdrs, contacts...'],
      ['CTI Services', '30+', 'MakeCall, AnswerCall, HoldCall, TransferCall...'],
      ['Webhook Events', '9+', 'call_start, call_cdr, extension_status...'],
      ['Live PBX', '4657', 'CCaaS_FTI / orgUnitId'],
      ['Safe Mode', 'GET only', 'Không tự chạy POST/PUT/DELETE/MakeCall'],
      ['Docs', '3 files', 'REST + CTI + Webhook']
    ]
  };

  const API_GROUPS = [
    {
      id: 'rest-overview',
      type: 'REST',
      icon: '📘',
      title: 'REST API - Tổng quan & xác thực',
      badge: 'REST',
      desc: 'REST API dùng HTTPS và Basic Auth để quản trị cấu hình PBX/UCaaS. API hỗ trợ JSON, XML, CSV; bộ public này ưu tiên JSON để dễ tích hợp CRM/ERP.',
      endpoints: [
        {
          method: 'GET',
          path: '/rest/orgUnits?where=type.like("pbx")',
          title: 'Lấy danh sách PBX được phân quyền',
          status: 'Safe GET',
          note: 'Endpoint đầu tiên để lấy PBX/orgUnitId, sau đó dùng orgUnitId cho addresses, CDR, contacts, forwards và các truy vấn liên quan.',
          request: 'Authorization: Basic <base64(username:password)>\nAccept: application/json',
          response: '{\n  "orgUnits": [\n    {\n      "id": 4657,\n      "name": "CCaaS_FTI",\n      "type": "pbx",\n      "parentId": 4315\n    }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/<object>?where=<filter>&ascending=<field>&limit=<offset>,<count>&properties=<fields>',
          title: 'Quy tắc filter / sort / limit / properties',
          status: 'Query pattern',
          note: 'Tài liệu REST mô tả một pattern dùng chung cho mọi object. Có thể lọc, sắp xếp, phân trang và chỉ lấy các field cần thiết.',
          request: 'GET /rest/cdrs?where=accOrgUnitId.eq(4657).and(timeStart.ge(1696111200000))&descending=timeStart&limit=100&properties=id,callId,timeStart',
          response: '{\n  "cdrs": [\n    { "id": 27301130, "callId": "cc1ftiprod-...", "timeStart": 1767598507787 }\n  ]\n}'
        },
        {
          method: 'POST/PUT/DELETE',
          path: '/rest/<object> hoặc /rest/<object>/<id>',
          title: 'Create / Update / Delete objects',
          status: 'Không tự execute',
          note: 'Các method này thay đổi dữ liệu thật. Chỉ đưa vào tài liệu hướng dẫn, không chạy tự động trên frontend.',
          request: 'POST /rest/orgUnits\nPUT /rest/terminals/308\nDELETE /rest/orgUnits/519',
          response: '200 OK nếu thành công. Cần kiểm soát quyền, audit và môi trường test trước khi dùng.'
        }
      ]
    },
    {
      id: 'rest-pbx',
      type: 'REST',
      icon: '🏢',
      title: 'PBX, Extension, Terminal',
      badge: 'Provisioning',
      desc: 'Nhóm API quản trị tổng đài Cloud PBX: tổ chức, số nội bộ/public address, terminal/device, location và thuộc tính thiết bị.',
      endpoints: [
        {
          method: 'GET',
          path: '/rest/addresses?where=orgUnitId.eq(4657)',
          title: 'Lấy extension/address theo PBX',
          status: 'Live sample: 5 records',
          note: 'Dùng để đọc số nội bộ/số public và các cờ trạng thái như disabled, DND, call waiting, callback.',
          request: 'GET /rest/addresses?where=orgUnitId.eq(4657)',
          response: '{\n  "addresses": [\n    {\n      "id": 5291,\n      "number": "0247300***",\n      "orgUnitId": 4657,\n      "disabled": false,\n      "doNotDisturb": false,\n      "callWaiting": false\n    }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/terminals?where=orgUnitId.eq(4657)',
          title: 'Lấy terminal/device của PBX',
          status: 'Safe GET',
          note: 'Terminal là thiết bị/softphone được gán cho extension. Nếu PBX chưa có terminal hoặc user không có quyền, response có thể rỗng.',
          request: 'GET /rest/terminals?where=orgUnitId.eq(4657)',
          response: '{\n  "terminals": []\n}'
        },
        {
          method: 'GET',
          path: '/rest/locations?where=terminalId.eq(<terminalId>)',
          title: 'Lấy location/registration của terminal',
          status: 'Depends on terminal',
          note: 'Dùng để kiểm tra vị trí đăng ký/thiết bị của terminal khi đã có terminalId.',
          request: 'GET /rest/locations?where=terminalId.eq(308)',
          response: '{\n  "locations": [\n    { "id": 1, "terminalId": 308, "userAgent": "SIP client" }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/forwards?where=orgUnitId.eq(<extensionOrgUnitId>)',
          title: 'Lấy cấu hình call forwarding',
          status: 'REST object',
          note: 'Các loại forward thường gặp: cfu, cfb, cfnr, cff tương ứng chuyển tiếp vô điều kiện/bận/không trả lời/fallback.',
          request: 'GET /rest/forwards?where=orgUnitId.eq(4657)',
          response: '{\n  "forwards": [\n    { "id": 743, "type": "cfu", "destination": "1001" }\n  ]\n}'
        }
      ]
    },
    {
      id: 'rest-queue-cdr',
      type: 'REST',
      icon: '📊',
      title: 'Queue, CDR, Recording',
      badge: 'Operations',
      desc: 'Nhóm API đọc trạng thái queue/ACD, lịch sử cuộc gọi CDR và thông tin ghi âm phục vụ báo cáo, tra soát, QA/QC.',
      endpoints: [
        {
          method: 'GET',
          path: '/rest/acdMembers',
          title: 'Lấy danh sách ACD members',
          status: 'Live sample: 31 members',
          note: 'Trả về member trong các queue/ACD: number, acdId, rank, ringDelay, ringDuration, inactive.',
          request: 'GET /rest/acdMembers',
          response: '{\n  "acdMembers": [\n    {\n      "id": 1257,\n      "number": "1007",\n      "acdId": 453,\n      "rank": 3,\n      "ringDelay": 5,\n      "ringDuration": 15,\n      "inactive": true\n    }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/cdrs?where=accOrgUnitId.eq(4657)&limit=100',
          title: 'Lấy CDR của PBX',
          status: 'Live sample: 10 records',
          note: 'Dùng cho báo cáo cuộc gọi, trạng thái, thời lượng, số gọi/nhận, Call-ID và liên kết recording nếu được bật.',
          request: 'GET /rest/cdrs?where=accOrgUnitId.eq(4657)&limit=100',
          response: '{\n  "cdrs": [\n    {\n      "id": 27301130,\n      "status": 200,\n      "callId": "cc1ftiprod-5ff0...470e",\n      "accOrgUnitId": 4657,\n      "origPublicNumber": "0919091***",\n      "destNumber": "223",\n      "timeStart": 1767598507787,\n      "timeConnect": 1767598508294,\n      "timeEnd": 1767598522988\n    }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/cdrs?where=callId.eq("Call_Id")',
          title: 'Tìm CDR theo Call-ID',
          status: 'Trace call',
          note: 'Call-ID là khóa tra soát quan trọng khi mapping với Webhook, CTI event hoặc recording.',
          request: 'GET /rest/cdrs?where=callId.eq("cc1ftiprod-...")',
          response: '{\n  "cdrs": [\n    { "callId": "cc1ftiprod-...", "sipCallId": "...", "status": 200 }\n  ]\n}'
        },
        {
          method: 'GET',
          path: 'https://s3stg-crm.oncallcx.vn/.../cr_<callId>.wav',
          title: 'Audio recording file',
          status: 'File access',
          note: 'Tài liệu REST có ví dụ lấy recording qua file S3 theo Call-ID. Không tự tải recording vì có dữ liệu nhạy cảm.',
          request: 'GET <recording-url>',
          response: 'Audio file .wav nếu user/token có quyền truy cập.'
        }
      ]
    },
    {
      id: 'rest-contacts-supporting',
      type: 'REST',
      icon: '👥',
      title: 'Contacts, Audio, User & supporting objects',
      badge: 'Objects',
      desc: 'Các object hỗ trợ tích hợp CRM/ERP: danh bạ, audio file, user, user role, user attribute, billing limit, holiday và subscription.',
      endpoints: [
        {
          method: 'GET',
          path: '/rest/contacts',
          title: 'Lấy danh bạ/contact',
          status: 'Live sample: 1 contact',
          note: 'Số điện thoại cần mask khi hiển thị public hoặc demo.',
          request: 'GET /rest/contacts',
          response: '{\n  "contacts": [\n    {\n      "id": 255,\n      "name": "Minh test",\n      "orgUnitId": 8941,\n      "telNumber": "0933353***"\n    }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/audioFiles',
          title: 'Lấy audio files',
          status: 'REST object',
          note: 'Dùng cho voicemail, IVR, ACD audio, music on hold. Upload/change audio là thao tác có side effect.',
          request: 'GET /rest/audioFiles',
          response: '{\n  "audioFiles": [\n    { "id": 134, "name": "welcome.wav", "orgUnitId": 4657 }\n  ]\n}'
        },
        {
          method: 'GET',
          path: '/rest/users, /rest/userRoles, /rest/userAttributes',
          title: 'User / role / attribute',
          status: 'Security object',
          note: 'Dùng khi cấp quyền REST/Webhook admin hoặc gán attribute như ctiDeviceId.',
          request: 'GET /rest/users\nGET /rest/userRoles\nGET /rest/userAttributes',
          response: '{\n  "users": [],\n  "userRoles": [],\n  "userAttributes": []\n}'
        }
      ]
    },
    {
      id: 'cti-overview',
      type: 'CTI',
      icon: '☎️',
      title: 'CTI API - CSTA & anCTI',
      badge: 'Call control',
      desc: 'CTI API không phải REST thông thường. Tài liệu mô tả hai flavor: Pure CSTA XML qua TCP và anCTI JavaScript Library dùng JSON/WebApp để điều khiển cuộc gọi.',
      endpoints: [
        {
          method: 'CTI',
          path: 'Pure CSTA',
          title: 'Pure CSTA CTI API',
          status: 'CSTA XML',
          note: 'Ứng dụng CTI trao đổi CSTA messages với CTI Server. Phù hợp hệ thống call center hoặc middleware cần kiểm soát chi tiết.',
          request: 'CTI reference: ctiDomain\nDevice reference: ctiDeviceId\nTransport: TCP/IP theo cấu hình CTI server',
          response: 'CSTA events: DeliveredEvent, EstablishedEvent, ConnectionClearedEvent, TransferredEvent...'
        },
        {
          method: 'CTI',
          path: 'anCTI JavaScript Library',
          title: 'anCTI JavaScript Library',
          status: 'Web app',
          note: 'Thư viện anCTI ẩn phần CSTA phức tạp, cung cấp methods/events để làm webphone, click-to-call, remote phone control.',
          request: 'ctiUrl: https://<pbx-or-tenant>/cti\nctiDeviceId: sip:<extension>@ou.<id>',
          response: 'Events: ApplicationSessionStartedEvent, LocalStreamEvent, RemoteStreamEvent, call/device updates.'
        },
        {
          method: 'CTI',
          path: 'ctiDomain / ctiUrl / ctiDeviceId',
          title: 'Các định danh CTI bắt buộc',
          status: 'Configuration',
          note: 'ctiDomain phân tách PBX/customer; ctiUrl là URL CTI client; ctiDeviceId định danh thiết bị/extension được điều khiển.',
          request: 'ctiDomain: pbx.customer.com\nctiUrl: https://pbx.customer.com/cti\nctiDeviceId: sip:1000@ou.2',
          response: 'CTI session chỉ hoạt động nếu PBX/user/role/attribute được cấu hình đúng.'
        }
      ]
    },
    {
      id: 'cti-services',
      type: 'CTI',
      icon: '🧭',
      title: 'CTI Services & Events',
      badge: 'Services',
      desc: 'Danh sách các thao tác và sự kiện CTI quan trọng để thiết kế webphone, click-to-call, agent desktop, supervisor control.',
      endpoints: [
        {
          method: 'CTI',
          path: 'Call Services',
          title: 'Call control services',
          status: 'Side effect',
          note: 'Các service này có thể tạo/điều khiển cuộc gọi thật nên chỉ demo logic, không tự execute.',
          request: 'MakeCall\nAnswerCall\nClearConnection\nHoldCall\nRetrieveCall\nDeflectCall\nTransferCall\nConferenceCall\nSingleStepTransferCall',
          response: 'Call events tương ứng: OriginatedEvent, DeliveredEvent, EstablishedEvent, HeldEvent, RetrievedEvent, TransferredEvent, ConnectionClearedEvent.'
        },
        {
          method: 'CTI',
          path: 'Device Services',
          title: 'Device monitoring & state',
          status: 'Monitor',
          note: 'Dùng để theo dõi device, snapshot cuộc gọi, trạng thái DND/forwarding/presence.',
          request: 'MonitorStart\nMonitorStop\nSnapshotDevice\nSnapshotCall\nSetDoNotDisturb\nGetDoNotDisturb\nSetForwarding\nGetForwarding\nGetPresenceState',
          response: 'Device events: PresenceStateEvent, DtmfDetectedEvent, StopEvent...'
        },
        {
          method: 'CTI',
          path: 'anCTI Agent/Device/Call methods',
          title: 'anCTI methods/events',
          status: 'Library',
          note: 'Nhóm method/event ở layer JavaScript để làm UI agent/webphone.',
          request: 'StartApplicationSession\nStopApplicationSession\nGetDevices\nGetDevice\nGetCall\nGetCalls\nUpdateCall',
          response: 'ApplicationSessionStartedEvent\nApplicationSessionTerminatedEvent\nLocalStreamEvent\nRemoteStreamEvent'
        }
      ]
    },
    {
      id: 'webhook-config',
      type: 'WEBHOOK',
      icon: '🔔',
      title: 'Webhook - Cấu hình kích hoạt',
      badge: 'Realtime',
      desc: 'Webhook gửi event cuộc gọi/extension từ OnCallCX PBX sang CRM URL của khách hàng. Cấu hình gồm user role, ctiDeviceId, App URL, CRM URL và bật event.',
      endpoints: [
        {
          method: 'WEBHOOK',
          path: 'Portal user role + attribute',
          title: 'Gán quyền cho webhook admin user',
          status: 'Admin step',
          note: 'Tất cả PBX bật webhook có thể cấu hình dưới cùng một webhook admin user.',
          request: 'Operations -> Users -> webhook_admin\nRole: REST API\nOrgUnit: PBX Name\nAttribute name: ctiDeviceId\nAttribute value: sip:<Extension-Num>@ou.<CTI Device ID>',
          response: 'Webhook admin user có quyền đọc/gửi event cho PBX đã gán.'
        },
        {
          method: 'WEBHOOK',
          path: 'https://<pbx-fqdn>:8892/login',
          title: 'Đăng nhập Webhook Config Portal',
          status: 'Config portal',
          note: 'Tài liệu ví dụ dùng port 8892 để vào trang cấu hình webhook.',
          request: 'Login bằng account PBX có quyền Administrator.',
          response: 'Màn hình cấu hình App URL, CTI Device ID, CRM URL và nút bật/tắt event.'
        },
        {
          method: 'WEBHOOK',
          path: 'App URL / CRM URL',
          title: 'Khai báo endpoint gửi và nhận event',
          status: 'Activation',
          note: 'App URL là webhook service của OnCallCX; CRM URL là endpoint hệ thống khách hàng nhận event.',
          request: 'App URL: https://<pbx-oncallcx-fqdn>:8893\nCTI Device ID: ou.2\nCRM URL: https://customer-crm.company.com/events\nActive: true\nButtons: CDR Webhook, Extension Webhook',
          response: 'OnCallCX PBX bắt đầu POST event realtime sang CRM URL đã khai báo.'
        }
      ]
    },
    {
      id: 'webhook-events',
      type: 'WEBHOOK',
      icon: '📡',
      title: 'Webhook Event Reference',
      badge: 'Payload',
      desc: 'Các payload chính trong tài liệu Webhook: CDR lifecycle events và extension status events.',
      endpoints: [
        {
          method: 'WEBHOOK',
          path: 'call_start',
          title: 'Cuộc gọi bắt đầu',
          status: 'CDR event',
          note: 'Event đầu tiên khi cuộc gọi được tạo. Dùng để mở ticket/screen pop sớm trong CRM.',
          request: 'POST <CRM URL>',
          response: '{\n  "event_type": "call_start",\n  "call_id": "cc1250918152610380",\n  "session_id": "cc1250918152610380",\n  "callee": "*14",\n  "caller": "1000",\n  "cdr_id": "cc1250918152610380",\n  "direction": "out",\n  "tenant_id": "ou.2",\n  "Time": "2025-09-18T08:26:09.221Z"\n}'
        },
        {
          method: 'WEBHOOK',
          path: 'cdr_target_ringing / cdr_target_answer',
          title: 'Đích gọi đang đổ chuông / đã trả lời',
          status: 'CDR event',
          note: 'Dùng để cập nhật trạng thái cuộc gọi realtime trên CRM/agent desktop.',
          request: 'POST <CRM URL>',
          response: '{\n  "event_type": "cdr_target_answer",\n  "Caller": "1000",\n  "session_id": "cc1250918152610380",\n  "Destination": "*14",\n  "cdr_id": "cc1250918152610380",\n  "direction": "out",\n  "tenant_id": "ou.2",\n  "Time": "2025-09-18T08:26:09.240Z"\n}'
        },
        {
          method: 'WEBHOOK',
          path: 'cdr_target_noanswer / cdr_target_end / cdr_target_fail',
          title: 'Không nghe máy / kết thúc / thất bại',
          status: 'CDR event',
          note: 'Dùng để đóng vòng đời cuộc gọi, gắn outcome, retry hoặc tạo task follow-up.',
          request: 'POST <CRM URL>',
          response: '{\n  "event_type": "cdr_target_end",\n  "Caller": "1000",\n  "Destination": "*14",\n  "cdr_id": "cc1250918152610380",\n  "direction": "out",\n  "tenant_id": "ou.2",\n  "Time": "2025-09-18T08:26:20.000Z"\n}'
        },
        {
          method: 'WEBHOOK',
          path: 'call_cdr',
          title: 'CDR hoàn chỉnh sau cuộc gọi',
          status: 'Final event',
          note: 'Event tổng kết có thể dùng để lưu lịch sử cuộc gọi, duration, answered time, recording URL nếu có.',
          request: 'POST <CRM URL>',
          response: '{\n  "event_type": "call_cdr",\n  "call_id": "cc1250918152610380",\n  "session_id": "cc1250918152610380",\n  "caller": "1000",\n  "callee": "*14",\n  "answered_time": "...",\n  "start_time": "...",\n  "ended_time": "...",\n  "direction": "out"\n}'
        },
        {
          method: 'WEBHOOK',
          path: 'extension_status / extension_id',
          title: 'Extension events',
          status: 'Extension Webhook',
          note: 'Dùng để đồng bộ trạng thái extension/agent với hệ thống ngoài nếu đã bật Extension Webhook.',
          request: 'POST <CRM URL>',
          response: '{\n  "event_type": "extension_status",\n  "extension_id": "1000",\n  "status": "available",\n  "tenant_id": "ou.2",\n  "time": "2025-09-18T08:26:09.221Z"\n}'
        }
      ]
    }
  ];

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function methodClass(method){
    const value = String(method || 'GET').toLowerCase().replace(/[^a-z]/g, '');
    if (value.includes('post')) return 'post';
    if (value.includes('put')) return 'put';
    if (value.includes('delete')) return 'delete';
    if (value.includes('cti')) return 'cti';
    if (value.includes('webhook')) return 'webhook';
    return 'get';
  }

  function endpointCard(endpoint){
    return `<article class="uc-api-endpoint" data-api-endpoint>
      <div class="uc-api-endpoint-head">
        <span class="method ${methodClass(endpoint.method)}">${esc(endpoint.method)}</span>
        <code>${esc(endpoint.path)}</code>
        <em>${esc(endpoint.status)}</em>
      </div>
      <h4>${esc(endpoint.title)}</h4>
      <p>${esc(endpoint.note)}</p>
      <div class="uc-api-code-grid">
        <div><b>Request / cấu hình</b><pre><code>${esc(endpoint.request)}</code></pre></div>
        <div><b>Response / payload mẫu</b><pre><code>${esc(endpoint.response)}</code></pre></div>
      </div>
    </article>`;
  }

  function groupCard(group){
    return `<section class="uc-api-section" id="uc-api-${esc(group.id)}" data-uc-api-section data-api-type="${esc(group.type)}">
      <header>
        <div class="uc-api-icon">${esc(group.icon)}</div>
        <div><span>${esc(group.badge)}</span><h3>${esc(group.title)}</h3><p>${esc(group.desc)}</p></div>
      </header>
      <div class="uc-api-endpoints">${group.endpoints.map(endpointCard).join('')}</div>
    </section>`;
  }

  function render(){
    const root = document.querySelector('#pageRoot');
    if (!root || (location.hash || '') !== '#api-reference') return;
    ensureStyle();
    const title = document.querySelector('#pageTitle');
    const subtitle = document.querySelector('#pageSubtitle');
    if (title) title.textContent = 'API Reference';
    if (subtitle) subtitle.textContent = 'OnCallCX UCaaS REST API, CTI API và Webhook';

    root.innerHTML = `<section class="api-ref-hero uc-api-hero">
      <span class="eyebrow">API Reference - OnCallCX UCaaS ${esc(API_META.version)}</span>
      <h2>Tài liệu API<br><span class="gradient-text">REST API · CTI API · Webhook</span></h2>
      <p>Bộ tài liệu này thay thế nội dung API cũ. REST API dùng cho cấu hình/tra cứu dữ liệu PBX, CTI dùng cho điều khiển cuộc gọi và Webhook dùng để đẩy event realtime sang CRM/ERP. Frontend không lưu username/password và không tự gọi API có side effect.</p>
      <div class="uc-api-tags">
        <span>Base URL: <code>${esc(API_META.baseUrl)}</code></span>
        <span>Auth: ${esc(API_META.auth)}</span>
        <span>PBX: ${esc(API_META.pbxName)}</span>
        <span>OrgUnitId: ${esc(API_META.orgUnitId)}</span>
        <span>${esc(API_META.verified)}</span>
      </div>
      <div class="uc-api-docs">
        ${API_META.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener"><b>${esc(source.title)}</b><small>${esc(source.type)} · ${esc(source.note)}</small></a>`).join('')}
      </div>
    </section>

    <section class="uc-api-live">
      ${API_META.stats.map(([label,value,desc]) => `<article><b>${esc(value)}</b><span>${esc(label)}</span><small>${esc(desc)}</small></article>`).join('')}
    </section>

    <section class="uc-api-toolbar">
      <input id="ucApiSearch" placeholder="Tìm endpoint, event, CTI service, CDR, extension, webhook...">
      <select id="ucApiType">
        <option value="all">All groups</option>
        <option value="REST">REST</option>
        <option value="CTI">CTI</option>
        <option value="WEBHOOK">Webhook</option>
      </select>
      <select id="ucApiMethod">
        <option value="all">All methods</option>
        <option value="GET">GET</option>
        <option value="CTI">CTI</option>
        <option value="WEBHOOK">WEBHOOK</option>
        <option value="POST/PUT/DELETE">POST/PUT/DELETE</option>
      </select>
    </section>

    <section class="uc-api-shell">
      <aside class="uc-api-nav">
        <b>API Reference</b>
        ${API_GROUPS.map(group => `<button type="button" data-uc-api-scroll="${esc(group.id)}"><span>${esc(group.icon)}</span>${esc(group.title)}</button>`).join('')}
        <div class="uc-api-note"><strong>Lưu ý an toàn</strong><p>Chỉ các API GET được xem là an toàn để kiểm thử. CTI MakeCall, POST/PUT/DELETE và webhook activation có thể phát sinh cuộc gọi hoặc thay đổi cấu hình thật.</p></div>
      </aside>
      <main class="uc-api-main" id="ucApiMain">${API_GROUPS.map(groupCard).join('')}</main>
    </section>`;
    bind(root);
  }

  function bind(root){
    root.querySelectorAll('[data-uc-api-scroll]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-uc-api-scroll');
        root.querySelector(`#uc-api-${id}`)?.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });

    const filter = () => {
      const query = (root.querySelector('#ucApiSearch')?.value || '').toLowerCase().trim();
      const type = root.querySelector('#ucApiType')?.value || 'all';
      const method = root.querySelector('#ucApiMethod')?.value || 'all';
      const groups = API_GROUPS
        .filter(group => type === 'all' || group.type === type)
        .map(group => ({
          ...group,
          endpoints: group.endpoints.filter(endpoint => {
            const methodOk = method === 'all' || String(endpoint.method).toUpperCase() === method;
            const text = [group.type, group.title, group.desc, endpoint.method, endpoint.path, endpoint.title, endpoint.note, endpoint.status].join(' ').toLowerCase();
            return methodOk && (!query || text.includes(query));
          })
        }))
        .filter(group => group.endpoints.length);

      const main = root.querySelector('#ucApiMain');
      if (main) main.innerHTML = groups.length ? groups.map(groupCard).join('') : '<div class="cms-empty-state">Không tìm thấy API phù hợp.</div>';
    };

    root.querySelector('#ucApiSearch')?.addEventListener('input', filter);
    root.querySelector('#ucApiType')?.addEventListener('change', filter);
    root.querySelector('#ucApiMethod')?.addEventListener('change', filter);
  }

  function ensureStyle(){
    if (document.getElementById('ucApiRefStyle')) return;
    const style = document.createElement('style');
    style.id = 'ucApiRefStyle';
    style.textContent = `
      .uc-api-hero{background:linear-gradient(135deg,rgba(16,185,129,.13),rgba(14,165,233,.09));border-color:rgba(16,185,129,.32)}
      .uc-api-tags,.uc-api-docs{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
      .uc-api-tags span{border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.08);border-radius:999px;padding:7px 10px;color:#bbf7d0;font-size:12px;font-weight:800}
      .uc-api-tags code{background:#020817;border:1px solid rgba(148,163,184,.2);border-radius:7px;padding:2px 6px;color:#bfdbfe}
      .uc-api-docs a{display:grid;gap:4px;min-width:230px;text-decoration:none;border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.09);border-radius:14px;padding:11px 13px}
      .uc-api-docs b{color:#dbeafe}.uc-api-docs small{color:#93a4bd;line-height:1.4}
      .uc-api-live{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:0 0 18px}
      .uc-api-live article{background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:16px;padding:14px;min-width:0}
      .uc-api-live b{display:block;font-size:26px;color:#f8fafc}.uc-api-live span{display:block;color:#93c5fd;font-weight:900}.uc-api-live small{display:block;color:#93a4bd;line-height:1.4;margin-top:4px}
      .uc-api-toolbar{display:grid;grid-template-columns:minmax(0,1fr) 170px 190px;gap:10px;margin-bottom:14px}
      .uc-api-toolbar input,.uc-api-toolbar select{border:1px solid var(--line,#263754);background:#050a18;color:#dbeafe;border-radius:12px;padding:11px 12px}
      .uc-api-shell{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;align-items:start}
      .uc-api-nav{position:sticky;top:76px;display:grid;gap:8px;background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:18px;padding:14px}
      .uc-api-nav>b{color:#93a4bd;text-transform:uppercase;font-size:11px;letter-spacing:.08em}
      .uc-api-nav button{display:flex;gap:9px;align-items:center;border:1px solid transparent;background:rgba(255,255,255,.035);color:#dbeafe;border-radius:12px;padding:10px;text-align:left;font-weight:800;cursor:pointer}
      .uc-api-nav button:hover{border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08)}
      .uc-api-note{border:1px solid rgba(249,115,22,.28);background:rgba(249,115,22,.08);border-radius:14px;padding:11px;color:#ffedd5}
      .uc-api-note p{margin:5px 0 0;color:#fed7aa;font-size:12px;line-height:1.45}
      .uc-api-main{display:grid;gap:16px}.uc-api-section{background:var(--card,#111c31);border:1px solid var(--line,#263754);border-radius:18px;overflow:hidden}
      .uc-api-section>header{display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-bottom:1px solid var(--line,#263754);background:rgba(255,255,255,.025)}
      .uc-api-icon{width:44px;height:44px;border-radius:13px;background:rgba(16,185,129,.14);display:grid;place-items:center;font-size:22px;flex:0 0 auto}
      .uc-api-section header span{color:#34d399;text-transform:uppercase;font-size:11px;font-weight:900}.uc-api-section h3{margin:4px 0;color:#f8fafc}.uc-api-section p{margin:0;color:#b8c5dc;line-height:1.55}
      .uc-api-endpoints{display:grid;gap:12px;padding:14px}.uc-api-endpoint{border:1px solid #2d3e5d;border-radius:15px;background:#101827;padding:14px}
      .uc-api-endpoint-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center}
      .uc-api-endpoint-head code{background:#020817;border:1px solid #263754;border-radius:9px;padding:7px 9px;color:#dbeafe;overflow:auto;white-space:nowrap}
      .uc-api-endpoint-head em{font-style:normal;border:1px solid rgba(16,185,129,.24);background:rgba(16,185,129,.08);color:#86efac;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900;white-space:nowrap}
      .uc-api-endpoint h4{margin:13px 0 7px;font-size:17px;color:#f8fafc}.uc-api-endpoint p{color:#cbd7ea}
      .uc-api-code-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .uc-api-code-grid div{border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(255,255,255,.03);padding:10px;min-width:0}
      .uc-api-code-grid b{display:block;color:#93c5fd;margin-bottom:7px}.uc-api-code-grid pre{margin:0;overflow:auto;background:#020817;border-radius:10px;padding:10px;max-height:260px}.uc-api-code-grid code{color:#dbeafe;font-size:12px}
      .method.cti{background:#7c3aed}.method.webhook{background:#0891b2}.method.put{background:#d97706}.method.delete{background:#dc2626}
      @media(max-width:1200px){.uc-api-live{grid-template-columns:repeat(3,1fr)}.uc-api-shell{grid-template-columns:1fr}.uc-api-nav{position:relative;top:0}.uc-api-code-grid{grid-template-columns:1fr}}
      @media(max-width:720px){.uc-api-live,.uc-api-toolbar,.uc-api-endpoint-head{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function schedule(){
    setTimeout(render, 80);
    setTimeout(render, 240);
  }

  window.addEventListener('hashchange', schedule);
  window.addEventListener('DOMContentLoaded', schedule);
  schedule();
})();
