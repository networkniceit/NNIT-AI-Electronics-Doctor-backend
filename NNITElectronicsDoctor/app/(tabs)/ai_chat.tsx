import { useState, useRef } from "react";
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
      const res = await axios.post(`${API_URL}/ai/chat`, { message:input, device, fault:"", history:messages.slice(-10) });
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
