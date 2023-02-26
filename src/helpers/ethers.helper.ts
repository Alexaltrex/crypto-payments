//========= GET CONTRACT =========//
import {ethers} from "ethers";
import contractAddressDev from "../assets/contracts/dev/Contract-address.json";
import contractAddressProd from "../assets/contracts/prod/Contract-address.json";
import contractArtefactDev from "../assets/contracts/dev/Contract-artifact.json";
import contractArtefactProd from "../assets/contracts/prod/Contract-artifact.json";

//========= GET PROVIDER =========//
export const getProvider = () => new ethers.providers.Web3Provider(window.ethereum);

//========= GET CONTRACT =========//
export const getContract = (provider: ethers.providers.Web3Provider) => (
    new ethers.Contract(
        process.env.NODE_ENV === "production" ? contractAddressProd.address : contractAddressDev.address,
        process.env.NODE_ENV === "production" ? contractArtefactProd.abi : contractArtefactDev.abi,
        provider
    )
);

//========= GET CONTRACT ADDRESS =========//
export const getContractAddress = () => process.env.NODE_ENV === "production" ? contractAddressProd.address : contractAddressDev.address

//========= CHAIN ID =========//
export const chainId = process.env.NODE_ENV === "production" ? 5 : 31337;
