/* Real browser DOM/XML, mocked Firefox APIs. No production dependencies. */
const {chromium} = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
(async () => {
  let browser;
  if(process.env.TEST_DOM==="adapter"){
    const vm=require("node:vm");
    const context=vm.createContext({...require("./xml-dom.cjs"),URL,AbortSignal,console,structuredClone});
    context.window=context;
    browser={newPage:async()=>({
      goto:async()=>{},
      evaluate:async fn=>{const result=await vm.runInContext("("+fn.toString()+")()",context);return result===undefined?undefined:JSON.parse(JSON.stringify(result));},
      addScriptTag:async({content})=>vm.runInContext(content,context)
    }),close:async()=>{}};
    console.log("Using XML adapter; browser/Firefox verification still required.");
  }else{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || "/usr/bin/chromium",headless:true,args:["--no-sandbox"]});
  }
  try {
    const page = await browser.newPage();
    await page.goto("about:blank");
    await page.evaluate(() => {
      window.saved = {
        feeds:[{url:"https://example.com/feed#old",title:"Existing & <title>"}],
        articles:[{id:"old|id",feedUrl:"https://example.com/feed#old",title:"Old",link:"https://example.com/old",summary:"Old summary",published:1}],
        states:{"old|id":true}
      };
      window.requests = [];
      window.browser = {
        storage:{local:{
          get:async defaults=>({...structuredClone(defaults),...structuredClone(saved)}),
          set:async values=>Object.assign(saved,structuredClone(values))
        }},
        runtime:{onMessage:{addListener:fn=>window.message=fn},onInstalled:{addListener(){}},onStartup:{addListener(){}}},
        alarms:{create(){},onAlarm:{addListener(){}}}
      };
      window.fetch = async url => {
        requests.push(url);
        if(url.includes("bad")) throw new Error("Fetch failed");
        return {ok:true,text:async()=>url.includes("atom") ?
          '<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><id>atom-id</id><title>Atom article</title><link href="/article"/><summary>Summary</summary></entry></feed>' :
          '<rss version="2.0"><channel><title>RSS</title><item><guid>rss-id</guid><title>RSS article</title><link>https://news.test/article</link><description>Summary</description></item></channel></rss>'};
      };
    });
    for(const file of ["feed-utils.js","opml.js","background.js"]) await page.addScriptTag({content:await fs.readFile(path.join(root,file),"utf8")});
    const result = await page.evaluate(async () => {
      const before=structuredClone(saved);
      const xml='<opml version="2.0"><body><outline text="Folder">'+
        '<outline type="rss" xmlUrl="https://EXAMPLE.com:443/feed#new"/>'+
        '<outline type="rss" xmlUrl="https://news.test/rss"/>'+
        '<outline type="rss" xmlUrl="https://news.test/rss#duplicate"/>'+
        '<outline type="atom" xmlUrl="https://news.test/atom"/>'+
        '<outline type="rss" xmlUrl="javascript:alert(1)"/>'+
        '<outline type="rss" xmlUrl="https://bad.test/feed"/>'+
        '<outline type="rss"/></outline></body></opml>';
      const counts=await message({type:"importOpml",xml});
      const after=structuredClone(saved);
      const exported=await message({type:"exportOpml"});
      const roundtrip=Opml.parse(exported.xml);
      const again=await message({type:"importOpml",xml:exported.xml});
      let invalid=false;
      try{await message({type:"importOpml",xml:"<opml><body>"});}catch{invalid=true;}
      const malformedUnchanged=JSON.stringify(saved)===JSON.stringify(after);
      await Promise.all([message({type:"addFeed",url:"https://parallel.test/a"}),message({type:"addFeed",url:"https://parallel.test/a#same"}),message({type:"addFeed",url:"https://parallel.test/b"})]);
      return {before,after,counts,roundtrip,again,invalid,malformedUnchanged,parallel:saved.feeds.filter(f=>f.url.includes("parallel")),requests};
    });
    assert.deepEqual(result.counts,{added:2,skipped:2,failed:3});
    assert.deepEqual(result.after.states,result.before.states);
    assert.deepEqual(result.after.articles.find(a=>a.id==="old|id"),result.before.articles[0]);
    assert.equal(result.after.feeds[0].url,result.before.feeds[0].url);
    assert.equal(result.roundtrip.entries.length,3);
    assert.equal(result.roundtrip.entries[0].title,"Existing & <title>");
    assert.deepEqual(result.again,{added:0,skipped:3,failed:0});
    assert.equal(result.invalid,true);assert.equal(result.malformedUnchanged,true);
    assert.equal(result.parallel.length,2);
    assert.equal(result.requests.filter(u=>u==="https://parallel.test/a").length,1);
    // Export/import into a fresh profile.
    const fresh=await page.evaluate(async()=>{
      const {xml}=await message({type:"exportOpml"});saved={feeds:[],articles:[],states:{}};
      return message({type:"importOpml",xml});
    });
    assert.equal(fresh.added,5);
    assert.equal(fresh.failed,0);
    await page.addScriptTag({content:await fs.readFile(path.join(root,"discovery.js"),"utf8")});
    const discovered=await page.evaluate(()=>Discovery.collect([
      {rel:"alternate",type:"application/rss+xml",href:"/rss#one",base:"https://EXAMPLE.test:443/page",title:"RSS"},
      {rel:"stylesheet ALTERNATE",type:"APPLICATION/RSS+XML; charset=utf-8",href:"https://example.test/rss",title:"Same"},
      {rel:"alternate",type:"application/atom+xml",href:"atom",base:"https://example.test/base/",title:"Atom"},
      {rel:"alternate",type:"text/html",href:"https://example.test/html"},
      {rel:"alternate",type:"application/rss+xml",href:"javascript:alert(1)"},
      {rel:"stylesheet",type:"application/rss+xml",href:"https://example.test/no"}
    ]));
    assert.deepEqual(discovered,[{url:"https://example.test/rss",title:"RSS"},{url:"https://example.test/base/atom",title:"Atom"}]);
    assert.deepEqual(await page.evaluate(()=>Discovery.collect([])),[]);
    console.log("PASS discovery: distinct RSS/Atom alternates, relative/base URLs, MIME/rel normalization, unsafe URLs, no feeds");
    console.log("PASS OPML: nested import, RSS/Atom, URL normalization, mixed failures, escaping, re-import, fresh-profile round trip, concurrent subscriptions, legacy cache/read states");
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
