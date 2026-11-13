import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fijarAvisosActivos, obtenerAvisosActivos } from "../../src/servicios/preferencias";
import { useSesion } from "../../src/sesion/SesionContext";
import { fijarTema, useColores, useTemaPreferido } from "../../src/tema";
import type { Tema } from "../../src/tipos";

const TEMAS: { valor: Tema; etiqueta: string }[] = [
  { valor: "sistema", etiqueta: "Sistema" },
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
];

export default function Yo() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { estado, usuario, salir } = useSesion();
  const tema = useTemaPreferido();
  const [avisos, setAvisos] = useState(true);

  useEffect(() => {
    obtenerAvisosActivos().then(setAvisos);
  }, []);

  function cambiarAvisos(v: boolean) {
    setAvisos(v);
    fijarAvisosActivos(v);
  }

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
          <Ionicons name="person-circle" size={32} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={estilos.headerTitle}>Mi Perfil</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        {/* TARJETA DE CUENTA */}
        {estado === "activa" && usuario ? (
          <View style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
            <View style={estilos.avatarContainer}>
              <Ionicons name="person" size={32} color={c.primario} />
            </View>
            <Text style={{ color: c.texto, fontSize: 20, fontWeight: "800" }}>{usuario.nombre}</Text>
            <Text style={{ color: c.textoSuave, marginBottom: 12 }}>{usuario.email}</Text>
            <Pressable onPress={salir} accessibilityRole="button" style={[estilos.botonBorde, { borderColor: c.error }]}>
              <Text style={{ color: c.error, fontWeight: "700" }}>Cerrar sesión</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
            <View style={[estilos.avatarContainer, { backgroundColor: c.borde }]}>
              <Ionicons name="person-outline" size={32} color={c.textoSuave} />
            </View>
            <Text style={{ color: c.texto, fontSize: 18, fontWeight: "800" }}>Tu cuenta</Text>
            <Text style={{ color: c.textoSuave, textAlign: "center", marginBottom: 16 }}>
              Ingresá para reportar demoras. Podés ver líneas, paradas y horarios sin cuenta.
            </Text>
            <Pressable onPress={() => router.push("/ingresar")} accessibilityRole="button" style={[estilos.boton, { backgroundColor: c.primario }]}>
              <Text style={estilos.botonTexto}>Ingresar</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/registro")} accessibilityRole="button" style={[estilos.botonBorde, { borderColor: c.primario, marginTop: 8 }]}>
              <Text style={{ color: c.primario, fontWeight: "700" }}>Crear cuenta</Text>
            </Pressable>
          </View>
        )}

        {/* TARJETA DE APARIENCIA */}
        <View style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde, alignItems: "stretch" }]}>
          <View style={estilos.tarjetaTitulo}>
            <Ionicons name="color-palette" size={20} color={c.textoSuave} style={{ marginRight: 8 }} />
            <Text style={{ color: c.texto, fontSize: 18, fontWeight: "800" }}>Apariencia</Text>
          </View>
          <View style={estilos.fila}>
            {TEMAS.map((t) => (
              <Pressable
                key={t.valor}
                onPress={() => fijarTema(t.valor)}
                accessibilityRole="button"
                style={[estilos.chip, { borderColor: c.primario, backgroundColor: tema === t.valor ? c.primario : 'transparent' }]}
              >
                <Text style={{ color: tema === t.valor ? "#fff" : c.texto, fontWeight: "600" }}>{t.etiqueta}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* TARJETA DE NOTIFICACIONES */}
        <View style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde, alignItems: "stretch" }]}>
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Ionicons name="notifications" size={18} color={c.textoSuave} style={{ marginRight: 6 }} />
                <Text style={{ color: c.texto, fontSize: 16, fontWeight: "700" }}>Avisos de favoritos</Text>
              </View>
              <Text style={{ color: c.textoSuave, fontSize: 13 }}>Recibir una notificación cuando haya un aviso nuevo.</Text>
            </View>
            <Switch value={avisos} onValueChange={cambiarAvisos} />
          </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contenido: { padding: 16, gap: 16, paddingBottom: 40 },
  tarjeta: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center", // Centra el contenido por defecto (para el perfil)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(27, 108, 168, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tarjetaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: "center" },
  boton: { padding: 14, borderRadius: 12, alignItems: "center", minHeight: 48, justifyContent: "center", width: "100%" },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
  botonBorde: { padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: "center", minHeight: 48, justifyContent: "center", width: "100%" },
});