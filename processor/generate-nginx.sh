#!/bin/bash

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

source /root/envs.sh

# Generate the NGINX config
node index.js ./nginx.conf.template ./nginx.conf.bak 

