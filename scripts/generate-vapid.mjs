import { webcrypto } from "node:crypto";

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);

const pub = await webcrypto.subtle.exportKey("jwk", publicKey);
const priv = await webcrypto.subtle.exportKey("jwk", privateKey);
const x = Buffer.from(pub.x, "base64url");
const y = Buffer.from(pub.y, "base64url");
const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y]);

console.log(`VAPID_PUBLIC_KEY=${b64url(uncompressed)}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
