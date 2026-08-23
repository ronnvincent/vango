import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
const Ctx = createContext(null);
export const homeFor = r => ({ customer:"/app", driver:"/driver", admin:"/admin" })[r] || "/";

export function AuthProvider({ children }){
  const [session,setSession]=useState(null), [profile,setProfile]=useState(null), [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>sub.subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(!session){ setProfile(null); setLoading(false); return; }
    setLoading(true);
    supabase.from("profiles").select("*").eq("id",session.user.id).single()
      .then(({data})=>{ setProfile(data); setLoading(false); });
  },[session?.user?.id]);
  const signUp  = ({email,password,fullName,phone}) =>
    supabase.auth.signUp({email,password,options:{data:{full_name:fullName,phone}}});
  const signIn  = ({email,password}) => supabase.auth.signInWithPassword({email,password});
  const signOut = () => supabase.auth.signOut();
  return <Ctx.Provider value={{session,profile,loading,signUp,signIn,signOut}}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);