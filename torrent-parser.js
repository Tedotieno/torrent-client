import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';

const BLOCK_LEN = Math.pow(2, 14);

function pieceLen(torrent, pieceIndex) {
  const totalLength = BigInt(this.size(torrent));
  const pieceLength = BigInt(torrent.info['piece length']);

  const lastPieceLength = Number(totalLength % pieceLength);
  const lastPieceIndex = Number(totalLength / pieceLength);

  return lastPieceIndex === pieceIndex ? lastPieceLength : Number(pieceLength);
}

function blocksPerPiece(torrent, pieceIndex) {
  const pieceLength = this.pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / this.BLOCK_LEN);
}

function blockLen(torrent, pieceIndex, blockIndex) {
  const pieceLength = this.pieceLen(torrent, pieceIndex);

  const lastPieceLength = pieceLength % this.BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLength / this.BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : this.BLOCK_LEN;
}

function open(path) {
  return bencode.decode(fs.readFileSync(path));
}

function size(torrent) {
  const size = torrent.info.files
    ? torrent.info.files.reduce((sum, file) => sum + BigInt(file.length), 0n)
    : BigInt(torrent.info.length);

  const hexSize = size.toString(16).padStart(16, '0');
  const buffer = Buffer.from(hexSize, 'hex');
  return buffer.subarray(buffer.byteLength - 8);
}

function infoHash(torrent) {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
}

export default { open, size, infoHash, pieceLen, blocksPerPiece, blockLen };
