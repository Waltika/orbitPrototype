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
import { GroupDBProvider } from "./GroupDBProvider.js";
export class CitizenNotesStore {
    libp2pOptionsForIndex = {
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
    libp2pOptionsForGroups = {
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
    orbitDBForIndex;
    orbitDBForGroups;
    groupDBProvider = null;
    async initialize(processNumber) {
        let folderName;
        let indexOrbitID;
        let groupOrbitID;
        if (processNumber === '0') {
            folderName = 'CitizenNotes';
            indexOrbitID = 'CitizenNotesIndex';
            groupOrbitID = 'CitizenNotesGroup';
        }
        else {
            folderName = 'CitizenNotes_' + processNumber;
            indexOrbitID = 'CitizenNotesIndex' + processNumber;
            groupOrbitID = 'CitizenNotesGroup' + processNumber;
        }
        console.log("initialize");
        const libp2pForIndex = await createLibp2p(this.libp2pOptionsForIndex);
        const libp2pForGroups = await createLibp2p(this.libp2pOptionsForGroups);
        const blockstoreForIndex = new LevelBlockstore(`./${folderName}/ipfs/index`);
        const ipfsForIndex = await createHelia({ libp2p: libp2pForIndex, blockstore: blockstoreForIndex });
        const blockstoreForGroups = new LevelBlockstore(`./${folderName}/ipfs/groups`);
        const ipfsForGroups = await createHelia({ libp2p: libp2pForGroups, blockstore: blockstoreForGroups });
        this.orbitDBForIndex = await createOrbitDB({
            ipfs: ipfsForIndex,
            id: indexOrbitID,
            directory: `./${folderName}/index`,
        });
        this.orbitDBForGroups = await createOrbitDB({
            ipfs: ipfsForGroups,
            id: groupOrbitID,
            directory: `./${folderName}/groups`,
        });
        this.groupDBProvider = new GroupDBProvider(this.orbitDBForGroups);
        this.index = await this.orbitDBForIndex.open('/orbitdb/zdpuAtRYGYACCPsyAuMCQ7EpikYtiAqNpb22cRn9EfYezEwVN', {
            type: 'keyvalue'
        }, {
            AccessController: OrbitDBAccessController({ write: ["*"] }),
            replicate: true,
        });
        this.index.events.on('update', (entry) => {
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
            await ipfsForIndex.stop();
            await ipfsForGroups.stop();
            process.exit(0);
        });
    }
    async logContent() {
        console.log("index DB:");
        for await (const record of this.index.iterator()) {
            console.log("index element:");
            console.log(record);
            let groupDBHash = record.value.toString();
            let groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
            console.log("group DB:");
            for await (const groupRecord of groupDB.iterator()) {
                let groupKey = groupRecord.key;
                console.log(`groupDB element: for ${groupKey}`);
                console.log(groupRecord);
            }
        }
    }
    async findCitizenNote(annotated) {
        let groupDBHash = await this.findGroupDBHash(annotated.group());
        if (groupDBHash === undefined) {
            return null;
        }
        else {
            let groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
            return groupDB.get(annotated.key());
        }
    }
    async addCitizenNote(annotated, note) {
        let groupID = annotated.group();
        try {
            let groupDB = await this.findOrCreateGroupDB(groupID);
            console.log(`Adding note ${note.reference} to ${annotated.key()} (group ${groupID})`);
            await groupDB.put(annotated.key(), note);
        }
        catch (e) {
            console.error(e);
        }
    }
    async deleteIfNeeded(groupDB, annotated) {
        try {
            await groupDB.del(annotated.key());
        }
        catch (e) {
            console.log(e);
        }
    }
    async findOrCreateGroupDB(groupID) {
        let groupDB;
        let groupDBHash = await this.findGroupDBHash(groupID);
        if (groupDBHash === undefined) {
            groupDB = await this.groupDBProvider?.createGroupDB(groupID);
            let address = groupDB.address;
            console.log(`Registering group ${groupID} at address ${address}`);
            this.index.put(groupID, address);
        }
        else {
            groupDB = await this.groupDBProvider?.getGroupDB(groupDBHash);
        }
        return groupDB;
    }
    async findGroupDBHash(groupID) {
        return await this.index.get(groupID);
    }
    async clearAll() {
        let i = 0;
        for await (const record of this.index.iterator()) {
            let groupDBHash = record.value.toString();
            this.index.del(groupDBHash);
            // The rest will be garbage collected we hope
            i++;
        }
        console.log(`Removed ${i} entries from index`);
    }
}
//# sourceMappingURL=CitizenNotesStore.js.map