'use strict';
// 40 sample subscribers (fictional; reserved example.* domains only).
const names = [
  ['Wanjiru Kamau','wanjiru.k'],['Brian Otieno','brian.otieno'],['Amina Hassan','amina.hassan'],['Peter Mwangi','peter.mwangi'],
  ['Grace Achieng','grace.achieng'],['Daniel Kiprop','daniel.kiprop'],['Fatuma Ali','fatuma.ali'],['James Mutua','james.mutua'],
  ['Lucy Njeri','lucy.njeri'],['Samuel Odhiambo','sam.odhiambo'],['Esther Wambui','esther.wambui'],['Hassan Omar','hassan.omar'],
  ['Mercy Chebet','mercy.chebet'],['Kevin Maina','kevin.maina'],['Joyce Atieno','joyce.atieno'],['Ibrahim Yusuf','ibrahim.yusuf'],
  ['Nancy Muthoni','nancy.muthoni'],['Collins Kipchumba','collins.kip'],['Rose Nyambura','rose.nyambura'],['Abdi Mohamed','abdi.mohamed'],
  ['Faith Wangari','faith.wangari'],['Victor Ouma','victor.ouma'],['Zawadi Mwende','zawadi.mwende'],['Dennis Karanja','dennis.karanja'],
  ['Cynthia Akinyi','cynthia.akinyi'],['Moses Kariuki','moses.kariuki'],['Naomi Jepkoech','naomi.jepkoech'],['Hellen Wafula','hellen.wafula'],
  ['Tom Mboya Jr','tom.mboyajr'],['Sharon Naliaka','sharon.naliaka'],['Patrick Ndungu','patrick.ndungu'],['Lilian Moraa','lilian.moraa'],
  ['Eric Sang','eric.sang'],['Beatrice Wairimu','beatrice.wairimu'],['Yusuf Karim','yusuf.karim'],['Diana Cherono','diana.cherono'],
  ['Aisha Bakari','aisha.bakari'],['John Waweru','john.waweru'],['Ruth Anyango','ruth.anyango'],['Martin Gitau','martin.gitau'],
];
const cats = ['digital-marketing','web-development','software-development','software-design','database-management','consulting','data-analytics','training'];
const sources = ['footer-form','subscribe-page','blog','booking','proposal','import'];
const domains = ['example.com','example.org','example.net'];
const status = Array(30).fill('SUBSCRIBED').concat(Array(4).fill('UNSUBSCRIBED'), Array(3).fill('PENDING'), Array(3).fill('BOUNCED'));
// deterministic shuffle so the sample data is stable between builds
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
for (let i = status.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [status[i], status[j]] = [status[j], status[i]]; }
module.exports = names.map(([name, local], i) => {
  const n = 1 + Math.floor(rnd() * 4), picks = new Set();
  while (picks.size < n) picks.add(cats[Math.floor(rnd() * cats.length)]);
  const phone = i % 3 === 2 ? '' : '+2547' + String(10000000 + Math.floor(rnd() * 89999999)).slice(0, 8);
  return { name, email: `${local}@${domains[i % 3]}`, phone, interests: [...picks], status: status[i],
    source: sources[Math.floor(rnd() * sources.length)], days_ago_subscribed: 1 + Math.floor(rnd() * 160) };
});
