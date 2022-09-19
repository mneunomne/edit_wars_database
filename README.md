# edit wars database

## converting the data files

### converting .csv files to utf-8

Tableau apparently exports the .csv files in utf-16le encoding. So they need to be converted to utf-8. 

Some of the following commands are useful (assuming the input file is utf-16le):

__converting a single file:__
```sh
iconv -f utf-16le -t utf-8 filename.csv > filename.csv.tmp && mv filename.csv.tmp filename.csv
```

__converting all files in folder:__
```sh
for file in *.csv; do                                                  
    iconv -f utf-16le -t utf-8 "$file" > "$file".tmp &&
    mv "$file.tmp" "$file"
done
```