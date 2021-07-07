// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Navbar from './navbar';
import Media from './cardmedia';
import Dns from './dnsEditor';

function App() {
  return (
      <BrowserRouter >
      <Switch>
      <Route path="/view" component={Media}/>
      <Route path="/dns" component={Dns}/>
      <Route path="/" component={Navbar}/>
      </Switch>
      </BrowserRouter>
   
  );
}

export default App;