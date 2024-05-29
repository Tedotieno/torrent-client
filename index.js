import tracker from './tracker.js';
import torrentParser from './torrent-parser.js';
import download from './download.js';

const torrent = torrentParser.open('example.torrent');

tracker.getPeers(torrent, (peers) => {
  peers.forEach((peer) => download(peer, torrent));
});
