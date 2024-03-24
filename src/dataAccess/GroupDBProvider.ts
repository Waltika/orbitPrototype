// @ts-ignore
import {OrbitDBAccessController} from '@orbitdb/core'

export class GroupDBProvider {
    private map = new Map<string, any>;
    private orbitDBInstance: any;

    constructor(orbitDBInstance: any) {
        this.orbitDBInstance = orbitDBInstance;
    }

    async createGroupDB(groupID: string): Promise<any> {
        let result = await this.orbitDBInstance.open(groupID, {
            type: 'keyvalue'
        }, {
            AccessController: OrbitDBAccessController({write: ["*"]}),
            replicate: true,
        });
        this.map.set(result.address, result);
        return result;
    }

    async getGroupDB(hash: string): Promise<any> {
        let result = this.map.get(hash);
        if (result === undefined) {
            result = await this.orbitDBInstance.open(hash, {
                type: 'keyvalue'
            }, {
                AccessController: OrbitDBAccessController({write: ["*"]}),
                replicate: true,
            });
            this.map.set(result.address, result);
        }
        result.events.on('update', (entry: any) => {
            console.log('Group DB Change:');
            console.log(entry.payload);
        });

        return result;
    }

    async closeAll() {
        this.map.forEach(value => value.close());
    }
}
