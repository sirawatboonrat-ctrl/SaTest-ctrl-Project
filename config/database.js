/* ===== เข้าสู่ระบบหลังบ้าน (Supabase Auth ผ่าน REST — ไม่ต้องโหลดไลบรารีเพิ่ม) =====
   ค่า URL และ publishable key ด้านล่างเป็นค่าเดียวกับในไฟล์ config/database.js */
   (function(){
    var URL = 'https://vvycnhmvjcxunotqnexr.supabase.co';
    var KEY = 'sb_publishable_Sm_mNM-668AMSZYZwsM5Xw_J0O20Ire';
    var STORE = 'ks_auth';
  
    function api(path, o){
      o = o || {};
      var h = {apikey: KEY, 'Content-Type': 'application/json'};
      if(o.token) h.Authorization = 'Bearer ' + o.token;
      return fetch(URL + path, {method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined})
        .then(function(r){ return r.text().then(function(t){ var d = {}; try{ d = JSON.parse(t); }catch(e){} return {ok: r.ok, status: r.status, data: d}; }); });
    }
    function read(){ try{ return JSON.parse(localStorage.getItem(STORE)); }catch(e){ return null; } }
    function clear(){ try{ localStorage.removeItem(STORE); }catch(e){} }
    function write(d){
      var s = {access_token: d.access_token, refresh_token: d.refresh_token,
               expires_at: d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600),
               email: (d.user && d.user.email) || ''};
      try{ localStorage.setItem(STORE, JSON.stringify(s)); }catch(e){}
      return s;
    }
  
    function signIn(email, password){
      return api('/auth/v1/token?grant_type=password', {method: 'POST', body: {email: email, password: password}}).then(function(r){
        if(!r.ok){
          var e = new Error(r.data.msg || r.data.error_description || r.data.message || 'login failed');
          e.code = r.data.error_code || r.data.error || '';
          throw e;
        }
        write(r.data);
        return true;
      });
    }
    function signUp(email, password){
      return api('/auth/v1/signup', {method: 'POST', body: {email: email, password: password}}).then(function(r){
        if(!r.ok){
          var e = new Error(r.data.msg || r.data.error_description || r.data.message || 'signup failed');
          e.code = r.data.error_code || r.data.error || '';
          throw e;
        }
        return true;   /* ไม่เก็บ session: บัญชีใหม่ต้องได้รับอนุมัติก่อนเข้าหลังบ้าน */
      });
    }
    function getSession(){
      var s = read();
      if(!s || !s.access_token) return Promise.resolve(null);
      var step = (s.expires_at * 1000 - Date.now() < 60000)
        ? api('/auth/v1/token?grant_type=refresh_token', {method: 'POST', body: {refresh_token: s.refresh_token}})
            .then(function(r){ if(!r.ok){ clear(); return null; } return write(r.data); })
        : Promise.resolve(s);
      return step.then(function(s2){
        if(!s2) return null;
        return api('/auth/v1/user', {token: s2.access_token}).then(function(r){
          /* เข้าหลังบ้านได้เฉพาะบัญชีที่ผู้ดูแลอนุมัติแล้ว (app_metadata.role = admin) — ผู้ใช้แก้ค่านี้เองไม่ได้ */
          if(r.ok) return Object.assign({}, s2, {admin: !!(r.data.app_metadata && r.data.app_metadata.role === 'admin')});
          if(r.status === 401 || r.status === 403 || r.status === 404){ clear(); return null; }
          return s2;
        });
      });
    }
    function signOut(){
      var s = read(); clear();
      return s ? api('/auth/v1/logout', {method: 'POST', token: s.access_token, body: {}}).catch(function(){}) : Promise.resolve();
    }
    window.ksAuth = {signIn: signIn, signUp: signUp, getSession: getSession, signOut: signOut};
  
    if(/(^|\/)login(\.html)?$/.test(location.pathname)) return;
  
    /* หน้าหลังบ้าน: ซ่อนเนื้อหาไว้จนกว่าจะตรวจสอบว่าเข้าสู่ระบบแล้ว */
    var st = document.createElement('style');
    st.textContent = 'html.ks-guard body{visibility:hidden}';
    document.head.appendChild(st);
    document.documentElement.classList.add('ks-guard');
  
    function toLogin(){
      var page = location.pathname.split('/').pop() || 'admin-home.html';
      if(!/\.html$/.test(page)) page += '.html';
      location.replace('login.html?next=' + encodeURIComponent(page));
    }
    getSession().then(function(s){
      if(s && s.admin) document.documentElement.classList.remove('ks-guard');
      else if(s) location.replace('login.html?pending=1');
      else toLogin();
    }).catch(toLogin);
    window.addEventListener('storage', function(e){ if(e.key === STORE && !e.newValue) toLogin(); });
    document.addEventListener('DOMContentLoaded', function(){
      var b = document.getElementById('logoutBtn');
      if(b) b.addEventListener('click', function(){ signOut().then(toLogin); });
    });
  })();