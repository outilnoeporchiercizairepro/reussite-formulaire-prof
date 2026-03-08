
FROM nginx:alpine

# Optionnel mais recommandé pour éviter le cache navigateur en dev:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/index.html
COPY script.js /usr/share/nginx/html/script.js
COPY style.css /usr/share/nginx/html/style.css

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
