// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React, { useState, useEffect } from 'react';
import './App.css';
import Grid from '@material-ui/core/Grid'
import MaterialTable from "material-table";
import Refresh from '@material-ui/icons/Refresh';

import axios from 'axios'

import 'react-tabs/style/react-tabs.css';
import Switch from '@material-ui/core/Switch';
import tableIcons from './tableIcon.js'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ClapprPlayer from './clappr-player';
import QRCode from 'qrcode.react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import AccountCircle from '@material-ui/icons/AccountCircle';
import OndemandVideoIcon from '@material-ui/icons/OndemandVideo';


import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import Player from './player';


const api = axios.create({
    //baseURL: `http://localhost:8080`
})


function App() {
    var columns = [
        { title: "名称", field: "Name"},
        { title: "FLV输出", field: "isFlv", type: 'boolean', render: rowData => rowData.isFlv === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "HLS输出", field: "isHls", type: 'boolean',   render: rowData => rowData.isHls === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "CMAF输出", field: "isCMAF", type: 'boolean',   render: rowData => rowData.isCMAF === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "图像输出", field: "isImage", type: 'boolean',   render: rowData => rowData.isImage === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },

    ]
    const [data, setData] = useState([]); //table data
    const [isLoading, setIsLoading] = useState(false)
    const [dns,setDNS]=useState([]);

    useEffect(() => {
        setIsLoading(true)
        api.get("/streamdns").then(res => { 
            setDNS(res.data.data);
            }).catch(error => { 
            }) 
        api.get("/videostreams/online")
            .then(res => {
                 console.log(res);
                setData(res.data.data)
            })
            .catch(error => {
                console.log("Error")
            })
        setIsLoading(false)
    }, [])

    const refresh = (resolve) => {
        setIsLoading(true)
        api.get("/videostreams/online")
            .then(res => {
                setData(res.data.data)
            })
            .catch(error => {
                console.log("Error")
            })
        setIsLoading(false)
    }

    const tableRef = React.createRef();

    const [selectedRow, setSelectedRow] = useState(null);

    return (
        <div className="App"  >
            <Grid container justify="center" style={{ backgroundColor: '#grey', padding: 2 }}>

                <Grid item xs  >
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
                        title="在线视频"
                        columns={columns}
                        localization={{
                            body: {
                                emptyDataSourceMessage: "没有直播视频",
                                addTooltip: '新增',
                                deleteTooltip: '删除',
                                editTooltip: '编辑',
                                filterRow: {
                                    filterTooltip: '过滤'
                                },
                                editRow: {
                                    deleteText: '确认删除?',
                                    cancelTooltip: '取消',
                                    saveTooltip: '确认'
                                }
                            },
                            header: {
                                actions: '操作'
                            },
                            pagination: {
                                labelDisplayedRows: '{from}-{to} of {count}',
                                labelRowsSelect: '行',
                                labelRowsPerPage: '每页行数:',
                                firstAriaLabel: '第一页',
                                firstTooltip: '第一页',
                                previousAriaLabel: '上页',
                                previousTooltip: '上页',
                                nextAriaLabel: '下页',
                                nextTooltip: '下页',
                                lastAriaLabel: '最后一页',
                                lastTooltip: '最后一页'
                            },
                            toolbar: {
                                exportTitle: '导出',
                                exportAriaLabel: '导出',
                                exportName: '导出到CSV',
                                searchTooltip: '搜索',
                                searchPlaceholder: '搜索'
                            }
                        }}
                        data={data}
                        icons={tableIcons}
                        style={{ padding: '0 10px' }}
                        detailPanel={[
                            {
                icon: OndemandVideoIcon,
                tooltip: '视频播放',
                render: rowData => {
                  return (
                    <div>
                      <Tabs>
                        <TabList>
                          <Tab >FLV播放</Tab>
                          <Tab >HLS播放</Tab>
                          <Tab >CMAF HLS播放</Tab>
                          <Tab >CMAF DASH播放</Tab>
                        </TabList>
                        <TabPanel >
                          <ListItem><QRCode
                            value={`http://${dns.pullDNS}/${rowData.UUID}/live.flv`}  //value参数为生成二维码的链接
                            size={100} //二维码的宽高尺寸
                            fgColor="#000000"  //二维码的颜色
                            includeMargin={true}
                          />
                            <ListItemText primary="拉流地址:" secondary={`http://${dns.pullDNS}/${rowData.UUID}/live.flv`} />
                            <ListItemIcon></ListItemIcon>
                          </ListItem>
                          <Card raised={true}>
                            <CardContent>
                              <Player url={`http://${dns.pullDNS}/${rowData.UUID}/live.flv`} />
                            </CardContent>
                          </Card>
                        </TabPanel>
                        <TabPanel>
                          <ListItem><QRCode
                            value={`http://${dns.pullDNS}/${rowData.UUID}/live.m3u8`}  //value参数为生成二维码的链接
                            size={100} //二维码的宽高尺寸
                            fgColor="#000000"  //二维码的颜色
                            includeMargin={true}
                          />
                            <ListItemText primary="拉流地址:" secondary={`http://${dns.pullDNS}/${rowData.UUID}/live.m3u8`} />
                            <ListItemIcon></ListItemIcon>
                          </ListItem>
                          <Card raised={true}>
                            <CardContent>
                              <ClapprPlayer
                                src={`http://${dns.pullDNS}/${rowData.UUID}/live.m3u8`}
                              />
                            </CardContent>
                          </Card>
                        </TabPanel>
                        <TabPanel>
                          <ListItem>
                            <QRCode
                              value={`http://${dns.pullDNS}/${rowData.UUID}/master.m3u8`}  //value参数为生成二维码的链接
                              size={100} //二维码的宽高尺寸
                              fgColor="#000000"  //二维码的颜色
                              includeMargin={true}
                            />
                            <ListItemText primary="拉流地址:" secondary={`http://${dns.pullDNS}/${rowData.UUID}/master.m3u8`} />
                          </ListItem>
                          <Card raised={true}>
                            <CardContent>
                              <ClapprPlayer src={`http://${dns.pullDNS}/${rowData.UUID}/master.m3u8`} />
                            </CardContent>
                          </Card>
                        </TabPanel>
                        <TabPanel>
                          <ListItem><QRCode
                            value={`http://${dns.pullDNS}/${rowData.UUID}/manifest.mpd`}  //value参数为生成二维码的链接
                            size={100} //二维码的宽高尺寸
                            fgColor="#000000"  //二维码的颜色
                            includeMargin={true}
                          />
                            <ListItemText primary="拉流地址:" secondary={`http://${dns.pullDNS}/${rowData.UUID}/manifest.mpd`} />
                          </ListItem>
                          <Card raised={true}>
                            <CardContent>
                              <ClapprPlayer
                                src={`http://${dns.pullDNS}/${rowData.UUID}/manifest.mpd`}
                              />
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