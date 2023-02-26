import React, {useEffect, useState} from "react";
import style from "./Payments.module.scss";
import {useStore} from "../../store/useStore";
import {observer} from "mobx-react-lite";
import {BigNumber, ethers} from "ethers";
import {FormikHelpers, useFormik} from "formik";
import {Link, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
    IPayEvent,
    IPayValues,
    IWithdrawalEvent,
    PayEventUnhandledType,
    WithdrawalEventUnhandledType
} from "../../types/types";
import {payLogArgsHandler, withdrawalLogArgsHandler} from "../../helpers/helpers";
import {chainId, getContract, getContractAddress, getProvider} from "../../helpers/ethers.helper";
import CircularProgress from "@mui/material/CircularProgress";

export const Payments = observer(() => {
    const {
        cryptoStore: {
            currentAccountAddress
        },
        appStore: {
            errorHandler
        }
    } = useStore();

    const [contractBalance, setContractBalance] = useState<string>('');
    const [payLogs, setPayLogs] = useState<IPayEvent[]>([]);
    const [withdrawalLogs, setWithdrawalLogs] = useState<IWithdrawalEvent[]>([]);
    const [ownerAddress, setOwnerAddress] = useState<string>('');
    const [ownerBalance, setOwnerBalance] = useState<string>('');

    //========= UPDATE CONTRACT BALANCE =========//
    const updateContractBalance = async () => {
        try {
            const provider = getProvider();
            const balance = await provider.getBalance(getContractAddress());
            const balanceInWei = ethers.utils.formatUnits(balance, "wei");
            setContractBalance(ethers.utils.commify(balanceInWei));
        } catch (e: any) {
            errorHandler(e)
        }
    }

    //========= UPDATE OWNER BALANCE =========//
    const updateOwnerBalance = async () => {
        try {
            if (window.ethereum) {
                const provider = getProvider();
                const contract = getContract(provider);
                const ownerAddress = await contract.owner();
                const balance = await provider.getBalance(ownerAddress);
                const balanceInWei = ethers.utils.formatUnits(balance, "wei");
                setOwnerBalance(ethers.utils.commify(balanceInWei));
            }
        } catch (e: any) {
            errorHandler(e)
        }
    }

    //========= GET LOGS =========//
    const getLogsPaymentEvent = async () => {
        try {
            if (window.ethereum) {
                const provider = getProvider();
                const contract = getContract(provider);
                const filter = contract.filters.PaymentEvent();
                const logs = await contract.queryFilter(filter);
                setPayLogs(logs.map(({args}) => payLogArgsHandler(args as PayEventUnhandledType)))
            }
        } catch (e: any) {
            errorHandler(e)
        }
    }
    const getLogsWithdrawalEvent = async () => {
        try {
            if (window.ethereum) {
                const provider = getProvider();
                const contract = getContract(provider);
                const filter = contract.filters.Withdrawal();
                const logs = await contract.queryFilter(filter);
                setWithdrawalLogs(logs.map(({args}) => withdrawalLogArgsHandler(args as WithdrawalEventUnhandledType)));
            }
        } catch (e: any) {
            errorHandler(e)
        }
    }

    //========= ADD EVENT LISTENERS =========
    const addListener = async () => {
        try {
            if (window.ethereum) {
                const provider = getProvider();
                const contract = getContract(provider);
                const startBlockNumber = await provider.getBlockNumber();
                contract.on("PaymentEvent", async (...args) => {
                    try {
                        //console.log("PaymentEvent")
                        const event = args[args.length - 1];
                        if (event.blockNumber > startBlockNumber) {
                            await getLogsPaymentEvent();
                        }
                    } catch (e: any) {
                        errorHandler(e)
                    }
                })
                contract.on("Withdrawal", async (...args) => {
                    try {
                        //console.log("Withdrawal")
                        const event = args[args.length - 1];
                        if (event.blockNumber > startBlockNumber) {
                            await getLogsWithdrawalEvent();
                        }
                    } catch (e: any) {
                        errorHandler(e)
                    }
                })
            }
        } catch (e: any) {
            errorHandler(e)
        }
    }

    //========= GET OWNER ADDRESS =========//
    const getOwnerAddress = async () => {
        try {
            if (window.ethereum) {
                const provider = getProvider();
                const contract = getContract(provider);
                const ownerAddress = await contract.owner();
                setOwnerAddress(ownerAddress);
            }
        } catch (e: any) {
            errorHandler(e)
        }
    }

    //========= МОНТИРОВАНИЕ =========//
    useEffect(() => {
        const omMountHandler = async () => {
            if (window.ethereum) {
                const provider = getProvider();
                const network = await provider.getNetwork();

                // проверка совпадения сети в которой развернут смарт-контракт с той к которой подключились
                if (network.chainId === chainId) {
                    await addListener();// добавляем обработчик события
                    await getLogsPaymentEvent();// получаем логи события перевода на смарт-контракт
                    await getLogsWithdrawalEvent();// получаем логи события снятия со смарт-контракта
                    await updateContractBalance();// баланс смарт-контракта
                    await getOwnerAddress();
                    await updateOwnerBalance();
                }
            }
        }
        omMountHandler().then();
    }, [window.ethereum]);

    //========= PAY FORM =========//
    const [payLoading, setPayLoading] = useState(false);
    const initialValues: IPayValues = {
        amount: 0
    }
    const onSubmit = async (values: IPayValues, formikHelpers: FormikHelpers<IPayValues>) => {
        try {
            if (currentAccountAddress && window.ethereum) {
                setPayLoading(true);
                const provider = getProvider();
                const signer = provider.getSigner(currentAccountAddress);
                const tx = await signer.sendTransaction({
                    to: getContractAddress(),
                    value: BigNumber.from(String(values.amount))
                })
                await tx.wait(); // ждем ее завершения
                await updateContractBalance(); // обновляем баланс смарт-контракта
            }
        } catch (e: any) {
            errorHandler(e);
        } finally {
            formikHelpers.resetForm();
            setPayLoading(false);
        }
    }
    const formik = useFormik({
        initialValues,
        onSubmit: onSubmit
    })

    //========= WITHDRAW =========//
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const onWithdraw = async () => {
        try {
            if (window.ethereum && currentAccountAddress) {
                setWithdrawLoading(true);
                const provider = getProvider();
                const signer = provider.getSigner(currentAccountAddress);
                const contract = getContract(provider);
                const tx = await contract
                    .connect(signer)
                    .withdraw();
                await tx.wait();
                await updateContractBalance();
                await updateOwnerBalance();
            }
        } catch (e: any) {
            errorHandler(e);
        } finally {
            setWithdrawLoading(false);
        }
    }

    // тест получения логов через provider.getLogs(filter)
    // результат - не все логи а только последний (в документации про это говорится)
    const getLogs = async () => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = getContract(provider);
            const filter = contract.filters.PaymentEvent();
            const logs = await provider.getLogs(filter);
            console.log(logs)
        }
    }


    return (
        <div className={style.payments}>

            <div className={style.contract}>
                <h2 className={style.blockTitle}>
                    Payments contract
                </h2>

                <div className={style.addressBlock}>
                    <Typography className={style.label}>Contract address</Typography>
                    <Typography className={style.address}>{getContractAddress()}</Typography>
                </div>

                <div className={style.addressBlock}>
                    <Typography className={style.label}>Contract balance (wei)</Typography>
                    <Typography className={style.address}>{contractBalance}</Typography>
                </div>

                <div className={style.addressBlock}>
                    {/*<Typography className={style.label}>Etherscan</Typography>*/}
                    <Link className={style.link}
                          href="https://goerli.etherscan.io/address/0xB5b209B4DE252716240ef40D9658265dae8d3453#code"
                          target="_blank"
                    >
                        Link to Etherscan
                    </Link>

                </div>

                <div className={style.addressBlock}>
                    <Typography className={style.label}>Owner address</Typography>
                    <Typography className={style.address}>{ownerAddress}</Typography>
                </div>

                <div className={style.addressBlock}>
                    <Typography className={style.label}>Owner balance (wei)</Typography>
                    <Typography className={style.address}>{ownerBalance}</Typography>
                </div>

                <form onSubmit={formik.handleSubmit}
                      className={style.payForm}
                >
                    <TextField fullWidth
                               size="small"
                               label="Value"
                               type="number"
                               inputProps={{
                                   min: 1
                               }}
                               {...formik.getFieldProps('amount')}
                               disabled={!window.ethereum || !currentAccountAddress || payLoading}
                    />

                    <Button type="submit"
                            variant="contained"
                            fullWidth
                            className={style.btn}
                            disabled={!window.ethereum || !currentAccountAddress || payLoading}
                    >
                        <div className={style.wrapper}>
                            <p>Pay to contract</p>
                            {
                                payLoading &&
                                <div className={style.preloader}>
                                    <CircularProgress color="secondary" size={25}/>
                                </div>
                            }

                        </div>
                    </Button>
                </form>

                <Button variant="contained"
                        fullWidth
                        className={style.withdrawBtn}
                        onClick={onWithdraw}
                        disabled={
                            !window.ethereum
                            || !currentAccountAddress
                            || currentAccountAddress.toUpperCase() !== ownerAddress.toUpperCase()
                            || withdrawLoading
                        }

                >
                    <div className={style.wrapper}>
                        <p>withdraw (only for owner)</p>
                        {
                            withdrawLoading &&
                            <div className={style.preloader}>
                                <CircularProgress color="secondary" size={25}/>
                            </div>
                        }

                    </div>
                </Button>

                <Button variant="contained"
                        fullWidth
                        className={style.withdrawBtn}
                        onClick={getLogs}
                >
                    provider.getLogs( filter )
                </Button>

            </div>

            <div className={style.events}>
                <h2 className={style.blockTitle}>
                    Event logs
                </h2>

                <div className={style.table}>

                    <p className={style.tableLibel}>
                        Payment Event
                    </p>

                    <div className={style.header}>
                        <p>payer</p>
                        <p>amount (wei)</p>
                        <p>timestamp</p>

                    </div>

                    <div className={style.rows}>
                        {
                            payLogs.map(({payer, amount, timestamp}, key) => (
                                <div className={style.row} key={key}>
                                    <p>{payer}</p>
                                    <p>{amount}</p>
                                    <p>{timestamp}</p>
                                </div>
                            ))
                        }
                    </div>

                </div>

                <div className={style.table}>

                    <p className={style.tableLibel}>
                        Withdraw Event
                    </p>

                    <div className={style.header2}>
                        <p>amount (wei)</p>
                        <p>timestamp</p>

                    </div>

                    <div className={style.rows2}>
                        {
                            withdrawalLogs.map(({amount, timestamp}, key) => (
                                <div className={style.row2} key={key}>
                                    <p>{amount}</p>
                                    <p>{timestamp}</p>
                                </div>
                            ))
                        }
                    </div>

                </div>

            </div>

        </div>
    )
})
