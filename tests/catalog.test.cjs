const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({URL,window:{},document:{currentScript:{src:'https://example.test/widgets/rail/clothes.config.js'},baseURI:'https://example.test/shop/'}});
vm.runInContext(fs.readFileSync(path.join(root,'clothes.config.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'motion.js'),'utf8'),context);
const config=context.window.KNIT_RAIL_CONFIG,catalog=vm.runInContext('KnitCatalog',context),motion=vm.runInContext('KnitMotion',context);
const stock=catalog.products(config);
assert.equal(stock.length,config.products.filter(p=>p.enabled!==false).length);
stock.forEach(p=>assert(p.front.src&&p.side.src));

// One-file workflows: reorder, hide, remove, add and edit; no index arrays.
const added={id:'test-new',name:'测试卫衣',price:299,front:'assets/new.png',side:'assets/side/new.png'};
const edited={...added,id:'test-edited',name:'已编辑卫衣',price:199};
const changed=catalog.products({...config,products:[edited,{...added,id:'test-hidden',enabled:false},added]});
assert.equal(changed.length,2);
assert.equal(changed[0].name,'已编辑卫衣');assert.equal(changed[0].price,199);
assert.equal(changed[1].english,'测试卫衣');assert.equal(changed[1].side.src,'https://example.test/widgets/rail/assets/side/new.png');
assert.equal(catalog.products({...config,products:[]}).length,0);
assert.throws(()=>catalog.products({...config,products:[added,added]}),/unique/);
assert.throws(()=>catalog.products({...config,products:[{...added,price:-1}]}),/price/);

// Automatic measurements track the wooden neck, not asymmetric sleeves.
const w=50,h=100,pixels=new Uint8ClampedArray(w*h*4);
const fill=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)pixels[(y*w+x)*4+3]=255};
fill(23,10,28,30);fill(5,30,41,91);
context.document.createElement=()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})});
const image={naturalWidth:w,naturalHeight:h};
let measured=catalog.measure({src:'auto.png'},image);
assert.equal(measured.cut,10);assert.equal(measured.center,25);assert.equal(measured.left,5);assert.equal(measured.right,41);assert.equal(measured.bottom,91);
fill(24,0,26,4); // Old metal hook is cropped above the explicit hang point.
measured=catalog.measure({src:'hook.png',hangPoint:{x:24,y:10}},image);
assert.equal(measured.cut,10);assert.equal(measured.center,24);assert.equal(measured.bottom,91);
context.document.createElement=()=>{throw Error('Manual calibration must not read cross-origin pixels')};
measured=catalog.measure({src:'remote.png',hangPoint:{x:25,y:10},bounds:{left:5,right:41,bottom:91}},image);
assert.equal(measured.center,25);
assert.throws(()=>catalog.measure({src:'missing.png'},{naturalWidth:0,naturalHeight:0}),/did not load/);

// Use the real stock image dimensions and configuration for spacing checks.
const measurements=config.products.filter(p=>['front','side'].every(view=>{const s=p[view];return s&&typeof s==='object'&&s.hangPoint&&s.bounds&&s.src.endsWith('.png')&&fs.existsSync(path.join(root,s.src))})).map(product=>Object.fromEntries(['front','side'].map(view=>{
  const sprite=product[view],png=fs.readFileSync(path.join(root,sprite.src));
  return [view,catalog.measure(sprite,{naturalWidth:png.readUInt32BE(16),naturalHeight:png.readUInt32BE(20)})];
})));
if(!measurements.length)measurements.push({front:{cut:10,bottom:91,left:5,right:41,center:25},side:{cut:10,bottom:91,left:21,right:29,center:25}});
let cases=0;
for(const viewport of [320,390,554,700,768,1280,1920])for(const count of [1,9,12,20]){
 const width=viewport<=700?Math.min(150,viewport*.265):Math.min(250,viewport*.225),height=width*1.24,rail=Math.min(1080,viewport*(viewport<=700?.9:.82)),edge=rail*.465;
 let step=width*(viewport<=700?.32:.34);
 const items=Array.from({length:count},(_,i)=>{
  const m=measurements[i%measurements.length];
  return Object.fromEntries(['front','side'].map(view=>{const b=m[view],s=height/(b.bottom-b.cut);return [view+'Bounds',{left:(b.left-b.center)*s,right:(b.right-b.center)*s}]}));
 });
 items.forEach((p,i)=>{const offset=i-(count-1)/2;if(offset<0)step=Math.min(step,(edge+p.sideBounds.left)/-offset);else if(offset>0)step=Math.min(step,(edge-p.sideBounds.right)/offset)});
 const idle=motion.layout(items,-1,step,rail,height);
 items.forEach((p,i)=>assert(idle[i]+p.sideBounds.left>=-edge-.001&&idle[i]+p.sideBounds.right<=edge+.001));
 for(let active=0;active<count;active++){
  const tilted=items.map((p,i)=>{const lean=i===active?0:(i<active?1:-1)*(2.2+Math.min(3,Math.abs(i-active)-1)*.35),r=lean*Math.PI/180,shift=-Math.sin(r)*height;return {frontBounds:p.frontBounds,sideBounds:{left:p.sideBounds.left*Math.cos(r)+Math.min(0,shift),right:p.sideBounds.right*Math.cos(r)+Math.max(0,shift)}}});
  const x=motion.layout(tilted,active,step,rail,height),gap=Math.max(8,height*.075);
  items.forEach((p,i)=>{const b=i===active?p.frontBounds:tilted[i].sideBounds;assert(x[i]+b.left>=-edge-.001&&x[i]+b.right<=edge+.001);if(i)assert(x[i]>x[i-1]);});
  if(active>0)assert(Math.abs(x[active]+items[active].frontBounds.left-x[active-1]-tilted[active-1].sideBounds.right-gap)<.001);
  if(active<count-1)assert(Math.abs(x[active+1]+tilted[active+1].sideBounds.left-x[active]-items[active].frontBounds.right-gap)<.001);
  cases++;
 }
}
console.log(`PASS: single-file edits, image measurements, URL resolution, empty catalog and ${cases} spacing cases.`);
