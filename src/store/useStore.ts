import {useContext} from "react";
import { RootStore } from "./RootStore";
import {StoreContext} from "../components/A0_App/AppContainer";

export const useStore = (): RootStore => useContext(StoreContext);
