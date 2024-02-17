import behavior
from behavior import humanTyping
from sst_utils import startBrowser
import time

startBrowser()
behavior.configureDisplayToMain()

humanTyping('whats my ip')
humanTyping('\r')

time.sleep(1)

humanTyping('azul')
humanTyping('\t')
humanTyping('cielo')
humanTyping('\r')
humanTyping('\r')

startBrowser()
behavior.configureDisplayToMain()
