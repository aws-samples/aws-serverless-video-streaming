// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React, { Component } from 'react';
import { withFormik, Form, Field } from 'formik';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import axios from 'axios'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import DnsIcon from '@material-ui/icons/Dns';
import Typography from '@material-ui/core/Typography';
const form_id = 'form_id';

const api = axios.create({
    //baseURL: `http://localhost:8080`
})
class MaintenanceForm extends Component {

    editOnClick = (event) => {
        event.preventDefault()
        const data = !(this?.props?.status?.edit)
        this.props.setStatus({
            edit: data,
        })
    }

    cancelOnClick = (event) => {
        event.preventDefault()
        this.props.resetForm()
        this.props.setStatus({
            edit: false,
        })
    }

    _renderAction() {
        return (
            <div style={{ marginLeft: "8px", marginTop: "8px" }}>
                {
                    this?.props?.status?.edit ?
                        <React.Fragment>
                            <Button variant="contained" type="submit" form={form_id}>保存</Button>
                            <Button variant="contained" onClick={this.cancelOnClick} style={{ marginLeft: "8px" }}>取消</Button>
                        </React.Fragment>
                        :
                        <Button variant="contained" onClick={this.editOnClick}>编辑</Button>
                }
            </div>
        );
    }

    _renderFormView = () => {
        return (
            <React.Fragment>
                <div >
                    <Typography variant="subtitle1" gutterBottom>
                        <DnsIcon /> 推流域名:
                </Typography>
                    <div>
                        <label type="text" name="pushDNS" className="form-control">
                            {this?.props?.fields?.pushDNS}
                        </label>
                    </div>
                </div>
                <div >
                    <Typography variant="subtitle1" gutterBottom>
                        <DnsIcon /> 拉流域名:
                </Typography>
                    <div >
                        <label type="text" name="pullDNS" className="form-control">
                            {this?.props?.fields?.pullDNS}
                        </label>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    _renderFormInput = () => {
        return (
            <React.Fragment>
                <div>
                    <Typography variant="subtitle1" gutterBottom>
                        <DnsIcon /> 推流域名:
                </Typography>
                    <div>
                        <Field type="text" name="pushDNS" className="form-control" placeholder="pushDNS" />
                    </div>
                </div>
                <div  >
                    <Typography variant="subtitle1" gutterBottom>
                        <DnsIcon /> 拉流域名:
                </Typography>
                    <div>
                        <Field type="text" name="pullDNS" className="form-control" placeholder="pullDNS" />
                    </div>
                </div>
            </React.Fragment>
        );
    }

    render() {
        return (
            <Card raised={false} color="inherit" variant="outlined">
                <CardHeader variant="h6"
                    title={'域名配置'}
                />
   
                <Divider style={{ marginTop: "8px" }} />
                <CardContent>
                    <Form id={form_id}>
                        {
                            this?.props?.status?.edit
                                ?
                                this._renderFormInput()
                                :
                                this._renderFormView()
                        }
                    </Form>

                    {this._renderAction()}
                </CardContent>
            </Card>
        );
    }
}

const FormikForm = withFormik({
    mapPropsToStatus: (props) => {
        return {
            edit: props?.edit || false,
        }
    },
    mapPropsToValues: (props) => {

        return {
            pushDNS: props.fields.pushDNS,
            pullDNS: props.fields.pullDNS,
        }
    },
    enableReinitialize: true,
    handleSubmit: (values, { props, ...actions }) => {
        console.log(values);
        api.post("/streamdns", values).then(res => {
            props.updateFields(values);
            actions.setStatus({
                edit: false,
            });
        }).catch(error => {

        })

    }
})(MaintenanceForm);

export default FormikForm;