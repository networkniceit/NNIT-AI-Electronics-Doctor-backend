import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import * as Battery from "expo-battery";
import * as Network from "expo-network";

export default function DeviceDiagnostics() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<string>("Unknown");
  const [lowPowerMode, setLowPowerMode] = useState<boolean | null>(null);
  const [network, setNetwork] = useState<any>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(level >= 0 ? Math.round(level * 100) : null);

      const state = await Battery.getBatteryStateAsync();
      const stateMap: Record<number, string> = {
        [Battery.BatteryState.UNKNOWN]: "Unknown",
        [Battery.BatteryState.UNPLUGGED]: "Discharging",
        [Battery.BatteryState.CHARGING]: "Charging",
        [Battery.BatteryState.FULL]: "Full",
      };
      setBatteryState(stateMap[state] ?? "Unknown");

      const lowPower = await Battery.isLowPowerModeEnabledAsync();
      setLowPowerMode(lowPower);

      const net = await Network.getNetworkStateAsync();
      setNetwork(net);
    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const sub = Battery.addBatteryLevelListener(({ batteryLevel: lvl }) => {
      setBatteryLevel(Math.round(lvl * 100));
    });
    return () => sub.remove();
  }, [load]);

  const deviceRows = [
    { label: "Brand", value: Device.brand ?? "Unknown" },
    { label: "Model", value: Device.modelName ?? "Unknown" },
    { label: "Device Name", value: Device.deviceName ?? "Unknown" },
    { label: "Manufacturer", value: Device.manufacturer ?? "Unknown" },
    { label: "OS", value: `${Device.osName ?? "Unknown"} ${Device.osVersion ?? ""}`.trim() },
    { label: "Device Type", value: Device.deviceType != null ? Device.DeviceType[Device.deviceType] : "Unknown" },
    { label: "Total Memory", value: Device.totalMemory ? `${(Device.totalMemory / 1e9).toFixed(1)} GB` : "Unknown" },
  ];

  const batteryRows = [
    { label: "Level", value: batteryLevel != null ? `${batteryLevel}%` : "Unknown" },
    { label: "State", value: batteryState },
    { label: "Low Power Mode", value: lowPowerMode == null ? "Unknown" : lowPowerMode ? "On" : "Off" },
  ];

  const networkRows = [
    { label: "Type", value: network?.type ?? "Unknown" },
    { label: "Connected", value: network?.isConnected == null ? "Unknown" : network.isConnected ? "Yes" : "No" },
    { label: "Internet Reachable", value: network?.isInternetReachable == null ? "Unknown" : network.isInternetReachable ? "Yes" : "No" },
  ];

  const Section = ({ title, rows }: { title: string; rows: { label: string; value: string }[] }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {rows.map((row) => (
        <View key={row.label} style={s.row}>
          <Text style={s.rowLabel}>{row.label}</Text>
          <Text style={s.rowValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📱 This Device</Text>
      </View>

      <Section title="DEVICE" rows={deviceRows} />
      <Section title="BATTERY" rows={batteryRows} />
      <Section title="NETWORK" rows={networkRows} />

      <View style={s.footer}>
        <Text style={s.footerText}>Self-diagnostics · reads this phone's own sensors</Text>
      </View>
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
    marginBottom: 0,
    marginTop: 16,
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e2d40",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 1,
    padding: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d40",
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: "#94a3b8", width: 110 },
  rowValue: { fontSize: 13, color: "#f1f5f9", fontWeight: "600", flex: 1, textAlign: "right", flexWrap: "wrap" },
  footer: { padding: 24, alignItems: "center" },
  footerText: { fontSize: 11, color: "#334155" },
});