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
import {GroupDBProvider} from "./GroupDBProvider.js";


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
            pubsub: gossipsub({allowPublishToZeroTopicPeers: true, emitSelf: true})
        }
    };

    private index: any;
    private orbitDBForIndex: any;
    private orbitDBForGroups: any;
    private groupDBProvider: GroupDBProvider | null = null;

    async initialize(processNumber: string) {
        let folderName: string;
        let indexOrbitID: string;
        let groupOrbitID: string;
        if (processNumber === '0') {
            folderName = 'CitizenNotes';
            indexOrbitID = 'CitizenNotesIndex';
            groupOrbitID = 'CitizenNotesGroup';
        } else {
            folderName = 'CitizenNotes_' + processNumber;
            indexOrbitID = 'CitizenNotesIndex' + processNumber;
            groupOrbitID = 'CitizenNotesGroup' + processNumber;
        }

        console.log("initialize");
        const libp2p = await createLibp2p(this.libp2pOptions);

        const blockstore = new LevelBlockstore(`./${folderName}/ipfs/all`);
        const ipfs = await createHelia({libp2p: libp2p, blockstore: blockstore});


        this.orbitDBForIndex = await createOrbitDB({
            ipfs: ipfs,
            id: indexOrbitID,
            directory: `./${folderName}/index`,
        });
        this.orbitDBForGroups = await createOrbitDB({
            ipfs: ipfs,
            id: groupOrbitID,
            directory: `./${folderName}/groups`,
        });

        this.groupDBProvider = new GroupDBProvider(this.orbitDBForGroups);

        this.index = await this.orbitDBForIndex.open('/orbitdb/zdpuAqQPmjnCQ556NKJbc7fe6D2tYjRDxkXnBSqj78iPmP45t', {
            type: 'keyvalue'
        }, {
            AccessController: OrbitDBAccessController({write: ["*"]}),
            replicate: true,
        });

        this.index.events.on('update', (entry: any) => {
            console.log('Index Change:');
            console.log(entry.payload);
        });

        console.log("Orbit DB Index address:");
        console.log(this.index.address);
        process.on("SIGINT", async () => {
            await this.logContent();
            console.log("exiting...");
            await this.groupDBProvider?.closeAll();
            await this.index.close();
            await this.orbitDBForIndex.stop();
            await this.orbitDBForGroups.stop();
            await ipfs.stop();
            process.exit(0);
        });

    }

    async logContent() {
        console.log("index DB:");
        for await (const record of this.index.iterator()) {
            console.log("index element:");
            console.log(record);
            let groupDBHash: string = record.value.toString();
            let groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
            console.log("group DB:");
            for await (const groupRecord of groupDB.iterator()) {
                let groupKey = groupRecord.key;
                console.log(`groupDB element: for ${groupKey}`);
                console.log(groupRecord);
            }
        }
    }

    async findCitizenNote(annotated: Annotated): Promise<CitizenNote | null> {
        let groupDBHash: string = await this.findGroupDBHash(annotated.group());
        if (groupDBHash === undefined) {
            return null;
        } else {
            let groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
            return groupDB.get(annotated.key());
        }

    }

    async addCitizenNote(annotated: Annotated, note: CitizenNote) {
        let groupID = annotated.group();
        try {
            let groupDB = await this.findOrCreateGroupDB(groupID);
            console.log(`Adding note ${note.reference} to ${annotated.key()} (group ${groupID})`);
            await groupDB.put(annotated.key(), note);
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
            groupDB = await this.groupDBProvider?.createGroupDB(groupID);
            let address = groupDB.address;
            console.log(`Registering group ${groupID} at address ${address}`);
            this.index.put(groupID, address);
        } else {
            groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
        }

        return groupDB;
    }

    private async findGroupDBHash(groupID: string) {
        return await this.index.get(groupID);
    }

    async clearAll() {
        let i: number = 0;
        for await (const record of this.index.iterator()) {
            let groupDBHash: string = record.value.toString();
            this.index.del(groupDBHash);
            // The rest will be garbage collected we hope
            i++;
        }
        console.log(`Removed ${i} entries from index`);
    }
}
