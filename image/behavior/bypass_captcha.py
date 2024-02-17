import json

import deathbycaptcha
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import NoSuchElementException


USERNAME = 'marslan'  # Your DBC username here
PASSWORD = 'Found?tion11'  # Your DBC password here


def solve_captcha(captcha: dict):
    json_captcha = json.dumps(captcha)
    client = deathbycaptcha.SocketClient(USERNAME, PASSWORD)

    try:
        print('Solving captcha...')
        client.is_verbose = True
        result = client.decode(type=4, token_params=json_captcha)

        return result.get('text')

    except Exception as e:
        print(e)
        return None


def bypass_captcha(captcha_url: str = None):

    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

    with webdriver.Chrome(options=chrome_options) as driver:  # using Chrome
        print("CAPTCHA_URL !", captcha_url)
        driver.get(captcha_url)

        try:
            # Find the captcha by id located in page
            element: WebElement = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "recaptcha"))
            )
        except Exception as e:
            print(e)
            return

        google_key = element.get_dom_attribute('data-sitekey')
        print('GoogleKey: %s' % google_key)

        captcha = {
            # not using proxy in this example
            'googlekey': google_key,
            'pageurl': captcha_url
        }

        solution = solve_captcha(captcha)
        if not solution:
            print('No captcha solution (maybe implement retry)...closing')
            return

        print('Solution: %s' % solution)
        try:
            # Send the solution to solve the captcha
            driver.execute_script('document.getElementById("g-recaptcha-response").innerHTML = "{}";'.format(solution))
            time.sleep(1)
            driver.execute_script(f"submitCallback('{solution}');")

        except NoSuchElementException as e:
            print("Success message not found: %s" % str(e))


if __name__ == '__main__':
    bypass_captcha(captcha_url=sys.argv[1])
