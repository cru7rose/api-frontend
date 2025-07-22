# --- STAGE 1: Budowanie aplikacji Vue ---
# Używamy oficjalnego obrazu Node.js jako bazy do budowania
FROM node:20-alpine AS builder

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy pliki package.json i package-lock.json
COPY package*.json ./

# Instalujemy wszystkie zależności projektu
RUN npm install

# Kopiujemy resztę plików źródłowych aplikacji
COPY . .

# Budujemy aplikację do wersji produkcyjnej. Powstanie folder /app/dist
RUN npm run build


# --- STAGE 2: Serwowanie zbudowanych plików przez Nginx ---
# Używamy lekkiego obrazu serwera Nginx jako finalnej bazy
FROM nginx:stable-alpine

# Kopiujemy zbudowane pliki ze STAGE 1 do folderu, z którego Nginx serwuje strony
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiujemy naszą własną konfigurację Nginx (plik nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Otwieramy port 80 wewnątrz kontenera, na którym Nginx będzie nasłuchiwał
EXPOSE 80

# Komenda, która uruchomi serwer Nginx po starcie kontenera
CMD ["nginx", "-g", "daemon off;"]