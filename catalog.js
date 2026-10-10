/* Configuration and alpha measurements are independent of the animation. */
const KnitCatalog=(()=>{
  function products(config){
    if(!config||!Array.isArray(config.products))throw new Error('clothes.config.js must define KNIT_RAIL_CONFIG.products');
    const ids=new Set();
    const sprite=value=>{
      const spec=typeof value==='string'?{src:value}:value;
      if(!spec||typeof spec.src!=='string'||!spec.src.trim())throw new Error('Each garment needs front and side image paths');
      return {...spec,src:new URL(spec.src,config.baseURL||document.baseURI).href};
    };
    return config.products.filter(p=>p.enabled!==false).map(p=>{
      if(!p.id||ids.has(p.id))throw new Error(`Garment id must be unique: ${p.id||'(missing)'}`);
      if(typeof p.name!=='string'||!p.name.trim())throw new Error(`Garment needs a name: ${p.id}`);
      if(p.price!=null&&(!Number.isFinite(p.price)||p.price<0))throw new Error(`Invalid price: ${p.id}`);
      ids.add(p.id);
      const front=sprite(p.front),side=sprite(p.side);
      return {...p,english:p.english||p.name,note:p.note||'',price:p.price??null,color:p.color||'#d7d0c0',front,side,image:front.src};
    });
  }
  function measure(sprite,image){
    const w=image.naturalWidth,h=image.naturalHeight;
    if(!w||!h)throw new Error(`Image did not load: ${sprite.src}`);
    const point=sprite.hangPoint,bounds=sprite.bounds;
    let left=w,right=0,top=h,bottom=0,center=0,count=0;
    if(point&&bounds){left=bounds.left;right=bounds.right;bottom=bounds.bottom;top=point.y;center=point.x;}
    else{
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const data=ctx.getImageData(0,0,w,h).data;
      const cut=point?Math.ceil(point.y):0;
      for(let y=cut;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>150){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
      if(!bottom)throw new Error(`Image has no visible garment: ${sprite.src}`);
      if(point){top=point.y;center=point.x;}
      else{
        // Average the wooden neck's top rows, rather than the whole garment,
        // so asymmetric sleeves don't move the suspension point off center.
        for(let y=top;y<Math.min(top+20,bottom);y++)for(let x=left;x<right;x++)if(data[(y*w+x)*4+3]>150){center+=x;count++;}
        center/=count;
      }
      if(bounds){left=bounds.left;right=bounds.right;bottom=bounds.bottom;}
    }
    if(![left,right,top,bottom,center].every(Number.isFinite)||left<0||right>w||left>=right||top<0||bottom>h||top>=bottom||center<0||center>w)throw new Error(`Invalid image measurements: ${sprite.src}`);
    return {w,h,cut:top,bottom,left,right,center};
  }
  return {products,measure};
})();
