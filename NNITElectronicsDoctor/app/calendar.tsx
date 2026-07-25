import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";

const TYPE_COLORS: any = { Appointment: "#60a5fa", "Repair Pickup": "#4ade80", "Repair Dropoff": "#fbbf24", Other: "#c084fc" };
const TYPE_BG: any = { Appointment: "#1e3a5f", "Repair Pickup": "#14532d", "Repair Dropoff": "#422006", Other: "#3b0764" };

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [device, setDevice] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("Appointment");
  const [notes, setNotes] = useState("");

  async function load() {
    setRefreshing(true);
    try {
      const r = await axios.get(`${API_URL}/ai/calendar`);
      setEvents(r.data || []);
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function createEvent() {
    if (!title || !eventDate) {
      Alert.alert("Missing info", "Title and date are required.");
      return;
    }
    try {
      await axios.post(`${API_URL}/ai/calendar`, {
        title,
        customer_name: customerName,
        device,
        event_date: eventDate,
        event_time: eventTime,
        event_type: eventType,
        notes,
      });
      setModalVisible(false);
      setTitle(""); setCustomerName(""); setDevice(""); setEventDate(""); setEventTime(""); setNotes("");
      load();
    } catch {
      Alert.alert("Error", "Failed to create event.");
    }
  }

  async function deleteEvent(id: string) {
    Alert.alert("Delete Event", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${API_URL}/ai/calendar/${id}`);
          load();
        } catch {
          Alert.alert("Error", "Failed to delete event.");
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
          <Text style={s.headerTitle}>📅 Calendar</Text>
          <Text style={s.headerSub}>{events.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}>
        {events.length === 0 && <Text style={s.empty}>No events scheduled</Text>}
        {events.map((e) => (
          <View key={e.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle} numberOfLines={1}>{e.title}</Text>
              <View style={[s.badge, { backgroundColor: TYPE_BG[e.event_type] ?? "#1e293b" }]}>
                <Text style={[s.badgeText, { color: TYPE_COLORS[e.event_type] ?? "#94a3b8" }]}>{e.event_type}</Text>
              </View>
            </View>
            <Text style={s.meta}>📆 {e.event_date} {e.event_time ? `at ${e.event_time}` : ""}</Text>
            {e.customer_name ? <Text style={s.meta}>👤 {e.customer_name}</Text> : null}
            {e.device ? <Text style={s.meta}>📱 {e.device}</Text> : null}
            {e.notes ? <Text style={s.meta}>{e.notes}</Text> : null}
            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, { backgroundColor: "#450a0a" }]} onPress={() => deleteEvent(e.id)}>
                <Text style={[s.btnText, { color: "#f87171" }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Event</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor="#475569" value={title} onChangeText={setTitle} />
            <TextInput style={s.input} placeholder="Customer name (optional)" placeholderTextColor="#475569" value={customerName} onChangeText={setCustomerName} />
            <TextInput style={s.input} placeholder="Device (optional)" placeholderTextColor="#475569" value={device} onChangeText={setDevice} />
            <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#475569" value={eventDate} onChangeText={setEventDate} />
            <TextInput style={s.input} placeholder="Time (HH:MM, optional)" placeholderTextColor="#475569" value={eventTime} onChangeText={setEventTime} />
            <TextInput style={s.input} placeholder="Type (Appointment, Repair Pickup, etc.)" placeholderTextColor="#475569" value={eventType} onChangeText={setEventType} />
            <TextInput style={s.input} placeholder="Notes (optional)" placeholderTextColor="#475569" value={notes} onChangeText={setNotes} />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={createEvent}>
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