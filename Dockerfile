FROM node:20-alpine AS build

# Set environment variables
ENV VITE_API_BASE_URL=
ENV VITE_GOOGLE_CLIENT_ID=

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

FROM nginx:stable-alpine

COPY --from=build /app/dist /var/www/html
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
