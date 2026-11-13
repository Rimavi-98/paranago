import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerRed } from "../../src/componentes/BannerRed";
import { EstadoPantalla } from "../../src/componentes/EstadoPantalla";
import { useAsync } from "../../src/hooks/useAsync";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { buscarParadas } from "../../src/servicios/paradas";
import { useColores, useEsOscuro } from "../../src/tema";
import { distanciaMetros, textoDistancia } from "../../src/utils/geo";

export default function Paradas() {
  const c = useColores();
  const oscuro = useEsOscuro();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState("");
  const { estado: ubic, coords } = useUbicacion();
  const { estado, recargar } = useAsync(() => buscarParadas(texto), [texto]);

  const ordenar = useMemo(
    () => (paradas: Awaited<ReturnType<typeof buscarParadas>>) =>
      paradas
        .map((p) => ({ p, d: coords ? distanciaMetros(coords, p.coordenadas) : null }))
        .sort((a, b) => (a.d ?? 0) - (b.d ?? 0)),
    [coords]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      {/* Forzamos que los iconos de arriba sean blancos en el header */}
      <StatusBar style="light" />

      {/* HEADER CON GRADIENTE UNIFICADO */}
      <LinearGradient
        colors={['#1B6CA8', '#2A8BC0', '#4A9FD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          estilos.header,
          { paddingTop: insets.top + 16 }
        ]}
      >
        <View style={estilos.headerContent}>
          <MaterialCommunityIcons name="map-marker-multiple" size={28} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={estilos.headerTitle}>Paradas</Text>
        </View>

        <Pressable
          onPress={() => router.push("/qr/escanear")}
          style={estilos.botonQr}
          accessibilityRole="button"
        >
          <View style={estilos.iconoQrContainer}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#1B6CA8" />
          </View>
          <Text style={estilos.botonQrTexto}>Escanear QR de una parada</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={[estilos.buscadorContainer, { backgroundColor: c.tarjeta }]}>
          <Ionicons name="search" size={20} color={c.textoSuave} style={{ marginRight: 8 }} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar parada por nombre o calle"
            placeholderTextColor={c.textoSuave}
            style={[estilos.buscadorInput, { color: c.texto }]}
          />
        </View>
      </LinearGradient>

      <BannerRed />

      {ubic === "denegada" && (
        <Text style={[estilos.nota, { color: c.textoSuave }]}>
          Sin acceso a tu ubicación: podés buscar la parada por nombre.
        </Text>
      )}
      {ubic === "concedida" && !coords && (
        <Text style={[estilos.nota, { color: c.textoSuave }]}>Buscando tu ubicación…</Text>
      )}

      <View style={{ flex: 1, paddingTop: 12 }}>
        <EstadoPantalla estado={estado} mensajeVacio="No encontramos paradas con ese nombre." onReintentar={recargar}>
          {(paradas) => (
            <FlatList
              data={ordenar(paradas)}
              keyExtractor={(x) => x.p.id}
              contentContainerStyle={estilos.lista}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: { p, d } }) => (
                <Pressable
                  onPress={() => router.push({ pathname: "/parada/[id]", params: { id: p.id } })}
                  style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}
                  accessibilityRole="button"
                >
                  <View style={[estilos.iconoParada, { backgroundColor: c.primario + '15' }]}>
                    <Ionicons name="location" size={22} color={c.primario} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.texto, fontWeight: "700", fontSize: 16, marginBottom: 2 }} numberOfLines={1}>
                      {p.nombre}
                    </Text>
                    <Text style={{ color: c.textoSuave, fontSize: 13 }}>
                      {d !== null ? `${textoDistancia(d)} · ` : ""}Sentido {p.sentido} · {p.lineaIds.length}{" "}
                      {p.lineaIds.length === 1 ? "línea" : "líneas"}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
                </Pressable>
              )}
            />
          )}
        </EstadoPantalla>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  botonQr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconoQrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  botonQrTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 15,
  },
  nota: { paddingHorizontal: 16, paddingTop: 12, fontSize: 13 },
  lista: { padding: 16, gap: 12 },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconoParada: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});