import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Linking, Alert } from "react-native";
import axios from "axios";
import { API_URL } from "../../constants/api";

const STATUS_COLOR: any = { Draft:"#64748b", Sent:"#60a5fa", Paid:"#4ade80", Overdue:"#f87171" };
const STATUS_BG: any = { Draft:"#1e293b", Sent:"#1e3a5f", Paid:"#14532d", Overdue:"#450a0a" };

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");

  async function load() {
    setRefreshing(true);
    try { const r = await axios.get(`${API_URL}/ai/invoices`); setInvoices(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function payWithStripe(inv: any) {
    const amount = inv.total || 0;
    if (amount <= 0) { Alert.alert("Error","Invoice total must be greater than 0"); return; }
    try {
      const res = await axios.post(`${API_URL}/ai/payments/create-checkout`, {
        amount, currency:"eur",
        customer_name: inv.customer_name,
        customer_email: inv.customer_email || "",
        invoice_id: String(inv.id),
        description: inv.fault || "Electronics repair"
      });
      if (res.data.checkout_url) Linking.openURL(res.data.checkout_url);
    } catch { Alert.alert("Error","Stripe checkout failed"); }
  }

  async function markPaid(id: any) {
    try { await axios.patch(`${API_URL}/ai/invoices/${id}/status?status=Paid`); load(); } catch {}
  }

  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(i => filter==="All" || i.status===filter);
  const totalRevenue = invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+(i.total||0),0);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🧾 Invoices</Text>
        <Text style={s.revenue}>€{totalRevenue.toFixed(2)} paid</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        {["All","Draft","Sent","Paid","Overdue"].map(f=>(
          <TouchableOpacity key={f} style={[s.filterBtn,filter===f&&s.filterActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.filterText,filter===f&&s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6"/>}>
        {filtered.length===0&&<Text style={s.empty}>No invoices</Text>}
        {filtered.map(inv=>(
          <View key={inv.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.invId}>INV-{String(inv.id).padStart(6,"0")}</Text>
              <View style={[s.badge,{backgroundColor:STATUS_BG[inv.status]}]}>
                <Text style={[s.badgeText,{color:STATUS_COLOR[inv.status]}]}>{inv.status}</Text>
              </View>
            </View>
            <Text style={s.customer}>{inv.customer_name}</Text>
            <Text style={s.device}>{inv.device}</Text>
            <Text style={s.total}>€{(inv.total||0).toFixed(2)}</Text>
            <View style={s.actions}>
              {inv.status!=="Paid"&&<TouchableOpacity style={[s.btn,{backgroundColor:"#6366f1"}]} onPress={()=>payWithStripe(inv)}>
                <Text style={s.btnText}>💳 Pay</Text>
              </TouchableOpacity>}
              {inv.status!=="Paid"&&<TouchableOpacity style={[s.btn,{backgroundColor:"#14532d"}]} onPress={()=>markPaid(inv.id)}>
                <Text style={[s.btnText,{color:"#4ade80"}]}>Mark Paid</Text>
              </TouchableOpacity>}
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
  revenue:{fontSize:13,color:"#4ade80",fontWeight:"600"},
  filterRow:{paddingHorizontal:12,paddingVertical:8,backgroundColor:"#111827"},
  filterBtn:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:"#1e293b",marginRight:8,borderWidth:1,borderColor:"#334155"},
  filterActive:{backgroundColor:"#1e3a5f",borderColor:"#3b82f6"},
  filterText:{fontSize:11,fontWeight:"600",color:"#64748b"},
  filterTextActive:{color:"#60a5fa"},
  card:{margin:12,marginBottom:0,backgroundColor:"#111827",borderRadius:10,padding:14,borderWidth:1,borderColor:"#1e2d40"},
  cardHead:{flexDirection:"row",justifyContent:"space-between",marginBottom:6},
  invId:{fontSize:12,fontWeight:"700",color:"#f1f5f9"},
  badge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  badgeText:{fontSize:10,fontWeight:"600"},
  customer:{fontSize:14,fontWeight:"600",color:"#f1f5f9",marginBottom:2},
  device:{fontSize:12,color:"#64748b",marginBottom:4},
  total:{fontSize:20,fontWeight:"700",color:"#4ade80",marginBottom:8},
  actions:{flexDirection:"row",gap:8},
  btn:{paddingHorizontal:14,paddingVertical:8,borderRadius:6},
  btnText:{color:"#fff",fontWeight:"600",fontSize:12},
  empty:{textAlign:"center",color:"#475569",padding:32},
});
