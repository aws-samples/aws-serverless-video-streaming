// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React, { useState } from 'react';
import FormikForm from './FormikForm';
import axios from 'axios'

 
const api = axios.create({
    //baseURL: `http://localhost:8080`
})



function DnsForm() {


  const [fields, updateFields] = useState(
    {
      pushDNS: '',
      pullDNS: '',
    }
  );

  React.useEffect(() => {
    api.get("/streamdns").then(res => { 
    updateFields(res.data.data);
    }).catch(error => {
    
    }) 
  }, []);

  return (
    
    <div className="container">
      <FormikForm fields={fields} updateFields={updateFields}/>
    </div>
  );
}

export default DnsForm;