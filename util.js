import crypto from 'crypto';

let id = null;

function genId() {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from('-AT0001-').copy(id, 0);
  }
  return id;
}

export default { genId };
