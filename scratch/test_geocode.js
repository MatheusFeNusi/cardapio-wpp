const LOJA_LAT = -23.5771994;
const LOJA_LNG = -46.8047739;

function cleanAddress(addr) {
  let c = addr;
  c = c.replace(/\([^)]*\)/g, '');
  
  c = c.replace(/(?:,\s*)?(?:apto|apt|apartamento|casa|bloco|bl|sobrado|fundos|sala|andar|nº|num)\s*[a-zA-Z0-9-]+\b/gi, '');
  c = c.replace(/(?:,\s*)?(?:fundos|sobrado)\b/gi, '');

  if (c.includes('-')) {
    const parts = c.split('-');
    // Procurar a primeira parte que contém dígitos (número da casa)
    const partWithNumber = parts.find(part => /\d/.test(part));
    if (partWithNumber) {
      c = partWithNumber.trim();
    } else {
      c = c.replace(/-/g, ' ');
    }
  }

  c = c.replace(/\d{5}-\d{3}/g, '').replace(/\d{8}/g, '');
  c = c.trim().replace(/\s+/g, ' ');

  const hasCityOrState = /\b(sp|s[aã]o\s+paulo)\b/i.test(c);
  if (!hasCityOrState) {
    c += ', São Paulo, SP';
  }

  return c;
}

async function testAddress(address) {
  const query = cleanAddress(address);
  const viewbox = "-46.85,-23.30,-46.55,-23.60";
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=0&limit=1&email=matheusfenusi@gmail.com`;
  console.log(`\nOriginal: "${address}"`);
  console.log(`Cleaned:  "${query}"`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AcarajeDaBaiana-Cardapio/1.0'
      }
    });
    const data = await response.json();
    if (!data || data.length === 0) {
      console.log('Result: NOT FOUND');
      return;
    }
    console.log(`Result:  ${data[0].display_name} (${data[0].lat}, ${data[0].lon})`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

async function run() {
  console.log('=== TESTING NEW CLEANING LOGIC ===');
  
  // User's case:
  await testAddress('Espaço Helena Fanger - Rua Cônego Manuel Vaz, 651 - Santana, São Paulo - SP, 02019-050');
  
  // Standard format:
  await testAddress('Rua Voluntários da Pátria, 1200 - Santana');
  
  // With complement:
  await testAddress('Avenida Deputado Cantídio Sampaio, 4344 - apto 22 - Brasilândia');
  
  // Simple format:
  await testAddress('Rua do Bispo, 100');
  
  // No number (CEP as only digits):
  await testAddress('Rua sem número - 02019-050');
}

run();
