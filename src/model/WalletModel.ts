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
        // クラス生成時にローカルストレージからアカウント情報を取得
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
                // this.legacyAddress = result.legacyAddress
                this.privateKey = result.privateKey
                this.loadBalance()
                this.wrapper.send(this.address, 'bchtest:qzsf6kmcdell9ned7yacxhk95q4xektjjuuqc9yx3r', this.privateKey, 0.002)
            }
        }).catch((error) => {
            console.error(error)
        })
    }

    // ローカルストレージへ保存
    public async save() {
        return await localForage.setItem(this.localStorageKey, this.toJSON())
    }

    // ローカルストレージから取得
    public async load() {
        const result: any = await localForage.getItem(this.localStorageKey)
        if (result !== null) {
            this.address = result.address
            this.privateKey = result.privateKey
        }
        return result
    }

    public async remove() {
        return await localForage.removeItem(this.localStorageKey)
    }

    public async loadBalance() {
        this.balance = await this.wrapper.loadBalance(this.address)
        return this.balance
    }

    public async sendEth(toAddress: string, amount: number)  {
        // return await this.wrapper.sendEthWithSign(this.address, toAddress, this.privateKey, amount)
    }

    public toJSON() {
        return {
            address: this.address,
            privateKey: this.privateKey,
        }
    }
}
