// @ts-ignore
import {OrbitDBAccessController} from '@orbitdb/core'

export class GroupDBProvider {
    private map = new Map<string, any>;
    private orbitDBInstance: any;
    private logOnEvent: boolean = true;

    constructor(orbitDBInstance: any) {
        this.orbitDBInstance = orbitDBInstance;
    }

    async createGroupDB(groupID: string): Promise<any> {
        console.log(`creating Group DB for ID ${groupID}`);
        let result = null;
        try {
            result = await this.orbitDBInstance.open(groupID, {
                type: 'keyvalue'
            }, {
                AccessController: OrbitDBAccessController({write: ["*"]}),
                replicate: true,
            });
            this.registerHandlers(result);

            this.map.set(result.address, result);
        } catch (e) {
            console.log(`Group DB with ID ${groupID} couldn't be created`);
        }
        return result;
    }

    private registerHandlers(result: any) {
        console.log('Registering update / delete/ close callbacks on Group DB');
        result.events.on('update', (entry: any) => {
            if (this.logOnEvent) {
                console.log('Group DB Update:');
                console.log(entry.payload);
            }
        });

        result.events.on('delete', (entry: any) => {
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

    public disableLogOnEvent() {
        this.logOnEvent = false;
    }

    async getGroupDB(hash: string): Promise<any> {
        let result = this.map.get(hash);
        if (result === undefined) {
            try {
                result = await this.orbitDBInstance.open(hash, {
                    type: 'keyvalue'
                }, {
                    AccessController: OrbitDBAccessController({write: ["*"]}),
                    replicate: true,
                });
                this.registerHandlers(result);
                this.map.set(result.address, result);
            } catch (e) {
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
