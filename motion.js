/* Time-based springs preserve position and velocity when their targets change.
   The closed-form solution gives the same motion at different refresh rates. */
const KnitMotion = (() => {
  function spring(state, key, velocityKey, target, omega, damping, dt) {
    const offset=state[key]-target, velocity=state[velocityKey];
    const decay=Math.exp(-damping*omega*dt);
    if(damping===1) {
      const c=velocity+omega*offset;
      state[key]=target+(offset+c*dt)*decay;
      state[velocityKey]=(velocity-omega*c*dt)*decay;
    } else {
      const frequency=omega*Math.sqrt(1-damping*damping);
      const cosine=Math.cos(frequency*dt), sine=Math.sin(frequency*dt);
      state[key]=target+decay*(offset*cosine+(velocity+damping*omega*offset)/frequency*sine);
      state[velocityKey]=decay*(velocity*cosine-(damping*omega*velocity+omega*omega*offset)/frequency*sine);
    }
  }
  function layout(items,active,step,railWidth,bodyHeight) {
    const targets=items.map((_,i)=>(i-(items.length-1)/2)*step);
    if(active<0)return targets;
    const edge=railWidth/2-railWidth*.035;
    const gap=Math.max(8,bodyHeight*.075);
    const focus=items[active];
    const groups=[-1,1].map(direction=>{
      const indices=[];
      for(let i=active+direction;i>=0&&i<items.length;i+=direction)indices.push(i);
      const spacing=indices.slice(1).map((i,k)=>{
        const prev=items[indices[k]].sideBounds,next=items[i].sideBounds;
        return (direction<0?next.right-prev.left:prev.right-next.left)*.67;
      });
      const span=spacing.reduce((sum,d)=>sum+d,0);
      let base=direction<0?-focus.frontBounds.left:focus.frontBounds.right;
      if(indices.length){
        const first=items[indices[0]].sideBounds,last=items[indices.at(-1)].sideBounds;
        base+=gap+(direction<0?first.right-last.left:last.right-first.left);
      }
      return {direction,indices,spacing,span,base};
    });
    // Fit both groups together, then constrain the selected hook only when
    // an edge garment would otherwise hang beyond the ends of the rail.
    const totalSpan=groups[0].span+groups[1].span;
    const room=2*edge-groups[0].base-groups[1].base;
    const compression=totalSpan?Math.max(0,Math.min(1,room/totalSpan)):1;
    const minFocus=-edge+groups[0].base+groups[0].span*compression;
    const maxFocus=edge-groups[1].base-groups[1].span*compression;
    targets[active]=Math.max(minFocus,Math.min(maxFocus,targets[active]));
    for(const {direction,indices,spacing} of groups){
      if(!indices.length)continue;
      const first=items[indices[0]].sideBounds;
      targets[indices[0]]=direction<0 ? targets[active]+focus.frontBounds.left-gap-first.right
        : targets[active]+focus.frontBounds.right+gap-first.left;
      indices.slice(1).forEach((i,k)=>{targets[i]=targets[indices[k]]+direction*spacing[k]*compression});
    }
    return targets;
  }
  function smoothstep(min,max,value){const t=Math.max(0,Math.min(1,(value-min)/(max-min)));return t*t*(3-2*t);}
  // The hook approaches the rail from above and stops at contact. Only the
  // fabric's pendulum receives the landing impulse; the hook never bounces
  // below the rail or rotates with the clothes.
  function entrance(index,elapsed,lift){
    const age=elapsed-index*.075,progress=Math.max(0,Math.min(1,age/.56));
    return {started:age>=0,landed:progress===1,y:-lift*(1-smoothstep(0,1,progress)),opacity:smoothstep(0,.18,age)};
  }
  return {spring,layout,smoothstep,entrance};
})();
