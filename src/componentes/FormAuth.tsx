import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSesion } from "../sesion/SesionContext";
import { useColores } from "../tema";

export function FormAuth({ modo }: { modo: "ingreso" | "registro" }) {
  const c = useColores();
  const { ingresar, registrar } = useSesion();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrar, setMostrar] = useState(true);

  async function enviar() {
    setError(null);
    if (modo === "registro" && nombre.trim().length < 2) return setError("Escribí tu nombre.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Revisá el email.");
    if (password.length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres.");
    setCargando(true);
    try {
      if (modo === "registro") await registrar(nombre, email, password);
      else await ingresar(email, password);
      //router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  }

  const campo = [estilos.input, { backgroundColor: c.tarjeta, color: c.texto, borderColor: c.borde }];

  return (
    <ScrollView style={{ backgroundColor: c.fondo }} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <Text style={[estilos.titulo, { color: c.texto }]}>{modo === "registro" ? "Crear cuenta" : "Ingresar"}</Text>
      {modo === "registro" && (
        <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor={c.textoSuave} style={campo} />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={c.textoSuave}
        autoCapitalize="none"
        keyboardType="email-address"
        style={campo}
      />
      <View style={[campo, estilos.inputMostrar]}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña (mínimo 8)"
          placeholderTextColor={c.textoSuave}
          secureTextEntry={mostrar}
          style={{width:'95%'}}
        />
        <TouchableOpacity 
            onPress={()=>setMostrar(!mostrar)}
            
            accessibilityLabel="Mostrar/ocultar contraseña"
            activeOpacity={0.8}>
            <Ionicons name={mostrar ? "eye-outline" : "eye-off-outline"} size={22} color={'#fff'} />
        </TouchableOpacity>
      </View>
      {error && <Text style={{ color: c.error }}>{error}</Text>}
      <Pressable
        onPress={enviar}
        disabled={cargando}
        style={[estilos.boton, { backgroundColor: c.primario, opacity: cargando ? 0.6 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={estilos.botonTexto}>{cargando ? "Un momento…" : modo === "registro" ? "Crear cuenta" : "Ingresar"}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace(modo === "registro" ? "/ingresar" : "/registro")} accessibilityRole="button">
        <Text style={{ color: c.primario, textAlign: "center", padding: 8 }}>
          {modo === "registro" ? "Ya tengo cuenta: ingresar" : "No tengo cuenta: registrarme"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 20, gap: 12 },
  titulo: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, minHeight: 48 },
  boton: { padding: 14, borderRadius: 10, alignItems: "center", minHeight: 48, justifyContent: "center" },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 16 },
  inputMostrar:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between'}
});
