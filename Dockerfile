FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY index.js /usr/share/nginx/html/index.js
