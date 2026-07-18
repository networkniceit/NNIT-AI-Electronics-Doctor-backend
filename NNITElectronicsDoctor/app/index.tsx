import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    SecureStore.getItemAsync("nnit_token").then(token => {
      if (token) router.replace("/(tabs)/dashboard");
      else router.replace("/(auth)/login");
    });
  }, []);
  return <View style={{ flex:1, backgroundColor:"#0b0f1a", justifyContent:"center", alignItems:"center" }}><ActivityIndicator color="#3b82f6" size="large"/></View>;
}
