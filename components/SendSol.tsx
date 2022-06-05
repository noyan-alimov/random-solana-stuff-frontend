import { getParsedNftAccountsByOwner, resolveToWalletAddress } from '@nfteyez/sol-rayz';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { transfer, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey, Keypair } from '@solana/web3.js';
import React, { FC, useEffect, useState } from 'react';
import idl from '../idl.json'
import kp from '../keypair.json'

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = Keypair.fromSecretKey(secret)

export const SendSol: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();

    const [addressToSend, setAddressToSend] = useState('')

    // const sendNft = async () => {
    //     transfer(
    //         connection,
    //         wallet,
    //         publicKey,
    //         new PublicKey(addressToSend),
    //         null,
    //         1,
    //         [null],
    //         false,
    //         TOKEN_PROGRAM_ID
    //     )
    // }

    const getNfts = async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const publicAddress = await resolveToWalletAddress({
            text: publicKey.toString()
        })

        const nftArray = await getParsedNftAccountsByOwner({
            publicAddress,
            connection
        })
        console.log(nftArray)
    }

    const sendSol = async (toSendPublicKey?: PublicKey) => {
        if (!publicKey) throw new WalletNotConnectedError();

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: toSendPublicKey ? toSendPublicKey : new PublicKey(addressToSend),
                lamports: 0.2 * LAMPORTS_PER_SOL,
            })
        );

        const signature = await sendTransaction(transaction, connection);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

        await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature
        })

        alert('0.2 sol sent!')
    }

    const [gifList, setGifList] = useState(null)

    // useEffect(() => {
    //     getGifs()
    // }, [])

    const getAnchorProvider = () => new AnchorProvider(connection, (window as any).solana, { preflightCommitment: 'processed' })

    const getGifs = async () => {
        if (!(window as any).solana) throw new WalletNotConnectedError();
        const programID = new PublicKey(idl.metadata.address)
        const provider = getAnchorProvider()
        const program = new Program(idl as any, programID, provider)

        const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

        console.log('Gif List: ', account.gifList)
        setGifList(account.gifList)
    }

    const createGifAccount = async () => {
        const programID = new PublicKey(idl.metadata.address)
        const provider = getAnchorProvider()
        const program = new Program(idl as any, programID, provider)

        await program.rpc.startStuffOff({
            accounts: {
              baseAccount: baseAccount.publicKey,
              user: provider.wallet.publicKey,
              systemProgram: SystemProgram.programId,
            },
            signers: [baseAccount]
          });
          console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
          await getGifs();
    }

    // const onClick = () => {
    //     sendSol()
    // }

    const [gifLink, setGifLink] = useState('')

    const sendGif = async () => {
        if (!gifLink) {
            alert('no gif link provided!')
            return
        }

        const provider = getAnchorProvider();
        const programID = new PublicKey(idl.metadata.address)
        const program = new Program(idl as any, programID, provider);

        await program.rpc.addGif(gifLink, {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        },
        });
        console.log("GIF successfully sent to program", gifLink)

        await getGifs()
    }

    const upvote = async (gifLink: string) => {
        const provider = getAnchorProvider();
        const programID = new PublicKey(idl.metadata.address)
        const program = new Program(idl as any, programID, provider);

        await program.rpc.upvote(gifLink, {
            accounts: {
                baseAccount: baseAccount.publicKey
            }
        })

        await getGifs()
    }

    const renderConnectedContainer = () => {
        if (!gifList) {
            return (
                <div className='flex justify-center items-center w-full h-screen'>
                    <button className='bg-blue-700 text-white p-3' onClick={createGifAccount}>do one time initialization for gif program account</button>
                </div>
            )
        }

        return (
            <div className='mt-10'>
                <form onSubmit={e => {
                    e.preventDefault()
                    sendGif()
                }}>
                    <div>
                        <input
                            placeholder='enter gif link'
                            value={gifLink}
                            onChange={e => setGifLink(e.target.value)}
                            className='p-2 bg-pink-100 w-full'
                        />
                    </div>
                    <div className='flex justify-center items-center'>
                        <button type='submit' className='bg-green-100 p-3 rounded mt-10 cursor-pointer'>submit</button>
                    </div>
                </form>
                <div className='bg-blue-100'>
                    {gifList && (gifList as any[]).map(gif => (
                        <div key={gif.gifLink}>
                            <img src={(gif as any).gifLink} height='300px' width='300px' />
                            <div className='bg-white text-green-600'>
                                <div>{gif.userAddress.toString()}</div>
                                <div>{gif.votes}</div>
                                <button className='p-2 bg-green-800 text-white' onClick={() => {
                                    upvote(gif.gifLink)
                                }}>upvote</button>
                                <button className='p-2 bg-blue-800 text-white' onClick={() => {
                                    sendSol(gif.userAddress)
                                }}>donate 0.2 sol</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            {/* <div>
                <input
                    placeholder='wallet address to send'
                    value={addressToSend}
                    onChange={e => setAddressToSend(e.target.value)}
                    className='p-2 bg-pink-100 w-full' />
            </div>
            <div className='flex justify-center items-center'>
                <button
                    onClick={onClick}
                    disabled={!publicKey}
                    className='bg-green-100 p-3 rounded mt-10 cursor-pointer'
                >
                    Send 0.2 solana
                </button>
            </div> */}
            {renderConnectedContainer()}
        </>
    );
};