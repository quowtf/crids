# Concentration Grids — registro de entrenamiento

App para entrenar atención y búsqueda visual con *Concentration Grids* y registrar
tiempo/errores por sesión. MVP: registro de usuarios + Grid L1 (00 → 99) + historial.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** — Postgres + Auth (registro por email con confirmación)
- **Recharts** — gráficas de progreso
- Deploy en **Vercel**

## Estructura

```
src/
  app/
    (auth)/login, (auth)/register   # login y registro (server actions)
    auth/callback                   # confirmación de email
    auth/signout                    # cerrar sesión
    train/                          # sesión de grid + guardado
    history/                        # historial + gráfica
  components/                       # GridL1, TrainSession, HistoryChart, NavBar
  lib/
    grid.ts                         # lógica del grid L1
    types.ts                        # tipos compartidos
    supabase/{client,server,middleware}.ts
  proxy.ts                          # refresco de sesión + protección de rutas
supabase/schema.sql                 # tablas + RLS
```

## Configuración

### 1. Crear proyecto Supabase

1. Crea un proyecto en https://supabase.com
2. **SQL Editor > New query**: pega y ejecuta `supabase/schema.sql`.
3. **Authentication > Providers > Email**: deja habilitado "Confirm email"
   (así el registro exige confirmar el correo antes de iniciar sesión).
4. **Authentication > URL Configuration**: añade tu URL de sitio y a
   *Redirect URLs* agrega `http://localhost:3000/auth/callback` y, en producción,
   `https://TU-APP.vercel.app/auth/callback`.

### 2. Variables de entorno

Copia el ejemplo y rellena con tus valores (Project Settings > API):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login`. Regístrate en `/register`,
confirma el correo, entra y entrena.

## Deploy en Vercel

1. Sube el repo a GitHub (raíz del proyecto = carpeta `crids-app`).
2. En Vercel, importa el repo. Root Directory = `crids-app` si el repo tiene la
   carpeta anidada.
3. Añade las tres variables de entorno en **Settings > Environment Variables**.
   Usa `NEXT_PUBLIC_SITE_URL=https://TU-APP.vercel.app`.
4. Actualiza las *Redirect URLs* de Supabase con el dominio de Vercel.
5. Deploy.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint

## Notas del MVP

- **Solo Grid L1** (búsqueda 00 → 99). Los niveles L2–L7 del protocolo (carga
  visual, alternancia, número+letra, regla cambiante, distractores, memoria) y las
  pruebas de transferencia quedan para siguientes iteraciones.
- Cada grid usa una distribución **aleatoria nueva** para evitar memorizar patrones.
- Los datos están aislados por usuario mediante **RLS** en Supabase.
```
