#!/bin/bash

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

source /root/envs.sh

cd /

# Generate the HAProxy config
/usr/bin/npm run generate-config /usr/local/etc/haproxy/haproxy.cfg.template /usr/local/etc/haproxy/haproxy.cfg 
echo "$(/bin/more /usr/local/etc/haproxy/haproxy.cfg)"
