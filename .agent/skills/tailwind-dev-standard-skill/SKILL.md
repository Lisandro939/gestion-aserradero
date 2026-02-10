---
name: tailwind-dev-standard
description: Guía de mejores prácticas para el desarrollo con Tailwind CSS. Úsalo para asegurar consistencia visual, evitar valores arbitrarios y optimizar el mantenimiento del diseño.
---

# Tailwind CSS Development Skill

Al desarrollar interfaces con Tailwind, sigue estos principios para mantener el código limpio y el diseño coherente:

---

## Review checklist

1. **Cero Hardcoding**: ¿Se están usando valores arbitrarios tipo `bg-[#f3f3f3]`? Si es así, muévelo a una variable en `tailwind.config.js`.
2. **Uso del Design System**: Asegúrate de que los colores, espaciados (`p-`, `m-`) y tipografías coincidan con los tokens definidos en el tema.
3. **Enfoque Mobile-First**: ¿Se aplicaron primero las clases para móviles y luego los prefijos responsivos (`md:`, `lg:`)?
4. **Orden de Clases**: Mantén un orden lógico (Layout -> Box Model -> Typography -> Visuals -> Interaction). Ayuda mucho usar plugins como `prettier-plugin-tailwindcss`.
5. **Legibilidad**: Si una línea de clases es demasiado larga, evalúa si es momento de extraer un componente de React/Vue o usar un loop.

---

## Reglas de Oro

### 1. Variables sobre Valores Arbitrarios

Evita el uso excesivo de corchetes `[]`. Si un color se repite más de dos veces, **debe** existir en el archivo de configuración.

- **Mal**: `text-[14px] text-[#334455]`
- **Bien**: `text-sm text-brand-dark`

### 2. Evitar la Abstracción Prematura

No uses `@apply` solo porque la lista de clases es larga. Hazlo solo cuando el patrón se repita en múltiples archivos y no sea posible crear un componente reutilizable.

### 3. Clases Dinámicas

Nunca construyas nombres de clase mediante interpolación de strings. Tailwind necesita ver el nombre de la clase completo para generarlo.

- **Mal**: `text-${error ? 'red' : 'blue'}-500`
- **Bien**: `error ? 'text-red-500' : 'text-blue-500'`

---

## Cómo dar feedback en el PR

- **Identifica patrones**: Si ves un color nuevo en el código, pregunta si debería añadirse al tema global.
- **Sugiere utilidad**: Si alguien está usando `w-[50%]`, sugiere `w-1/2`.
- **Prioriza la mantenibilidad**: Recuerda que Tailwind es "utility-first", pero el objetivo final es un sistema de diseño sólido.
