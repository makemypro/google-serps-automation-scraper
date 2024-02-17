import requests

proxy_ip = "192.168.1.107"
proxy_port = "36520"
proxy_user = "azul"
proxy_pass = "cielo"

proxies = {
    "http": f"http://{proxy_user}:{proxy_pass}@{proxy_ip}:{proxy_port}/",
    "https": f"http://{proxy_user}:{proxy_pass}@{proxy_ip}:{proxy_port}/"
}

token = "7e900b9e6e0d93df5fc975009937d0f1f92d5658"

headers = {
    'Authorization': f'Token {token}'
}

def test_proxy_works():
    url = 'https://checkip.amazonaws.com'
    response = requests.get(url, proxies=proxies, timeout=5)
    print(response)
    return response


def ip_rotate(modem_index):
    url = 'http://' + proxy_ip + f'/api/rotate?index={modem_index}'
    response = requests.get(url, headers=headers)
    print(response)
    return response