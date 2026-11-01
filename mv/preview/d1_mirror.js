// ① 合わせ鏡 — infinite mirror corridor, WebGL fragment shader + subtitle overlay.
Engine.register('d1', function (stage) {
  const { U, L } = Engine;
  const cv = stage.querySelector('canvas.gl'), ov = stage.querySelector('canvas.ov');
  const octx = ov.getContext('2d');
  const gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: true, alpha: false });
  const seg = [222.0, 246.0];
  const SHATTER = 229.98;

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uT, uCam, uCamF, uRot, uFig, uFlick, uCrack, uShat, uKal, uPulse, uDark, uGlit;
#define S 0.62
float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float rectD(vec2 p){return max(abs(p.x)*0.5625,abs(p.y));}
float sdCap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float sdTrap(vec2 p,float r1,float r2,float he){vec2 k1=vec2(r2,he),k2=vec2(r2-r1,2.*he);p.x=abs(p.x);
 vec2 ca=vec2(p.x-min(p.x,(p.y<0.)?r1:r2),abs(p.y)-he);vec2 cb=p-k1+k2*clamp(dot(k1-p,k2)/dot(k2,k2),0.,1.);
 float s=(cb.x<0.&&ca.y<0.)?-1.:1.;return s*sqrt(min(dot(ca,ca),dot(cb,cb)));}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float sdFig(vec2 f){
 float d=length((f-vec2(0.,.80))*vec2(1.,.9))-.072;
 d=min(d,sdTrap(f-vec2(0.,.64),.075,.088,.17));
 d=min(d,sdTrap(f-vec2(0.,.56),.078,.115,.12));
 d=min(d,sdTrap(f-vec2(0.,.38),.135,.082,.09));
 d=min(d,sdCap(f,vec2(-.038,.30),vec2(-.040,.02),.021));
 d=min(d,sdCap(f,vec2(.038,.30),vec2(.042,.02),.021));
 d=min(d,sdCap(f,vec2(-.112,.66),vec2(-.128,.40),.019));
 d=min(d,sdCap(f,vec2(.112,.66),vec2(.128,.40),.019));
 return d;}
vec3 corridor(vec2 p,float px,float cam){
 float d=rectD(p);
 float depth=log(max(d,1e-5)/.5)/log(S);
 float z=depth+cam; float n=floor(z); float f=z-n;
 float fog=exp(-max(depth,0.)*.30);
 vec3 col=mix(vec3(.006,.010,.024),vec3(.05,.10,.26),fog*.9);
 vec2 ql=p/(.5*pow(S,n-cam));
 col+=vec3(.05,.08,.17)*fog*(.55+.45*ql.y)*.55;
 col+=vec3(.10,.14,.25)*fog*smoothstep(.65,1.,abs(ql.x)*.5625)*.5;
 float bw=.045;
 float edge=smoothstep(bw,0.,f);
 float groove=smoothstep(0.,.01,f)*smoothstep(bw*2.4,bw*1.2,f);
 col*=1.-.55*groove*(1.-edge);
 col+=vec3(.55,.72,1.)*pow(edge,1.6)*fog*(.55+.9*uPulse);
 if(uFig>.001){
  for(int k=2;k>=0;k--){
   float m=n-float(k); float sc=.5*pow(S,m-cam); vec2 q=p/sc;
   float side=mod(m,2.)<.5?1.:-1.; float hs=.78;
   float sd=sdFig(vec2((q.x-side*.55)*side,q.y+.97)/hs)*hs; float aa=px/sc;
   float a=smoothstep(aa,-aa,sd);
   if(a>0.){
    float fd=exp(-max(m-cam,0.)*.30);
    vec3 fc=vec3(.003,.005,.010)+vec3(.30,.42,.75)*smoothstep(-.025,0.,sd)*fd*.9;
    col=mix(col,fc,a*uFig); break;
   }
  }
 }
 return col;}
float glit(vec2 p,float t,float dens,float sc){
 vec2 g=p*sc; vec2 id=floor(g); vec2 fp=fract(g); float h=h12(id);
 float on=step(1.-dens,h); vec2 c=h22(id)*.6+.2; float d=length(fp-c);
 float tw=pow(.5+.5*sin(t*(1.3+4.5*h)+h*70.),5.);
 return on*smoothstep(.42,0.,d)*tw;}
#define NC 14.0
vec3 crackF(vec2 p){
 vec2 O=vec2(.16,.05); vec2 q=p-O; float r=length(q); float a=atan(q.y,q.x);
 vec2 w=vec2((a/6.2831853+.5)*NC,log(r+.015)*1.6); vec2 i=floor(w),f=fract(w);
 float md=8.,md2=8.; vec2 mc=i;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 b=vec2(float(x),float(y));vec2 cid=i+b;cid.x=mod(cid.x,NC);vec2 o=h22(cid);vec2 rr=b+o-f;float dd=dot(rr,rr);
  if(dd<md){md2=md;md=dd;mc=cid;}else if(dd<md2){md2=dd;}}
 return vec3((sqrt(md2)-sqrt(md))*(r+.02)/1.9,h12(mc),r);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
void main(){
 vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 float px=1./uRes.y;
 p=rot(uRot)*p;
 if(uKal>.5){p.x=abs(p.x)-.30; p=rot(uT*.15)*p;}
 vec3 col;
 vec2 chroma=p*.004;
 col.r=corridor(p+chroma,px,uCam).r; col.g=corridor(p,px,uCam).g; col.b=corridor(p-chroma,px,uCam).b;
 col*=1.-uFlick;
 col=mix(col,col*.18,uDark);
 // glitter: fine sand + a few star flares
 float gl=glit(p,uT,.06,210.)*.8+glit(p+3.1,uT*.7,.03,90.)*1.2;
 col+=vec3(.75,.85,1.)*gl*uGlit*(1.-uDark*.7);
 // cracks during the silence
 if(uCrack>0.&&uShat<0.){
  vec3 cf=crackF(p); vec2 q=p-vec2(.16,.05); float an=atan(q.y,q.x);
  float front=uCrack*1.35*(.8+.25*sin(an*3.+1.7)+.15*sin(an*7.+.3));
  float grow=smoothstep(front,front-.04,cf.z);
  float line=smoothstep(px*1.6,0.,cf.x)*grow; float glow=smoothstep(px*9.,0.,cf.x)*grow;
  col=mix(col,vec3(.88,.94,1.),line*.9); col+=vec3(.25,.38,.7)*glow*.35;
  col+=vec3(.9,.95,1.)*exp(-cf.z*40.)*uCrack*.6;
 }
 if(uShat>=0.){
  float e=uShat; vec2 O=vec2(.16,.05);
  // burst of glitter riding the shock wave
  float r=length(p-O); float ring=exp(-pow((r-e*1.15)*5.,2.));
  col+=vec3(.8,.9,1.)*glit(p*1.4+e*.3,uT*3.,.20,160.)*ring*3.;
  if(e<1.0){
   float sc=1.+e*.8+e*e*2.6; vec2 ps=O+(p-O)/sc; vec3 cf=crackF(ps);
   float gap=px*2.+e*.035; float inside=smoothstep(gap,gap+px*2.,cf.x);
   vec3 sh=corridor(ps+(h22(vec2(cf.y*91.,3.))-.5)*.06*e,px,uCamF)*.4;
   sh+=vec3(.6,.75,1.)*smoothstep(gap+px*5.,gap,cf.x)*.8;
   sh+=vec3(.5,.6,.9)*pow(max(0.,sin((ps.x-ps.y)*7.+cf.y*30.)),16.)*.6;
   col=mix(col,sh,inside*(1.-smoothstep(.55,1.,e)));
  }
  col+=vec3(1.)*exp(-e*22.)*1.4;
 }
 float v=1.-dot(p*vec2(.9,1.2),p*vec2(.9,1.2))*.9; col*=clamp(v,0.,1.);
 col=pow(col,vec3(.92));
 gl_FragColor=vec4(col,1.);
}`;

  let prog = null, U_ = {};
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); prog = null; }
    if (prog) {
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uT', 'uCam', 'uCamF', 'uRot', 'uFig', 'uFlick', 'uCrack', 'uShat', 'uKal', 'uPulse', 'uDark', 'uGlit'].forEach(n => U_[n] = gl.getUniformLocation(prog, n));
    }
  }

  // corridor depth (in frames) as a function of time
  function cam(t) {
    if (t < 226.3) { const x = t - 222; return 2 * x + 0.465 * x * x; }
    const c0 = 2 * 4.3 + 0.465 * 4.3 * 4.3;
    if (t < SHATTER) { const u = U.clamp((t - 226.3) / 0.4, 0, 1); return c0 + 1.2 * (1 - (1 - u) * (1 - u)); }
    const c1 = c0 + 1.2; const e = t - SHATTER; const n = e / 0.5;
    return c1 + Math.floor(n) + U.easeOut(U.fract(n) * 1.6) + 3 * (1 - Math.exp(-e * 2.5));
  }
  const chorus = L.find('泣いてるのに', 230.2), chorus2 = L.find('泣いてるのに', 237.9);
  const kimiT = chorus ? chorus.ct[chorus.jp.indexOf('君')] : 236;

  function figAt(t) {
    if (t < 226.3) return 0.75 + 0.25 * Math.sin(t * 40) * (U.hash(Math.floor(t * 12)) > 0.6 ? 1 : 0);
    if (t < SHATTER) return U.clamp(1 - (t - 226.3) / 1.5, 0, 1) * 0.6;
    if (t < SHATTER + 0.6) return 0;
    if (t < kimiT) return U.smooth(SHATTER + 0.6, SHATTER + 1.2, t);
    return 1 - U.smooth(kimiT, kimiT + 0.35, t);
  }

  function drawGL(t) {
    if (!prog) return;
    gl.viewport(0, 0, cv.width, cv.height);
    const pulse = t > SHATTER ? U.pulse(t, 1, 5) : (t < 226.3 ? U.pulse(t, 2, 7) * 0.7 : 0);
    const roll = Math.sin(t * 0.37) * 0.04 + (t > SHATTER ? Math.sin(t * 1.3) * 0.03 : 0) + (t < 226.3 ? (U.hash(Math.floor(t * 8)) - 0.5) * 0.06 * U.smooth(222, 226, t) : 0);
    gl.uniform2f(U_.uRes, cv.width, cv.height);
    gl.uniform1f(U_.uT, t); gl.uniform1f(U_.uCam, cam(t)); gl.uniform1f(U_.uCamF, cam(SHATTER - 0.01));
    gl.uniform1f(U_.uRot, roll);
    gl.uniform1f(U_.uFig, U.clamp(figAt(t), 0, 1));
    gl.uniform1f(U_.uFlick, t < 226.3 ? (U.hash(Math.floor(t * 24)) > 0.72 ? 0.45 : 0) * U.smooth(222.5, 225, t) : 0);
    gl.uniform1f(U_.uCrack, t >= 226.4 && t < SHATTER ? U.easeIn(U.smooth(226.4, 229.9, t) * 0.92 + 0.08) : 0);
    gl.uniform1f(U_.uShat, t >= SHATTER ? t - SHATTER : -1);
    gl.uniform1f(U_.uKal, chorus2 && t >= chorus2.ct[0] - 0.05 ? 1 : 0);
    gl.uniform1f(U_.uPulse, pulse);
    gl.uniform1f(U_.uDark, t >= 226.3 && t < SHATTER ? U.smooth(226.3, 227.0, t) : 0);
    gl.uniform1f(U_.uGlit, t < 226.3 ? 0.6 : (t < SHATTER ? 0.35 : 1.0));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function drawText(t) {
    const W = ov.width, H = ov.height; octx.clearRect(0, 0, W, H);
    if (!gl || !prog) { octx.fillStyle = '#9aa'; octx.font = Math.round(H * 0.04) + 'px sans-serif'; octx.textAlign = 'center'; octx.fillText('这个浏览器不支持 WebGL，无法显示这段演示', W / 2, H / 2); return; }
    const line = L.at(t); if (!line) return;
    const n = L.shown(line, t); if (n <= 0) return;
    const fade = 1 - U.smooth(line.t1 - 0.35, line.t1 - 0.02, t);
    const fs = Math.round(H * 0.046);
    octx.font = '500 ' + fs + 'px "Shippori Mincho B1", serif'; octx.textBaseline = 'alphabetic';
    const full = octx.measureText(line.jp).width; let x = W / 2 - full / 2; const y = H * 0.86;
    octx.shadowColor = 'rgba(0,0,0,.8)'; octx.shadowBlur = fs * 0.4;
    for (let i = 0; i < n; i++) {
      const ch = line.jp[i]; const age = t - line.ct[i]; const a = U.clamp(age / 0.12, 0, 1) * fade;
      octx.fillStyle = `rgba(232,238,255,${a})`; octx.fillText(ch, x, y - (1 - U.easeOut(age / 0.25)) * fs * 0.25);
      x += octx.measureText(ch).width;
    }
    if (line.cn) {
      const cs = Math.round(H * 0.027); octx.font = '500 ' + cs + 'px "Noto Serif SC", serif'; octx.textAlign = 'center';
      octx.fillStyle = `rgba(160,175,205,${0.9 * fade * U.clamp((t - line.ct[0]) / 0.4, 0, 1)})`; octx.fillText(line.cn, W / 2, y + cs * 1.7); octx.textAlign = 'left';
    }
    octx.shadowBlur = 0;
  }

  return {
    seg, poster: 231.7, maxW: 1024,
    draw(t) { drawGL(t); drawText(t); }
  };
});
