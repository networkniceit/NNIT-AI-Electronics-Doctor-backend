import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert } from "react-native";
import axios from "axios";
import { API_URL } from "../../constants/api";

const STATUS_COLORS: any = { Open:"#60a5fa", "In Progress":"#fbbf24", Completed:"#4ade80", Cancelled:"#f87171" };
const STATUS_BG: any = { Open:"#1e3a5f", "In Progress":"#422006", Completed:"#14532d", Cancelled:"#450a0a" };

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  async function load() {
    setRefreshing(true);
    try { const r = await axios.get(`${API_URL}/ai/tickets`); setTickets(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function updateStatus(id: string, status: string) {
    try {
      await axios.patch(`${API_URL}/ai/tickets/${id}/status?status=${encodeURIComponent(status)}`);
      load();
    } catch { Alert.alert("Error","Failed to update status"); }
  }

  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t =>
    (filter === "All" || t.status === filter) &&
    (t.customer_name?.toLowerCase().includes(search.toLowerCase()) || t.fault?.toLowerCase().includes(search.toLowerCase()) || !search)
  );

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.headerTitle}>🎫 Tickets</Text><Text style={s.headerSub}>{tickets.length} total</Text></View>
      <View style={s.searchRow}>
        <TextInput style={s.search} placeholder="Search tickets..." placeholderTextColor="#475569" value={search} onChangeText={setSearch}/>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        {["All","Open","In Progress","Completed","Cancelled"].map(f=>(
          <TouchableOpacity key={f} style={[s.filterBtn,filter===f&&s.filterActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.filterText,filter===f&&s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6"/>}>
        {filtered.length===0&&<Text style={s.empty}>No tickets found</Text>}
        {filtered.map(t=>(
          <View key={t.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardId}>#{String(t.id).slice(-6)}</Text>
              <Text style={s.cardTitle} numberOfLines={1}>{t.fault||t.fault_description}</Text>
              <View style={[s.badge,{backgroundColor:STATUS_BG[t.status]}]}>
                <Text style={[s.badgeText,{color:STATUS_COLORS[t.status]}]}>{t.status}</Text>
              </View>
            </View>
            <Text style={s.meta}>👤 {t.customer_name||t.customer} · 📱 {t.device_brand} {t.device_model}</Text>
            <View style={s.actions}>
              {t.status==="Open"&&<TouchableOpacity style={[s.btn,{backgroundColor:"#422006"}]} onPress={()=>updateStatus(t.id,"In Progress")}><Text style={[s.btnText,{color:"#fbbf24"}]}>Start</Text></TouchableOpacity>}
              {t.status==="In Progress"&&<TouchableOpacity style={[s.btn,{backgroundColor:"#14532d"}]} onPress={()=>updateStatus(t.id,"Completed")}><Text style={[s.btnText,{color:"#4ade80"}]}>Complete</Text></TouchableOpacity>}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#0b0f1a"},
  header:{padding:20,paddingTop:56,backgroundColor:"#111827",borderBottomWidth:1,borderBottomColor:"#1e2d40",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  headerTitle:{fontSize:18,fontWeight:"700",color:"#f1f5f9"},
  headerSub:{fontSize:12,color:"#475569"},
  searchRow:{padding:12,backgroundColor:"#111827"},
  search:{backgroundColor:"#0d1525",borderRadius:8,padding:10,color:"#e2e8f0",fontSize:13,borderWidth:1,borderColor:"#1a2740"},
  filterRow:{paddingHorizontal:12,paddingBottom:8,backgroundColor:"#111827"},
  filterBtn:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:"#1e293b",marginRight:8,borderWidth:1,borderColor:"#334155"},
  filterActive:{backgroundColor:"#1e3a5f",borderColor:"#3b82f6"},
  filterText:{fontSize:11,fontWeight:"600",color:"#64748b"},
  filterTextActive:{color:"#60a5fa"},
  card:{margin:12,marginBottom:0,backgroundColor:"#111827",borderRadius:10,padding:14,borderWidth:1,borderColor:"#1e2d40"},
  cardHead:{flexDirection:"row",alignItems:"center",marginBottom:6,gap:6},
  cardId:{fontSize:10,color:"#475569"},
  cardTitle:{flex:1,fontSize:13,fontWeight:"600",color:"#f1f5f9"},
  badge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  badgeText:{fontSize:10,fontWeight:"600"},
  meta:{fontSize:11,color:"#475569",marginBottom:8},
  actions:{flexDirection:"row",gap:8},
  btn:{paddingHorizontal:14,paddingVertical:6,borderRadius:6},
  btnText:{fontSize:12,fontWeight:"600"},
  empty:{textAlign:"center",color:"#475569",padding:32},
});
