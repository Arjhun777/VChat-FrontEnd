import * as React from 'react';
import { Switch, Route } from "react-router-dom";
import { lazy } from "react";
import { CircularProgress } from '@material-ui/core';
// Dynamic Imports
const HomeComponent = lazy(() => import('../pageComponents/home/home'));
const RoomComponent = lazy(() => import('../pageComponents/RoomComponent/RoomComponent'));

// App routing configuration
const AppRouter = () => {
    return (
        <React.Suspense fallback={<CircularProgress className="module-loader" size={44} />}>
            <Switch>
                <Route path="/join/:id" component={RoomComponent} />
                <Route path={["/home", "/"]} exact component={HomeComponent} />
            </Switch>
        </React.Suspense>
    )
}

export default AppRouter;