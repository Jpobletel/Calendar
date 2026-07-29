# Horarios — Planificador de turnos

Aplicación web para crear, organizar, visualizar y descargar horarios de trabajo de varias personas. Pensada para equipos pequeños: **sin backend, sin base de datos externa y sin autenticación**. Todo se guarda en el navegador del dispositivo que estés usando.

## Descripción

Permite administrar varios horarios independientes (por ejemplo "Semana actual", "Semana de verano", "Horario de reemplazos"), cada uno con sus propias personas y turnos. Calcula automáticamente horas trabajadas por día y por semana, detecta turnos superpuestos, soporta turnos que cruzan medianoche, y permite descargar cualquier vista como imagen PNG o imprimirla / guardarla como PDF desde el navegador.

## Características

- Gestión completa de horarios: crear, duplicar, renombrar, eliminar, crear a partir de uno existente.
- Gestión de personas: nombre, color identificador, mostrar/ocultar, buscar, ordenar (manual o alfabético), duplicar con sus turnos, copiar turnos a otra persona.
- Turnos con hora de inicio/término, pausa en minutos, nota y lugar opcional. Soporte para varios turnos por persona el mismo día.
- Turnos que cruzan medianoche (ej. 22:00–06:00), calculados y marcados visualmente como "+1 día".
- Detección de conflictos (turnos superpuestos), incluyendo superposiciones causadas por turnos nocturnos hacia el día siguiente. No bloquea el guardado, solo advierte.
- Cinco vistas: Día, Semana (tabla compacta), Calendario (eje de horas, vista combinada de todas las personas), Personas (tarjetas) y Resumen de horas.
- Cálculo automático de horas diarias, semanales, promedio por día trabajado, primer ingreso y última salida — todo en minutos internamente para evitar errores de redondeo.
- Exportación como imagen PNG (horario combinado, de una persona, de todas las personas, vista diaria o resumen), con orientación, calidad y fondo configurables.
- Impresión / PDF mediante estilos `@media print` dedicados.
- Exportación e importación de datos en JSON, con validación estricta antes de aplicar cambios.
- Guardado automático en `localStorage`, con indicador de estado y botón "Guardar ahora".
- Tema claro, oscuro o según el sistema.
- Diseño mobile-first: usable cómodamente desde 320px de ancho, con navegación inferior en móvil y barra lateral en escritorio.
- Datos de ejemplo incluidos en el primer uso (se pueden eliminar o regenerar).

## Tecnologías

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) (modo `strict`)
- [Tailwind CSS](https://tailwindcss.com/) para estilos
- [Zustand](https://github.com/pmndrs/zustand) para el estado global
- [html-to-image](https://github.com/bubkoo/html-to-image) para exportar vistas como PNG
- [lucide-react](https://lucide.dev/) para iconos
- [Vitest](https://vitest.dev/) para pruebas unitarias
- `localStorage` como única persistencia

No se usa backend, base de datos externa, autenticación, servicios de pago ni variables de entorno privadas.

## Instalación

Requiere Node.js 18 o superior.

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).

## Compilación

```bash
npm run build
```

Genera la versión de producción en `dist/`. También puedes previsualizarla localmente:

```bash
npm run preview
```

## Pruebas

```bash
npm run test        # ejecuta las pruebas una vez
npm run test:watch  # modo watch
```

Las pruebas cubren las utilidades más importantes: conversión de horas, cálculo de turnos normales y nocturnos, descuento de pausas, formato de duración, detección de conflictos, totales diarios/semanales y validación de formularios.

## Despliegue en Vercel

1. Crea el proyecto localmente y verifica que `npm run build` funcione sin errores.
2. Crea un repositorio en GitHub y sube el código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <URL_DE_TU_REPOSITORIO>
   git push -u origin main
   ```
3. En [vercel.com](https://vercel.com), elige **Add New… → Project** e importa el repositorio.
4. Configuración de build (Vercel la detecta automáticamente gracias a `vercel.json`, pero puedes confirmarla):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
5. Publica el proyecto. Cada nuevo `push` a la rama principal genera un despliegue nuevo.

El archivo `vercel.json` incluido reescribe todas las rutas hacia `index.html`, por lo que no hay errores 404 al recargar la página (aunque esta versión no usa React Router, la configuración queda lista por si se agrega enrutamiento en el futuro).

## Estructura del proyecto

```text
src/
  components/
    common/        Botones, modal, toasts, confirmaciones, estados vacíos, etc.
    layout/         Encabezado, barra lateral, navegación móvil, configuración
    schedules/      Selector y formularios de horarios
    people/         Panel de personas, formularios, copiar/duplicar
    shifts/         Formulario de turno, repetir turno
    calendar/       Las 5 vistas: día, semana, calendario, personas
    summaries/      Resumen de horas
    export/         Generación de imágenes, impresión, exportación JSON
    import/         Importación y validación de archivos JSON
  state/            Tienda Zustand y selectores
  storage/          Persistencia en localStorage, migraciones, validación
  data/             Datos y fábricas de ejemplo
  hooks/            Hooks reutilizables (tema, media queries, accesibilidad de modales)
  utils/            Funciones puras: tiempo, conflictos, totales, orden, validación, archivos
  types/            Tipos de TypeScript del modelo de datos
  styles/           Estilos de impresión
```

### ¿Por qué Zustand y no Context/Redux?

La aplicación corre enteramente en el navegador, sin servidor, para un grupo pequeño de usuarios. `useReducer` + Context obliga a envolver la app en providers y hace difícil evitar renders innecesarios a medida que crecen los horarios (hasta 500 turnos). Redux añade ceremonia (acciones, reducers, middleware) que no aporta valor aquí. Zustand ofrece una tienda única con selectores granulares (cada componente solo se vuelve a renderizar cuando el dato que usa cambia de referencia), acciones simples de escribir y probar, y se integra de forma directa con un servicio de persistencia propio.

## Cómo funciona el almacenamiento local

Todos los datos (horarios, personas, turnos, colores, configuración, tema, última vista) se guardan usando `localStorage` bajo la clave versionada `schedule-app-data-v1` (ver `src/storage/storageKeys.ts`). **Los datos nunca se guardan dentro del HTML ni en ningún archivo del proyecto**: se generan y persisten exclusivamente en el navegador, en tiempo de ejecución.

- El guardado es automático después de cada cambio (con una breve espera para agrupar cambios seguidos), y también existe un botón **"Guardar ahora"** para forzarlo.
- El encabezado muestra el estado del guardado ("Guardando…", "Cambios guardados HH:mm" o "Error al guardar").
- Si el contenido guardado está dañado o no se puede interpretar, la aplicación no se rompe: muestra un aviso, permite descargar una copia del contenido original y ofrece restablecer los datos.
- Si `localStorage` no está disponible (por ejemplo, en navegación privada en algunos navegadores), se muestra un aviso permanente y la app sigue funcionando solo en memoria durante esa sesión.
- El campo `version` en los datos guardados permite migrar el formato en el futuro sin perder información (`src/storage/migrations.ts`).

## Importación y exportación de datos

Desde el botón de descarga en el encabezado puedes:

- Exportar **solo el horario actual** o **todos los horarios** como respaldo en JSON.
- Importar un archivo JSON: se valida su estructura, tipos, campos obligatorios, horas, pausas y versión antes de aplicar cualquier cambio. Si el archivo no es válido, se muestra el detalle del error **y tus datos actuales no se modifican**.
- Si el archivo es válido, puedes elegir **agregar** los horarios importados a los existentes (resolviendo automáticamente cualquier ID duplicado) o **reemplazar** todos tus datos — ambas opciones piden confirmación explícita.

## Descarga de imágenes e impresión

El mismo diálogo de descarga permite generar una imagen PNG de: el horario combinado (semana completa), el horario de una persona, el de todas las personas, la vista diaria seleccionada, o el resumen de horas — con orientación vertical/horizontal, calidad normal/alta y fondo claro/oscuro.

Las imágenes se generan a partir de un contenedor **dedicado y oculto** que siempre renderiza el contenido completo (por ejemplo, la semana entera aunque el teléfono esté mostrando solo un día), nunca una captura literal de lo que se ve en pantalla, y nunca incluye botones, menús ni controles de edición.

Para imprimir o guardar como PDF, usa el botón "Imprimir / Guardar PDF": el navegador abre su diálogo de impresión con estilos `@media print` que ocultan toda la interfaz de edición y muestran únicamente el horario.

## Limitaciones

- **Los datos se guardan solo en el navegador y dispositivo actuales.** No se sincronizan automáticamente entre computadores, teléfonos o navegadores distintos.
- Borrar los datos de navegación (caché, cookies y datos de sitios) de tu navegador puede eliminar tus horarios guardados.
- Se recomienda exportar respaldos en JSON periódicamente (botón de exportar) para no perder información.
- No existe backend ni servidor: toda la lógica corre en tu navegador.
- No existe una cuenta de usuario ni inicio de sesión.
- No existe almacenamiento en la nube ni sincronización entre dispositivos.
- La aplicación no interpreta contratos laborales ni determina si una cantidad de horas es correcta o incorrecta: solo calcula y muestra los totales.
