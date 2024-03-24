// @ts-ignore
import { OrbitDBAccessController } from '@orbitdb/core';
export class GroupDBProvider {
    map = new Map;
    orbitDBInstance;
    constructor(orbitDBInstance) {
        this.orbitDBInstance = orbitDBInstance;
    }
    async createGroupDB(groupID) {
        let result = await this.orbitDBInstance.open(groupID, {
            type: 'keyvalue'
        }, {
            AccessController: OrbitDBAccessController({ write: ["*"] }),
            replicate: true,
        });
        this.map.set(result.address, result);
        return result;
    }
    async getGroupDB(hash) {
        let result = this.map.get(hash);
        if (result === undefined) {
            result = await this.orbitDBInstance.open(hash, {
                type: 'keyvalue'
            }, {
                AccessController: OrbitDBAccessController({ write: ["*"] }),
                replicate: true,
            });
            this.map.set(result.address, result);
        }
        result.events.on('update', (entry) => {
            console.log('Group DB Change:');
            console.log(entry.payload);
        });
        return result;
    }
    async closeAll() {
        this.map.forEach(value => value.close());
    }
}
//# sourceMappingURL=GroupDBProvider.js.map