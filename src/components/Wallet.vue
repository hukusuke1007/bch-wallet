<template>
  <div class="wallet">
    <v-flex xs12 sm6 offset-sm3>
    <v-card>
      <v-container fluid>
        <v-card flat>
          <v-card-actions>
            <v-card-title>
              <h3>Balance</h3>
            </v-card-title>
            <v-spacer />
            <v-btn fab small flat @click="loadAccount()" :loading="isLoading"><v-icon>cached</v-icon></v-btn>
          </v-card-actions>
          <v-card-text>{{ wallet.balance }} btc</v-card-text>
          <v-card-title>
            <h3>Address</h3>
          </v-card-title>
          <v-card-text>{{ wallet.address }}</v-card-text>
          <v-card flat>
            <qriously v-model="qrJson" :size="qrSize" />
          </v-card>
        </v-card>
        <v-card flat>
          <div v-for="(item, index) in validation" :key="index" class="errorLabel">
            <div v-if="item!==true">{{ item }}</div>
          </div>
          <v-card-title>
            <h3>Send</h3>
          </v-card-title>
          <v-text-field
            label="To address"
            v-model="toAddr"
            :counter="42"
            required
            placeholder="ex). bchtest:qqu8yke2c0wylgjpjcdtenrcrylemuc7fsylj0rp9w"
          ></v-text-field>
          <v-text-field
            label="ETH"
            v-model="toAmount"
            type="number"
            required
          ></v-text-field>
          <v-flex>
            <v-btn
              color="blue"
              class="white--text"
              @click="onSend()"
              :loading="isLoading"
              :disabled="isLoading">SEND</v-btn>
          </v-flex>
          <v-flex>
            <v-card-title>
              <h3>Result</h3>
            </v-card-title>
            {{ resultMessage }}
          </v-flex>
        </v-card>
      </v-container>
    </v-card>
    </v-flex>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import WalletModel from '@/model/WalletModel'

@Component
export default class Wallet extends Vue {
    private isLoading: boolean = false
    private wallet: WalletModel = new WalletModel()
    private qrSize: number = 200
    private toAmount: number = 0
    private toAddr: string = ''
    private qrJson: string = ''
    private validation: any[] = []
    private resultMessage: string = ''
    private rules: any = {
      senderAddrLimit: (value: string) => (value && (value.length === 42)) || '送金先アドレスは0x含めた42文字です。',
      senderAddrInput: (value: string) => {
        const pattern = /^[a-zA-Z0-9-]+$/
        return pattern.test(value) || '送金先の入力が不正です'
      },
      amountLimit: (value: number) => (value >= 0) || '数量を入力してください',
      amountInput: (value: string) => {
        const pattern = /^[0-9.]+$/
        return (pattern.test(value) && !isNaN(Number(value))) || '数量の入力が不正です'
      },
    }

    @Watch('wallet.legacyAddress')
    private onValueChange(newValue: string, oldValue: string): void {
      console.log(`watch: ${newValue}, ${oldValue}`)
      this.qrJson = newValue
    }

    private mounted() {
      Vue.prototype.$toast('Hello BitcoinCash wallet')
    }

    private async loadAccount() {
      this.isLoading = true
      await this.wallet.loadBalance()
      this.isLoading = false
    }

    private async onSend() {
      if (this.isValidation() === true) {
        console.log('OK')
        this.resultMessage = ''
        this.isLoading = true
        try {
          const result = await this.wallet.sendEth(this.toAddr, this.toAmount)
          let message
          // if (result.status) {
          //   message = `SUCCESS\n${result.transactionHash}`
          //   this.resultMessage = result.transactionHash
          // } else {
          //   message = 'Failed'
          //   this.resultMessage = message
          // }
          this.wallet.loadBalance()
          Vue.prototype.$toast(message)
        } catch (error) {
          console.error(error)
          this.resultMessage = error
          Vue.prototype.$toast(error)
        }
        this.isLoading = false
      }
      console.log(this.isValidation())
    }

    private isValidation(): boolean {
      this.validation = []
      this.validation.push(this.rules.senderAddrLimit(this.toAddr))
      this.validation.push(this.rules.senderAddrInput(this.toAddr))
      this.validation.push(this.rules.amountLimit(this.toAmount))
      this.validation.push(this.rules.amountInput(`${this.toAmount}`))
      const error: any[] = this.validation.filter((obj: any) => obj !== true )
      return (error.length === 0) ? true : false
    }
}
</script>
<style lang="stylus" scoped>
.wallet
  word-break: break-all

.errorLabel
  color red

</style>
