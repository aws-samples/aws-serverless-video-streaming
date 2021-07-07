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
import './App.css';


const api = axios.create({
    //baseURL: `http://localhost:8080`
})


function App() {
    var columns = [
        { title: "名称", field: "videoname", editable: 'never' },
        { title: "直播中继", field: "isRelay",type: 'boolean', initialEditValue: false, render: rowData => rowData.isRelay === true ? <Switch size="small" checked={true} /> : <Switch size="small" checked={false} /> },
        { title: "转播URL", field: "relayURL",validate: rowData => rowData.relayURL === '' ? 'URL不能为空' : ''  }
     ]
    
    const [data, setData] = useState([]); //table data
    const [iserror, setIserror] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessages, setErrorMessages] = useState([])

    useEffect(() => {
        setIsLoading(true)
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
                        title="视频中继"
                        columns={columns}
                        localization={{
                            body: {
                                emptyDataSourceMessage: "没有视频元数据",
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
                                actions: '修改'
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
                        editable={{
                            onRowUpdate: (newData, oldData) =>
                                new Promise((resolve) => {
                                    handleRowUpdate(newData, oldData, resolve);
                                })
                        }}
                    />
                </Grid>
            </Grid>
        </div>

    );
}

export default App;