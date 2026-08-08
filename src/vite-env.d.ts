/// <reference types="vite/client" />

/**
 * Injected by vite.config.ts. Resolved there rather than from import.meta.env
 * because the Vercel shared variable (`MapBoxBluePurple`) isn't VITE_-prefixed
 * and so never reaches client code on its own.
 */
declare const __MAPBOX_TOKEN__: string;
declare const __MAPBOX_STYLE__: string;
