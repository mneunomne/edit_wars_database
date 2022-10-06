# edit wars database


### converting .csv files to utf-8

Tableau apparently exports the .csv files in utf-16le encoding. So they need to be converted to utf-8. 

Some of the following commands are useful (assuming the input file is utf-16le):

__converting a single file:__
```sh
iconv -f utf-16le -t utf-8 filename.csv > filename.csv.tmp && mv filename.csv.tmp filename.csv
```

__converting all files in folder:__
```sh
sh convert_to_utf8.sh
```

### list exports 

```sh 
find ./export -type f -name "*.json" > exports.txt
```

### download all exports to local folder

```sh
wget -i ./exports.txt
``` 