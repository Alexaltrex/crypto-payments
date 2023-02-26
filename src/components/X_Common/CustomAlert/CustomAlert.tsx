import {Snackbar} from "@mui/material";
import React from "react";
import Alert from "@mui/material/Alert";
import {observer} from "mobx-react-lite";
import {useStore} from "../../../store/useStore";

export const CustomAlert = observer(() => {
    const {appStore: {alert, setAlert}} = useStore();
    const {open, message, severity} = alert

    const onCloseHandler = (event?: any, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlert({
            open: false,
            message: '',
            severity: 'success'
        });
    };

    return (
        <Snackbar open={open}
                  autoHideDuration={4000}
                  onClose={onCloseHandler}
                  anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                  }}
        >
            <Alert onClose={onCloseHandler}
                   severity={severity}
            >
                {message}
            </Alert>
        </Snackbar>
    )
});
