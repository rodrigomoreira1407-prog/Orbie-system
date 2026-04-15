FROM nginx:alpine

# Copiar o arquivo HTML para o nginx
COPY frontend/index.html /usr/share/nginx/html/

# O nginx:alpine processa arquivos em /etc/nginx/templates/ com envsubst automaticamente
# Isso permite usar ${PORT} no arquivo de configuração
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
