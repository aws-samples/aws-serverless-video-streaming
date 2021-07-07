// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid'
import MaterialTable from "material-table";
import Refresh from '@material-ui/icons/Refresh';
import axios from 'axios'
import Alert from '@material-ui/lab/Alert';
import 'react-tabs/style/react-tabs.css';
import Switch from '@material-ui/core/Switch';
import tableIcons from './tableIcon.js'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ClapprPlayer from './clappr-player';
import QRCode from 'qrcode.react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import AccountCircle from '@material-ui/icons/AccountCircle';
import './App.css';


const api = axios.create({
    //baseURL: `http://localhost:8080`
})


function App() {
    var columns = [
        { title: "名称", field: "videoname", editable: 'never' },
        { title: "任务类型", field: "codecSize", lookup: { 'micro': 'micro','small': 'small', 'medium': 'medium', 'large': 'large', 'xlarge': 'xlarge'}},
        { title: "视频转码", field: "isCodec",type: 'boolean', initialEditValue: false, 
        render: rowData => rowData.isCodec === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "视频编码", field: "codec", lookup: { 'libx264': 'H264', 'libx265': 'H265'}},
        { title: "流畅", field: "ld",type: 'boolean', initialEditValue: false, 
        render: rowData => rowData.ld === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "标清", field: "sd",type: 'boolean', initialEditValue: false, 
        render: rowData => rowData.sd === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "高清", field: "hd",type: 'boolean', initialEditValue: false, 
        render: rowData => rowData.hd === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "超清", field: "ud",type: 'boolean', initialEditValue: false, 
        render: rowData => rowData.ud === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
     ]
    
    const [data, setData] = useState([]); //table data
    const [iserror, setIserror] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessages, setErrorMessages] = useState([])
    const [dns,setDNS]=useState([]);

    useEffect(() => {
        setIsLoading(true)
        api.get("/streamdns").then(res => { 
            setDNS(res.data.data);
            }).catch(error => { 
            }) 
        api.get("/videostreams")
            .then(res => {
                // console.log(res);
                setData(res.data.data)
            })
            .catch(error => {
                console.log("Error")
            })
        setIsLoading(false)
    }, [])

    const refresh = (resolve) => {
        setIsLoading(true)
        api.get("/videostreams")
            .then(res => {
                setData(res.data.data)
                resolve()
            })
            .catch(error => {
                console.log("Error")
            })
        setIsLoading(false)
    }

 

    const handleRowUpdate = (newData, oldData, resolve) => {
        setIsLoading(true)
        let errorList = []
        console.log(newData.relayURL)
        if(typeof(newData.relayURL)=="undefined"||newData.relayURL === ""){
          errorList.push("请输入转播URL")
        }

        if (errorList.length < 1) {
            //  
            const id = newData.id;
            const key = newData.key;
            delete newData['TimeStamp'];
            delete newData['key'];
            delete newData['id'];
            api.put("/videostreams/" + id, newData)
                .then(res => {
                    console.log('update row:' + JSON.stringify(res));
                    const dataUpdate = [...data];
                    const index = oldData.tableData.id;
                    newData.id = id;
                    newData.key = key;
                    dataUpdate[index] = newData;
                    setData([...dataUpdate]);
                    resolve()
                    setIserror(false)
                    setErrorMessages([])
                })
                .catch(error => {
                    setErrorMessages(["Update failed! Server error"])
                    setIserror(true)
                    resolve()

                })
        } else {
            setErrorMessages(errorList)
            setIserror(true)
            resolve()
        }
        setIsLoading(false)
    }



    const tableRef = React.createRef();

    const [selectedRow, setSelectedRow] = useState(null);

    return (
        <div className="App"  >
            <Grid container justify="center" style={{ backgroundColor: '#grey', padding: 2 }}>

                <Grid item xs  >
                    <div>
                        {iserror &&
                            <Alert severity="error">
                                {errorMessages.map((msg, i) => {
                                    return <div key={i}>{msg}</div>
                                })}
                            </Alert>
                        }
                    </div>
                    <MaterialTable
                        isLoading={isLoading}
                        tableRef={tableRef}
                        actions={[
                            {
                                icon: Refresh,
                                tooltip: '刷新',
                                isFreeAction: true,
                                onClick: () => refresh()
                            }
                        ]}
                        onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
                        options={{
                            paging: true,  // 是否显示分页插件
                            exportButton: true,  //是否显示导出按钮
                            actionsColumnIndex: 0,  // actions显示在最后一列
                            addRowPosition: "first",  // 点击添加行时显示在首行
                            rowStyle: rowData => ({
                                backgroundColor: (selectedRow === rowData.tableData.id) ? '#DDD' : '#EEE',
                                fontSize: 13
                            }),
                            headerStyle: {
                                backgroundColor: '#3F516C',
                                color: '#FFFFFF',
                                fontSize: 14,
                                // padding: 10
                            },
                        }}
                        align="center"
                        title="视频转码"
                        columns={columns}
                        data={data}
                        icons={tableIcons}
                        style={{ padding: '0 10px' }}
                        editable={{
                            onRowUpdate: (newData, oldData) =>
                                new Promise((resolve) => {
                                    handleRowUpdate(newData, oldData, resolve);
                                })
                        }}
                        detailPanel={[
                            {
                              tooltip: '地址信息',
                              render: rowData => {
                                return (
                                  <div style={{
                                    width: '100%',
                                    backgroundColor: 'EEEFFF',
                                  }}>
                                    <List >
                                      <ListItem>
                                        <ListItemAvatar>
                                          <Avatar>
                                            <ImageIcon />
                                          </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary="流畅视频地址:" secondary={`http://${dns.pullDNS}/${rowData.id}/360p/index.m3u8`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemAvatar>
                                          <Avatar>
                                            <ImageIcon />
                                          </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary="标清视频地址:" secondary={`http://${dns.pullDNS}/${rowData.id}/480p/index.m3u8`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemAvatar>
                                          <Avatar>
                                            <ImageIcon />
                                          </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary="高清视频地址:" secondary={`http://${dns.pullDNS}/${rowData.id}/720p/index.m3u8`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemAvatar>
                                          <Avatar>
                                            <ImageIcon />
                                          </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary="超清视频地址:" secondary={`http://${dns.pullDNS}/${rowData.id}/1080p/index.m3u8`} />
                                      </ListItem>
                                    </List>
                                  </div>
                                )
                              },
                            },
                            {
                                icon: AccountCircle,
                                tooltip: '视频播放',
                                render: rowData => {
                                  return (
                                    <div>
                                      <Tabs>
                                        <TabList>
                                          <Tab >ABR视频播放</Tab>
                                          
                                        </TabList>
                                        <TabPanel >
                                          <ListItem><QRCode
                                            value={`http://${dns.pullDNS}/${rowData.id}/index.m3u8`}  //value参数为生成二维码的链接
                                            size={100} //二维码的宽高尺寸
                                            fgColor="#000000"  //二维码的颜色
                                            includeMargin={true}
                                          />
                                            <ListItemText primary="拉流地址:" secondary={`http://${dns.pullDNS}/${rowData.id}/index.m3u8`} />
                                            <ListItemIcon></ListItemIcon>
                                          </ListItem>
                                          <Card raised={true}>
                                            <CardContent>
                                              <ClapprPlayer src={`http://${dns.pullDNS}/${rowData.id}/index.m3u8`} />
                                            </CardContent>
                                          </Card>
                                        </TabPanel>
                                       
                                      </Tabs>
                                    </div>
                                  )
                                },
                              },
                          ]}
                    />
                </Grid>
            </Grid>
        </div>

    );
}

export default App;