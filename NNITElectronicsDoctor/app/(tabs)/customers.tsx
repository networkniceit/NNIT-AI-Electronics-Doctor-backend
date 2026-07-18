import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert } from "react-native";
import axios from "axios";
import { API_URL } from "../../constants/api";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", email:"", device:"", notes:"" });

  async function load() {
    setRefreshing(true);
    try { const r = await axios.get(`${API_URL}/ai/customers`); setCustomers(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function addCustomer() {
    if (!form.name) { Alert.alert("Error","Name required"); return; }
    try {
      await axios.post(`${API_URL}/ai/customers`, form);
      setForm({ name:"", phone:"", email:"", device:"", notes:"" });
      setShowForm(false); load();
    } catch { Alert.alert("Error","Failed to add customer"); }
  }

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>👥 Customers</Text>
        <TouchableOpacity style={s.addBtn} onPress={()=>setShowForm(!showForm)}>
          <Text style={s.addBtnText}>{showForm?"Cancel":"+ Add"}</Text>
        </TouchableOpacity>
      </View>
      {showForm&&(
        <View style={s.form}>
          {[["Name *","name"],["Phone","phone"],["Email","email"],["Device","device"],["Notes","notes"]].map(([label,key])=>(
            <TextInput key={key} style={s.input} placeholder={label} placeholderTextColor="#475569" value={(form as any)[key]} onChangeText={v=>setForm({...form,[key]:v})}/>
          ))}
          <TouchableOpacity style={s.submitBtn} onPress={addCustomer}>
            <Text style={s.submitBtnText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.searchRow}>
        <TextInput style={s.search} placeholder="Search customers..." placeholderTextColor="#475569" value={search} onChangeText={setSearch}/>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6"/>}>
        {filtered.length===0&&<Text style={s.empty}>No customers yet</Text>}
        {filtered.map(c=>(
          <View key={c.id} style={s.card}>
            <Text style={s.name}>{c.name}</Text>
            <Text style={s.meta}>{c.email||"No email"} · {c.phone||"No phone"}</Text>
            {c.device&&<Text style={s.device}>📱 {c.device}</Text>}
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
  addBtn:{backgroundColor:"#1e3a5f",borderRadius:6,paddingHorizontal:14,paddingVertical:8},
  addBtnText:{color:"#60a5fa",fontWeight:"600",fontSize:13},
  form:{backgroundColor:"#111827",padding:16,borderBottomWidth:1,borderBottomColor:"#1e2d40"},
  input:{backgroundColor:"#0d1525",borderRadius:8,padding:10,color:"#e2e8f0",fontSize:13,borderWidth:1,borderColor:"#1a2740",marginBottom:8},
  submitBtn:{backgroundColor:"#3b82f6",borderRadius:8,padding:12,alignItems:"center"},
  submitBtnText:{color:"#fff",fontWeight:"700"},
  searchRow:{padding:12,backgroundColor:"#111827"},
  search:{backgroundColor:"#0d1525",borderRadius:8,padding:10,color:"#e2e8f0",fontSize:13,borderWidth:1,borderColor:"#1a2740"},
  card:{margin:12,marginBottom:0,backgroundColor:"#111827",borderRadius:10,padding:14,borderWidth:1,borderColor:"#1e2d40"},
  name:{fontSize:15,fontWeight:"700",color:"#f1f5f9",marginBottom:4},
  meta:{fontSize:12,color:"#475569",marginBottom:4},
  device:{fontSize:12,color:"#60a5fa"},
  empty:{textAlign:"center",color:"#475569",padding:32},
});
