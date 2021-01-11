import React from 'react';
import { AppBar, Toolbar } from '@material-ui/core';

function FootBar(props:any) {

    return (
        <React.Fragment>        
            <AppBar className="footbar-wrapper" color="primary">
                <Toolbar className={`footbar-tool ${props.className}`}>
                    {props.children}
                </Toolbar>
            </AppBar>
        </React.Fragment>
    )
}

export default FootBar;