// @ts-ignore
import { OrbitDBAccessController } from '@orbitdb/core';
export class GroupDBProvider {
    map = new Map;
    orbitDBInstance;
    logOnEvent = true;
    constructor(orbitDBInstance) {
        this.orbitDBInstance = orbitDBInstance;
    }
    async createGroupDB(groupID) {
        console.log(`creating Group DB for ID ${groupID}`);
        let result = null;
        try {
            result = await this.orbitDBInstance.open(groupID, {
                type: 'keyvalue'
            }, {
                AccessController: OrbitDBAccessController({ write: ["*"] }),
                replicate: true,
            });
            this.registerHandlers(result);
            this.map.set(result.address, result);
        }
        catch (e) {
            console.log(`Group DB with ID ${groupID} couldn't be created`);
        }
        return result;
    }
    registerHandlers(result) {
        console.log('Registering update / delete/ close callbacks on Group DB');
        result.events.on('update', (entry) => {
            if (this.logOnEvent) {
                console.log('Group DB Update:');
                console.log(entry.payload);
            }
        });
        result.events.on('delete', (entry) => {
            if (this.logOnEvent) {
                console.log('Group DB Delete:');
                console.log(entry.payload);
            }
        });
        result.events.on('close', () => {
            if (this.logOnEvent) {
                console.log(`Closing Group DB:${result.address}`);
            }
        });
    }
    disableLogOnEvent() {
        this.logOnEvent = false;
    }
    async getGroupDB(hash) {
        let result = this.map.get(hash);
        if (result === undefined) {
            try {
                result = await this.orbitDBInstance.open(hash, {
                    type: 'keyvalue'
                }, {
                    AccessController: OrbitDBAccessController({ write: ["*"] }),
                    replicate: true,
                });
                this.registerHandlers(result);
                this.map.set(result.address, result);
            }
            catch (e) {
                console.log(`Group DB with hash ${hash} couldn't be opened`);
            }
            console.log(`Returning Group DB ${result}`);
        }
        return result;
    }
    async closeAll() {
        this.map.forEach(value => value.close());
    }
}
//# sourceMappingURL=GroupDBProvider.js.map