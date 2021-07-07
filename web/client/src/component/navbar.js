// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Container } from "@material-ui/core";
// import DNSEditor from './dnsEditor';
import AppsIcon from '@material-ui/icons/Apps';
import { Toolbar } from "@material-ui/core";
import App from './metadata';
import StoreMetaData from './store-metadata';
import WaterMark from './watermark.js';
import Online from './online.js';
// import Motion from './motion.js';
import DnsForm from './dnsEditor.js';
import Codec from './codec.js'
// import TaskConfig from './taskconfig'
// import CardMedia from './cardmedia'
import Relay from './relay'
import Login from './login';
import useToken from './useToken';
import Link from '@material-ui/core/Link';


 

function Copyright() {
    return (
      <Typography variant="body2" color="textSecondary" align="center" >
        {'Copyright © '}
        <Link color="inherit" href="#">
          Your Website
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
  }
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            aria-labelledby={`scrollable-auto-tab-${index}`}
            {...other}>
            {value === index && (
                <Box p={3}>
                    {children}
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme) => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      
    },
    main: {
      marginTop: theme.spacing(8),
      marginBottom: theme.spacing(2),
    },
    footer: {
      padding: theme.spacing(3, 2),
      marginTop: 'auto',
      backgroundColor:
        theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
    },
      title: {
        flexGrow: 1,
        width: 180,
      },
  }));

export default function ScrollableTabsButtonAuto() {
    const { token, setToken } = useToken();
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    if(!token) {
        return <Login setToken={setToken} />
      }  
    return (
        <div className={classes.root} >
            <AppBar position="static" color="inherit" >
                <Toolbar >
                    <AppsIcon fontSize="large" color="primary" />
                    <Typography variant="h6"  color="primary" noWrap className={classes.title}>
                        视频管理
                    </Typography>
                    <Tabs 
                        value={value}
                        onChange={handleChange}
                        indicatorColor="primary"
                        textColor="inherit"
                        variant="scrollable"
                        scrollButtons="on"
                        aria-label="scrollable auto tabs example"
                    >
                         {/* <Tab icon={<VideoLabelIcon />} label="配置管理" {...a11yProps(0)} /> */}
                        <Tab  label="视频直播" {...a11yProps(0)} />
                        <Tab label="视频录制" {...a11yProps(1)} />
                        <Tab label="视频转码" {...a11yProps(2)}/>
                        <Tab label="视频水印" {...a11yProps(3)} />
                        <Tab label="视频中继" {...a11yProps(4)}/>
                        {/* <Tab label="移动侦测" {...a11yProps(3)} /> */}
                        <Tab label="在线视频" {...a11yProps(5)}/>
                        {/* <Tab label="任务设置" {...a11yProps(6)}/>   */}
                        <Tab  label="域名配置" {...a11yProps(6)} />     
                    </Tabs>               
                </Toolbar>
            </AppBar>
            <TabPanel value={value} index={0}>
                <App/>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <StoreMetaData />
            </TabPanel>
            <TabPanel value={value} index={2}>
            <Codec/>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <WaterMark />
            </TabPanel>
            <TabPanel value={value} index={4}>
            <Relay/>
            </TabPanel>
            <TabPanel value={value} index={5}>
              <Online />
            </TabPanel>
            {/* <TabPanel value={value} index={6}>
            <TaskConfig/>
            </TabPanel> */}
            <TabPanel value={value} index={6}>
            <DnsForm/>
            </TabPanel>

{/* page footer */}

            <AppBar position="static" color="inherit">
                <Container >
                    <Toolbar>      
                    </Toolbar>
                </Container>
            </AppBar>
            <Copyright />  
        </div>
    );
}
