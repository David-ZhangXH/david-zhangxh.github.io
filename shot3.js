const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
  const p = await b.newPage({viewport:{width:940,height:1200}});
  await p.goto('file:///home/claude/davidworld/design-spec.html');
  await p.waitForTimeout(600);
  const h = await p.evaluate(()=>document.body.scrollHeight);
  console.log('height', h);
  await p.screenshot({path:'spec1.png', clip:{x:0,y:0,width:940,height:1050}});
  await p.evaluate(()=>window.scrollTo(0,1050)); await p.waitForTimeout(300);
  await p.screenshot({path:'spec2.png'});
  await p.evaluate(()=>window.scrollTo(0,2250)); await p.waitForTimeout(300);
  await p.screenshot({path:'spec3.png'});
  await p.evaluate(()=>window.scrollTo(0,999999)); await p.waitForTimeout(300);
  await p.screenshot({path:'spec4.png'});
  await b.close();
})();
