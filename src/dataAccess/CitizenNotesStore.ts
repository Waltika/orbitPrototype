import {CitizenNote} from "../model/CitizenNote";

import {tcp} from '@libp2p/tcp';
import {identify} from '@libp2p/identify';
import {bootstrap} from '@libp2p/bootstrap';
import {gossipsub} from '@chainsafe/libp2p-gossipsub'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {mdns} from '@libp2p/mdns'
import {createHelia} from 'helia'
// @ts-ignore
import {createOrbitDB, OrbitDBAccessController} from '@orbitdb/core'
import {createLibp2p} from 'libp2p'
import {LevelBlockstore} from "blockstore-level";
import {Annotated} from "../model/Annotated";


export class CitizenNotesStore {
    private libp2pOptions = {
        peerDiscovery: [
            mdns(),
            bootstrap({
                    list: [ // A list of bootstrap peers to connect to starting up the node
                        "/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
                        "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                        "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                    ]
                }
            )
        ],
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [
            tcp()
        ],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            identify: identify(),
            pubsub: gossipsub({allowPublishToZeroTopicPeers: true})
        }
    };
    private index: any;
    private orbitDB: any;

    async initialize() {
        const blockstore = new LevelBlockstore(`./ipfs/CitizenNotes`);

        const libp2p = await createLibp2p(this.libp2pOptions);

        const ipfs = await createHelia({libp2p, blockstore});

        this.orbitDB = await createOrbitDB({
            ipfs,
            id: `CitizenNotes`,
            directory: `./CitizenNotes`,
        });
        this.index = await this.orbitDB.open("CitizenNotesIndex", {type: 'documents'}, {
            AccessController: OrbitDBAccessController({write: ["*"]}),
            replicate: true,
        });
    }

    async findCitizenNote(annotated: Annotated, note: CitizenNote) {
        return null; // TODO: Implement
    }

    async addCitizenNote(annotated: Annotated, note: CitizenNote) {
        let hash = await this.index.get(annotated.key());
        let db;
        if (hash === undefined) {
            db = await this.orbitDB.open(annotated.key(), {type: 'documents'});
            this.index.put({_id: annotated.key(), doc: db.address});
        } else {
            db = await this.orbitDB.open(hash, {type: 'documents'});
        }
        db.put({_id: note.reference, doc: note.note});
    }

}
