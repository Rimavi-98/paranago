import { useNetworkState } from "expo-network";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { PantallaBloqueo } from "../src/componentes/PantallaBloqueo";
import { descargarTodosLosHorarios } from "../src/servicios/horarios";
import { sincronizarReportes } from "../src/servicios/reportes";
import { ProveedorSesion, useSesion } from "../src/sesion/SesionContext";
import { cargarTema, useColores, useEsOscuro } from "../src/tema";

function Contenido() {
  const c = useColores();
  const oscuro = useEsOscuro();
  const { estado } = useSesion();
  const red = useNetworkState();

  useEffect(() => {
    cargarTema();
  }, []);

  // Cuando vuelve la red, se envían los reportes que quedaron en la cola
  useEffect(() => {
    if (red.isConnected && red.isInternetReachable !== false) {
      if (estado === "activa") sincronizarReportes().catch(() => {});
      descargarTodosLosHorarios().catch(() => {}); // deja las tablas guardadas para usar sin conexión
    }
  }, [red.isConnected, red.isInternetReachable, estado]);

  if (estado === "cargando") return <View style={{ flex: 1, backgroundColor: c.fondo }} />;
  if (estado === "bloqueada") return <PantallaBloqueo />;

  const cabecera = {
    headerShown: true,
    headerStyle: { backgroundColor: c.primario },
    headerTintColor: "#fff",
  };

  return (
    <>
      <StatusBar style={oscuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!(estado==='sin_sesion')}>
          <Stack.Screen name="ingresar" options={{ ...cabecera, title: "Ingresar" }} />
          <Stack.Screen name="registro" options={{ ...cabecera, title: "Crear cuenta" }} />
        </Stack.Protected>
        <Stack.Protected guard={!(estado==='sin_sesion')}>
                <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        <Stack.Screen name="linea/[id]" options={{ ...cabecera, title: "Línea" }} />
        <Stack.Screen name="parada/[id]" options={{ ...cabecera, title: "Parada" }} />
        <Stack.Screen name="aviso/[id]" options={{ ...cabecera, title: "Aviso" }} />
        <Stack.Screen name="reportar/[paradaId]" options={{ ...cabecera, title: "Reportar" }} />
        <Stack.Screen name="qr/escanear" options={{ ...cabecera, title: "Escanear QR" }} />
       
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ProveedorSesion>
      <Contenido />
    </ProveedorSesion>
  );
}
