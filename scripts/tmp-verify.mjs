import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")).trim(), l.slice(l.indexOf("=")+1).trim()]));
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const svc  = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth:{persistSession:false} });

// 1. Can anon INSERT a placement?
const ins = await anon.from("editorial_placements").insert({slot_key:"founders-picks",subject_kind:"vehicle",subject_id:"HACK",position:0,published:true}).select();
console.log("anon INSERT:", ins.error ? `BLOCKED (${ins.error.code})` : `returned ${ins.data?.length ?? 0} rows`);
const check1 = await svc.from("editorial_placements").select("subject_id").eq("subject_id","HACK");
console.log("  persisted?", check1.data?.length ? "YES — RLS HOLE" : "no — blocked");

// 2. Did the earlier anon UPDATE actually change anything?
const st = await svc.from("editorial_slots").select("key,published").eq("key","founders-picks").single();
console.log("founders-picks published flag after anon update attempt:", st.data?.published, st.data?.published===false ? "(unchanged — correct)" : "(CHANGED — RLS HOLE)");

// 3. Service role can write (the console's path)
const w = await svc.from("editorial_slots").update({published:false}).eq("key","founders-picks").select("key");
console.log("service-role write:", w.error ? `FAILED ${w.error.message}` : `ok (${w.data.length} row)`);
