// db.js — Supabase-backed shared game state
// Loaded AFTER the supabase-js CDN script and BEFORE app.js

const SUPABASE_URL = 'https://woadbnpodnubevgbbqyh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gHYtcMDZE1A05ik00uc3ig_kBcNw4fE';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DB {
  constructor(telegramId, username) {
    this.tid = telegramId;
    this.username = username;
  }

  async ensureProfile() {
    const { error } = await sb.rpc('ensure_profile', {
      p_telegram_id: this.tid,
      p_username: this.username
    });
    if (error) console.error('ensureProfile error', error);
  }

  async getProfile() {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('telegram_id', this.tid)
      .single();
    if (error) { console.error('getProfile error', error); return null; }
    return data;
  }

  // Returns {shards, dust, level, leveled_up} or null if rate-limited/error
  async tap() {
    const { data, error } = await sb.rpc('register_tap', { p_telegram_id: this.tid });
    if (error) { console.error('tap error', error); return null; }
    return data && data[0] ? data[0] : null;
  }

  async claimDaily() {
    const { data, error } = await sb.rpc('claim_daily', { p_telegram_id: this.tid });
    if (error) { console.error('claimDaily error', error); return null; }
    return data && data[0] ? data[0] : null;
  }

  async claimGiftReward() {
    const { data, error } = await sb.rpc('claim_gift_reward', { p_telegram_id: this.tid });
    if (error) { console.error('claimGiftReward error', error); return null; }
    return data && data[0] ? data[0] : null;
  }

  async getStock() {
    const { data, error } = await sb.from('item_stock').select('*');
    if (error) { console.error('getStock error', error); return []; }
    return data;
  }

  async getInventory() {
    const { data, error } = await sb
      .from('inventory')
      .select('*')
      .eq('telegram_id', this.tid)
      .order('acquired_at', { ascending: false });
    if (error) { console.error('getInventory error', error); return []; }
    return data;
  }

  async getLeaderboard() {
    const { data, error } = await sb.rpc('get_leaderboard');
    if (error) { console.error('getLeaderboard error', error); return []; }
    return data;
  }

  // Create a payment reservation. Does NOT grant the item — an item is
  // only granted by the server-side webhook once it independently
  // verifies the payment. Requires Phase 2 (bot token / TON API key).
  async createPendingOrder(orderId, itemId, method, amount, tonPayload = null) {
    const { error } = await sb.from('pending_orders').insert({
      order_id: orderId,
      telegram_id: this.tid,
      item_id: itemId,
      method,
      amount,
      ton_payload: tonPayload
    });
    if (error) { console.error('createPendingOrder error', error); return false; }
    return true;
  }

  async getOrderStatus(orderId) {
    const { data, error } = await sb
      .from('pending_orders')
      .select('status')
      .eq('order_id', orderId)
      .single();
    if (error) return null;
    return data.status;
  }
}

