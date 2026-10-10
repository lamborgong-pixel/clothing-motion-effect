(()=>{
const products=KnitCatalog.products(window.KNIT_RAIL_CONFIG);
const collectionCount=String(products.length).padStart(2,'0');
if(new URLSearchParams(location.search).get('embed')==='1')document.body.dataset.embed='true';
const showroom=document.querySelector('#showroom'),rack=document.querySelector('#rack'),swatches=document.querySelector('#swatches');
document.querySelector('#reset span').textContent=collectionCount;
document.querySelector('#index').textContent=`${collectionCount} pieces`;
const hardware=new RailHardware(document.querySelector('#hardware'));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pieces=[];let active=-1,frame=0,last=0,width=240,bodyHeight=300,step=80,top=100,stem=27,railWidth=1000;
let entranceState='pending',entranceElapsed=0;
showroom.dataset.entrance=entranceState;
// Each image is cropped with overflow, never rescaled independently on either axis.
function imagePlane(sprite){
 const el=document.createElement('div');el.className='plane';const img=document.createElement('img'),url=new URL(sprite.src);
 if(/^https?:$/.test(url.protocol)&&url.origin!==location.origin&&!(sprite.hangPoint&&sprite.bounds))img.crossOrigin='anonymous';
 img.src=sprite.src;img.alt='';img.draggable=false;el.append(img);return el;
}
products.forEach((product,i)=>{
 const art=document.createElement('div');art.className='garment';art.setAttribute('aria-hidden','true');
 const body=document.createElement('div');body.className='garment-body';
 const front=imagePlane(product.front);front.classList.add('front');
 const side=imagePlane(product.side);side.classList.add('side');
 body.append(side,front);art.append(body);rack.append(art);
 const hit=document.createElement('button');hit.className='piece-hit';hit.setAttribute('aria-label',`查看${product.name}商品卡`);hit.addEventListener('focus',()=>select(i));hit.addEventListener('click',()=>openDetail(i));rack.append(hit);
 const dot=document.createElement('button');dot.className='swatch';dot.style.setProperty('--color',product.color);dot.setAttribute('aria-label',`预览${product.name}`);dot.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')select(i)});dot.addEventListener('focus',()=>select(i));dot.addEventListener('click',()=>select(i));swatches.append(dot);
 hit.disabled=true;
 pieces.push({art,body,front,side,hit,dot,x:0,vx:0,angle:90,va:0,swing:0,vs:0,lean:0,vl:0,pitch:0,vp:0,turnSign:1,targetLean:0,targetX:0,targetAngle:90,sideWidth:55,sideBounds:{left:-27.5,right:27.5},frontBounds:{left:-120,right:120},entryY:0,entryOpacity:0,entryStarted:false,entryLanded:false});
});
function measure(){
 const mobile=innerWidth<=700;const height=showroom.clientHeight;
 width=mobile?Math.min(150,innerWidth*.265):Math.min(250,Math.max(185,height*.43),innerWidth*.225);bodyHeight=width*1.24;
 step=width*(mobile?.32:.34);top=Math.max(65,height*.17);railWidth=Math.min(1080,innerWidth*(mobile?.90:.82));const radius=railWidth*.006;stem=radius+width*.095;
 document.documentElement.style.setProperty('--rail-top',`${top}px`);document.documentElement.style.setProperty('--body-top',`${top+stem}px`);document.documentElement.style.setProperty('--body-height',`${bodyHeight}px`);
 hardware.resize(showroom.clientWidth,height,top,railWidth,radius,stem);
 pieces.forEach((p,i)=>{
  if(!p.frontMeta||!p.sideMeta)return;
  const front=p.frontMeta,side=p.sideMeta;
  layoutPlane(p.front,front.w,front.bottom-front.cut,front.cut,front.center);
  layoutPlane(p.side,side.w,side.bottom-side.cut,side.cut,side.center);
  const frontScale=bodyHeight/(front.bottom-front.cut),sideScale=bodyHeight/(side.bottom-side.cut);
  p.frontBounds={left:(front.left-front.center)*frontScale,right:(front.right-front.center)*frontScale};
  p.sideBounds={left:(side.left-side.center)*sideScale,right:(side.right-side.center)*sideScale};p.sideWidth=p.sideBounds.right-p.sideBounds.left;
 });
 // Fit the idle row to the rod when the config gains more garments.
 pieces.forEach((p,i)=>{const offset=i-(pieces.length-1)/2,edge=railWidth*.465;if(offset<0)step=Math.min(step,(edge+p.sideBounds.left)/-offset);else if(offset>0)step=Math.min(step,(edge-p.sideBounds.right)/offset)});
 step=Math.max(0,step);
 setTargets();pieces.forEach(p=>{p.x=p.targetX;p.angle=p.targetAngle;p.lean=p.targetLean;if(entranceState!=='playing')p.vx=p.va=p.swing=p.vs=p.vl=p.pitch=p.vp=0;paint(p)});renderHardware();
}
function layoutPlane(el,sourceWidth,sourceHeight,cut,center){const scale=bodyHeight/sourceHeight,displayWidth=sourceWidth*scale;el.style.width=`${displayWidth}px`;el.style.height=`${bodyHeight}px`;el.style.left=`${-center*scale}px`;el.style.transformOrigin=`${center*scale}px 0`;const image=el.firstElementChild;image.style.width=`${displayWidth}px`;image.style.top=`${-cut*scale}px`;}
function setTargets(){
 pieces.forEach((p,i)=>{p.targetLean=active<0||i===active?0:(i<active?1:-1)*(2.2+Math.min(3,Math.abs(i-active)-1)*.35)});
 const tiltedPieces=pieces.map(p=>({frontBounds:p.frontBounds,sideBounds:tiltBounds(p.sideBounds,p.targetLean)}));
 const targets=KnitMotion.layout(tiltedPieces,active,step,railWidth,bodyHeight);
 pieces.forEach((p,i)=>{
  p.targetX=targets[i];p.targetAngle=i===active?0:90;
  p.art.style.zIndex=String(i===active?pieces.length+2:i+2);p.hit.style.zIndex=String(i===active?pieces.length+21:i+20);
  p.hit.setAttribute('aria-pressed',i===active);p.dot.setAttribute('aria-pressed',i===active);
 });
}
function tiltBounds(bounds,angle){
 const rad=angle*Math.PI/180,cos=Math.cos(rad),shift=-Math.sin(rad)*bodyHeight;
 return {left:bounds.left*cos+Math.min(0,shift),right:bounds.right*cos+Math.max(0,shift)};
}
function visibleBounds(p){
 const rad=p.angle*Math.PI/180,front=Math.max(0,Math.cos(rad)),side=Math.max(0,Math.sin(rad));
 return tiltBounds({left:Math.min(p.frontBounds.left*front,p.sideBounds.left*side),right:Math.max(p.frontBounds.right*front,p.sideBounds.right*side)},p.lean+p.swing);
}
function paint(p){
 p.art.style.transform=`translate(${p.x}px,${p.entryY}px)`;p.art.style.opacity=p.entryOpacity;p.body.style.transform=`rotateX(${p.pitch}deg) rotateZ(${p.lean+p.swing}deg)`;
 p.front.style.transform=`rotateY(${p.angle*p.turnSign}deg)`;p.side.style.transform=`rotateY(${(p.angle-90)*p.turnSign}deg)`;
 // The front is opaque before the side disappears: mid-turn never dissolves
 // into a translucent garment, as it did with the old cosine-squared fade.
 const face=Math.max(0,Math.cos(p.angle*Math.PI/180));
 p.front.style.opacity=KnitMotion.smoothstep(.06,.70,face);
 p.side.style.opacity=1-KnitMotion.smoothstep(.25,.86,face);
 const bounds=visibleBounds(p);
 p.hit.style.left=`calc(50% + ${p.x+bounds.left}px)`;p.hit.style.width=`${bounds.right-bounds.left}px`;
}
function renderHardware(){hardware.render(pieces.map(p=>p.x),pieces.map(p=>({y:p.entryY,opacity:p.entryOpacity})))}
function finishEntrance(){
 if(entranceState==='complete')return;
 entranceState=showroom.dataset.entrance='complete';
 pieces.forEach(p=>{p.entryY=0;p.entryOpacity=1;p.entryLanded=true;p.hit.disabled=false;paint(p)});
 renderHardware();start();
}
function beginEntrance(){
 if(entranceState!=='pending')return;
 if(reduced.matches){finishEntrance();return;}
 entranceState=showroom.dataset.entrance='playing';entranceElapsed=0;last=0;start();
}
function animate(time){
 const dt=Math.min((time-(last||time-16.67))/1000,.05);last=time;let moving=false;
 if(entranceState==='playing')entranceElapsed+=dt;
 for(const [i,p] of pieces.entries()){
  if(entranceState==='playing'){
   const entry=KnitMotion.entrance(i,entranceElapsed,Math.max(18,Math.min(42,bodyHeight*.12)));
   p.entryY=entry.y;p.entryOpacity=entry.opacity;
   const direction=i%2===0?1:-1;
   if(entry.started&&!p.entryStarted){p.entryStarted=true;p.swing=direction*(4.5+(i%3)*.6);p.vs=direction*4;p.pitch=-3;p.vp=4;}
   if(entry.landed&&!p.entryLanded){p.entryLanded=true;p.hit.disabled=false;p.vs+=direction*(12+(i%3)*2);p.vp+=7;}
   if(!entry.landed)moving=true;
  }
  if(reduced.matches){p.x=p.targetX;p.angle=p.targetAngle;p.lean=p.targetLean;p.vx=p.va=p.swing=p.vs=p.vl=p.pitch=p.vp=0;}
  else{
   const oldVelocity=p.vx,oldTurnVelocity=p.va;
   KnitMotion.spring(p,'x','vx',p.targetX,13.5,1,dt);
   KnitMotion.spring(p,'angle','va',p.targetAngle,p.targetAngle===0?9.6:11.5,.79,dt);
   KnitMotion.spring(p,'lean','vl',p.targetLean,6.8,.86,dt);
   p.vp-=(p.va-oldTurnVelocity)*p.turnSign*.018;
   KnitMotion.spring(p,'pitch','vp',0,6.5,.55,dt);
   // Translation accelerates the fabric below its fixed hook. Swing remains
   // free to cross zero and decay; no angle clamp can abruptly stop it.
   p.vs-=(p.vx-oldVelocity)/width*4.8;
   const damping=.38+Math.min(.17,Math.max(0,Math.abs(p.swing)-5)*.085);
   KnitMotion.spring(p,'swing','vs',0,7.4,damping,dt);
   if(Math.abs(p.x-p.targetX)>.03||Math.abs(p.vx)>.2||Math.abs(p.angle-p.targetAngle)>.03||Math.abs(p.va)>.2||Math.abs(p.swing)>.025||Math.abs(p.vs)>.12||Math.abs(p.lean-p.targetLean)>.025||Math.abs(p.vl)>.12||Math.abs(p.pitch)>.025||Math.abs(p.vp)>.12)moving=true;
   else{p.x=p.targetX;p.angle=p.targetAngle;p.lean=p.targetLean;p.vx=p.va=p.swing=p.vs=p.vl=p.pitch=p.vp=0;}
  }
  paint(p);
 }
 if(entranceState==='playing'&&pieces.every(p=>p.entryLanded))entranceState=showroom.dataset.entrance='complete';
 renderHardware();frame=moving?requestAnimationFrame(animate):0;if(!moving)last=0;
}
function start(){if(!frame)frame=requestAnimationFrame(animate)}
let hoverTimer=0,exitTimer=0,pendingHover=-1;
function clearHover(){clearTimeout(hoverTimer);clearTimeout(exitTimer);hoverTimer=exitTimer=0;pendingHover=-1;}
function select(i){
 clearHover();finishEntrance();if(active===i)return;
 const previous=active,direction=previous<0?1:Math.sign(i-previous)||1;
 const oldAngles=pieces.map(p=>p.targetAngle);
 if(i>=0&&pieces[i].angle>89.8&&Math.abs(pieces[i].va)<2)pieces[i].turnSign=direction;
 active=i;setTargets();
 if(!reduced.matches)pieces.forEach((p,index)=>{
  const delta=p.targetAngle-oldAngles[index];
  if(delta){
   const impulse=-delta*(index===i?.22:.14)*direction;
   p.vs+=impulse/(1+Math.abs(p.vs)/32);
   p.vp+=-delta*(index===i?.12:.07)*p.turnSign;
  }
 });
 start();document.querySelector('#current-name').textContent=i<0?'The full collection':products[i].english;
 document.querySelector('#current-note').textContent=i<0?'Hover to unfold. Click to discover.':products[i].name;
 document.querySelector('#index').textContent=i<0?`${collectionCount} pieces`:`${String(i+1).padStart(2,'0')} / ${collectionCount}`;
}
function queueHover(i){
 clearTimeout(exitTimer);exitTimer=0;
 if(i===active){clearTimeout(hoverTimer);hoverTimer=0;pendingHover=-1;return;}
 if(active<0){select(i);return;}
 if(pendingHover===i)return;
 clearTimeout(hoverTimer);pendingHover=i;
 hoverTimer=setTimeout(()=>{hoverTimer=0;pendingHover=-1;select(i)},40);
}
function queueExit(){
 if(entranceState!=='complete')return;
 clearTimeout(hoverTimer);hoverTimer=0;pendingHover=-1;
 if(!exitTimer)exitTimer=setTimeout(()=>{exitTimer=0;if(!detail.open)select(-1)},100);
}
showroom.addEventListener('pointermove',e=>{
 if(entranceState!=='complete'||detail.open||e.pointerType==='touch'||e.movementX===0&&e.movementY===0)return;
 const r=showroom.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top;
 if(y<top+stem-8||y>top+stem+bodyHeight+14||Math.abs(x)>railWidth/2){queueExit();return;}
 clearTimeout(exitTimer);exitTimer=0;
 if(active>=0){const p=pieces[active],b=tiltBounds(p.frontBounds,p.lean+p.swing);if(x>p.x+b.left-6&&x<p.x+b.right+6){queueHover(active);return;}}
 let candidate=-1,distance=Infinity;
 pieces.forEach((p,i)=>{const b=visibleBounds(p),d=Math.abs(x-p.x);if(x>p.x+b.left-5&&x<p.x+b.right+5&&d<distance){distance=d;candidate=i}});
 if(candidate>=0)queueHover(candidate);
 else{
  clearTimeout(hoverTimer);hoverTimer=0;pendingHover=-1;
  const outer=pieces.reduce((bounds,p,i)=>{const b=i===active?p.frontBounds:visibleBounds(p);return {left:Math.min(bounds.left,p.x+b.left),right:Math.max(bounds.right,p.x+b.right)}},{left:Infinity,right:-Infinity});
  if(x<outer.left-18||x>outer.right+18)queueExit();
 }
 // Empty space between garments keeps the current layout. Resetting there
 // used to move the hit areas back under the pointer and cause flicker.
});
showroom.addEventListener('pointerleave',()=>{clearHover();if(!rack.contains(document.activeElement)&&!detail.open)queueExit()});
swatches.addEventListener('pointerleave',()=>{if(!swatches.contains(document.activeElement)&&!detail.open)queueExit()});
rack.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();if(e.repeat)return;pieces[e.key==='Home'?0:e.key==='End'?products.length-1:(Math.max(0,active)+(e.key==='ArrowRight'?1:products.length-1))%products.length].hit.focus()}else if(e.key==='Escape'){document.activeElement.blur();select(-1)}});
document.querySelector('#reset').addEventListener('click',()=>{document.activeElement.blur();select(-1)});
const detail=document.querySelector('#detail'),detailImage=document.querySelector('#detail-image'),detailCopy=document.querySelector('.detail-copy');
let detailIndex=0,displayedDetailIndex=0,detailRevision=0,detailAnimations=[];
const selectedSizes=products.map(()=>'M');
function cancelDetailAnimations(){detailAnimations.forEach(animation=>animation.cancel());detailAnimations=[];}
function renderDetail(i){
 displayedDetailIndex=i;
 const p=products[i];
 document.querySelector('#detail-title').textContent=p.name;document.querySelector('#detail-english').textContent=p.english;
 document.querySelector('#detail-price').textContent=p.price===null?'价格待定':`¥ ${p.price}`;document.querySelector('#detail-note').textContent=p.note;
 document.querySelector('.material').textContent=p.material||'柔软针织 · 自然垂坠 · 日常系列';
 detailImage.src=p.image;detailImage.alt=p.name;document.querySelector('#detail-color').style.background=p.color;
 document.querySelector('#detail-count').textContent=`${String(i+1).padStart(2,'0')} / ${String(products.length).padStart(2,'0')}`;
 document.querySelectorAll('.size-option').forEach(b=>b.setAttribute('aria-pressed',b.textContent===selectedSizes[i]));
}
function openDetail(i){
 clearHover();detailRevision++;cancelDetailAnimations();detailIndex=i;select(i);renderDetail(i);
 if(!detail.open)detail.showModal();
}
async function changeDetail(direction){
 if(!detail.open)return;
 detailIndex=(detailIndex+direction+products.length)%products.length;
 const index=detailIndex,revision=++detailRevision,actors=[detailImage,detailCopy];
 const from=actors.map(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform}));
 cancelDetailAnimations();select(index);
 if(reduced.matches){renderDetail(index);return;}
 const preload=new Image();preload.src=products[index].image;
 detailAnimations=actors.map((el,i)=>el.animate([from[i],{opacity:0,transform:`translateX(${-direction*(i===0?24:12)}px) ${i===0?`rotateY(${-direction*6}deg)`:''}`}],{duration:140,easing:'ease-in',fill:'forwards'}));
 await Promise.all([preload.decode().catch(()=>{}),...detailAnimations.map(a=>a.finished.catch(()=>{}))]);
 if(revision!==detailRevision||!detail.open)return;
 cancelDetailAnimations();renderDetail(index);
 detailAnimations=actors.map((el,i)=>el.animate([
  {opacity:0,transform:`translateX(${direction*(i===0?30:14)}px) ${i===0?`rotateY(${direction*8}deg)`:''}`},
  {opacity:1,transform:'translateX(0) rotateY(0)'}
 ],{duration:i===0?360:280,easing:'cubic-bezier(.2,.75,.2,1)'}));
 await Promise.all(detailAnimations.map(a=>a.finished.catch(()=>{})));
 if(revision===detailRevision)cancelDetailAnimations();
}
document.querySelector('#prev-product').addEventListener('click',()=>changeDetail(-1));
document.querySelector('#next-product').addEventListener('click',()=>changeDetail(1));
detail.addEventListener('keydown',e=>{if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();if(e.repeat)return;changeDetail(e.key==='ArrowRight'?1:-1)}});
let swipeStart=null;
const detailPhoto=document.querySelector('.detail-photo');
detailPhoto.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary&&!e.target.closest('button')){swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};detailPhoto.setPointerCapture(e.pointerId)}});
detailPhoto.addEventListener('pointerup',e=>{if(!swipeStart||e.pointerId!==swipeStart.id)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3)changeDetail(dx<0?1:-1)});
detailPhoto.addEventListener('pointercancel',()=>{swipeStart=null});
document.querySelector('#close-detail').addEventListener('click',()=>detail.close());
detail.addEventListener('click',e=>{if(e.target===detail){const r=detail.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)detail.close()}});
detail.addEventListener('close',()=>{detailRevision++;cancelDetailAnimations();swipeStart=null;pieces[detailIndex].hit.focus({preventScroll:true});select(detailIndex)});
document.querySelectorAll('.size-option').forEach(b=>b.addEventListener('click',()=>{selectedSizes[displayedDetailIndex]=b.textContent;document.querySelectorAll('.size-option').forEach(s=>s.setAttribute('aria-pressed',s===b))}));
window.addEventListener('resize',()=>{clearHover();measure()});
document.addEventListener('visibilitychange',()=>{last=0});reduced.addEventListener('change',()=>{if(reduced.matches)finishEntrance();start();if(reduced.matches&&detail.open){detailRevision++;cancelDetailAnimations();renderDetail(detailIndex)}});
document.querySelector('#detail-count').textContent=`${products.length?'01':'00'} / ${collectionCount}`;
document.querySelectorAll('.detail-nav-button').forEach(button=>{button.hidden=products.length<2});
document.querySelector('.detail-navigation').dataset.single=products.length<2;
if(!products.length)document.querySelector('#current-note').textContent='新品即将上架。';
measure();
Promise.all(pieces.map(async(p,i)=>{
 const product=products[i];
 await Promise.all([p.front.firstElementChild.decode(),p.side.firstElementChild.decode()]);
 p.frontMeta=KnitCatalog.measure(product.front,p.front.firstElementChild);
 p.sideMeta=KnitCatalog.measure(product.side,p.side.firstElementChild);
})).then(()=>{measure();beginEntrance()}).catch(error=>{
 showroom.dataset.entrance='failed';
 document.querySelector('#current-note').textContent='服饰素材暂时无法加载。';
 console.error('Please check clothes.config.js image paths and measurements:',error);
});

})();
