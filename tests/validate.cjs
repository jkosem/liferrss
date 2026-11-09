const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
assert.equal(manifest.manifest_version,3);
assert.equal(manifest.browser_specific_settings.gecko.id,"liferss@local-reader.example");
assert.equal(manifest.version,"0.1.1","Version bump waits for integration after feature merges");
for(const file of [...manifest.background.scripts,manifest.sidebar_action.default_panel,manifest.action.default_popup]){
  assert.ok(fs.existsSync(path.join(root,file)),file);
}
assert.deepEqual(manifest.permissions,["storage","alarms","activeTab","scripting","bookmarks"]);
assert.ok(!manifest.content_scripts,"Discovery must be explicitly invoked");
for(const file of ["sidebar.html","discovery.html"]){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,"Duplicate IDs in "+file);
  assert.ok(!/\son\w+=/i.test(html),"No inline scripts");
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
  }
}
console.log("PASS manifest structure/resources, unchanged Gecko ID/version, expected permissions, no persistent content scripts, HTML resources");
