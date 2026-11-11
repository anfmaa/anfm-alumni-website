/* Paste this file into a Google Apps Script project as Code.gs. */
function properties() { return PropertiesService.getScriptProperties(); }
function db() { return SpreadsheetApp.openById(properties().getProperty('SPREADSHEET_ID')); }
function setup() {
  ['Members','Posts','Audit','Reports','Legacy','Claims','Appointments','Notifications'].forEach(function(name) {
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
function publicMember(m){return {memberType:m.memberType||'alumni',interests:m.interests||'',mentoring:!!m.mentoring,id:m.id,name:m.name,batch:m.batch,stream:m.stream,profession:m.profession,currentPosition:m.currentPosition||'',institution:m.institution||'',location:m.location,bio:m.bio,blood:m.donor?m.blood:'',donor:!!m.donor,phone:m.publicContact?m.phone:'',featured:!!m.featured};}
function live(p){return p.status==='approved' && (!p.deadline || Date.parse(p.deadline)>Date.now());}
function publicPost(p){var q={};['id','type','title','body','authorName','location','blood','units','deadline','paymentInfo','target','contact','featured','updatedAt','imageUrl','imageSource','imageCredit'].forEach(function(k){q[k]=p[k];});return q;}
function dispatch(action,d,actor){
  if(action==='public')return {members:rows('Members').filter(function(m){return m.status==='approved' && m.memberType!=='student';}).map(publicMember),posts:rows('Posts').filter(live).map(publicPost)};
  if(action==='legacySearch')return searchLegacy(d);
  requireValue(actor && actor.id && actor.email,'Sign in required');
  var r=role(actor), staff=r==='admin'||r==='moderator', members=rows('Members'), me=members.find(function(m){return m.id===actor.id;});
  var linked=rows('Legacy').find(function(x){return x.owner===actor.id;});
  var extra=memberActions(action,d,actor,r,me,linked);if(extra!==null)return extra;
  if(action==='me')return {identity:{name:text(actor.name),email:actor.email},role:r,profile:me || null,legacyRecord:linked||null,claims:rows('Claims').filter(function(c){return c.owner===actor.id;}),claimQueue:r==='admin'?rows('Claims').filter(function(c){return c.status==='pending';}).map(function(c){var q=JSON.parse(JSON.stringify(c));q.record=rows('Legacy').find(function(x){return x.id===c.legacyId;});return q;}):[],appointments:rows('Appointments').filter(function(a){return a.sender===actor.id || a.recipient===actor.id;}),notifications:rows('Notifications').filter(function(n){return n.owner===actor.id;}).slice(-50).reverse(),posts:rows('Posts').filter(function(p){return p.owner===actor.id;}),queue:staff?{members:members.filter(function(m){return m.status==='pending';}).map(function(m){var q=JSON.parse(JSON.stringify(m));q.legacyCandidates=legacyMatches(m);return q;}),posts:rows('Posts').filter(function(p){return p.status==='pending';}),reports:rows('Reports').filter(function(p){return p.status==='open';})}:null,members:r==='admin'?members.map(function(m){return {id:m.id,name:m.name,role:m.role || 'member',status:m.status};}):[],audit:r==='admin'?rows('Audit').slice(-100).reverse():[]};
  if(action==='profile'){
    requireValue(text(d.name),'Name is required'); requireValue(text(d.batch),d.memberType==='student'?'Current class is required':'Dakhil batch is required');requireValue(text(d.verification),'Provide alumni verification details');requireValue(d.consent===true,'Consent is required');
    requireValue(!d.claimSelected || linked,'Verify the selected record before completing registration');
    ['dakhilBatch','alimBatch','fazilBatch'].forEach(function(k){requireValue(!text(d[k]) || /^(199[3-9]|20[01][0-9]|202[0-6])$/.test(text(d[k])),'Select a year from 1993 to 2026');});
    if(!['student','former'].includes(d.memberType))requireValue(/^(199[3-9]|20[01][0-9]|202[0-6])$/.test(text(d.batch)),'Select a Dakhil year from 1993 to 2026');
    requireValue(!me || text(d.name)===me.name,'Your name is locked. Contact the administrator for a correction.');
    requireValue(!linked || me || text(d.name)===linked.name,'Use the verified record name. Contact the administrator for a correction.');
    if(['student','former'].includes(d.memberType)){requireValue(text(d.currentClass),'Select your class');requireValue(/^(199[3-9]|20[01][0-9]|202[0-6])$/.test(text(d.attendanceYear)),'Select an attendance year from 1993 to 2026');}
    var m={attendanceYear:text(d.attendanceYear,20),currentClass:['student','former'].includes(d.memberType)?text(d.currentClass||d.batch,40):'',dakhilBatch:text(d.dakhilBatch||(['student','former'].includes(d.memberType)?'':d.batch),20),currentPosition:text(d.currentPosition),institution:text(d.institution),memberType:['student','former'].includes(d.memberType)?d.memberType:'alumni',interests:text(d.interests,300),mentoring:d.mentoring===true,id:actor.id,email:actor.email,name:text(d.name),batch:text(d.batch,20),stream:text(d.stream,50),profession:text(d.profession),location:text(d.location),bio:text(d.bio,2000),phone:text(d.phone,60),blood:text(d.blood,5),donor:d.donor===true,publicContact:d.publicContact===true,verification:text(d.verification,500),legacyId:linked?linked.id:(me?me.legacyId||'':''),claimKey:text(d.claimKey,80),claimBatch:text(d.claimBatch,20),father:text(d.father),permanentAddress:text(d.permanentAddress,500),alimBatch:text(d.alimBatch,20),fazilBatch:text(d.fazilBatch,20),status:'pending',role:me?me.role || 'member':'member',featured:false,updatedAt:now(),version:(me?me.version || 0:0)+1};
    if(m.donor)requireValue(['A+','A-','B+','B-','O+','O-','AB+','AB-'].indexOf(m.blood)>=0,'Select a blood group');
    put('Members',m);audit(actor,'profile.submit',m.id);return {ok:true};
  }
  if(action==='submit'){
    requireValue(me && me.status==='approved','Only verified members may submit posts');
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
    if(d.collection==='Members' && d.status==='approved' && item.claimKey && !item.legacyId){
      requireValue(r==='admin','An admin must verify existing-record claims');
      var matches=legacyMatches(item);requireValue(matches.length===1,'No unique legacy match. Ask member to correct ID and batch.');
      var legacy=matches[0];requireValue(!legacy.owner || legacy.owner===item.id,'This legacy record is already linked');
      requireValue(d.identityChecked===true,'Confirm identity independently against the original record');
      legacy.owner=item.id;legacy.linkedAt=now();put('Legacy',legacy);item.legacyId=legacy.id;
    }
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
  if(action==='export'){requireValue(r==='admin','Admin access required');audit(actor,'export','all');return {members:rows('Members'),posts:rows('Posts'),reports:rows('Reports'),legacy:rows('Legacy'),claims:rows('Claims'),appointments:rows('Appointments'),notifications:rows('Notifications'),audit:rows('Audit')};}
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
    if(b.action==='public'||b.action==='legacySearch'){var publicCache=CacheService.getScriptCache(),publicKey='public-rate:'+text(b.rateKey,64),publicCount=Number(publicCache.get(publicKey)||0);requireValue(publicCount<60,'Too many requests. Try again in a minute.');publicCache.put(publicKey,String(publicCount+1),60);}
    if(b.action!=='public' && b.action!=='me' && b.actor){var cache=CacheService.getScriptCache(),key='rate:'+b.actor.id,count=Number(cache.get(key)||0);requireValue(count<30,'Too many changes. Wait one minute.');cache.put(key,String(count+1),60);}
    return json(dispatch(b.action,b.data || {},b.actor));
  }catch(err){return json({error:err.message});}finally{if(lock.hasLock())lock.releaseLock();}
}
function json(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function backup(){var folder=DriveApp.getFolderById(properties().getProperty('BACKUP_FOLDER_ID'));DriveApp.getFileById(properties().getProperty('SPREADSHEET_ID')).makeCopy('ANFMAA backup '+now(),folder);}

function normalizeKey(v){return String(v||'').trim().replace(/[০-৯]/g,function(c){return '০১২৩৪৫৬৭৮৯'.indexOf(c);}).replace(/[\s()+-]/g,'').replace(/^00880/,'0').replace(/^880/,'0').toUpperCase();}
function legacyMatches(m){if(!m.claimKey)return [];var key=normalizeKey(m.claimKey);return rows('Legacy').filter(function(x){return (normalizeKey(x.id)===key || normalizeKey(x.phone)===key) && normalizeKey(x.batch)===normalizeKey(m.claimBatch);});}
/* Convert the original XLSX to Google Sheets first. Import is idempotent for an unchanged source row order. Do not sort the source copy. */
function importLegacySource(){
 var lock=LockService.getScriptLock();lock.waitLock(30000);
 try{setup();var sourceId=properties().getProperty('LEGACY_SOURCE_ID');requireValue(sourceId,'Set LEGACY_SOURCE_ID to the converted Google Sheet');
 var sheet=SpreadsheetApp.openById(sourceId).getSheets()[0], data=sheet.getDataRange().getDisplayValues();
 requireValue(data[0][1].indexOf('Name')>=0 && data[0][6].indexOf('Mobile')>=0,'Unexpected source columns; import stopped');
 var existing=rows('Legacy'), count=0;
 data.slice(1).forEach(function(v,i){if(!text(v[1]))return;var id='ANF-'+String(i+1).padStart(6,'0');
 if(existing.some(function(x){return x.sourceId===sourceId && x.sourceRow===i+2;}))return;
 requireValue(!existing.some(function(x){return x.id===id;}),'ID conflict: use the original source copy');
 var record={id:id,sourceId:sourceId,sourceRow:i+2,name:text(v[1]),father:text(v[2]),location:text(v[3]),batch:text(v[4],20),gender:text(v[5]),phone:text(v[6],60),blood:text(v[7],5),profession:text(v[8]),permanentAddress:text(v[9],500),alimBatch:text(v[10],20),fazilBatch:text(v[11],20),owner:''};put('Legacy',record);existing.push(record);count++;});
 return {imported:count,total:rows('Legacy').length};
 }finally{lock.releaseLock();}
}

function searchLegacy(d){
 var name=text(d.name).toLowerCase(),year=normalizeKey(text(d.year,20)),level=text(d.level)||'dakhil',offset=Math.max(0,Math.floor(Number(d.offset)||0));
 var fields={dakhil:'batch',alim:'alimBatch',fazil:'fazilBatch'},members=rows('Members');
 requireValue(fields[level] || /^Class (6|7|8|9|10)$/.test(level),'Select a supported degree or class');
 function matches(x){var value=fields[level]?x[fields[level]]:x.attendanceYear;return (!name||String(x.name).toLowerCase().indexOf(name)>=0)&&(!year||normalizeKey(value)===year)&&(fields[level]?(!d.level||!!text(value)):x.currentClass===level);}
 var found=rows('Legacy').filter(matches).map(function(x){var m=members.find(function(m){return m.legacyId===x.id;});return {id:x.id,name:x.name,batch:x.batch,education:level,year:fields[level]?x[fields[level]]:x.attendanceYear,claimed:!!x.owner,profile:m&&m.status==='approved'&&m.memberType!=='student'?publicMember(m):null};});
 members.filter(function(m){return !m.legacyId && m.status==='approved' && m.memberType!=='student' && matches(m);}).forEach(function(m){found.push({id:m.id,name:m.name,batch:m.batch,education:level,year:fields[level]?m[fields[level]]:m.attendanceYear,claimed:true,profile:publicMember(m)});});
 return {items:found.slice(offset,offset+20),next:offset+20<found.length?offset+20:null};
}
function notice(owner,message,reference){put('Notifications',{id:uid(),owner:owner,message:message,reference:reference,read:false,at:now()});}
function memberActions(action,d,actor,r,me,linked){
 if(action==='claim'){
  requireValue(!linked,'Your account is already linked');requireValue(text(d.evidence),'Provide private verification details');
  var record=rows('Legacy').find(function(x){return x.id===d.id;});requireValue(record,'Select a search result');
  requireValue(!record.owner,'This record cannot be claimed. Contact the administrator.');
  requireValue(!rows('Claims').some(function(c){return c.owner===actor.id && c.status==='pending';}),'You already have a pending verification request');
  var c={id:uid(),owner:actor.id,email:actor.email,legacyId:record.id,name:record.name,evidence:text(d.evidence,500),status:'pending',version:1,at:now()};put('Claims',c);audit(actor,'claim.submit',c.id);return {ok:true};
 }
 if(action==='verifyClaim'){
  requireValue(r==='admin','Admin access required');var c=rows('Claims').find(function(c){return c.id===d.id;});
  requireValue(c && c.status==='pending' && c.version===d.version,'Request changed. Refresh');requireValue(c.owner!==actor.id,'You cannot verify your own identity');
  requireValue(d.noConflict===true && text(d.reason),'Review reason and no-conflict declaration required');requireValue(['approved','rejected'].indexOf(d.status)>=0,'Invalid decision');
  if(d.status==='approved'){
   requireValue(d.identityChecked===true,'Verify identity independently first');var all=rows('Legacy'),record=all.find(function(x){return x.id===c.legacyId;});
   requireValue(record && (!record.owner||record.owner===c.owner),'Record already linked');requireValue(!all.some(function(x){return x.owner===c.owner && x.id!==record.id;}),'Account already linked');
   record.owner=c.owner;record.linkedAt=now();put('Legacy',record);
  }
  c.status=d.status;c.reason=text(d.reason,500);c.version++;put('Claims',c);notice(c.owner,'Identity verification '+d.status+'. '+(d.status==='approved'?'Complete your registration.':c.reason),c.id);audit(actor,'claim.'+d.status,c.id,c.reason);return {ok:true};
 }
 if(action==='appointment'){
  requireValue(me && me.status==='approved','Verified membership required');var recipient=rows('Members').find(function(m){return m.id===d.recipient && m.status==='approved' && m.mentoring;});
  requireValue(recipient && recipient.id!==actor.id,'Select another available mentor');requireValue(text(d.topic) && text(d.message),'Topic and message required');
  var when=Date.parse(d.time);requireValue(Number.isFinite(when)&&when>Date.now(),'Choose a future appointment time');requireValue(text(d.timezone),'Time zone required');
  var existing=rows('Appointments');requireValue(!existing.some(function(a){return a.sender===actor.id && a.recipient===recipient.id && a.status==='pending';}),'A request to this mentor is already pending');
  requireValue(existing.filter(function(a){return a.sender===actor.id && Date.parse(a.at)>Date.now()-86400000;}).length<5,'Maximum five appointment requests per day');
  var a={id:uid(),sender:actor.id,recipient:recipient.id,senderName:me.name,recipientName:recipient.name,topic:text(d.topic,160),message:text(d.message,1000),time:new Date(when).toISOString(),timezone:text(d.timezone,80),status:'pending',version:1,at:now()};
  put('Appointments',a);notice(recipient.id,me.name+' requested career counselling: '+a.topic,a.id);audit(actor,'appointment.request',a.id);return {ok:true};
 }
 if(action==='appointmentReply'){
  var a=rows('Appointments').find(function(a){return a.id===d.id;});requireValue(a && a.version===d.version,'Request changed. Refresh');
  if(d.status==='cancelled')requireValue(a.sender===actor.id && ['pending','accepted'].indexOf(a.status)>=0,'Only the requester can cancel');
  else {requireValue(a.recipient===actor.id && a.status==='pending','Only the recipient can respond');requireValue(['accepted','declined'].indexOf(d.status)>=0,'Invalid response');if(d.status==='accepted')requireValue(Date.parse(a.time)>Date.now(),'The requested time has passed');}
  a.status=d.status;a.reply=text(d.reply,500);a.version++;put('Appointments',a);notice(actor.id===a.sender?a.recipient:a.sender,'Appointment '+a.status+': '+a.topic,a.id);audit(actor,'appointment.'+a.status,a.id);return {ok:true};
 }
 if(action==='readNotification'){var n=rows('Notifications').find(function(n){return n.id===d.id;});requireValue(n && n.owner===actor.id,'Notification not found');n.read=true;put('Notifications',n);return {ok:true};}
 return null;
}
