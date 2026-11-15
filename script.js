// API-connected frontend script. Use this instead of your old script.js.
let monthlyIncome=0, expenses=[];
async function api(url,options={}) {
 const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
 const result=await response.json().catch(()=>({}));
 if(!response.ok) throw new Error(result.error||"Server request failed");
 return result;
}
async function loadDashboard(){
 try { const d=await api("/api/dashboard"); monthlyIncome=d.income; expenses=d.expenses||[]; updateDashboard(); }
 catch(e){console.error(e);alert("Backend connection failed. Start the server using npm start.");}
}
async function setIncome(){
 const income=Number(document.getElementById("incomeInput").value);
 if(!Number.isFinite(income)||income<0) return alert("Enter a valid income.");
 try{await api("/api/income",{method:"PUT",body:JSON.stringify({income})});await loadDashboard();}
 catch(e){alert(e.message);}
}
async function addExpense(){
 const name=document.getElementById("expenseName").value.trim();
 const amount=Number(document.getElementById("expenseAmount").value);
 const category=document.getElementById("category").value;
 if(!name||!Number.isFinite(amount)||amount<=0) return alert("Enter valid expense details.");
 try{
  await api("/api/expenses",{method:"POST",body:JSON.stringify({name,amount,category})});
  document.getElementById("expenseName").value="";
  document.getElementById("expenseAmount").value="";
  await loadDashboard();
 }catch(e){alert(e.message);}
}
function updateDashboard(){
 const total=expenses.reduce((s,e)=>s+Number(e.amount),0);
 document.getElementById("income").textContent="₹"+monthlyIncome.toLocaleString("en-IN");
 document.getElementById("total").textContent="₹"+total.toLocaleString("en-IN");
 document.getElementById("balance").textContent="₹"+(monthlyIncome-total).toLocaleString("en-IN");
 document.getElementById("savingsTarget").textContent="₹"+(monthlyIncome*.2).toLocaleString("en-IN");
 const list=document.getElementById("expenseList"); list.replaceChildren();
 expenses.forEach(e=>{
  const li=document.createElement("li"), label=document.createElement("span"), del=document.createElement("button");
  label.textContent=`${e.name} — ₹${Number(e.amount).toLocaleString("en-IN")} (${e.category})`;
  del.textContent="Delete"; del.type="button"; del.addEventListener("click",()=>deleteExpense(e.id));
  li.append(label,del); list.append(li);
 });
}
async function deleteExpense(id){
 if(!confirm("Delete this expense?")) return;
 try{await api("/api/expenses/"+id,{method:"DELETE"});await loadDashboard();}
 catch(e){alert(e.message);}
}
document.addEventListener("DOMContentLoaded",loadDashboard);
