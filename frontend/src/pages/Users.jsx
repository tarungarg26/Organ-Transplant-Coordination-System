import { useEffect, useState } from "react";
import api from "../api";

export default function Users() {
  const [rows,setRows]=useState([]);
  const [form,setForm]=useState({name:"",email:"",password:"Password@123",role:"HOSPITAL",hospitalName:""});
  const load=()=>api.get("/users").then(r=>setRows(r.data));
  useEffect(load,[]);
  const submit=async e=>{e.preventDefault();await api.post("/users",form);setForm({...form,name:"",email:""});load();};
  const toggle=async id=>{await api.patch(`/users/${id}/toggle`);load();};
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h2>User management</h2><p>Provision and deactivate role-based system accounts.</p></div></div>
    <form className="panel form-grid" onSubmit={submit}><h3>Create user</h3><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Email<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Password<input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{["ADMIN","HOSPITAL","COORDINATOR","TRANSPORT","OPO","AUDITOR"].map(x=><option key={x}>{x}</option>)}</select></label><label className="full">Hospital name<input value={form.hospitalName} onChange={e=>setForm({...form,hospitalName:e.target.value})}/></label><button className="primary-button full">Create account</button></form>
    <div className="panel"><div className="panel-title"><h3>Accounts</h3></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Hospital</th><th>State</th><th></th></tr></thead><tbody>{rows.map(u=><tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.hospitalName||"—"}</td><td>{u.active?"Active":"Inactive"}</td><td><button className="secondary-button" onClick={()=>toggle(u._id)}>{u.active?"Deactivate":"Activate"}</button></td></tr>)}</tbody></table></div></div>
  </div>;
}
