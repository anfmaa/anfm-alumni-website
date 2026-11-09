/* Paste this file into a Google Apps Script project as Code.gs. */
function properties() { return PropertiesService.getScriptProperties(); }
function db() { return SpreadsheetApp.openById(properties().getProperty('SPREADSHEET_ID')); }
function setup() {
  ['Members','Posts','Audit','Reports'].forEach(function(name) {
    var s=db().getSheetByName(name) || db().insertSheet(name);
    if (!s.getLastRow()) s.appendRow(['id','json']);
  });
}
function rows(name) { var s=db().getSheetByName(name); if (!s) throw Error('Run setup first'); return s.getLastRow()<2 ? [] : s.getRange(2,2,s.getLastRow()-1,1).getValues().map(function(r){return JSON.parse(r[0]);}); }
function put(name, record) {
  var s=db().getSheetByName(name), all=rows(name), i=all.findIndex(function(r){return r.id===record.id;});
  s.getRange(i<0?s.getLastRow()+1:i+2,1,1,2).setValues([[record.id,JSON.stringify(record)]]);
}
function uid(){ return Utilities.getUuid(); }
function now(){return new Date().toISOString();}
function audit(actor,action,target,reason){put('Audit',{id:uid(),actor:actor.id,action:action,target:target,reason:reason || '',at:now()});}
function text(v,max){return String(v || '').trim().slice(0,max || 200);}
function requireValue(v,msg){if(!v)throw Error(msg);}
function role(actor){
  var admins=(properties().getProperty('ADMIN_EMAILS') || '').toLowerCase().split(',').map(function(s){return s.trim();});
  if(admins.indexOf(actor.email.toLowerCase())>=0)return 'admin';
  var m=rows('Members').find(function(x){return x.id===actor.id;});
  return m && m.role==='moderator' ? 'moderator' : 'member';
}
function publicMember(m){return {id:m.id,name:m.name,batch:m.batch,stream:m.stream,profession:m.profession,location:m.location,bio:m.bio,blood:m.donor?m.blood:'',donor:!!m.donor,phone:m.publicContact?m.phone:'',featured:!!m.featured};}
function live(p){return p.status==='approved' && (!p.deadline || Date.parse(p.deadline)>Date.now());}
function publicPost(p){var q={};['id','type','title','body','authorName','location','blood','units','deadline','paymentInfo','target','contact','featured','updatedAt','imageUrl','imageSource','imageCredit'].forEach(function(k){q[k]=p[k];});return q;}
function dispatch(action,d,actor){
  if(action==='public')return {members:rows('Members').filter(function(m){return m.status==='approved';}).map(publicMember),posts:rows('Posts').filter(live).map(publicPost)};
  requireValue(actor && actor.id && actor.email,'Sign in required');
  var r=role(actor), staff=r==='admin'||r==='moderator', members=rows('Members'), me=members.find(function(m){return m.id===actor.id;});
  if(action==='me')return {role:r,profile:me || null,posts:rows('Posts').filter(function(p){return p.owner===actor.id;}),queue:staff?{members:members.filter(function(m){return m.status==='pending';}),posts:rows('Posts').filter(function(p){return p.status==='pending';}),reports:rows('Reports').filter(function(p){return p.status==='open';})}:null,members:r==='admin'?members.map(function(m){return {id:m.id,name:m.name,role:m.role || 'member',status:m.status};}):[],audit:r==='admin'?rows('Audit').slice(-100).reverse():[]};
  if(action==='profile'){
    requireValue(text(d.name),'Name is required'); requireValue(text(d.batch),'Batch is required');requireValue(text(d.verification),'Provide alumni verification details');requireValue(d.consent===true,'Consent is required');
    var m={id:actor.id,email:actor.email,name:text(d.name),batch:text(d.batch,20),stream:text(d.stream,50),profession:text(d.profession),location:text(d.location),bio:text(d.bio,2000),phone:text(d.phone,60),blood:text(d.blood,5),donor:d.donor===true,publicContact:d.publicContact===true,verification:text(d.verification,500),status:'pending',role:me?me.role || 'member':'member',featured:false,updatedAt:now(),version:(me?me.version || 0:0)+1};
    if(m.donor)requireValue(['A+','A-','B+','B-','O+','O-','AB+','AB-'].indexOf(m.blood)>=0,'Select a blood group');
    put('Members',m);audit(actor,'profile.submit',m.id);return {ok:true};
  }
  if(action==='submit'){
    requireValue(me && me.status==='approved','Only verified alumni may submit posts');
    requireValue(['story','blood','fundraiser','campaign'].indexOf(d.type)>=0,'Invalid post type');
    requireValue(text(d.title) && text(d.body),'Title and description are required');requireValue(d.consent===true,'Confirm permission to publish');
    var old=d.id?rows('Posts').find(function(p){return p.id===d.id;}):null;
    if(d.id)requireValue(old && old.owner===actor.id,'You can edit only your own posts');
    if(old)requireValue(old.version===d.version,'Post changed. Refresh before editing.');
    var p={id:old?old.id:uid(),owner:actor.id,authorName:me.name,type:d.type,title:text(d.title,160),body:text(d.body,8000),location:text(d.location),blood:text(d.blood,5),units:text(d.units,20),deadline:text(d.deadline,40),contact:text(d.contact,200),paymentInfo:text(d.paymentInfo,1500),target:text(d.target,80),evidence:text(d.evidence,1500),imageUrl:text(d.imageUrl,1000),imageSource:text(d.imageSource,1000),imageCredit:text(d.imageCredit,200),status:'pending',featured:false,version:old?old.version+1:1,updatedAt:now()};
    if(p.imageUrl){requireValue(/^https:\/\//.test(p.imageUrl) && /^https:\/\//.test(p.imageSource) && p.imageCredit,'Images require HTTPS image/source links and credit');}
    if(p.deadline)requireValue(Number.isFinite(Date.parse(p.deadline)) && Date.parse(p.deadline)>Date.now(),'Deadline must be in the future');
    if(p.type!=='story')requireValue(p.contact && p.deadline,'Contact and deadline are required');
    if(p.type==='blood')requireValue(p.location && ['A+','A-','B+','B-','O+','O-','AB+','AB-'].indexOf(p.blood)>=0 && Number(p.units)>0,'Provide hospital/location, blood group and units');
    if(p.type==='fundraiser')requireValue(p.paymentInfo && p.target && p.evidence,'Provide target, payment instructions and verification evidence');
    put('Posts',p);audit(actor,'post.submit',p.id);return {ok:true,id:p.id};
  }
  if(action==='review'){
    requireValue(staff,'Moderator access required');requireValue(['Members','Posts'].indexOf(d.collection)>=0,'Invalid collection');
    var item=rows(d.collection).find(function(x){return x.id===d.id;});requireValue(item,'Record not found');
    requireValue((item.owner || item.id)!==actor.id,'You cannot review your own submission');
    requireValue(item.status==='pending' && item.version===d.version,'Record changed. Refresh the queue');
    requireValue(['approved','rejected'].indexOf(d.status)>=0,'Invalid decision');requireValue(text(d.reason),'A review reason is required');requireValue(d.noConflict===true,'Confirm no conflict of interest');
    item.status=d.status;item.reason=text(d.reason,1000);item.reviewedBy=actor.id;item.version++;item.updatedAt=now();put(d.collection,item);audit(actor,'review.'+d.status,item.id,item.reason);return {ok:true};
  }
  if(action==='feature'){
    requireValue(r==='admin','Admin access required');requireValue(['Members','Posts'].indexOf(d.collection)>=0,'Invalid collection');
    var f=rows(d.collection).find(function(x){return x.id===d.id;});requireValue(f && f.status==='approved','Only approved items may be featured');f.featured=d.featured===true;put(d.collection,f);audit(actor,'feature',f.id);return {ok:true};
  }
  if(action==='role'){
    requireValue(r==='admin','Admin access required');requireValue(['member','moderator'].indexOf(d.role)>=0,'Invalid role');var member=members.find(function(m){return m.id===d.id;});requireValue(member && member.status==='approved','Select an approved member');member.role=d.role;put('Members',member);audit(actor,'role.'+d.role,member.id);return {ok:true};
  }
  if(action==='close'){
    var post=rows('Posts').find(function(p){return p.id===d.id;});requireValue(post && (post.owner===actor.id || staff),'Not permitted');requireValue(text(d.reason),'Reason required');post.status='closed';post.featured=false;post.version++;put('Posts',post);audit(actor,'post.close',post.id,text(d.reason));return {ok:true};
  }
  if(action==='report'){
    requireValue(me && me.status==='approved','Verified membership required');requireValue(text(d.reason),'Reason required');requireValue(rows('Posts').some(function(p){return p.id===d.id && live(p);}), 'Published post not found');put('Reports',{id:uid(),post:d.id,reporter:actor.id,reason:text(d.reason,1000),status:'open',at:now()});return {ok:true};
  }
  if(action==='resolveReport'){
    requireValue(staff,'Moderator access required');var report=rows('Reports').find(function(x){return x.id===d.id;});requireValue(report,'Report not found');requireValue(text(d.reason),'Resolution reason required');report.status='resolved';report.resolution=text(d.reason,1000);put('Reports',report);audit(actor,'report.resolve',report.id,report.resolution);return {ok:true};
  }
  if(action==='export'){requireValue(r==='admin','Admin access required');audit(actor,'export','all');return {members:rows('Members'),posts:rows('Posts'),reports:rows('Reports'),audit:rows('Audit')};}
  if(action==='withdrawProfile'){
    requireValue(me,'Profile not found');me.status='withdrawn';me.featured=false;put('Members',me);audit(actor,'profile.withdraw',me.id);return {ok:true};
  }
  throw Error('Unknown action');
}
function doPost(e){
  var lock=LockService.getScriptLock();
  try {
    var b=JSON.parse(e.postData.contents), expected=properties().getProperty('BACKEND_SECRET');
    requireValue(expected && b.secret===expected,'Unauthorized');
    requireValue(lock.tryLock(10000),'Service busy. Try again shortly.');
    if(b.action!=='public' && b.action!=='me' && b.actor){var cache=CacheService.getScriptCache(),key='rate:'+b.actor.id,count=Number(cache.get(key)||0);requireValue(count<30,'Too many changes. Wait one minute.');cache.put(key,String(count+1),60);}
    return json(dispatch(b.action,b.data || {},b.actor));
  }catch(err){return json({error:err.message});}finally{if(lock.hasLock())lock.releaseLock();}
}
function json(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function backup(){var folder=DriveApp.getFolderById(properties().getProperty('BACKUP_FOLDER_ID'));DriveApp.getFileById(properties().getProperty('SPREADSHEET_ID')).makeCopy('ANFMAA backup '+now(),folder);}
