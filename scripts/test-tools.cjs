#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const html = fs.readFileSync("index.html", "utf8");
const calc = fs.readFileSync("assets/zion.js", "utf8");
const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert(inline, "An inline locale script must exist");
assert(!html.includes("buy.stripe.com"), "Free Discovery page must not link to paid checkout");
assert(html.includes("https://ziontechgroup.com/apps/"), "App-directory backlink");
const requiredIds = ["people","hours","rate","cover","investment","weekly","yearly","payback","spend","waste","idle"];
for (const id of requiredIds) assert(html.includes('id="' + id + '"'), "Missing calculator element: " + id);

for (const lang of ["en","pt","es","fr","de"]) {
  const labelElements = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => ({
    key:m[1], textContent:"", getAttribute(name){return name==="data-i18n"?this.key:null;}
  }));
  const localizedLinks = [...html.matchAll(/<a[^>]*data-localized-discovery[^>]*>/g)].map(() => ({
    href:"", setAttribute(name,value){if(name==="href")this.href=value;}
  }));
  assert(localizedLinks.length>=2, "Localized Discovery CTAs expected");
  const picker={value:"",handlers:{},addEventListener(event,cb){this.handlers[event]=cb;}};
  const doc={
    documentElement:{lang:""},
    title:"",
    getElementById(id){return id==="zion-language"?picker:null;},
    querySelectorAll(sel){
      if(sel==="[data-i18n]")return labelElements;
      if(sel==="[data-localized-discovery]")return localizedLinks;
      return [];
    }
  };
  const loc=new URL("https://ziontechgroup.com/zion-tools/?lang="+lang);
  vm.runInNewContext(inline[1],{document:doc,location:loc,history:{replaceState(){}},URL,URLSearchParams},{timeout:1500});
  assert.equal(doc.documentElement.lang,lang==="pt"?"pt-BR":lang);
  assert.equal(picker.value,lang);
  assert(labelElements.every((el)=>el.textContent.length>0), "All visible labels translated "+lang);
  const suffix=lang==="en"?"/discovery/":"/"+lang+"/discovery/";
  assert(localizedLinks.every((link)=>link.href.endsWith(suffix)), "Locale-specific Discovery link "+lang);
  picker.value="en";
  picker.handlers.change();
  assert.equal(doc.documentElement.lang,"en","Switching locale must update document language");
  assert(localizedLinks.every((link)=>link.href.endsWith("/discovery/")));
}

const inputs={};
for(const match of html.matchAll(/<input\s+id="([^"]+)"[^>]*value="([^"]+)"[^>]*>/g)){
  inputs[match[1]]={value:match[2],handlers:{},addEventListener(event,cb){this.handlers[event]=cb;}};
}
const output={};
for(const id of ["weekly","yearly","payback","idle"])output[id]={textContent:""};
const doc={
  getElementById(id){return inputs[id]||output[id]||null;}
};
vm.runInNewContext(calc,{document:doc},{timeout:1500});
assert.equal(output.weekly.textContent,"$648");
assert.equal(output.yearly.textContent,"$31,104");
assert.equal(output.payback.textContent,"1.0");
assert.equal(output.idle.textContent,"$3,960");

inputs.cover.value="250";inputs.cover.handlers.input();
assert.equal(output.weekly.textContent,"$1,080","Share must be capped at 100 percent");
inputs.cover.value="-10";inputs.cover.handlers.input();
assert.equal(output.weekly.textContent,"$0","Negative share must be bounded at zero");
inputs.cover.value="60";inputs.cover.handlers.input();
inputs.investment.value="0";inputs.investment.handlers.input();
assert.equal(output.payback.textContent,"—","No payback when investment is zero");
inputs.investment.value="5000";inputs.investment.handlers.input();
assert.equal(output.payback.textContent,"1.9","Editable budget controls payback");
inputs.waste.value="300";inputs.waste.handlers.input();
assert.equal(output.idle.textContent,"$18,000","Cloud waste capped at total spend");
inputs.spend.value="-100";inputs.spend.handlers.input();
assert.equal(output.idle.textContent,"$0","Negative spend must be bounded at zero");

console.log("PASS: 5 locale loads, locale switching, translated links, 11 IDs, ROI/payback/FinOps and invalid-input guards.");

inputs.spend.value="1e308";inputs.waste.value="100";inputs.waste.handlers.input();
assert.equal(output.idle.textContent,"$"+Math.round(1e308).toLocaleString(),"Finite spend must not overflow merely when multiplied by percent");
inputs.spend.value="Infinity";inputs.spend.handlers.input();
assert.equal(output.idle.textContent,"$0","Non-finite spend must not render infinity");
inputs.people.value="1e200";inputs.hours.value="1e200";inputs.rate.value="100";inputs.cover.value="100";inputs.people.handlers.input();
assert.equal(output.weekly.textContent,"—","Overflowed weekly result must be unavailable");
assert.equal(output.yearly.textContent,"—","Overflowed annual result must be unavailable");
assert.equal(output.payback.textContent,"—","Overflowed savings must not imply instant payback");
inputs.people.value="1e-300";inputs.hours.value="1";inputs.rate.value="1";inputs.cover.value="100";inputs.investment.value="1e308";inputs.people.handlers.input();
assert.equal(output.payback.textContent,"—","Unrepresentable payback must not render infinity");
console.log("PASS: six added numerical-overflow regression assertions.");

// Locale formatting must follow the selected UI language, not the runner default.
function localizedScenario(language) {
  const values = {people:"3", hours:"8", rate:"45", cover:"60", investment:"2500", spend:"18000", waste:"22"};
  const nodes = {};
  for (const [id, value] of Object.entries(values)) {
    nodes[id] = {value, handlers:{}, addEventListener(event, fn){this.handlers[event]=fn;}};
  }
  for (const id of ["weekly","yearly","payback","idle"]) nodes[id] = {textContent:""};
  const changeHandlers = [];
  nodes["zion-language"] = {addEventListener(event, fn){if(event==="change")changeHandlers.push(fn);}};
  const document = {documentElement:{lang:language}, getElementById(id){return nodes[id]||null;}};
  vm.runInNewContext(calc, {document}, {timeout:1500});
  return {nodes, document, changeHandlers};
}
const numericLocales = {en:"en-US", "pt-BR":"pt-BR", es:"es-ES", fr:"fr-FR", de:"de-DE"};
for (const [language, locale] of Object.entries(numericLocales)) {
  const scenario = localizedScenario(language);
  const money = new Intl.NumberFormat(locale, {style:"currency", currency:"USD", maximumFractionDigits:0});
  const decimal = new Intl.NumberFormat(locale, {minimumFractionDigits:1, maximumFractionDigits:1});
  assert.equal(scenario.nodes.weekly.textContent, money.format(648), "Weekly format: " + language);
  assert.equal(scenario.nodes.yearly.textContent, money.format(31104), "Annual format: " + language);
  assert.equal(scenario.nodes.idle.textContent, money.format(3960), "Cloud format: " + language);
  assert.equal(scenario.nodes.payback.textContent, decimal.format(2500/(31104/12)), "Payback format: " + language);
  scenario.nodes.investment.value = "5000";
  scenario.nodes.investment.handlers.input();
  assert.equal(scenario.nodes.payback.textContent, decimal.format(5000/(31104/12)), "Edited budget: " + language);
  const originalValues = Object.fromEntries(Object.entries(scenario.nodes).filter(([,node])=>"value" in node).map(([id,node])=>[id,node.value]));
  scenario.document.documentElement.lang = "en";
  assert.equal(scenario.changeHandlers.length, 1, "One calculation repaint listener");
  scenario.changeHandlers[0]();
  assert.equal(scenario.nodes.yearly.textContent, "$31,104", "Language switch repaints values immediately");
  assert.equal(scenario.nodes.payback.textContent, "1.9", "Language switch repaints decimal separator");
  assert.deepEqual(Object.fromEntries(Object.entries(scenario.nodes).filter(([,node])=>"value" in node).map(([id,node])=>[id,node.value])), originalValues, "Language switch must not change entered values");
}
for (const language of ["", "invalid", "__proto__"]) {
  assert.equal(localizedScenario(language).nodes.yearly.textContent, "$31,104", "Unknown locale falls back safely");
}
console.log("PASS: five numeric locales, editable budget, immediate language-switch repaint and safe locale fallback.");
