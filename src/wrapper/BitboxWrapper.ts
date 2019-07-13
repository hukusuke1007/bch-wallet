import { BITBOX, tresturl, resturl } from 'bitbox-sdk'

export type Account = {
    address: string,
    legacyAddress: string,
    wif: string,
}

export class BitboxWrapper {
    public host: string
    public network: string
    public bitbox: BITBOX

    constructor() {
        if (process.env.NETWORK === 'mainnet') {
            this.host = resturl
            this.network = 'mainnet'
        } else {
            this.host = tresturl
            this.network = 'testnet'
        }
        this.bitbox = new BITBOX({restURL: this.host})
    }

    public createAccount(): Account {
        const mnemonic = this.bitbox.Mnemonic.generate(256)
        const rootSeed = this.bitbox.Mnemonic.toSeed(mnemonic)
        const masterHDNode = this.bitbox.HDNode.fromSeed(rootSeed, this.network)
        const address = this.bitbox.ECPair.toCashAddress(masterHDNode.keyPair)
        const legacyAddress = this.bitbox.ECPair.toLegacyAddress(masterHDNode.keyPair)
        const wif = this.bitbox.ECPair.toWIF(masterHDNode.keyPair)
        return  {
            address,
            legacyAddress,
            wif,
        }
    }

    public async loadBalance(address: string): Promise<number> {
        try {
            const details = await this.loadDetail(address)
            return 'balance' in details ? details.balance : 0
        } catch (error) {
            throw error
        }
    }

    public async loadDetail(address: string) {
        try {
            const details = await this.bitbox.Address.details(address)
            console.log('loadDetail', details)
            return details
        } catch (error) {
            throw error
        }
    }

    public async send(fromAddress: string, toAddress: string, wif: string, amount: number): Promise<any> {
        let result: any
        try {
            const transactionBuilder = new this.bitbox.TransactionBuilder(this.network)
            const keyPair = this.bitbox.ECPair.fromWIF(wif)
            console.log('transactionBuilder', transactionBuilder)
            const utxoResult = await this.bitbox.Address.utxo(fromAddress)
            console.log('utxo', utxoResult)
            if ('utxos' in utxoResult) {
                const utxo = utxoResult.utxos[0]
                const utxoAmount = utxo.satoshis

                // input
                transactionBuilder.addInput(utxo.txid, utxo.vout)
                console.log('addInput')

                // fee
                const byteCount = this.bitbox.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 })
                const sendAmount = utxoAmount - byteCount
                const toAmount = this.bitbox.BitcoinCash.toSatoshi(amount)
                console.log('sendAmount', amount, utxoAmount, sendAmount, toAmount, byteCount)

                // output
                transactionBuilder.addOutput(toAddress, toAmount)
                transactionBuilder.addOutput(fromAddress, sendAmount - amount)
                console.log('addOutput')

                const redeemScript = undefined
                transactionBuilder.sign(0, keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, utxoAmount)
                const tx = transactionBuilder.build()
                const hex = tx.toHex()
                console.log('tx', tx, hex)
                result = await this.bitbox.RawTransactions.sendRawTransaction(hex)
                console.log('result', result)
            }
        } catch (error) {
            console.error(error)
            throw error
        }
        return result
    }

}
