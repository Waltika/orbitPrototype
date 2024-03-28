import { createHelia } from 'helia';
// @ts-ignore
import { createOrbitDB, OrbitDBAccessController } from '@orbitdb/core';
import { createLibp2p } from 'libp2p';
import { LevelBlockstore } from "blockstore-level";
import { GroupDBProvider } from "./GroupDBProvider.js";
import { CitizenNotesConfig } from "../config/CitizenNotesConfig.js";
export class CitizenNotesStore {
    index;
    orbitDBForIndex;
    orbitDBForGroups;
    groupDBProvider = null;
    ipfs;
    name;
    constructor(name) {
        this.name = name;
    }
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
        const libp2p = await createLibp2p(CitizenNotesConfig.libp2pOptions);
        const blockstore = new LevelBlockstore(`./${folderName}/ipfs/all`);
        this.ipfs = await createHelia({ libp2p: libp2p, blockstore: blockstore });
        this.orbitDBForIndex = await createOrbitDB({
            ipfs: this.ipfs,
            id: indexOrbitID,
            directory: `./${folderName}/index`,
        });
        this.orbitDBForGroups = await createOrbitDB({
            ipfs: this.ipfs,
            id: groupOrbitID,
            directory: `./${folderName}/groups`,
        });
        this.groupDBProvider = new GroupDBProvider(this.orbitDBForGroups);
        this.index = await this.orbitDBForIndex.open(this.name, {
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
    }
    async stop() {
        console.log("stopping CitizenNotesStore...");
        await this.groupDBProvider?.closeAll();
        await this.index.close();
        await this.orbitDBForIndex.stop();
        await this.orbitDBForGroups.stop();
        await this.ipfs.stop();
        process.exit(0);
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
            await this.index.del(groupDBHash);
            // The rest will be garbage collected we hope
            i++;
        }
        console.log(`Removed ${i} entries from index`);
    }
}
//# sourceMappingURL=CitizenNotesStore.js.map