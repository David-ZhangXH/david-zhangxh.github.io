const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
  const p = await b.newPage({viewport:{width:900,height:1400}});
  await p.goto('file:///home/claude/davidworld/hybrid-options.html');
  await p.waitForTimeout(500);
  await p.screenshot({path:'hybrid.png', fullPage:true});
  await b.close();
})();
