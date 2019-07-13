import localForage from 'localforage'
import { BitboxWrapper } from '@/wrapper/BitboxWrapper'

export default class WalletModel {
    public balance: number = 0
    public address: string = ''
    public legacyAddress: string = ''
    public privateKey: string = ''

    private wrapper = new BitboxWrapper()
    private localStorageKey = 'bch-wallet'

    constructor() {
        this.load()
        .then((result) => {
            if (result === null) {
                const account = this.wrapper.createAccount()
                this.address = account.address
                this.legacyAddress = account.legacyAddress
                this.privateKey = account.wif
                this.save()
            } else {
                this.address = result.address
                this.legacyAddress = result.legacyAddress
                this.privateKey = result.privateKey
                this.loadBalance()
                // this.wrapper.send(this.address, 'bchtest:qzsf6kmcdell9ned7yacxhk95q4xektjjuuqc9yx3r', this.privateKey, 0.0001)
            }
        }).catch((error) => {
            console.error(error)
        })
    }

    // save to localStorage
    public async save() {
        return await localForage.setItem(this.localStorageKey, this.toJSON())
    }

    // load from localStorage
    public async load() {
        const result: any = await localForage.getItem(this.localStorageKey)
        if (result !== null) {
            this.address = result.address
            this.privateKey = result.privateKey
        }
        return result
    }

    // load coin balance
    public async loadBalance() {
        this.balance = await this.wrapper.loadBalance(this.address)
        return this.balance
    }

    // send coin
    public async send(toAddress: string, amount: number)  {
        return await this.wrapper.send(this.address, toAddress, this.privateKey, amount)
    }

    public toJSON() {
        return {
            address: this.address,
            legacyAddress: this.legacyAddress,
            privateKey: this.privateKey,
        }
    }
}
