import { Tabs } from "expo-router";
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
