#!/bin/bash

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

# Regenerate HAProxy config
/bin/bash /generate-haproxy.sh

# Reload HAProxy config
HA_PROXY_ID=$(more /var/run/haproxy.pid)
kill -USR2 $HA_PROXY_ID
