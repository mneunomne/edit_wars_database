import csv
import urllib.request
from bs4 import BeautifulSoup
from http.cookiejar import CookieJar
import glob
from socket import timeout
from urllib.parse import urlparse
from os.path import splitext

headlines_data_path = 'data/headline_data.tsv'
headlines_output_path = 'data/headline_output.tsv'
headlines_image_folder = 'export/headline_images/'

def set_image_data():
  with open(headlines_output_path ,mode='r') as fd:
    rd = csv.DictReader(fd, delimiter="\t")
    # read and write csv file
    with open(headlines_output_path, mode='w') as wfd:
      writer = csv.DictWriter(wfd, fieldnames=rd.fieldnames, delimiter="\t")
      writer.writeheader()
      for row in rd:
        # download image
        row = download_headline_images(row)
        # print('row', row)
        writer.writerow(row)
      print("done")

def download_headline_images(row):
  id = row['id']
  url = row['url']
  print("download_headline_images", url, id)
  row['has_image'] = 0
  # check if file already exists with the same name with any extension
  file = glob.glob(headlines_image_folder + id + '.*')
  if file:
    print("file already exists", file[0])
    row['has_image'] = 1
    row['image_path'] = str(file[0])
    return row
  try:
    req=urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'refere': 'https://example.com', 'Connection': 'keep-alive',   'cookie': 'cookie'})    
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    response = opener.open(req, timeout=10)
    # print(response.getcode())
    html = response.read().decode('utf8', errors='ignore')
    soup = BeautifulSoup(html)
    image_tag = soup.find("meta", property="og:image")
    if image_tag is None:
      print("error", "no image tag")
      return
    image_url = image_tag["content"]
    print("image_url", image_url)
    # if image_url doesnt start with http add the domain of the url to the start of the string
    if not image_url.startswith('http'):
      image_url = urlparse(url).scheme + '://' + urlparse(url).netloc + image_url
      print("new image_url", image_url)
    path = urlparse(image_url).path
    ext = splitext(path)[1]
    urllib.request.urlretrieve(image_url, headlines_image_folder + id + ext)
    row['has_image'] = 1
    row['image_path'] = headlines_image_folder + id + ext
  except urllib.request.HTTPError as inst:
    row['has_image'] = 0
    output = format(inst)
    print("error", output)
  except timeout:
    row['has_image'] = 0
    print("socket timeout")
  print("done")
  return row

set_image_data()