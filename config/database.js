window.supabaseUrl = "https://vvycnhmvjcxunotqnexr.supabase.co";
window.supabaseAnonKey = "sb_publishable_Sm_mNM-668AMSZYZwsM5Xw_J0O20Ire";

window.createSupabaseClient = function createSupabaseClient() {
  if (!window.supabaseUrl || !window.supabaseAnonKey) {
    throw new Error("ยังไม่ได้ใส่ URL หรือ Key ของ Supabase");
  }
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("โหลด supabase-js ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตหรือลำดับ script");
  }
  return window.supabase.createClient(window.supabaseUrl, window.supabaseAnonKey);
};