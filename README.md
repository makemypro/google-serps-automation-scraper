<<<<<<< HEAD
# https://github.com/stephen-fox/chrome-docker
# Chrome Docker (unmaintained)
A Docker image that can run Google Chrome.

Please note, this project is no longer maintained. I am currently focused on
other projects, and do not have the required time to support this. Pease feel
free to fork it.

Thank you for using it. I hope that it helped :)

## How does it work?
The Docker image includes a VNC server which provides graphical access to the
virtual display running in the container.

## How do I build it?
First, start the container and its VNC server:
```
make build
```

## How do I run it?
First, start the container and its VNC server:
```
make up
```

## How do I enter container?
```
make ssh
```

## Release Strategy Images
```
# BD Strategy
make build-bd

# GMB Strategy
make build-gmb
```

**Note**: The macOS VNC client will not be able to login unless you set a
password for the VNC server. The instructions for setting a VNC password can be
found below.

By default, the VNC server is started without a password. If you would like to
specify a password for the VNC server, do the following:
# Note 5.3.22 -- this command is not necessary anymore with our Makefile
```
docker run -p 5900:5900 -e VNC_SERVER_PASSWORD=some-password --name chrome \
    --user apps --privileged <image-name>
```

Once the container is running, you can VNC into it at `127.0.0.1` and run Chrome
from a terminal window by running:
# Note 5.3.22 -- this starts the Chrome Browser inside your Docker Container
```
google-chrome --remote-debugging-port=9222 --no-sandbox --disable-notifications --start-maximized --no-first-run --no-default-browser-check
```

From inside your VNC Viewer Terminal Session, you can also start Google Chrome by right-clicking the Desktop and selecting:
```
Applications > Network > Web Browsing > Google Chrome
```


## Manick's Notes

Need a local configuration file that allows us to execute a series of these tasks.

BD = "Brand Defense"
CTR = "CTR Enhancement"
SV = "SV Manipulation"

{type: BD, keyword: 'linkgraph brand defense'},
{type: BD, keyword: 'linkgraph brand defense'},


# Task 1: Execute Brand Defense Strategy on LinkGraph to validate clicks
# Task 2: Sprinkle in Search Volume Manipulation

SV_CAMPAIGNS = "manick bhan", "kyoto bhan", "sophia deluz", "searchatlas", "the green parent", "linkgraph"
CTR_ENHANCEMENT = "white label seo", # 3.1K impressions, 4 traffic
"bigcommerce seo services", # 311 impressions, 2 traffic
"free website audit", # pos 10, 678 impressions, 7 traffic
"on page seo services", # pos 3, 827 impressions, 4 traffic, 242 clicks required!
"link building services", # pos 16, 2.6k impressions, 6 traffic

"ulta wealth management", # pos ?
"ken templeton", # pos ?

"nyctherapy"
"withtherapy"
"therapygroupdc"

swiftlane brand defense
verkada brand defense
cableinternetinmyarea
vitarx
futureinsights

nodejs scripts trigger 1 of 4 strategies, and provide specific basic parameters needed for each strategy
// 1) Brand Defense Strategy
// 2) CTR Enhancement Strategy
// 3) SV Manipulation Strategy (same as #2 just different params)
// 4) Youtube Video Watch





## Additional settings
Refer to the [configuration documentation](docs/configuration).

## Security concerns
This image starts a X11 VNC server which spawns a framebuffer. Google Chrome
also requires that the image be run with the `--privileged` flag set. This flag
disables security labeling for the resulting container. Be very careful if you
run the container on a non-firewalled host.

Some applications (such as Google Chrome) will not run under the root user. A
non-root user named `apps` is included for such scenarios.
=======
# Dominator - Chrome Docker



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/LinkLabs/dominator.git
git branch -M main
git push -uf origin main
```
