import time
from behavior import doubleHit, humanTyping, configureDisplayToMain

configureDisplayToMain()
doubleHit('ctrl', 'd')
time.sleep(1)
humanTyping('\r')
