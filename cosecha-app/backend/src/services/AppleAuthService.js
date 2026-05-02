/**
 * Verificación de Apple Identity Tokens.
 *
 * Apple Sign In usa JWTs firmados con RS256.
 * Las claves públicas se obtienen de https://appleid.apple.com/auth/keys
 * y se cachean por 24 horas.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let cachedKeys = null;
let cacheTimestamp = 0;

/**
 * Obtiene las claves públicas de Apple (con cache).
 */
async function getApplePublicKeys() {
  const now = Date.now();
  if (cachedKeys && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedKeys;
  }

  const response = await fetch(APPLE_KEYS_URL);
  if (!response.ok) {
    throw new Error('No se pudieron obtener las claves de Apple');
  }

  const data = await response.json();
  cachedKeys = data.keys;
  cacheTimestamp = now;
  return cachedKeys;
}

/**
 * Convierte una JWK (JSON Web Key) de Apple a formato PEM.
 */
function jwkToPem(jwk) {
  const n = Buffer.from(jwk.n, 'base64url');
  const e = Buffer.from(jwk.e, 'base64url');

  // Construir DER para RSA public key
  const nHeader = n[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), n]) : n;
  const eHeader = e[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), e]) : e;

  function encodeDERLength(length) {
    if (length < 128) return Buffer.from([length]);
    if (length < 256) return Buffer.from([0x81, length]);
    return Buffer.from([0x82, (length >> 8) & 0xff, length & 0xff]);
  }

  function encodeDERSequence(buffers) {
    const content = Buffer.concat(buffers);
    return Buffer.concat([Buffer.from([0x30]), encodeDERLength(content.length), content]);
  }

  function encodeDERInteger(buf) {
    return Buffer.concat([Buffer.from([0x02]), encodeDERLength(buf.length), buf]);
  }

  function encodeDERBitString(buf) {
    return Buffer.concat([Buffer.from([0x03]), encodeDERLength(buf.length + 1), Buffer.from([0x00]), buf]);
  }

  // RSA OID: 1.2.840.113549.1.1.1
  const rsaOid = Buffer.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);

  const pubKeySequence = encodeDERSequence([
    encodeDERInteger(nHeader),
    encodeDERInteger(eHeader),
  ]);

  const fullSequence = encodeDERSequence([
    rsaOid,
    encodeDERBitString(pubKeySequence),
  ]);

  const pem = `-----BEGIN PUBLIC KEY-----\n${fullSequence.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  return pem;
}

/**
 * Verifica un Apple identity token.
 *
 * @param {string} identityToken - JWT de Apple
 * @param {string} clientId - Bundle ID de tu app (o Services ID para web)
 * @returns {{ sub, email, email_verified, name }} Payload verificado
 */
async function verifyAppleToken(identityToken, clientId) {
  // Decodificar header sin verificar para obtener kid
  const header = JSON.parse(
    Buffer.from(identityToken.split('.')[0], 'base64url').toString()
  );

  const keys = await getApplePublicKeys();
  const matchingKey = keys.find((k) => k.kid === header.kid);

  if (!matchingKey) {
    throw new Error('Clave de Apple no encontrada para kid: ' + header.kid);
  }

  const publicKey = jwkToPem(matchingKey);

  const payload = jwt.verify(identityToken, publicKey, {
    algorithms: ['RS256'],
    issuer: APPLE_ISSUER,
    audience: clientId,
  });

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified === 'true' || payload.email_verified === true,
  };
}

module.exports = { verifyAppleToken };
