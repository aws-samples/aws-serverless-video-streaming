// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';
import CardActionArea from '@material-ui/core/CardActionArea';
import Player from './player';

const useStyles = makeStyles((theme) => ({
    root: {
      "& > *": {
        margin: theme.spacing(2)
      }
    }
  }));

export default function SimpleCard() {
    const classes = useStyles();

    return (
        <div className={classes.root}>
        <Card raised={true}>
            <CardHeader
                title={'aszd'}
            />
            <CardActionArea>  
                <CardContent>
                <Player
                    url={"http://heyang-test.xiaopeiqing.com/415201f9-00af-42d5-8a5e-a348ea85569f/live.flv"}
                />
                    <Typography variant="body2" color="textSecondary" component="p">
                        Some Text
                </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
                <Card  raised={true}>
                    <CardHeader
                    title={'aszd'}
                />
                <CardActionArea>  
                    <CardContent>
                    <Player
                        url={"http://heyang-test.xiaopeiqing.com/415201f9-00af-42d5-8a5e-a348ea85569f/live.flv"}
                    />
                        <Typography variant="body2" color="textSecondary" component="p">
                            Some Text
                    </Typography>
                    </CardContent>
                </CardActionArea>
                </Card>
                </div>
    );
}
