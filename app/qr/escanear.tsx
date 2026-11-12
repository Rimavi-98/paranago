import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { obtenerParada } from "../../src/servicios/paradas";
import { useColores } from "../../src/tema";
import { parsearQr } from "../../src/utils/qr";

export default function Escanear() {
  const c = useColores();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const ocupado = useRef(false);

  async function alEscanear({ data }: { data: string }) {
    if (ocupado.current) return;
    ocupado.current = true;
    const id = parsearQr(data);
    if (!id) {
      setMensaje("Ese QR no es de una parada de ParanaGo.");
      return;
    }
    try {
      await obtenerParada(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({ pathname: "/parada/[id]", params: { id } });
    } catch {
      setMensaje("Ese QR no corresponde a ninguna parada conocida.");
    }
  }

  function reintentar() {
    ocupado.current = false;
    setMensaje(null);
  }

  if (!permiso) return <View style={{ flex: 1, backgroundColor: c.fondo }} />;

  if (!permiso.granted) {
    return (
      <View style={[estilos.centro, { backgroundColor: c.fondo }]}>
        <Text style={{ color: c.texto, textAlign: "center", fontSize: 16 }}>
          Necesitamos la cámara para leer el QR de la parada.
        </Text>
        <Pressable onPress={pedirPermiso} style={[estilos.boton, { backgroundColor: c.primario }]} accessibilityRole="button">
          <Text style={estilos.botonTexto}>Permitir cámara</Text>
        </Pressable>
        <Text style={{ color: c.textoSuave, textAlign: "center" }}>
          Si no querés, podés buscar la parada por nombre en la pestaña Paradas.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={mensaje ? undefined : alEscanear}
      />
      <View style={estilos.pie}>
        <Text style={estilos.pieTexto}>{mensaje ?? "Apuntá al QR del cartel de la parada"}</Text>
        {mensaje && (
          <Pressable onPress={reintentar} style={[estilos.boton, { backgroundColor: c.primario }]} accessibilityRole="button">
            <Text style={estilos.botonTexto}>Escanear de nuevo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  boton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, minHeight: 48, justifyContent: "center", alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
  pie: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, gap: 12, backgroundColor: "rgba(0,0,0,0.6)" },
  pieTexto: { color: "#fff", textAlign: "center", fontSize: 16 },
});
