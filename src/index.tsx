import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactGA from 'react-ga';
// own component imports
import App from "./components/App";
// style imports
import './assets/style/globalStyle.scss';
// @ts-ignore
const { analytic_id } = env_config;

ReactGA.initialize(analytic_id);
const root = document.getElementById('app');
ReactDOM.render(<App />, root);