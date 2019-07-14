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
          <v-card-text>{{ wallet.balance }} bch</v-card-text>
          <v-card-title>
            <h3>Address</h3>
          </v-card-title>
          <v-card-text>{{ wallet.address }}</v-card-text>
          <v-card flat>
            <qriously v-model="qrJson" :size=200 />
          </v-card>
        </v-card>
        <v-card flat>
          <v-card-title>
            <h3>Send</h3>
          </v-card-title>
          <v-text-field
            label="Address"
            v-model="toAddr"
            required
            placeholder="ex). bchtest:qqu8yke2c0wylgjpjcdtenrcrylemuc7fsylj0rp9w"
          ></v-text-field>
          <v-text-field
            label="Amount"
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
    private toAmount: number = 0
    private toAddr: string = ''
    private qrJson: string = ''
    private resultMessage: string = ''

    @Watch('wallet.legacyAddress')
    private onValueChange(newValue: string, oldValue: string): void {
      console.log(`watch: ${newValue}, ${oldValue}`)
      this.qrJson = newValue
    }

    private mounted() {
      Vue.prototype.$toast('Hello BitcoinCash Wallet')
    }

    private async loadAccount() {
      this.isLoading = true
      await this.wallet.loadBalance()
      this.isLoading = false
    }

    private async onSend() {
      this.resultMessage = ''
      this.isLoading = true
      try {
        const result = await this.wallet.send(this.toAddr, this.toAmount)
        const message = `SUCCESS\n${result}`
        this.resultMessage = `txHash: ${result}`
        Vue.prototype.$toast(message)
      } catch (error) {
        console.error(error)
        this.resultMessage = `Failed ${error}`
        Vue.prototype.$toast(error)
      }
      this.isLoading = false
    }

}
</script>
<style lang="stylus" scoped>
.wallet
  word-break: break-all

.errorLabel
  color red

</style>
