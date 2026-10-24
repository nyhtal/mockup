// A query in the address (?q=) is searched against the locale's index: every match on one page, its terms marked as the build marks them (search-index.js MARK), the count line and chip counts updated, the paging removed; no match shows the empty state.
const d=document,q=new URLSearchParams(location.search).get("q")?.trim(),E=s=>s.replace(/[&<>"]/g,c=>"&#"+c.charCodeAt(0)+";");
if(q){d.querySelectorAll("input[name=q]").forEach(i=>i.value=q);const l=q.toLocaleLowerCase(),re=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","giu"),M=s=>s.split(re).map((p,i)=>i%2?`<mark class="rounded-sm bg-accent-100 px-0.5 text-accent-800">${E(p)}</mark>`:E(p)).join("");
d.querySelectorAll("[data-index]").forEach(w=>fetch(w.dataset.index).then(r=>r.json()).then(x=>{
const hits=x.filter(r=>`${r.title} ${r.excerpt}`.toLocaleLowerCase().includes(l)),n=hits.length,ol=w.querySelector("ol"),T=ol.firstElementChild,lab={};
if(!n)return w.replaceChildren(w.querySelector("template[data-empty]").content);
w.querySelector("fieldset").querySelectorAll("input").forEach(i=>{const g=i.value,k=g=="all"?n:hits.filter(r=>r.group==g).length;lab[g]=i.nextSibling.textContent.trim();i.parentNode.lastChild.textContent=`(${k})`;i.disabled=!k;i.checked=g=="all"});
ol.replaceChildren(...hits.map(r=>{const li=T.cloneNode(!0),a=li.querySelector("a");li.dataset.group=r.group;li.querySelector("[data-component=badge]").textContent=lab[r.group];a.href=r.href;a.innerHTML=M(r.title);li.children[2].innerHTML=M(r.excerpt);li.children[3].textContent=r.href;return li}));
w.querySelector("[data-component=pagination]")?.parentNode.remove();
const P=JSON.parse(w.dataset.plural),[s,e=""]=(P[new Intl.PluralRules(d.documentElement.lang).select(n)]??P.other).replace(/\{(n|count)\}/g,n).split("{query}"),b=d.createElement("bdi");b.textContent=q;w.firstElementChild.replaceChildren(s,b,e)
}).catch(()=>{}))}
