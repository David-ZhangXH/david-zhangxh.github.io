const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox']});
  const p = await b.newPage({viewport:{width:980,height:900}});
  await p.goto('file:///home/claude/davidworld/concept-board.html');
  await p.waitForTimeout(700);
  await p.screenshot({path:'board-top.png', clip:{x:0,y:0,width:980,height:900}});
  await p.evaluate(()=>window.scrollTo(0,900));
  await p.waitForTimeout(400);
  await p.screenshot({path:'board-mid.png'});
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await p.waitForTimeout(400);
  await p.screenshot({path:'board-bot.png'});
  await b.close();
})();
