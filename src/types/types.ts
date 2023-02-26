import {BigNumber} from "ethers";

export interface IPayValues {
    amount: number
}

export interface IPayEvent {
    payer: string
    amount: string
    timestamp: string
}

export interface IWithdrawalEvent {
    amount: string
    timestamp: string
}

export type PayEventUnhandledType = undefined | [string, BigNumber, BigNumber]

export type WithdrawalEventUnhandledType = undefined | [BigNumber, BigNumber]

