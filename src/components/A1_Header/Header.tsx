import React, {useEffect, useRef, useState} from "react";
import style from "./Header.module.scss";
import {observer} from "mobx-react-lite";
import {useStore} from "../../store/useStore";
import {svgIcons} from "../../assets/svgIcons";
import clsx from "clsx";
import {Fade} from "@mui/material";
import Button from "@mui/material/Button";
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {useOutsideButNotOnTargetClick} from "../../hooks/useOutsideClick";
import Jazzicon from "react-jazzicon";
import {ethers} from "ethers";
import {getProvider} from "../../helpers/ethers.helper";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const Header = observer(() => {
    const {
        appStore: {
            showAccountPopup, setShowAccountPopup,
            setAlert, errorHandler,
        },
        cryptoStore: {
            currentAccountAddress, setCurrentAccountAddress,
            balance, setBalance,
            connecting, setConnecting,
        }
    } = useStore();

    //========= ADD LISTENERS =========//
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', accountChangeHandler);
            window.ethereum.on("chainChanged", chainChangedHandler);
            return () => {
                window.ethereum.removeListener('accountsChanged', accountChangeHandler);
                window.ethereum.removeListener("chainChanged", chainChangedHandler);
            }
        }
    }, []);

    //========= ACCOUNT CHANGE HANDLER =========//
    const accountChangeHandler = async (accounts: string[]) => {
        console.log("accountsChanged", accounts);
        setCurrentAccountAddress(accounts[0]);
        await getBalance(accounts[0]);
    }

    //========= CHAIN CHANGE HANDLER =========//
    const chainChangedHandler = (chainId: string) => {
        console.log("Chain changed", chainId);
        window.location.reload();
    }

    //========= GET BALANCE =========//
    const getBalance = async (newAccount: string) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const balance = await provider.getBalance(newAccount);
            const balanceInWei = ethers.utils.formatUnits(balance, "wei");
            setBalance(ethers.utils.commify(balanceInWei))
        } catch (e: any) {
            errorHandler(e);
        }
    }

    //========= CONNECT METAMASK =========//
    const onConnectMetamask = async () => {
        if (currentAccountAddress) { // если уже подключились к аккаунту Metamask - переключаем попап
            setShowAccountPopup(!showAccountPopup)
        } else { // если нет - подключаемся
            if (window.ethereum) {
                try {
                    setConnecting(true);

                    // при разработке переключаемся на сеть Hardhat
                    if (process.env.NODE_ENV === "development") {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{chainId: ethers.utils.hexValue(31337)}],
                        });
                    }

                    // на продакшене переключаемся на сеть Goerli
                    if (process.env.NODE_ENV === "production") {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{chainId: ethers.utils.hexValue(5)}],
                        });
                    }

                    const provider = getProvider();
                    const accounts = await provider.send("eth_requestAccounts", []);
                    await accountChangeHandler(accounts);
                } catch (e: any) { // ошибка при переключении на Goerli
                    // если сеть Goerli не добавлена в MetaMask
                    if (e.code === 4902) {
                        try { // добавляем Goerli в MetaMask
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: ethers.utils.hexValue(5),
                                        chainName: 'Goerli test network',
                                        rpcUrls: ['https://goerli.infura.io/v3/'],
                                        nativeCurrency: {
                                            name: 'GoerliETH',
                                            symbol: 'GoerliETH',
                                            decimals: 18,
                                        }
                                    },
                                ],
                            });
                        } catch (e: any) {
                            errorHandler(e)
                        }
                    } else {
                        errorHandler(e)
                    }
                } finally {
                    setConnecting(false);
                }
            } else {
                console.log("Please install MetaMask")
                setAlert({
                    open: true,
                    message: "Please install MetaMask",
                    severity: "error"
                });
            }
        }
    }

    const [toolTipLabel, setToolTipLabel] = useState('Copy to clipboard');
    const [copied, setCopied] = useState(false);

    const onDisconnectHandler = () => {
        setCurrentAccountAddress(null);
        setShowAccountPopup(false);
    }

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
                setToolTipLabel('Copy to clipboard!')
            }, 3000)
        }
    }, [copied])

    const onCopyHandler = () => {
        if (!copied && currentAccountAddress) {
            navigator.clipboard.writeText(currentAccountAddress)
            setCopied(true);
            setToolTipLabel('Copied!');
        }
    }

    const popupRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    // закрыть попап если кликнули вне него, но не по самой кнопке
    useOutsideButNotOnTargetClick(
        popupRef,
        btnRef,
        () => {
            setShowAccountPopup(false);
        }
    )

    return (
        <header className={style.header}>

            <div className={style.logoWrapper}>
                <AccountBalanceWalletIcon sx={{color: "#ff9800"}}/>
                <p className={style.logo}>Payments dApp</p>
            </div>


            <div className={style.connectButtonWrapper}>
                <button className={clsx({
                    [style.connectButton]: true,
                    [style.connectButton_connected]: currentAccountAddress,
                })}
                        disabled={connecting}
                        onClick={onConnectMetamask}
                        ref={btnRef}
                >
                    {
                        currentAccountAddress ? (
                            <>
                                <div className={style.metamask}>
                                    {svgIcons.metamask}
                                </div>
                                <div className={style.account}>
                                    <p className={style.topLabel}>{currentAccountAddress}</p>
                                    <p>{currentAccountAddress.slice(-5)}</p>
                                </div>
                                <div className={clsx({
                                    [style.arrow]: true,
                                    [style.arrow_showAccountPopup]: showAccountPopup,
                                })}>
                                    {svgIcons.arrowDown}
                                </div>

                            </>
                        ) : (
                            <p className={style.btnLabel}>
                                {
                                    connecting ? "Connecting Metamask..." : "Connect Metamask"
                                }
                            </p>
                        )
                    }
                </button>

                <Fade in={showAccountPopup}>
                    <div className={style.accountPopup}
                         ref={popupRef}
                    >

                        <div className={style.top}>

                            <p className={style.topLabel}>Account</p>

                            <Button variant="outlined"
                                    startIcon={<LogoutIcon fontSize="small"/>}
                                    size="small"
                                    className={style.disconnectBtn}
                                    onClick={onDisconnectHandler}
                            >
                                Disconnect
                            </Button>

                        </div>

                        <div className={style.accountBlock}>
                            {
                                currentAccountAddress &&
                                <div className={style.bottomLeft}>

                                    <Jazzicon diameter={24}
                                              seed={parseInt(currentAccountAddress.slice(2, 10), 16)}
                                    />

                                    <div className={style.account}>
                                        <p className={style.topLabel}>{currentAccountAddress}</p>
                                        <p>{currentAccountAddress.slice(-5)}</p>
                                    </div>
                                </div>
                            }

                            <Tooltip title={toolTipLabel}>
                                {
                                    copied ? (
                                        <div className={style.copiedIconWrapper}>
                                            <DoneAllIcon/>
                                        </div>

                                    ) : (
                                        <IconButton size="small"
                                                    onClick={onCopyHandler}
                                        >
                                            <ContentCopyIcon fontSize="small"/>
                                        </IconButton>
                                    )
                                }
                            </Tooltip>

                        </div>

                        {
                            balance && (
                                <div className={style.balanceBlock}>
                                    <p>Balance:</p>
                                    {/*<p>{`${Number(balance).toFixed(6)} ETH`}</p>*/}
                                    <p>{`${balance} wei`}</p>
                                </div>
                            )
                        }

                    </div>
                </Fade>
            </div>

        </header>
    )
})
