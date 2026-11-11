'use strict';
let chosenRecord=null;
$('existingMember').onclick=()=>{$('legacySearchPanel').hidden=false;$('legacyName').focus();};
$('newMember').onclick=()=>{chosenRecord=null;if(account)editProfile();else notify('Sign in below, then select Register / Edit my profile. Choose current student or alumni.');};
async function findRecords(offset=0){
 const result=await api('legacySearch',{name:$('legacyName').value,year:$('legacyYear').value,level:$('legacyLevel').value,offset});
 const container=$('legacyResults');if(!offset)container.replaceChildren();
 container.querySelector('[data-next]')?.remove();
 for(const item of result.items){const c=node('article',undefined,'card');c.append(node('h3',item.name),node('p',(item.education||'Dakhil')+': '+(item.year||item.batch||'Not recorded')));
 if(item.profile){const m=item.profile;c.append(node('p',[m.profession,m.location,m.interests].filter(Boolean).join(' · ')),node('p',m.bio||''));if(m.phone)c.append(node('p',m.phone));if(m.blood)c.append(node('p','Volunteer donor: '+m.blood));}
 c.append(button(item.claimed?'Already registered: sign in':'This is me: complete registration',()=>{if(item.claimed){chosenRecord=null;location.hash='account';$('googleSignIn').scrollIntoView({block:'center'});return notify('Sign in with the Google account linked to this record. For account recovery, contact the association administrator.');}chosenRecord=item;requestIdentity();}));container.append(c);}
 empty(container,'No match. Try another spelling, remove the year, or register as a new member.');
 if(result.next!==null){const more=button('More results',()=>findRecords(result.next));more.dataset.next='true';container.append(more);}
}
$('legacyLevel').onchange=()=>{$('legacyYearLabel').textContent=$('legacyLevel').value.startsWith('Class')?'Attendance year (optional)':'Passing year (optional)';};
$('legacySearchForm').onsubmit=async e=>{e.preventDefault();try{await findRecords();}catch(err){notify(err.message);}};
function requestIdentity(){if(!account)return notify('Profile selected. Sign in, then click Verify selected profile in your dashboard.');if(account.legacyRecord)return notify('Your account already has a verified original record. Complete registration.');
 form('Verify ownership: '+chosenRecord.name,area('evidence','Private verification: years studied, class/roll or teacher reference. Do not upload identity documents.', '',true,500),d=>api('claim',{id:chosenRecord.id,evidence:d.evidence}));
}
let registrationDraft=null;
const yearOptions=[['','Select year / প্রযোজ্য নয়'],...Array.from({length:34},(_,i)=>{const y=String(2026-i);return [y,y];})];
function suggestedField(name,label,value,example,options){return `<label>${esc(label)}<input name="${name}" value="${esc(value||'')}" placeholder="${esc(example)}" list="suggest-${name}" maxlength="200"><datalist id="suggest-${name}">${options.map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist></label>`;}
editProfile=function(){
 if(!account)return notify('Sign in first.');
 if(chosenRecord&&!account.legacyRecord)return requestIdentity();
 const m={name:account.identity?.name||'',...(account.legacyRecord||{}),...(account.profile||{}),...(registrationDraft||{})};
 const student=m.memberType==='student';
 const yearSelect=(name,label,value)=>select(name,label,yearOptions,value||'');
 const classes=[['','Select current class'],...['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Alim 1st year','Alim 2nd year','Fazil 1st year','Fazil 2nd year','Fazil 3rd year'].map(x=>[x,x])];
 form('Complete your member profile / নিবন্ধন সম্পূর্ণ করুন',
 '<p class="full">Your Google account supplies your name and verified email when available. We do not read your Gmail inbox. Fields marked * are required. Your changes stay in this form while you are signed in; submit to save them to your profile.</p>'+select('memberType','Member type *',[['alumni','Alumni / প্রাক্তন শিক্ষার্থী'],['student','Current student / বর্তমান শিক্ষার্থী'],['former','Former student (left before completing)']],m.memberType||'alumni')+
 `<label>Full name *<input name="name" value="${esc(m.name||'')}" required maxlength="200" ${account.profile||account.legacyRecord?'readonly':''}><small>After verification, name corrections require administrator review.</small></label>`+`<label>Google email (private)<input type="email" value="${esc(account.identity?.email||'')}" readonly></label>`+
 yearSelect('dakhilBatch','Dakhil year * for alumni',m.dakhilBatch||(student?'':m.batch))+select('currentClass','Current class * for students',classes,m.currentClass||(student?m.batch:''))+
 yearSelect('attendanceYear','Attendance year (current or last attended)',m.attendanceYear)+yearSelect('alimBatch','Alim year (optional)',m.alimBatch)+yearSelect('fazilBatch','Fazil year (optional)',m.fazilBatch)+
 suggestedField('stream','Stream / বিভাগ',m.stream,'Select or type your stream',['General','Science','Humanities','Business Studies'])+
 suggestedField('profession','Profession',m.profession,'Select or type: Education, Healthcare, Student',['Education','Healthcare','Engineering','Information Technology','Business','Government service','Agriculture','Student','Self-employed','Retired','Other'])+
 '<h3 class="full">Current position and institution / বর্তমান পদ ও প্রতিষ্ঠান</h3>'+
 suggestedField('currentPosition','Current position',m.currentPosition,'e.g. Assistant Teacher / Doctor',['Assistant Teacher','Head Teacher','Doctor','Engineer','Software Developer','Researcher','Business Owner','Student'])+
 suggestedField('institution','Institute / organization name',m.institution,'e.g. Abeda Noor Fazil Madrasah / Dhaka Medical College',[])+
 field('location','Public location (city only)',m.location&&account.profile?m.location:'')+field('phone','Phone (private by default)',m.phone,'tel')+
 suggestedField('interests','Career interests',m.interests,'e.g. Teaching, medicine, computing',['Teaching','Medicine','Computing','Research','Business','Engineering','Public service'])+
 area('bio','About me (optional)',m.bio)+
 '<details class="full"><summary>Additional private details (optional)</summary>'+field('father','Father’s name',m.father)+field('permanentAddress','Permanent address',m.permanentAddress)+'</details>'+
 select('blood','Blood group (optional)',['','A+','A-','B+','B-','O+','O-','AB+','AB-'].map(x=>[x,x||'Not provided']),m.blood)+
 area('verification','Private verification: class/roll or teacher reference *',m.verification||(account.legacyRecord?'Identity already verified by administrator.':''),true,500)+
 check('mentoring','I accept career counselling requests',m.mentoring)+check('donor','List me as a volunteer blood donor',m.donor)+check('publicContact','Publish my phone number',m.publicContact)+check('consent','I consent to association registration and the stated privacy rules (current student profiles stay private) *',m.consent),
 d=>api('profile',{...d,batch:['student','former'].includes(d.memberType)?d.currentClass:d.dakhilBatch,claimSelected:!!account.legacyRecord}).then(x=>{registrationDraft=null;location.hash='account';return x;}));
 const formElement=$('editorForm');
 function updateRequirements(){const isStudent=['student','former'].includes(formElement.elements.memberType.value);formElement.elements.attendanceYear.required=isStudent;formElement.elements.attendanceYear.closest('label').hidden=!isStudent;formElement.elements.dakhilBatch.required=!isStudent;formElement.elements.currentClass.required=isStudent;formElement.elements.currentClass.closest('label').hidden=!isStudent;}
 function retainDraft(){const values=new FormData(formElement);registrationDraft=Object.fromEntries(values);for(const key of ['consent','mentoring','donor','publicContact'])registrationDraft[key]=values.has(key);}
 formElement.oninput=retainDraft;formElement.onchange=()=>{updateRequirements();retainDraft();};updateRequirements();
};
$('editProfile').onclick=()=>editProfile();$('dashboardStory').onclick=()=>editPost();
function requestAppointment(m){
 if(account?.profile?.status!=='approved')return notify('Complete registration and wait for approval before requesting an appointment.');
 form('Career counselling with '+m.name,field('topic','Career topic',account.profile.interests||'','text',true)+area('message','What would you like help with?', '',true,1000)+field('time','Proposed time (your local time)', '', 'datetime-local',true)+field('timezone','Your time zone',Intl.DateTimeFormat().resolvedOptions().timeZone,'text',true),d=>api('appointment',{...d,recipient:m.id,time:new Date(d.time).toISOString()}));
 $('editorForm').querySelector('button[type="submit"]').textContent='Send appointment request';
 $('editorForm').querySelector('p').textContent='The member receives a private in-site notification. Wait for their acceptance; no calendar event or email is sent.';
}
function renderMentors(){const q=$('mentorSearch').value.trim().toLowerCase(),box=$('mentorList');box.replaceChildren();publicData.members.filter(m=>m.mentoring && [m.name,m.profession,m.currentPosition,m.institution,m.interests].join(' ').toLowerCase().includes(q)).forEach(m=>{const c=node('article',undefined,'card');c.append(node('h3',m.name),node('p',[m.currentPosition,m.institution].filter(Boolean).join(' · ')),node('p',m.interests||m.profession||'Career guidance'),button('Request appointment',()=>requestAppointment(m)));box.append(c);});empty(box,'No matching volunteer mentors yet.');}
$('mentorSearch').oninput=renderMentors;
const baseRenderPublic=renderPublic;renderPublic=function(){baseRenderPublic();renderMentors();};
const baseRenderAccount=renderAccount;renderAccount=function(){baseRenderAccount();if(!account)return;
 const identity=$('identityStatus');identity.replaceChildren();
 if(account.legacyRecord){identity.append(node('p','Identity verified. Complete or update your registration using the profile button.'));}
 else if(chosenRecord)identity.append(button('Verify selected profile: '+chosenRecord.name,requestIdentity));
 (account.claims||[]).forEach(c=>identity.append(node('p','Identity request for '+c.name+': '+c.status+(c.reason?' · '+c.reason:''))));
 const claims=$('claimQueue');claims.replaceChildren();for(const c of account.claimQueue||[]){const card=node('article',undefined,'card');card.append(node('h3','Identity request: '+c.name),node('p','Signed-in email: '+c.email),node('p',c.evidence),node('p','Original private record: '+JSON.stringify(c.record,null,2),'pre'));
 const reason=node('textarea');reason.setAttribute('aria-label','Identity review reason');const conflict=document.createElement('input');conflict.type='checkbox';const checked=document.createElement('input');checked.type='checkbox';const l1=node('label'),l2=node('label');l1.append(conflict,document.createTextNode(' No conflict of interest'));l2.append(checked,document.createTextNode(' Identity independently verified using trusted association records'));card.append(reason,l1,l2);
 for(const status of ['approved','rejected'])card.append(button(status,async()=>{await api('verifyClaim',{id:c.id,version:c.version,status,reason:reason.value,noConflict:conflict.checked,identityChecked:checked.checked});await refresh();}));claims.append(card);}
 const notes=$('notifications');notes.replaceChildren();for(const n of account.notifications||[]){const card=node('article',undefined,'card');card.append(node('p',(n.read?'':'Unread: ')+n.message));if(!n.read)card.append(button('Mark read',async()=>{await api('readNotification',{id:n.id});await refresh();}));notes.append(card);}empty(notes,'No notifications yet. Use Refresh to check for replies.');
 const list=$('appointments');list.replaceChildren();for(const a of account.appointments||[]){const card=node('article',undefined,'card');card.append(node('h3',a.topic),node('p',a.senderName+' → '+a.recipientName),node('p',new Date(a.time).toLocaleString()+' (displayed in your local time zone)'),node('p','Requested zone: '+a.timezone),node('p',a.message),node('p','Status: '+a.status+(a.reply?' · '+a.reply:'')));
 const mine=a.sender===(account.profile?.id);if(mine&&['pending','accepted'].includes(a.status))card.append(button('Cancel request',async()=>{await api('appointmentReply',{id:a.id,version:a.version,status:'cancelled'});await refresh();}));if(!mine&&a.status==='pending')for(const status of ['accepted','declined'])card.append(button(status,async()=>{const reply=prompt('Optional response (no sensitive information)');if(reply===null)return;await api('appointmentReply',{id:a.id,version:a.version,status,reply});await refresh();}));list.append(card);}empty(list,'No appointment requests yet.');
};
// Manual refresh avoids continual background requests and third-party notification services.

const originalSignOut=$('signOut').onclick;$('signOut').onclick=()=>{chosenRecord=null;registrationDraft=null;originalSignOut();};
