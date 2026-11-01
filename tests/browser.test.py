"""Optional local browser QA; requires python playwright and chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf8')
JS=r'''(role) => {
 const out={seen:[],errors:[],overflows:[],completed:false,limited:[]};
 document.querySelector('#next').click();
 for(let step=0;step<90;step++){
  const x=document.querySelector('.question-number'); if(!x){out.errors.push('missing Q '+step); break;}
  const id=x.textContent;out.seen.push(id);
  if(document.documentElement.scrollWidth>innerWidth+2)out.overflows.push(id);
  if(id==='Q9'||id==='Q17'||id==='Q16'){
   if(document.querySelectorAll('#main .rating-unknown').length!==(id==='Q16'?1:5))out.errors.push(id+': missing undecided choice');
   const labels=[...document.querySelectorAll('#main .rating:not(.rating-unknown) .rating-text')].map(x=>x.textContent);
   const expected=id==='Q16'?['全く関心がない','あまり関心がない','どちらともいえない','やや関心がある','非常に関心がある']:['全く気にならない','あまり気にならない','どちらともいえない','やや気になる','非常に気になる'];
   if(labels.length!==(id==='Q16'?5:25)||labels.some((x,i)=>x!==expected[i%5]))out.errors.push(id+': rating labels do not match');
  }
  const main=document.querySelector('#main');
  const radios=[...main.querySelectorAll('input[type="radio"]')];
  const checks=[...main.querySelectorAll('input[type="checkbox"]')];
  const tx=main.querySelector('textarea');
  if(id==='Q4') radios[role].click();
  else if(id==='Q7')radios[2].click();
  else if(id==='Q16')radios[3].click();
  else if(id==='Q10'||id==='Q18'){
   checks[0].click();checks[1].click();checks[2].click();checks[3].click();
   out.limited.push([id,checks.filter(c=>c.checked).length,checks[3].checked]);
  } else if(checks.length) checks[0].click();
  else if(id==='Q9'||id==='Q17'){
   for(const row of main.querySelectorAll('.matrixrow'))row.querySelectorAll('input[type="radio"]')[2].click();
  } else if(radios.length)radios[0].click();
  else if(tx)tx.value='';
  else out.errors.push('missing input '+id);
  document.querySelector('#next').click();
  if(document.querySelector('#error')?.textContent){out.errors.push(id+': '+document.querySelector('#error').textContent);break;}
  if(document.querySelector('.questionarea h1')?.textContent.includes('回答の入力が完了')){out.completed=true;break;}
 }
 return out;
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 n=0
 for width,height in [(320,720),(390,844),(820,1180),(1440,900)]:
  for role in range(4):
   page=browser.new_page(viewport={'width':width,'height':height})
   pageerrors=[]
   page.on('pageerror',lambda err:pageerrors.append(str(err)))
   page.set_content(HTML)
   result=page.evaluate(JS,role)
   assert result['completed'] and not result['errors'] and not result['overflows'] and not pageerrors,(width,role,result,pageerrors)
   assert ('Q8' in result['seen'])==(role in (0,2))
   assert ('Q10' in result['seen'])==(role in (0,2))
   assert ('Q18' in result['seen'])==(role in (1,2))
   assert ('Q19' in result['seen'])==(role in (1,2))
   assert all(x[1]==3 and x[2] is False for x in result['limited']),result
   assert not page.get_by_role('button',name='回答を送信する').count()
   if width==390 and role==2: page.screenshot(path=str(ROOT/'mobile-preview.png'))
   page.close();n+=1
 # Configured GitHub Pages flow: intercept native HTML form POST, prove payload + URI correct.
 live=HTML.replace('<script src="config.js"></script>',"<script>window.AKISPOT_SUBMISSION_URL='https://script.google.com/macros/s/FAKE_DEPLOY_ID_12345/exec';</script>")
 page=browser.new_page(viewport={'width':390,'height':844})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(live)
 page.evaluate("(()=>{window.__posted=null;HTMLFormElement.prototype.submit=function(){window.__posted={url:this.action,method:this.method,payload:JSON.parse(this.querySelector('input[name=payload]').value)};};return true;})()")
 result=page.evaluate(JS,3)
 assert result['completed'],result
 assert page.get_by_role('button',name='回答を送信する').count()==1
 page.get_by_role('button',name='回答を送信する').click()
 data=page.evaluate('window.__posted')
 assert data and data['url'].endswith('/FAKE_DEPLOY_ID_12345/exec'),data
 assert data['method']=='post' and data['payload']['version']=='2026.11-r11'
 assert data['payload']['answers']['Q4']=='どちらも当てはまらない'
 assert 'Q25' in data['payload']['answers'] and not errs
 print('BROWSER PASS:',n,'viewport/route cases plus connected POST contract')
 page.close();browser.close()
