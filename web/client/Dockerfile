FROM node:13.12.0-alpine as build-deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set registry http://r.cnpmjs.org/

RUN npm ci -qy
COPY . .
RUN npm run  build

# Stage 2 - the production environment
FROM nginx:1.12-alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]