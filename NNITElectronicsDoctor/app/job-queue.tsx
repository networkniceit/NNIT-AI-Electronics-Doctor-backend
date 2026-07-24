import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";

const STATUS_COLORS: any = { Queued: "#60a5fa", "In Progress": "#fbbf24", Done: "#4ade80" };
const STATUS_BG: any = { Queued: "#1e3a5f", "In Progress": "#422006", Done: "#14532d" };

export default function JobQueue() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [device, setDevice] = useState("");
  const [fault, setFault] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");

  async function load() {
    setRefreshing(true);
    try {
      const r = await axios.get(`${API_URL}/ai/jobs/queue`);
      setJobs(r.data || []);
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function createJob() {
    if (!customerName || !device || !fault) {
      Alert.alert("Missing info", "Customer, device, and fault are required.");
      return;
    }
    try {
      await axios.post(`${API_URL}/ai/jobs/queue`, {
        customer_name: customerName,
        device,
        fault,
        assigned_to: assignedTo,
        priority,
      });
      setModalVisible(false);
      setCustomerName(""); setDevice(""); setFault(""); setAssignedTo("");
      load();
    } catch {
      Alert.alert("Error", "Failed to create job.");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await axios.patch(`${API_URL}/ai/jobs/queue/${id}/status?status=${encodeURIComponent(status)}`);
      load();
    } catch {
      Alert.alert("Error", "Failed to update status.");
    }
  }

  async function deleteJob(id: string) {
    Alert.alert("Delete Job", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${API_URL}/ai/jobs/queue/${id}`);
          load();
        } catch {
          Alert.alert("Error", "Failed to delete job.");
        }
      }}
    ]);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>⚙ Job Queue</Text>
          <Text style={s.headerSub}>{jobs.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}>
        {jobs.length === 0 && <Text style={s.empty}>No jobs in queue</Text>}
        {jobs.map((j) => (
          <View key={j.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle} numberOfLines={1}>{j.device}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_BG[j.status] ?? "#1e293b" }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[j.status] ?? "#94a3b8" }]}>{j.status}</Text>
              </View>
            </View>
            <Text style={s.meta}>👤 {j.customer_name} · 🔧 {j.fault}</Text>
            <Text style={s.meta}>Priority: {j.priority} {j.assigned_to ? `· Assigned: ${j.assigned_to}` : ""}</Text>
            <View style={s.actions}>
              {j.status === "Queued" && (
                <TouchableOpacity style={[s.btn, { backgroundColor: "#422006" }]} onPress={() => updateStatus(j.id, "In Progress")}>
                  <Text style={[s.btnText, { color: "#fbbf24" }]}>Start</Text>
                </TouchableOpacity>
              )}
              {j.status === "In Progress" && (
                <TouchableOpacity style={[s.btn, { backgroundColor: "#14532d" }]} onPress={() => updateStatus(j.id, "Done")}>
                  <Text style={[s.btnText, { color: "#4ade80" }]}>Done</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.btn, { backgroundColor: "#450a0a" }]} onPress={() => deleteJob(j.id)}>
                <Text style={[s.btnText, { color: "#f87171" }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Job</Text>
            <TextInput style={s.input} placeholder="Customer name" placeholderTextColor="#475569" value={customerName} onChangeText={setCustomerName} />
            <TextInput style={s.input} placeholder="Device" placeholderTextColor="#475569" value={device} onChangeText={setDevice} />
            <TextInput style={s.input} placeholder="Fault description" placeholderTextColor="#475569" value={fault} onChangeText={setFault} />
            <TextInput style={s.input} placeholder="Assigned to (optional)" placeholderTextColor="#475569" value={assignedTo} onChangeText={setAssignedTo} />
            <TextInput style={s.input} placeholder="Priority (Low/Medium/High)" placeholderTextColor="#475569" value={priority} onChangeText={setPriority} />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={createJob}>
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