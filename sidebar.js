/* LiferRSS v0.1 sidebar. Native DOM, no build step. */
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
  if(!rows.some(a=>a.id===selected) && !reading) selected=rows[0]?.id||null;
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
  updateReadLater();
}
async function openReader(){
  if(!selected)return;
  // Reading an article counts as read. Preserve its reader view even if it
  // disappears from the Unread list after the state update.
  reading=true;
  if(!data.states[selected]){
    data.states={...data.states,[selected]:true};
    render();
    await browser.storage.local.set({states:data.states});
  }else{
    render();
  }
}
function back(){reading=false;render();$("articles").focus();}
async function toggleRead(){
  if(!selected)return;
  const states={...data.states,[selected]:!data.states[selected]};
  await browser.storage.local.set({states});
  await reload();
}
async function move(step,open){
  const rows=filtered();if(!rows.length)return;
  const index=rows.findIndex(a=>a.id===selected);
  selected=rows[(index+step+rows.length)%rows.length].id;
  if(open)await openReader();
  else {reading=false;render();}
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
  else if(e.key==="s"&&reading){$("readLater").click();e.preventDefault();}
  else if(e.key==="v"){openOriginal();e.preventDefault();}
  else if(e.key==="a"){$("addDialog").showModal();e.preventDefault();}
  else if(e.key==="r"){$("refresh").click();e.preventDefault();}
  else if(e.key==="/"){$("search").focus();e.preventDefault();}
  else if(e.key==="?"){$("helpDialog").showModal();e.preventDefault();}
  else if(e.key==="Escape"&&reading){back();e.preventDefault();}
});
browser.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&["feeds","articles","states"].some(k=>k in changes))reload();});
reload();

$("exportOpml").onclick=async()=>{
  try {
    const {xml}=await browser.runtime.sendMessage({type:"exportOpml"});
    const url=URL.createObjectURL(new Blob([xml],{type:"application/xml"}));
    const link=document.createElement("a");
    link.href=url;link.download="liferrss-subscriptions.opml";link.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    $("status").textContent="Subscriptions exported.";
  } catch(e){$("status").textContent="Export failed: "+e.message;}
};
$("importOpml").onclick=()=>$("opmlFile").click();
$("opmlFile").onchange=async()=>{
  const file=$("opmlFile").files[0];if(!file)return;
  $("importOpml").disabled=true;
  $("status").textContent="Importing subscriptions…";
  try {
    if(file.size>5_000_000)throw new Error("Choose a file smaller than 5 MB");
    const result=await browser.runtime.sendMessage({type:"importOpml",xml:await file.text()});
    await reload();
    $("status").textContent=`Import: ${result.added} added, ${result.skipped} skipped, ${result.failed} failed.`;
  } catch(e){$("status").textContent="Import failed: "+e.message;}
  finally{$("importOpml").disabled=false;$("opmlFile").value="";}
};

let bookmarkRequest=0;
async function updateReadLater(){
  const token=++bookmarkRequest, article=data.articles.find(a=>a.id===selected);
  const button=$("readLater");
  button.disabled=true;button.setAttribute("aria-pressed","false");
  if(!reading||!article||!/^https?:\/\//i.test(article.link||"")){
    button.textContent="No article URL";return;
  }
  button.textContent="Checking Read Later…";
  try{
    const result=await browser.runtime.sendMessage({type:"getReadLater",url:article.link});
    if(token!==bookmarkRequest||selected!==article.id||!reading)return;
    button.textContent=result.saved?"Remove from Read Later":"Save for later";
    button.setAttribute("aria-pressed",String(result.saved));button.disabled=false;
  }catch(e){
    if(token!==bookmarkRequest)return;
    button.textContent="Read Later unavailable";
    $("status").textContent="Read Later: "+e.message;
  }
}
$("readLater").onclick=async()=>{
  const article=data.articles.find(a=>a.id===selected);
  if(!reading||!article)return;
  const button=$("readLater"),saved=button.getAttribute("aria-pressed")!=="true";
  button.disabled=true;
  try{
    await browser.runtime.sendMessage({type:"setReadLater",url:article.link,title:article.title,saved});
    $("status").textContent=saved?"Saved to Firefox Read Later bookmarks.":"Removed from Read Later.";
  }catch(e){$("status").textContent="Read Later: "+e.message;}
  await updateReadLater();
};
for(const event of ["onCreated","onRemoved","onChanged","onMoved"]){
  browser.bookmarks[event].addListener(()=>{if(reading)updateReadLater();});
}
