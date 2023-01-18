import csv
import uuid
import time
import datetime
import urllib.request
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from os.path import splitext
from http.cookiejar import CookieJar
import os
import glob
from socket import timeout


headlines_data_path = 'data/headline_data.tsv'
headlines_output_path = 'data/headline_output.tsv'
headlines_image_folder = 'export/headline_images/'

def set_headline_uuid():
  with open(headlines_data_path ,mode='r') as fd:
    rd = csv.DictReader(fd, delimiter="\t")
    # read and write csv file
    with open(headlines_output_path, mode='w') as wfd:
      # append timestamp fieldname
      fieldnames = rd.fieldnames
      # add necessary fields
      fieldnames.append('timestamp')
      fieldnames.append('domain')
      fieldnames.append('has_image')
      fieldnames.append('image_path')
      writer = csv.DictWriter(wfd, fieldnames=rd.fieldnames, delimiter="\t")
      writer.writeheader()
      for row in rd:
        # set domain
        row['domain'] = urlparse(url).netloc
        # set uuid
        row['id'] = str(uuid.uuid5(uuid.NAMESPACE_DNS, row['url']))
        # set timestamp in GMT
        timestamp = datetime.datetime.strptime(row['date'] + ' +0000', "%Y.%m.%d %z").timestamp()
        row['timestamp'] = str(int(timestamp))
        writer.writerow(row)
        # download image
        download_headline_images(row)
      print("done")

def download_headline_images(row):
  id = row['id']
  url = row['url']
  print("download_headline_images", url, id)
  has_image = False
  image_path = ''
  # check if file already exists with the same name with any extension
  if glob.glob(headlines_image_folder + id + '.*'):
    print("file already exists")
    return
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
    has_image = True
    urllib.request.urlretrieve(image_url, headlines_image_folder + id + ext)
  except urllib.request.HTTPError as inst:
    output = format(inst)
    print("error", output)
  except timeout:
    print("socket timeout")
  print("done")
  
set_headline_uuid()

# javascript timestamp to date
# https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
# var date = new Date(0); // The 0 there is the key, which sets the date to the epoch
# date.setUTCSeconds(1234567890);
# date.toUTCString();
