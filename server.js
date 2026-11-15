const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const app = express();
const db = new Database(path.join(__dirname, "daily_money_gap.db"));
app.use(express.json());
app.use(express.static(__dirname));

db.exec(`
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), monthly_income REAL NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO settings(id, monthly_income) VALUES(1,0);
CREATE TABLE IF NOT EXISTS expenses (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 amount REAL NOT NULL CHECK(amount > 0),
 category TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);

function dashboard() {
 const income = db.prepare("SELECT monthly_income FROM settings WHERE id=1").get().monthly_income;
 const expenses = db.prepare("SELECT id,name,amount,category,date(created_at) AS date FROM expenses ORDER BY id DESC").all();
 const total = expenses.reduce((s,e)=>s+e.amount,0);
 return {income,total,balance:income-total,savingsTarget:income*.2,expenses};
}
app.get("/api/health",(req,res)=>res.json({ok:true}));
app.get("/api/dashboard",(req,res)=>res.json(dashboard()));
app.put("/api/income",(req,res)=>{
 const income=Number(req.body.income);
 if(!Number.isFinite(income)||income<0) return res.status(400).json({error:"Enter a valid income."});
 db.prepare("UPDATE settings SET monthly_income=? WHERE id=1").run(income);
 res.json(dashboard());
});
app.post("/api/expenses",(req,res)=>{
 const name=String(req.body.name||"").trim(), amount=Number(req.body.amount), category=String(req.body.category||"");
 if(!name) return res.status(400).json({error:"Expense name is required."});
 if(!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Amount must be greater than zero."});
 if(!["Needs","Wants","Savings & Debt"].includes(category)) return res.status(400).json({error:"Invalid category."});
 const result=db.prepare("INSERT INTO expenses(name,amount,category) VALUES(?,?,?)").run(name,amount,category);
 res.status(201).json({id:result.lastInsertRowid,name,amount,category});
});
app.delete("/api/expenses/:id",(req,res)=>{
 const result=db.prepare("DELETE FROM expenses WHERE id=?").run(Number(req.params.id));
 if(!result.changes) return res.status(404).json({error:"Expense not found."});
 res.json({ok:true});
});
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Daily Money Gap running at http://localhost:${PORT}`));
