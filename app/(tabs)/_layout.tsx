import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { useColores } from "../../src/tema";

export default function TabsLayout() {
  const c = useColores();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primario,
        tabBarInactiveTintColor: c.textoSuave,
        tabBarStyle: { backgroundColor: c.tarjeta, borderTopColor: c.borde },
        headerStyle: { backgroundColor: c.primario },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ParanaGo",
          tabBarLabel: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lineas"
        options={{
          title: "Líneas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="bus" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="paradas"
        options={{
          title: "Paradas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: "Avisos",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="yo"
        options={{
          title: "Yo",
          headerShown: false,

          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
