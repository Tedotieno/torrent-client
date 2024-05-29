import net from 'net';
import message from './message';

function download(peer, torrent, requested) {
  const socket = new net.Socket();
  const queue = [];

  socket.on('error', console.error);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  onWholeMsg(socket, (msg) => msgHandler(msg, socket, requested, queue));
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', (recvBuf) => {
    // msgLen calculates the length of a whole message
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.subarray(0, msgLen()));
      savedBuf = Buffer.from(savedBuf.subarray(msgLen()));
      handshake = false;
    }
  });
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString('utf8', 1) === 'BitTorrent protocol'
  );
}

function msgHandler(msg, socket, requested, queue) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
  else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(m.payload, socket, requested, queue);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload, socket, requested, queue);
  }
}

function chokeHandler(socket) {
  socket.end();
}

function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
}

function haveHandler(payload, socket, requested, queue) {
  // we get the index from the payload, check whether index is in requested, if not save piece in requested
  const pieceIndex = payload.readInt32BE(0);
  if (!requested[pieceIndex]) {
    socket.write(message.buildRequest());
  }
  requested[pieceIndex] = true;
}

function bitfieldHandler(payload) {}

function pieceHandler(payload, socket, requested, queue) {
  queue.shift();
  requestPiece(socket, requested, queue);
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.queue.length) {
    const pieceIndex = queue.shift();
    if (pieces.needed(pieceIndex)) {
      // need to fix this
      socket.write(message.buildRequest(pieceIndex));
      pieces.addRequested(pieceIndex);
      break;
    }
  }
}

export default download;
