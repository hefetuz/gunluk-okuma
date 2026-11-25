// Fetch actual official references; never invent or roll yesterday's reading forward.
const fs=require('node:fs');
const path=require('node:path');
const {fetchDaily}=require('../daily-source.cjs');
async function main(){
  const output=path.resolve(__dirname,'../daily-readings.json');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let existing={readings:[]};try{existing=JSON.parse(fs.readFileSync(output,'utf8'));}catch{}
  const records=new Map(existing.readings.map(item=>[item.lang+':'+item.date,item]));
  const jobs=[];
  for(let day=0;day<8;day++){
    const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);
    for(const lang of ['tr','en'])jobs.push({lang,date:date.toISOString().slice(0,10)});
  }
  let errors=0;
  await Promise.all(Array.from({length:3},async()=>{
    while(jobs.length){const {lang,date}=jobs.shift();try{const value=await fetchDaily(lang,date);records.set(lang+':'+date,value);console.log(lang,date,'verified');}catch(error){errors++;console.warn(lang,date,error.message);}}
  }));
  if(!['tr','en'].every(lang=>records.has(lang+':'+today)))throw Error('Both editions of today’s reading must be verified before publication.');
  const readings=[...records.values()].filter(item=>item.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.lang.localeCompare(b.lang));
  fs.writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),readings})+'\n');
  console.log(readings.length+' verified readings; '+errors+' fetch failures');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
