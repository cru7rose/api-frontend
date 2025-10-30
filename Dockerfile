# -----------------------------
# Build stage
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -----------------------------
# Runtime stage (nginx)
# -----------------------------
FROM nginx:stable-alpine

# 1) Clean the default vhost and add ours
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2) Ship the built SPA
#    Use a safe ownership/permission set so nginx can read files
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Optional: smaller, safer image
# RUN adduser -D -H -s /sbin/nologin web && \
#     chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
