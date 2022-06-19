import type { NextPage } from 'next'
import { SendNft } from '../components/SendNft'
import { SendSol } from '../components/SendSol'
import { Wallet } from '../components/Wallet'

const Home: NextPage = () => {
  return (
    <Wallet>
      <SendNft />
    </Wallet>
  )
}

export default Home
