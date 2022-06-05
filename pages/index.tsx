import type { NextPage } from 'next'
import { SendSol } from '../components/SendSol'
import { Wallet } from '../components/Wallet'

const Home: NextPage = () => {
  return (
    <Wallet>
      <SendSol />
    </Wallet>
  )
}

export default Home
