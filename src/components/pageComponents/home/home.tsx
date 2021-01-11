import React, { useState } from "react";
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import { homeService } from '../../../services/home/home.service';
import { analyticEvent } from "../../../utils/helper";
// import useCheckMediaAccess from "../../../customHooks/useCheckMediaAccess";

interface HomeProps {
    history: any
}
function Home(props:HomeProps) {
    const [loading, setLoading] = useState(false);
    const [quality, setQuality] = useState(12);
    // const access = useCheckMediaAccess();
    analyticEvent('vichat_home', 'Home page visited');
    const handleJoin = () => {
        if (!loading) {
            setLoading(true);
            homeService.getJoinLink().then(res => {
                props.history?.push(`/join/${res.data.link}?quality=${quality}`);
            }).finally(() => {
                setLoading(false);
            });
        }
    }

    const handleQualityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setQuality(event.target.value as number);
    }

    return (
        <React.Fragment>
            <div className="main-container">
                <div className="join-button-wrap">
                    <Button className="join-button" variant="contained" disabled={loading} onClick={handleJoin}>
                        <h4>JOIN</h4>
                    </Button>
                    <FormControl className="form-quality">
                        <InputLabel id="quality-select">Call Quality</InputLabel>
                        <Select
                            className="form-select"
                            labelId="quality"
                            id="quality-select"
                            value={quality}
                            onChange={handleQualityChange}
                        >
                            <MenuItem value={12}>Normal</MenuItem>
                            <MenuItem value={30}>High</MenuItem>
                        </Select>
                    </FormControl>
                    {loading && <CircularProgress className="btn-circular-loader" size={24} color="primary" />}
                </div>
            </div>
        </React.Fragment>
    )
}

export default Home;