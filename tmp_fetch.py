import urllib.request
import re

url = "https://menlo.ai/blog/humanoid-legs-100-days"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    images = re.findall(r'<img[^>]+src="([^"]+)"', html)
    print("Found images:")
    for img in set(images):
        print(img)
except Exception as e:
    print("Error:", e)
