// Controller regression checks with mocked DOM/Firefox APIs. Native keyboard
// focus, layout, downloads and permission behavior still need Firefox.
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
class Element {
  constructor(){this.children=[];this.value="";this.dataset={};this.attrs={};this.classList={toggle(){}};this.open=false;this.disabled=false;}
  addEventListener(name,fn){this["on"+name]=fn;}
  append(...children){this.children.push(...children);}
  replaceChildren(){this.children=[];}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k]??null;}
  focus(){this.focused=true;}
  scrollIntoView(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  matches(){return false;}
  click(){if(!this.disabled)return this.onclick?.();}
}
(async()=>{
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  let keydown,storageListener,bookmarkListeners={},savedLater=false;
  const rows=[{id:"one",feedUrl:"https://feed.test/",title:"One",summary:"alpha",published:2,link:"https://article.test/one"},
    {id:"two",feedUrl:"https://feed.test/",title:"Two",summary:"beta",published:1,link:"https://article.test/two"}];
  let store={feeds:[{url:"https://feed.test/",title:"Feed"}],articles:rows,states:{}},opened=[],messages=[];
  const document={
    getElementById:get,createElement:()=>new Element(),
    querySelectorAll:()=>[],querySelector:()=>null,
    addEventListener:(name,fn)=>{if(name==="keydown")keydown=fn;}
  };
  const browser={
    storage:{local:{get:async()=>structuredClone(store),set:async value=>Object.assign(store,structuredClone(value))},
      onChanged:{addListener:fn=>storageListener=fn}},
    tabs:{create:args=>opened.push(args.url)},
    runtime:{sendMessage:async message=>{
      messages.push(message);
      if(message.type==="getReadLater")return {saved:savedLater};
      if(message.type==="setReadLater"){savedLater=message.saved;return {saved:savedLater};}
      if(message.type==="importOpml")return {added:1,skipped:2,failed:3};
      return {ok:true};
    }},
    bookmarks:Object.fromEntries(["onCreated","onRemoved","onChanged","onMoved"].map(name=>[name,{addListener:fn=>bookmarkListeners[name]=fn}]))
  };
  const context=vm.createContext({document,browser,structuredClone,console,URL,Blob,setTimeout});
  vm.runInContext(fs.readFileSync(path.join(__dirname,"..","sidebar.js"),"utf8"),context);
  const flush=async()=>{for(let n=0;n<15;n++)await Promise.resolve();};
  await flush();
  const run=async code=>{await vm.runInContext(code,context);await flush();};
  assert.equal(get("articles").children.length,2);
  await run('selected="one";openReader()');
  assert.equal(store.states.one,true,"Opening automatically marks read");
  assert.equal(get("reader").hidden,false);
  assert.equal(get("readerTitle").textContent,"One");
  assert.equal(get("readLater").disabled,false);
  assert.equal(get("readLater").getAttribute("aria-pressed"),"false");
  keydown({target:new Element(),key:"s",preventDefault(){}});
  await flush();assert.equal(savedLater,true);
  assert.equal(get("readLater").getAttribute("aria-pressed"),"true");
  savedLater=false;bookmarkListeners.onRemoved();await flush();
  assert.equal(get("readLater").getAttribute("aria-pressed"),"false","External bookmark event refreshes reader");
  await run("openOriginal()");assert.deepEqual(opened,["https://article.test/one"]);
  await run("toggleRead()");assert.equal(store.states.one,false);
  await run('back();view="all";render();move(1,false)');
  assert.equal(vm.runInContext("selected",context),"two");
  get("search").value="beta";get("search").oninput();
  assert.equal(get("articles").children.length,1);
  assert.equal(get("articles").children[0].children[1].textContent,"Two");
  get("search").value="";await run("render()");
  // Missing article URL is not saveable.
  store.articles[1].link="";await run('reload()');await run('selected="two";openReader()');
  assert.equal(get("readLater").disabled,true);
  // OPML result remains visible after the final reload.
  get("opmlFile").files=[{size:5,text:async()=>"<opml/>"}];
  await get("opmlFile").onchange();await flush();
  assert.equal(get("status").textContent,"Import: 1 added, 2 skipped, 3 failed.");
  assert.equal(get("importOpml").disabled,false);
  assert.deepEqual(store.feeds,[{url:"https://feed.test/",title:"Feed"}]);
  assert.equal(store.states.one,false);
  assert.ok(storageListener);
  console.log("PASS reader controller: automatic read state, toggle, navigation, filtering, original tab, keyboard save, external bookmark events, missing URL, OPML summary, preserved subscriptions/states");
})().catch(error=>{console.error(error);process.exitCode=1;});
