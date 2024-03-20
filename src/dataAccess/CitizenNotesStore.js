import { tcp } from '@libp2p/tcp';
import { identify } from '@libp2p/identify';
import { bootstrap } from '@libp2p/bootstrap';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { mdns } from '@libp2p/mdns';
import { createHelia } from 'helia';
// @ts-ignore
import { createOrbitDB, OrbitDBAccessController } from '@orbitdb/core';
import { createLibp2p } from 'libp2p';
import { LevelBlockstore } from "blockstore-level";
export class CitizenNotesStore {
    libp2pOptions = {
        peerDiscovery: [
            mdns(),
            bootstrap({
                list: [
                    "/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
                    "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                    "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                ]
            })
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
            pubsub: gossipsub({ allowPublishToZeroTopicPeers: true })
        }
    };
    index;
    orbitDB;
    async initialize() {
        const blockstore = new LevelBlockstore(`./ipfs/CitizenNotes`);
        const libp2p = await createLibp2p(this.libp2pOptions);
        const ipfs = await createHelia({ libp2p, blockstore });
        this.orbitDB = await createOrbitDB({
            ipfs,
            id: `CitizenNotes`,
            directory: `./CitizenNotes`,
        });
        this.index = await this.orbitDB.open("CitizenNotesIndex", { type: 'documents' }, {
            AccessController: OrbitDBAccessController({ write: ["*"] }),
            replicate: true,
        });
    }
    async logContent() {
        for await (const record of this.index.iterator()) {
            console.log("index element:");
            console.log(record);
            let groupDB = await this.findOrCreateGroupDB(record.value.doc.toString());
            for await (const groupRecord of groupDB.iterator()) {
                let groupID = groupDB._id;
                console.log(`groupDB element: for ${groupID}`);
                console.log(groupRecord);
            }
        }
    }
    async findCitizenNote(annotated, note) {
        let groupDBHash = await this.findGroupDB(annotated.group());
        if (groupDBHash === undefined) {
            return null;
        }
        else {
            let groupDB = await this.orbitDB.open(groupDBHash, { type: 'documents' });
            return groupDB.get(note.reference);
        }
    }
    async addCitizenNote(annotated, note) {
        let groupID = annotated.group();
        let groupDB = await this.findOrCreateGroupDB(groupID);
        groupDB.put({ _id: annotated.key(), doc: note });
    }
    async findOrCreateGroupDB(groupID) {
        let groupDB;
        let groupDBHash = await this.findGroupDB(groupID);
        if (groupDBHash === undefined) {
            groupDB = await this.orbitDB.open(groupID, { type: 'documents' });
            this.index.put({ _id: groupID, doc: groupDB.address });
        }
        else {
            groupDB = await this.orbitDB.open(groupDBHash, { type: 'documents' });
        }
        return groupDB;
    }
    async findGroupDB(groupID) {
        let groupDBHash = await this.index.get(groupID);
        return groupDBHash;
    }
}
//# sourceMappingURL=CitizenNotesStore.js.map