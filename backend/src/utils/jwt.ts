// Normaliza la importación de jsonwebtoken para evitar "jwt.sign is not a function"
import * as JWTMod from 'jsonwebtoken';

// Si el bundler expone default, úsalo; si no, usa el módulo como objeto.
export const jwt = (JWTMod as any).default ?? (JWTMod as any);

// Tipos útiles (opcional)
export type JwtSign = typeof JWTMod.sign;
export type JwtVerify = typeof JWTMod.verify;
