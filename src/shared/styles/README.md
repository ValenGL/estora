# Sistema de Variables CSS Globales

Este directorio contiene las variables globales de estilos del proyecto Estora, implementadas como variables CSS en `:root` para acceso global sin dependencias.

## 🎨 **Colores Disponibles**

### **Colores Estora**

- `--estora-white: #fafafa` - Blanco principal
- `--estora-super: #cde7df` - Verde super claro
- `--estora-special: #39eeb3` - Verde especial
- `--estora-alternative: #ddb6c2` - Rosa alternativo
- `--estora-gray: #5d6a66` - Gris
- `--estora-dark: #19332b` - Verde oscuro
- `--estora-black: #0a1310` - Negro principal
- `--estora-light: #326555` - Verde claro
- `--estora-primary: #214338` - Verde primario
- `--estora-secondary: #43212c` - Rosa secundario

### **Colores Neutrales**

- `--neutral-white: #ffffff` - Blanco puro
- `--neutral-black: #000000` - Negro puro
- `--neutral-danger: darkred` - Rojo de peligro
- `--neutral-disabled: #7e7e7e` - Gris deshabilitado

## 🚀 **Uso Directo (Recomendado)**

```css
/* En cualquier archivo CSS/SCSS */
.mi-componente {
  background-color: var(--estora-primary);
  color: var(--estora-white);
  border: 1px solid var(--estora-dark);
}
```

## 💻 **Uso desde JavaScript**

```javascript
// Obtener un color
const primaryColor = getComputedStyle(
  document.documentElement
).getPropertyValue("--estora-primary");

// Cambiar un color dinámicamente
document.documentElement.style.setProperty("--estora-primary", "#new-color");

// Usar en estilos inline
element.style.backgroundColor = "var(--estora-primary)";
```

## 🎯 **Clases de Utilidad Generadas**

El sistema también genera automáticamente clases de utilidad:

```html
<!-- Fondos -->
<div class="u-bgcolor-estora-primary">Fondo verde</div>
<div class="u-bgcolor-estora-white">Fondo blanco</div>

<!-- Texto -->
<span class="u-color-estora-dark">Texto verde oscuro</span>
<span class="u-color-estora-white">Texto blanco</span>
```
