import {CryptoStore} from "./CryptoStore";
import {AppStore} from "./AppStore";

export class RootStore {
    cryptoStore: CryptoStore;
    appStore: AppStore

    constructor() {
        this.cryptoStore = new CryptoStore();
        this.appStore = new AppStore()
    }
}

export const rootStore = new RootStore()
