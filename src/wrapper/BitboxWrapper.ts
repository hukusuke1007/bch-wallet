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
        try {
            const transactionBuilder = new this.bitbox.TransactionBuilder(this.network)
            const keyPair = this.bitbox.ECPair.fromWIF(wif)
            const utxoResult = await this.bitbox.Address.utxo(fromAddress)
            if ('utxos' in utxoResult) {
                const toSatoshi = this.bitbox.BitcoinCash.toSatoshi(amount)

                // input
                const utxos = utxoResult.utxos.sort((a, b) => {
                    if (a.satoshis > b.satoshis) { return -1 }
                    if (a.satoshis < b.satoshis) { return 1 }
                    return 0
                })
                console.log('utxos', utxos)
                let utxoSatoshi = 0
                const inputs = []
                for (const item of utxos) {
                    inputs.push(item)
                    utxoSatoshi += item.satoshis
                    transactionBuilder.addInput(item.txid, item.vout)
                    if (toSatoshi < utxoSatoshi) {
                        break
                    }
                }
                console.log('addInput')

                // fee
                const byteCount = this.bitbox.BitcoinCash.getByteCount({ P2PKH: inputs.length }, { P2PKH: 1 })
                const txFee = Math.ceil(byteCount)

                // output
                const remainSatoshi = utxoSatoshi - toSatoshi - txFee
                console.log('sendAmount', amount, utxoSatoshi, remainSatoshi, toSatoshi, txFee)
                transactionBuilder.addOutput(toAddress, toSatoshi)
                transactionBuilder.addOutput(fromAddress, remainSatoshi)
                console.log('addOutput', 'inputs.length', inputs.length)

                // sign
                const redeemScript = undefined
                inputs.forEach((input, index) => {
                  transactionBuilder.sign(
                    index,
                    keyPair,
                    redeemScript,
                    transactionBuilder.hashTypes.SIGHASH_ALL,
                    input.satoshis,
                  )
                })
                const tx = transactionBuilder.build()
                const hex = tx.toHex()
                console.log('sign', tx, hex)
                return await this.bitbox.RawTransactions.sendRawTransaction(hex)
            }
        } catch (error) {
            throw error
        }
    }

}
