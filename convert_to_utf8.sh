#!/bin/bash

echo "converting .csv files to utf-8 encoding."

BASEDIR=$PWD

for d in data/narratives/*/ ; do
    cd $d
    for file in *.csv; do
        encoding=`file -I $file | cut -f 2 -d";" | cut -f 2 -d=`
        #echo "converting: $encoding"
        if [ "$encoding" = "utf-16le" ]; then
          echo "converting: $file"
          iconv -f utf-16le -t utf-8 "$file" > "$file".tmp &&
          mv "$file.tmp" "$file"
        fi
    done
    echo "basedir: $BASEDIR"
    cd $BASEDIR
done