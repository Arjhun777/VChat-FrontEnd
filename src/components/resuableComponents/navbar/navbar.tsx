import React from 'react';
import { AppBar, Toolbar, Typography } from '@material-ui/core';

function NavBar(props:any) {

    return (
        <React.Fragment>
            <div className="navbar-container">
                <div>
                    <AppBar className="app-navbar" position="static">
                        <Toolbar>
                            <Typography variant="h6" className="navbar-title">
                                Vi CHAT
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </div>
                <div>
                    {props.children}
                </div>
            </div>
        </React.Fragment>
    )
}

export default NavBar;