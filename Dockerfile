FROM nginx:alpine

# Copiar o arquivo HTML para o nginx
COPY frontend/index.html /usr/share/nginx/html/

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
