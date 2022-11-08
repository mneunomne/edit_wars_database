# Edit Wars Database API 

### [Word Connection Graph](https://editwarsteam.github.io/edit_wars_api/force-graph/)

The Edit Wars Database API server to convert all the data files into the desired data-structures for the front-end of the project website.

## Installation

```
npm install
```

## Run

- **Convert all data exported from tableau in order to be compatible with [ChartJS](https://www.chartjs.org/):**

    ```sh
    npm run convert_bar_chart
    ```

- **Convert all data exported from google colab in order to be compatible with [ChartJS](https://www.chartjs.org/):**

    ```sh
    npm run convert_bar_colab
    ```

- **Convert all tableau word connection data into [3d-force-graph](https://github.com/vasturiano/3d-force-graph) data structure:**

    ```sh
    npm run convert_full_word_cloud
    ```

## Datapaths

Parse the [exports.txt](https://raw.githubusercontent.com/EditWarsTeam/edit_wars_api/main/exports.txt) file in order to access the json data files, with the following prefix: 

```sh
https://cdn.jsdelivr.net/gh/mneunomne/EditWarsTeam/export/${path_to_file}
```

## 3d-force-graph

The Word Connection Graph is rendered using the [3d-force-graph](https://github.com/vasturiano/3d-force-graph) library:

<img width="600" alt="Screenshot 2022-09-29 at 17 48 12" src="https://user-images.githubusercontent.com/4967860/193078452-49805368-5c76-4a6c-afae-ed04bb79deca.png">


## Other Commands 

__converting .csv files to utf-8:__

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

__list exports:__

```sh 
find ./export -type f -name "*.json" > exports.txt
```

__download all exports to local folder:__

```sh
wget -i ./exports.txt
``` 
