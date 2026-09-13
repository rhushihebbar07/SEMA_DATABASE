import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  Waves, Menu, X, LogIn, LogOut, ShieldCheck, Building2, Users, CalendarDays,
  Search, Plus, Edit3, Trash2, History, CheckCircle2, Clock3, XCircle,
  MapPin, Phone, Mail, ChevronRight, Upload, Save, UserCheck, UserX,
  Settings2, ClipboardCheck, LayoutDashboard, Eye, LockKeyhole, ArrowRight,
  RefreshCw, Download, FileJson, FileSpreadsheet, BarChart3, Filter, ShieldAlert,
  MessageCircle, Send, Activity, UserRoundCheck, Database, Clock4, UserRound, FileText,
  AlertTriangle, Wifi, WifiOff, MoreVertical, ChevronDown, Sparkles
} from "lucide-react";
import {supabase} from "./supabase";
import "./styles.css";

const emptyCollege={name:"",logo_url:"",location:""};
const emptyContact={hod_name:"",hod_phone:"",hod_email:"",coordinator_name:"",coordinator_phone:"",coordinator_email:"",private_notes:""};
const emptyEvent={name:"",logo_url:"",description:"",current_heads:"",rules:""};
const emptySlot={event_id:"",event_date:"",start_time:"",end_time:"",venue:""};
function fmtTime(value){
  if(!value) return "";
  const raw=String(value);
  const match=raw.match(/^(\d{1,2}):(\d{2})/);
  if(!match) return raw;
  let hour=Number(match[1]);
  const minute=match[2];
  if(Number.isNaN(hour)) return raw;
  const suffix=hour>=12?"PM":"AM";
  hour=hour%12||12;
  return `${hour}:${minute} ${suffix}`;
}


const seedEvents=[
 ["CodeWave","Coding","Number of participants: 2.\nParticipants may use C, Java, or Python.\nBasic knowledge of Data Structures & Algorithms is expected.\nInternet, AI tools, and external assistance are not allowed.\nRound-specific rules will be announced before each round.\nThis is a solo event, and each participant will compete individually.\nParticipants are expected to maintain professional and respectful conduct throughout the event.\nParticipants must follow organizer instructions.\nCheating, unfair practice, or misconduct will result in disqualification.\nJudges and organizers decisions are final.","Hayas : 7483989780\nShashidhara : 7760770725"],
 ["Leviathan","IT Manager","This is a solo event, and each participant will compete individually.\nParticipants are expected to maintain professional and respectful conduct throughout the event.\nParticipants must follow organizer instructions.\nCheating, unfair practice, or misconduct will result in disqualification.\nThe decision of the judges and organizers will be final.","Jathin : 6364058375\nHasth : 7338371775"],
 ["Coral Canvas","Web Design","Participants: 2 participants per team.\nSkills: Knowledge of HTML, CSS & JavaScript is required.\nTasks: Rounds and design tasks will be given on the spot.\nElectronic gadgets are not allowed.\nRules and decisions of the organizers will be final.","Swasthik : 8951192848\nUdith : 8088575178"],
 ["Aqua Byte","IT Quiz","Participants: Each team shall consist of 2 participants.\nTopics: General Knowledge, Technical Knowledge, Programming, IT, Computer Science, and other IT-related topics.\nMobile phones, smartwatches, and electronic gadgets are strictly prohibited.\nJudges decision shall be final and binding.\nMalpractice or violation of rules will lead to disqualification.","Thushar : 7019512573\nPrathiksha : 6363428734"],
 ["Aquaverse","Tech Talk","Each participant will compete individually.\nThe topic for each round will be disclosed a few minutes before it begins.\nJudges decisions are final and binding.\nParticipants must maintain respectful and professional behaviour.\nOffensive language, inappropriate content, cheating, or disrespectful behaviour will lead to immediate disqualification.","Krupa : 8296612368\nHruthika : 9353480749"],
 ["The Mega Pitch","Startup Event","Number of participants: 2.\nParticipants must bring their own laptops.\nThe details of each round will be disclosed on the spot.\nThe judges decision will be final.","Sumanth : 8748059243\nShahavez : 7349342520"],
 ["Tide & Tailor","Fashion Show","Team & Theme: Each team must have 2 members and follow a corporate/professional theme.\nOutfits: formal, business casual, modern office, or power-dressing styles.\nStage Performance: 2+1 minutes on stage; confidence, posture, walking style, and presentation will be judged.\nOutfits must be college-event appropriate and professional. Submit music in advance and report before assigned time.","Prapthi : 9632081932\nPrathiksha : 9483505763"],
 ["Submarine","Photography & Videography","Participants & Equipment: 1 participant per entry. DSLR/mirrorless cameras and smartphones are allowed.\nAll content must be captured within the NMAMIT Nitte campus.\nAI-generated content, stock/pre-shot content, or AI-based replacements are strictly prohibited.\nAll submitted content must be captured during the event and must be the participant's own work.","Goutam : 9242288471\nBhargavi : 9632081787"],
 ["Ocean Enigma","Surprise Event","Team: Each team consists of 2 participants.\nMystery: Event details will be revealed only at the venue.\nSurprise bonus challenges may appear at any time.\nElectronic devices are not allowed.\nSome tasks are time-based; fair play and sportsmanship are required, and judges decisions are final.","Sameeksha : 7676292225\nDheemanth : 9480463974"],
 ["Abyss Arena","Gaming — BGMI","Team: Each team must consist of 4 players.\nEmulators, iPads, and triggers are not allowed; players must bring their own mobile devices and accessories.\nDevices must support the latest game version, with required maps downloaded.\nPlayers should have their own internet connection as a backup.\nMisconduct or unfair play will lead to disqualification, and organizers decisions are final.","Jithesh : 7619168599\nKeerthan : 8792839166"]
];


const EVENT_PROGRAM_MAP={
  "CodeWave":"Coding",
  "Leviathan":"IT Manager",
  "Coral Canvas":"Web Design",
  "Aqua Byte":"IT Quiz",
  "Aquaverse":"Tech Talk",
  "The Mega Pitch":"Startup Event",
  "Tide & Tailor":"Fashion Show",
  "Submarine":"Photography & Videography",
  "Ocean Enigma":"Surprise Event",
  "Abyss Arena":"Gaming / BGMI"
};
const EVENT_ACCOUNT_MAP={
  "CodeWave":"CODEWAVE@NMAMIT.IN",
  "Leviathan":"LEVIATHAN@NMAMIT.IN",
  "Coral Canvas":"CORALCANVAS@NMAMIT.IN",
  "Aqua Byte":"AQUABYTE@NMAMIT.IN",
  "Aquaverse":"AQUAVERSE@NMAMIT.IN",
  "The Mega Pitch":"MEGPITCH@NMAMIT.IN",
  "Tide & Tailor":"TIDETAILOR@NMAMIT.IN",
  "Submarine":"SUBMARINE@NMAMIT.IN",
  "Ocean Enigma":"OCEANENIGMA@NMAMIT.IN",
  "Abyss Arena":"ABYSSARENA@NMAMIT.IN"
};
function programName(eventName){return EVENT_PROGRAM_MAP[eventName]||"Event"}
const OFFICIAL_EVENT_ORDER=["CodeWave","Leviathan","Aqua Byte","Coral Canvas","Aquaverse","The Mega Pitch","Tide & Tailor","Submarine","Ocean Enigma","Abyss Arena"];
const EVENT_PARTICIPANT_COUNTS={"CodeWave":2,"Leviathan":1,"Aqua Byte":2,"Coral Canvas":2,"Aquaverse":1,"The Mega Pitch":2,"Tide & Tailor":2,"Submarine":1,"Ocean Enigma":2,"Abyss Arena":4};
const OFFICIAL_EVENT_ALIASES={
  "CodeWave":["codewave","coding","code wave","coding competition"],
  "Leviathan":["leviathan","it manager","it management"],
  "Aqua Byte":["aqua byte","aquabyte","it quiz","itquiz","quiz"],
  "Coral Canvas":["coral canvas","coralcanvas","web design","web designing"],
  "Aquaverse":["aquaverse","tech talk","paper presentation"],
  "The Mega Pitch":["the mega pitch","mega pitch","megapitch","startup event","business plan","startup/mega pitch"],
  "Tide & Tailor":["tide & tailor","tide and tailor","tidetailor","fashion show","fashion"],
  "Submarine":["submarine","photography & videography","photography and videography","photography","videography"],
  "Ocean Enigma":["ocean enigma","oceanenigma","surprise event","treasure hunt"],
  "Abyss Arena":["abyss arena","abyssarena","gaming","gaming / bgmi","bgmi"]
};
function normalizeEventLabel(value){return String(value||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function officialMeta(event){
  if(!event)return null;
  const name=normalizeEventLabel(event.name);
  const program=normalizeEventLabel(programName(event.name));
  const key=OFFICIAL_EVENT_ORDER.find(k=>{
    const aliases=(OFFICIAL_EVENT_ALIASES[k]||[]).map(normalizeEventLabel);
    return aliases.includes(name)||aliases.includes(program)||normalizeEventLabel(k)===name;
  });
  if(!key)return null;
  return {key,program:EVENT_PROGRAM_MAP[key]||programName(key)};
}
function officialEvents(events){
 const source=events||[];
 const out=[];
 const used=new Set();
 for(const key of OFFICIAL_EVENT_ORDER){
   const aliases=(OFFICIAL_EVENT_ALIASES[key]||[]).map(normalizeEventLabel);
   const match=source.find(e=>{
     if(used.has(e.id))return false;
     const n=normalizeEventLabel(e.name);
     const p=normalizeEventLabel(programName(e.name));
     return aliases.includes(n)||aliases.includes(p)||n===normalizeEventLabel(key);
   });
   if(match){
     used.add(match.id);
     out.push({...match,_officialName:key,_programName:EVENT_PROGRAM_MAP[key]||programName(key),_fallback:false});
   }else{
     const seed=seedEvents.find(x=>x[0]===key);
     if(seed)out.push({
       id:`__brochure_${normalizeEventLabel(key).replace(/ /g,"_")}`,
       name:key,
       logo_url:"",
       description:`Official ${seed[1]} event`,
       current_heads:seed[3],
       rules:seed[2],
       _officialName:key,
       _programName:seed[1],
       _fallback:true
     });
   }
 }
 return out;
}
function displayEventName(event){return event?._officialName||event?.name||"Event"}
function displayProgramName(event){return event?._programName||programName(event?.name)||"Event"}
function safeEventLogo(url){return typeof url==="string"&&/^https?:\/\//i.test(url)?url:""}
function contentText(content,key,fallback){const value=content?.[key];return typeof value==="string"&&value.trim()?value:fallback}

const BROCHURE_GENERAL_RULES=[
"A team should consist of a maximum of 15 members.",
"The fest is open to all MCA students.",
"Teams must confirm their participation through our website: semaphore2k26.in",
"The registration fee is ₹2000 per team.",
"All participants must be present before 8:00 AM.",
"The overall championship will be decided based on the cumulative participation of each team across all events.",
"For the Fashion Show event, participants from other events can also join. However, those participating in IT Manager and Photography cannot participate in any other events.",
"Please check the timetable provided before registering for or participating in any event to avoid schedule clashes.",
"Participants are required to produce their college ID on the fest day.",
"The department/convenor reserves the right to take action in case of any misconduct.",
"The decisions of the judges will be final and binding.",
"For any issues regarding the payment of registration fees, please contact the core committee members.",
"A trophy will be awarded to the overall champions and runners-up.",
"Participants must bring a permission letter from their respective colleges.",
"Participants must bring accessories such as pens, laptops, chargers, etc. themselves."
];
const BROCHURE_COORDINATORS=[
"HOD - MCA — Dr. Mamatha Balipa",
"Assistant Professor GD III — Dr. Roshan D Suvaris",
"PRESIDENT — Vansh Shetty",
"SECRETARY — Vaibhav Jain",
"TECHNICAL COORDINATOR — Nikhil"
];
const BROCHURE_EVENT_RULES={
"CodeWave":["Number of participants: 2","Participants may use any one of the following: C, Java, or Python.","Basic knowledge of Data Structures & Algorithms is expected.","Internet, AI tools, and external assistance are not allowed.","Round-specific rules will be announced before each round.","This is a solo event, and each participant will compete individually.","Participants are expected to maintain professional and respectful conduct throughout the event.","Participants must follow the instructions given by the organizers during each round.","Any form of cheating, unfair practice, or misconduct will result in disqualification.","The decision of the judges and organizers will be final."],
"Leviathan":["This is a solo event, and each participant will compete individually.","Participants are expected to maintain professional and respectful conduct throughout the event.","Participants must follow the instructions given by the organizers during each round.","Any form of cheating, unfair practice, or misconduct will result in disqualification.","The decision of the judges and organizers will be final."],
"Coral Canvas":["Participants: 2 participants per team.","Skills: Knowledge of HTML, CSS & JavaScript is required.","Tasks: Rounds and design tasks will be given on the spot.","Gadgets: Electronic gadgets are not allowed.","Decision: Rules and decisions of the organizers will be final."],
"Aqua Byte":["Participants: Each team shall consist of 2 participants.","Topics: Questions will cover General Knowledge, Technical Knowledge, Programming, IT, Computer Science, and other IT-related topics.","Gadgets: Mobile phones, smartwatches, and electronic gadgets are strictly prohibited.","Decision: The judges’ decision shall be final and binding.","Disqualification: Malpractice or violation of rules will lead to disqualification."],
"Aquaverse":["Participants: Each participant will compete individually.","Topics: The topic for each round will be disclosed a few minutes before it begins.","Decision: Judges’ decisions are final and binding.","Conduct: Participants must maintain respectful and professional behaviour.","Disqualification: Offensive language, inappropriate content, cheating, or disrespectful behaviour will lead to immediate disqualification."],
"The Mega Pitch":["Event Rules — Number of participants: 2.","Participants must bring their own laptops.","The details of each round will be disclosed on the spot.","The judges’ decision will be final."],
"Tide & Tailor":["Team & Theme: Each team must have 2 members and follow a corporate/professional theme.","Outfits: Wear formal, business casual, modern office, or power-dressing styles, with coordination between both members.","Stage Performance: 2+1 minutes on stage; confidence, posture, walking style, and overall presentation will be judged.","Event Requirements: Outfits must be college-event appropriate and professional. Submit music in advance, report before your assigned time, and judges’ decision is final."],
"Submarine":["Participants & Equipment: 1 participant per entry. DSLR/mirrorless cameras and Smartphones are allowed.","Location: All content must be captured within the NMAMIT Nitte campus.","Content Policy: AI-generated content, stock/pre-shot content, or AI-based replacements are strictly prohibited and may lead to disqualification.","Originality: All submitted content must be captured during the event and must be the participant’s own work."],
"Ocean Enigma":["Team: Each team consists of 2 participants.","Mystery: The event details will be revealed only at the venue.","Challenges: Surprise bonus challenges may appear at any time.","Gadgets: Electronic devices are not allowed.","Conduct: Some tasks are time-based; fair play and sportsmanship are required, and judges’ decisions are final."],
"Abyss Arena":["BGMI — Team: Each team must consist of 4 players.","Devices: Emulators, iPads, and triggers are not allowed; players must bring their own mobile devices and accessories.","Game Setup: Devices must support the latest game version, with all required maps downloaded.","Connectivity: Players should have their own internet connection as a backup.","Fair Play: Misconduct or unfair play will lead to disqualification, and organizers’ decisions are final."]
};
const BROCHURE_EVENT_HEADS={
"CodeWave":["Havyas : 7483989780","Shashidhara : 7760770725"],
"Leviathan":["Jathin : 6364058375","Hasth : 7338371775"],
"Coral Canvas":["Swasthik : 8951192848","Udith : 8088575178"],
"Aqua Byte":["Thushar : 7019512573","Prathiksha : 6363428734"],
"Aquaverse":["Krupa : 8296612368","Hruthika : 9353480749"],
"The Mega Pitch":["Sumanth : 8748059243","Shahavez : 7349342520"],
"Tide & Tailor":["Prapthi : 9632081932","Prathiksha : 9483505763"],
"Submarine":["Goutam : 9242288471","Bhargavi : 9632081787"],
"Ocean Enigma":["Sameeksha: 7676292225","Dheemanth: 9480463974"],
"Abyss Arena":["Jithesh : 7619168599","Keerthan : 8792839166"]
};

const scheduleSeed=[
 ["2026-09-17","08:00","09:00","Registration & Breakfast","Auditorium Foyer"],
 ["2026-09-17","09:00","11:00","Inaugural Ceremony","Sambhram Auditorium"],
 ["2026-09-17","11:00","12:00","Tide & Tailor","Sambhram Auditorium"],
 ["2026-09-17","11:00","12:00","Coral Canvas","MCA Lab 1"],
 ["2026-09-17","11:00","13:00","CodeWave","MCA Lab 2"],
 ["2026-09-17","11:00","16:00","Leviathan","Netravathi Hall"],
 ["2026-09-17","11:00","16:00","Submarine","Sowparnika"],
 ["2026-09-17","12:15","13:15","Ocean Enigma","LH 402"],
 ["2026-09-17","13:00","15:00","The Mega Pitch","Shambavi Hall"],
 ["2026-09-17","13:00","14:30","Aquaverse","Palguni Hall"],
 ["2026-09-17","13:00","16:00","Abyss Arena","MCA Lab 3 & MCA Lab 4"],
 ["2026-09-17","14:00","16:00","Ocean Enigma","Sambhram Auditorium"],
 ["2026-09-17","14:45","16:15","Coral Canvas","MCA Lab 1"],
 ["2026-09-17","14:45","16:15","CodeWave","MCA Lab 2"],
 ["2026-09-17","15:15","16:15","Aqua Byte","Robotics Lab"],
 ["2026-09-18","09:00","10:00","Aqua Byte","NC 36"],
 ["2026-09-18","09:00","10:30","Aquaverse","Sambhram Auditorium"],
 ["2026-09-18","09:00","13:00","CodeWave","MCA Lab 2"],
 ["2026-09-18","09:00","13:00","Submarine","Sowparnika"],
 ["2026-09-18","09:00","11:45","Leviathan","Netravathi Hall"],
 ["2026-09-18","10:15","11:45","The Mega Pitch","Shambavi Hall"],
 ["2026-09-18","10:15","13:30","Coral Canvas","MCA Lab 1"],
 ["2026-09-18","10:15","13:30","Abyss Arena","MCA Lab 4"],
 ["2026-09-18","10:15","13:30","Ocean Enigma","LH 402"],
 ["2026-09-18","12:00","13:30","Aqua Byte","Sambhram Auditorium"],
 ["2026-09-18","13:30","15:00","Leviathan","Sambhram / Sowparnika"],
 ["2026-09-18","15:00","","Valedictory Ceremony","Sambhram Auditorium"]
];

function brochureScheduleRows(events=[]){
 const official=officialEvents(events);
 const byName=new Map(official.map(e=>[normalizeEventLabel(e._officialName),e]));
 return scheduleSeed.map((x,i)=>{
   const ev=byName.get(normalizeEventLabel(x[3]));
   return {source_key:`${x[0]}|${x[1]}|${x[3]}|${x[4]}`,event_id:ev?.id||null,event_name:x[3],event_date:x[0],start_time:x[1],end_time:x[2]||null,venue:x[4],sort_order:i};
 });
}
function mergedScheduleRows(events=[], master=[]){
 const seed=brochureScheduleRows(events);
 const byKey=new Map(seed.map(r=>[r.source_key,r]));
 for(const row of (master||[])){
   const key=row.source_key||`${row.event_date}|${String(row.start_time||'').slice(0,5)}|${row.event_name||''}|${row.venue||''}`;
   const base=byKey.get(key);
   byKey.set(key,{...(base||{}),...row,_master:true});
 }
 return [...byKey.values()].sort((a,b)=>`${a.event_date} ${a.start_time||''} ${a.sort_order??999}`.localeCompare(`${b.event_date} ${b.start_time||''} ${b.sort_order??999}`));
}
function scheduleEventForRow(row,events=[]){
 if(row?.event_id){const direct=events.find(e=>e.id===row.event_id);if(direct)return direct}
 return officialEvents(events).find(e=>normalizeEventLabel(e._officialName)===normalizeEventLabel(row?.event_name));
}

export default function App(){
 const [page,setPage]=useState("home"),[menu,setMenu]=useState(false),[session,setSession]=useState(null),[profile,setProfile]=useState(null);
 const [colleges,setColleges]=useState([]),[events,setEvents]=useState([]),[students,setStudents]=useState([]),[slots,setSlots]=useState([]),[masterSlots,setMasterSlots]=useState([]),[participation,setParticipation]=useState([]),[attendance,setAttendance]=useState([]),[participantEvents,setParticipantEvents]=useState([]),[siteContent,setSiteContent]=useState({});
 const [query,setQuery]=useState(""),[selected,setSelected]=useState(null),[selectedEventId,setSelectedEventId]=useState(null),[privateData,setPrivateData]=useState(null),[toast,setToast]=useState("");
 const [admin,setAdmin]=useState(false),[auth,setAuth]=useState({email:"",password:""}),[authError,setAuthError]=useState("");
 const [accountMenu,setAccountMenu]=useState(false),[profileOpen,setProfileOpen]=useState(false),[workspaceOverride,setWorkspaceOverride]=useState(null);
 const [refreshing,setRefreshing]=useState(false),[booting,setBooting]=useState(true),[fatal,setFatal]=useState("");

 useEffect(()=>{(async()=>{try{await loadPublic()}catch(e){setFatal(e.message||String(e))}finally{setTimeout(()=>setBooting(false),900)}})();supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,s)=>{setSession(s);if(event==="SIGNED_IN"&&s?.user){await recordAudit("login","session",null,{event});await startActivity(s.user.id)}});return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(session){(async()=>{await loadPublic();await loadPrivate()})()}else{setProfile(null);setPrivateData(null);setAttendance([]);setParticipantEvents([]);setStudents([]);setParticipation([]);setAccountMenu(false);setProfileOpen(false)}},[session?.user?.id]);
 useEffect(()=>{if(session&&profile&&(profile.role==="event_authorised"||profile.role==="authorised")){setWorkspaceOverride(null);setPage("ops")}},[session?.user?.id,profile?.role,profile?.assigned_event_id]);

 async function loadPublic(){
   setRefreshing(true);
   const [c,e,s,sm,pa]=await Promise.all([
     supabase.from("colleges").select("*").order("name"),
     supabase.from("events").select("*").order("name"),
     supabase.from("event_schedule").select("*").order("event_date").order("start_time"),
     supabase.from("schedule_master").select("*").order("event_date").order("start_time").order("sort_order"),
     supabase.from("event_college_participation").select("*")
   ]);
   if(e.error)throw e.error;
   if(c.error)console.warn("colleges",c.error.message);
   if(s.error)console.warn("event_schedule",s.error.message);
   if(sm.error)console.warn("schedule_master",sm.error.message);
   if(pa.error)console.warn("event_college_participation",pa.error.message);
   const site=await supabase.from("public_site_content").select("key,content").order("key");
   if(site.error)console.warn("public_site_content",site.error.message);
   setColleges(c.data||[]);setEvents(e.data||[]);setSlots(s.data||[]);setMasterSlots(sm.data||[]);setParticipation(pa.data||[]);
   setSiteContent(Object.fromEntries((site.data||[]).map(x=>[x.key,x.content])));setRefreshing(false);
 }
 async function loadPrivate(){
   const {data:p,error:profileError}=await supabase.from("profiles").select("*").eq("id",session.user.id).maybeSingle();
   if(profileError)console.warn("profile",profileError);
   setProfile(p);
   if(p?.role==="authorised"||p?.role==="event_authorised"||p?.role==="admin"){
     const [contacts,status,pc,att,pe,pp]=await Promise.all([
       supabase.from("college_contacts").select("*"),supabase.from("college_status").select("*"),
       supabase.from("participant_contacts").select("*"),supabase.from("attendance").select("*"),
       supabase.from("participant_event_participation").select("participant_id,event_id,participating"),
       supabase.from("participants_public").select("*").order("name")
     ]);
     const firstError=[contacts,status,pc,att,pe,pp].find(x=>x.error);
     if(firstError)console.warn("private data",firstError.error);
     setPrivateData({contacts:contacts.data||[],status:status.data||[],participantContacts:pc.data||[]});
     setAttendance(att.data||[]);setParticipantEvents(pe.data||[]);setStudents(pp.data||[]);
   }
 }
 async function recordAudit(action,entity_type,entity_id=null,details={}){try{const u=(await supabase.auth.getUser()).data.user;if(!u)return;const {error}=await supabase.rpc("write_audit",{p_action:action,p_entity_type:entity_type,p_entity_id:entity_id,p_details:{...details,user_agent:navigator.userAgent,path:location.hash||"/"}});if(error)console.warn("audit",error)}catch(e){console.warn("audit",e)}}
 async function startActivity(userId){try{await supabase.from("user_activity_sessions").upsert({user_id:userId,last_seen:new Date().toISOString(),current_page:location.hash||"#home",user_agent:navigator.userAgent},{onConflict:"user_id"})}catch(e){console.warn("activity",e)}}
 useEffect(()=>{if(!session?.user?.id)return;startActivity(session.user.id);const timer=setInterval(()=>startActivity(session.user.id),60000);return()=>clearInterval(timer)},[session?.user?.id,page]);
 async function reload(){await loadPublic();if(session)await loadPrivate()}
 async function login(e){e.preventDefault();setAuthError("");const {error}=await supabase.auth.signInWithPassword(auth);if(error)setAuthError(error.message);else{setPage("home");setMenu(false)}}
 async function logout(){await recordAudit("logout","session",null,{reason:"user_signout"});await supabase.auth.signOut();setAdmin(false);setAccountMenu(false);setProfileOpen(false);setWorkspaceOverride(null)}
 const role=profile?.role;
 const isEventAuthorised=role==="event_authorised";
 const assignedEvent=profile?.assigned_event_id?events.find(e=>e.id===profile.assigned_event_id):null;
 const effectiveEvent=workspaceOverride?.type==="event"?events.find(e=>e.id===workspaceOverride.eventId):assignedEvent;
 const effectiveRole=workspaceOverride?.type==="tech"?"authorised":(workspaceOverride?.type==="event"?"event_authorised":role);
 const filtered=useMemo(()=>colleges.filter(c=>(c.name+" "+(c.location||"")).toLowerCase().includes(query.toLowerCase())),[colleges,query]);
 const counts=useMemo(()=>({confirmed:privateData?.status.filter(x=>x.status==="confirmed").length||0,pending:privateData?.status.filter(x=>x.status==="pending").length||0,denied:privateData?.status.filter(x=>x.status==="denied").length||0}),[privateData]);
 
 if(booting)return <SplashScreen/>;
 if(fatal)return <FatalScreen error={fatal} retry={()=>{setFatal("");setBooting(true);loadPublic().then(()=>setBooting(false)).catch(e=>setFatal(e.message))}}/>;
 if(page==="login")return <Login auth={auth} setAuth={setAuth} error={authError} login={login} back={()=>setPage("home")}/>;
 return <div className="app">
  <div className="glow g1"/><div className="glow g2"/>
  <header><a className="brand" href="#home" onClick={()=>setPage("home")}><Waves/><span>AQUA<b>DESK</b></span></a><nav className={menu?"open":""}>
   <a href="#home" onClick={()=>{setPage("home");setMenu(false)}}>{contentText(siteContent,"NAV_HOME","Home")}</a><a href="#colleges" onClick={()=>{setPage("colleges");setMenu(false)}}>{contentText(siteContent,"NAV_COLLEGES","Colleges")}</a><a href="#events" onClick={()=>{setPage("events");setMenu(false)}}>{contentText(siteContent,"NAV_EVENTS","Events")}</a><a href="#schedule" onClick={()=>{setPage("schedule");setMenu(false)}}>{contentText(siteContent,"NAV_SCHEDULE","Schedule")}</a><a href="#rules" onClick={()=>{setPage("rules");setMenu(false)}}>{contentText(siteContent,"NAV_RULES","Rules")}</a>
   {role&&<a href="#ops" onClick={()=>{setWorkspaceOverride(null);setPage("ops");setMenu(false)}}>{contentText(siteContent,"NAV_OPERATIONS","Operations")}</a>}
   {role==="admin"&&<button onClick={()=>{setAdmin(true);setMenu(false)}}><ShieldCheck size={15}/> {contentText(siteContent,"NAV_ADMIN","Admin")}</button>}
   {session?<div className="account-menu-wrap"><button className="account-trigger" onClick={()=>setAccountMenu(v=>!v)}><UserRound size={15}/><span>{profile?.full_name||session.user.email?.split("@")[0]||"Profile"}</span><ChevronDown size={13}/></button>{accountMenu&&<div className="account-menu"><div className="account-menu-head"><span className="eyebrow">SIGNED IN</span><b>{profile?.full_name||"AquaDesk User"}</b><small>{session.user.email}</small></div><button onClick={()=>{setProfileOpen(true);setAccountMenu(false)}}><UserRound/> Profile</button><button onClick={async()=>{setAccountMenu(false);await recordAudit("switch_user","session",null,{from:session.user.email});await supabase.auth.signOut();setAuth({email:"",password:""});setPage("login")}}><LogIn/> Switch user</button>{role==="admin"&&<button onClick={()=>{setAccountMenu(false);setAdmin(true)}}><ShieldCheck/> Switch workspace</button>}<button onClick={async()=>{setAccountMenu(false);await logout()}}><LogOut/> Logout</button></div>}</div>:<a href="#login" onClick={()=>{setPage("login");setMenu(false)}}><LogIn size={15}/> {contentText(siteContent,"NAV_LOGIN","Login")}</a>}
  </nav><button className="hamb" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>

  {page==="home"&&<Home colleges={colleges} events={events} students={students} slots={slots} setPage={setPage} setSelected={setSelected} siteContent={siteContent} />}
  {page==="colleges"&&<Colleges colleges={filtered} query={query} setQuery={setQuery} students={students} setSelected={setSelected}/>} 
  {page==="events"&&<Events events={events} slots={slots} openEvent={(id)=>{setSelectedEventId(id);setPage("event-detail")}}/>}{page==="schedule"&&<Schedule events={events} slots={slots} masterSlots={masterSlots} openEvent={(id)=>{setSelectedEventId(id);setPage("event-detail")}}/>}
  {page==="event-detail"&&<EventDetail event={officialEvents(events).find(e=>e.id===selectedEventId)||events.find(e=>e.id===selectedEventId)} slots={slots} masterSlots={masterSlots} siteContent={siteContent} back={()=>setPage("events")}/> }
  {page==="rules"&&<PublicRules siteContent={siteContent} events={events} openEvent={(id)=>{setSelectedEventId(id);setPage("event-detail")}}/>} 
  {page==="ops"&&role&&<Operations colleges={colleges} events={events} slots={slots} students={students} participation={participation} participantEvents={participantEvents} attendance={attendance} privateData={privateData} role={effectiveRole} profile={profile} effectiveEvent={effectiveEvent} reload={reload} toast={setToast}/>} 
  {selected&&<CollegeModal college={selected} students={students.filter(s=>s.college_id===selected.id)} privateData={privateData} authorised={!!role} close={()=>setSelected(null)}/>} 
  {admin&&<AdminPanel colleges={colleges} events={events} students={students} slots={slots} masterSlots={masterSlots} participation={participation} attendance={attendance} privateData={privateData} participantEvents={participantEvents} close={()=>setAdmin(false)} reload={reload} toast={setToast} setWorkspace={setWorkspaceOverride} setPage={setPage}/>} 
  {profileOpen&&<ProfileModal session={session} profile={profile} assignedEvent={assignedEvent} close={()=>setProfileOpen(false)} switchUser={async()=>{setProfileOpen(false);await recordAudit("switch_user","session",null,{from:session.user.email});await supabase.auth.signOut();setAuth({email:"",password:""});setPage("login")}} logout={logout}/>} 
  {toast&&<div className="toast"><CheckCircle2 size={15}/>{toast}</div>}
  {session&&<RealtimeChat session={session} profile={profile} toast={setToast}/>}
  <div className="mobile-actions"><button onClick={()=>setPage("home")}><Waves/><span>Home</span></button><button onClick={()=>setPage("colleges")}><Building2/><span>Colleges</span></button><button onClick={()=>setPage("events")}><CalendarDays/><span>Schedule</span></button>{role?<button onClick={()=>{setWorkspaceOverride(null);setPage("ops")}}><ClipboardCheck/><span>Ops</span></button>:<button onClick={()=>setPage("login")}><LogIn/><span>Login</span></button>}{session&&<button className="mobile-chat-nav" onClick={()=>window.dispatchEvent(new Event("aquadesk:open-chat"))}><MessageCircle/><span>Chat</span></button>}</div>
 </div>
}

function Home({colleges,events,students,slots,setPage,setSelected,siteContent}){
 const heroEyebrow=contentText(siteContent,"HOME_HERO_EYEBROW","SEMAPHORE 2K26 · AQUA DESK");
 const heroTitle=contentText(siteContent,"HOME_HERO_TITLE","The command centre\nbeneath the surface.");
 const heroBody=contentText(siteContent,"HOME_HERO_BODY","Explore participating colleges, discover every event, follow the official 17–18 September 2026 schedule, and let authorised teams manage confirmations and live attendance.");
 const primaryLabel=contentText(siteContent,"HOME_PRIMARY_CTA","Explore colleges");
 const secondaryLabel=contentText(siteContent,"HOME_SECONDARY_CTA","Open live schedule");
 const directoryTitle=contentText(siteContent,"HOME_DIRECTORY_TITLE","Who's joining the tide?");
 const scheduleTitle=contentText(siteContent,"HOME_SCHEDULE_TITLE","Two days.\nOne current.");
 const scheduleBody=contentText(siteContent,"HOME_SCHEDULE_BODY","Every slot from the supplied Semaphore 2K26 schedule is structured so the admin can edit it later without changing the page.");
 const eventTitle=contentText(siteContent,"HOME_EVENT_TITLE","Rules, heads & participation.");
 const eventBody=contentText(siteContent,"HOME_EVENT_BODY","Each event has its own editable description, rules, heads, logo, schedule and participating-college matrix.");
 return <main>
  <section className="hero hero-premium"><div className="hero-copy"><span className="eyebrow">{heroEyebrow}</span><h1>{heroTitle.split("\n").map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}{i===heroTitle.split("\n").length-1?<em>{line}</em>:line}</React.Fragment>)}</h1><p>{heroBody}</p><div className="actions"><button className="primary" onClick={()=>setPage("colleges")}>{primaryLabel} <ChevronRight size={17}/></button><button className="secondary" onClick={()=>setPage("events")}>{secondaryLabel}</button></div><div className="chips"><span><ShieldCheck/> Secure public + operations layers</span><span><Building2/> {colleges.length} colleges</span><span><Users/> {students.length} participants</span></div></div><div className="hero-visual"><div className="ring r1"/><div className="ring r2"/><div className="ring r3"/><div className="hero-core"><Waves size={62}/><small>SEMAPHORE<br/><b>2K26</b></small></div><div className="float-card"><CalendarDays/><div><b>17—18 SEP</b><span>{slots.length} schedule entries</span></div></div></div></section>
  <section className="strip"><div><b>{colleges.length}</b><span>{contentText(siteContent,"HOME_STAT_COLLEGES","Participating colleges")}</span></div><div><b>{students.length}</b><span>{contentText(siteContent,"HOME_STAT_PARTICIPANTS","Participant names")}</span></div><div><b>{events.length}</b><span>{contentText(siteContent,"HOME_STAT_EVENTS","Official events")}</span></div><div><b>2</b><span>{contentText(siteContent,"HOME_STAT_DAYS","Event days")}</span></div></section>
  <section className="section"><div className="section-head"><div><span className="eyebrow">PUBLIC DIRECTORY</span><h2>{directoryTitle}</h2></div><button onClick={()=>setPage("colleges")}>All colleges <ChevronRight size={16}/></button></div><div className="cards">{colleges.slice(0,3).map(c=><CollegeCard key={c.id} c={c} students={students} click={()=>setSelected(c)}/>)}</div></section>
  <section className="schedule-teaser"><div><span className="eyebrow">OFFICIAL TIMETABLE</span><h2>{scheduleTitle.split("\n").map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}{i===scheduleTitle.split("\n").length-1?<em>{line}</em>:line}</React.Fragment>)}</h2><p>{scheduleBody}</p><button className="secondary" onClick={()=>setPage("events")}>{contentText(siteContent,"HOME_SCHEDULE_CTA","View full schedule")} <ArrowRight size={16}/></button></div><div className="timeline-mini">{slots.slice(0,6).map((s,i)=><div className="timeline-row" key={s.id||i}><span>{s.start_time?.slice(0,5)}{s.end_time?`—${s.end_time.slice(0,5)}`:"+"}</span><b>{s.event_name||"Schedule"}</b><small>{s.venue}</small></div>)}</div></section>
  <section className="event-highlight"><div><span className="eyebrow">EVENT CENTRE</span><h2>{eventTitle}</h2><p>{eventBody}</p></div><div className="mini-events">{events.slice(0,3).map(e=><div key={e.id}>{safeEventLogo(e.logo_url)?<img className="home-event-logo" src={e.logo_url} alt=""/>:<CalendarDays/>}<b>{displayEventName(e)}</b><span>{e.description?.split("\n")[0]||"Event details available"}</span></div>)}</div></section>
 </main>}

function Colleges({colleges,query,setQuery,students,setSelected}){return <main className="section page"><div className="section-head"><div><span className="eyebrow">01 / PUBLIC DIRECTORY</span><h2>Participating <em>colleges.</em></h2><p className="muted">Public view shows names and general location only. Private contacts stay behind authorisation.</p></div><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search college or location"/></div></div><div className="cards">{colleges.map(c=><CollegeCard key={c.id} c={c} students={students} click={()=>setSelected(c)}/>)}</div></main>}
function CollegeCard({c,students,click}){return <button className="college-card" onClick={click}><div className="logo">{c.logo_url?<img src={c.logo_url} alt=""/>:<Building2/>}</div><span>{c.location||"Location pending"}</span><h3>{c.name}</h3><small>{students.filter(s=>s.college_id===c.id).length} participant names listed</small><ChevronRight className="arrow"/></button>}

function CollegeModal({college,students,privateData,authorised,close}){const contact=privateData?.contacts.find(x=>x.college_id===college.id);const status=privateData?.status.find(x=>x.college_id===college.id);return <div className="overlay" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="modal-top"><div className="logo big">{college.logo_url?<img src={college.logo_url} alt=""/>:<Building2/>}</div><div><span className="eyebrow">{college.location}</span><h2>{college.name}</h2>{authorised&&<Status status={status?.status||"pending"}/>}</div></div><h3 className="sub"><Users/> Participant names</h3><div className="names">{students.length?students.map(s=><div key={s.id}><b>{s.name}</b><span>{s.team_name||"Team not specified"}</span></div>):<div className="empty">No participant names listed yet.</div>}</div>{authorised&&<div className="private-box"><h3><LockKeyhole/> Authorised information</h3><div className="detail-grid"><Info label="HOD" value={contact?.hod_name} phone={contact?.hod_phone} email={contact?.hod_email}/><Info label="Student Coordinator" value={contact?.coordinator_name} phone={contact?.coordinator_phone} email={contact?.coordinator_email}/></div><p>{contact?.private_notes||"No private notes."}</p></div>}</div></div>}
function Info({label,value,phone,email}){return <div className="info"><b>{label}</b><strong>{value||"Not added"}</strong>{phone&&<span><Phone size={13}/>{phone}</span>}{email&&<span><Mail size={13}/>{email}</span>}</div>}
function Status({status}){return <span className={`status ${status}`}><i/>{status}</span>}

function EventLogo({event,className=""}){
 const [broken,setBroken]=useState(false);
 const src=safeEventLogo(event?.logo_url);
 if(!src||broken)return null;
 return <div className={`official-event-logo ${className}`}><img src={src} alt="" onError={()=>setBroken(true)}/></div>;
}

function EventCard({event,slots,openEvent,scheduleMode=false}){
 const meta=officialMeta(event);
 const eventSlots=(slots||[]).filter(s=>s.event_id===event.id);
 const slot=eventSlots[0]||effectiveScheduleSlots([event],[])[0];
 const canonical=meta?.key||event.name;
 const heads=(event.current_heads||BROCHURE_EVENT_HEADS[canonical]?.join("\n")||"").split("\n").filter(Boolean);
 const participants=EVENT_PARTICIPANT_COUNTS[canonical]||((BROCHURE_EVENT_RULES[canonical]?.[0]||"").match(/(\d+)\s*(?:participants?|members?|players?)/i)?.[1]);
 return <article className={`official-event-card ${scheduleMode?"schedule-event-card":""}`} onClick={()=>openEvent(event.id)}>
   {safeEventLogo(event?.logo_url)&&<div className="official-event-art"><EventLogo event={event}/></div>}
   <div className="official-event-body">
     <div className="event-card-kicker">{displayEventName(event)}</div>
     <h3>{displayProgramName(event)}</h3>
     {!scheduleMode&&<p>{event.description||"Official Semaphore 2K26 event"}</p>}
     <div className="official-event-meta">
       {participants&&<span><Users/> {participants} participant{Number(participants)===1?"":"s"}</span>}
       {slot?.event_date&&<span><CalendarDays/> {new Date(slot.event_date+"T12:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>}
       {slot?.venue&&<span><MapPin/> {slot.venue}</span>}
     </div>
     {scheduleMode&&slot&&<div className="schedule-event-time"><Clock3/> {fmtTime(slot.start_time)}{slot.end_time?` — ${fmtTime(slot.end_time)}`:" onwards"}</div>}
     {!scheduleMode&&<div className="event-card-footer"><span>{heads.length} coordinator{heads.length===1?"":"s"}</span><ChevronRight/></div>}
   </div>
 </article>
}

function FestPageHeader({eyebrow,title,subtitle,children}){
 return <div className="fest-page-header">
   <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
   {children}
 </div>
}

function Events({events,slots,openEvent}){
 const [day,setDay]=useState("all");
 const official=officialEvents(events);
 const publicSlots=effectiveScheduleSlots(events,slots); const visible=day==="all"?official:official.filter(e=>publicSlots.some(s=>s.event_id===e.id&&s.event_date===day));
 return <main className="section page official-program-page">
   <FestPageHeader eyebrow="SEMAPHORE 2K26 · OFFICIAL PROGRAMME" title={<>Events <em>at a glance.</em></>} subtitle="Explore the ten official competitions of Semaphore 2K26. Open an event for its rules, coordinators and schedule.">
     <div className="program-filters">
       <button className={day==="all"?"active":""} onClick={()=>setDay("all")}>All Events</button>
       <button className={day==="2026-09-17"?"active":""} onClick={()=>setDay("2026-09-17")}>Day 1 · Sep 17</button>
       <button className={day==="2026-09-18"?"active":""} onClick={()=>setDay("2026-09-18")}>Day 2 · Sep 18</button>
     </div>
   </FestPageHeader>
   <div className="official-event-grid">
     {visible.map(e=><EventCard key={e.id} event={e} slots={slots} openEvent={openEvent}/>)}
   </div>
   <section className="rules-callout">
     <div className="rules-callout-icon"><FileText/></div>
     <div><span className="eyebrow">BEFORE YOU REGISTER</span><h3>Read the general rules.</h3><p>Team limits, fees, reporting time, participation restrictions and conduct rules are published in the official brochure.</p></div>
     <button className="secondary" onClick={()=>{window.location.hash="rules"}}>View General Rules <ArrowRight size={15}/></button>
   </section>
 </main>
}

function effectiveScheduleSlots(events,slots){
 const official=officialEvents(events);
 const byKey=new Map(official.map(e=>[e._officialName,e]));
 const db=(slots||[]).filter(s=>official.some(e=>e.id===s.event_id));
 const presentIds=new Set(db.map(s=>s.event_id));
 const fallback=scheduleSeed.filter(x=>byKey.has(x[3])&&(!presentIds.has(byKey.get(x[3]).id))).map((x,i)=>({
   id:`brochure-${i}`,event_id:byKey.get(x[3]).id,event_date:x[0],start_time:x[1],end_time:x[2],
   event_name:x[3],venue:x[4],_brochure:true
 }));
 return [...db,...fallback];
}
function Schedule({events,slots,masterSlots=[],openEvent}){
 const [day,setDay]=useState("all");
 const rows=mergedScheduleRows(events,masterSlots);
 const visible=rows.filter(s=>day==="all"||s.event_date===day);
 const days=["2026-09-17","2026-09-18"];
 return <main className="section page official-program-page schedule-program-page">
  <FestPageHeader eyebrow="SEMAPHORE 2K26 · OFFICIAL TIMETABLE" title={<>Schedule <em>without clashes.</em></>} subtitle="The complete timetable from the official Semaphore 2K26 brochure. Every entry is maintained from the Admin schedule editor.">
   <div className="program-filters"><button className={day==="all"?"active":""} onClick={()=>setDay("all")}>All entries</button><button className={day==="2026-09-17"?"active":""} onClick={()=>setDay("2026-09-17")}>Day 1 · Sep 17</button><button className={day==="2026-09-18"?"active":""} onClick={()=>setDay("2026-09-18")}>Day 2 · Sep 18</button></div>
  </FestPageHeader>
  {days.map(date=>{const items=visible.filter(x=>x.event_date===date); if(day!=="all"&&day!==date)return null; const dateLabel=new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); return <section className="schedule-day-section" key={date}>
   <div className="schedule-day-title"><div><span className="eyebrow">{date==="2026-09-17"?"DAY 01":"DAY 02"}</span><h2>{dateLabel}</h2></div><span>{items.length} timetable entries</span></div>
   <div className="schedule-master-grid">{items.map((row,i)=>{const ev=scheduleEventForRow(row,events); return <article className={`public-schedule-master-card ${ev?"is-event":"is-program"}`} key={row.id||row.source_key||i}>
    <div className="public-schedule-time"><b>{fmtTime(row.start_time)}</b>{row.end_time?<span>— {fmtTime(row.end_time)}</span>:<span>onwards</span>}</div>
    <div className="public-schedule-copy"><span className="public-schedule-kind">{ev?displayProgramName(ev):"OFFICIAL PROGRAMME"}</span><h3>{ev?displayEventName(ev):row.event_name}</h3><div><MapPin size={14}/><span>{row.venue||"Venue to be announced"}</span></div></div>
    {ev&&<button className="secondary small" onClick={()=>openEvent(ev.id)}>Event details <ChevronRight size={14}/></button>}
   </article>})}</div>
  </section>})}
  {!visible.length&&<div className="empty large"><Clock3/><h2>No timetable entries.</h2><p>Check another day.</p></div>}
 </main>
}

function EventDetail({event,slots,masterSlots=[],siteContent,back}){
 if(!event)return <main className="section page"><div className="empty large"><h2>Event not found</h2><button className="secondary" onClick={back}>Back to events</button></div></main>;
 const meta=officialMeta(event);
 const canonical=meta?.key||event.name;
 const rules=(event.rules||BROCHURE_EVENT_RULES[canonical]?.join("\n")||"Details will be announced.").split("\n").filter(Boolean);
 const heads=(event.current_heads||BROCHURE_EVENT_HEADS[canonical]?.join("\n")||"").split("\n").filter(Boolean);
 const eventSlots=(masterSlots?.length?mergedScheduleRows([event],masterSlots):effectiveScheduleSlots([event],slots)).filter(s=>s.event_id===event.id);
 return <main className="section page event-detail-page">
  <button className="secondary back-event" onClick={back}><ArrowRight style={{transform:"rotate(180deg)"}} size={15}/> Back to all events</button>
  <section className="event-detail-hero">
   {safeEventLogo(event?.logo_url)&&<div className="event-detail-art"><EventLogo event={event}/></div>}
   <div><span className="eyebrow">SEMAPHORE 2K26 · OFFICIAL EVENT</span><h1>{meta?.key||event.name}</h1><h2>{meta?.program||programName(event.name)}</h2><p>{event.description||"Official event details from the Semaphore 2K26 programme."}</p></div>
  </section>
  <div className="event-detail-grid">
   <section className="detail-panel"><span className="eyebrow">OFFICIAL RULES</span><h3>Know before you <em>dive in.</em></h3><ul>{rules.map((r,i)=><li key={i}>{r}</li>)}</ul></section>
   <section className="detail-panel"><span className="eyebrow">EVENT COORDINATORS</span><h3>Who is <em>coordinating?</em></h3><div className="heads-large">{heads.map((h,i)=><div key={i}><UserRoundCheck/><b>{h}</b></div>)}</div>
    <div className="schedule-detail"><h4>Official schedule</h4>{eventSlots.length?eventSlots.map(s=><div key={s.id}><b>{s.event_date}</b><span>{fmtTime(s.start_time)}{s.end_time?` — ${fmtTime(s.end_time)}`:" onwards"}</span><small>{s.venue}</small></div>):<p className="muted">No schedule slot currently linked.</p>}</div>
   </section>
  </div>
 </main>
}

function PublicRules({siteContent,events,openEvent}){const general=(siteContent.GENERAL_RULES||BROCHURE_GENERAL_RULES.join("\n")).split("\n").filter(Boolean);const coordinators=(siteContent.COORDINATORS||BROCHURE_COORDINATORS.join("\n")).split("\n").filter(Boolean);return <main className="section page rules-page"><div className="section-head"><div><span className="eyebrow">01 / OFFICIAL INFORMATION</span><h2>Rules, coordinators <em>& event guide.</em></h2><p className="muted">Public information transcribed from the supplied Semaphore 2K26 brochure. The Super Admin can update it when authorities make changes.</p></div></div><div className="public-info-grid"><section className="detail-panel"><span className="eyebrow">GENERAL RULES</span><h3>Festival <em>rules.</em></h3><ol>{general.map((r,i)=><li key={i}>{r}</li>)}</ol><p className="brochure-note">The brochure notes that rules may be changed by the authorities when necessary and changes will be notified.</p></section><section className="detail-panel"><span className="eyebrow">CORE TEAM</span><h3>Coordinator <em>details.</em></h3><div className="heads-large">{coordinators.map((x,i)=><div key={i}><UserRound/><b>{x}</b></div>)}</div></section></div><section className="event-directory"><div className="section-head"><div><span className="eyebrow">EVENT PAGES</span><h3>Explore every <em>event.</em></h3></div></div><div className="mini-event-grid">{officialEvents(events).map(e=><button key={e.id} onClick={()=>openEvent(e.id)}><span>{displayProgramName(e)}</span><b>{displayEventName(e)}</b><small>Rules · Heads · Schedule</small><ChevronRight/></button>)}</div></section></main>}

function Operations({colleges,events,slots,students,participation,participantEvents,attendance,privateData,role,profile,effectiveEvent,reload,toast}){
 const [selectedSlot,setSelectedSlot]=useState("");
 const [selectedCollege,setSelectedCollege]=useState("");
 const [openTeam,setOpenTeam]=useState(null);
 const [winners,setWinners]=useState([]);
 const allowedSlots=useMemo(()=>{if(role==="event_authorised")return effectiveEvent?slots.filter(s=>s.event_id===effectiveEvent.id):[];return slots},[role,effectiveEvent?.id,slots]);
 const slot=slots.find(s=>s.id===selectedSlot);
 const event=effectiveEvent||events.find(e=>e.id===slot?.event_id);
 useEffect(()=>{if(!allowedSlots.some(s=>s.id===selectedSlot))setSelectedSlot(allowedSlots[0]?.id||"")},[allowedSlots.map(s=>s.id).join(",")]);
 useEffect(()=>{setSelectedCollege("");setOpenTeam(null)},[selectedSlot]);
 useEffect(()=>{(async()=>{const eid=slot?.event_id||effectiveEvent?.id;if(!eid){setWinners([]);return}const {data}=await supabase.from("event_winners").select("*").eq("event_id",eid).order("placement");setWinners(data||[])})()},[slot?.event_id,effectiveEvent?.id]);
 const registeredIds=new Set((participantEvents||[]).filter(x=>x.event_id===slot?.event_id&&x.participating).map(x=>x.participant_id));
 // The participant-event registration is the single source of truth for an event roster.
 // College participation is kept for the admin matrix, but it must never make every
 // student of a college appear in an event workspace.
 const registeredParticipants=students.filter(s=>registeredIds.has(s.id));
 const collegeIds=[...new Set(registeredParticipants.map(p=>p.college_id))];
 const collegeList=collegeIds.map(id=>colleges.find(c=>c.id===id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
 const visibleParticipants=selectedCollege?registeredParticipants.filter(p=>p.college_id===selectedCollege):registeredParticipants;
 const teams=Object.values(visibleParticipants.reduce((acc,p)=>{const key=`${p.college_id}::${(p.team_name||"").trim().toLowerCase()||`__individual_${p.id}`}`;if(!acc[key])acc[key]={key,collegeId:p.college_id,name:(p.team_name||"").trim()||"Individual",members:[]};acc[key].members.push(p);return acc},{})).sort((a,b)=>a.name.localeCompare(b.name));
 function teamStatus(team){const states=team.members.map(p=>attendance.find(x=>x.schedule_id===slot?.id&&x.participant_id===p.id)?.status).filter(Boolean);if(!states.length)return null;if(states.every(x=>x==="present"))return "present";if(states.every(x=>x==="absent"))return "absent";return "mixed"}
 async function mark(participantId,status){if(!slot?.id)return;const eid=slot.event_id;if(!registeredIds.has(participantId)){toast("This participant is not registered for this event.");return}const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from("attendance").upsert({schedule_id:slot.id,participant_id:participantId,status,marked_by:user.user?.id,marked_at:new Date().toISOString()},{onConflict:"schedule_id,participant_id"});if(error)toast(error.message);else{await supabase.rpc("write_audit",{p_action:"mark_attendance",p_entity_type:"event",p_entity_id:eid,p_details:{participant_id:participantId,status,event_id:eid}});toast(`Marked ${status}`);await reload()}}
 async function markTeam(team,status){if(!slot?.id||!team.members.length)return;const user=(await supabase.auth.getUser()).data.user?.id;const rows=team.members.map(p=>({schedule_id:slot.id,participant_id:p.id,status,marked_by:user,marked_at:new Date().toISOString()}));const {error}=await supabase.from("attendance").upsert(rows,{onConflict:"schedule_id,participant_id"});if(error)toast(error.message);else{toast(`${team.name} · ${status}`);await reload()}}
 async function markWinner(team,placement=1){const eid=slot?.event_id||effectiveEvent?.id;if(!eid||!team?.members?.length)return;const user=(await supabase.auth.getUser()).data.user?.id;const payload={event_id:eid,team_name:team.name,participant_id:team.members.length===1?team.members[0].id:null,placement,note:"Marked from event dashboard",marked_by:user,marked_at:new Date().toISOString()};const {error}=await supabase.from("event_winners").upsert(payload,{onConflict:"event_id,placement"});if(error)toast(error.message);else{toast(`${team.name} marked as winner`);const {data}=await supabase.from("event_winners").select("*").eq("event_id",eid).order("placement");setWinners(data||[]);await reload()}}
 async function removeWinner(placement){const eid=slot?.event_id||effectiveEvent?.id;if(!eid)return;const {error}=await supabase.from("event_winners").delete().eq("event_id",eid).eq("placement",placement);if(error)toast(error.message);else{toast("Winner cleared");setWinners(winners.filter(w=>w.placement!==placement))}}
 const accountEmail=event?(EVENT_ACCOUNT_MAP[officialMeta(event)?.key||event.name]||null):null;
 return <main className="section page ops-page">
  <div className="ops-hero"><div><span className="eyebrow">{role==="event_authorised"?"PERSONALISED EVENT WORKSPACE":"AUTHORISED OPERATIONS"}</span><h2>{displayEventName(event)||"Operations"}<br/><em>{event?displayProgramName(event):"Two-level attendance."}</em></h2><p>{role==="event_authorised"?<>Signed in as <b>{profile?.full_name}</b>. This workspace is assigned to <b>{displayEventName(event)||"an event"}</b> ({displayProgramName(event)}). Only participants registered for this event are visible here. Account: {accountEmail||"assigned event account"}.</>:"Level 1 marks the registered team. Open a team for Level 2 and mark the assigned participants individually. TECH and Super Admin can operate across events."}</p></div><div className="ops-badge"><ClipboardCheck/><b>{registeredParticipants.length}</b><span>registered people in this slot</span></div></div>
  <div className="event-summary-grid"><div><Building2/><b>{collegeList.length}</b><span>participating colleges</span></div><div><Users/><b>{registeredParticipants.length}</b><span>registered students</span></div><div><CheckCircle2/><b>{attendance.filter(a=>a.schedule_id===slot?.id&&a.status==="present").length}</b><span>present</span></div><div><UserX/><b>{attendance.filter(a=>a.schedule_id===slot?.id&&a.status==="absent").length}</b><span>absent</span></div></div>
  <div className="ops-toolbar"><select value={selectedSlot} onChange={e=>setSelectedSlot(e.target.value)}>{allowedSlots.map(s=><option key={s.id} value={s.id}>{s.event_date} · {fmtTime(s.start_time)} · {s.event_name||events.find(e=>e.id===s.event_id)?.name}</option>)}</select><span>{event?.name||"Select a schedule slot"} · <b>{event?programName(event.name):""}</b> · {slot?.venue||""}</span></div>
  <div className="attendance-level-head"><span className="eyebrow">LEVEL 1 · TEAM ATTENDANCE</span><b>{teams.length} registered teams</b></div>
  <div className="college-filter-row"><button className={!selectedCollege?"active":""} onClick={()=>{setSelectedCollege("");setOpenTeam(null)}}>All registered colleges</button>{collegeList.map(c=><button className={selectedCollege===c.id?"active":""} key={c.id} onClick={()=>{setSelectedCollege(c.id);setOpenTeam(null)}}>{c.name} · {registeredParticipants.filter(p=>p.college_id===c.id).length}</button>)}</div>
  <div className="team-attendance-list">{teams.map(team=>{const st=teamStatus(team);const open=openTeam===team.key;const college=colleges.find(c=>c.id===team.collegeId);return <div className={`team-attendance-card ${open?"open":""}`} key={team.key}>
    <div className="team-row"><button className="team-main" onClick={()=>setOpenTeam(open?null:team.key)}><Users/><div><b>{team.name}</b><span>{college?.name||"College"} · {team.members.length} registered participant{team.members.length===1?"":"s"}</span></div><ChevronDown className={open?"rotated":""}/></button><div className="att-actions"><button className={st==="present"?"active present":""} onClick={()=>markTeam(team,"present")}><UserCheck size={16}/> Team Present</button><button className={st==="absent"?"active absent":""} onClick={()=>markTeam(team,"absent")}><UserX size={16}/> Team Absent</button></div></div>
    {open&&<div className="team-members"><div className="attendance-level-head"><span className="eyebrow">LEVEL 2 · ASSIGNED PARTICIPANTS</span><small>Only registered members of this event/team</small></div>{team.members.map(p=>{const a=attendance.find(x=>x.schedule_id===slot?.id&&x.participant_id===p.id);return <div className="attendance-row" key={p.id}><div><b>{p.name}</b><span>{colleges.find(c=>c.id===p.college_id)?.name}</span></div><div className="att-actions"><button className={a?.status==="present"?"active present":""} onClick={()=>mark(p.id,"present")}><UserCheck size={16}/> Present</button><button className={a?.status==="absent"?"active absent":""} onClick={()=>mark(p.id,"absent")}><UserX size={16}/> Absent</button></div></div>})}</div>}
  </div>})}{!teams.length&&<div className="empty large">No registered participants are assigned to this event/slot. Register the participant under <b>{event?programName(event.name):"this event"}</b> before taking attendance.</div>}</div>
  <div className="winner-panel"><div className="attendance-level-head"><div><span className="eyebrow">RESULTS · WINNERS</span><h3>Mark winners</h3></div><small>{event?.name||"Event"} · {programName(event?.name)} · {winners.length} placement{winners.length===1?"":"s"}</small></div><div className="winner-grid">{teams.map(team=>{const existing=winners.find(w=>w.team_name===team.name);return <div className={`winner-card ${existing?"is-winner":""}`} key={`winner-${team.key}`}><div><b>{team.name}</b><span>{team.members.map(m=>m.name).join(" · ")}</span></div>{existing?<button className="secondary small" onClick={()=>removeWinner(existing.placement)}><XCircle/> Clear #{existing.placement}</button>:<div className="winner-place-actions"><button className="primary small" onClick={()=>markWinner(team,1)}><Sparkles/> 1st</button><button className="secondary small" onClick={()=>markWinner(team,2)}>2nd</button><button className="secondary small" onClick={()=>markWinner(team,3)}>3rd</button></div>}</div>})}{!teams.length&&<div className="empty">No registered teams available for results.</div>}</div></div>
 </main>
}
function ProfileModal({session,profile,assignedEvent,close,switchUser,logout}){
 const roleLabel=profile?.role==="admin"?"Super Admin":profile?.role==="event_authorised"?"Event Authorised User":"Authorised User";
 return <div className="overlay" onClick={close}><div className="modal profile-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="profile-hero"><div className="profile-avatar"><UserRound/></div><div><span className="eyebrow">AQUA DESK PROFILE</span><h2>{profile?.full_name||"AquaDesk User"}</h2><p>{session?.user?.email}</p></div></div><div className="profile-grid"><div><span>ROLE</span><b>{roleLabel}</b></div><div><span>ASSIGNED EVENT</span><b>{assignedEvent?.name||"All events"}</b></div><div><span>ACCESS</span><b>{profile?.role==="admin"?"Full editing":"View all data + attendance"}</b></div><div><span>CHAT</span><b>All signed-in users</b></div></div><div className="profile-actions"><button className="secondary" onClick={switchUser}><LogIn/> Switch user</button><button className="secondary danger-outline" onClick={logout}><LogOut/> Logout</button></div></div></div>
}

function Login({auth,setAuth,error,login,back}){return <main className="login-page"><div className="login-copy"><span className="eyebrow">AQUA DESK / CONTROLLED ACCESS</span><h1>Enter the<br/><em>operations layer.</em></h1><p>Event accounts can view AquaDesk data, use the global chat, and mark attendance only for their assigned event. Super Admin unlocks full editing.</p><button className="secondary" onClick={back}>Back to public view</button></div><form className="login-card" onSubmit={login}><div className="login-icon"><LockKeyhole/></div><h2>Sign in</h2><label>Email<input type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} required placeholder="you@example.com"/></label><label>Password<input type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} required placeholder="••••••••"/></label>{error&&<div className="error">{error}</div>}<button className="primary full">Enter AquaDesk <ArrowRight size={16}/></button></form></main>}

function LoginPrompt({setPage}){return <main className="section page"><div className="empty large"><LockKeyhole/><h2>Authorised area</h2><p>Sign in to access private operational information and attendance.</p><button className="primary" onClick={()=>setPage("login")}>Sign in</button></div></main>}

function AdminPanel({colleges,events,students,slots,masterSlots,participation,attendance,privateData,participantEvents,close,reload,toast,setWorkspace,setPage}){
 const [tab,setTab]=useState("overview");
 const [navSearch,setNavSearch]=useState("");
 const [editingCollege,setEditingCollege]=useState(null),[editingEvent,setEditingEvent]=useState(null),[editingParticipant,setEditingParticipant]=useState(null),[editingSlot,setEditingSlot]=useState(null);
 const [showCollegeForm,setShowCollegeForm]=useState(false),[showEventForm,setShowEventForm]=useState(false),[showParticipantForm,setShowParticipantForm]=useState(false),[showSlotForm,setShowSlotForm]=useState(false);
 const tabs=[
  ["overview","Dashboard",LayoutDashboard,"Command center"],["colleges","Colleges",Building2,"Institutions & status"],["participants","Participants",Users,"People & teams"],
  ["events","Events",CalendarDays,"Event configuration"],["schedule","Schedule",Clock3,"Timetable & venues"],["participation","Participation",Settings2,"College ↔ event matrix"],
  ["users","Access Control",UserRoundCheck,"Accounts & assignments"],["public","Public Content",FileText,"Website information"],["logs","Audit & Activity",History,"System history"],["exports","Export Centre",Download,"Data exports"]
 ];
 const filteredTabs=tabs.filter(x=>`${x[1]} ${x[3]}`.toLowerCase().includes(navSearch.toLowerCase()));
 const current=tabs.find(x=>x[0]===tab)||tabs[0];
 const go=(next)=>{setTab(next);setNavSearch("")};
 return <div className="admin-overlay"><div className="admin-panel admin-shell">
  <aside className="admin-sidebar">
   <div className="admin-sidebar-brand"><div className="admin-brand-mark"><Waves/></div><div><b>AquaDesk</b><span>CONTROL ROOM</span></div></div>
   <div className="admin-sidebar-status"><span className="live-dot"/><div><b>Super Admin</b><small>Full control · RLS protected</small></div></div>
   <label className="admin-nav-search"><Search size={14}/><input value={navSearch} onChange={e=>setNavSearch(e.target.value)} placeholder="Find a module…"/><kbd>⌘K</kbd></label>
   <div className="admin-nav-label">CONTROL</div>
   <nav className="admin-side-nav">{filteredTabs.map(([k,l,I,desc])=><button className={tab===k?"active":""} onClick={()=>go(k)} key={k}><span className="nav-icon"><I size={15}/></span><span><b>{l}</b><small>{desc}</small></span>{tab===k&&<i/>}</button>)}</nav>
   {!filteredTabs.length&&<div className="admin-no-results">No module matches “{navSearch}”.</div>}
   <div className="admin-sidebar-bottom"><button onClick={()=>go("users")}><UserRoundCheck size={14}/> Manage access</button><button onClick={()=>go("exports")}><Download size={14}/> Export data</button></div>
  </aside>
  <section className="admin-workarea">
   <header className="admin-commandbar">
    <div className="admin-command-title"><span className="eyebrow">SUPER ADMIN · PRIVATE CONTROL</span><h2>{current[1]} <em>{current[0]==="overview"?"/ command center":""}</em></h2><p>{current[3]} · changes are logged and protected by Supabase RLS.</p></div>
    <div className="admin-command-actions"><button className="admin-quick ghost" onClick={()=>{setWorkspace({type:"tech"});setPage("ops");}}><Eye size={15}/> Preview TECH</button><button className="admin-close-btn" onClick={close}><X/></button></div>
   </header>
   {tab==="overview"&&<>
    <div className="admin-quickbar"><div><span className="eyebrow">QUICK ACTIONS</span><b>What do you need to do?</b></div><div className="admin-quick-actions"><button onClick={()=>{setShowCollegeForm(true);setTab("colleges")}}><Plus size={14}/> Add college</button><button onClick={()=>{setShowParticipantForm(true);setTab("participants")}}><Plus size={14}/> Add participant</button><button onClick={()=>{setShowEventForm(true);setTab("events")}}><Plus size={14}/> Add event</button><button onClick={()=>{setShowSlotForm(true);setTab("schedule")}}><Plus size={14}/> Add slot</button><button onClick={()=>go("users")}><ShieldCheck size={14}/> Access control</button></div></div>
    <AdminOverview colleges={colleges} events={events} students={students} slots={slots} participation={participation} participantEvents={participantEvents} attendance={attendance} privateData={privateData} reload={reload}/>
    <AdminWorkspaceSwitcher events={events} colleges={colleges} students={students} participantEvents={participantEvents} attendance={attendance} setWorkspace={setWorkspace} closeAdmin={close} goOps={(next)=>{setWorkspace(next);setPage("ops");}}/>
   </>}
   {tab==="colleges"&&<AdminColleges colleges={colleges} reload={reload} toast={toast} editing={editingCollege} setEditing={setEditingCollege} show={showCollegeForm} setShow={setShowCollegeForm}/>} 
   {tab==="participants"&&<AdminParticipants colleges={colleges} events={events} students={students} participantEvents={participantEvents} reload={reload} toast={toast} editing={editingParticipant} setEditing={setEditingParticipant} show={showParticipantForm} setShow={setShowParticipantForm}/>} 
   {tab==="events"&&<AdminEvents events={events} reload={reload} toast={toast} editing={editingEvent} setEditing={setEditingEvent} show={showEventForm} setShow={setShowEventForm}/>} 
   {tab==="schedule"&&<AdminSchedule events={events} slots={slots} masterSlots={masterSlots} reload={reload} toast={toast} editing={editingSlot} setEditing={setEditingSlot} show={showSlotForm} setShow={setShowSlotForm}/>} 
   {tab==="participation"&&<AdminParticipation colleges={colleges} events={events} participation={participation} reload={reload} toast={toast}/>} 
   {tab==="users"&&<AdminAuthorizedUsers events={events} reload={reload} toast={toast}/>} 
   {tab==="public"&&<AdminPublicContent/>} 
   {tab==="logs"&&<AdminLogs/>}
   {tab==="exports"&&<AdminExports colleges={colleges} events={events} students={students} slots={slots} masterSlots={masterSlots} participation={participation} attendance={attendance} privateData={privateData} participantEvents={participantEvents}/>} 
  </section>
 </div></div>
}

function AdminWorkspaceSwitcher({events,colleges=[],students=[],participantEvents=[],attendance=[],setWorkspace,closeAdmin,goOps}){
 const [mode,setMode]=useState("admin"),[accounts,setAccounts]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(""),[filter,setFilter]=useState("all");
 const fallback=[
  ["CODEWAVE@NMAMIT.IN","CodeWave","Coding"],["LEVIATHAN@NMAMIT.IN","Leviathan","IT Manager"],["CORALCANVAS@NMAMIT.IN","Coral Canvas","Web Design"],["AQUABYTE@NMAMIT.IN","Aqua Byte","IT Quiz"],["AQUAVERSE@NMAMIT.IN","Aquaverse","Tech Talk"],["MEGPITCH@NMAMIT.IN","The Mega Pitch","Startup Event"],["TIDETAILOR@NMAMIT.IN","Tide & Tailor","Fashion Show"],["SUBMARINE@NMAMIT.IN","Submarine","Photography & Videography"],["OCEANENIGMA@NMAMIT.IN","Ocean Enigma","Surprise Event"],["ABYSSARENA@NMAMIT.IN","Abyss Arena","Gaming / BGMI"],["TECH@NMAMIT.IN","TECH","All Events"]
 ];
 async function load(){setLoading(true);const {data,error}=await supabase.from("authorized_event_accounts").select("email,display_name,event_name,assigned_event_id").order("email");if(error)console.warn("workspace accounts",error);const db=new Map((data||[]).map(a=>[a.email.toUpperCase(),a]));setAccounts(fallback.map(([email,brand,actual])=>({...db.get(email)||{},email,display_name:db.get(email)?.display_name||brand,event_name:db.get(email)?.event_name||brand,actual_event_name:actual})));setLoading(false)}
 useEffect(()=>{load()},[]);
 function resolveEvent(a){if(a.assigned_event_id){const byId=events.find(e=>e.id===a.assigned_event_id);if(byId)return byId}return events.find(e=>e.name?.toLowerCase()===a.event_name?.toLowerCase()||e.name?.toLowerCase()===a.actual_event_name?.toLowerCase()||programName(e.name)?.toLowerCase()===a.actual_event_name?.toLowerCase())}
 const eventStats=(ev)=>{if(!ev)return {people:0,present:0};const ids=new Set(participantEvents.filter(x=>x.event_id===ev.id&&x.participating).map(x=>x.participant_id));const people=students.filter(s=>ids.has(s.id)).length;const present=attendance.filter(a=>a.status==="present"&&students.some(s=>s.id===a.participant_id&&ids.has(s.id))).length;return {people,present}}
 const visible=accounts.filter(a=>{const tech=a.email.toUpperCase()==="TECH@NMAMIT.IN",ev=resolveEvent(a),assigned=!!ev;const q=search.toLowerCase();const matches=!q||a.email.toLowerCase().includes(q)||a.event_name?.toLowerCase().includes(q)||a.actual_event_name?.toLowerCase().includes(q);return matches&&(filter==="all"||(filter==="assigned"&&assigned&&!tech)||(filter==="attention"&&!assigned&&!tech)||(filter==="global"&&tech))});
 const assignedCount=accounts.filter(a=>a.email.toUpperCase()!=="TECH@NMAMIT.IN"&&resolveEvent(a)).length;
 function open(a){const tech=a.email.toUpperCase()==="TECH@NMAMIT.IN";if(tech){setMode("tech");setWorkspace({type:"tech"});closeAdmin();goOps({type:"tech"});return}const ev=resolveEvent(a);if(!ev){setMode("admin");alert(`No database event is assigned to ${a.email}. Open Access Control and assign the event first.`);return}setMode("event");setWorkspace({type:"event",eventId:ev.id,accountEmail:a.email});closeAdmin();goOps({type:"event",eventId:ev.id,accountEmail:a.email})}
 return <section className="admin-workspace-deck">
  <div className="deck-head"><div><span className="eyebrow">WORKSPACE COMMAND DECK</span><h3>Open an event workspace <em>instantly.</em></h3><p>Admin-only preview. Your Super Admin session stays unchanged while you inspect an event account's exact workspace.</p></div><div className="deck-mode"><button className={mode==="admin"?"active":""} onClick={()=>{setMode("admin");setWorkspace(null)}}><ShieldCheck size={15}/> Super Admin</button><button className={mode==="tech"?"active global":""} onClick={()=>{setMode("tech");setWorkspace({type:"tech"});closeAdmin();goOps({type:"tech"})}}><Eye size={15}/> TECH · all events</button></div></div>
  <div className="deck-stats"><div><b>{accounts.length-1}</b><span>event accounts</span></div><div><b>{assignedCount}</b><span>assigned</span></div><div className={assignedCount<accounts.length-1?"attention":""}><b>{Math.max(0,accounts.length-1-assignedCount)}</b><span>need assignment</span></div><div className="global"><b>1</b><span>global TECH</span></div></div>
  <div className="deck-toolbar"><label><Search size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search account or event…"/></label><div className="deck-filters">{[["all","All"],["assigned","Assigned"],["attention","Needs assignment"],["global","TECH"]].map(([k,l])=><button key={k} className={filter===k?"active":""} onClick={()=>setFilter(k)}>{l}</button>)}</div></div>
  <div className="deck-grid">{loading?<div className="empty large">Loading workspaces…</div>:visible.map((a,i)=>{const tech=a.email.toUpperCase()==="TECH@NMAMIT.IN",ev=resolveEvent(a),stats=eventStats(ev);return <article className={`workspace-deck-card ${tech?"tech-card":""}`} key={a.email}>
    <div className="deck-card-top"><span className="deck-index">{tech?"∞":String(i+1).padStart(2,"0")}</span><div className="deck-card-icon">{tech?<ShieldCheck/>:<UserRoundCheck/>}</div><div className="deck-card-title"><b>{a.event_name}</b><span>{a.email}</span></div><i className={tech?"state-global":ev?"state-ready":"state-attention"}>{tech?"GLOBAL":ev?"READY":"ASSIGN"}</i></div>
    <div className="deck-card-event"><span>ASSIGNED EVENT</span><b>{tech?"All events":ev?.name||"Not assigned"}</b><small>{tech?"Global operations · no event restriction":`Program · ${a.actual_event_name||programName(ev?.name)||"—"}`}</small></div>
    <div className="deck-card-metrics"><div><b>{tech?events.length:stats.people}</b><span>{tech?"events":"people"}</span></div><div><b>{tech?"ALL":stats.present}</b><span>{tech?"scope":"present"}</span></div><div><b>{tech?"∞":(ev?"LIVE":"—")}</b><span>{tech?"access":"workspace"}</span></div></div>
    <button className="deck-open" onClick={()=>open(a)}>{tech?"Open global operations":ev?"Open workspace":"Assign event first"}<ChevronRight size={15}/></button>
  </article>})}</div>
  {!loading&&!visible.length&&<div className="empty large">No workspaces match your search/filter.</div>}
 </section>
}

function AdminOverview({colleges,events,students,slots,participation,participantEvents,attendance,privateData,reload}){
 const [logs,setLogs]=useState([]),[sessions,setSessions]=useState([]),[online,setOnline]=useState([]),[profiles,setProfiles]=useState([]),[analyticsResetAt,setAnalyticsResetAt]=useState(null);
 async function loadAnalytics(){
   const [{data:l},{data:s},{data:p},{data:r}]=await Promise.all([
     supabase.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(200),
     supabase.from("user_activity_sessions").select("*").order("last_seen",{ascending:false}),
     supabase.from("profiles").select("id,full_name,role"),
     supabase.from("analytics_control").select("reset_at").eq("id",1).maybeSingle()
   ]);
   setLogs(l||[]);setSessions(s||[]);setProfiles(p||[]);setAnalyticsResetAt(r?.reset_at||null);
 }
 useEffect(()=>{loadAnalytics();const timer=setInterval(loadAnalytics,30000);return()=>clearInterval(timer)},[]);
 const cutoff=analyticsResetAt?new Date(analyticsResetAt).getTime():0;
 const analyticsAttendance=attendance.filter(a=>!cutoff||new Date(a.marked_at||0).getTime()>=cutoff);
 const analyticsLogs=logs.filter(x=>!cutoff||new Date(x.created_at||0).getTime()>=cutoff);
 const analyticsStatus=(privateData?.status||[]);
 const confirmed=analyticsStatus.filter(x=>x.status==="confirmed").length,pending=analyticsStatus.filter(x=>x.status==="pending").length,denied=analyticsStatus.filter(x=>x.status==="denied").length;
 const analyticsParticipation=(participation||[]).filter(x=>x.participating&&(!cutoff||new Date(x.updated_at||0).getTime()>=cutoff));
 const present=analyticsAttendance.filter(a=>a.status==="present").length,absent=analyticsAttendance.filter(a=>a.status==="absent").length;
 const participatingByEvent=events.map(e=>({name:e.name,count:analyticsParticipation.filter(p=>p.event_id===e.id).length})).sort((a,b)=>b.count-a.count);
 const max=Math.max(1,...participatingByEvent.map(x=>x.count));
 const totalStatus=confirmed+pending+denied;
 const attendanceTotal=present+absent;
 const activeSessions=sessions.filter(x=>Date.now()-new Date(x.last_seen||0).getTime()<90000).length;
 const actor=id=>profiles.find(p=>p.id===id)?.full_name||"Unknown account";
 const topEvents=participatingByEvent.slice(0,5);
 return <div className="admin-section dashboard dashboard-v2">

  <section className="dashboard-hero">
   <div className="dashboard-hero-copy">
    <div className="hero-kicker"><span className="live-dot"/><span>LIVE OPERATIONS CENTER</span></div>
    <h2>Semaphore command<br/><em>at a glance.</em></h2>
    <p>One clean control surface for registrations, events, attendance, activity and system health.</p>
    <div className="hero-meta">
      <span><Database size={13}/> {events.length} events configured</span>
      <span><Activity size={13}/> {analyticsLogs.length} recent activities</span>
      <span><Clock4 size={13}/> {analyticsResetAt?`Since ${new Date(analyticsResetAt).toLocaleDateString("en-IN")}`:"Live baseline"}</span>
    </div>
   </div>
   <div className="hero-status-card">
    <div className="hero-status-top"><span>CONTROL STATUS</span><i><Wifi size={13}/> LIVE</i></div>
    <b>{activeSessions}</b>
    <span>active operators right now</span>
    <div className="hero-status-line"><i style={{width:`${Math.min(100,Math.max(8,activeSessions*18))}%`}}/></div>
    <small>Realtime presence · last 90 seconds</small>
   </div>
  </section>

  <section className="dashboard-kpis">
   <div className="kpi-card kpi-accent"><div className="kpi-icon"><Building2/></div><div><span>COLLEGES</span><b>{colleges.length}</b><small>registered institutions</small></div></div>
   <div className="kpi-card"><div className="kpi-icon"><Users/></div><div><span>PARTICIPANTS</span><b>{students.length}</b><small>student records</small></div></div>
   <div className="kpi-card"><div className="kpi-icon"><CalendarDays/></div><div><span>EVENTS</span><b>{events.length}</b><small>event workspaces</small></div></div>
   <div className="kpi-card"><div className="kpi-icon"><ClipboardCheck/></div><div><span>ATTENDANCE</span><b>{attendanceTotal}</b><small>{present} present · {absent} absent</small></div></div>
   <div className="kpi-card"><div className="kpi-icon"><CheckCircle2/></div><div><span>CONFIRMED</span><b>{confirmed}</b><small>{totalStatus?Math.round(confirmed/totalStatus*100):0}% of tracked colleges</small></div></div>
   <div className="kpi-card"><div className="kpi-icon"><Clock3/></div><div><span>SCHEDULE</span><b>{slots.length}</b><small>configured time slots</small></div></div>
  </section>

  <section className="dashboard-main-grid">
   <div className="dashboard-panel participation-panel">
    <div className="panel-heading">
      <div><span className="eyebrow">EVENT PERFORMANCE</span><h3>Participation overview</h3><p>Which events are attracting the most registered college participation.</p></div>
      <div className="panel-icon"><BarChart3/></div>
    </div>
    <div className="event-ranking">
      {topEvents.map((x,i)=><div className="event-rank-row" key={x.name}>
        <div className="rank-number">{String(i+1).padStart(2,"0")}</div>
        <div className="rank-info"><b>{x.name}</b><span>{x.count} participating college record{x.count===1?"":"s"}</span></div>
        <div className="rank-track"><i style={{width:`${x.count/max*100}%`}}/></div>
        <strong>{x.count}</strong>
      </div>)}
      {!topEvents.length&&<div className="empty">No event participation data yet.</div>}
    </div>
   </div>

   <div className="dashboard-panel status-panel">
    <div className="panel-heading"><div><span className="eyebrow">REGISTRATION HEALTH</span><h3>College confirmations</h3></div><div className="panel-icon"><ShieldCheck/></div></div>
    <div className="status-ring-wrap">
      <div className="status-ring" style={{background:`conic-gradient(var(--ok) 0 ${confirmed/(totalStatus||1)*100}%,var(--warn) 0 ${(confirmed+pending)/(totalStatus||1)*100}%,var(--danger) 0 100%)`}}>
       <div><b>{totalStatus}</b><span>tracked</span></div>
      </div>
      <div className="status-list">
       <div><i className="ok-dot"/><span>Confirmed</span><b>{confirmed}</b></div>
       <div><i className="warn-dot"/><span>Pending</span><b>{pending}</b></div>
       <div><i className="danger-dot"/><span>Denied</span><b>{denied}</b></div>
      </div>
    </div>
    <div className="status-progress"><span><i style={{width:`${confirmed/(totalStatus||1)*100}%`}}/></span><small>{totalStatus?Math.round(confirmed/totalStatus*100):0}% confirmed</small></div>
   </div>
  </section>

  <section className="dashboard-lower-grid">
   <div className="dashboard-panel attendance-panel">
    <div className="panel-heading"><div><span className="eyebrow">LIVE ATTENDANCE</span><h3>On-site marking</h3><p>Attendance recorded since the current analytics baseline.</p></div><div className="panel-icon"><UserRoundCheck/></div></div>
    <div className="attendance-big"><div><b>{attendanceTotal}</b><span>total marks</span></div><div className="attendance-split"><div><b>{present}</b><span>Present</span><i><em style={{width:`${present/(attendanceTotal||1)*100}%`}}/></i></div><div><b>{absent}</b><span>Absent</span><i><em style={{width:`${absent/(attendanceTotal||1)*100}%`}}/></i></div></div></div>
   </div>

   <div className="dashboard-panel security-panel">
    <div className="panel-heading"><div><span className="eyebrow">SYSTEM HEALTH</span><h3>Control posture</h3></div><div className="panel-icon"><ShieldAlert/></div></div>
    <div className="health-list">
      <div><span className="health-check">✓</span><div><b>Access control</b><small>RLS protection enabled</small></div><i>SECURE</i></div>
      <div><span className="health-check">✓</span><div><b>Realtime presence</b><small>{activeSessions} operator{activeSessions===1?"":"s"} active</small></div><i>LIVE</i></div>
      <div><span className="health-check">✓</span><div><b>Audit trail</b><small>{logs.length} actions available</small></div><i>RECORDING</i></div>
    </div>
   </div>

   <div className="dashboard-panel activity-panel">
    <div className="panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Latest changes</h3></div><div className="panel-icon"><History/></div></div>
    <div className="activity-feed">
      {logs.slice(0,6).map(x=><div className="activity-item" key={x.id}><span className="activity-mark"><Activity size={13}/></span><div><b>{x.action.replaceAll("_"," ")}</b><small>{actor(x.actor_id)} · {x.entity_type}</small></div><time>{new Date(x.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</time></div>)}
      {!logs.length&&<div className="empty">No recent activity recorded.</div>}
    </div>
   </div>

   <div className="dashboard-panel operators-panel">
    <div className="panel-heading"><div><span className="eyebrow">OPERATORS</span><h3>Who's active</h3></div><div className="panel-icon"><Wifi/></div></div>
    <div className="operator-list">
      {sessions.slice(0,6).map(x=>{const active=Date.now()-new Date(x.last_seen||0).getTime()<90000;return <div className="operator-row" key={x.user_id}><span className={active?"operator-avatar active":"operator-avatar"}>{(actor(x.user_id)||"?").slice(0,1).toUpperCase()}</span><div><b>{actor(x.user_id)}</b><small>{profiles.find(p=>p.id===x.user_id)?.role||"account"} · {x.current_page||"home"}</small></div><i className={active?"online-pill":"offline-pill"}>{active?"Active":"Idle"}</i></div>})}
      {!sessions.length&&<div className="empty">No operator sessions yet.</div>}
    </div>
   </div>
  </section>

  <section className="dashboard-reset-row">
    <div><span className="eyebrow">ANALYTICS CONTROL</span><b>Reset statistics baseline</b><small>Analytics only. Colleges, participants, registrations, events and schedules are never deleted.</small></div>
    <AdminAnalyticsReset onReset={async()=>{await loadAnalytics();if(reload)await reload()}}/>
  </section>
 </div>
}
function AdminAnalyticsReset({onReset}){
 const [show,setShow]=useState(false),[pass,setPass]=useState(""),[busy,setBusy]=useState(false);
 async function reset(){
   if(pass!=="FORCE000"){toastGlobal("Enter the correct force password.");return}
   if(!confirm("Reset analytics statistics only? No colleges, participants, events, registrations or schedule data will be deleted.")){return}
   setBusy(true);
   const {error}=await supabase.rpc("force_reset_analytics",{reset_password:pass});
   if(error){alert(error.message);setBusy(false);return}
   await supabase.rpc("write_audit",{p_action:"reset_analytics",p_entity_type:"analytics",p_entity_id:null,p_details:{scope:"analytics_only"}});
   setPass("");setShow(false);setBusy(false);await onReset();
 }
 return <div className="analytics-reset"><button className="secondary danger-outline" onClick={()=>setShow(true)}><RefreshCw size={15}/> Force reset statistics</button>{show&&<div className="force-reset-box"><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Force password" autoFocus/><button className="primary" disabled={busy} onClick={reset}>{busy?"Resetting…":"Confirm reset"}</button><button className="secondary" onClick={()=>{setShow(false);setPass("")}}>Cancel</button><small>Required: FORCE000 · Analytics baseline only</small></div>}</div>
}
function toastGlobal(message){alert(message)}

function Stat({icon:I,value,label}){return <div className="stat-card"><I/><b>{value}</b><span>{label}</span></div>}

function AdminExports({colleges,events,students,slots,masterSlots=[],participation,attendance,privateData,participantEvents}){
 const data={colleges,events,participants:students,schedule:slots,event_college_participation:participation,participant_event_participation:participantEvents,attendance,schedule_master:masterSlots,private_college_contacts:privateData?.contacts||[],college_status:privateData?.status||[],private_participant_contacts:privateData?.participantContacts||[]};
 function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
 function json(){downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`aquadesk-export-${new Date().toISOString().slice(0,10)}.json`)}
 function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
 function excel(){const sheets=Object.entries(data).map(([name,rows])=>{const cols=[...new Set(rows.flatMap(r=>Object.keys(r||{})))];return `<Worksheet ss:Name="${esc(name.slice(0,31))}"><Table><Row>${cols.map(c=>`<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join("")}</Row>${rows.map(r=>`<Row>${cols.map(c=>`<Cell><Data ss:Type="String">${esc(r[c])}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet>`}).join("");const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/></Style></Styles>${sheets}</Workbook>`;downloadBlob(new Blob([xml],{type:"application/vnd.ms-excel"}),`aquadesk-export-${new Date().toISOString().slice(0,10)}.xls`)}
 return <div className="admin-section export-centre"><div className="admin-section-head"><div><span className="eyebrow">SUPER ADMIN ONLY</span><h3>Export Centre</h3><p className="muted">Download the complete operational dataset. Treat exported files as confidential.</p></div></div><div className="export-actions"><button className="export-card" onClick={json}><FileJson/><div><b>Download JSON</b><span>Machine-readable full dataset</span></div><Download/></button><button className="export-card" onClick={excel}><FileSpreadsheet/><div><b>Download Excel</b><span>Multi-sheet workbook compatible with Excel</span></div><Download/></button></div><div className="export-summary"><span>{Object.values(data).reduce((n,a)=>n+a.length,0)} records across {Object.keys(data).length} datasets</span><span><LockKeyhole/> Includes private admin-only data</span></div></div>}

function AdminColleges({colleges,reload,toast,editing,setEditing,show,setShow}){const [form,setForm]=useState(emptyCollege),[contact,setContact]=useState(emptyContact),[status,setStatus]=useState("pending");useEffect(()=>{if(editing){setForm({...editing});supabase.from("college_contacts").select("*").eq("college_id",editing.id).maybeSingle().then(({data})=>setContact({...emptyContact,...data}));supabase.from("college_status").select("*").eq("college_id",editing.id).maybeSingle().then(({data})=>setStatus(data?.status||"pending"))}else{setForm(emptyCollege);setContact(emptyContact);setStatus("pending")}},[editing]);
 async function save(e){e.preventDefault();let collegeId=editing?.id;let res=editing?await supabase.from("colleges").update(form).eq("id",editing.id).select().single():await supabase.from("colleges").insert(form).select().single();if(res.error){toast(res.error.message);return}collegeId=res.data.id;await supabase.from("college_contacts").upsert({...contact,college_id:collegeId});await supabase.from("college_status").upsert({college_id:collegeId,status,note:null,confirmed_at:status==="confirmed"?new Date().toISOString():null});await supabase.rpc("write_audit",{p_action:editing?"update_college":"create_college",p_entity_type:"college",p_entity_id:collegeId,p_details:{name:form.name}});toast(editing?"College updated":"College created");setShow(false);setEditing(null);await reload()}
 async function remove(id){if(!confirm("Delete this college and its participants?"))return;const {error}=await supabase.from("colleges").delete().eq("id",id);toast(error?error.message:"College deleted");if(!error)await reload()}
 return <div className="admin-section"><AdminHeader title="College directory" action={()=>{setEditing(null);setShow(true)}}/><div className="manage-list">{colleges.map(c=><div key={c.id}><div className="list-main"><div className="mini-logo">{c.logo_url?<img src={c.logo_url} alt=""/>:<Building2/>}</div><div><b>{c.name}</b><span>{c.location||"No location"}</span></div></div><div className="row-actions"><button onClick={()=>{setEditing(c);setShow(true)}}><Edit3/></button><button className="danger" onClick={()=>remove(c.id)}><Trash2/></button></div></div>)}</div>{show&&<FormModal title={editing?"Edit college":"Add college"} close={()=>{setShow(false);setEditing(null)}}><form onSubmit={save}><LogoUpload value={form.logo_url} onChange={v=>setForm({...form,logo_url:v})} folder="colleges"/><div className="grid2"><Field label="College name" value={form.name} set={v=>setForm({...form,name:v})} required/><Field label="Location" value={form.location} set={v=>setForm({...form,location:v})}/></div><h4>Private contacts</h4><div className="grid2"><Field label="HOD name" value={contact.hod_name} set={v=>setContact({...contact,hod_name:v})}/><Field label="HOD phone" value={contact.hod_phone} set={v=>setContact({...contact,hod_phone:v})}/><Field label="HOD email" value={contact.hod_email} set={v=>setContact({...contact,hod_email:v})}/><Field label="Coordinator name" value={contact.coordinator_name} set={v=>setContact({...contact,coordinator_name:v})}/><Field label="Coordinator phone" value={contact.coordinator_phone} set={v=>setContact({...contact,coordinator_phone:v})}/><Field label="Coordinator email" value={contact.coordinator_email} set={v=>setContact({...contact,coordinator_email:v})}/></div><Field label="Private notes" value={contact.private_notes} set={v=>setContact({...contact,private_notes:v})} textarea/><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="denied">Denied</option></select></label><button className="primary full"><Save/> Save college</button></form></FormModal>}</div>}

function AdminParticipants({colleges,events,students,participantEvents,reload,toast,editing,setEditing,show,setShow}){const [form,setForm]=useState({name:"",team_name:"",college_id:""}),[contact,setContact]=useState({phone:"",email:""}),[selectedEvents,setSelectedEvents]=useState([]),[filter,setFilter]=useState("");useEffect(()=>{if(editing){setForm({name:editing.name,team_name:editing.team_name||"",college_id:editing.college_id});supabase.from("participant_contacts").select("*").eq("participant_id",editing.id).maybeSingle().then(({data})=>setContact({phone:data?.phone||"",email:data?.email||""}));supabase.from("participant_event_participation").select("event_id").eq("participant_id",editing.id).eq("participating",true).then(({data})=>setSelectedEvents((data||[]).map(x=>x.event_id)))}else{setForm({name:"",team_name:"",college_id:colleges[0]?.id||""});setContact({phone:"",email:""});setSelectedEvents([])}},[editing,colleges]);const eventNames=id=>(participantEvents||[]).filter(x=>x.participant_id===id&&x.participating).map(x=>events.find(e=>e.id===x.event_id)?.name).filter(Boolean);const visible=students.filter(s=>(s.name+" "+(colleges.find(c=>c.id===s.college_id)?.name||"")+" "+eventNames(s.id).join(" ")).toLowerCase().includes(filter.toLowerCase()));async function save(e){e.preventDefault();let res=editing?await supabase.from("participants_public").update(form).eq("id",editing.id).select().single():await supabase.from("participants_public").insert(form).select().single();if(res.error){toast(res.error.message);return}const pid=res.data.id;await supabase.from("participant_contacts").upsert({participant_id:pid,...contact});await supabase.from("participant_event_participation").delete().eq("participant_id",pid);if(selectedEvents.length)await supabase.from("participant_event_participation").insert(selectedEvents.map(event_id=>({participant_id:pid,event_id,participating:true})));await supabase.rpc("write_audit",{p_action:editing?"update_participant":"create_participant",p_entity_type:"participant",p_entity_id:pid,p_details:{name:form.name,event_ids:selectedEvents}});toast(editing?"Participant updated":"Participant added");setShow(false);setEditing(null);await reload()}async function remove(id){if(!confirm("Delete participant and private contact data?"))return;const {error}=await supabase.from("participants_public").delete().eq("id",id);toast(error?error.message:"Participant deleted");if(!error)await reload()}return <div className="admin-section"><AdminHeader title="Participants & event rosters" action={()=>{setEditing(null);setShow(true)}}/><div className="list-toolbar"><div className="search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search participant, college or event"/></div><span><Filter size={13}/> {visible.length} shown</span></div><div className="manage-list roster-list">{visible.map(s=><div key={s.id}><div className="list-main"><Users/><div><b>{s.name}</b><span>{colleges.find(c=>c.id===s.college_id)?.name||"Unknown college"} · {s.team_name||"No team"}</span><div className="roster-events">{eventNames(s.id).length?eventNames(s.id).map(n=><em key={n}>{n}</em>):<em className="muted-chip">No event assigned</em>}</div></div></div><div className="row-actions"><button onClick={()=>{setEditing(s);setShow(true)}}><Edit3/></button><button className="danger" onClick={()=>remove(s.id)}><Trash2/></button></div></div>)}{!visible.length&&<div className="empty">No participants match your search.</div>}</div>{show&&<FormModal title={editing?"Edit participant":"Add participant"} close={()=>{setShow(false);setEditing(null)}}><form onSubmit={save}><div className="grid2"><Field label="Participant name" value={form.name} set={v=>setForm({...form,name:v})} required/><label>College<select value={form.college_id} onChange={e=>setForm({...form,college_id:e.target.value})} required>{colleges.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Field label="Team name" value={form.team_name} set={v=>setForm({...form,team_name:v})}/><Field label="Phone (private)" value={contact.phone} set={v=>setContact({...contact,phone:v})}/><Field label="Email (private)" value={contact.email} set={v=>setContact({...contact,email:v})}/></div><h4>Events this participant is registered for</h4><div className="event-checks">{events.map(ev=><label key={ev.id}><input type="checkbox" checked={selectedEvents.includes(ev.id)} onChange={()=>setSelectedEvents(x=>x.includes(ev.id)?x.filter(id=>id!==ev.id):[...x,ev.id])}/><span>{ev.name}</span></label>)}</div><button className="primary full"><Save/> Save participant</button></form></FormModal>}</div>}

function AdminEvents({events,reload,toast,editing,setEditing,show,setShow}){
 const [form,setForm]=useState(emptyEvent);
 const [eventSlots,setEventSlots]=useState([]);
 const [deletedSlots,setDeletedSlots]=useState([]);
 const [loadingSlots,setLoadingSlots]=useState(false);
 const [saving,setSaving]=useState(false);
 const meta=editing?officialMeta(editing):null;
 const brochureKey=meta?.key||editing?.name||"";
 const brochureHeads=BROCHURE_EVENT_HEADS[brochureKey]||[];
 const brochureSchedule=scheduleSeed.filter(x=>x[3]===brochureKey).map((x,i)=>({id:`seed-${i}`,event_id:editing?.id||"",event_date:x[0],start_time:x[1],end_time:x[2],event_name:brochureKey,venue:x[4],_seed:true}));
 useEffect(()=>{
   let alive=true;
   setForm(editing?{...editing}:emptyEvent);
   setDeletedSlots([]);
   if(!editing){setEventSlots([]);return}
   setLoadingSlots(true);
   supabase.from("event_schedule").select("id,event_id,event_date,start_time,end_time,venue,event_name").eq("event_id",editing.id).order("event_date").order("start_time").then(({data,error})=>{
     if(!alive)return;
     if(error){console.warn("event edit schedule",error.message);setEventSlots([])}
     else setEventSlots(data||[]);
     setLoadingSlots(false);
   });
   return()=>{alive=false};
 },[editing]);
 function updateSlot(index,key,value){setEventSlots(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row))}
 function addSlot(){setEventSlots(rows=>[...rows,{event_id:editing?.id||"",event_date:"",start_time:"",end_time:"",venue:"",event_name:displayEventName(editing)||form.name||""}])}
 function removeSlot(index){setEventSlots(rows=>{const row=rows[index];if(row?.id&&!row._seed)setDeletedSlots(ids=>[...ids,row.id]);return rows.filter((_,i)=>i!==index)})}
 function useBrochureHeads(){setForm(f=>({...f,current_heads:brochureHeads.join("\n")}));toast("Brochure coordinator details loaded into the editor.")}
 function importBrochureSchedule(){
   if(!editing){toast("Save the event first, then import its brochure schedule.");return}
   setEventSlots(brochureSchedule.map(x=>({...x,_seed:false,id:undefined,event_id:editing.id,event_name:form.name||brochureKey})));
   toast("Brochure schedule loaded. Save event to publish it to the database.");
 }
 async function save(e){
   e.preventDefault();
   if(saving)return;
   setSaving(true);
   const eventPayload={name:form.name,logo_url:form.logo_url||"",description:form.description||"",current_heads:form.current_heads||"",rules:form.rules||""};
   const res=editing?await supabase.from("events").update(eventPayload).eq("id",editing.id).select().single():await supabase.from("events").insert(eventPayload).select().single();
   if(res.error){toast(res.error.message);setSaving(false);return}
   const id=editing?.id||res.data?.id;
   if(!id){toast("Event saved, but no event ID was returned.");setSaving(false);return}
   if(editing&&deletedSlots.length){const del=await supabase.from("event_schedule").delete().in("id",deletedSlots);if(del.error){toast(`Event saved, but schedule deletion failed: ${del.error.message}`);setSaving(false);return}}
   const realSlots=eventSlots.filter(x=>!x._seed && x.event_date && x.start_time && x.venue);
   if(realSlots.length){
     const rows=realSlots.map(x=>({...(x.id?{id:x.id}:{}),event_id:id,event_date:x.event_date,start_time:x.start_time,end_time:x.end_time||null,venue:x.venue,event_name:eventPayload.name}));
     const sr=await supabase.from("event_schedule").upsert(rows,{onConflict:"id"});
     if(sr.error){toast(`Event saved, but schedule save failed: ${sr.error.message}`);setSaving(false);return}
   }
   await supabase.rpc("write_audit",{p_action:editing?"update_event":"create_event",p_entity_type:"event",p_entity_id:id,p_details:{name:eventPayload.name,schedule_slots:realSlots.length,coordinators:eventPayload.current_heads}});
   toast(editing?"Event, coordinators & schedule updated":"Event created");
   setSaving(false);setShow(false);setEditing(null);await reload();
 }
 async function remove(id){if(!confirm("Delete event and its schedule?"))return;const {error}=await supabase.from("events").delete().eq("id",id);toast(error?error.message:"Event deleted");if(!error)await reload()}
 return <div className="admin-section">
  <AdminHeader title="Events & event details" action={()=>{setEditing(null);setShow(true)}}/>
  <div className="manage-list">{events.map(e=><div key={e.id}>
    <div className="list-main"><div className="mini-logo">{e.logo_url?<img src={e.logo_url} alt=""/>:<CalendarDays/>}</div><div><b>{displayEventName(e)}</b><span>{e.current_heads?.split("\n")[0]?.split(" :")[0]?.split(" - ")[0]||"No coordinators added"}</span></div></div>
    <div className="row-actions"><button onClick={()=>{setEditing(e);setShow(true)}}><Edit3/></button><button className="danger" onClick={()=>remove(e.id)}><Trash2/></button></div>
  </div>)}</div>
  {show&&<FormModal title={editing?`Edit ${displayEventName(editing)}`:"Add event"} close={()=>{setShow(false);setEditing(null)}}>
   <form onSubmit={save}>
    <div className="admin-edit-intro"><CalendarDays size={18}/><div><b>Complete event control</b><span>Edit public event information, coordinator contacts and every linked timetable slot from one place.</span></div></div>
    <LogoUpload value={form.logo_url} onChange={v=>setForm({...form,logo_url:v})} folder="events"/>
    <div className="grid2"><Field label="Event name" value={form.name} set={v=>setForm({...form,name:v})} required/><Field label="Short category / subtitle" value={form.description} set={v=>setForm({...form,description:v})}/></div>
    <section className="admin-edit-block">
      <div className="admin-edit-block-head"><div><span className="eyebrow">EVENT COORDINATORS</span><h4>Coordinator details</h4><small>Name + phone, one coordinator per line.</small></div>{editing&&brochureHeads.length>0&&<button type="button" className="secondary small" onClick={useBrochureHeads}><FileText size={14}/> Use brochure details</button>}</div>
      <Field label="Coordinator names & phone numbers" value={form.current_heads} set={v=>setForm({...form,current_heads:v})} textarea/>
      {brochureHeads.length>0&&<div className="brochure-reference"><b>Official brochure reference</b>{brochureHeads.map((h,i)=><span key={i}><UserRound size={13}/>{h}</span>)}</div>}
    </section>
    <section className="admin-edit-block">
      <div className="admin-edit-block-head"><div><span className="eyebrow">OFFICIAL SCHEDULE</span><h4>Event timetable</h4><small>These slots are stored in <code>event_schedule</code> and power the public Schedule page.</small></div><button type="button" className="primary small" onClick={addSlot}><Plus size={14}/> Add slot</button></div>
      {!editing&&<div className="edit-hint"><AlertTriangle size={15}/> Save this event first. After it has an ID, you can add and manage its timetable slots here.</div>}
      {editing&&brochureSchedule.length>0&&!eventSlots.length&&<button type="button" className="secondary full import-schedule-btn" onClick={importBrochureSchedule}><CalendarDays size={15}/> Load official brochure schedule into database editor</button>}
      {loadingSlots?<div className="empty">Loading event schedule…</div>:editing&&eventSlots.length?<div className="event-edit-schedule-list">{eventSlots.map((slot,i)=><div className="event-edit-schedule-row" key={slot.id||`new-${i}`}>
        <div className="slot-index">{String(i+1).padStart(2,"0")}</div>
        <div className="slot-fields"><Field label="Date" type="date" value={slot.event_date||""} set={v=>updateSlot(i,"event_date",v)} required/><Field label="Start" type="time" value={slot.start_time||""} set={v=>updateSlot(i,"start_time",v)} required/><Field label="End" type="time" value={slot.end_time||""} set={v=>updateSlot(i,"end_time",v)}/><Field label="Venue" value={slot.venue||""} set={v=>updateSlot(i,"venue",v)} required/></div>
        <button type="button" className="icon-danger" onClick={()=>removeSlot(i)} title="Remove slot"><Trash2 size={15}/></button>
      </div>)}</div>:editing?<div className="empty">No timetable rows are currently stored for this event.</div>:null}
      {brochureSchedule.length>0&&<div className="brochure-reference schedule-reference"><b>Official brochure timetable reference</b>{brochureSchedule.map((x,i)=><span key={i}><CalendarDays size={13}/><strong>{x.event_date}</strong><em>{fmtTime(x.start_time)}{x.end_time?` — ${fmtTime(x.end_time)}`:" onwards"}</em><small>{x.venue}</small></span>)}{editing&&<small className="reference-note">These are the supplied official timetable values. Database rows above are the live editable schedule. Use “Load official brochure schedule into database editor” to copy them into the editable rows.</small>}</div>}
    </section>
    <section className="admin-edit-block"><span className="eyebrow">PUBLIC EVENT CONTENT</span><h4>Rules / details</h4><Field label="Rules / details" value={form.rules} set={v=>setForm({...form,rules:v})} textarea/></section>
    <button className="primary full" disabled={saving}>{saving?<RefreshCw className="spin"/>:<Save/>} {saving?"Saving event control…":"Save event + coordinators + schedule"}</button>
   </form>
  </FormModal>}
 </div>
}
function AdminSchedule({events,slots,masterSlots=[],reload,toast,editing,setEditing,show,setShow}){
 const [view,setView]=useState("all");
 const [filter,setFilter]=useState("");
 const official=officialEvents(events);
 const canonical=mergedScheduleRows(events,masterSlots);
 const [form,setForm]=useState({event_id:"",event_name:"",event_date:"",start_time:"",end_time:"",venue:"",sort_order:0,source_key:""});
 useEffect(()=>{setForm(editing?{...editing}:{event_id:events[0]?.id||"",event_name:official[0]?displayEventName(official[0]):"",event_date:"2026-09-17",start_time:"08:00",end_time:"",venue:"",sort_order:canonical.length,source_key:""})},[editing,events]);
 const visible=canonical.filter(r=>(`${r.event_name} ${r.venue} ${r.event_date}`.toLowerCase().includes(filter.toLowerCase())));
 const day1=visible.filter(r=>r.event_date==="2026-09-17"),day2=visible.filter(r=>r.event_date==="2026-09-18");
 function openEdit(row){setEditing(row);setShow(true)}
 function openAdd(){setEditing(null);setShow(true)}
 async function save(e){
  e.preventDefault();
  const ev=events.find(x=>x.id===form.event_id);
  const name=form.event_name||displayEventName(ev||{})||"Programme";
  const sourceKey=form.source_key||`${form.event_date}|${form.start_time}|${name}|${form.venue}`;
  const payload={source_key:sourceKey,event_id:form.event_id||null,event_name:name,event_date:form.event_date,start_time:form.start_time,end_time:form.end_time||null,venue:form.venue||"",sort_order:Number(form.sort_order||0),updated_at:new Date().toISOString()};
  if(editing?.id)payload.id=editing.id;
  const {error}=await supabase.from("schedule_master").upsert(payload,{onConflict:"source_key"});
  if(error){toast(`Schedule could not be saved: ${error.message}. Run the supplied schedule-master migration in Supabase first.`);return}
  toast(editing?"Timetable entry updated":"Timetable entry added");setShow(false);setEditing(null);await reload();
 }
 async function remove(row){if(!row.id){toast("This brochure reference is not in the database yet. Use Import all brochure entries first.");return}if(!confirm(`Delete ${row.event_name} from the live timetable?`))return;const {error}=await supabase.from("schedule_master").delete().eq("id",row.id);toast(error?error.message:"Timetable entry deleted");if(!error)await reload()}
 async function importAll(){
  // Always re-read the database before importing. This prevents stale React state
  // from attempting to insert a source_key that already exists in Supabase.
  const {data:liveRows,error:readError}=await supabase.from("schedule_master").select("id,source_key");
  if(readError){toast(`Import failed: ${readError.message}. Make sure schedule_master exists and refresh the page.`);return}
  const existing=new Set((liveRows||[]).map(r=>r.source_key));
  const rows=brochureScheduleRows(events)
    .filter(r=>r.source_key && !existing.has(r.source_key))
    .map(r=>({...r,updated_at:new Date().toISOString()}));
  if(!rows.length){toast("All official brochure timetable entries are already in the database; existing edits were preserved.");await reload();return}
  const {error}=await supabase.from("schedule_master").insert(rows);
  if(error){
    // If another tab/import created a row between the read and insert, retry
    // safely using the conflict target instead of surfacing a duplicate-key error.
    if(String(error.message||"").toLowerCase().includes("duplicate key") || String(error.code||"")==="23505"){
      const {error:retryError}=await supabase.from("schedule_master").upsert(rows,{onConflict:"source_key",ignoreDuplicates:true});
      if(retryError){toast(`Import failed: ${retryError.message}`);return}
      toast("Timetable is already imported; existing edits were preserved.");await reload();return
    }
    toast(`Import failed: ${error.message}`);return
  }
  toast(`Imported ${rows.length} missing brochure timetable entries. Existing edits were preserved.`);await reload();
 }
 function renderRow(row,i){const ev=scheduleEventForRow(row,events);return <article className="admin-master-schedule-row" key={row.id||row.source_key||i}>
   <div className="admin-master-date"><b>{row.event_date?.slice(8,10)}</b><span>{row.event_date?.slice(5,7)==="09"?"SEP":"DATE"}</span></div>
   <div className="admin-master-time"><strong>{fmtTime(row.start_time)}</strong><span>{row.end_time?`— ${fmtTime(row.end_time)}`:"onwards"}</span></div>
   <div className="admin-master-main"><span>{ev?displayProgramName(ev):"OFFICIAL PROGRAMME"}</span><h4>{ev?displayEventName(ev):row.event_name}</h4><small><MapPin size={12}/>{row.venue||"Venue not set"}</small></div>
   <div className="admin-master-state"><span className={row.id?"db-state":"ref-state"}>{row.id?"LIVE DB":"BROCHURE"}</span></div>
   <div className="admin-master-actions"><button onClick={()=>openEdit(row)} title="Edit every detail"><Edit3/></button><button className="danger" onClick={()=>remove(row)} title="Delete live entry"><Trash2/></button></div>
 </article>}
 function renderDay(label,items){return <section className="admin-master-day"><div className="admin-master-day-head"><div><span className="eyebrow">{label}</span><h4>{label==="DAY 01"?"17 September 2026":"18 September 2026"}</h4></div><b>{items.length} entries</b></div><div className="admin-master-list">{items.map(renderRow)}</div></section>}
 return <div className="admin-section admin-master-schedule">
  <div className="admin-section-head admin-master-head"><div><span className="eyebrow">MASTER TIMETABLE · SUPER ADMIN</span><h3>Official schedule database</h3><p className="muted">All {scheduleSeed.length} brochure entries are editable here — including registration, inaugural, every competition slot, and valedictory.</p></div><div className="admin-master-head-actions"><button className="secondary small" onClick={importAll}><Download size={14}/> Import all {scheduleSeed.length}</button><button className="primary small" onClick={openAdd}><Plus size={14}/> Add entry</button></div></div>
  <div className="admin-master-summary"><div><b>{scheduleSeed.length}</b><span>official brochure entries</span></div><div><b>{masterSlots.length}</b><span>saved in database</span></div><div><b>{Math.max(0,scheduleSeed.length-masterSlots.length)}</b><span>still reference-only</span></div><div><b>{official.length}</b><span>competition events</span></div></div>
  <div className="admin-master-toolbar"><div className="admin-schedule-filters">{[["all","All entries"],["events","Competition events"]].map(([k,l])=><button key={k} className={view===k?"active":""} onClick={()=>setView(k)}>{l}</button>)}</div><label className="admin-master-search"><Search size={14}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search event, programme, venue…"/></label></div>
  {view==="all"?<>{renderDay("DAY 01",day1)}{renderDay("DAY 02",day2)}</>:<section className="admin-master-day"><div className="admin-master-day-head"><div><span className="eyebrow">COMPETITION EVENTS</span><h4>Event-by-event timetable</h4></div><b>{official.length} events</b></div><div className="admin-master-event-grid">{official.map(ev=>{const rows=canonical.filter(r=>scheduleEventForRow(r,events)?.id===ev.id);return <article key={ev.id} className="admin-master-event-card"><div><span>{displayProgramName(ev)}</span><h4>{displayEventName(ev)}</h4></div><b>{rows.length} slot{rows.length===1?"":"s"}</b><div>{rows.map((r,i)=><button key={r.id||r.source_key||i} onClick={()=>openEdit(r)}><span>{fmtTime(r.start_time)}{r.end_time?`–${fmtTime(r.end_time)}`:"+"}</span><small>{r.venue}</small><Edit3 size={13}/></button>)}</div></article>})}</div></section>}
  {show&&<FormModal title={editing?`Edit timetable · ${editing.event_name}`:"Add timetable entry"} close={()=>{setShow(false);setEditing(null)}}><form onSubmit={save} className="master-schedule-form">
    <div className="master-form-banner"><CalendarDays/><div><b>Everything on this card is editable.</b><span>Changes here become the live public timetable after saving.</span></div></div>
    <div className="grid2"><label>Linked competition event<select value={form.event_id||""} onChange={e=>{const ev=events.find(x=>x.id===e.target.value);setForm({...form,event_id:e.target.value,event_name:ev?displayEventName(ev):form.event_name})}}><option value="">Programme / ceremony (no competition)</option>{events.map(e=><option key={e.id} value={e.id}>{displayEventName(e)}</option>)}</select></label><Field label="Programme / event title" value={form.event_name||""} set={v=>setForm({...form,event_name:v})} required/><Field label="Date" type="date" value={form.event_date||""} set={v=>setForm({...form,event_date:v})} required/><Field label="Start time" type="time" value={form.start_time||""} set={v=>setForm({...form,start_time:v})} required/><Field label="End time" type="time" value={form.end_time||""} set={v=>setForm({...form,end_time:v})}/><Field label="Venue" value={form.venue||""} set={v=>setForm({...form,venue:v})} required/><Field label="Display order" type="number" value={String(form.sort_order??0)} set={v=>setForm({...form,sort_order:v})}/></div>
    <div className="master-source-key"><span>Source key</span><code>{form.source_key||"Generated automatically when saved"}</code></div><button className="primary full"><Save/> Save timetable entry</button>
  </form></FormModal>}
 </div>
}

function AdminParticipation({colleges,events,participation,reload,toast}){const [eventId,setEventId]=useState(events[0]?.id||"");useEffect(()=>{if(!eventId&&events[0])setEventId(events[0].id)},[events,eventId]);const map=new Map(participation.filter(x=>x.event_id===eventId).map(x=>[x.college_id,x]));async function toggle(college){const current=map.get(college.id);const value=!current?.participating;const {error}=await supabase.from("event_college_participation").upsert({event_id:eventId,college_id:college.id,participating:value,updated_at:new Date().toISOString()},{onConflict:"event_id,college_id"});toast(error?error.message:`${college.name}: ${value?"participating":"removed"}`);if(!error){await supabase.rpc("write_audit",{p_action:"update_event_participation",p_entity_type:"event",p_entity_id:eventId,p_details:{college_id:college.id,participating:value}});await reload()}}return <div className="admin-section"><AdminHeader title="College ↔ event participation"/><label>Choose event<select value={eventId} onChange={e=>setEventId(e.target.value)}>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><div className="participation-grid">{colleges.map(c=>{const on=map.get(c.id)?.participating;return <button className={on?"participating":""} key={c.id} onClick={()=>toggle(c)}><div className="mini-logo">{c.logo_url?<img src={c.logo_url} alt=""/>:<Building2/>}</div><div><b>{c.name}</b><span>{on?"Participating":"Not participating"}</span></div>{on?<CheckCircle2/>:<XCircle/>}</button>})}</div></div>}

function AdminAuthorizedUsers({events,reload:appReload,toast}){
 const seed=[
  ["CODEWAVE@NMAMIT.IN","CodeWave","Coding"],["LEVIATHAN@NMAMIT.IN","Leviathan","IT Manager"],
  ["CORALCANVAS@NMAMIT.IN","Coral Canvas","Web Design"],["AQUABYTE@NMAMIT.IN","Aqua Byte","IT Quiz"],
  ["AQUAVERSE@NMAMIT.IN","Aquaverse","Tech Talk"],["MEGPITCH@NMAMIT.IN","The Mega Pitch","Startup Event"],
  ["TIDETAILOR@NMAMIT.IN","Tide & Tailor","Fashion Show"],["SUBMARINE@NMAMIT.IN","Submarine","Photography & Videography"],
  ["OCEANENIGMA@NMAMIT.IN","Ocean Enigma","Surprise Event"],["ABYSSARENA@NMAMIT.IN","Abyss Arena","Gaming / BGMI"],
  ["TECH@NMAMIT.IN","TECH","All Events"]
 ];
 const [accounts,setAccounts]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(null);
 function mergeRows(data){const db=new Map((data||[]).map(a=>[a.email.toUpperCase(),a]));return seed.map(([email,brand,actual])=>({...db.get(email)||{},email,display_name:db.get(email)?.display_name||brand,event_name:db.get(email)?.event_name||brand,actual_event_name:actual,assigned_event_id:db.get(email)?.assigned_event_id||null}));}
 async function load(){setLoading(true);const {data,error}=await supabase.from("authorized_event_accounts").select("email,display_name,event_name,assigned_event_id").order("email");if(error)toast(error.message);setAccounts(mergeRows(data));setLoading(false)}
 useEffect(()=>{load()},[]);
 async function assign(email,eventId){
  if(email.toUpperCase()==="TECH@NMAMIT.IN"){return}
  setSaving(email);
  const {error}=await supabase.rpc("assign_authorized_event",{p_email:email,p_event_id:eventId||null});
  if(error){
   // Fallback keeps the UI usable if an older database does not yet have the RPC.
   const ev=events.find(e=>e.id===eventId);
   const {error:fallback}=await supabase.from("authorized_event_accounts").update({assigned_event_id:eventId||null,updated_at:new Date().toISOString()}).eq("email",email);
   if(fallback){toast(error.message);setSaving(null);return}
   const {data:u}=await supabase.from("authorized_event_accounts").select("event_name,display_name").eq("email",email).maybeSingle();
   if(u&&ev){await supabase.from("authorized_event_accounts").update({event_name:u.event_name||ev.name}).eq("email",email)}
  }
  toast(eventId?`${email} assigned successfully`:`${email} is now unassigned`);
  await load();
  if(appReload)await appReload();
  setSaving(null);
 }
 function resolveActual(a){
  return a.actual_event_name||programName(a.event_name)||"Not mapped";
 }
 return <div className="admin-section">
  <div className="admin-section-head"><div><span className="eyebrow">ACCESS CONTROL · MANUAL ASSIGNMENT</span><h3>Authorised accounts & event assignment</h3></div><button className="secondary small" onClick={load}><RefreshCw size={14}/> Refresh</button></div>
  <p className="muted">All 10 event accounts and TECH are always listed. Super Admin can manually assign any event account to any database event. The selected assignment is copied to the user's profile, so the designated account immediately receives that event workspace.</p>
  <div className="authorised-card-grid">
   {loading?<div className="empty">Loading accounts…</div>:accounts.map(a=>{
    const assigned=events.find(e=>e.id===a.assigned_event_id);const isTech=a.email.toUpperCase()==="TECH@NMAMIT.IN";return <div className={`authorised-account-card ${isTech?"global-account":""}`} key={a.email}>
      <div className="aac-top"><div className="aac-icon">{isTech?<ShieldCheck/>:<UserRoundCheck/>}</div><div><span>{isTech?"GLOBAL TECHNICAL ACCESS":"EVENT AUTHORISED ACCOUNT"}</span><b>{a.email}</b><small>{a.display_name}</small></div></div>
      <div className="aac-map"><div><label>Assigned workspace</label><strong>{isTech?"TECH · All events":a.event_name}</strong></div><div><label>Actual event</label><strong>{isTech?"All Events":resolveActual(a)}</strong></div></div>
      <div className="aac-control">{isTech?<div className="user-state active"><CheckCircle2/> All events · view + attendance · no edits</div>:<><label>Admin assignment<select disabled={saving===a.email} value={a.assigned_event_id||""} onChange={e=>assign(a.email,e.target.value)}><option value="">Unassigned — choose manually</option>{events.map(e=><option key={e.id} value={e.id}>{e.name} · {programName(e.name)}</option>)}</select></label><div className={assigned?"user-state active":"user-state"}>{assigned?<><CheckCircle2/> Assigned · {assigned.name}</>:<><Clock3/> Unassigned</>}</div></>}{saving===a.email&&<small className="saving-note">Saving assignment…</small>}</div>
    </div>})}
  </div>
 </div>
}

function AdminPublicContent(){
 const defaults={
  NAV_HOME:"Home",NAV_COLLEGES:"Colleges",NAV_EVENTS:"Events",NAV_SCHEDULE:"Schedule",NAV_RULES:"Rules",NAV_OPERATIONS:"Operations",NAV_LOGIN:"Login",NAV_ADMIN:"Admin",
  GENERAL_RULES:BROCHURE_GENERAL_RULES.join("\n"),COORDINATORS:BROCHURE_COORDINATORS.join("\n"),
  HOME_HERO_EYEBROW:"SEMAPHORE 2K26 · AQUA DESK",HOME_HERO_TITLE:"The command centre\nbeneath the surface.",
  HOME_HERO_BODY:"Explore participating colleges, discover every event, follow the official 17–18 September 2026 schedule, and let authorised teams manage confirmations and live attendance.",
  HOME_PRIMARY_CTA:"Explore colleges",HOME_SECONDARY_CTA:"Open live schedule",HOME_DIRECTORY_TITLE:"Who's joining the tide?",
  HOME_SCHEDULE_TITLE:"Two days.\nOne current.",HOME_SCHEDULE_BODY:"Every slot from the supplied Semaphore 2K26 schedule is structured so the admin can edit it later without changing the page.",HOME_SCHEDULE_CTA:"View full schedule",
  HOME_EVENT_TITLE:"Rules, heads & participation.",HOME_EVENT_BODY:"Each event has its own editable description, rules, heads, logo, schedule and participating-college matrix.",
  HOME_STAT_COLLEGES:"Participating colleges",HOME_STAT_PARTICIPANTS:"Participant names",HOME_STAT_EVENTS:"Official events",HOME_STAT_DAYS:"Event days"
 };
 const [content,setContent]=useState(defaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 useEffect(()=>{(async()=>{const {data,error}=await supabase.from("public_site_content").select("key,content").in("key",Object.keys(defaults));if(error)console.warn("public content",error.message);if(data?.length)setContent(x=>({...x,...Object.fromEntries(data.map(v=>[v.key,v.content]))}));setLoading(false)})()},[]);
 async function save(){setSaving(true);const rows=Object.entries(content).map(([key,value])=>({key,content:value,updated_at:new Date().toISOString()}));const {error}=await supabase.from("public_site_content").upsert(rows,{onConflict:"key"});setSaving(false);alert(error?error.message:"Website content published successfully");}
 const set=(key,value)=>setContent(x=>({...x,[key]:value}));
 return <div className="admin-section public-content-admin"><div className="admin-section-head"><div><span className="eyebrow">WEBSITE CONTENT CONTROL</span><h3>Every public text, from one editor</h3></div><button className="primary small" disabled={saving||loading} onClick={save}><Save size={14}/> {saving?"Saving…":"Publish all changes"}</button></div><p className="muted">Edit the small details that shape the public site. Changes are stored in <code>public_site_content</code>. Event names, logos, coordinator numbers, rules and schedules are edited in their dedicated database modules.</p>
 <section className="content-editor-card"><div className="content-editor-head"><div><span className="eyebrow">HOME PAGE</span><h4>Hero & navigation copy</h4></div><span className="content-edit-badge">LIVE EDITABLE</span></div><div className="grid2"><Field label="Home nav label" value={content.NAV_HOME} set={v=>set("NAV_HOME",v)}/><Field label="Colleges nav label" value={content.NAV_COLLEGES} set={v=>set("NAV_COLLEGES",v)}/><Field label="Events nav label" value={content.NAV_EVENTS} set={v=>set("NAV_EVENTS",v)}/><Field label="Schedule nav label" value={content.NAV_SCHEDULE} set={v=>set("NAV_SCHEDULE",v)}/><Field label="Rules nav label" value={content.NAV_RULES} set={v=>set("NAV_RULES",v)}/><Field label="Operations nav label" value={content.NAV_OPERATIONS} set={v=>set("NAV_OPERATIONS",v)}/><Field label="Login nav label" value={content.NAV_LOGIN} set={v=>set("NAV_LOGIN",v)}/><Field label="Admin nav label" value={content.NAV_ADMIN} set={v=>set("NAV_ADMIN",v)}/><Field label="Hero eyebrow" value={content.HOME_HERO_EYEBROW} set={v=>set("HOME_HERO_EYEBROW",v)}/><Field label="Primary button" value={content.HOME_PRIMARY_CTA} set={v=>set("HOME_PRIMARY_CTA",v)}/><Field label="Secondary button" value={content.HOME_SECONDARY_CTA} set={v=>set("HOME_SECONDARY_CTA",v)}/><Field label="Directory heading" value={content.HOME_DIRECTORY_TITLE} set={v=>set("HOME_DIRECTORY_TITLE",v)}/></div><Field label="Hero title — use a new line to split the headline" value={content.HOME_HERO_TITLE} set={v=>set("HOME_HERO_TITLE",v)} textarea/><Field label="Hero description" value={content.HOME_HERO_BODY} set={v=>set("HOME_HERO_BODY",v)} textarea/></section>
 <section className="content-editor-card"><div className="content-editor-head"><div><span className="eyebrow">HOME SECTIONS</span><h4>Schedule, event centre & counters</h4></div><span className="content-edit-badge">LIVE EDITABLE</span></div><Field label="Schedule heading — use a new line" value={content.HOME_SCHEDULE_TITLE} set={v=>set("HOME_SCHEDULE_TITLE",v)}/><Field label="Schedule description" value={content.HOME_SCHEDULE_BODY} set={v=>set("HOME_SCHEDULE_BODY",v)} textarea/><Field label="Schedule button" value={content.HOME_SCHEDULE_CTA} set={v=>set("HOME_SCHEDULE_CTA",v)}/><Field label="Event centre heading" value={content.HOME_EVENT_TITLE} set={v=>set("HOME_EVENT_TITLE",v)}/><Field label="Event centre description" value={content.HOME_EVENT_BODY} set={v=>set("HOME_EVENT_BODY",v)} textarea/><div className="grid2"><Field label="Colleges counter label" value={content.HOME_STAT_COLLEGES} set={v=>set("HOME_STAT_COLLEGES",v)}/><Field label="Participants counter label" value={content.HOME_STAT_PARTICIPANTS} set={v=>set("HOME_STAT_PARTICIPANTS",v)}/><Field label="Events counter label" value={content.HOME_STAT_EVENTS} set={v=>set("HOME_STAT_EVENTS",v)}/><Field label="Days counter label" value={content.HOME_STAT_DAYS} set={v=>set("HOME_STAT_DAYS",v)}/></div></section>
 <section className="content-editor-card"><div className="content-editor-head"><div><span className="eyebrow">OFFICIAL INFORMATION</span><h4>Rules & leadership / coordinator details</h4></div><span className="content-edit-badge">LIVE EDITABLE</span></div><Field label="General rules — one rule per line" value={content.GENERAL_RULES} set={v=>set("GENERAL_RULES",v)} textarea/><Field label="Leadership / core coordinator details — one person per line" value={content.COORDINATORS} set={v=>set("COORDINATORS",v)} textarea/></section>
 </div>}
function AdminLogs(){
 const [logs,setLogs]=useState([]),[profiles,setProfiles]=useState([]),[filter,setFilter]=useState(""),[loading,setLoading]=useState(true);
 async function load(){setLoading(true);const [{data:l},{data:p}]=await Promise.all([supabase.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(500),supabase.from("profiles").select("id,full_name,role")]);setLogs(l||[]);setProfiles(p||[]);setLoading(false)}
 useEffect(()=>{load();const ch=supabase.channel("audit-live").on("postgres_changes",{event:"*",schema:"public",table:"audit_logs"},load).subscribe();return()=>supabase.removeChannel(ch)},[]);
 const visible=logs.filter(l=>(l.action+" "+l.entity_type+" "+JSON.stringify(l.details||{})).toLowerCase().includes(filter.toLowerCase()));
 return <div className="admin-section activity-page"><div className="admin-section-head"><div><span className="eyebrow">SECURITY</span><h3>Audit & Activity</h3></div><button className="secondary small" onClick={load}><RefreshCw size={14}/> Refresh</button></div><div className="activity-summary"><span><Database/> {logs.length} recorded events</span><span><Clock4/> Full timestamps</span><span><ShieldCheck/> Admin-only</span></div><div className="list-toolbar"><div className="search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter actions, users, records…"/></div></div><div className="logs detailed-logs">{loading?<div className="empty">Loading activity…</div>:visible.map(l=>{const who=profiles.find(p=>p.id===l.actor_id);return <div key={l.id}><div className="activity-icon"><Activity/></div><div className="activity-copy"><b>{l.action.replaceAll("_"," ")}</b><span>{who?.full_name||"Unknown account"} · {who?.role||"unknown role"} · {l.entity_type}</span><small>{l.entity_id||"No entity id"}{l.details&&Object.keys(l.details).length?` · ${JSON.stringify(l.details)}`:""}</small></div><time>{new Date(l.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"medium"})}</time></div>})}{!loading&&!visible.length&&<div className="empty">No matching activity.</div>}</div></div>}

function SplashScreen(){return <div className="splash-screen"><div className="splash-orbit"><Waves/></div><div className="splash-title"><span>SEMAPHORE 2K26</span><b>AQUA<span>DESK</span></b><small>Initializing secure event operations</small></div><div className="loader-line"><i/></div></div>}
function FatalScreen({error,retry}){return <div className="fatal-screen"><div className="fatal-card"><AlertTriangle size={30}/><span className="eyebrow">AQUA DESK / RECOVERY</span><h1>We hit a connection problem.</h1><p>{error}</p><p className="muted">Check that the Supabase schema and environment variables are configured, then retry.</p><button className="primary" onClick={retry}><RefreshCw size={15}/> Retry connection</button></div></div>}

function RealtimeChat({session,profile,toast}){
 const [open,setOpen]=useState(false),[messages,setMessages]=useState([]),[text,setText]=useState(""),[online,setOnline]=useState([]),[profiles,setProfiles]=useState([]),[sending,setSending]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const openFromMobileNav=()=>setOpen(true);
  window.addEventListener("aquadesk:open-chat",openFromMobileNav);
  const ch=supabase.channel(`aquadesk-lounge-${session.user.id}`,{config:{broadcast:{ack:false}}});
  ch.on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages"},payload=>{
    if(!cancelled)setMessages(x=>x.some(m=>m.id===payload.new.id)?x:[...x,payload.new]);
  });
  ch.subscribe(status=>{
    if(status!=="SUBSCRIBED")return;
    if(!cancelled)setOnline([session.user.id]);
  });
  (async()=>{
    // Keep chat independent of the optional profile_directory compatibility view.
    // This prevents a missing Supabase view from producing a 404 in the browser.
    const {data:m,error:me}=await supabase
      .from("chat_messages")
      .select("id,sender_id,message,created_at,edited_at")
      .order("created_at",{ascending:false})
      .limit(100);
    if(cancelled)return;
    if(me)console.warn("chat messages",me.message);
    setMessages((m||[]).reverse());
    setProfiles([]);
  })();
  return()=>{cancelled=true;window.removeEventListener("aquadesk:open-chat",openFromMobileNav);supabase.removeChannel(ch)};
 },[session.user.id]);
 async function send(e){e?.preventDefault();const msg=text.trim();if(!msg||sending)return;setSending(true);const {error}=await supabase.from("chat_messages").insert({sender_id:session.user.id,message:msg});setSending(false);if(error)toast(error.message);else setText("")}
 const name=id=>profiles.find(p=>p.id===id)?.full_name||(id===session.user.id?profile?.full_name:null)||"User";
 return <div className={`chat-shell ${open?"open":""}`}><button className="chat-fab" onClick={()=>setOpen(!open)}><MessageCircle/><span>Team Chat</span>{online.length>1&&<i>{online.length}</i>}</button>{open&&<div className="chat-panel"><div className="chat-head"><div><b>Semaphore Live Chat</b><span><span className="live-dot"/> Chat connected</span></div><button onClick={()=>setOpen(false)}><X/></button></div><div className="chat-online"><div className="online-title"><UserRoundCheck size={14}/> Active session</div><div className="online-list"><span><i/>{profile?.full_name||session.user.email?.split("@")[0]||"You"}</span></div></div><div className="chat-messages">{messages.map(m=><div className={m.sender_id===session.user.id?"mine":"theirs"} key={m.id}><small>{name(m.sender_id)} · {new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small><p>{m.message}</p></div>)}{!messages.length&&<div className="empty">No messages yet. Start the team conversation.</div>}</div><form className="chat-compose" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a message…" maxLength={1000}/><button disabled={sending||!text.trim()}><Send size={15}/></button></form></div>}</div>
}

function AdminHeader({title,action}){return <div className="admin-section-head"><div><span className="eyebrow">MANAGE</span><h3>{title}</h3></div>{action&&<button className="primary small" onClick={action}><Plus/> Add</button>}</div>}
function Field({label,value,set,textarea,type="text",required=false}){return <label>{label}{textarea?<textarea value={value||""} onChange={e=>set(e.target.value)} required={required}/>:<input type={type} value={value||""} onChange={e=>set(e.target.value)} required={required}/>}</label>}
function FormModal({title,close,children}){return <div className="overlay"><div className="modal form-modal"><button className="close" onClick={close}><X/></button><span className="eyebrow">AQUA DESK EDITOR</span><h2>{title}</h2>{children}</div></div>}
function LogoUpload({value,onChange,folder}){const [busy,setBusy]=useState(false);async function upload(e){const file=e.target.files?.[0];if(!file)return;if(file.size>3*1024*1024){alert("Logo must be under 3 MB");return}setBusy(true);const ext=file.name.split(".").pop();const path=`${folder}/${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from("aquadesk-assets").upload(path,file,{upsert:false});if(error){alert(error.message)}else{const {data}=supabase.storage.from("aquadesk-assets").getPublicUrl(path);onChange(data.publicUrl)}setBusy(false)}return <div className="logo-editor"><div className="upload-box">{value?<img src={value} alt="logo preview" onError={e=>{e.currentTarget.style.opacity=.25}}/>:<div><Upload/><span>No logo uploaded</span></div>}<label className="upload-button">{busy?<RefreshCw className="spin"/>:<Upload/>}{busy?"Uploading…":"Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload}/></label></div><label className="logo-url-field">Logo URL / public asset<input value={value||""} onChange={e=>onChange(e.target.value)} placeholder="https://…"/></label><small className="field-help">Upload a file or paste an existing public logo URL. The URL is stored directly with the record.</small></div>}


class ErrorBoundary extends React.Component {
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error,info){console.error("AquaDesk runtime error",error,info)}
 render(){
  if(this.state.error){
   return <div className="fatal-screen"><div className="fatal-card"><ShieldAlert size={30}/><span className="eyebrow">AQUADESK RECOVERY</span><h1>The control surface hit an error.</h1><p>{this.state.error?.message||"Unexpected application error."}</p><button className="primary" onClick={()=>location.reload()}><RefreshCw size={16}/> Reload AquaDesk</button></div></div>
  }
  return this.props.children;
 }
}

createRoot(document.getElementById("root")).render(<ErrorBoundary><App/></ErrorBoundary>);
