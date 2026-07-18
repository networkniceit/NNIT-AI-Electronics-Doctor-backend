import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

export default function UsbDiagnostics() {
  const router = useRouter();
  const [ip, setIp] = useState("");
  const [savedIp, setSavedIp] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    SecureStore.getItemAsync("nnit_local_ip").then((v) => {
      if (v) {
        setIp(v);
        setSavedIp(v);
        fetchData(v);
      }
    });
  }, []);

  async function saveAndFetch() {
    await SecureStore.setItemAsync("nnit_local_ip", ip.trim());
    setSavedIp(ip.trim());
    fetchData(ip.trim());
  }

  async function fetchData(targetIp: string) {
    if (!targetIp) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`http://${targetIp}:8000/ai/android-phone`, { timeout: 6000 });
      setData(res.data);
    } catch (e: any) {
      setError("Could not reach shop PC. Check the IP and that the backend is running locally.");
      setData(null);
    }
    setLoading(false);
  }

  const rows = data
    ? [
        { label: "Connected", value: data.connected ? "Yes" : "No" },
        { label: "Brand", value: data.brand ?? "Unknown" },
        { label: "Model", value: data.model ?? "Unknown" },
        { label: "Android Version", value: data.android_version ?? "Unknown" },
        { label: "Battery", value: data.battery != null ? `${data.battery}%` : "Unknown" },
        { label: "Temperature", value: data.temperature != null ? `${data.temperature}°C` : "Unknown" },
        { label: "Voltage", value: data.voltage != null ? `${data.voltage} mV` : "Unknown" },
        { label: "Health", value: data.health ?? "Unknown" },
        { label: "Charging", value: data.charging ? "Yes" : "No" },
      ]
    : [];

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(savedIp)} tintColor="#3b82f6" />}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔌 USB Phone (Shop PC)</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>SHOP PC ADDRESS</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="e.g. 192.168.0.251"
            placeholderTextColor="#475569"
            value={ip}
            onChangeText={setIp}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={s.saveBtn} onPress={saveAndFetch}>
            <Text style={s.saveBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.hint}>
          Enter the local IP of the PC running the backend (e.g. via `ipconfig`). The backend
          must be running with `python -m uvicorn main:app --host 0.0.0.0 --port 8000` and the
          phone must be plugged into that PC via USB with debugging enabled.
        </Text>
      </View>

      {error ? (
        <View style={s.section}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {data && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>DEVICE (VIA USB)</Text>
          {rows.map((row) => (
            <View key={row.label} style={s.row}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d40",
    gap: 12,
  },
  backBtn: { paddingRight: 4 },
  backText: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9" },
  section: {
    margin: 16,
    marginTop: 16,
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e2d40",
    padding: 14,
  },
  sectionTitle: { fontSize: 10, fontWeight: "600", color: "#475569", letterSpacing: 1, marginBottom: 10 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    borderWidth: 1,
    borderColor: "#1e2d40",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },
  saveBtn: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  hint: { color: "#475569", fontSize: 11, marginTop: 10, lineHeight: 16 },
  errorText: { color: "#f87171", fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d40",
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: "#94a3b8", width: 130 },
  rowValue: { fontSize: 13, color: "#f1f5f9", fontWeight: "600", flex: 1, textAlign: "right", flexWrap: "wrap" },
});