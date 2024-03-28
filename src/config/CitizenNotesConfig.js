import { bootstrap } from "@libp2p/bootstrap";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import { webRTC } from "@libp2p/webrtc";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { kadDHT } from "@libp2p/kad-dht";
import { identify } from "@libp2p/identify";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
export class CitizenNotesConfig {
    static libp2pOptions = {
        peerDiscovery: [bootstrap({
                list: [
                    "/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
                    "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                    "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                ],
                timeout: 1000,
                tagName: 'bootstrap',
                tagValue: 50,
                tagTTL: 120000 // in ms
            }),
            mdns()],
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp(), webSockets(), webTransport(), webRTC()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            dht: kadDHT({
            // DHT options
            }),
            identify: identify(),
            pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: true })
        }
    };
}
//# sourceMappingURL=CitizenNotesConfig.js.map