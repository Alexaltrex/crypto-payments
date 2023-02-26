import {action, makeObservable, observable} from "mobx";

export class CryptoStore {
    connecting: boolean = false; // подключение к аккаунту Metamask
    currentAccountAddress: string | null = null;
    balance: string | null = null;

    constructor() {
        makeObservable(this, {
            connecting: observable,
            currentAccountAddress: observable,
            balance: observable,

            setConnecting: action.bound,
            setCurrentAccountAddress: action.bound,
            setBalance: action.bound,
        })
    }

    setConnecting(connecting: boolean) {
        this.connecting = connecting
    }

    setCurrentAccountAddress(currentAccountAddress: string | null) {
        this.currentAccountAddress = currentAccountAddress;
    }

    setBalance(balance: string | null) {
        this.balance = balance
    }
}
