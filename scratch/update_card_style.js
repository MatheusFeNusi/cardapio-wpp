const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

// Update CSS
content = content.replace(/\.products \{[\s\S]*?\}/, `.products {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 0 1.5rem 2.5rem;
    }`);

content = content.replace(/\.product-card \{[\s\S]*?\}/, `.product-card {
      background: var(--white);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 0 var(--border);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .product-card.added-anim {
      transform: scale(0.95);
      box-shadow: 0 0 0 var(--border);
      border-color: var(--success);
    }
    .badge-novo {
      position: absolute;
      top: 8px;
      left: 8px;
      background: var(--amber);
      color: var(--white);
      font-size: 0.7rem;
      font-weight: 900;
      padding: 0.3rem 0.5rem;
      border-radius: 8px 8px 8px 0;
      z-index: 2;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }`);

content = content.replace(/\.product-img \{[\s\S]*?\}/, `.product-img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: contain;
      display: block;
      background: #F3E8D6; /* Cream color for image background */
      border-bottom: 1px solid var(--border);
      padding: 0.5rem;
    }`);

content = content.replace(/\.product-img-placeholder \{[\s\S]*?\}/, `.product-img-placeholder {
      width: 100%;
      aspect-ratio: 1;
      background: #F3E8D6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3.5rem;
      border-bottom: 1px solid var(--border);
    }`);

content = content.replace(/\.product-info \{[\s\S]*?\}/, `.product-info {
      padding: 1rem 0.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: var(--white);
    }`);

content = content.replace(/\.product-name \{[\s\S]*?\}/, `.product-name {
      font-size: 1rem;
      font-weight: 900;
      color: var(--dark);
      line-height: 1.2;
    }`);

content = content.replace(/\.product-desc \{[\s\S]*?\}/, `.product-desc { display: none; }`);
content = content.replace(/\.product-price \{[\s\S]*?\}/, `.product-price { display: none; }`);
content = content.replace(/\.add-btn \{[\s\S]*?\}/, `.add-btn { display: none; }`);


// Update JS HTML generation
content = content.replace(/card\.className = 'product-card';/, `card.className = 'product-card';
          card.onclick = () => addToCart(p.id);`);

content = content.replace(/card\.innerHTML = \`([\s\S]*?)\`;/, `card.innerHTML = \`
        <div class="badge-novo">NOVO</div>
        \${imgHtml}
        <div class="product-img-placeholder" style="\${placeholderStyle}">\${p.emoji}</div>
        <div class="product-info">
          <div class="product-name">\${p.nome}</div>
          \${p.descricao ? \`<div class="product-desc">\${p.descricao}</div>\` : ''}
          <div class="product-price">R$\${parseFloat(p.preco).toFixed(2).replace('.', ',')}</div>
        </div>
      \`;`);


// Update addToCart function
content = content.replace(/const btn = document\.getElementById\('add-' \+ id\);[\s\S]*?}/, `const cardEl = document.getElementById('card-' + id);
      if (cardEl) {
        cardEl.classList.add('added-anim');
        setTimeout(() => { cardEl.classList.remove('added-anim'); }, 200);
      }
      // Show toast manually or let cart UI show
      const f = document.getElementById('floatBar');
      if(f) {
        f.style.transform = 'translateX(-50%) scale(1.1)';
        setTimeout(() => f.style.transform = 'translateX(-50%)', 200);
      }`);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated index.html layout to exactly match screenshot.');
