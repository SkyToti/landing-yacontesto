import type { ComponentType } from "react";
import type { SlugGuia } from "@/lib/guias";
import { SecretariaRecepcionistaIA } from "./SecretariaRecepcionistaIA";

/** El texto de cada guía, por su slug. TypeScript no compila si una guía de lib/guias.ts se queda sin cuerpo. */
export const CUERPOS: Record<SlugGuia, ComponentType> = {
  "secretaria-recepcionista-ia-dentistas": SecretariaRecepcionistaIA,
};
