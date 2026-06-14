const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../.cloudflare/server-functions/default/handler.mjs');
if (!fs.existsSync(filePath)) {
  console.error('Error: handler.mjs not found at', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let patched = false;

// PATCH 1: loadInstrumentationModule
const searchStr1 = 'async loadInstrumentationModule(){if(!this.serverOptions.dev)try{this.instrumentation=await(0,_instrumentationglobalsexternal.getInstrumentationModule)(';
const patchStr1 = 'async loadInstrumentationModule(){return;if(!this.serverOptions.dev)try{this.instrumentation=await(0,_instrumentationglobalsexternal.getInstrumentationModule)(';

if (content.includes(searchStr1)) {
  content = content.replace(searchStr1, patchStr1);
  patched = true;
  console.log('Successfully patched loadInstrumentationModule in handler.mjs');
} else {
  const regex1 = /async loadInstrumentationModule\(\)\s*\{\s*if\s*\(\s*!this\.serverOptions\.dev\s*\)\s*try\s*\{\s*this\.instrumentation\s*=\s*await\s*\(\s*0\s*,\s*\w+\.getInstrumentationModule\)\(/;
  if (regex1.test(content)) {
    content = content.replace(regex1, (match) => match.replace('{', '{return;'));
    patched = true;
    console.log('Successfully patched loadInstrumentationModule using regex in handler.mjs');
  }
}

// PATCH 2: getInstrumentationModule
const searchStr2 = 'async function getInstrumentationModule(e2,t2){if(cachedInstrumentationModule)return cachedInstrumentationModule;';
const patchStr2 = 'async function getInstrumentationModule(e2,t2){return null;if(cachedInstrumentationModule)return cachedInstrumentationModule;';

if (content.includes(searchStr2)) {
  content = content.replace(searchStr2, patchStr2);
  patched = true;
  console.log('Successfully patched getInstrumentationModule in handler.mjs');
} else {
  const regex2 = /async function getInstrumentationModule\(\w+,\w+\)\{if\(cachedInstrumentationModule\)return cachedInstrumentationModule;/;
  if (regex2.test(content)) {
    content = content.replace(regex2, (match) => match.replace('{', '{return null;'));
    patched = true;
    console.log('Successfully patched getInstrumentationModule using regex in handler.mjs');
  }
}

// PATCH 3: loadCustomCacheHandlers ReferenceError (Global replacement)
// Reemplaza toda la definición del método para evitar ReferenceError en variables minificadas no declaradas
const regex3 = /async loadCustomCacheHandlers\(([^)]*)\)\s*\{([\s\S]+?)\}async getIncrementalCache/g;

if (regex3.test(content)) {
  const count = (content.match(regex3) || []).length;
  content = content.replace(regex3, (match, args) => {
    return `async loadCustomCacheHandlers(${args}) {
  const handlersSymbol = Symbol.for("@next/cache-handlers");
  const handlersMapSymbol = Symbol.for("@next/cache-handlers-map");
  const handlersSetSymbol = Symbol.for("@next/cache-handlers-set");
  globalThis[handlersMapSymbol] = new Map();
  globalThis[handlersMapSymbol].set("default", require_composable_cache().default);
  globalThis[handlersMapSymbol].set("remote", require_composable_cache().default);
  globalThis[handlersSetSymbol] = new Set(globalThis[handlersMapSymbol].values());
  return;
}async getIncrementalCache`;
  });
  patched = true;
  console.log(`Successfully patched ${count} occurrences of loadCustomCacheHandlers ReferenceError in handler.mjs`);
} else {
  console.warn('Warning: Could not find loadCustomCacheHandlers pattern for global patching.');
}

if (patched) {
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.warn('Warning: No patches were applied to handler.mjs.');
}
