const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
  const p = await b.newPage({viewport:{width:940,height:800}});
  await p.goto('file:///home/claude/davidworld/design-spec.html');
  await p.waitForTimeout(500);
  const y = await p.evaluate(()=>{const s=document.querySelectorAll('section')[1];return s.getBoundingClientRect().top+window.scrollY;});
  await p.evaluate((y)=>window.scrollTo(0,y+120), y);
  await p.waitForTimeout(300);
  await p.screenshot({path:'galaxy-fix.png'});
  await b.close();
})();
