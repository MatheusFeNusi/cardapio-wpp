const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Header
content = content.replace(/padding: 1\.2rem 1\.5rem;([\s\S]*?position: sticky;)/, `padding: 0.6rem 1rem;$1`);
content = content.replace(/\.header-brand \.logo \{\s*font-size: 2rem;\s*\}/, `.header-brand .logo { font-size: 1.5rem; }`);
content = content.replace(/\.header-brand h1 \{\s*font-family: 'Playfair Display', serif;\s*font-size: 1\.4rem;/, `.header-brand h1 { font-family: 'Playfair Display', serif; font-size: 1.2rem;`);

// 2. Cart btn
content = content.replace(/padding: 0\.6rem 1\.2rem;([\s\S]*?cursor: pointer;)/, `padding: 0.4rem 0.8rem;$1`);

// 3. Hero
content = content.replace(/\.hero \{\s*background: var\(--white\);\s*border-bottom: 2px solid var\(--border\);\s*padding: 1\.5rem;/, `.hero {\n      background: var(--white);\n      border-bottom: 2px solid var(--border);\n      padding: 0.8rem 1rem;`);
content = content.replace(/width: 60px;\s*height: 60px;/, `width: 44px;\n      height: 44px;`);
content = content.replace(/font-size: 2rem;\s*flex-shrink: 0;\s*\}/, `font-size: 1.4rem;\n      flex-shrink: 0;\n    }`);
content = content.replace(/\.hero-text h2 \{\s*font-size: 1\.3rem;/, `.hero-text h2 {\n      font-size: 1.1rem;`);
content = content.replace(/\.hero-text p \{\s*font-size: 0\.9rem;/, `.hero-text p {\n      font-size: 0.8rem;`);

// 4. Products grid & padding
content = content.replace(/\.products \{\s*display: grid;\s*grid-template-columns: repeat\(2, 1fr\);\s*gap: 1rem;\s*padding: 0 1\.5rem 2\.5rem;\s*\}/, `.products {\n      display: grid;\n      grid-template-columns: repeat(2, 1fr);\n      gap: 0.6rem;\n      padding: 0 1rem 2.5rem;\n    }`);

// 5. Product Image
content = content.replace(/\.product-img \{\s*width: 100%;\s*aspect-ratio: 1;\s*object-fit: contain;\s*display: block;\s*background: #F3E8D6; \/\* Cream color for image background \*\/\s*border-bottom: 1px solid var\(--border\);\s*padding: 0\.5rem;\s*\}/, `.product-img {\n      width: 100%;\n      aspect-ratio: 1;\n      object-fit: cover;\n      display: block;\n      background: #F3E8D6;\n      border-bottom: 1px solid var(--border);\n    }`);

fs.writeFileSync(file, content, 'utf8');
console.log('Header reduced, product spacing optimized.');
