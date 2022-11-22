var fs = require('fs'); 
const { parse } = require("csv-parse");
var path = require('path')
const csv=require('csvtojson');
const { resolve } = require('path');
const uuid = require('uuid');

const utils = require('./utils')

const contentPath = 'data/content_table/content_table.csv'


const contentExportPath = 'export/content/'

const narratives = ['', 'freezing-europe','protecting-russian-world','mythical-nazis', 'cold-war-ii']


const readContentFile = () => {
  return csv({delimiter: ','}).fromFile(contentPath)
}

const getContent = () => {
  return new Promise((resolve, reject) => {
    readContentFile().then((contents)=>{
      var contentData = {"steps": [], "backgrounds": []}
      contents.forEach(content => {
        //console.log("content", content)
        //step
        const narrativeId = narratives.indexOf(content.narrative)
        // create narrative folder if it doesnt exist
        const narrativeFolder = contentExportPath + narrativeId
        if (narrativeId > 0 && !fs.existsSync(narrativeFolder)) {
          fs.mkdirSync(narrativeFolder);
          fs.mkdirSync(`${narrativeFolder}/steps`);
          fs.mkdirSync(`${narrativeFolder}/backgrounds`);
        }
        const stepName = `${content.narrative}-${parseInt(content.step_idx)}-${content.text_component}`
        var stepData = {
          narrative: narrativeId,
          path: `${narrativeFolder}/steps/${stepName}.json`,
          narrativeName: content.narrative,
          order: parseInt(content.step_idx),
          component: content.text_component,
          body_en: content.body_en,
          body_ru: content.body_ru,
          name: `${content.narrative}-${parseInt(content.step_idx)}-${content.text_component}`,
          uuid: uuid.v1(),
          chart_comment: content.comments,
          chart_description: content.comment,
        }
        // filter date for graph
        var filterDate = processStepComments(content.comments)
        if (filterDate) stepData.filterDate = filterDate

        contentData.steps.push(stepData)
        //saveStepData(stepData, narrativeFolder)

        // check if background is there 
        if (content.identifier.length > 0) {
          const backgroundData = {
            narrative: narrativeId,
            narrativeName: content.narrative,
            path: `${narrativeFolder}/backgrounds/${parseInt(content.bg_idx)}-${content.identifier}.json`,
            identifier: content.identifier,
            order: parseInt(content.bg_idx),
            component: content.graph_component,
            keywords: content.keywords,
            steps: content.steps,
            data: content.data,
            events: content.events,
            headlines: content.headlines,
            description: content.description,
            chart_title: content.chart_title,
            uuid: uuid.v1()
          }
          contentData.backgrounds.push(backgroundData)
          //saveBackgroundData(backgroundData, narrativeFolder)
        }
      })
      resolve(contentData)
    })
  })
}

const processStepComments = (str) => {
  console.log("str", str)
  if (str.length > 3 && str.includes('-')) {
    console.log("str.split('-')[0]", str.split('-')[0], str.split('-')[1])
    let startDate = utils.parseGermanDate(str.split('-')[0])
    let endDate = utils.parseGermanDate(str.split('-')[1])
    console.log(str, "startDate, endDate", startDate, endDate)
    if (startDate && endDate && utils.dateIsValid(startDate) && utils.dateIsValid(endDate)) {
      return {
        "startDate": startDate.toISOString(),
        "endDate": endDate.toISOString()
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

exports.getContent = getContent

/*

getContent().then((data) => {
  console.log("data", data)
})

background data

{
  "body_ru": "**Propaganda** narratives and myths about sanctions in Russian-language media.",
  "body_en": "**Propaganda** narratives and myths about sanctions in Russian-language media.",
  "identifier": "1-Step 1",
  "name": "Step 1",
  "order":; 1,
  "date": "2022-10-06T14:05:48.612Z",
  "narrative": 1,
  "uuid": "H9IcNQk_lXWq5DGjikhY4",
  "component": "TextCenter"
}

step data
{
  "narrative": 1,
  "stepstart": 1,
  "stepend": 1,
  "identifier": "[Start:1][End:1]-freezing_europe",
  "uuid": "DZwrzYnDtBDqw9oqBnGOt",
  "name": "freezing_europe",
  "component": "WordCloud"
}
*/
