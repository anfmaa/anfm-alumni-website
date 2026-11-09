import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/community.js';
function response(){return {code:0,body:null,setHeader(){},status(n){this.code=n;return this;},json(b){this.body=b;return this;}};}
test('API rejects unsupported method and wrong origin',async()=>{let r=response();await handler({method:'DELETE'},r);assert.equal(r.code,405);process.env.SITE_ORIGIN='https://anfmaa.vercel.app';r=response();await handler({method:'POST',headers:{origin:'https://other.example'}},r);assert.equal(r.code,403);});
test('API blocks authenticated actions without a token',async()=>{process.env.SITE_ORIGIN='https://anfmaa.vercel.app';process.env.APPS_SCRIPT_URL='https://script.google.com/example';process.env.BACKEND_SECRET='test-only';const r=response();await handler({method:'POST',headers:{origin:process.env.SITE_ORIGIN},body:{action:'profile'}},r);assert.equal(r.code,401);});
