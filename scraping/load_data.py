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
import asyncio

headlines_data_path = 'data/headline_data.tsv'
headlines_output_path = 'data/headline_output.tsv'
headlines_output_path_image = 'data/headline_images_output.tsv'
headlines_image_folder = 'export/headline_images/'
fieldnames = []

def set_headline_uuid():
  with open(headlines_data_path ,mode='r') as fd:
    rd = csv.DictReader(fd, delimiter="\t")
    # read and write csv file
    with open(headlines_output_path, mode='w') as wfd:
      # append timestamp fieldname
      fieldnames = rd.fieldnames
      # add necessary fields
      fieldnames.append('title')
      fieldnames.append('timestamp')
      fieldnames.append('has_image')
      fieldnames.append('description')
      fieldnames.append('keywords')
      writer = csv.DictWriter(wfd, fieldnames=rd.fieldnames, delimiter="\t")
      writer.writeheader()
      for row in rd:
        # set domain
        row['domain'] = urlparse(row['url']).netloc
        # set uuid
        row['id'] = str(uuid.uuid5(uuid.NAMESPACE_DNS, row['url']))
        # set timestamp in GMT
        timestamp = datetime.datetime.strptime(row['date'] + ' +0000', "%Y.%m.%d %z").timestamp()
        row['timestamp'] = str(int(timestamp))
        # download image
        # row = download_headline_images(row)
        # print('row', row)
        writer.writerow(row)
      print("done")
  asyncio.run(set_image_data())

async def set_image_data():
  with open(headlines_output_path ,mode='r') as fd:
    rd = csv.DictReader(fd, delimiter="\t")
    # read and write csv file
    with open(headlines_output_path_image, mode='w') as wfd:
      writer = csv.DictWriter(wfd, fieldnames=rd.fieldnames, delimiter="\t")
      writer.writeheader()
      i = 0
      for row in rd:
        # last one: 2354
        # download image
        if i > 7087:
          row = await download_headline_images(row)
          print('row', row)
          writer.writerow(row)
          print("written row", i)
        i += 1

async def download_headline_images(row):
  id = row['id']
  url = row['url']
  image_already_downloaded = False
  print("download_headline_images", url, id)
  row['has_image'] = 0
  # check if file already exists with the same name with any extension
  file = glob.glob(headlines_image_folder + id + '.*')
  if file:
    print("file already exists", file[0])
    row['has_image'] = 1
    row['image_path'] = str(file[0])
    image_already_downloaded = True
    # return row
  try:
    req=urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'refere': 'https://example.com', 'Connection': 'keep-alive',   'cookie': 'cookie'})    
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    response = opener.open(req, timeout=1)
    # print(response.getcode())
    html = response.read().decode('utf8', errors='ignore')
    soup = BeautifulSoup(html)
    image_tag = soup.find("meta", property="og:image")
    if image_tag is None:
      print("error", "no image tag")
      return row
    image_url = image_tag["content"]
    print("image_url", image_url)
    # if image_url doesnt start with http add the domain of the url to the start of the string
    if not image_url.startswith('http'):
      image_url = urlparse(url).scheme + '://' + urlparse(url).netloc + image_url
      print("new image_url", image_url)
    path = urlparse(image_url).path
    ext = splitext(path)[1]
    row['has_image'] = 1
    row['image_path'] = headlines_image_folder + id + ext
    row['image_url'] = image_url
    # get image if it is not downloaded
    if image_already_downloaded == False:
      urllib.request.urlretrieve(image_url, headlines_image_folder + id + ext)
    # get description
    description_tag = soup.find("meta", property="og:description")
    if description_tag is None:
      print("error", "no description tag")
      row['description'] = ''
    else:
      row['description'] = description_tag["content"]
    # get keywords
    keywords_tag = soup.find("meta", attrs={'name':'keywords'})
    if keywords_tag is None:
      print("error", "no keywords tag")
      row['keywords'] = ''
    else:
      row['keywords'] = keywords_tag["content"]
    # get title
    title_tag = soup.find("meta", property="og:title")
    if title_tag is None:
      print("error", "no title tag")
      row['title'] = ''
    else:
      row['title'] = title_tag["content"]
  except urllib.request.HTTPError as inst:
    row['has_image'] = 0
    output = format(inst)
    print("error", output)
    return row
  except timeout:
    row['has_image'] = 0
    print("socket timeout")
    return row
  except ConnectionError as e:
    row['has_image'] = 0
    print("ConnectionError", e)
    return row
  except Exception as e:
    row['has_image'] = 0
    print("error", e)
    return row
  print("done image")
  return row
  
set_headline_uuid()

# javascript timestamp to date
# https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
# var date = new Date(0); // The 0 there is the key, which sets the date to the epoch
# date.setUTCSeconds(1234567890);
# date.toUTCString();
