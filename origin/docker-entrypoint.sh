#!/bin/sh

# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

set -e

# Copy all environment vars to /root/envs.sh so we can us them in our cron job
env | sed 's/^\(.*\)$/export \1/g' > /root/envs.sh
chmod +x /root/envs.sh

# Generate the NGINX config using the template.
/bin/bash /generate-nginx.sh

# Restart cron
service cron restart

# Start NGINX
exec "$@"