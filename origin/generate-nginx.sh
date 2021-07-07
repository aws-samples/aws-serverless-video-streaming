#!/bin/bash

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

source /root/envs.sh

cd /

# Generate the NGINX config
/usr/bin/npm run generate-config /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf 
# echo "$(/bin/more /etc/nginx/nginx.conf)"
