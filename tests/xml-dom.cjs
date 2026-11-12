// Development-only XML DOM adapter, backed by xml-js's SAX parser.
// Browser suite remains the authoritative DOM check; this enables data tests
// when the execution sandbox cannot launch a browser.
const {xml2js} = require("xml-js");
class Element {
  constructor(name, attributes={}, children=[]) {
    this.name=name;this.attributes=attributes;this.children=children;
    this.localName=name.split(":").pop();
  }
  get textContent(){return this.children.map(c=>typeof c==="string"?c:c.textContent).join("");}
  set textContent(value){this.children=[value];}
  getAttribute(key){return this.attributes[key]??null;}
  setAttribute(key,value){this.attributes[key]=value;}
  append(child){this.children.push(child);}
  getElementsByTagName(name){
    return this.children.flatMap(c=>typeof c==="string"?[]:[...(c.name===name?[c]:[]),...c.getElementsByTagName(name)]);
  }
  querySelectorAll(name){return this.getElementsByTagName(name);}
  querySelector(name){return this.querySelectorAll(name)[0]||null;}
}
function convert(node){
  return new Element(node.name,node.attributes||{},(node.elements||[]).flatMap(c=>
    c.type==="element"?[convert(c)]:["text","cdata"].includes(c.type)?[c.text??c.cdata]:[]));
}
function escape(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
function serialize(node){
  const attrs=Object.entries(node.attributes).map(([k,v])=>' '+k+'="'+escape(v)+'"').join("");
  return "<"+node.name+attrs+">"+node.children.map(c=>typeof c==="string"?escape(c):serialize(c)).join("")+"</"+node.name+">";
}
class Document extends Element {
  constructor(root){super("#document",{},[root]);this.documentElement=root;}
  createElement(name){return new Element(name);}
}
module.exports={
  DOMParser:class {
    parseFromString(xml){
      try{
        const parser=require("sax").parser(true);
        let depth=0;parser.onopentag=()=>depth++;parser.onclosetag=()=>depth--;
        parser.write(xml).close();if(depth!==0)throw new Error("Unclosed XML");
        const roots=xml2js(xml,{compact:false}).elements.filter(n=>n.type==="element");
        if(roots.length!==1)throw new Error("Invalid root");
        return new Document(convert(roots[0]));
      }catch{return new Document(new Element("parsererror"));}
    }
  },
  XMLSerializer:class {serializeToString(doc){return serialize(doc.documentElement);}},
  document:{implementation:{createDocument:(_,name)=>new Document(new Element(name))}}
};
