import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { campaignApi } from "../../users/services/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}
export default function CreateCampaign() {
  const query = useQuery();
  const merchantId = query.get('merchantId');
  const [name, setName] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState(10);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(()=> {
    const today = new Date().toISOString().slice(0,10);
    setStart(today);
    setEnd(new Date(Date.now()+7*24*3600*1000).toISOString().slice(0,10));
  },[]);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { merchantId , name, discountType: type, discountValue: Number(value), startDate: start, endDate: end, terms };
      const res = await campaignApi.createCampaign(payload);
      setCreated(res);
    } catch (e) {
      alert("Failed: "+e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Create Campaign</h2>

      <label className="block mb-2 text-sm">Campaign name</label>
      <input className="w-full p-2 border rounded mb-3" value={name} onChange={e=>setName(e.target.value)} />

      <div className="flex gap-2 mb-3">
        <label className="flex items-center gap-2">
          <input type="radio" checked={type==="percentage"} onChange={()=>setType("percentage")} /> <span>Percentage</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={type==="flat"} onChange={()=>setType("flat")} /> <span>Flat</span>
        </label>
      </div>

      <label className="block mb-2 text-sm">Value</label>
      <input type="number" className="w-full p-2 border rounded mb-3" value={value} onChange={e=>setValue(e.target.value)} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-sm">Start</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">End</label>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>

      <label className="block mb-2 text-sm">Terms</label>
      <textarea className="w-full p-2 border rounded mb-3" value={terms} onChange={e=>setTerms(e.target.value)} />

      <button onClick={submit} className="w-full py-2 bg-black text-white rounded" disabled={loading}>
        {loading ? "Creating…" : "Create Campaign"}
      </button>

      {created && (
        <div className="mt-4 p-3 bg-green-50 border rounded">
          <div className="font-semibold">Campaign created</div>
          <div className="text-sm">ID: {created.id}</div>
        </div>
      )}
    </div>
  );
}
