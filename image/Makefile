# inside chrome container
LOCAL_WEB_CONTAINER=chrome
ENV_VARS=DEBUG=1

build:
	docker-compose up -d --build --remove-orphans
# run:
#     docker run -p 5900:5900 -v :/usr/src/app --name chrome --user apps --privileged image_chrome

build-bd:
	docker build -t arslanhashmi/strategy_bd:latest .
	docker push arslanhashmi/strategy_bd:latest

build-gmb:
	docker build -t arslanhashmi/strategy_gmb:latest .
	docker push arslanhashmi/strategy_gmb:latest


build-bl:
	docker build -t arslanhashmi/strategy_bl:latest .
	docker push arslanhashmi/strategy_bl:latest


ssh:
	docker exec -it chrome /bin/bash

up:
	docker-compose up -d

stop:
	docker-compose stop

requirements:
	docker exec -it $(LOCAL_WEB_CONTAINER) bash -c "pip install --exists-action w -r requirements.txt"


# run inside docker container
# inside docker container run launch_chrome.sh
# launch-chrome:
#     google-chrome --remote-debugging-port=9222 -no-sandbox --disable-notifications --start-maximized --no-first-run --no-default-browser-check --proxy-server="http://192.168.1.107:36520"

#     --proxy-server="http://192.168.1.107:1042"



https://blog.apify.com/how-to-make-headless-chrome-and-puppeteer-use-a-proxy-server-with-authentication-249a21a79212/
--proxy-server=http://bob:password123@proxy.example.com:8000