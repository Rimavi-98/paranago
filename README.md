# ParanaGo

App móvil de transporte público de Paraná: consultá líneas, paradas y horarios, mirá los avisos del servicio, reportá demoras y llegá caminando a tu parada. Funciona también sin conexión.

Trabajo integrador de **Desarrollo para Móviles** (UNER). Hecha con **React Native + Expo (SDK 58) + Expo Router + TypeScript**.

## Entregables

| | |
|---|---|
| **APK (preview, instalable)** | `COMPLETAR: enlace del build de EAS` |
| **Video de la defensa** | `COMPLETAR: enlace al video` |
| **Integrantes** | `COMPLETAR: nombres del grupo` |

> El APK se compila en la nube de EAS: se instala en cualquier Android sin necesidad de Metro ni de la computadora de nadie.

## Qué hace

- **Inicio, Líneas, Paradas, Avisos y Yo**, con navegación por pestañas y pantallas de detalle.
- **Cuenta**: registro e ingreso. La sesión se guarda de forma segura y, al volver a abrir la app, se pide **huella o rostro** (o la contraseña si el teléfono no tiene).
- **Línea**: recorrido en un **mapa** con sus paradas y avisos que la afectan.
- **Parada**: próximos horarios, **flecha que apunta hacia la parada** (ubicación + brújula), cómo llegar caminando y **reportes de otros pasajeros**, que se pueden **confirmar**.
- **Escáner QR** de los carteles de parada (formato `PARANA:par-101`).
- **Reportar una demora**, con foto opcional (cámara o galería). Si no hay conexión, queda guardado en el teléfono y se envía solo cuando vuelve la red.
- **Recordatorios**: "Avisarme" programa una notificación 10 minutos antes de un horario.
- **Avisos** con video; notificación cuando hay un aviso nuevo en una línea favorita.
- **Favoritos** y preferencias guardados en el teléfono; tema claro/oscuro.

## Requisitos de la cátedra y dónde están

| # | Requisito | Dónde |
|---|---|---|
| 1 | Navegación | Expo Router: pestañas + pila de pantallas (`app/`) |
| 2 | Cuenta, almacenamiento seguro y biometría | `src/servicios/sesion.ts` (expo-secure-store), `biometria.ts`, `src/componentes/PantallaBloqueo.tsx` |
| 3 | API detrás de una capa de servicios, con estados de carga, vacío y error | `src/servicios/*`, `http.ts`, `src/componentes/EstadoPantalla.tsx`, `src/hooks/useAsync.ts` |
| 4 | Cámara / galería y archivos | `app/reportar/[paradaId].tsx` (expo-camera, expo-image-picker, expo-file-system), `app/qr/escanear.tsx` |
| 5 | Ubicación y mapa | `src/hooks/useUbicacion.ts`, `FlechaParada.tsx`, `MapaRecorrido.native.tsx` (MapLibre + OpenStreetMap, sin clave) |
| 6 | Notificaciones locales por hechos reales | `src/servicios/notificaciones.ts` |
| 7 | Uso sin conexión | SQLite (`src/datos/db.ts`, `reportesDb.ts`), kv-store (`kv.ts`), estado de red (`BannerRed.tsx`, cola de reportes) |
| 8 | Sensores y vibración | Magnetómetro en `FlechaParada.tsx`; haptics al confirmar, reportar y escanear |
| 9 | Video | `app/aviso/[id].tsx` (expo-video) |
| 10 | Identidad propia | Nombre, ícono y pantalla de inicio propios (`assets/`) |

## Cómo funciona por dentro

```
pantallas (app/)  →  servicios (src/servicios/)  →  http.ts  →  API
                          │
                          ├─ caché en SQLite: si falla la red, se muestra lo último guardado
                          └─ cola de reportes en SQLite: se envía cuando hay red y sesión
```

- Las pantallas **nunca** llaman a la API directamente: pasan por `src/servicios/`.
- `http.ts` entiende los sobres de la API (`{ datos, meta }` / `{ error: { codigo, mensaje } }`) y corta a los 90 segundos.
- **Cola de reportes**: cada reporte se guarda primero en el teléfono y después se intenta enviar. Se reintenta al volver la red, al abrir la app, al ingresar y al crear otro reporte. Si la foto no se puede subir, el reporte se envía igual, sin foto.
- El **token** vive en `expo-secure-store`; en el almacén clave-valor solo hay datos no sensibles.

## API

Se usa la API de la cátedra, publicada en Render: `https://api-transporte-publico-8p74.onrender.com`

- Es un plan gratuito: si pasó un rato sin uso, **la primera consulta puede tardar cerca de 1 minuto** en responder. Conviene abrir `/salud` antes de probar.
- Usuarios de prueba (clave `demo1234`): `julian@mail.com`, `nuevo@demo.ar`.
- Para apuntar a otra API: variable `EXPO_PUBLIC_API_URL` (ver `src/config.ts`).

## Cómo probarla

1. Descargá e instalá el APK (enlace arriba).
2. Ingresá con un usuario de prueba, o creá una cuenta.
3. Entrá a una parada, por ejemplo **Almafuerte y Newbery** (QR `PARANA:par-102`) o **Alameda y Urquiza** (QR `PARANA:par-101`).

> No funciona en Expo Go: usa módulos nativos (MapLibre, entre otros). Hay que usar el APK.

## Cómo compilar

```bash
npm install
npx tsc --noEmit                                   # chequeo de tipos
eas build --platform android --profile preview     # APK en la nube
```

Para compilar con otra cuenta de Expo hay que correr antes `eas init` (cambia el `projectId` de `app.json`).

## Estructura

- `app/`: pantallas (Expo Router). `(tabs)` = Inicio, Líneas, Paradas, Avisos, Yo.
- `src/servicios/`: capa de servicios (API, sesión, caché, reportes, notificaciones, biometría).
- `src/datos/`: SQLite y almacén clave-valor.
- `src/componentes/`, `src/hooks/`, `src/tema/`, `src/utils/`, `src/tipos/`: piezas compartidas.

## Limitaciones conocidas

- La primera consulta tras un rato de inactividad es lenta (plan gratuito de Render).
- Los horarios son los de la tabla; la app no conoce la posición real de los colectivos.
- La subida de fotos depende del almacenamiento de la API; si el servidor no la acepta, el reporte llega sin foto.
- Sin ubicación activada no se muestra la flecha hacia la parada (el resto de la app funciona).
