// Stylesheets are imported as text and injected at runtime (see terminal.tsx).
declare module '*.css' {
  const css: string;
  export default css;
}
