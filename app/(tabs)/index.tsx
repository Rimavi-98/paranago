import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerRed } from "../../src/componentes/BannerRed";
import { EstadoPantalla } from "../../src/componentes/EstadoPantalla";
import { useAsync } from "../../src/hooks/useAsync";
import { obtenerAvisosYNotificar } from "../../src/servicios/avisos";
import { useFavoritos } from "../../src/servicios/favoritos";
import { obtenerLineas } from "../../src/servicios/lineas";
import { obtenerParadas } from "../../src/servicios/paradas";
import { useColores } from "../../src/tema";

export default function Inicio() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const avisos = useAsync(obtenerAvisosYNotificar);
  const lineas = useAsync(obtenerLineas);
  const paradas = useAsync(obtenerParadas);
  const favLineas = useFavoritos("lineas");
  const favParadas = useFavoritos("paradas");

  useFocusEffect(
    useCallback(() => {
      favLineas.recargar();
      favParadas.recargar();
    }, [])
  );

  const lineasFav = lineas.estado.tipo === "listo" ? lineas.estado.datos.filter((l) => favLineas.ids.includes(l.id)) : [];
  const paradasFav = paradas.estado.tipo === "listo" ? paradas.estado.datos.filter((p) => favParadas.ids.includes(p.id)) : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      {/* HEADER FIJO CON GRADIENTE */}
      <LinearGradient
        colors={['#1B6CA8', '#2A8BC0', '#4A9FD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={estilos.headerContent}>
          <MaterialCommunityIcons name="bus" size={28} color="#FFFFFF" style={estilos.iconoBus} />
          <Text style={estilos.headerTitle}>ParanaGo</Text>
        </View>
      </LinearGradient>

      <BannerRed />

      <ScrollView contentContainerStyle={estilos.contenido}>
        {/* TÍTULO FAVORITOS */}
        <View style={estilos.tituloFila}>
          <Ionicons name="star" size={22} color={c.textoSuave} style={{ marginRight: 8 }} />
          <Text style={[estilos.titulo, { color: c.texto }]}>Tus favoritos</Text>
        </View>

        {lineasFav.length === 0 && paradasFav.length === 0 && (
          <Text style={{ color: c.textoSuave, marginBottom: 12 }}>
            Marcá líneas y paradas con la estrella para verlas acá primero.
          </Text>
        )}

        {lineasFav.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => router.push({ pathname: "/linea/[id]", params: { id: l.id } })}
            style={[estilos.fav, { backgroundColor: c.tarjeta, borderColor: c.borde }]}
            accessibilityRole="button"
          >
            <View style={[estilos.numero, { backgroundColor: l.color }]}>
              <Text style={estilos.numeroTexto}>{l.numero}</Text>
            </View>
            <Text style={{ color: c.texto, flex: 1, fontWeight: "500" }}>{l.nombre}</Text>
            <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
          </Pressable>
        ))}

        {paradasFav.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push({ pathname: "/parada/[id]", params: { id: p.id } })}
            style={[estilos.fav, { backgroundColor: c.tarjeta, borderColor: c.borde }]}
            accessibilityRole="button"
          >
            <View style={estilos.iconoParada}>
              <Ionicons name="location" size={20} color={c.primario} />
            </View>
            <Text style={{ color: c.texto, flex: 1, fontWeight: "600" }}>{p.nombre}</Text>
            <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
          </Pressable>
        ))}

        {/* TÍTULO AVISOS */}
        <View style={[estilos.tituloFila, { marginTop: 12 }]}>
          <Ionicons name="megaphone" size={22} color={c.textoSuave} style={{ marginRight: 8 }} />
          <Text style={[estilos.titulo, { color: c.texto }]}>Avisos de hoy</Text>
        </View>

        <View style={{ minHeight: 120 }}>
          <EstadoPantalla estado={avisos.estado} mensajeVacio="No hay avisos vigentes." onReintentar={avisos.recargar}>
            {(lista) =>
              lista.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => router.push({ pathname: "/aviso/[id]", params: { id: a.id } })}
                  style={[
                    estilos.aviso,
                    {
                      backgroundColor: c.alertaFondo,
                      borderLeftColor: c.alerta,
                    }
                  ]}
                  accessibilityRole="button"
                >
                  <View style={estilos.avisoHeader}>
                    <Ionicons name="alert-circle" size={20} color={c.alerta} style={{ marginRight: 6 }} />
                    <Text style={{ color: c.alerta, fontWeight: "700", fontSize: 15, flex: 1 }}>{a.titulo}</Text>
                  </View>
                  <Text style={{ color: c.texto, marginLeft: 26, fontSize: 14, lineHeight: 20 }}>{a.detalle}</Text>
                </Pressable>
              ))
            }
          </EstadoPantalla>
        </View>
      </ScrollView>
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
  },
  iconoBus: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contenido: { padding: 16, gap: 10, paddingBottom: 40 },
  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  titulo: { fontSize: 22, fontWeight: "800" }, // Aumenté un poco el tamaño para que resalte
  fav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  numero: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numeroTexto: { color: "#fff", fontWeight: "800", fontSize: 16 },
  iconoParada: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(27, 108, 168, 0.1)"
  },
  aviso: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avisoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  }
});