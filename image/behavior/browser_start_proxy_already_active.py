import os
import behavior
from behavior import humanTyping
from sst_utils import startBrowser, goto
import time


username = os.environ.get('PROXY_USERNAME')
password = os.environ.get('PROXY_PASSWORD')

behavior.configureDisplayToMain()

time.sleep(3)
goto('https://www.whatsmyip.org/')

time.sleep(3)

humanTyping(username)
humanTyping('\t')
humanTyping(password)
humanTyping('\r')
humanTyping('\r')


time.sleep(1)
