const LOJA_LAT = -23.4520408;
const LOJA_LNG = -46.6996929;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcTaxaPorKm(km) {
  if (km <= 2) return 5;
  if (km <= 3) return 6;
  if (km <= 4) return 8;
  if (km <= 5) return 10;
  if (km <= 6) return 12;
  if (km <= 7) return 14;
  if (km <= 8) return 16;
  return null;
}

function cleanAddress(addr) {
  let cleaned = addr;
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/(?:,\s*)?(?:apto|apt|apartamento|casa|bloco|bl|sobrado|fundos|sala|andar|nº|num)\s*[a-zA-Z0-9-]+\b/gi, '');
  cleaned = cleaned.replace(/(?:,\s*)?(?:fundos|sobrado)\b/gi, '');

  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const firstPart = parts[0].trim();
    if (/\d/.test(firstPart) || firstPart.length > 10) {
      cleaned = firstPart;
    } else {
      cleaned = cleaned.replace(/-/g, ' ');
    }
  }

  cleaned = cleaned.replace(/\d{5}-\d{3}/g, '');
  cleaned = cleaned.replace(/\d{8}/g, '');
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  const hasCityOrState = /\b(sp|s[aã]o\s+paulo)\b/i.test(cleaned);
  if (!hasCityOrState) {
    cleaned += ', São Paulo, SP';
  }

  return cleaned;
}

async function testAddress(address) {
  const query = cleanAddress(address);
  const viewbox = "-46.85,-23.30,-46.55,-23.60";
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=0&limit=1`;
  console.log(`\nAddress: "${address}"`);
  console.log(`Cleaned Query: "${query}"`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AcarajeDaBaiana-Cardapio/1.0'
      }
    });
    if (!response.ok) {
      console.log(`Nominatim error: ${response.status}`);
      return;
    }
    const data = await response.json();
    if (!data || data.length === 0) {
      console.log('Result: NOT FOUND (Show alert & Block order)');
      return;
    }
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    const dist = haversineKm(LOJA_LAT, LOJA_LNG, lat, lng);
    const taxa = calcTaxaPorKm(dist);
    console.log(`Result: ${data[0].display_name} (${lat}, ${lng})`);
    console.log(`Distance: ${dist.toFixed(2)} km`);
    if (taxa === null) {
      console.log(`Status: OUTSIDE AREA (Show alert & Block order)`);
    } else {
      console.log(`Status: ALLOWED (Taxa: R$ ${taxa.toFixed(2)})`);
    }
  } catch (err) {
    console.log(`Fetch error: ${err.message}`);
  }
}

async function run() {
  console.log('=== RUNNING VERIFICATION TEST SUITE ===');
  
  // Test case 1: SP substring in street name (should add suffix and resolve)
  await testAddress('Rua do Bispo, 100');
  await testAddress('Rua da Esperança, 200');
  
  // Test case 2: Address outside delivery area but in SP (should resolve but be blocked)
  await testAddress('Rua Flores do Piauí, 100'); // Itaquera (~26km)
  
  // Test case 3: Address in neighboring city (should resolve but be blocked)
  await testAddress('Rua Dona Primitiva Vianco, 100 - Osasco');
  
  // Test case 4: gibberish (should show alert / not found)
  await testAddress('asdfasdfasdf');
  
  // Test case 5: Close address (should be allowed)
  await testAddress('Avenida Deputado Cantídio Sampaio, 3000');
}

run();
