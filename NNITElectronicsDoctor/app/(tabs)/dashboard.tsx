import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import axios from "axios";
import { API_URL } from "../../constants/api";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const [user, setUser] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const u = await SecureStore.getItemAsync("nnit_user");
      setUser(u || "");
      const [d, r] = await Promise.all([
        axios.get(`${API_URL}/ai/ai-diagnosis`),
        axios.get(`${API_URL}/ai/reports/dashboard`)
      ]);
      setDiag(d.data); setStats(r.data);
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function logout() {
    await SecureStore.deleteItemAsync("nnit_token");
    await SecureStore.deleteItemAsync("nnit_user");
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6"/>}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>🔬 NNIT Doctor</Text>
          <Text style={s.headerSub}>👤 {user} · Backend Online</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <View style={s.grid}>
        {[
          { label:"Customers", value:stats?.customers??0, color:"#60a5fa" },
          { label:"Tickets", value:stats?.tickets??0, color:"#fbbf24" },
          { label:"Invoices", value:stats?.invoices??0, color:"#c084fc" },
          { label:"Revenue", value:"€"+(stats?.revenue??0), color:"#4ade80" },
        ].map(c=>(
          <View key={c.label} style={s.card}>
            <Text style={s.cardLabel}>{c.label}</Text>
            <Text style={[s.cardValue,{color:c.color}]}>{c.value}</Text>
          </View>
        ))}
      </View>
      {diag&&(
        <View style={s.section}>
          <Text style={s.sectionTitle}>AI Diagnosis</Text>
          <View style={s.diagRow}>
            <Text style={s.diagLabel}>CPU</Text>
            <View style={s.barBg}><View style={[s.barFill,{width:(diag.analysis?.cpu_usage??0)+"%",backgroundColor:diag.analysis?.cpu_usage>80?"#ef4444":"#3b82f6"}]}/></View>
            <Text style={s.diagPct}>{diag.analysis?.cpu_usage??0}%</Text>
          </View>
          <View style={s.diagRow}>
            <Text style={s.diagLabel}>RAM</Text>
            <View style={s.barBg}><View style={[s.barFill,{width:(diag.analysis?.ram_usage??0)+"%",backgroundColor:diag.analysis?.ram_usage>80?"#ef4444":"#8b5cf6"}]}/></View>
            <Text style={s.diagPct}>{diag.analysis?.ram_usage??0}%</Text>
          </View>
          {stats?.low_stock_alerts>0&&<Text style={s.alert}>⚠ {stats.low_stock_alerts} low stock item(s)</Text>}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#0b0f1a"},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:20,paddingTop:56,backgroundColor:"#111827",borderBottomWidth:1,borderBottomColor:"#1e2d40"},
  headerTitle:{fontSize:18,fontWeight:"700",color:"#f1f5f9"},
  headerSub:{fontSize:12,color:"#475569",marginTop:2},
  logoutBtn:{backgroundColor:"#450a0a",borderRadius:6,padding:8},
  logoutText:{color:"#f87171",fontSize:12,fontWeight:"600"},
  grid:{flexDirection:"row",flexWrap:"wrap",padding:12,gap:12},
  card:{backgroundColor:"#111827",borderRadius:10,padding:16,width:"47%",borderWidth:1,borderColor:"#1e2d40"},
  cardLabel:{fontSize:11,color:"#64748b",marginBottom:6},
  cardValue:{fontSize:24,fontWeight:"700"},
  section:{margin:16,backgroundColor:"#111827",borderRadius:10,padding:16,borderWidth:1,borderColor:"#1e2d40"},
  sectionTitle:{fontSize:13,fontWeight:"600",color:"#f1f5f9",marginBottom:12},
  diagRow:{flexDirection:"row",alignItems:"center",marginBottom:10,gap:8},
  diagLabel:{fontSize:11,color:"#64748b",width:40},
  barBg:{flex:1,backgroundColor:"#1e2d40",borderRadius:4,height:8,overflow:"hidden"},
  barFill:{height:"100%",borderRadius:4},
  diagPct:{fontSize:11,color:"#94a3b8",width:36,textAlign:"right"},
  alert:{backgroundColor:"#422006",color:"#fbbf24",borderRadius:6,padding:10,fontSize:12,marginTop:8},
});
