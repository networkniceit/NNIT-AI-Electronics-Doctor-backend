import { useState } from "react";
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
        await axios.post(`${API_URL}/ai/auth/register`, { username, password, full_name: fullName, role: "Admin" });
        Alert.alert("Success", "Account created! Please log in.");
        setMode("login");
      } else {
        const res = await axios.post(`${API_URL}/ai/auth/login`, { username, password });
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
