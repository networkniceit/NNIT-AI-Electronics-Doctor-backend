import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
    { icon:"📱", label:"This Device", desc:"Self-diagnostics for this phone", screen:"device-diagnostics" },
    { icon:"🛡", label:"Warranty", desc:"Manage device warranties", screen:"warranty" },
    { icon:"⚙", label:"Job Queue", desc:"Technician job assignments", screen:"job_queue" },
    { icon:"📦", label:"Inventory", desc:"Parts and stock management", screen:"inventory" },
    { icon:"📊", label:"Reports", desc:"Revenue and analytics", screen:"reports" },
    { icon:"📱", label:"Device History", desc:"Customer device timeline", screen:"device_history" },
    { icon:"📅", label:"Calendar", desc:"Appointments and bookings", screen:"calendar" },
  ];
  function handlePress(screen: string) {
    if (screen === "device-diagnostics") {
      router.push("/device-diagnostics");
    } else {
      Alert.alert("Coming Soon","Coming in next update!");
    }
  }
  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.headerTitle}>⚙ More</Text></View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>MODULES</Text>
        {items.map(item=>(
          <TouchableOpacity key={item.label} style={s.row} onPress={()=>handlePress(item.screen)}>
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