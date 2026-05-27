const SB_URL = 'https://ukmbexntrxgzxgkvhpfx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbWJleG50cnhnenhna3ZocGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njk2OTUsImV4cCI6MjA5MzE0NTY5NX0.Tq_WsZGMNRDw4Zme9YBuw2i6fJIy6WYz3xFvbdcOmno';
const SBH = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

async function run() {
  const ids = [
    '102f47e3-f89e-48b0-8289-372cf909739f',
    'e74d2e76-cd62-4570-a916-3de98df64fa6',
    '58697fde-d50b-4817-87f1-587426f55f9f'
  ];
  try {
    for (const id of ids) {
      console.log('Updating order', id, 'to entregue...');
      const r = await fetch(`${SB_URL}/rest/v1/pedidos?id=eq.${id}`, {
        method: 'PATCH',
        headers: SBH,
        body: JSON.stringify({ status: 'entregue' })
      });
      if (r.ok) {
        console.log(`Order ${id} successfully marked as entregue.`);
      } else {
        console.error(`Failed to update order ${id}. Status:`, r.status);
      }
    }
  } catch (e) {
    console.error('Error during cleanup:', e);
  }
}
run();
