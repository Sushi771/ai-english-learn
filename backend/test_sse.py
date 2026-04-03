import requests
import json

url = "http://127.0.0.1:8080/v1/chat_test"
payload = {
    "text": "Tell me about English learning in 3 sentences",
    "stream": True
}

response = requests.post(url, json=payload, stream=True)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
