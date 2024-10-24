#!/bin/bash

sudo yum update -y
sudo yum install nginx -y

sudo yum install php php-fpm php-xml php-mbstring php-zip php-bcmath php-tokenizer ruby wget -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

APP_DIR="/var/www/app"
sudo mkdir -p $APP_DIR

sudo chown -R nginx:nginx $APP_DIR
sudo chown -R nginx:nginx $APP_DIR/storage $APP_DIR/bootstrap/cache
sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache

NGINX_CONF="/etc/nginx/conf.d/laravel.conf"
sudo bash -c "cat > $NGINX_CONF" <<EOL
server {
    listen 80;
    server_name _;
    root /var/www/app/public;

    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php-fpm/www.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOL

if [ -f /etc/nginx/conf.d/default.conf ]; then
    sudo rm /etc/nginx/conf.d/default.conf
fi

sudo systemctl restart nginx
sudo systemctl enable nginx

cd /home/ec2-user
wget https://aws-codedeploy-us-east-1.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent start
