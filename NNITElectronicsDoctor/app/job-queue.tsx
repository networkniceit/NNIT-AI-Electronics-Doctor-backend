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
  const [inventory, setInventory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});

  const [customerName, setCustomerName] = useState("");
  const [device, setDevice] = useState("");
  const [fault, setFault] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");

  async function load() {
    setRefreshing(true);
    try {
      const [jobsRes, invRes] = await Promise.all([
        axios.get(`${API_URL}/ai/jobs/queue`),
        axios.get(`${API_URL}/ai/inventory`),
      ]);
      setJobs(jobsRes.data || []);
      setInventory(invRes.data || []);
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

  function openCompleteModal(jobId: string) {
    setActiveJobId(jobId);
    setSelectedParts({});
    setCompleteModalVisible(true);
  }

  function togglePart(itemId: string) {
    setSelectedParts((prev) => {
      const next = { ...prev };
      if (next[itemId] != null) {
        delete next[itemId];
      } else {
        next[itemId] = 1;
      }
      return next;
    });
  }

  function changeQty(itemId: string, delta: number) {
    setSelectedParts((prev) => {
      const current = prev[itemId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  }

  async function confirmComplete() {
    if (!activeJobId) return;
    try {
      await axios.post(`${API_URL}/ai/jobs/queue/${activeJobId}/complete`, {
        part_ids_and_quantities: selectedParts,
      });
      setCompleteModalVisible(false);
      setActiveJobId(null);
      load();
    } catch {
      Alert.alert("Error", "Failed to complete job.");
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
                <TouchableOpacity style={[s.btn, { backgroundColor: "#14532d" }]} onPress={() => openCompleteModal(j.id)}>
                  <Text style={[s.btnText, { color: "#4ade80" }]}>Complete</Text>
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

      <Modal visible={completeModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Complete Job</Text>
            <Text style={s.modalSubtitle}>Select parts used (optional) — quantities will be deducted from inventory.</Text>
            <ScrollView style={s.partsList}>
              {inventory.length === 0 && <Text style={s.empty}>No inventory items available</Text>}
              {inventory.map((item) => {
                const selected = selectedParts[item.id] != null;
                return (
                  <View key={item.id} style={s.partRow}>
                    <TouchableOpacity style={s.partCheckRow} onPress={() => togglePart(item.id)}>
                      <View style={[s.checkbox, selected && s.checkboxChecked]} />
                      <Text style={s.partName} numberOfLines={1}>{item.part_name} (Qty: {item.quantity})</Text>
                    </TouchableOpacity>
                    {selected && (
                      <View style={s.qtyControls}>
                        <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(item.id, -1)}>
                          <Text