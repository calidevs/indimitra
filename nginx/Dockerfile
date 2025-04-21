# Use official Nginx image as base
FROM nginx:latest

# Set working directory inside the container
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy the build files from the js folder (outside the nginx folder)
COPY ../js/build/ . 

# Copy the Nginx configuration file from the nginx folder
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/certificates

# Expose port 80
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
