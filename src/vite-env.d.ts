// Ambient types: Vite client, the IS_VERCEL_BUILD flag and CSS imports.
/// <reference types="vite/client" />

/** True only for builds made on Vercel (see vite.config.ts). */
declare const IS_VERCEL_BUILD: boolean;

declare module '*.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}
