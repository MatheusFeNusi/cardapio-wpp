const SB_URL = 'https://ukmbexntrxgzxgkvhpfx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbWJleG50cnhnenhna3ZocGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njk2OTUsImV4cCI6MjA5MzE0NTY5NX0.Tq_WsZGMNRDw4Zme9YBuw2i6fJIy6WYz3xFvbdcOmno';
const SBH = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };

async function run() {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/pedidos?select=id,status,nome_cliente,nome_cliente_pedido,created_at&order=created_at.desc&limit=10`,
      { headers: SBH }
    );
    if (!r.ok) throw new Error('Status: ' + r.status);
    const data = await r.json();
    console.log('--- LAST 10 ORDERS ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error fetching orders:', e);
  }
}
run();
