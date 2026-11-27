const endpoint = 'https://www.duamatik.shop/api/bible-notifications';
const deviceKey = 'jw:notifications-device';
const inviteKey = 'jw:notifications-seen';

function mountNotifications() {
  const language = document.documentElement.lang;
  const copy = (tr,en) => language === 'en' ? en : tr;
  const ipad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ios = ipad || /iPhone|iPod/.test(navigator.userAgent);
  const needsInstall = ios && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches;
  const supported = isSecureContext && 'Notification' in window && 'PushManager' in window && Boolean(navigator.serviceWorker);
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  let token = read(deviceKey);
  let publicKey, registration, active, busy;

  const panel = document.createElement('section');
  panel.className = 'profile-group bible-notice-settings';
  panel.setAttribute('aria-labelledby','bible-notice-title');
  panel.innerHTML = `
    <h2 id="bible-notice-title">${copy('Bildirimler','Notifications')}</h2>
    <p>${copy('Günlük Okuma’dan gönderilen duyuruları al.','Get announcements from Daily Reading.')}</p>
    <p class="bible-notice-status" role="status"></p>
    <button type="button" class="ui-button" data-notice-toggle hidden></button>
    <button type="button" class="ui-button" data-notice-retry hidden>${copy('Yeniden dene','Try again')}</button>`;
  const settings = document.querySelector('#page-profile .profile-settings');
  settings.prepend(panel);
  const status = panel.querySelector('[role=status]');
  const toggle = panel.querySelector('[data-notice-toggle]');
  const retry = panel.querySelector('[data-notice-retry]');

  const invite = document.createElement('aside');
  invite.className = 'bible-notice-invite';
  invite.hidden = Boolean(token || read(inviteKey) || (!needsInstall && (!supported || Notification.permission === 'denied')));
  invite.setAttribute('aria-label',copy('Bildirim kurulumu','Notification setup'));
  invite.innerHTML = `
    <a class="ui-button" href="#profile">${copy('Bildirimleri kur','Set up notifications')}</a>
    <button class="ui-button" type="button" data-variant="secondary">${copy('Daha sonra','Later')}</button>`;
  document.querySelector('#page-today').append(invite);
  function dismiss() {
    invite.hidden = true;
    try { localStorage.setItem(inviteKey,'1'); } catch {}
  }
  invite.querySelector('a').addEventListener('click',dismiss);
  invite.querySelector('button').addEventListener('click',dismiss);

  if (needsInstall) {
    status.textContent = copy(
      'Safari’de Paylaş → Ana Ekrana Ekle’yi seç. Ardından Günlük Okuma’yı ana ekrandan aç ve Profil → Bildirimler’e dön.',
      'In Safari, tap Share → Add to Home Screen. Open Daily Reading from the Home Screen and return to Profile → Notifications.');
    return;
  }
  if (!supported) {
    status.textContent = copy('Bu tarayıcı web bildirimlerini desteklemiyor.','This browser does not support web notifications.');
    return;
  }

  const permissionHelp = () => copy('Cihaz veya tarayıcı ayarlarından Günlük Okuma bildirimlerine izin ver.','Allow Daily Reading notifications in your device or browser settings.');
  const connectionError = () => new Error(copy('Bildirim hizmetine ulaşılamadı. Bağlantını kontrol edip yeniden dene.','Could not reach the notification service. Check your connection and try again.'));
  async function request(method,body) {
    const headers = token ? {Authorization:'Bearer '+token} : {};
    if (body) headers['Content-Type'] = 'application/json';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),12000);
    let response, result;
    try {
      response = await fetch(endpoint,{method,headers,body:body && JSON.stringify(body),credentials:'omit',signal:controller.signal});
      result = await response.json();
    } catch { throw connectionError(); }
    finally { clearTimeout(timer); }
    if (!response.ok) throw Object.assign(new Error(result.error),{code:result.code});
    return result;
  }

  async function run(operation) {
    if (busy) return;
    busy = true;
    toggle.disabled = retry.disabled = true;
    try { await operation(); }
    catch (error) { status.textContent = error.name === 'Error' && error.message ? error.message : connectionError().message; }
    finally {
      busy = false;
      toggle.disabled = retry.disabled = false;
      toggle.textContent = active ? copy('Bildirimleri kapat','Turn off notifications') : copy('Bildirimleri aç','Enable notifications');
      toggle.hidden = !publicKey || (!active && Notification.permission === 'denied');
    }
  }

  async function load() {
    if (location.hash !== '#profile' || publicKey || busy) return;
    retry.hidden = true;
    status.textContent = copy('Bildirimler hazırlanıyor…','Getting notifications ready…');
    await run(async () => {
      let timer;
      try {
        const workers = navigator.serviceWorker;
        const [result, worker] = await Promise.race([
          Promise.all([request('GET'), workers.register('./sw.js').then(() => workers.ready)]),
          new Promise((_,reject) => { timer = setTimeout(() => reject(connectionError()),20000); }),
        ]);
        if (!worker.pushManager || !result.publicKey) throw connectionError();
        registration = worker;
        active = result.active;
        publicKey = result.publicKey;
        status.textContent = Notification.permission === 'denied' ? permissionHelp()
          : active ? copy('Bildirimler açık.','Notifications are on.') : '';
      } finally {
        clearTimeout(timer);
        retry.hidden = Boolean(publicKey);
      }
    });
  }

  toggle.addEventListener('click', () => run(async () => {
    const manager = registration.pushManager;
    if (active) {
      await request('DELETE');
      active = false;
      status.textContent = copy('Bildirimler kapatıldı.','Notifications are off.');
      try { await (await manager.getSubscription())?.unsubscribe(); } catch {}
      return;
    }
    if (Notification.permission === 'denied') throw new Error(permissionHelp());
    if (!token) {
      const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2,'0')).join('');
      try { localStorage.setItem(deviceKey,key); }
      catch { throw new Error(copy('Bildirim ayarlarını kaydetmek için tarayıcı depolamasına izin ver.','Allow browser storage to save notification settings.')); }
      token = key;
    }
    const applicationServerKey = Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    const subscribe = () => manager.subscribe({userVisibleOnly:true,applicationServerKey});
    let subscription;
    try {
      if (ios && Notification.permission === 'default') {
        subscription = await subscribe();
      } else {
        const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
        if (permission !== 'granted') throw new Error(permissionHelp());
        subscription = await manager.getSubscription() || await subscribe();
      }
    } catch {
      if (Notification.permission === 'denied') throw new Error(permissionHelp());
      throw new Error(copy('Bildirim izni açılmadı. Tarayıcının izin isteğini onaylayıp tekrar dene.','Notifications are off. Approve the browser prompt and try again.'));
    }
    const save = sub => request('PUT',{subscription:sub.toJSON()});
    try { await save(subscription); }
    catch (error) {
      if (error.code !== 'subscription_conflict') throw error;
      await subscription.unsubscribe();
      await save(await subscribe());
    }
    active = true;
    dismiss();
    status.textContent = copy('Bildirimler açık.','Notifications are on.');
  }));
  retry.addEventListener('click',load);
  addEventListener('hashchange',load);
  load();
}

const settingsReady = () => document.querySelector('#page-profile .profile-settings');
if (settingsReady()) {
  mountNotifications();
} else {
  const ready = new MutationObserver(() => {
    if (!settingsReady()) return;
    ready.disconnect();
    mountNotifications();
  });
  ready.observe(document.querySelector('#page-profile'), {childList:true,subtree:true});
}
