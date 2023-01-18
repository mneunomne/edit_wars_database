#!/usr/bin/env python
# -*- coding: utf-8 -*-

from os.path import splitext
import urllib.request
from urllib.parse import urlparse 
from bs4 import BeautifulSoup
import uuid

img_folder = 'scraping/'

url = 'https://www.pnp.ru/politics/volodin-ukraina-vsyo-bolshe-skatyvaetsya-k-gosudarstvu-s-nacionalisticheskoy-ideologiey.html'

# generate a consistent uuid from a string seed
id = uuid.uuid5(uuid.NAMESPACE_DNS, url)
id = str(id)

with urllib.request.urlopen(url) as response:
  html = response.read()
  soup = BeautifulSoup(html)

  image_tag = soup.find("meta", property="og:image")
  image_url = image_tag["content"]

  path = urlparse(image_url).path
  ext = splitext(path)[1]

  print("extension", ext)

  urllib.request.urlretrieve(image_url, img_folder + id + ext)
  

# make function return value using with statement
# https://stackoverflow.com/questions/1984325/explaining-pythons-enter-and-exit
# https://stackoverflow.com/questions/1984325/explaining-pythons-enter-and-exit/1984671#1984671
# https://stackoverflow.com/questions/1984325/explaining-pythons-enter-and-exit/1984671#1984671
