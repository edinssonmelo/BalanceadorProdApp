# Contexto técnico

## Stack
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 3** + tailwindcss-animate
- **Zustand 5** + persist (localStorage)
- **lucide-react**, **class-variance-authority**, **clsx**, **tailwind-merge**
- **@radix-ui/react-slot**, **@radix-ui/react-tabs**

## Comandos
```bash
npm run dev    # desarrollo
npm run build  # producción
npm start      # servir build
npm test       # tests del motor (Vitest)
```

## Estructura
```
app/           # rutas Next.js
components/    # UI + views
lib/domain/    # types, engine, defaults, time
lib/store/     # useStore.ts
memory-bank/   # contexto persistente
```

## Persistencia demo
- Key: `balanceador-produccion-v2`
- Migración automática de productos string[] → ProductoPlan[]

## Legacy eliminado
Carpeta `src/` Vite + react-router-dom removida.
