import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, Account, getAccount, TokenInvalidMintError, TokenInvalidOwnerError } from '@solana/spl-token';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, LAMPORTS_PER_SOL, PublicKey, Commitment } from '@solana/web3.js';
import React, { FC, useState } from 'react';

const mint = new PublicKey('DyZ27qwFkEAtPs62HbiPYK98gC9iGiDs1QcCJjUt57fh')

export const SendNft: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [addressToSend, setAddressToSend] = useState('')

    const sendSplToken = async () => {
        if (!publicKey) throw new WalletNotConnectedError()

        const fromWallet = publicKey
        const toWallet = new PublicKey(addressToSend)
        
        const fromTokenAccountAddress = await getAssociatedTokenAddress(mint, fromWallet)

        const { address: toTokenAccountAddress } = await getToTokenAccount()
        // const toTokenAccountAddress = await getAssociatedTokenAddress(mint, toWallet)
        console.log('mint', mint.toString())
        console.log('from', fromTokenAccountAddress.toString())
        console.log('to', toTokenAccountAddress.toString())

        const transferTransaction = new Transaction().add(
            createTransferInstruction(fromTokenAccountAddress, toTokenAccountAddress, fromWallet, 1)
        )

        const signature = await sendTransaction(transferTransaction, connection)
        console.log(signature)
    }

    // this function logic was taken from source code
    const getToTokenAccount = async (
        allowOwnerOffCurve = false,
        commitment?: Commitment,
        programId = TOKEN_PROGRAM_ID,
        associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
    ) => {
        if (!publicKey) throw new WalletNotConnectedError()

        const toWallet = new PublicKey(addressToSend)
        
        const associatedToken = await getAssociatedTokenAddress(
            mint,
            toWallet,
            allowOwnerOffCurve,
            programId,
            associatedTokenProgramId
        );
    
        let account: Account;
        try {
            const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    publicKey,
                    associatedToken,
                    toWallet,
                    mint,
                    programId,
                    associatedTokenProgramId
                )
            );

            await sendTransaction(transaction, connection)
        } catch (error: unknown) {
            // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
            // instruction error if the associated account exists already.
        }

        // Now this should always succeed
        account = await getAccount(connection, associatedToken, commitment, programId);
    
        if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
        if (!account.owner.equals(toWallet)) throw new TokenInvalidOwnerError();
    
        return account;
    }

    const onClick = () => {
        sendSplToken()
    }

    return (
        <>
            <div>
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
                    send nft
                </button>
            </div>
        </>
    );
};