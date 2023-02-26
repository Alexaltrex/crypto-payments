import React, {createContext} from "react";
import {App} from "./App";
import {rootStore, RootStore} from "../../store/RootStore";

export const StoreContext = createContext<RootStore>({} as RootStore);

export const AppContainer = () => {
    return (
        <StoreContext.Provider value={rootStore}>
            <App/>
        </StoreContext.Provider>
    )
}
