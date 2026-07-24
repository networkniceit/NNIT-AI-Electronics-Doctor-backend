import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === "web") {
      // On web use localStorage instead of SecureStore
      const token = localStorage.getItem("nnit_token");
      if (token) router.replace("/(tabs)/dashboard");
      else router.replace("/(auth)/login");
    } else {
      // On native use SecureStore
      import("expo-secure-store").then((SecureStore) => {
        SecureStore.getItemAsync("nnit_token").then((token) => {
          if (token) router.replace("/(tabs)/dashboard");
          else router.replace("/(auth)/login");
        });
      });
    }
  }, []);

  return null;
}
