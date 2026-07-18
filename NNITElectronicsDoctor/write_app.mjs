import { writeFileSync, mkdirSync } from "fs";

const API = "https://nnit-ai-electronics-doctor-backend-production.up.railway.app";

// Create folders
mkdirSync("./app", { recursive: true });
mkdirSync("./app/(auth)", { recursive: true });
mkdirSync("./app/(tabs)", { recursive: true });
mkdirSync("./components", { recursive: true });
mkdirSync("./constants", { recursive: true });

// constants/api.ts
writeFileSync("./constants/api.ts", `export const API_URL = "${API}";
export const APP_NAME = "NNIT AI Electronics Doctor";
export const COMPANY = "Network Nice IT (NNIT)";
`, "utf8");

// app/_layout.tsx
writeFileSync("./app/_layout.tsx", `import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0b0f1a" } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
`, "utf8");

// app/index.tsx - redirect to auth or tabs
writeFileSync("./app/index.tsx", `import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    SecureStore.getItemAsync("nnit_token").then(token => {
      if (token) router.replace("/(tabs)/dashboard");
      else router.replace("/(auth)/login");
    });
  }, []);
  return <View style={{ flex:1, backgroundColor:"#0b0f1a", justifyContent:"center", alignItems:"center" }}><ActivityIndicator color="#3b82f6" size="large"/></View>;
}
`, "utf8");

// app/(auth)/_layout.tsx
writeFileSync("./app/(auth)/_layout.tsx", `import { Stack } from "expo-router";
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }}/>;
}
`, "utf8");

// app/(auth)/login.tsx
writeFileSync("./app/(auth)/login.tsx", `import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL, APP_NAME, COMPANY } from "../../constants/api";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username || !password) { Alert.alert("Error", "Username and password required"); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        await axios.post(\`\${API_URL}/ai/auth/register\`, { username, password, full_name: fullName, role: "Admin" });
        Alert.alert("Success", "Account created! Please log in.");
        setMode("login");
      } else {
        const res = await axios.post(\`\${API_URL}/ai/auth/login\`, { username, password });
        const token = res.data?.access_token || "";
        await SecureStore.setItemAsync("nnit_token", token);
        await SecureStore.setItemAsync("nnit_user", username);
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.logo}><Text style={s.logoText}>🔬</Text></View>
        <Text style={s.title}>{APP_NAME}</Text>
        <Text style={s.subtitle}>{COMPANY}</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
          {mode === "register" && (
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="#475569" value={fullName} onChangeText={setFullName}/>
          )}
          <TextInput style={s.input} placeholder="Username" placeholderTextColor="#475569" value={username} onChangeText={setUsername} autoCapitalize="none"/>
          <TextInput style={s.input} placeholder="Password" placeholderTextColor="#475569" value={password} onChangeText={setPassword} secureTextEntry/>
          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
            <Text style={s.btnText}>{loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setMode(mode==="login"?"register":"login")}>
            <Text style={s.link}>{mode==="login"?"No account? Register":"Have account? Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:"#0b0f1a" },
  scroll: { flexGrow:1, justifyContent:"center", padding:24 },
  logo: { width:72, height:72, backgroundColor:"#3b82f6", borderRadius:18, justifyContent:"center", alignItems:"center", alignSelf:"center", marginBottom:16 },
  logoText: { fontSize:36 },
  title: { fontSize:22, fontWeight:"700", color:"#f1f5f9", textAlign:"center", marginBottom:4 },
  subtitle: { fontSize:13, color:"#475569", textAlign:"center", marginBottom:32 },
  card: { backgroundColor:"#111827", borderRadius:14, padding:24, borderWidth:1, borderColor:"#1e2d40" },
  cardTitle: { fontSize:16, fontWeight:"700", color:"#f1f5f9", marginBottom:16 },
  input: { backgroundColor:"#0d1525", borderWidth:1, borderColor:"#1a2740", borderRadius:8, padding:12, color:"#e2e8f0", marginBottom:12, fontSize:14 },
  btn: { backgroundColor:"#3b82f6", borderRadius:8, padding:14, alignItems:"center", marginTop:8 },
  btnText: { color:"#fff", fontWeight:"700", fontSize:15 },
  link: { color:"#60a5fa", textAlign:"center", marginTop:16, fontSize:13 },
});
`, "utf8");

// app/(tabs)/_layout.tsx
writeFileSync("./app/(tabs)/_layout.tsx", `import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:"#111827", borderTopColor:"#1e2d40" },
      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "#475569",
      tabBarLabelStyle: { fontSize:10 }
    }}>
      <Tabs.Screen name="dashboard" options={{ title:"Dashboard", tabBarIcon:({color,size})=><Ionicons name="speedometer-outline" size={size} color={color}/> }}/>
      <Tabs.Screen name="tickets" options={{ title:"Tickets", tabBarIcon:({color,size})=><Ionicons name="ticket-outline" size={size} color={color}/> }}/>
      <Tabs.Screen name="customers" options={{ title:"Customers", tabBarIcon:({color,size})=><Ionicons name="people-outline" size={size} color={color}/> }}/>
      <Tabs.Screen name="invoices" options={{ title:"Invoices", tabBarIcon:({color,size})=><Ionicons name="receipt-outline" size={size} color={color}/> }}/>
      <Tabs.Screen name="ai_chat" options={{ title:"AI Chat", tabBarIcon:({color,size})=><Ionicons name="chatbubble-ellipses-outline" size={size} color={color}/> }}/>
      <Tabs.Screen name="more" options={{ title:"More", tabBarIcon:({color,size})=><Ionicons name="menu-outline" size={size} color={color}/> }}/>
    </Tabs>
  );
}
`, "utf8");

// app/(tabs)/dashboard.tsx
writeFileSync("./app/(tabs)/dashboard.tsx", `import { useEffect, useState } from "react";
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
        axios.get(\`\${API_URL}/ai/ai-diagnosis\`),
        axios.get(\`\${API_URL}/ai/reports/dashboard\`)
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
`, "utf8");

// app/(tabs)/tickets.tsx
writeFileSync("./app/(tabs)/tickets.tsx", `import { useEffect, useState } from "react";
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
    try { const r = await axios.get(\`\${API_URL}/ai/tickets\`); setTickets(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function updateStatus(id: string, status: string) {
    try {
      await axios.patch(\`\${API_URL}/ai/tickets/\${id}/status?status=\${encodeURIComponent(status)}\`);
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
`, "utf8");

// app/(tabs)/customers.tsx
writeFileSync("./app/(tabs)/customers.tsx", `import { useEffect, useState } from "react";
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
    try { const r = await axios.get(\`\${API_URL}/ai/customers\`); setCustomers(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function addCustomer() {
    if (!form.name) { Alert.alert("Error","Name required"); return; }
    try {
      await axios.post(\`\${API_URL}/ai/customers\`, form);
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
`, "utf8");

// app/(tabs)/invoices.tsx
writeFileSync("./app/(tabs)/invoices.tsx", `import { useEffect, useState } from "react";
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
    try { const r = await axios.get(\`\${API_URL}/ai/invoices\`); setInvoices(r.data||[]); } catch {}
    setRefreshing(false);
  }

  async function payWithStripe(inv: any) {
    const amount = inv.total || 0;
    if (amount <= 0) { Alert.alert("Error","Invoice total must be greater than 0"); return; }
    try {
      const res = await axios.post(\`\${API_URL}/ai/payments/create-checkout\`, {
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
    try { await axios.patch(\`\${API_URL}/ai/invoices/\${id}/status?status=Paid\`); load(); } catch {}
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
`, "utf8");

// app/(tabs)/ai_chat.tsx
writeFileSync("./app/(tabs)/ai_chat.tsx", `import { useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import axios from "axios";
import { API_URL } from "../../constants/api";

export default function AIChat() {
  const [messages, setMessages] = useState<{role:string;content:string}[]>([]);
  const [input, setInput] = useState("");
  const [device, setDevice] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role:"user", content:input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await axios.post(\`\${API_URL}/ai/chat\`, { message:input, device, fault:"", history:messages.slice(-10) });
      setMessages([...newMsgs, { role:"assistant", content:res.data.reply }]);
    } catch {
      setMessages([...newMsgs, { role:"assistant", content:"AI service unavailable. Please try again." }]);
    }
    setLoading(false);
    setTimeout(()=>scrollRef.current?.scrollToEnd({animated:true}),100);
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS==="ios"?"padding":undefined}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🤖 AI Repair Assistant</Text>
        <Text style={s.headerSub}>Powered by Groq · llama-3.1-8b</Text>
      </View>
      <TextInput style={s.deviceInput} placeholder="Device (optional, e.g. Samsung S23)" placeholderTextColor="#475569" value={device} onChangeText={setDevice}/>
      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={{padding:12,gap:10}}>
        {messages.length===0&&<Text style={s.empty}>👋 Ask me anything about electronics repair!</Text>}
        {messages.map((m,i)=>(
          <View key={i} style={[s.bubble, m.role==="user"?s.userBubble:s.aiBubble]}>
            {m.role==="assistant"&&<Text style={s.aiLabel}>🤖 NNIT AI</Text>}
            <Text style={[s.bubbleText, m.role==="user"?s.userText:s.aiText]}>{m.content}</Text>
          </View>
        ))}
        {loading&&<View style={s.aiBubble}><ActivityIndicator color="#60a5fa" size="small"/></View>}
      </ScrollView>
      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder="Ask about repair, parts, costs..." placeholderTextColor="#475569" value={input} onChangeText={setInput} onSubmitEditing={send} multiline/>
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={loading}>
          <Text style={s.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#0b0f1a"},
  header:{padding:20,paddingTop:56,backgroundColor:"#111827",borderBottomWidth:1,borderBottomColor:"#1e2d40"},
  headerTitle:{fontSize:18,fontWeight:"700",color:"#f1f5f9"},
  headerSub:{fontSize:12,color:"#475569",marginTop:2},
  deviceInput:{backgroundColor:"#0d1525",margin:12,borderRadius:8,padding:10,color:"#e2e8f0",fontSize:13,borderWidth:1,borderColor:"#1a2740"},
  chat:{flex:1},
  empty:{textAlign:"center",color:"#475569",padding:32,fontSize:13},
  bubble:{borderRadius:12,padding:12,maxWidth:"85%"},
  userBubble:{backgroundColor:"#1e3a5f",alignSelf:"flex-end",marginBottom:8},
  aiBubble:{backgroundColor:"#1e293b",alignSelf:"flex-start",marginBottom:8},
  aiLabel:{fontSize:10,color:"#475569",marginBottom:4},
  bubbleText:{fontSize:13,lineHeight:20},
  userText:{color:"#60a5fa"},
  aiText:{color:"#e2e8f0"},
  inputRow:{flexDirection:"row",padding:12,gap:8,backgroundColor:"#111827",borderTopWidth:1,borderTopColor:"#1e2d40"},
  input:{flex:1,backgroundColor:"#0d1525",borderRadius:8,padding:10,color:"#e2e8f0",fontSize:13,borderWidth:1,borderColor:"#1a2740",maxHeight:80},
  sendBtn:{backgroundColor:"#3b82f6",borderRadius:8,padding:12,justifyContent:"center"},
  sendText:{color:"#fff",fontWeight:"700"},
});
`, "utf8");

// app/(tabs)/more.tsx
writeFileSync("./app/(tabs)/more.tsx", `import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function More() {
  const router = useRouter();

  async function logout() {
    Alert.alert("Sign Out","Are you sure?", [
      { text:"Cancel", style:"cancel" },
      { text:"Sign Out", style:"destructive", onPress: async ()=>{ await SecureStore.deleteItemAsync("nnit_token"); await SecureStore.deleteItemAsync("nnit_user"); router.replace("/(auth)/login"); }}
    ]);
  }

  const items = [
    { icon:"🛡", label:"Warranty", desc:"Manage device warranties", screen:"warranty" },
    { icon:"⚙", label:"Job Queue", desc:"Technician job assignments", screen:"job_queue" },
    { icon:"📦", label:"Inventory", desc:"Parts and stock management", screen:"inventory" },
    { icon:"📊", label:"Reports", desc:"Revenue and analytics", screen:"reports" },
    { icon:"📱", label:"Device History", desc:"Customer device timeline", screen:"device_history" },
    { icon:"📅", label:"Calendar", desc:"Appointments and bookings", screen:"calendar" },
  ];

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.headerTitle}>⚙ More</Text></View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>MODULES</Text>
        {items.map(item=>(
          <TouchableOpacity key={item.label} style={s.row} onPress={()=>Alert.alert(item.label,"Coming in next update!")}>
            <Text style={s.icon}>{item.icon}</Text>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>{item.label}</Text>
              <Text style={s.rowDesc}>{item.desc}</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>ACCOUNT</Text>
        <TouchableOpacity style={[s.row,{borderBottomWidth:0}]} onPress={logout}>
          <Text style={s.icon}>🚪</Text>
          <View style={s.rowContent}><Text style={[s.rowLabel,{color:"#f87171"}]}>Sign Out</Text></View>
        </TouchableOpacity>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>NNIT AI Electronics Doctor Pro</Text>
        <Text style={s.footerText}>Network Nice IT (NNIT) · v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#0b0f1a"},
  header:{padding:20,paddingTop:56,backgroundColor:"#111827",borderBottomWidth:1,borderBottomColor:"#1e2d40"},
  headerTitle:{fontSize:18,fontWeight:"700",color:"#f1f5f9"},
  section:{margin:16,backgroundColor:"#111827",borderRadius:10,borderWidth:1,borderColor:"#1e2d40",overflow:"hidden"},
  sectionTitle:{fontSize:10,fontWeight:"600",color:"#475569",letterSpacing:1,padding:12,paddingBottom:4},
  row:{flexDirection:"row",alignItems:"center",padding:14,borderBottomWidth:1,borderBottomColor:"#1e2d40",gap:12},
  icon:{fontSize:20,width:28},
  rowContent:{flex:1},
  rowLabel:{fontSize:14,fontWeight:"600",color:"#f1f5f9",marginBottom:2},
  rowDesc:{fontSize:12,color:"#475569"},
  arrow:{fontSize:18,color:"#475569"},
  footer:{padding:24,alignItems:"center"},
  footerText:{fontSize:11,color:"#334155",marginBottom:2},
});
`, "utf8");

console.log("All mobile app files written OK");

