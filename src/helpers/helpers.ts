import {format} from 'date-fns'
import {ethers} from "ethers";
import {PayEventUnhandledType, WithdrawalEventUnhandledType} from "../types/types";

export const getDate = (
    timestamp: number // sec
): string => format(new Date(timestamp * 1000), 'HH:mm dd.MM.yyyy');


export const payLogArgsHandler = (args: PayEventUnhandledType) => (
    args ? ({
        payer: args[0],
        amount: ethers.utils.formatUnits(args[1], 'wei'),
        timestamp: getDate(args[2].toNumber()),
    }) : ({
        payer: '',
        amount: '',
        timestamp: '',
    })
);

export const withdrawalLogArgsHandler = (args: WithdrawalEventUnhandledType) => (
    args ? ({
        amount: ethers.utils.formatUnits(args[0], 'wei'),
        timestamp: getDate(args[1].toNumber()),
    }) : ({
        amount: '',
        timestamp: '',
    })
);
