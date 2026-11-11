import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BannerRed } from "../../src/componentes/BannerRed";
import { EstadoPantalla } from "../../src/componentes/EstadoPantalla";
import { useAsync } from "../../src/hooks/useAsync";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { buscarParadas } from "../../src/servicios/paradas";
import { useColores } from "../../src/tema";
import { distanciaMetros, textoDistancia } from "../../src/utils/geo";

export default function Paradas() {
  const c = useColores();
  const [texto, setTexto] = useState("");
  const { estado: ubic, coords } = useUbicacion();
  const { estado, recargar } = useAsync(() => buscarParadas(texto), [texto]);

  // Si hay ubicación, ordenamos por cercanía y mostramos la distancia
  const ordenar = useMemo(
    () => (paradas: Awaited<ReturnType<typeof buscarParadas>>) =>
      paradas
        .map((p) => ({ p, d: coords ? distanciaMetros(coords, p.coordenadas) : null }))
        .sort((a, b) => (a.d ?? 0) - (b.d ?? 0)),
    [coords]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerRed />
      <Pressable
        onPress={() => router.push("/qr/escanear")}
        accessibilityRole="button"
        style={[estilos.qr, { backgroundColor: c.primario }]}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Escanear QR de una parada</Text>
      </Pressable>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Buscar parada por nombre o calle"
        placeholderTextColor={c.textoSuave}
        style={[estilos.buscador, { backgroundColor: c.tarjeta, color: c.texto, borderColor: c.borde }]}
      />
      {ubic === "denegada" && (
        <Text style={[estilos.nota, { color: c.textoSuave }]}>
          Sin acceso a tu ubicación: podés buscar la parada por nombre.
        </Text>
      )}
      {ubic === "concedida" && !coords && (
        <Text style={[estilos.nota, { color: c.textoSuave }]}>Buscando tu ubicación…</Text>
      )}
      <EstadoPantalla estado={estado} mensajeVacio="No encontramos paradas con ese nombre." onReintentar={recargar}>
        {(paradas) => (
          <FlatList
            data={ordenar(paradas)}
            keyExtractor={(x) => x.p.id}
            contentContainerStyle={estilos.lista}
            renderItem={({ item: { p, d } }) => (
              <Pressable
                onPress={() => router.push({ pathname: "/parada/[id]", params: { id: p.id } })}
                style={[estilos.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}
                accessibilityRole="button"
              >
                <Text style={{ color: c.texto, fontWeight: "700" }}>{p.nombre}</Text>
                <Text style={{ color: c.textoSuave }}>
                  {d !== null ? `${textoDistancia(d)} · ` : ""}Sentido {p.sentido} · {p.lineaIds.length}{" "}
                  {p.lineaIds.length === 1 ? "línea" : "líneas"}
                </Text>
              </Pressable>
            )}
          />
        )}
      </EstadoPantalla>
    </View>
  );
}

const estilos = StyleSheet.create({
  qr: { margin: 16, marginBottom: 0, padding: 14, borderRadius: 10, alignItems: "center", minHeight: 48, justifyContent: "center" },
  buscador: { margin: 16, marginBottom: 8, padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 16 },
  nota: { paddingHorizontal: 16, paddingBottom: 4 },
  lista: { padding: 16, gap: 10 },
  tarjeta: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 2, minHeight: 64, justifyContent: "center" },
});
