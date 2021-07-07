#!/bin/bash

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

# Regenerate NGINX config
/bin/bash /generate-nginx.sh

# Reload NGINX config
/usr/sbin/nginx -s reload
