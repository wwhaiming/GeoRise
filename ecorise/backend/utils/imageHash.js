/* EcoRise — perceptual-free content hash for duplicate-submission detection. */
const crypto = require('crypto');

function imageHash(dataUriOrB64) {
  if (!dataUriOrB64) return null;
  const b64 = dataUriOrB64.includes(',') ? dataUriOrB64.split(',')[1] : dataUriOrB64;
  if (!b64) return null;
  return crypto.createHash('sha256').update(b64).digest('hex');
}

module.exports = { imageHash };
