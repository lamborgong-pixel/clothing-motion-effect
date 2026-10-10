/* A cylindrical rail and wire hooks share a depth buffer. Hook orientation is
   independent of the garment; only its translation changes along the rail. */
class RailHardware {
  constructor(canvas) {
    this.canvas=canvas; const gl=this.gl=canvas.getContext('webgl',{alpha:true,antialias:true});
    if(!gl)throw new Error('This browser needs WebGL for the clothing rail.');
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
    const program=this.program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 p; attribute vec3 n; uniform vec2 viewport; uniform vec2 origin; uniform vec3 offset; varying vec3 normal; varying vec3 point; void main(){point=p+offset;normal=n;gl_Position=vec4((point.x+origin.x)/viewport.x*2.-1.,1.-(origin.y-point.y)/viewport.y*2.,-point.z/500.,1.);}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float; varying vec3 normal; varying vec3 point; uniform float dark; uniform float opacity; void main(){vec3 N=normalize(normal);vec3 reflected=reflect(vec3(0.,0.,-1.),N);float strip=exp(-pow((reflected.y-.48)/.23,2.));float bottom=exp(-pow((reflected.y+.65)/.22,2.));float shade=.26+.30*max(N.z,0.)+.36*strip+.12*bottom;float grain=sin(point.x*23.+point.y*8.)*.012;vec3 color=vec3(shade+grain)*vec3(1.,.992,.972);gl_FragColor=vec4(mix(color,vec3(.14),dark),opacity);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    this.u={};for(const s of ['viewport','origin','offset','dark','opacity'])this.u[s]=gl.getUniformLocation(program,s);
    this.p=gl.getAttribLocation(program,'p');this.n=gl.getAttribLocation(program,'n');
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  }
  mesh(data,dark=0){const gl=this.gl;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/6,dark};}
  resize(w,h,top,length,radius,stem){
    this.w=w;this.h=h;this.top=top;const dpr=Math.min(devicePixelRatio,2);this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
    for(const mesh of this.static||[])this.gl.deleteBuffer(mesh.buffer);if(this.hook)this.gl.deleteBuffer(this.hook.buffer);
    const cylinder=(axis,center,r,len)=>{
      const out=[]; const vertex=(a,t)=>{const c=Math.cos(a),s=Math.sin(a);const p=axis==='x'?[t,r*c,r*s]:[r*c,r*s,t];const n=axis==='x'?[0,c,s]:[c,s,0];return [...p.map((v,i)=>v+center[i]),...n]};
      for(let i=0;i<64;i++){let a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2;out.push(...vertex(a,-len/2),...vertex(b,-len/2),...vertex(b,len/2),...vertex(a,-len/2),...vertex(b,len/2),...vertex(a,len/2));}return out;
    };
    const box=(c,size)=>{const o=[];for(let a=0;a<3;a++)for(const sign of [-1,1]){const b=(a+1)%3,d=(a+2)%3;const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];const v=corners.map(pair=>{let p=c.slice(),n=[0,0,0];p[a]+=sign*size[a]/2;p[b]+=pair[0]*size[b]/2;p[d]+=pair[1]*size[d]/2;n[a]=sign;return [...p,...n]});for(const i of [0,1,2,0,2,3])o.push(...v[i]);}return o;};
    this.static=[this.mesh(cylinder('x',[0,0,0],radius,length))];
    for(const sign of [-1,1]){
      const x=sign*(length/2-8);this.static.push(this.mesh(box([x,0,-radius],[radius*2.7,radius*6,radius*1.1])),this.mesh(cylinder('x',[x,0,0],radius*1.25,radius*3.1)));
      for(const y of [-radius*2.2,radius*2.2])this.static.push(this.mesh(cylinder('z',[x,y,0],radius*.50,2)),this.mesh(box([x,y,1.1],[radius*.66,.65,.3]),.8));
    }
    // The wire centerline remains outside the tube radius. Its rear arc is
    // hidden by the rail, while the near arc curves over the front surface.
    const rr=radius+.9,wr=Math.max(.55,radius*.11),points=[];
    for(let i=0;i<=48;i++){const a=(-125+i/48*280)*Math.PI/180;points.push([Math.sin(a)*rr*.46,Math.cos(a)*rr,Math.sin(a)*rr]);}
    const end=points.at(-1);for(let i=1;i<=10;i++){const t=i/10;points.push([end[0]*(1-t),end[1]+(-stem-end[1])*t,end[2]*(1-t)+1.5*t]);}
    const data=[];const sides=10;const rings=points.map((p,i)=>{let prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],t=next.map((v,j)=>v-prev[j]);let l=Math.hypot(...t);t=t.map(v=>v/l);let u=[t[1],-t[0],0];l=Math.hypot(...u)||1;u=u.map(v=>v/l);let v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]];return Array.from({length:sides},(_,k)=>{let a=k/sides*Math.PI*2,n=u.map((x,j)=>x*Math.cos(a)+v[j]*Math.sin(a));return [...p.map((x,j)=>x+wr*n[j]),...n]});});
    for(let i=0;i<rings.length-1;i++)for(let k=0;k<sides;k++){let j=(k+1)%sides;data.push(...rings[i][k],...rings[i][j],...rings[i+1][j],...rings[i][k],...rings[i+1][j],...rings[i+1][k]);}
    this.hook=this.mesh(data);
  }
  render(positions,entrances=[]){
    const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(this.u.viewport,this.w,this.h);gl.uniform2f(this.u.origin,this.w/2,this.top);
    const draw=(m,x=0,y=0,opacity=1)=>{
      if(opacity<=0)return;
      gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.enableVertexAttribArray(this.p);gl.enableVertexAttribArray(this.n);gl.vertexAttribPointer(this.p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(this.n,3,gl.FLOAT,false,24,12);
      gl.uniform3f(this.u.offset,x,-y,0);gl.uniform1f(this.u.dark,m.dark);gl.uniform1f(this.u.opacity,opacity);gl.drawArrays(gl.TRIANGLES,0,m.count);
    };
    this.static.forEach(m=>draw(m));positions.forEach((x,i)=>draw(this.hook,x,entrances[i]?.y??0,entrances[i]?.opacity??1));
  }
}
