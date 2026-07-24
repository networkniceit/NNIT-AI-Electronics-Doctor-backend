import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";

const STATUS_COLORS: any = { Active: "#4ade80", Expired: "#f87171", Void: "#64748b" };
const STATUS_BG: any = { Active: "#14532d", Expired: "#450a0a", Void: "#1e293b" };

export default function Warranty() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [device, setDevice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [warrantyType, setWarrantyType] = useState("Repair Warranty");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function load() {
    setRefreshing(true);
    try {
      const r = await axios.get(`${API_URL}/ai/warranty`);
      setItems(r.data || []);
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function createWarranty() {
    if (!customerName || !device) {
      Alert.alert("Missing info", "Customer name and device are required.");
      return;
    }
    try {
      await axios.post(`${API_URL}/ai/warranty`, {
        customer_name: customerName,
        device,
        serial_number: serialNumber,
        warranty_type: warrantyType,
        start_date: startDate,
        end_date: endDate,
      });
      setModalVisible(false);
      setCustomerName(""); setDevice(""); setSerialNumber(""); setStartDate(""); setEndDate("");
      load();
    } catch {
      Alert.alert("Error", "Failed to create warranty.");
    }
  }

  async function deleteWarranty(id: string) {
    Alert.alert("Delete Warranty", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${API_URL}/ai/warranty/${id}`);
          load();
        } catch {
          Alert.alert("Error", "Failed to delete warranty.");
        }
      }}
    ]);
  }

  const filtered = items.filter(w =>
    !search ||
    w.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    w.device?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🛡 Warranty</Text>
          <Text style={s.headerSub}>{items.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <TextInput
          style={s.search}
          placeholder="Search warranties..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}>
        {filtered.length === 0 && <Text style={s.empty}>No warranties yet</Text>}
        {filtered.map((w) => (
          <View key={w.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle} numberOfLines={1}>{w.device}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_BG[w.status] ?? "#1e293b" }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[w.status] ?? "#94a3b8" }]}>{w.status}</Text>
              </View>
            </View>
            <Text style={s.meta}>👤 {w.customer_name} · 🔧 {w.warranty_type}</Text>
            {w.serial_number ? <Text style={s.meta}>SN: {w.serial_number}</Text> : null}
            <Text style={s.meta}>{w.start_date} → {w.end_date}</Text>
            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, { backgroundColor: "#450a0a" }]} onPress={() => deleteWarranty(w.id)}>
                <Text style={[s.btnText, { color: "#f87171" }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Warranty</Text>
            <TextInput style={s.input} placeholder="Customer name" placeholderTextColor="#475569" value={customerName} onChangeText={setCustomerName} />
            <TextInput style={s.input} placeholder="Device" placeholderTextColor="#475569" value={device} onChangeText={setDevice} />
            <TextInput style={s.input} placeholder="Serial number (optional)" placeholderTextColor="#475569" value={serialNumber} onChangeText={setSerialNumber} />
            <TextInput style={s.input} placeholder="Warranty type" placeholderTextColor="#475569" value={warrantyType} onChangeText={setWarrantyType} />
            <TextInput style={s.input} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#475569" value={startDate} onChangeText={setStartDate} />
            <TextInput style={s.input} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#475569" value={endDate} onChangeText={setEndDate} />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={createWarranty}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a" },
  header: { padding: 20, paddingTop: 56, backgroundColor: "#111827", borderBottomWidth: 1, borderBottomColor: "#1e2d40", flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingRight: 4 },
  backText: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "#475569" },
  addBtn: { backgroundColor: "#1e3a5f", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: "#60a5fa", fontWeight: "700", fontSize: 13 },
  searchRow: { padding: 12, backgroundColor: "#111827" },
  search: { backgroundColor: "#0d1525", borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 13, borderWidth: 1, borderColor: "#1a2740" },
  card: { margin: 12, marginBottom: 0, backgroundColor: "#111827", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#1e2d40" },
  cardHead: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#f1f5f9" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  meta: { fontSize: 11, color: "#475569", marginBottom: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnText: { fontSize: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: "#475569", padding: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#111827", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: "#1e2d40" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", marginBottom: 14 },
  input: { backgroundColor: "#0d1525", borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 13, borderWidth: 1, borderColor: "#1a2740", marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  modalCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  modalCancelText: { color: "#94a3b8", fontWeight: "600" },
  modalSaveBtn: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});