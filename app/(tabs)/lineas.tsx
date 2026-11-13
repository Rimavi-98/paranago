import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerRed } from "../../src/componentes/BannerRed";
import { EstadoPantalla } from "../../src/componentes/EstadoPantalla";
import { useAsync } from "../../src/hooks/useAsync";
import { obtenerLineas } from "../../src/servicios/lineas";
import { useColores } from "../../src/tema";

export default function Lineas() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { estado, recargar } = useAsync(obtenerLineas);
  const [busqueda, setBusqueda] = useState("");

  const lineasFiltradas = estado.tipo === "listo"
    ? estado.datos.filter(l =>
      l.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    : [];

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
          <MaterialCommunityIcons name="bus-multiple" size={28} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={estilos.headerTitle}>Líneas</Text>
        </View>

        <View style={[estilos.buscadorContainer, { backgroundColor: c.tarjeta }]}>
          <Ionicons name="search" size={20} color={c.textoSuave} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar línea por número o nombre..."
            placeholderTextColor={c.textoSuave}
            style={[estilos.buscadorInput, { color: c.texto }]}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
      </LinearGradient>

      <BannerRed />

      <View style={{ flex: 1, paddingTop: 12 }}>
        <EstadoPantalla estado={estado} mensajeVacio="No hay líneas para mostrar." onReintentar={recargar}>
          {() => (
            <FlatList
              data={lineasFiltradas}
              keyExtractor={(l) => l.id}
              contentContainerStyle={estilos.lista}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push({ pathname: "/linea/[id]", params: { id: item.id } })}
                  style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Línea ${item.numero}, ${item.nombre}`}
                >
                  <View style={[estilos.numero, { backgroundColor: item.color }]}>
                    <Text style={estilos.numeroTexto}>{item.numero}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.texto, fontWeight: "700", fontSize: 16 }} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={{ color: c.textoSuave, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.empresa}</Text>
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
  numero: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  numeroTexto: { color: "#fff", fontWeight: "800", fontSize: 20 },
});