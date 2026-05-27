async function test() {
  try {
    const url = 'https://acarajevps-n8n.9wtaei.easypanel.host/webhook/acaraje-motoboy-pedidos?token=motoboy@acaraje2025';
    console.log('Fetching from webhook:', url);
    const r = await fetch(url);
    const data = await r.json();
    console.log('Response Status:', r.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error fetching webhook:', e);
  }
}
test();
