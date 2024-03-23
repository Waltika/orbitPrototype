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
    private libp2pOptionsForIndex = {
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
    private libp2pOptionsForGroups = {
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
    private orbitDBForIndex: any;
    private orbitDBForGroups: any;

    async initialize() {
        console.log("initialize");
        const libp2pForIndex = await createLibp2p(this.libp2pOptionsForIndex);
        const libp2pForGroups = await createLibp2p(this.libp2pOptionsForGroups);

        const blockstoreForIndex = new LevelBlockstore(`./CitizenNotes/ipfs/index`);
        const ipfsForIndex = await createHelia({libp2p: libp2pForIndex, blockstore: blockstoreForIndex});

        const blockstoreForGroups = new LevelBlockstore(`./CitizenNotes/ipfs/groups`);
        const ipfsForGroups = await createHelia({libp2p: libp2pForGroups, blockstore: blockstoreForGroups});

        this.orbitDBForIndex = await createOrbitDB({
            ipfs: ipfsForIndex,
            id: `CitizenNotesIndex`,
            directory: `./CitizenNotes/index`,
        });
        this.orbitDBForGroups = await createOrbitDB({
            ipfs: ipfsForGroups,
            id: `CitizenNotesGroups`,
            directory: `./CitizenNotes/groups`,
        });
        this.index = await this.orbitDBForIndex.open('/orbitdb/zdpuAn3Wy62ymxjrAjDNNsLjdSvumwyqajeiUQrLqxokrdDoB', {type: 'keyvalue'}, {
            AccessController: OrbitDBAccessController({write: ["*"]}),
            replicate: true,
        });
        
        this.index.events.on('replicated', (address: any) => {
            this.logContent();
        });

        console.log("Orbit DB Index address:");
        console.log(this.index.address);
        process.on("SIGINT", async () => {
            console.log("exiting...");

            await this.index.close();
            await this.orbitDBForIndex.stop();
            await this.orbitDBForGroups.stop();
            await ipfsForIndex.stop();
            await ipfsForGroups.stop();
            process.exit(0);
        });

    }

    async logContent() {
        for await (const record of this.index.iterator()) {
            console.log("index element:");
            console.log(record);
            let groupDBHash: string = record.value.toString();
            let groupDB = await this.orbitDBForGroups.open(groupDBHash, {type: 'keyvalue'}, {
                AccessController: OrbitDBAccessController({write: ["*"]}),
                replicate: true,
            });
            for await (const groupRecord of groupDB.iterator()) {
                let groupKey = groupRecord.key;
                console.log(`groupDB element: for ${groupKey}`);
                console.log(groupRecord);
            }
            //groupDB.close();
        }
    }

    async findCitizenNote(annotated: Annotated): Promise<CitizenNote | null> {
        let groupDBHash: string = await this.findGroupDBHash(annotated.group());
        if (groupDBHash === undefined) {
            return null;
        } else {
            let groupDB = await this.orbitDBForGroups.open(groupDBHash, {type: 'keyvalue'}, {
                AccessController: OrbitDBAccessController({write: ["*"]}),
                replicate: true,
            });
            return groupDB.get(annotated.key());
        }

    }

    async addCitizenNote(annotated: Annotated, note: CitizenNote) {
        let groupID = annotated.group();
        try {
            let groupDB = await this.findOrCreateGroupDB(groupID);
            console.log(`Adding note ${annotated.key()} to group ${groupID}`);
            await groupDB.put(annotated.key(), note);
            //await groupDB.close();
        } catch (e) {
            console.error(e);
        }
    }

    private async deleteIfNeeded(groupDB: any, annotated: Annotated) {
        try {
            await groupDB.del(annotated.key());
        } catch (e) {
            console.log(e);
        }
    }

    private async findOrCreateGroupDB(groupID: string) {
        let groupDB;
        let groupDBHash: string = await this.findGroupDBHash(groupID);
        if (groupDBHash === undefined) {
            groupDB = await this.orbitDBForGroups.open(groupID, {type: 'keyvalue'}, {
                AccessController: OrbitDBAccessController({write: ["*"]}),
                replicate: true,
            });
            let address = groupDB.address;
            console.log(`Registering group ${groupID} at address ${address}`);
            this.index.put(groupID, address);
        } else {
            groupDB = await this.orbitDBForGroups.open(groupDBHash, {type: 'keyvalue'}, {
                    AccessController: OrbitDBAccessController({write: ["*"]}),
                    replicate: true,
                }
            );
        }
        return groupDB;
    }

    private async findGroupDBHash(groupID: string) {
        return await this.index.get(groupID);
    }
}
