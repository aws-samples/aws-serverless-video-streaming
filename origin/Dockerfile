# SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: MIT-0 License

FROM nginx:1.19.5

# Install deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends python-pip curl unzip cron supervisor
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
# RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y npm

# Add NGINX template
ADD index.js /index.js
RUN mkdir /server
COPY server/. /server
ADD package.json /package.json
RUN npm install

# Add NGINX entrypoint
COPY docker-entrypoint.sh /
RUN chmod a+x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Copy configs
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx.cors.conf /etc/nginx/nginx.cors.conf

# Copy scripts
COPY reload-nginx.sh /
RUN chmod a+x /reload-nginx.sh
COPY generate-nginx.sh /
RUN chmod a+x /generate-nginx.sh

# Add cron task to reload NGINX config
RUN echo "* * * * * /bin/bash /reload-nginx.sh > /proc/1/fd/1 2>/proc/1/fd/2\n" >> /etc/cron.d/reload-nginx-cron
RUN crontab /etc/cron.d/reload-nginx-cron

# Configure app
EXPOSE 80

# Add supervisord config
RUN mkdir /var/logs
RUN touch /var/logs/supervisord.log
RUN chmod a+rw /var/logs/supervisord.log
ADD supervisord.conf /etc/supervisord.conf

# Start NGINX
CMD ["supervisord", "--nodaemon", "-c", "/etc/supervisord.conf"]