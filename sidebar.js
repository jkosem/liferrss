/* LifeRSS M1 sidebar. Native DOM, no build step. */
const $ = id => document.getElementById(id);
const defaults = {feeds:[],articles:[],states:{}};
let data = structuredClone(defaults);
let view = "unread", activeFeed = "", selected = null, reading = false;
const unread = a => !data.states[a.id];
function feedTitle(url){return data.feeds.find(f=>f.url===url)?.title || url;}
function filtered(){
  const q = $("search").value.trim().toLowerCase();
  return data.articles.filter(a => (view==="all"||unread(a)) && (!activeFeed||activeFeed===a.feedUrl) &&
    (!q || (a.title+" "+a.summary+" "+feedTitle(a.feedUrl)).toLowerCase().includes(q)));
}
async function reload(){
  data=await browser.storage.local.get(defaults);
  render();
}
function render(){
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("allFeeds").classList.toggle("selected",!activeFeed);
  $("feeds").replaceChildren();
  for(const feed of data.feeds){
    const b=document.createElement("button");
    b.textContent=feed.title+(feed.error?" ⚠":"")+" ("+data.articles.filter(a=>a.feedUrl===feed.url&&unread(a)).length+")";
    b.title=feed.error||feed.url;
    b.classList.toggle("selected",activeFeed===feed.url);
    b.addEventListener("click",()=>{activeFeed=feed.url;reading=false;render();});
    $("feeds").append(b);
  }
  const rows=filtered();
  if(!rows.some(a=>a.id===selected)) selected=rows[0]?.id||null;
  $("articles").replaceChildren();
  if(!rows.length){const p=document.createElement("p");p.className="empty";p.textContent=data.feeds.length?"No articles in this view.":"No subscriptions yet. Click + to add your first RSS feed."; $("articles").append(p);}
  for(const a of rows){
    const b=document.createElement("button");b.className="article";
    b.classList.toggle("selected",selected===a.id);b.classList.toggle("read",!unread(a));
    const meta=document.createElement("div");meta.className="meta";meta.textContent=feedTitle(a.feedUrl)+" · "+new Date(a.published).toLocaleDateString();
    const title=document.createElement("div");title.className="title";title.textContent=a.title;
    b.append(meta,title);
    b.onclick=()=>{selected=a.id;openReader();};$("articles").append(b);
  }
  $("articles").hidden=reading;$("reader").hidden=!reading;
  if(reading) showReader();
  const errors=data.feeds.filter(f=>f.error).length;
  $("status").textContent=rows.length+" articles"+(errors?" · "+errors+" feed error(s)":"");
}
function showReader(){
  const a=data.articles.find(x=>x.id===selected);
  if(!a){reading=false;render();return;}
  $("readerTitle").textContent=a.title;
  $("readerFeed").textContent=feedTitle(a.feedUrl)+" · "+new Date(a.published).toLocaleString();
  $("readerSummary").textContent=a.summary || "No summary supplied by the feed. Open the original article to read it.";
  $("toggleRead").textContent=unread(a)?"Mark read":"Mark unread";
}
function openReader(){reading=true;render();}
function back(){reading=false;render();$("articles").focus();}
async function toggleRead(){
  if(!selected)return;
  const states={...data.states,[selected]:!data.states[selected]};
  await browser.storage.local.set({states});
  await reload();
}
function move(step,open){
  const rows=filtered();if(!rows.length)return;
  const index=rows.findIndex(a=>a.id===selected);
  selected=rows[(index+step+rows.length)%rows.length].id;
  if(open)reading=true;
  render();
  document.querySelector(".article.selected")?.scrollIntoView({block:"nearest"});
}
function openOriginal(){
  const a=data.articles.find(x=>x.id===selected);
  if(a?.link && /^https?:\/\//.test(a.link))browser.tabs.create({url:a.link});
}
async function subscribe(url){
  $("status").textContent="Fetching feed…";
  try {await browser.runtime.sendMessage({type:"addFeed",url});$("addDialog").close();$("feedUrl").value="";await reload();}
  catch(e){$("status").textContent="Unable to subscribe: "+(e.message||e);}
}
$("add").onclick=()=>{$("addDialog").showModal();$("feedUrl").focus();};
$("cancelAdd").onclick=()=>$("addDialog").close();
$("addForm").onsubmit=e=>{e.preventDefault();subscribe($("feedUrl").value.trim());};
$("help").onclick=()=>$("helpDialog").showModal();
$("closeHelp").onclick=()=>$("helpDialog").close();
$("refresh").onclick=async()=>{$("status").textContent="Refreshing…";try{await browser.runtime.sendMessage({type:"refresh"});}catch(e){$("status").textContent=e.message;}await reload();};
$("allFeeds").onclick=()=>{activeFeed="";reading=false;render();};
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;reading=false;render();});
$("search").oninput=()=>{reading=false;render();};
$("back").onclick=back;$("toggleRead").onclick=toggleRead;$("openOriginal").onclick=openOriginal;
document.addEventListener("keydown",e=>{
  if(e.target.matches("input,textarea,select")||$("addDialog").open||$("helpDialog").open)return;
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==="j"||e.key==="k"){move(e.key==="j"?1:-1,true);e.preventDefault();}
  else if(e.key==="n"||e.key==="p"){move(e.key==="n"?1:-1,false);e.preventDefault();}
  else if(e.key==="m"){toggleRead();e.preventDefault();}
  else if(e.key==="v"){openOriginal();e.preventDefault();}
  else if(e.key==="a"){$("addDialog").showModal();e.preventDefault();}
  else if(e.key==="r"){$("refresh").click();e.preventDefault();}
  else if(e.key==="/"){$("search").focus();e.preventDefault();}
  else if(e.key==="?"){$("helpDialog").showModal();e.preventDefault();}
  else if(e.key==="Escape"&&reading){back();e.preventDefault();}
});
browser.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&["feeds","articles","states"].some(k=>k in changes))reload();});
reload();
