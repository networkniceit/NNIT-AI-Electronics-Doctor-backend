import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";

export default function Reports() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const r = await axios.get(`${API_URL}/ai/reports/dashboard`);
      setData(r.data);
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const cards = [
    { label: "Revenue", value: `€${data?.revenue ?? 0}`, color: "#4ade80" },
    { label: "Customers", value: data?.customers ?? 0, color: "#60a5fa" },
    { label: "Tickets", value: data?.tickets ?? 0, color: "#fbbf24" },
    { label: "Invoices", value: data?.invoices ?? 0, color: "#c084fc" },
  ];

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📊 Reports</Text>
      </View>

      <View style={s.grid}>
        {cards.map((c) => (
          <View key={c.label} style={s.card}>
            <Text style={s.cardLabel}>{c.label}</Text>
            <Text style={[s.cardValue, { color: c.color }]}>{c.value}</Text>
          </View>
        ))}
      </View>

      {data?.low_stock_alerts > 0 && (
        <View style={s.section}>
          <Text style={s.alert}>⚠ {data.low_stock_alerts} low stock item(s)</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 56, backgroundColor: "#111827", borderBottomWidth: 1, borderBottomColor: "#1e2d40", gap: 12 },
  backBtn: { paddingRight: 4 },
  backText: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 16, width: "47%", borderWidth: 1, borderColor: "#1e2d40" },
  cardLabel: { fontSize: 11, color: "#64748b", marginBottom: 6 },
  cardValue: { fontSize: 24, fontWeight: "700" },
  section: { margin: 16, backgroundColor: "#111827", borderRadius: 10, padding: 16, borderWidth: 1, borderColor: "#1e2d40" },
  alert: { backgroundColor: "#422006", color: "#fbbf24", borderRadius: 6, padding: 10, fontSize: 12 },
});