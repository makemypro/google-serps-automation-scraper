FROM ubuntu:20.04
WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set correct timezone
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get install python3 tesseract-ocr python3-pip curl unzip -yf


RUN apt-get update && apt-get clean && apt-get install -y \
    x11vnc \
    xvfb \
    fluxbox \
    wmctrl \
    wget \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get -y install google-chrome-stable

# Install git for deathbycaptcha library installation
RUN apt-get update && apt-get install -y git


### NEW ADDITIONS
# Makes it easier to SSH into docker and install new libraries as needed
RUN echo 'root:test' | chpasswd

RUN apt-get install -y poppler-utils
RUN apt-get clean
RUN apt-get install htop

RUN DEBIAN_FRONTEND=noninteractive apt-get -y install wget libcairo2-dev \
   libjpeg-dev libpango1.0-dev libgif-dev build-essential g++ libgl1-mesa-dev libxi-dev \
   libx11-dev pulseaudio udev
# From stealthy-scraping-tools Dockerfile
# START -
RUN DEBIAN_FRONTEND=noninteractive apt install -y python3-xlib xvfb xserver-xephyr python3-tk python3-dev
# END -

RUN curl --silent --location https://deb.nodesource.com/setup_14.x | bash - &&\
  apt-get -y -qq install nodejs

# Move this into requirements.txt at some time
RUN pip3 install pyautogui python-xlib PyVirtualDisplay

RUN apt-get install -y fonts-roboto fonts-ubuntu ttf-bitstream-vera fonts-crosextra-caladea fonts-cantarell fonts-open-sans ttf-wqy-zenhei

# install debs error if combine together
RUN apt install -y --no-install-recommends --allow-unauthenticated x11vnc fluxbox xxd \
    && apt autoclean -y \
    && apt autoremove -y \
    && rm -rf /var/lib/apt/lists/*

RUN npm install chrome-remote-interface -g
RUN npm install chrome-remote-interface
RUN npm install chrome-launcher

EXPOSE 9222

### ENDNEW ADDITIONS

RUN useradd apps \
    && mkdir -p /home/apps \
    && chown -v -R apps:apps /home/apps



# Application specific environment variables
# disp = Display(visible=True, size=(1920, 1080), backend="xvfb", use_xauth=True); disp.start()
# set's DISPLAY=:1
ENV DISPLAY=:1
# By default, only screen 0 exists and has the dimensions 1280x1024x8
ENV XVFB_WHD=1920x1080x24
# x11vnc password
ENV X11VNC_PASSWORD=test
# This variable tells our source code that its invoked within a Docker container
ENV DOCKER=1

COPY . .

RUN pip install -r requirements.txt
