import { Ionicons } from "@expo/vector-icons"; // <-- Asegurate de tener ambos
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerRed } from "../../src/componentes/BannerRed";
import { EstadoPantalla } from "../../src/componentes/EstadoPantalla";
import { useAsync } from "../../src/hooks/useAsync";
import { obtenerAvisosYNotificar } from "../../src/servicios/avisos";
import { useColores } from "../../src/tema";

export default function Avisos() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { estado, recargar } = useAsync(obtenerAvisosYNotificar);

  const getGravedadColor = (gravedad: string) => {
    switch (gravedad) {
      case "desvio": return "#B26A00";
      case "suspension": return "#B3261E";
      default: return "#1B6CA8";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      {/* HEADER CON GRADIENTE */}
      <LinearGradient
        colors={['#1B6CA8', '#2A8BC0', '#4A9FD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={estilos.headerContent}>
          {/* CAMBIAMOS EL ICONO A UNA CAMPANA (Ionicons) QUE ES 100% SEGURO */}
          <Ionicons name="notifications" size={28} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={estilos.headerTitle}>Avisos</Text>
        </View>
      </LinearGradient>

      <BannerRed />

      <View style={{ flex: 1, paddingTop: 12 }}>
        <EstadoPantalla estado={estado} mensajeVacio="No hay avisos vigentes." onReintentar={recargar}>
          {(avisos) => (
            <FlatList
              data={avisos}
              keyExtractor={(a) => a.id}
              contentContainerStyle={estilos.lista}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const colorGravedad = getGravedadColor(item.gravedad);
                return (
                  <Pressable
                    onPress={() => router.push({ pathname: "/aviso/[id]", params: { id: item.id } })}
                    style={[
                      estilos.tarjeta,
                      {
                        backgroundColor: c.tarjeta,
                        borderColor: c.borde,
                        borderLeftColor: colorGravedad,
                      }
                    ]}
                    accessibilityRole="button"
                  >
                    <View style={estilos.tarjetaHeader}>
                      <Ionicons name="alert-circle" size={20} color={colorGravedad} style={{ marginRight: 8 }} />
                      <Text style={{ color: c.texto, fontWeight: "700", fontSize: 16, flex: 1 }} numberOfLines={2}>
                        {item.titulo}
                      </Text>
                    </View>

                    <Text style={{ color: c.textoSuave, marginLeft: 28, fontSize: 14, lineHeight: 20 }} numberOfLines={3}>
                      {item.detalle}
                    </Text>

                    <View style={estilos.tarjetaFooter}>
                      <View style={[estilos.badge, { backgroundColor: colorGravedad + '15' }]}>
                        <Text style={{ color: colorGravedad, fontSize: 11, fontWeight: "800" }}>
                          {item.gravedad.toUpperCase()}
                        </Text>
                      </View>
                      {item.videoUrl && (
                        <View style={estilos.videoTag}>
                          <Ionicons name="videocam" size={12} color={c.textoSuave} />
                          <Text style={{ color: c.textoSuave, fontSize: 11, marginLeft: 4 }}>Video</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  lista: { padding: 16, gap: 12 },
  tarjeta: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tarjetaFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 28,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  }
});