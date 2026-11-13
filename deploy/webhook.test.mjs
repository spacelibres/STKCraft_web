import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHmac} from 'node:crypto';
import {mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('signed main pushes from three allowed repositories persist a deployment request', async () => {
  const dir=mkdtempSync(join(tmpdir(),'stk-webhook-'));
  const secret='integration-test-secret';
  const secretFile=join(dir,'secret');
  const pending=join(dir,'pending');
  writeFileSync(secretFile,secret);
  const port=44000+Math.floor(Math.random()*10000);
  const base=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['--import','tsx','deploy/webhook.ts'],{
    env:{...process.env,WEBHOOK_PORT:String(port),WEBHOOK_SECRET_FILE:secretFile,DEPLOY_PENDING_FILE:pending},stdio:'ignore',
  });
  try {
    let ready=false;
    for(let n=0;n<100;n++) {
      try {if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.ok(ready,'receiver starts');
    const deliver=async(repo,ref='refs/heads/main',signature=true,event='push')=>{
      const body=JSON.stringify({ref,repository:{full_name:repo}});
      return fetch(base+'/webhook',{method:'POST',headers:{'x-github-event':event,'x-hub-signature-256':signature?'sha256='+createHmac('sha256',secret).update(body).digest('hex'):'invalid'},body});
    };
    assert.equal((await deliver('spacelibres/STKCraft_web','refs/heads/main',false)).status,401);
    assert.equal((await deliver('someone/other')).status,204);
    assert.equal((await deliver('spacelibres/STKCraft_web','refs/heads/feature')).status,204);
    assert.equal(existsSync(pending),false);
    for(const repo of ['STKCraft_web','STKCraft-Geocalc','STKCraft-time']) {
      assert.equal((await deliver('spacelibres/'+repo)).status,202);
      assert.equal(existsSync(pending),true);
    }
    assert.equal((await deliver('spacelibres/STKCraft_web','refs/heads/main',true,'ping')).status,200);
    assert.equal((await fetch(base+'/api/visitors')).status,401);
  } finally {
    child.kill();
    await new Promise(resolve=>child.once('exit',resolve));
    rmSync(dir,{recursive:true,force:true});
  }
});
