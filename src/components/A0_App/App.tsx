import React from 'react';
import style from "./App.module.scss";
import {Header} from "../A1_Header/Header";
import {CustomAlert} from "../X_Common/CustomAlert/CustomAlert";
import {Payments} from "../B0_Payments/Payments";

export const App = () => {
    return (
        <div className={style.app}>
            <Header/>
            <CustomAlert/>
            <Payments/>
        </div>
    );
}


