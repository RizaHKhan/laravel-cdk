#!/bin/bash

yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

/bin/bash -c "$(curl -fsSL https://php.new/install/linux)"
source /root/.bashrc

# cd /var/www
# laravel new app
# chown -R ec2-user:ec2-user /var/www/app
#
# php -S 0.0.0.0:8000 -t /var/www/my-laravel-app/public &
#
